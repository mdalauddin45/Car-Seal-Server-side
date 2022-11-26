const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const stripe = require("stripe")(process.env.STRIPE_SECRET);
const app = express();
const port = process.env.PORT || 5000;

// // middlewares
// const corsConfig = {
//   origin: "",
//   credentials: true,
//   methods: ["GET", "POST", "PUT", "DELETE"],
// };
app.use(cors());
app.use(express.json());

//MongoDb Add
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.teba24n.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// Decode JWT
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    console.log(decoded);
    console.log(token);
    req.decoded = decoded;
    next();
  });
}

// // Send Email
// const sendMail = (emailData, email) => {
//   const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//       user: process.env.EMAIL,
//       pass: process.env.PASS,
//     },
//   });

//   const mailOptions = {
//     from: process.env.EMAIL,
//     to: email,
//     subject: emailData?.subject,
//     html: `<p>${emailData?.message}</p>`,
//   };

//   transporter.sendMail(mailOptions, function (error, info) {
//     if (error) {
//       console.log(error);
//     } else {
//       console.log("Email sent: " + info.response);
//     }
//   });
// };

async function run() {
  try {
    const categoryCollection = client.db("garibazar").collection("products");
    const usersCollection = client.db("garibazar").collection("users");
    const bookingsCollection = client.db("garibazar").collection("bookings");
    const paymentsCollection = client.db("garibazar").collection("payments");

    // Verify Admin
    const verifyAdmin = async (req, res, next) => {
      const decodedEmail = req.decoded.email;
      const query = { email: decodedEmail };
      const user = await usersCollection.findOne(query);

      if (user?.role !== "admin") {
        return res.status(403).send({ message: "forbidden access" });
      }
      console.log("Admin true");
      next();
    };

    // Save user email & generate JWT
    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;

      const filter = {
        email: email,
      };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );

      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1d",
      });
      console.log(result);
      res.send({ result, token });
    });

    // Get All User
    app.get("/users", verifyJWT, verifyAdmin, async (req, res) => {
      const query = {};
      const cursor = usersCollection.find(query);
      const users = await cursor.toArray();
      res.send(users);
    });

    // Get A Single User
    app.get("/user/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const decodedEmail = req.decoded.email;
      if (email !== decodedEmail) {
        return res.status(403).send({ message: "forbidden access" });
      }
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      res.send(user);
    });

    // get all products
    app.get("/products", async (req, res) => {
      const product = await categoryCollection.find({}).toArray();
      res.send(product);
    });

    // Get All product for seller
    app.get("/products/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const decodedEmail = req.decoded.email;

      if (email !== decodedEmail) {
        return res.status(403).send({ message: "forbidden access" });
      }
      const query = {
        "seller.email": email || email,
      };
      const cursor = categoryCollection.find(query);
      const products = await cursor.toArray();
      res.send(products);
    });

    // // get Single Category
    app.get("/products/:category", verifyAdmin, async (req, res) => {
      const category = req.params.category;
      const query = { category: category };
      const product = await categoryCollection.find(query).toArray();
      res.send(product);
    });

    // Get Single product
    // app.get("/product/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const query = { _id: ObjectId(id) };
    //   const product = await categoryCollection.findOne(query);
    //   res.send(product);
    // });
    // Delete a Product
    app.delete("/product/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await categoryCollection.deleteOne(query);
      res.send(result);
    });

    // Update A Home
    app.put("/products", verifyJWT, async (req, res) => {
      const product = req.body;
      console.log(product);

      const filter = {};
      const options = { upsert: true };
      const updateDoc = {
        $set: product,
      };
      const result = await categoryCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    // post a products
    app.post("/products", verifyJWT, async (req, res) => {
      const product = req.body;
      const result = await categoryCollection.insertOne(product);
      res.send(result);
    });
    // Get Bookings
    app.get("/bookings", verifyJWT, async (req, res) => {
      let query = {};
      const email = req.query.email;
      if (email) {
        query = {
          email: email,
        };
      }
      const cursor = bookingsCollection.find(query);
      const bookings = await cursor.toArray();
      res.send(bookings);
    });

    //get booking in a single id
    app.get("/bookings/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const booking = await bookingsCollection.findOne(query);
      res.send(booking);
    });

    // Save bookings
    app.post("/bookings", verifyJWT, async (req, res) => {
      const booking = req.body;
      console.log(booking);
      const result = await bookingsCollection.insertOne(booking);
      res.send(result);
    });

    // delet a booking
    app.delete("/bookings/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await bookingsCollection.deleteOne(query);
      res.send(result);
    });

    //payment
    app.post("/create-payment-intent", async (req, res) => {
      const booking = req.body;
      const price = booking.price;
      const amount = price * 100;

      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        currency: "usd",
        amount: amount,
        payment_method_types: ["card"],
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    //payment collection
    app.post("/payments", async (req, res) => {
      const payment = req.body;
      const result = await paymentsCollection.insertOne(payment);
      const id = payment.bookingId;
      const filter = { _id: ObjectId(id) };
      const updatedDoc = {
        $set: {
          paid: true,
          transactionId: payment.transactionId,
        },
      };
      const updatedResult = await bookingsCollection.updateOne(
        filter,
        updatedDoc
      );
      res.send(result);
    });
  } catch (error) {
    console.log(error);
  }
}

run().catch((err) => console.error(err));

app.get("/", (req, res) => {
  res.send("Assignment 12 server is running");
});

app.listen(port, () => {
  console.log(`Server is running...on ${port}`);
});
