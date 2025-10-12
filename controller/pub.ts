import express from 'express';
import { PubType } from '../types/index.js';
import Pub from '../models/pub.js';

export const addPub = async (pub?: PubType) => {

    try {
        
        const newPub = await new Pub(pub);

        if (!newPub) {
            throw new Error("something went wrong white adding the new newOwnerInfo !")
        }
        
        await newPub.save();
        

        return newPub as PubType;
        
    } catch (err) {
        throw err;
    }

}

export const getPub = async () => {

    try {

        const pub = await Pub.findOne() as PubType;

        return pub;
        
    } catch (err) {
        throw err;
    }

}