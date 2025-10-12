import express from 'express';
import { OwnerInfoType } from '../types/index.js';
import OwnerInfo from '../models/ownerInfo.js';
import Collection from '../models/collection.js';

export const addOwnerInfo = async (ownerInfo: OwnerInfoType) => {

    try {
        
        if (!ownerInfo) {
            throw new Error("Missing required fields: ownerInfo !")
        }

        const newOwnerInfo = await new OwnerInfo(ownerInfo);

        if (!newOwnerInfo) {
            throw new Error("something went wrong white adding the new newOwnerInfo !")
        }
        
        await newOwnerInfo.save();
        

        return newOwnerInfo;
        
    } catch (err) {
        throw err;
    }

}

export const getOwnerInfo = async () => {

    try {

        let ownerInfo = await OwnerInfo.findOne();

        if (!ownerInfo) {
            ownerInfo = await addOwnerInfo({});
        }
        
        return ownerInfo;
        
    } catch (err) {
        throw err;
    }

}

// export const getHomeCollections = async () => {

//     try {

//         const collections = await Collection.find({ collections: { $in: [collectionId] } });

//         return products;
        
//     } catch (err) {
//         throw err;
//     }

// }