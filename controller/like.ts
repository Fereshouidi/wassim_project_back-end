import Like from "../models/like.js";
import { LikeType } from "../types/index.js";
import { createNotification } from "./notification.js";


export const addLike = async (LikeData: LikeType) => {
    try {
        const newLike = new Like(LikeData);
        await newLike.save();

        const populatedLike = await Like.findById(newLike._id)
            .populate('client')
            .populate('product')
            .lean();

        const clientName = (populatedLike as any)?.client?.fullName || "A client";
        const productName = (populatedLike as any)?.product?.name?.en || (populatedLike as any)?.product?.name?.fr || "a product";

        await createNotification(
            "Product Liked",
            `${clientName} liked ${productName}.`,
            "like",
            (populatedLike as any)?.client?._id?.toString() || (populatedLike as any)?.client?.toString(),
            (populatedLike as any)?.client?._id?.toString() || (populatedLike as any)?.client?.toString(),
            (populatedLike as any)?.product?._id?.toString() || (populatedLike as any)?.product?.toString()
        );

        return newLike;
    } catch (err) {
        throw err;
    }

}

export const getLikeByClientAndProduct = async (clientId: string, productId: string) => {
    try {
        const like = await Like.findOne({
            client: clientId,
            product: productId
        })

        return like;

    } catch (err) {
        throw err;
    }

}

// export const getLikesByClient = async (clientId: string) => {
//     try {
//         const likes = await Like.find({
//             client: clientId
//         })

//         return likes;

//     } catch (err) {
//         throw err;
//     }

// }

export const deleteLike = async (clientId: string, productId: string) => {
    try {
        const existingLike = await Like.findOne({
            client: clientId,
            product: productId
        }).populate('client').populate('product').lean();

        if (existingLike) {
            const clientName = (existingLike as any)?.client?.fullName || "A client";
            const productName = (existingLike as any)?.product?.name?.en || (existingLike as any)?.product?.name?.fr || "a product";

            await createNotification(
                "Product Unliked",
                `${clientName} unliked ${productName}.`,
                "unlike",
                clientId,
                clientId,
                productId
            );

            await Like.findOneAndDelete({
                client: clientId,
                product: productId
            });
        }
    } catch (err) {
        throw err;
    }

}

export const getLikesByClient = async (clientId: string) => {
    try {
        return await Like.find({ client: clientId }).populate("product");
    } catch (err) { return []; }
};