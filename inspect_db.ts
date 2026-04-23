import mongoose from 'mongoose';
import Product from './models/product.js';
import OwnerInfo from './models/ownerInfo.js';
import Collection from './models/collection.js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

async function test() {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        
        // Let's find an existing OwnerInfo or Product to inspect
        const ownerInfo = await OwnerInfo.findOne();
        console.log("OwnerInfo:", JSON.stringify(ownerInfo, null, 2));
        
        if (ownerInfo && ownerInfo.homeCollections) {
            console.log("Type of first homeCollection:", typeof ownerInfo.homeCollections[0], ownerInfo.homeCollections[0]);
        }
        
        const product = await Product.findOne({ collections: { $exists: true, $not: {$size: 0} } });
        console.log("Product:", JSON.stringify(product, null, 2));
        
        if (product && product.collections) {
            console.log("Type of first collection in product:", typeof product.collections[0], product.collections[0]);
        }

    } catch(err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}
test();
