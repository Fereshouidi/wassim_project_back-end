import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    fullName: {
        type: String,
    },
    email: {
        type: String,
        default: null
    },
    token: {
        type: String,
        required: true,
        unique: true
    },
    devices: {
        type: [String]
    },
    phone: {
        type: Number,
        default: null
    },
    password: {
        type: String,
    },
    aiNote: {
        type: String,
        default: null
    },
    accesses: {
        type: [String]
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    type: {
        type: String,
        enum: ["bigBoss", "normalAdmin"],
        default: "normalAdmin"
    }
  },
  {
    timestamps: true,
  }
);

const Admin = mongoose.model("Admin", adminSchema);

export default Admin;
