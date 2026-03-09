import DeliveryWorker from "../models/deliveryWorker.js";
import { DeliveryWorkerType } from "../types/index.js";

export const addDeliveryWorker = async (deliveryWorkerData: DeliveryWorkerType) => {

    try {

        let newDeliveryWorker = new DeliveryWorker(deliveryWorkerData);
        await newDeliveryWorker.save();

        return newDeliveryWorker;
    } catch (err) {
        throw err;
    }

}

export const getFirstDeliveryWorker = async () => {

    try {
        const deliveryWorker = await DeliveryWorker.findOne();
        return deliveryWorker;
    } catch (err) {
        throw err;
    }

}

export const updateFirstDeliveryWorker = async (updateData: DeliveryWorkerType) => {
    try {
        const deliveryWorker = await DeliveryWorker.findOneAndUpdate(
            {},
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!deliveryWorker) {
            const newWorker = new DeliveryWorker(updateData);
            await newWorker.save();
            return newWorker;
        }

        return deliveryWorker;

    } catch (err) {
        throw err;
    }
}