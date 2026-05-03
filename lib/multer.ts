import multer from "multer";
import { uploadCollectionThumbnail, uploadOwnerLogos, uploadProductImages, uploadPubBanners } from "./cloudinary.js";

const storage = multer.memoryStorage();
const upload = multer({ storage });

export const uploadProductMiddleware = upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "images", maxCount: 10 },
]);

export const uploadCollectionMiddleware = upload.fields([
    { name: "thumbnail", maxCount: 1 },
]);

export const uploadSingleImageMiddleware = upload.single("image");

export const handleProductImagesUpload = async (req: any) => {
    // 1. Extract files from request
    const thumbnailBuffer = req.files?.thumbnail ? req.files.thumbnail[0].buffer : null;
    const imageBuffers = req.files?.images ? req.files.images.map((f: any) => f.buffer) : [];

    try {
        // 2. Upload to Cloudinary
        const { thumbnail, images: uploadedUrls } = await uploadProductImages(thumbnailBuffer, imageBuffers);

        // 3. Return only new links as simple array of strings
        // No need to link specifications here as we'll link them in the Controller
        return {
            thumbnail: thumbnail || req.body.thumbnail || req.body.thumbNail || null,
            newUploadedUrls: uploadedUrls // Array of links only
        };
    } catch (error) {
        throw error;
    }
};

export const handleCollectionThumbNailUpload = async (req: any) => {
    if (!req.files || !req.files.thumbnail || !req.files.thumbnail[0]) {
        return { thumbnail: req.body.thumbnail || null };
    }
    const thumbnailBuffer = req.files.thumbnail[0].buffer;
    try {
        const { thumbnail } = await uploadCollectionThumbnail(thumbnailBuffer);
        return { thumbnail };
    } catch (error) {
        throw error;
    }
};

export const uploadPubMiddleware = upload.fields([
    { name: "heroBanner_sm", maxCount: 1 },
    { name: "heroBanner_md", maxCount: 1 },
    { name: "bottomBanner_sm", maxCount: 1 },
    { name: "bottomBanner_md", maxCount: 1 },
]);

export const handlePubUpload = async (req: any) => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // Extract buffers or string links for the four fields
    const sources = {
        heroSm: files?.['heroBanner_sm']?.[0]?.buffer || req.body.heroBanner_sm,
        heroMd: files?.['heroBanner_md']?.[0]?.buffer || req.body.heroBanner_md,
        bottomSm: files?.['bottomBanner_sm']?.[0]?.buffer || req.body.bottomBanner_sm,
        bottomMd: files?.['bottomBanner_md']?.[0]?.buffer || req.body.bottomBanner_md,
    };


    try {
        // Send the full object to the Cloudinary function we modified previously
        const { heroSmUrl, heroMdUrl, bottomSmUrl, bottomMdUrl } = await uploadPubBanners(sources);

        // Return final links (either newly uploaded or old ones)
        return {
            heroSmUrl: heroSmUrl || req.body.heroBanner_sm || null,
            heroMdUrl: heroMdUrl || req.body.heroBanner_md || null,
            bottomSmUrl: bottomSmUrl || req.body.bottomBanner_sm || null,
            bottomMdUrl: bottomMdUrl || req.body.bottomBanner_md || null
        };
    } catch (error) {
        throw error;
    }
};

// 1. Middleware to specify fields expected to receive files
export const updateOwnerMiddleware = upload.fields([
    { name: "logoDark", maxCount: 1 },
    { name: "logoLight", maxCount: 1 }
]);

// 2. Handler to extract files and links and pass them to upload functions
export const handleOwnerUploads = async (req: any) => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // Extract sources for Logos
    const logoSources = {
        logoDark: files?.['logoDark']?.[0]?.buffer || req.body.logoDark,
        logoLight: files?.['logoLight']?.[0]?.buffer || req.body.logoLight,
    };


    try {
        // Execute upload operations in parallel for speed
        const [logos] = await Promise.all([
            uploadOwnerLogos(logoSources),
        ]);

        // Accumulate final links (newly uploaded or old ones from Body)
        return {
            logos: {
                dark: logos.logoDarkUrl || req.body.logoDark || null,
                light: logos.logoLightUrl || req.body.logoLight || null,
            }
        };
    } catch (error) {
        throw error;
    }
};