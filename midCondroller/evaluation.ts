import express from "express";
import { addEvaluation, deleteEvaluationById, getEvaluationByProduct, updateEvaluationById } from "../controller/evaluation.js";


export const addEvaluation_ = async (req: express.Request, res: express.Response) => {
    try {
        const { evaluationData } = req.body;

        const newEvaluation = await addEvaluation(evaluationData);

        res.status(201).json({
            message: "new evaluation has been added successfuly!",
            evaluation: newEvaluation
        })

    } catch (err: any) {

        if (err.message.includes("You have already evaluated this product")) {
            return res.status(400).json({ message: err.message });
        }

        if (err.message.includes("Missing required fields")) {
            return res.status(400).json({ message: err.message });
        }

        res.status(500).json({ message: err.message });
    }

}

export const getEvaluationByProduct_ = async (req: express.Request, res: express.Response) => {
    try {
        const { productId } = req.query;

        const evaluations = await getEvaluationByProduct(productId as string);

        return res.status(201).json({
            evaluations
        })

    } catch (err: any) {

        if (err.message.includes("Missing required fields")) {
            return res.status(400).json({ message: err.message });
        }

        res.status(500).json({ message: err.message });
    }

}

export const updateEvaluationById_ = async (req: express.Request, res: express.Response) => {
    try {
        const { updatedData } = req.body;

        const updatedEvaluation = await updateEvaluationById(updatedData);

        return res.status(201).json({
            updatedEvaluation
        })

    } catch (err: any) {

        if (err.message.includes("Missing required fields")) {
            return res.status(400).json({ message: err.message });
        }

        res.status(500).json({ message: err.message });
    }

}

export const deleteEvaluationById_ = async (req: express.Request, res: express.Response) => {
    try {
        const { id } = req.query;

        const deletedEvaluation = await deleteEvaluationById(id as string);

        return res.status(201).json({
            message: "evaluation has been deleted successfuly!",
            deletedEvaluation
        })

    } catch (err: any) {

        res.status(500).json({ message: err.message });
    }

}

