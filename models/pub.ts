import mongoose from "mongoose";

const pubcollectionSchema = new mongoose.Schema(
  {
    topBar: {
        fr: {
            type: String,
            trim: true,
        },
        en: {
            type: String,
            trim: true,
        },
    },
    heroBanner: {
        sm: {
            type: String
        },
        md: {
            type: String
        }
    },
    bottomBanner: {
        sm: {
            type: String
        },
        md: {
            type: String
        }
    },
  },
  {
    timestamps: true,
  }
);

const Pub = mongoose.model("Pub", pubcollectionSchema);

export default Pub;
