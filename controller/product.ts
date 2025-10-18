import express from 'express';
import { ProductType } from '../types/index.js';
import Product from '../models/product.js';
import { ObjectId } from 'mongoose';

export const addProduct = async (productData: ProductType) => {

    try {
        
        if (!productData.price || !productData.name || !productData.thumbNail || !productData.stock) {
            throw new Error("Missing required fields: name, price, thumbNail, stock !")
        }

        const newProduct = await new Product(productData);

        if (!newProduct) {
            throw new Error("something went wrong white adding the new product !")
        }
        
        await newProduct.save();
        

        return newProduct;
        
    } catch (err) {
        throw err;
    }

}

export const getProductsByCollection = async (
    collectionId: string | ObjectId, 
    limit: number, 
    skip: number
) => {

    try {
        
        if (!collectionId) {
            throw new Error("Missing required fields: collectionId is required !")
        }

        const products = await Product.find({ collections: { $in: [collectionId] } })
            .skip(skip)
            .limit(limit)

        return products;
        
    } catch (err) {
        throw err;
    }

}

export const getProductsCount = async (collectionId?: string) => {

    try {

        const filter = collectionId ? { collections: collectionId } : {};
        const count = await Product.countDocuments(filter);
        return count;

    } catch (err) {
        console.error("Error getting product count:", err);
        throw err;
    }
};

export const getProductsCountByCollection = async (collectionId: string) => {

  try {

    if (!collectionId) {
      throw new Error("collectionId is required");
    }

    const count = await Product.countDocuments({ collections: collectionId });
    return count;
    
  } catch (err) {
    console.error("Error getting product count by collection:", err);
    throw err;
  }
};

export const getProductsBySearch = async (
    searchText: string, 
    limit: number, 
    skip: number
) => {
    
    try {
        const text = searchText.trim();

        const searchQuery = text
            ? {
                  $or: [
                      { "name.fr": { $regex: text, $options: "i" } },
                      { "name.en": { $regex: text, $options: "i" } },
                      { "description.fr": { $regex: text, $options: "i" } },
                      { "description.en": { $regex: text, $options: "i" } },
                  ],
              }
            : {};

        const products = await Product.find(searchQuery)
            .limit(limit)
            .skip(skip);

        const productsCount = await Product.countDocuments(searchQuery);

        return {
            products,
            productsCount
        };

    } catch (err) {
        throw err;
    }
};
