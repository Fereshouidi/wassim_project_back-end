import express from 'express';
import { ProductType } from '../types/index.js';
import Product from '../models/product.js';
import { addProduct, getProductsByCollection, getProductsBySearch, getProductsCount, getProductsCountByCollection } from '../controller/product.js';


export const addProduct_ = async (req: express.Request, res: express.Response) => {

    try {
        
        const { productData } = req.body;
        
        const newProduct = await addProduct(productData);

        res.status(201).json({
            message: "product has been added successfully",
            newProduct
        })

    } catch (err: any) {
        console.log({err});

        if (err.message.includes("Missing required fields")) {
            return res.status(400).json({ message: err.message });
        }

        res.status(500).json({message: err.message});
    }

}

export const getProductsByCollection_ = async (req: express.Request, res: express.Response) => {

    try {
        
        const { collectionId, limit, skip } = req.query;
        
        const products = await getProductsByCollection(
            collectionId as string, 
            Number(limit), 
            Number(skip)
        );

        const productsCount = await getProductsCountByCollection(collectionId as string);

        res.status(201).json({
            // message: "product has been added successfully",
            products,
            productsCount
        })

    } catch (err: any) {
        console.log({err});

        if (err.message.includes("Missing required fields")) {
            return res.status(400).json({ message: err.message });
        }

        res.status(500).json({message: err.message});
    }

}

export const getProductsBySearch_ = async (req: express.Request, res: express.Response) => {

    try {
        
        const { searchText, limit, skip } = req.query;

        console.log({ searchText, limit, skip });
        
        const { products, productsCount } = await getProductsBySearch(
            searchText as string, 
            Number(limit), 
            Number(skip)
        );

        res.status(201).json({
            // message: "product has been added successfully",
            products,
            productsCount
        })

    } catch (err: any) {
        console.log({err});

        if (err.message.includes("Missing required fields")) {
            return res.status(400).json({ message: err.message });
        }

        res.status(500).json({message: err.message});
    }

}
