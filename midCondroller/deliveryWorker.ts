import express from 'express';
import { addDeliveryWorker, getFirstDeliveryWorker } from '../controller/deliveryWorker.js';
import { DeliveryWorkerType, OwnerInfoType } from '../types/index.js';
import { getOwnerInfo } from '../controller/ownerInfo.js';

export const addDeliveryWorker_ = async (req: express.Request, res: express.Response) => {

    try {

        const { deliveryWorkerData } = req.body;

        const token = Math.floor(100000 + Math.random() * 900000);

        const deliveryWorkerData_ = { ...deliveryWorkerData, token }

        const newDeliveryWorker = await addDeliveryWorker(deliveryWorkerData_);

        res.status(201).json({
            newDeliveryWorker
        })

    } catch (err: any) {

        if (err.message.includes("Missing required fields")) {
            return res.status(400).json({ message: err.message });
        }

        res.status(500).json({ message: err.message });
    }
}

export const getDeliveryWorker_ = async (req: express.Request, res: express.Response) => {
    try {

        let deliveryWorker = await getFirstDeliveryWorker();

        if (!deliveryWorker) {

            const owner = await getOwnerInfo() as unknown as OwnerInfoType;

            const token = Math.floor(100000 + Math.random() * 900000);

            const newDeliveryWorker = {
                fullName: "delivery worker",
                phone: owner.contact?.phone,
                email: owner.contact?.email,
                token
            } as DeliveryWorkerType

            deliveryWorker = await addDeliveryWorker(newDeliveryWorker)
        }

        res.status(200).json({
            deliveryWorker
        })

    } catch (err: any) {

        if (err.message.includes("Missing required fields")) {
            return res.status(400).json({ message: err.message });
        }

        res.status(500).json({ message: err.message });
    }
}
