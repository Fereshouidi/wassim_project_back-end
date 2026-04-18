import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema(
  {
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Client",
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
    },
    evaluation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Evaluation",
        default: null
    },
    specification: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Specification",
        publicKey: String,
        default: null
    },
    productId: {
        type: String,
        default: null
    },
    productName: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    productThumb: {
        type: String,
        default: null
    },
    specPrice: {
        type: Number,
        default: 0
    },
    specColor: {
        type: String,
        default: null
    },
    specSize: {
        type: String,
        default: null
    },
    quantity: {
        type: Number,
        default: 1
    },
    cart: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ShoppingCart",
        default: null
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        default: null
    },
    status: {
        type: String ,
        enum: [ "viewed", "inCart", "ordered", 'delivered' ],
        default: "viewed"
    },
    isCustomized: {
        type: Boolean,
        default: false
    },
    customizedCharms: {
        type: [{
            charm: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
            charmId: String,
            spec: { type: mongoose.Schema.Types.ObjectId, ref: "Specification" },
            x: Number,
            y: Number
        }],
        default: []
    }
  },
  {
    timestamps: true,
  }
);

const Purchase = mongoose.model("Purchase", purchaseSchema);

export default Purchase;
