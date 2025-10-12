import express from 'express';
import { addOwnerInfo } from '../controller/ownerInfo.js';
import { addPub, getPub } from '../controller/pub.js';
import { PubType } from '../types/index.js';


export const addPub_ = async (req: express.Request, res: express.Response) => {

    try {
        
        const { pub } = req.body;
        
        const newPub = await addPub(pub);

        res.status(201).json({
            message: "pub has been added successfully",
            newPub
        })

    } catch (err: any) {
        console.log({err});

        if (err.message.includes("Missing required fields")) {
            return res.status(400).json({ message: err.message });
        }

        res.status(500).json({message: err.message});
    }

}

export const getPub_ = async (req: express.Request, res: express.Response) => {

    try {
        
        let pub = await getPub();

        if (!pub) {
            pub = await addPub();
        }

        res.status(201).json({
            // message: "product has been added successfully",
            pub
        })

    } catch (err: any) {
        console.log({err});

        if (err.message.includes("Missing required fields")) {
            return res.status(400).json({ message: err.message });
        }

        res.status(500).json({message: err.message});
    }

}