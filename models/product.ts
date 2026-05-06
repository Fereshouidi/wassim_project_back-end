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
    oldPrice: {
      type: Number,
      required: false,
      min: 0,
    },
    thumbNail: {
      type: String,
      required: true,
    },
    images: {
      type: [{
        uri: String,
        specification: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Specification"
        }
      }],
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
    status: {
      type: String,
      enum: ["active", "deleted", "archived"],
      default: "active",
    },
    inFavorite: {
      type: [ mongoose.Schema.Types.ObjectId ],
      ref: "Client",
      default: []
    },
    specifications: {
      type: [ mongoose.Schema.Types.ObjectId ],
      ref: "Specification",
      default: [],
    },
    mainImageSource: {
      type: String,
      enum: ["thumbnail", "firstSpecification"],
      default: "thumbnail",
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model("Product", productSchema);

export default Product;
