import express from 'express';
import { addOwnerInfo } from '../controller/ownerInfo.js';
import { addPub, getPub, updatePub } from '../controller/pub.js';
import { PubType } from '../types/index.js';
import { handlePubUpload } from '../lib/multer.js';
import { translate } from '@vitalets/google-translate-api'; // ensure it's installed or use your alternative


export const addPub_ = async (req: express.Request, res: express.Response) => {

    try {

        const { pub } = req.body;

        const newPub = await addPub(pub);

        res.status(201).json({
            message: "pub has been added successfully",
            newPub
        })

    } catch (err: any) {

        if (err.message.includes("Missing required fields")) {
            return res.status(400).json({ message: err.message });
        }

        res.status(500).json({ message: err.message });
    }

}

export const getPub_ = async (req: express.Request, res: express.Response) => {

    try {

        let pub = await getPub();

        if (!pub) {
            pub = await addPub();
        }

        res.status(201).json({
            // message: "product has been added successfully",
            pub
        })

    } catch (err: any) {

        if (err.message.includes("Missing required fields")) {
            return res.status(400).json({ message: err.message });
        }

        res.status(500).json({ message: err.message });
    }

}

export const updatePub_ = async (req: express.Request, res: express.Response) => {
    try {
        // 1. Upload 4 images and receive their links (new or old)
        const { heroSmUrl, heroMdUrl, bottomSmUrl, bottomMdUrl } = await handlePubUpload(req);

        // 2. Process text and translation (French -> English)
        const frenchText = req.body.topBar || "";
        let englishText = "";

        if (frenchText) {
            try {
                // Use translation library (e.g. Google Translate API)
                const translation = await translate(frenchText, { from: 'fr', to: 'en' });
                englishText = translation.text;
            } catch (err: any) {
                englishText = frenchText; // Fallback if translation fails
            }
        }

        // 3. Build updated object accurately matching Schema
        const updateData = {
            topBar: {
                fr: frenchText,
                en: englishText
            },
            heroBanner: {
                sm: heroSmUrl || "",
                md: heroMdUrl || ""
            },
            bottomBanner: {
                sm: bottomSmUrl || "",
                md: bottomMdUrl || ""
            }
        } as PubType;

        // 4. Update database
        // Note: ensure updatePub uses MODEL.findOneAndUpdate({}, updateData, { new: true })
        const pub = await updatePub(updateData);

        if (!pub) {
            return res.status(404).json({ message: "Pub document not found" });
        }

        // Return final result to mobile
        res.status(200).json({
            message: "Updated successfully ✅",
            pub
        });

    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};