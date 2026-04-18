import Evaluation from "../models/evaluation.js";
import { EvaluationType } from "../types/index.js";
import { createNotification } from "./notification.js";

export const addEvaluation = async (evaluationData: EvaluationType) => {
    try {

        const existingEvaluation = await Evaluation.findOne({
            client: evaluationData.client,
            product: evaluationData.product
        });

        if (existingEvaluation) {
            throw new Error("You have already evaluated this product.");
        }

        const newEvaluation = new Evaluation(evaluationData);
        await newEvaluation.save();

        const populatedEval = await Evaluation.findById(newEvaluation._id)
            .populate('client')
            .populate('product')
            .lean();

        const clientName = (populatedEval as any)?.client?.fullName || "A client";
        const productName = (populatedEval as any)?.product?.name?.en || (populatedEval as any)?.product?.name?.fr || "a product";

        await createNotification(
            "Product Rated",
            `${clientName} rated ${productName} with ${evaluationData.number} stars.`,
            "rate",
            evaluationData.client?.toString(),
            evaluationData.client?.toString(),
            evaluationData.product?.toString(),
            { rating: evaluationData.number, comment: evaluationData.note }
        );

        return newEvaluation

    } catch (err) {
        throw err;
    }
}

export const getEvaluationByProduct = async (productId: string) => {
    try {

        const evaluations = await Evaluation.find({ product: productId })
            .populate('client')
            .sort({ createdAt: -1 });

        return evaluations

    } catch (err) {
        throw err;
    }
}

export const updateEvaluationById = async (updatedData: EvaluationType) => {
    try {

        const updatedEvaluation = await Evaluation.findOneAndUpdate(
            { _id: updatedData._id },
            updatedData,
            { new: true }
        ).populate('client').populate('product').lean();

        if (updatedEvaluation) {
            const clientName = (updatedEvaluation.client as any)?.fullName || "A client";
            const productName = (updatedEvaluation.product as any)?.name?.en || (updatedEvaluation.product as any)?.name?.fr || "a product";

            await createNotification(
                "Product Rating Updated",
                `${clientName} updated their review for ${productName} to ${updatedData.number} stars.`,
                "rate_update",
                (updatedEvaluation.client as any)?._id?.toString() || (updatedEvaluation.client as any)?.toString(),
                (updatedEvaluation.client as any)?._id?.toString() || (updatedEvaluation.client as any)?.toString(),
                (updatedEvaluation.product as any)?._id?.toString() || (updatedEvaluation.product as any)?.toString(),
                { rating: updatedData.number, comment: updatedData.note }
            );
        }

        return updatedEvaluation

    } catch (err) {
        throw err;
    }
}

export const deleteEvaluationById = async (id: string) => {
    try {

        const deletedEvaluation = await Evaluation.findByIdAndDelete(id).populate('client').populate('product').lean();

        if (deletedEvaluation) {
            const clientName = (deletedEvaluation.client as any)?.fullName || "A client";
            const productName = (deletedEvaluation.product as any)?.name?.en || (deletedEvaluation.product as any)?.name?.fr || "a product";

            await createNotification(
                "Product Rating Deleted",
                `${clientName} deleted their review for ${productName}.`,
                "rate_delete",
                (deletedEvaluation.client as any)?._id?.toString() || (deletedEvaluation.client as any)?.toString(),
                (deletedEvaluation.client as any)?._id?.toString() || (deletedEvaluation.client as any)?.toString(),
                (deletedEvaluation.product as any)?._id?.toString() || (deletedEvaluation.product as any)?.toString()
            );
        }

        return deletedEvaluation

    } catch (err) {
        throw err;
    }
}

export const getEvaluationsByClient = async (clientId: string) => {
    try {
        return await Evaluation.find({ client: clientId })
            .populate('product')
            .sort({ createdAt: -1 })
            .lean();
    } catch (err) {
        return [];
    }
}
