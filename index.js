const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

// middlewares
app.use(cors());
app.use(express.json());

//MongoDb Add
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.teba24n.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    const categoryCollection = client.db("garibazar").collection("products");
    const bookingsCollection = client.db("garibazar").collection("bookings");

    // categoris get
    app.get("/products", async (req, res) => {
      const product = await categoryCollection.find({}).toArray();
      res.send(product);
    });
    // categoris get
    app.get("/categoris", async (req, res) => {
      const product = await categoryCollection.find({}).toArray();
      res.send(product);
    });
    // category single product get
    app.get("/categoris/:category", async (req, res) => {
      const category = req.params.category;
      const query = { category: category };
      const product = await categoryCollection.find(query).toArray();
      res.send(product);
    });
  } catch (error) {
    console.log(error);
  }
}

run().catch((err) => console.error(err));

app.get("/", (req, res) => {
  res.send("Assignment server is running");
});

app.listen(port, () => {
  console.log(`Server is running...on ${port}`);
});
