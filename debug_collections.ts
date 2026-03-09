import mongoose from 'mongoose';
import Product from './models/product.js';
import Collection from './models/collection.js';

const mongoUri = "mongodb+srv://feres997:feres997@cluster0.peiowiq.mongodb.net/silverway";

async function debug() {
    try {
        await mongoose.connect(mongoUri);
        console.log("Connected to MongoDB");

        const sampleProduct = await Product.findOne({ "collections.1": { $exists: true }, status: "active" });
        if (sampleProduct) {
            console.log("Found product with at least 2 collections:", sampleProduct._id);
            console.log("Collections:", sampleProduct.collections);

            const firstColId = sampleProduct.collections[0];
            const hasChildrenCheck = await Product.findOne({
                collections: firstColId,
                status: "active",
                "collections.1": { $exists: true }
            }).select("_id");

            console.log(`Query check for collection ${firstColId}:`, hasChildrenCheck ? "Found" : "Not Found");
        } else {
            console.log("No product found with at least 2 collections and active status.");
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debug();
