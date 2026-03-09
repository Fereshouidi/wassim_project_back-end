import express from "express";
import { addLike, deleteLike, getLikeByClientAndProduct } from "../controller/like.js";


export const addLike_ = async (req: express.Request, res: express.Response) => {
    try {
        const { likeData } = req.body;

        const newLike = await addLike(likeData);

        res.status(201).json({
            message: "new like has been added successfuly!",
            like: newLike
        })

    } catch (err: any) {

        if (err.message.includes("Missing required fields")) {
            return res.status(400).json({ message: err.message });
        }

        res.status(500).json({ message: err.message });
    }

}

export const getLikeByClientAndProduct_ = async (req: express.Request, res: express.Response) => {
    try {
        const { clientId, productId } = req.query;

        const like = await getLikeByClientAndProduct(clientId as string, productId as string);

        res.status(201).json({
            like
        })

    } catch (err: any) {

        if (err.message.includes("Missing required fields")) {
            return res.status(400).json({ message: err.message });
        }

        res.status(500).json({ message: err.message });
    }

}

export const deleteLike_ = async (req: express.Request, res: express.Response) => {
    try {
        const { clientId, productId } = req.body;

        await deleteLike(clientId, productId);

        res.status(201).json({
            message: "like has been deleted successfuly!",
        })

    } catch (err: any) {

        if (err.message.includes("Missing required fields")) {
            return res.status(400).json({ message: err.message });
        }

        res.status(500).json({ message: err.message });
    }

}


