import express from 'express';
import { FiltrationType, ProductStatus, ProductType, SpecificationType } from '../types/index.js';
import Product from '../models/product.js';
import { addProduct, deleteProducts, getAllProducts, getAllProductsCount, getMostProductExpensive, getProductAnalytics, getProductById, getProductsByCollection, getProductsBySearch, getProductsCount, getProductsCountByCollection, getProductsSalesAnalytics, hideProducts, updateProduct } from '../controller/product.js';
import { handleProductImagesUpload } from '../lib/multer.js';
import { getLikesByClient } from '../controller/like.js';
import { addSpecification } from '../controller/specification.js';
import Specification from '../models/specification.js';
import { translate } from 'google-translate-api-x';

const safeParseStatus = (status: any): ProductStatus[] => {
  if (!status) return ["active"];
  try {
    const parsed = typeof status === 'string' ? JSON.parse(status) : status;
    return Array.isArray(parsed) ? parsed : ["active"];
  } catch (e) {
    return ["active"];
  }
};

export const addProduct_ = async (req: express.Request, res: express.Response) => {
  try {
    // 1. Upload Images
    // @ts-ignore
    const { thumbnail, newUploadedUrls } = await handleProductImagesUpload(req);

    const safeParse = (data: any) => {
      if (!data) return [];
      try {
        let parsed = typeof data === 'string' ? JSON.parse(data) : data;
        if (Array.isArray(parsed)) {
          return parsed.map(item => {
            if (typeof item === 'string') {
              const trimmed = item.trim();
              if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
                try { return JSON.parse(trimmed); } catch (e) { return trimmed; }
              }
              return trimmed;
            }
            return item;
          });
        }
        return parsed;
      } catch (e) {
        return [];
      }
    };

    // 2. Handle Specifications
    let rawSpecs = safeParse(req.body.specifications);
    const finalSpecIds = [];
    const specMapByProps = new Map();

    // Fallback: If no specifications provided, create a default one
    if (rawSpecs.length === 0) {
      rawSpecs = [{
        color: "Default",
        size: "Standard",
        price: Number(req.body.price || 0),
        quantity: Number(req.body.stock || 0),
        unlimited: true
      }];
    }

    for (const spec of rawSpecs) {
      const { _id, ...specData } = spec;

      const cleanSpec = {
        ...specData,
        color: specData.color?.trim() || "",
        size: specData.size?.trim() || "",
        price: Number(specData.price || req.body.price || 0),
        quantity: Number(specData.quantity || req.body.stock || 0),
        unlimited: specData.unlimited === 'true' || specData.unlimited === true
      };

      const savedSpec = await Specification.create(cleanSpec);

      if (savedSpec) {
        finalSpecIds.push(savedSpec._id);
        const propKey = `${(cleanSpec.color || "").toLowerCase().trim()}-${(cleanSpec.size || "").toLowerCase().trim()}`;
        specMapByProps.set(propKey, savedSpec._id);
      }
    }

    // 3. Handle Images Mapping
    const newImagesSpecsData = safeParse(req.body.newImagesSpecsData);
    let formattedImages = (newUploadedUrls || []).map((url: string, idx: number) => {
      const props = newImagesSpecsData[idx];
      let linkedSId = null;

      if (props && (props.color !== undefined || props.size !== undefined)) {
        const key = `${(props.color || "").toLowerCase().trim()}-${(props.size || "").toLowerCase().trim()}`;
        linkedSId = specMapByProps.get(key) || null;
      }

      return {
        uri: String(url),
        specification: linkedSId
      };
    });

    // Fallback: If no images uploaded, use thumbnail and link to the first specification
    if (formattedImages.length === 0 && thumbnail) {
      formattedImages = [{
        uri: thumbnail,
        specification: finalSpecIds[0] // Link to the first created spec
      }];
    }

    // 4. Translations (French -> English)
    let nameEn = req.body.nameFr;
    let descriptionEn = req.body.descriptionFr || "";

    try {
      if (req.body.nameFr) {
        const resName = await translate(req.body.nameFr, { from: 'fr', to: 'en' }) as any;
        nameEn = resName.text;
      }
      if (req.body.descriptionFr) {
        const resDesc = await translate(req.body.descriptionFr, { from: 'fr', to: 'en' }) as any;
        descriptionEn = resDesc.text;
      }
    } catch (e) {
    }

    // 5. Final Product Object Construction
    const productData = {
      name: {
        fr: req.body.nameFr,
        en: nameEn
      },
      price: parseFloat(req.body.price) || 0,
      oldPrice: parseFloat(req.body.oldPrice) || 0,
      thumbNail: thumbnail,
      images: formattedImages,
      description: {
        fr: req.body.descriptionFr || "",
        en: descriptionEn
      },
      collections: safeParse(req.body.collections),
      specifications: finalSpecIds,
      stock: Number(req.body.stock || 0)
    };

    const newProduct = await Product.create(productData);

    return res.status(201).json({
      message: "Product added successfully! ✅",
      product: newProduct
    });

  } catch (err: any) {
    return res.status(500).json({
      message: "Failed to create product",
      details: err.message
    });
  }
};

