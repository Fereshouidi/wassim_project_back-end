import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import Collection from './models/collection.js';
import Product from './models/product.js';
import OwnerInfo from './models/ownerInfo.js';
import { deleteCollections } from './controller/collection.js';

const envContent = fs.readFileSync('./.env', 'utf-8');
const demoLinkMatch = envContent.match(/DATABASE_LINK_DEMO=(.*)/);
const dbUri = demoLinkMatch ? demoLinkMatch[1].trim() : '';

async function test() {
    console.log("Connecting to", dbUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
    await mongoose.connect(dbUri);
    
    // Create a mock collection
    const col = await Collection.create({ name: { en: 'Test Del', fr: 'Test Del' }, status: 'active', display: 'vertical' });
    const colId = col._id.toString();
    console.log("Created collection:", colId);
    
    // Add to owner info
    const owner = await OwnerInfo.findOne() || await OwnerInfo.create({});
    owner.homeCollections.push(col._id);
    await owner.save();
    
    // Add to product
    const prod = await Product.create({ name: { en: 'P Test', fr: 'P Test' }, collections: [col._id], price: 10, thumbNail: 'test' });
    
    console.log('Before delete:');
    const ownerBefore = await OwnerInfo.findOne();
    console.log('OwnerInfo homeCollections length:', ownerBefore?.homeCollections.length);
    console.log('Includes colId?', ownerBefore?.homeCollections.some(id => id.toString() === colId));
    
    const prodBefore = await Product.findById(prod._id);
    console.log('Product collections length:', prodBefore?.collections.length);
    
    // Delete
    await deleteCollections([colId]);
    
    console.log('After delete:');
    const ownerAfter = await OwnerInfo.findOne();
    console.log('OwnerInfo homeCollections length:', ownerAfter?.homeCollections.length);
    console.log('Includes colId?', ownerAfter?.homeCollections.some(id => id.toString() === colId));
    
    const prodAfter = await Product.findById(prod._id);
    console.log('Product collections length:', prodAfter?.collections.length);
    
    await Product.findByIdAndDelete(prod._id);
    await mongoose.disconnect();
}

test().catch(console.error);
