import express from 'express';
import { Server } from "socket.io";
import { SpecificationType } from "../types/index.js";
import { addSpecification } from "../controller/specification.js";


export const addSpecification_ = async (
    req: express.Request,
    res: express.Response
) => {

    try {

        const { specificationData } = req.body;

        const newSpecification = await addSpecification(specificationData);

        res.status(201).json({
            message: "specification has been added successfully",
            newSpecification
        })


    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
}


