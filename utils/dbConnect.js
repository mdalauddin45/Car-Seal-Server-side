function dbConnect() {
    // var db = new sqlite3.Database('db.sqlite');
    // db.serialize(function () {
    //     db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, password TEXT)");
    // });
    // return db;
    console.log("dbConnect");
}

module.exports = dbConnect;