import express from 'express';
import { CollectionType, ProductType } from '../types/index.js';
import Collection from '../models/collection.js';
import { addCollection, deleteCollections, getAllCollections, getCollectionById, getCollectionsByCustomizableType, getCollectionsByProduct, getCollectionsInSideBar, getHomeCollections, getPublicCollections, getSubCollections, getTopCollections, updateCollection } from '../controller/collection.js';
import { getProductsByCollection, getProductsCount } from '../controller/product.js';
import { handleCollectionThumbNailUpload } from '../lib/multer.js';
import { translate } from 'google-translate-api-x';
import Product from '../models/product.js';


export const addCollection_ = async (req: express.Request, res: express.Response) => {

    try {
        // 1. Receive selected products (coming as JSON string from FormData)
        const productsArray = req.body.products ? JSON.parse(req.body.products) : [];

        // 2. Translate Name
        const translateRes = await translate(req.body.nameFr, { from: 'fr', to: 'en' });
        const nameEn = Array.isArray(translateRes) ? translateRes[0].text : translateRes.text;

        // 3. Handle image upload
        const { thumbnail } = await handleCollectionThumbNailUpload(req);

        // 4. Prepare collection data
        const collectionData = {
            name: {
                en: nameEn as string,
                fr: req.body.nameFr,
            },
            type: req.body.type,
            display: req.body.display,
            customizable: req.body.customizable || "none",
            thumbNail: thumbnail || ""
        } as CollectionType;

        // 5. Save collection in database to get its _id
        const newCollectionCreated = await addCollection(collectionData);

        // 6. Link selected products to this new collection
        if (productsArray.length > 0 && newCollectionCreated?._id) {
            await Product.updateMany(
                { _id: { $in: productsArray } },
                { $addToSet: { collections: newCollectionCreated._id } }
            );
        }

        res.status(201).json({
            message: "Collection has been added successfully ✅",
            newCollection: newCollectionCreated
        });

    } catch (err: any) {
        if (err.message && err.message.includes("Missing required fields")) {
            return res.status(400).json({ message: err.message });
        }

        res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
}

export const getHomeCollectionsWithProducts_ = async (req: express.Request, res: express.Response) => {

    try {

        const homeCollections = await getHomeCollections();

        let homeCollectionsWithProducts = [];

        homeCollectionsWithProducts = await Promise.all(

            homeCollections.map(async (collection) => {

                if (!collection) return;

                const products = await getProductsByCollection(collection._id.toString(), 20, 0);
                return { ...collection?.toObject(), products };

            })

        );

        res.status(201).json({
            homeCollectionsWithProducts
        })

    } catch (err: any) {

        if (err.message.includes("Missing required fields")) {
            return res.status(400).json({ message: err.message });
        }

        res.status(500).json({ message: err.message });
    }

}

export const getHomeCollections_ = async (req: express.Request, res: express.Response) => {

    try {

        const homeCollections = await getHomeCollections();

        res.status(201).json({
            homeCollections
        })

    } catch (err: any) {

        if (err.message.includes("Missing required fields")) {
            return res.status(400).json({ message: err.message });
        }

        res.status(500).json({ message: err.message });
    }

}

export const getTopCollections_ = async (req: express.Request, res: express.Response) => {

    try {

        const topCollections = await getTopCollections();

        res.status(201).json({
            topCollections
        })

    } catch (err: any) {

        if (err.message.includes("Missing required fields")) {
            return res.status(400).json({ message: err.message });
        }

        res.status(500).json({ message: err.message });
    }

}

export const getCollectionsInSideBar_ = async (req: express.Request, res: express.Response) => {

    try {

        const collections = await getCollectionsInSideBar();


        res.status(200).json({
            collections
        })

    } catch (err: any) {

        if (err.message.includes("Missing required fields")) {
            return res.status(400).json({ message: err.message });
        }

        res.status(500).json({ message: err.message });
    }

}

export const getPublicCollections_ = async (req: express.Request, res: express.Response) => {

    try {

        const publicCollections = await getPublicCollections();

        res.status(201).json({
            publicCollections
        })

    } catch (err: any) {

        if (err.message.includes("Missing required fields")) {
            return res.status(400).json({ message: err.message });
        }

        res.status(500).json({ message: err.message });
    }

}

export const getAllCollections_ = async (req: express.Request, res: express.Response) => {

    try {

        const allCollections = await getAllCollections();

        res.status(201).json({
            allCollections
        })

    } catch (err: any) {

        if (err.message.includes("Missing required fields")) {
            return res.status(400).json({ message: err.message });
        }

        res.status(500).json({ message: err.message });
    }

}

export const getCollectionsByProduct_ = async (req: express.Request, res: express.Response) => {

    try {

        const { productId } = req.query;

        const collections = await getCollectionsByProduct(productId as string);

        res.status(201).json({
            collections
        })

    } catch (err: any) {

        if (err.message.includes("Missing required fields")) {
            return res.status(400).json({ message: err.message });
        }

        res.status(500).json({ message: err.message });
    }

}

export const getCollectionById_ = async (req: express.Request, res: express.Response) => {

    try {
        const { collectionId } = req.query;

        if (!collectionId) {
            return res.status(400).json({ message: "Collection ID is required" });
        }

        const collection = await getCollectionById(collectionId as string);

        if (!collection) {
            return res.status(404).json({ message: "collection not found !" });
        }

        const allAssociatedProducts = await Product.find({
            collections: { $in: [collectionId] }
        }).select("_id thumbNail name price");

        res.status(200).json({
            collection: {
                ...(collection.toObject ? collection.toObject() : collection),
                products: allAssociatedProducts.map(p => p._id.toString())
            },
            previewProducts: allAssociatedProducts
        });

    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
}

export const updateCollection_ = async (req: express.Request, res: express.Response) => {
    try {
        const collectionId = req.body._id;
        const productsArray = req.body.products ? JSON.parse(req.body.products) : [];

        let updatedData = {
            _id: collectionId,
            name: {
                en: req.body.nameFr,
                fr: req.body.nameFr,
            },
            type: req.body.type,
            display: req.body.display,
            customizable: req.body.customizable || "none",
        } as unknown as CollectionType;

        // 1. Handle Translation
        const translateRes = await translate(req.body.nameFr, { from: 'fr', to: 'en' });
        const nameEn = Array.isArray(translateRes) ? translateRes[0].text : translateRes.text;
        updatedData.name.en = nameEn as string;

        // 2. Handle Image
        const { thumbnail } = await handleCollectionThumbNailUpload(req);
        if (thumbnail) {
            updatedData.thumbNail = thumbnail;
        }

        // 3. Update collection data itself
        const updatedResult = await updateCollection(updatedData as unknown as CollectionType);

        // --- Reverse Linking Logic (Product <-> Collection) ---

        // a. Remove collection ID from all products previously belonging to it
        await Product.updateMany(
            { collections: { $in: [collectionId] } },
            { $pull: { collections: collectionId } }
        );

        // b. Add collection ID to currently selected products (in productsArray)
        if (productsArray.length > 0) {
            await Product.updateMany(
                { _id: { $in: productsArray } },
                { $addToSet: { collections: collectionId } } // $addToSet prevents duplicates
            );
        }

        res.status(200).json({
            updatedCollection: updatedResult,
        });

    } catch (err: any) {
        res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
}

export const deleteCollections_ = async (req: express.Request, res: express.Response) => {
    try {
        const { ids, status } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                message: "A non-empty list of Collection IDs is required."
            });
        }

        // Calling the utility function we created earlier
        const result = await deleteCollections(ids, status);

        return res.status(200).json({
            message: `Successfully updated ${result.modifiedCount} collections status. ✅`,
            details: result
        });
    } catch (err: any) {
        return res.status(500).json({
            message: "Failed to update collections status",
            error: err.message
        });
    }
};

export const getSubCollections_ = async (req: express.Request, res: express.Response) => {
    try {
        const { parentId } = req.query;
        // Handle various ways arrays can be sent in query strings
        const rawExclude = req.query.excludeIds || req.query['excludeIds[]'];

        if (!parentId) {
            return res.status(400).json({ message: "parentId is required" });
        }

        const excludes: string[] = [];
        if (Array.isArray(rawExclude)) {
            excludes.push(...(rawExclude as string[]));
        } else if (typeof rawExclude === 'string') {
            excludes.push(rawExclude);
        }

        const collections = await getSubCollections(parentId as string, ["active"], excludes);
        res.status(200).json({ collections });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
}

export const getCollectionsByCustomizableType_ = async (req: express.Request, res: express.Response) => {
    try {
        const { type } = req.query;
        if (type !== "base" && type !== "pendant") {
            return res.status(400).json({ message: "Invalid type. Must be 'base' or 'pendant'" });
        }
        const collections = await getCollectionsByCustomizableType(type);
        res.status(200).json({ collections });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
}