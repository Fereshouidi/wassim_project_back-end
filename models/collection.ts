import mongoose from "mongoose";

const collectionSchema = new mongoose.Schema(
  {
    name: {
        fr: {
            type: String,
            required: true,
            trim: true,
            unique: true
        },
        en: {
            type: String,
            required: true,
            trim: true,
            unique: true
        },
    },
    thumbNail: {
      type: String
    },
    type: {
        type: String,
        enum: ["private", "public"],
        default: "private"
    },
    status: {
      type: String,
      enum: ["active", "deleted", "archived"],
      default: "active",
    },
    display: {
        type: String,
        enum: ["vertical", "horizontal"]
    },
    customizable: {
        type: String,
        enum: ["none", "base", "pendant"],
        default: "none"
    },
    special: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
  }
);

const Collection = mongoose.model("Collection", collectionSchema);

export default Collection;
