import express from 'express';
import { CollectionType } from '../types/index.js';
import Collection from '../models/collection.js';
import { addCollection, getHomeCollections } from '../controller/collection.js';
import { getProductsByCollection } from '../controller/product.js';


export const addCollection_ = async (req: express.Request, res: express.Response) => {

    try {
        
        const { collectionData } = req.body;
        
        const newCollection = await addCollection(collectionData);

        res.status(201).json({
            message: "product has been added successfully",
            newCollection
        })

    } catch (err: any) {
        console.log({err});

        if (err.message.includes("Missing required fields")) {
            return res.status(400).json({ message: err.message });
        }

        res.status(500).json({message: err.message});
    }

}

export const getHomeCollectionsWithProducts_ = async (req: express.Request, res: express.Response) => {

    try {
        
        const homeCollections = await getHomeCollections();

        let homeCollectionsWithProducts = [];

        homeCollectionsWithProducts = await Promise.all(

            homeCollections.map(async (collection) => {

                const products = await getProductsByCollection(collection._id.toString(), 20, 0);
                return { ...collection.toObject(), products };

            })

        );

        res.status(201).json({
            homeCollectionsWithProducts
        })

    } catch (err: any) {
        console.log({err});

        if (err.message.includes("Missing required fields")) {
            return res.status(400).json({ message: err.message });
        }

        res.status(500).json({message: err.message});
    }

}

export const getHomeCollections_ = async (req: express.Request, res: express.Response) => {

    try {
        
        const homeCollections = await getHomeCollections();

        res.status(201).json({
            homeCollections
        })

    } catch (err: any) {
        console.log({err});

        if (err.message.includes("Missing required fields")) {
            return res.status(400).json({ message: err.message });
        }

        res.status(500).json({message: err.message});
    }

}

