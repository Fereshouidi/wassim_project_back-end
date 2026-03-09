import mongoose from "mongoose";

const deliveryWorkerSchema = new mongoose.Schema(
  {
    fullName: {
        type: String,
        unique: true
    },
    email: {
        type: String,
        unique: true,
        default: null
    },
    token: {
        type: Number,
        required: true
    },
    phone: {
        type: Number,
        unique: true,
        default: null
    },
    password: {
        type: String,
    },
    address: {
        type: String,
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

const DeliveryWorker = mongoose.model("DeliveryWorker", deliveryWorkerSchema);

export default DeliveryWorker;
