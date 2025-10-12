import express from 'express';
import { addOwnerInfo } from '../controller/ownerInfo.js';


export const addOwnerInfo_ = async (req: express.Request, res: express.Response) => {

    try {
        
        const { ownerInfo } = req.body;
        
        const newOwnerInfo = await addOwnerInfo(ownerInfo);

        res.status(201).json({
            message: "newOwnerInfo has been added successfully",
            newOwnerInfo
        })

    } catch (err: any) {
        console.log({err});

        if (err.message.includes("Missing required fields")) {
            return res.status(400).json({ message: err.message });
        }

        res.status(500).json({message: err.message});
    }

}