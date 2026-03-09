import mongoose from "mongoose";

const likeSchema = new mongoose.Schema(
  {
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Client",
        require: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        require: true
    }
  },
  {
    timestamps: true,
  }
);

const Like = mongoose.model("Like", likeSchema);

export default Like;
