import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Client",
        required: true
    },
    orderNumber: {
        type: Number,
        default: 0,
        unique: true,
        required: true
    },
    address: {
        type: String
    },
    clientNote: {
        type: String
    },
    status: {
        type: String,
        enum: ["pending", "delivered", "failed"],
        default: "pending"
    },
    shippingCoast: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
  }
);

orderSchema.virtual("purchases", {
  ref: "Purchase",
  localField: "_id",
  foreignField: "order",
});

orderSchema.set("toJSON", { virtuals: true });
orderSchema.set("toObject", { virtuals: true });


const Order = mongoose.model("Order", orderSchema);

export default Order;