export const getAllProducts_ = async (req: express.Request, res: express.Response) => {

  try {

    const { limit, skip, status } = req.query;

    const status_ = safeParseStatus(status);

    const products = await getAllProducts(
      Number(limit),
      Number(skip),
      status_ as unknown as ProductStatus[]
    );

    const productsCount = await getAllProductsCount(status_ as unknown as ProductStatus[]);

    res.status(201).json({
      // message: "product has been added successfully",
      products,
      productsCount
    })

  } catch (err: any) {
    console.log({ err });

    if (err.message.includes("Missing required fields")) {
      return res.status(400).json({ message: err.message });
    }

    res.status(500).json({ message: err.message });
  }

}

export const getFavoriteProductsByClient_ = async (req: express.Request, res: express.Response) => {

  try {

    const { clientId } = req.query;

    const likes = await getLikesByClient(clientId as string);

    const products = [] as ProductType[];

    for (const like of likes) {
      if (!like.product) continue;

      const product = await getProductById(like?.product as unknown as string, "active" as unknown as ProductStatus[]) as unknown as ProductType;
      products.push(product);
    }

    res.status(201).json({
      products,
    })

  } catch (err: any) {
    console.log({ err });

    if (err.message.includes("Missing required fields")) {
      return res.status(400).json({ message: err.message });
    }

    res.status(500).json({ message: err.message });
  }

}

export const getProductsByCollection_ = async (req: express.Request, res: express.Response) => {

  try {

    const { collectionId, limit, skip, status } = req.query;

    const status_ = safeParseStatus(status);

    const products = await getProductsByCollection(
      collectionId as string,
      Number(limit),
      Number(skip),
      status_ as unknown as ProductStatus[]
    );

    const productsCount = await getProductsCountByCollection(collectionId as string, status_ as unknown as ProductStatus[]);


    res.status(201).json({
      // message: "product has been added successfully",
      products,
      productsCount
    })

  } catch (err: any) {
    console.log({ err });

    if (err.message.includes("Missing required fields")) {
      return res.status(400).json({ message: err.message });
    }

    res.status(500).json({ message: err.message });
  }

}

