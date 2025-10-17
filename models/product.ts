import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
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
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    thumbNail: {
      type: String,
      required: true,
    },
    images: {
      type: [String],
      default: [],
    },
    description: {
        fr: {
            type: String,
            required: true,
            default: "",
            trim: true,
        },
        en: {
            type: String,
            required: true,
            default: "",
            trim: true,
        },
    },
    collections: {
      type: [ mongoose.Schema.Types.ObjectId ],
      ref: "Collection",
      required: true,
    },
    stock: {
      type: Number,
      default: 0,
    },
    colorsDispo: {
      type: [ String ]
    },
    sizesDispo: {
      type: [ String ]
    }
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model("Product", productSchema);

export default Product;
