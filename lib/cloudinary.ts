import { v2 as cloudinary } from "cloudinary";
import crypto from "crypto";
import streamifier from "streamifier";
import { cloudinaryCloudName, cloudinaryApiKey, cloudinaryApiSecret } from "../constent/index.js";


cloudinary.config({
  cloud_name: cloudinaryCloudName,
  api_key: cloudinaryApiKey,
  api_secret: cloudinaryApiSecret,
});

const uploadFromBuffer = (buffer: Buffer, folder: string, public_id?: string) => {
  return new Promise<any>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, public_id, overwrite: false, unique_filename: false, quality: "auto", fetch_format: "auto", crop: "limit", flags: "strip_profile" },
      (error, result) => { if (result) resolve(result); else reject(error); }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

const getBufferHash = (buffer: Buffer) => crypto.createHash("md5").update(buffer).digest("hex");

export const uploadProductImages = async (thumbnail: Buffer | string | null, images: (Buffer | string)[]) => {
  try {
    let thumbnailUrl: string | null = null;
    if (thumbnail) {
      if (typeof thumbnail === "string" && thumbnail.includes("cloudinary.com")) thumbnailUrl = thumbnail;
      else if (Buffer.isBuffer(thumbnail)) {
        const uploadResult = await uploadFromBuffer(thumbnail, "products/thumbnails", getBufferHash(thumbnail));
        thumbnailUrl = uploadResult.secure_url;
      }
    }

    const imagesUploadPromises = images.map(async (item) => {
      if (typeof item === "string" && item.includes("cloudinary.com")) return item;
      if (Buffer.isBuffer(item)) {
        const uploadResult = await uploadFromBuffer(item, "products/images", getBufferHash(item));
        return uploadResult.secure_url;
      }
      return null;
    });

    const uploadedImages = await Promise.all(imagesUploadPromises);
    const validImages = uploadedImages.filter((img): img is string => img !== null);

    return { thumbnail: thumbnailUrl, images: validImages };
  } catch (error) {
    throw new Error("Failed to upload product images");
  }
};

export const uploadCollectionThumbnail = async (thumbnail: Buffer | string | null) => {
  try {
    if (!thumbnail) return { thumbnail: null };
    if (typeof thumbnail === "string" && thumbnail.includes("cloudinary.com")) return { thumbnail };
    if (Buffer.isBuffer(thumbnail)) {
      const uploadResult = await uploadFromBuffer(thumbnail, "collections/thumbnails", getBufferHash(thumbnail));
      return { thumbnail: uploadResult.secure_url };
    }
    return { thumbnail: null };
  } catch (error) {
    throw error;
  }
};

export const uploadPubBanners = async (sources: {
  heroSm?: any;
  heroMd?: any;
  bottomSm?: any;
  bottomMd?: any;
}) => {
  try {
    // Small internal function to avoid duplicating upload logic for each image
    const processImage = async (source: any) => {
      if (!source) return null;

      // If the file is a Buffer (new image)
      if (Buffer.isBuffer(source)) {
        const result = await uploadFromBuffer(
          source,
          "pubs/banners",
          getBufferHash(source)
        );
        return result?.secure_url || null;
      }

      // If the file is a String (old link)
      if (typeof source === "string" && source.includes("cloudinary.com")) {
        return source;
      }

      return null;
    };

    // Execute uploads for the four images in parallel to improve speed
    const [heroSmUrl, heroMdUrl, bottomSmUrl, bottomMdUrl] = await Promise.all([
      processImage(sources.heroSm),
      processImage(sources.heroMd),
      processImage(sources.bottomSm),
      processImage(sources.bottomMd),
    ]);

    return {
      heroSmUrl,
      heroMdUrl,
      bottomSmUrl,
      bottomMdUrl
    };

  } catch (error) {
    return { heroSmUrl: null, heroMdUrl: null, bottomSmUrl: null, bottomMdUrl: null };
  }
};

export const uploadOwnerLogos = async (sources: {
  logoDark?: any;
  logoLight?: any;
}) => {
  try {
    const processImage = async (source: any) => {
      if (!source) return null;

      // If it's a Buffer (New file uploaded via Multer)
      if (Buffer.isBuffer(source)) {
        const result = await uploadFromBuffer(
          source,
          "owner/logos", // Folder in Cloudinary
          getBufferHash(source)
        );
        return result?.secure_url || null;
      }

      // If it's a String (Existing Cloudinary link)
      if (typeof source === "string" && source.includes("cloudinary.com")) {
        return source;
      }

      // If it's any other string (like file://), we discard it to prevent broken links
      return null;
    };

    // Parallel upload for Dark and Light logos
    const [logoDarkUrl, logoLightUrl] = await Promise.all([
      processImage(sources.logoDark),
      processImage(sources.logoLight),
    ]);

    return {
      logoDarkUrl,
      logoLightUrl
    };

  } catch (error) {
    throw error;
  }
};