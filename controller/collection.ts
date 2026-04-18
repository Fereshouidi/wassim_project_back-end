import express from 'express';
import mongoose from 'mongoose';
import { CollectionStatus, CollectionType } from '../types/index.js';
import Collection from '../models/collection.js';
import OwnerInfo from '../models/ownerInfo.js';
import { getOwnerInfo } from './ownerInfo.js';
import Product from '../models/product.js';

export const addCollection = async (collectionData: CollectionType) => {

    try {

        if (!collectionData.name) {
            throw new Error(`"Missing required fields: name" !`)
        }

        const newCollection = await new Collection(collectionData)
        await newCollection.save();

        return newCollection;

    } catch (err) {
        throw err;
    }

}

export const getHomeCollections = async () => {

    try {

        const ownerInfo = await getOwnerInfo();

        const collections = await Collection.find({ _id: { $in: ownerInfo?.homeCollections } })

        const orderedCollections = ownerInfo.homeCollections.map(
            id => collections.find(col => col._id.toString() === id.toString())
        )

        return orderedCollections;

    } catch (err) {
        throw err;
    }

}

export const getTopCollections = async (status: CollectionStatus[] = ["active"]) => {

    try {

        const ownerInfo = await getOwnerInfo();

        const collections = await Collection.find({ _id: { $in: ownerInfo?.topCollections }, status: { $in: status } })

        const orderedCollections = ownerInfo.topCollections.map(
            id => collections.find(col => col._id.toString() === id.toString())
        )

        return orderedCollections;

    } catch (err) {
        throw err;
    }

}

export const getCollectionsInSideBar = async (status: CollectionStatus[] = ["active"]) => {
    try {
        const ownerInfo = await getOwnerInfo();

        const collectionsInSideBar = ownerInfo?.collectionsInSideBar || [];

        const collections = await Collection.find({
            _id: { $in: collectionsInSideBar },
            status: { $in: status },
            type: "public"
        }).lean();

        // Check if each collection has products that belong to OTHER collections (virtual children)
        const enrichedCollections = await Promise.all(collections.map(async (col) => {
            if (!col?._id) return { ...col, hasChildren: false };

            const hasVirtualChildren = await Product.findOne({
                collections: col._id,
                status: "active",
                "collections.1": { $exists: true }
            }).select("_id").lean();

            return {
                ...col,
                hasChildren: !!hasVirtualChildren
            };
        }));

        return enrichedCollections;
    } catch (err) {
        throw err;
    }
}

export const getPublicCollections = async (status: CollectionStatus[] = ["active"]) => {

    try {

        const collections = await Collection.find({ type: "public", status: { $in: status } });

        return collections;

    } catch (err) {
        throw err;
    }

}

export const getAllCollections = async (status: CollectionStatus[] = ["active"]) => {

    try {

        const collections = await Collection.find({ status: { $in: status } });

        return collections;

    } catch (err) {
        throw err;
    }

}

export const getCollectionsByProduct = async (productId: string, status: CollectionStatus[] = ["active"]) => {

    try {

        const product = await Product.findOne({ _id: productId, status: { $in: status } });

        const collections = await Collection.find({ _id: { $in: product?.collections } })

        return collections;

    } catch (err) {
        throw err;
    }

}

export const getCollectionById = async (collectionId: string, status: CollectionStatus[] = ["active"]) => {

    try {

        const collection = await Collection.findOne({ _id: collectionId, status: { $in: status } });

        return collection;

    } catch (err) {
        throw err;
    }

}

export const updateCollection = async (updateedData: CollectionType) => {

    try {

        const updatedCollection = await Collection.findOneAndUpdate(
            { _id: updateedData._id },
            updateedData,
            { new: true }
        )

        return updatedCollection

    } catch (err) {
        throw err;
    }

}

export const deleteCollections = async (collectionIds: string[], status: CollectionStatus = "deleted") => {
    try {
        // Check if the IDs list is valid
        if (!collectionIds || collectionIds.length === 0) {
            throw new Error("Collection IDs list is required and cannot be empty");
        }

        // Update the status for all matching collections
        const result = await Collection.updateMany(
            { _id: { $in: collectionIds } },
            { $set: { status: status } }
        );

        return result;
    } catch (err: any) {
        throw err;
    }
};

export const getSubCollections = async (parentCollectionId: string, status: CollectionStatus[] = ["active"], excludeIds: string[] = []) => {
    try {
        // 1. Find all active products that belong to the parent collection
        const products = await Product.find({
            collections: parentCollectionId,
            status: "active"
        }).select("collections").lean();

        // 2. Aggregate all other collections these products belong to
        const parentIdStr = parentCollectionId.toString();
        // Combine current parent and any provided excluded IDs
        const allExcluded = new Set([parentIdStr, ...excludeIds]);

        const collectionIds = products.flatMap(p => (p.collections || []).map(c => c.toString()));
        const counts = collectionIds.reduce((acc, id) => {
            if (!allExcluded.has(id)) {
                acc[id] = (acc[id] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);

        // 3. Sort by frequency
        const sortedIds = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);

        // 4. Fetch the real collection documents and check if they have children too
        const subCollections = await Collection.find({
            _id: { $in: sortedIds },
            status: { $in: status },
            type: "public"
        }).lean();

        // 5. Enrich with hasChildren flag
        const enriched = await Promise.all(subCollections.map(async (col) => {
            const hasMoreChildren = await Product.findOne({
                $and: [
                    { collections: col._id },
                    { collections: { $elemMatch: { $nin: Array.from(allExcluded).map(id => new mongoose.Types.ObjectId(id)) } } }
                ],
                status: "active",
            }).select("_id").lean();

            return {
                ...col,
                hasChildren: !!hasMoreChildren
            };
        }));

        // 6. Return ordered by frequency
        return sortedIds.map(id => enriched.find(c => c._id.toString() === id)).filter((c): c is any => !!c);
    } catch (err) {
        throw err;
    }
}

export const getCollectionsByCustomizableType = async (type: "base" | "pendant") => {
    try {
        const collections = await Collection.find({ customizable: type, status: "active" }).lean();
        const collectionIds = collections.map(c => c._id);

        const products = await Product.find({
            collections: { $in: collectionIds },
            status: "active"
        }).populate('specifications').lean();

        // Group products by collection
        const enriched = collections.map(col => ({
            ...col,
            products: products.filter(p => p.collections.some(cid => cid.toString() === col._id.toString()))
        }));

        return enriched;
    } catch (err) {
        throw err;
    }
}

export const createDefaultCustomizerCollections = async () => {
    try {
        const basesExist = await Collection.findOne({ customizable: 'base' });
        if (!basesExist) {
            const basesCol = new Collection({
                name: { fr: 'Bases', en: 'Bases' },
                customizable: 'base',
                type: 'public',
                status: 'active',
                display: 'horizontal'
            });
            await basesCol.save();
            console.log("[Collection Init] Created 'Bases' collection.");
        }

        const charmsExist = await Collection.findOne({ customizable: 'pendant' });
        if (!charmsExist) {
            const charmsCol = new Collection({
                name: { fr: 'Charms', en: 'Charms' },
                customizable: 'pendant',
                type: 'public',
                status: 'active',
                display: 'horizontal'
            });
            await charmsCol.save();
            console.log("[Collection Init] Created 'Charms' collection.");
        }
    } catch (err) {
        console.error("[Collection Init] Error creating default collections:", err);
    }
}
