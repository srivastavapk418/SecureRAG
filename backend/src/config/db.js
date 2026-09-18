const mongoose = require("mongoose");
const config = require("./index");

async function connectToDatabase() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(config.mongoUri);
  console.log("MongoDB connected");
}

module.exports = connectToDatabase;

