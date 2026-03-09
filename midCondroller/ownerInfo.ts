import express from 'express';
import { addOwnerInfo, getOwnerInfo, updateOwnerInfo } from '../controller/ownerInfo.js';
import { handleOwnerUploads } from '../lib/multer.js';


export const addOwnerInfo_ = async (req: express.Request, res: express.Response) => {

    try {

        const { ownerInfo } = req.body;

        const newOwnerInfo = await addOwnerInfo(ownerInfo);

        res.status(201).json({
            message: "newOwnerInfo has been added successfully",
            newOwnerInfo
        })

    } catch (err: any) {

        if (err.message.includes("Missing required fields")) {
            return res.status(400).json({ message: err.message });
        }

        res.status(500).json({ message: err.message });
    }

}

export const getOwnerInfo_ = async (req: express.Request, res: express.Response) => {

    try {

        const ownerInfo = await getOwnerInfo();

        if (!ownerInfo) {
            res.status(404).json({
                message: "ownerInfo not found !"
            })
        }

        res.status(200).json({
            ownerInfo
        })

    } catch (err: any) {

        if (err.message.includes("Missing required fields")) {
            return res.status(400).json({ message: err.message });
        }

        res.status(500).json({ message: err.message });
    }
}

export const updateOwnerInfo_ = async (req: express.Request, res: express.Response) => {
    try {
        // 1. Process logo uploads
        const { logos } = await handleOwnerUploads(req);

        // 2. Text transformation function
        const safeParse = (data: any) => {
            if (!data) return undefined;
            if (typeof data === 'string') {
                try { return JSON.parse(data); } catch { return data; }
            }
            return data;
        };

        // Decode contact object
        const contactData = safeParse(req.body.contact);

        // 3. Build update object matching schema
        const updateData = {
            name: req.body.name,
            logo: {
                dark: logos.dark || req.body.logoDark,
                light: logos.light || req.body.logoLight
            },
            socialMedia: safeParse(req.body.socialMedia),
            // Fix here: extract data from contactData
            contact: {
                email: contactData?.email,
                mailPassword: contactData?.mailPassword,
                phone: contactData?.phone ? Number(contactData.phone) : undefined,
            },
            homeCollections: safeParse(req.body.homeCollections),
            topCollections: safeParse(req.body.topCollections),
            collectionsInSideBar: safeParse(req.body.collectionsInSideBar),
            shippingCost: req.body.shippingCost ? Number(req.body.shippingCost) : 0,
            aiPrompt: req.body.aiPrompt
        };

        // Clean undefined values
        Object.keys(updateData).forEach(key => {
            if (updateData[key as keyof typeof updateData] === undefined) {
                delete updateData[key as keyof typeof updateData];
            }
        });

        // 4. Update in database
        const updatedOwnerInfo = await updateOwnerInfo(updateData);

        if (!updatedOwnerInfo) {
            return res.status(404).json({ message: "OwnerInfo not found!" });
        }

        res.status(200).json({
            message: "Owner information updated successfully ✅",
            ownerInfo: updatedOwnerInfo
        });

    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};