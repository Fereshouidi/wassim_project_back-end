import mongoose from "mongoose";

const SpecificationSchema = new mongoose.Schema({
    colorHex: {
        type: String,
    },
    color: {
        type: String
    },
    size: {
        type: String
    },
    type: {
        type: String
    },
    price: {
        type: Number
    },
    quantity: {
        type: Number
    },
    unlimited: {
        type: Boolean,
        default: false
    }
})

const Specification = mongoose.model("Specification", SpecificationSchema);

export default Specification;