export const getProductsBySearch_ = async (req: express.Request, res: express.Response) => {
  try {
    const { searchText = "", limit = 10, skip = 0, filtration = {}, status } = req.body;

    const status_ = safeParseStatus(status);

    const cleanedFiltration = Object.entries(filtration).reduce((acc: any, [key, value]) => {
      const isArrayWithContent = Array.isArray(value) && value.length > 0;
      const isNonEmptyString = typeof value === 'string' && value.trim() !== "";
      const isNumberOrObject = typeof value === 'number' || (typeof value === 'object' && value !== null && !Array.isArray(value));

      if (isArrayWithContent || isNonEmptyString || isNumberOrObject) {
        acc[key] = value;
      }
      return acc;
    }, {});

    // 2. Call database function
    const result = await getProductsBySearch(
      (searchText || "").trim(),
      Number(limit) || 10,
      Number(skip) || 0,
      cleanedFiltration,
      status_ as unknown as ProductStatus[]
    );

    return res.status(200).json(result);

  } catch (err: any) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getProductById_ = async (req: express.Request, res: express.Response) => {

  try {


    const { productId, status } = req.query;

    const status_ = safeParseStatus(status);

    const product = await getProductById(productId as string, status_ as unknown as ProductStatus[]);

    res.status(201).json({
      product,
    })

  } catch (err: any) {
    console.log({ err });

    if (err.message.includes("Missing required fields")) {
      return res.status(400).json({ message: err.message });
    }

    res.status(500).json({ message: err.message });
  }

}

export const getBestSellers_ = async (req: any, res: any) => {
  try {
    const { from, to, limit, skip, status } = req.query;
    const status_ = safeParseStatus(status);
    const data = await getProductsSalesAnalytics(
      from ? Number(from) : undefined,
      to ? Number(to) : undefined,
      limit ? Number(limit) : 3,
      skip ? Number(skip) : 0,
      status_
    );
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getMostProductExpensive_ = async (req: express.Request, res: express.Response) => {

  try {

    const product = await getMostProductExpensive();

    res.status(201).json({
      // message: "product has been added successfully",
      product,
    })

  } catch (err: any) {
    console.log({ err });

    if (err.message.includes("Missing required fields")) {
      return res.status(400).json({ message: err.message });
    }

    res.status(500).json({ message: err.message });
  }

}

export const updateProduct_ = async (req: express.Request, res: express.Response) => {
  try {
    const { _id, nameFr, price, oldPrice, descriptionFr } = req.body;

    // --- 1. Automated Translation Logic ---
    // Translating from French (fr) to English (en)
    let nameEn = req.body.nameEn;
    let descriptionEn = req.body.descriptionEn;

    if (!nameEn && nameFr) {
      const translation = await translate(nameFr, { from: 'fr', to: 'en' }) as any;
      nameEn = translation.text;
    }

    if (!descriptionEn && descriptionFr) {
      const translation = await translate(descriptionFr, { from: 'fr', to: 'en' }) as any;
      descriptionEn = translation.text;
    }

    // --- 2. Specifications Handling ---
    const incomingSpecs = req.body.specifications ? JSON.parse(req.body.specifications) : [];
    const finalSpecIds = [];
    const specMapByProps = new Map();

    for (const spec of incomingSpecs) {
      const { _id: incomingId, ...specData } = spec;
      const cleanData = {
        ...specData,
        color: specData.color?.trim(),
        size: specData.size?.trim(),
        price: parseFloat(specData.price) || 0,
        quantity: parseInt(specData.quantity) || 0,
        unlimited: specData.unlimited === 'true' || specData.unlimited === true
      };

      const isTemp = !incomingId || incomingId.toString().startsWith('temp');
      const query = isTemp ? { color: cleanData.color, size: cleanData.size } : { _id: incomingId };

      const savedSpec = await Specification.findOneAndUpdate(
        query,
        { $set: cleanData },
        { upsert: true, new: true }
      );

      if (savedSpec) {
        finalSpecIds.push(savedSpec._id);
        const propKey = `${(cleanData.color || "").toLowerCase().trim()}-${(cleanData.size || "").toLowerCase().trim()}`;
        specMapByProps.set(propKey, savedSpec._id);
      }
    }

    // --- 3. Image Upload via Utils ---
    const { thumbnail, newUploadedUrls } = await handleProductImagesUpload(req);

    // --- 4. Merge Images & Smart Linking ---
    const existingImages = req.body.existingImages ? JSON.parse(req.body.existingImages) : [];
    const newImagesSpecsData = JSON.parse(req.body.newImagesSpecsData || "[]");

    const finalImagesArray = [];
    const seenUris = new Set();

    for (const img of existingImages) {
      if (!img.uri || seenUris.has(img.uri)) continue;

      let sId = img.specification;
      if (img.specProps && (img.specProps.color !== undefined || img.specProps.size !== undefined)) {
        const key = `${(img.specProps.color || "").toLowerCase().trim()}-${(img.specProps.size || "").toLowerCase().trim()}`;
        sId = specMapByProps.get(key) || sId;
      }

      const validSId = (sId && sId !== "null" && !sId.toString().startsWith('temp')) ? sId : null;
      finalImagesArray.push({ uri: img.uri, specification: validSId });
      seenUris.add(img.uri);
    }

    newUploadedUrls.forEach((url: string, idx: number) => {
      if (seenUris.has(url)) return;

      const props = newImagesSpecsData[idx];
      let linkedSId = null;

      if (props && (props.color !== undefined || props.size !== undefined)) {
        const key = `${(props.color || "").toLowerCase().trim()}-${(props.size || "").toLowerCase().trim()}`;
        linkedSId = specMapByProps.get(key) || null;
      }

      finalImagesArray.push({ uri: url, specification: linkedSId });
      seenUris.add(url);
    });

    // --- 5. Final Database Update ---
    const result = await Product.findOneAndUpdate(
      { _id },
      {
        $set: {
          name: { fr: nameFr, en: nameEn || nameFr },
          price: parseFloat(price.toString()) || 0,
          oldPrice: parseFloat(oldPrice?.toString() || "0") || 0,
          stock: parseInt(req.body.stock || 0),
          description: { fr: descriptionFr, en: descriptionEn || "No description available" },
          thumbNail: thumbnail,
          images: finalImagesArray,
          specifications: finalSpecIds,
          collections: JSON.parse(req.body.collections || "[]"),
          status: req.body.status || "active",
        }
      },
      { new: true }
    );

    res.status(200).json({ message: "Success", product: result });

  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteProducts_ = async (req: express.Request, res: express.Response) => {
  try {
    const { ids, status } = req.body; // Extract status from body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        message: "A non-empty list of IDs is required."
      });
    }

    // Pass ids and status (if present) to the function
    const result = await deleteProducts(ids, status);

    return res.status(200).json({
      message: `Successfully updated ${result.modifiedCount} products status. ✅`,
      details: result
    });
  } catch (err: any) {
    return res.status(500).json({
      message: "Failed to update products status",
      error: err.message
    });
  }
};

export const hideProducts_ = async (req: express.Request, res: express.Response) => {
  try {
    const { ids, status } = req.body; // Extract status from body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        message: "A non-empty list of IDs is required."
      });
    }

    // Pass ids and status (if present) to the function
    const result = await hideProducts(ids, status);

    return res.status(200).json({
      message: `Successfully updated ${result.modifiedCount} products status. 📦`,
      details: result
    });
  } catch (err: any) {
    return res.status(500).json({
      message: "Failed to update products status",
      error: err.message
    });
  }
};

export const getProductAnalytics_ = async (req: express.Request, res: express.Response) => {
  try {
    const { productId } = req.query;

    if (!productId) {
      return res.status(400).json({ success: false, message: "Product ID is required" });
    }

    const analytics = await getProductAnalytics(productId as string);

    return res.status(200).json({
      success: true,
      analytics
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};