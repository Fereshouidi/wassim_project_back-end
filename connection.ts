import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb+srv://Wassum:wassim99@cluster0.codzprd.mongodb.net/wassimProject");
    console.log("Database connected successfully");
  } catch (err) {
    console.error("Error connecting to database! :", err);
  }
};

export default connectDB;
