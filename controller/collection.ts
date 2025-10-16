import express from 'express';
import { CollectionType } from '../types/index.js';
import Collection from '../models/collection.js';
import OwnerInfo from '../models/ownerInfo.js';
import { getOwnerInfo } from './ownerInfo.js';

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
        console.log("bech : " + err)
        throw err;
    }

}

export const getPublicCollections = async () => {

    try {

        const collections = await Collection.find({type: "public"});

        return collections;
        
    } catch (err) {
        console.log("bech : " + err)
        throw err;
    }

}