import mongoose from "mongoose";

const evaluationSchema = new mongoose.Schema(
  {
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Client",
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    number: {
        type: Number
    },
    note: {
        type: String
    }
    
  },
  {
    timestamps: true,
  }
);

const Evaluation = mongoose.model("Evaluation", evaluationSchema);

export default Evaluation;
