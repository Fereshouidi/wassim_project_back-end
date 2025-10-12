import mongoose from "mongoose";

const collectionSchema = new mongoose.Schema(
  {
    name: {
        fr: {
            type: String,
            required: true,
            trim: true,
        },
        en: {
            type: String,
            required: true,
            trim: true,
        },
    },
    type: {
        type: String,
        enum: ["private", "public"],
        default: "private"
    }
  },
  {
    timestamps: true,
  }
);

const Collection = mongoose.model("Collection", collectionSchema);

export default Collection;
