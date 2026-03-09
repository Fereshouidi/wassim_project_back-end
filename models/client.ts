import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
  {
    fullName: {
        type: String,
        // unique: true
    },
    deviceId: {
        type: String,
        default: ""
    },
    email: {
        type: String,
        default: null
    },
    token: {
        type: String,
    },
    phone: {
        type: Number,
        default: null
    },
    password: {
        type: String,
    },
    address: {
        type: String,
        default: null
    },
    dateOfBirth: {
        type: Date,
        default: null
    },
    aiNote: {
        type: String,
        default: null
    },
    isVerified: {
        type: Boolean,
        default: false
    }
  },
  {
    timestamps: true,
  }
);

const Client = mongoose.model("Client", clientSchema);

export default Client;
