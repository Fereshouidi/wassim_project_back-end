import express from 'express';
import { getCartByClient } from '../controller/cart.js';

export const getCartByClient_ = async (req: express.Request, res: express.Response) => {

    try {

        const { clientId } = req.query;

        const cart = await getCartByClient(clientId as string);

        res.status(200).json({
            cart
        })

    } catch (err: any) {

        if (err.message.includes("Missing required fields")) {
            return res.status(400).json({ message: err.message });
        }

        res.status(500).json({ message: err.message });
    }

}