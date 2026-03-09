import mongoose from "mongoose";
import { databaseLink } from "./constent/index.js";

export const connectToDatabase = async () => {
  try {

    await mongoose.connect(databaseLink);
    console.log("database connected successfully");
    

  } catch (err) {
    throw err;
  }
}
export default connectToDatabase;
