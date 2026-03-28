import express from 'express';
import { FiltrationType, ProductStatus, ProductType, SpecificationType } from '../types/index.js';
import Specification from '../models/specification.js';
import Product from '../models/product.js';
import { FilterQuery, ObjectId } from 'mongoose';
import { SortOrder } from 'mongoose';
import { addSpecification } from './specification.js';
import { deleteCloudinaryImages, uploadProductImages } from '../lib/cloudinary.js';
import { Types } from 'mongoose'; // 1. Import Types
import Purchase from '../models/purchase.js';
import Like from '../models/like.js';
import Evaluation from '../models/evaluation.js';

export const addProduct = async (productData: ProductType) => {
  try {
    const newProduct = new Product(productData);

    const specificationsIds: Types.ObjectId[] = []; // 2. Change type to ObjectId[]

    if (productData.specifications && productData.specifications.length > 0) {
      for (const spec of productData.specifications) {
        const newSpec = await addSpecification(spec as SpecificationType);
        // 3. Convert the string ID to a Mongoose ObjectId
        if (newSpec?._id) {
          specificationsIds.push(new Types.ObjectId(newSpec._id));
        }
      }
    } else {
      const defaultSpec = await addSpecification({
        price: productData.price,
        quantity: 9999999999
      } as SpecificationType);
      if (defaultSpec?._id) {
        specificationsIds.push(new Types.ObjectId(defaultSpec._id));
      }
    }

    // Now this assignment will be valid
    newProduct.specifications = specificationsIds;

    // ... rest of your code (uploading images, etc.)

    await newProduct.save();
    return newProduct;

  } catch (err) {
    throw err;
  }
}

export const getAllProducts = async (
  limit: number,
  skip: number,
  status: ProductStatus[] = ["active"]
) => {

  try {



    const products = await Product.find({
      status: { $in: status }
    })
      .populate("specifications")
      .populate({
        path: "images.specification",
        model: "Specification"
      })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    return products as unknown as ProductType[];

  } catch (err) {
    throw err;
  }
}

export const getProductById = async (productId: string, status: ProductStatus[] = ["active"]) => {

  try {

    const product = await Product.findOne({ _id: productId, status: { $in: status } })
      .populate("specifications")
      .populate({
        path: "images.specification",
        model: "Specification"
      })
      .lean();

    if (product == undefined) {
      throw new Error("Product not found !");
    }

    return product;

  } catch (err) {
    throw err;
  }

}

// export const getFavoriteProductsByClient = async (clientId: string) => {

//     try {

//         const product = await Product.findOne({ _id: productId }).populate("specifications").lean();



//          if (!product) {
//             throw new Error("Product not found !");
//          }

//         return product;

//     } catch (err) {
//         throw err;
//     }

// }

export const getProductsByCollection = async (
  collectionId: string | ObjectId,
  limit: number,
  skip: number,
  status: ProductStatus[] = ["active"]
) => {

  try {



    if (!collectionId) {
      throw new Error("Missing required fields: collectionId is required !")
    }

    const products = await Product.find({ collections: { $in: [collectionId] }, status: { $in: status } })
      .populate("specifications")
      .populate({
        path: "images.specification",
        model: "Specification"
      })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })

    return products;

  } catch (err) {
    throw err;
  }

}

export const getAllProductsCount = async (status: ProductStatus[] = ["active"]) => {

  try {

    const count = await Product.countDocuments({ status: { $in: status } });

    return count;

  } catch (err) {
    throw err;
  }
};

export const getProductsCount = async (collectionId?: string, status: ProductStatus[] = ["active"]) => {

  try {

    const filter = collectionId ? { collections: collectionId, status: { $in: status } } : {};
    const count = await Product.countDocuments(filter);
    return count;

  } catch (err) {
    throw err;
  }
};

export const getProductsCountByCollection = async (collectionId: string, status: ProductStatus[] = ["active"]) => {

  try {

    if (!collectionId) {
      throw new Error("collectionId is required");
    }

    const count = await Product.countDocuments({ collections: collectionId, status: { $in: status } });
    return count;

  } catch (err) {
    throw err;
  }
};

export const getProductsBySearch = async (
  searchText: string | null | undefined,
  limit: number = 5,
  skip: number = 0,
  filtration: any = {},
  status: ProductStatus[] = ["active"]
) => {
  try {
    /**
     * 1. الأساس: حالة المنتج
     * تأكد أن Product 2 حالته "active" في قاعدة البيانات ليظهر هنا.
     */
    const productConditions: any[] = [{ status: { $in: status } }];

    /**
     * 2. البحث النصي
     */
    if (searchText && searchText.trim() !== "") {
      productConditions.push({
        $or: [
          { "name.fr": { $regex: searchText, $options: "i" } },
          { "name.en": { $regex: searchText, $options: "i" } },
          { "description.fr": { $regex: searchText, $options: "i" } },
          { "description.en": { $regex: searchText, $options: "i" } },
        ],
      });
    }

    /**
     * 3. فلترة المجموعات (Collections)
     * يجب أن يحتوى المنتج على كل المجموعات المحددة ($all)
     */
    if (filtration.collections && Array.isArray(filtration.collections) && filtration.collections.length > 0) {
      productConditions.push({ collections: { $all: filtration.collections } });
    }

    /**
     * 4. فلترة الأسعار
     */
    if (filtration.price) {
      const priceFrom = Number(filtration.price.from);
      const priceTo = Number(filtration.price.to);
      productConditions.push({
        price: {
          $gte: isNaN(priceFrom) ? 0 : priceFrom,
          $lte: isNaN(priceTo) ? 999999999 : priceTo,
        },
      });
    }

    /**
     * 5. معالجة المواصفات (اللون، الحجم، النوع)
     */
    const specConditions: any[] = [];
    const isFilterActive = (arr: any) => arr && Array.isArray(arr) && arr.length > 0 && !arr.includes('all');

    if (isFilterActive(filtration.colors)) specConditions.push({ color: { $in: filtration.colors } });
    if (isFilterActive(filtration.sizes)) specConditions.push({ size: { $in: filtration.sizes } });
    if (isFilterActive(filtration.types)) specConditions.push({ type: { $in: filtration.types } });

    if (specConditions.length > 0) {
      // البحث عن المواصفات التي تطابق الشروط المختارة
      const specs = await Specification.find({ $and: specConditions }).select("_id");
      const matchedSpecIds = specs.map(s => s._id);

      // إذا كانت هناك فلاتر نشطة ولم نجد أي مواصفة تطابقها، نعيد نتائج فارغة فوراً
      if (matchedSpecIds.length === 0) {
        return {
          products: [],
          productsCount: 0,
          availableColors: [],
          availableSizes: [],
          availableTypes: []
        };
      }
      productConditions.push({ specifications: { $in: matchedSpecIds } });
    }

    // دمج كل الشروط في استعلام واحد
    const finalFilter = { $and: productConditions };

    /**
     * 6. منطق الترتيب (Sorting)
     */
    let sortField = filtration.sortBy || 'createdAt';
    const lang = filtration.activeLanguage || 'en';

    if (sortField === 'price') {
      sortField = 'price';
    } else if (sortField === 'name') {
      sortField = `name.${lang}`;
    } else if (sortField === 'date') {
      sortField = 'createdAt';
    }

    const sortDir: any = filtration.sortDirection === 'asc' ? 1 : -1;

    /**
     * 7. تنفيذ الاستعلام الرئيسي
     */
    let query = Product.find(finalFilter)
      .populate("specifications")
      .populate({
        path: "images.specification",
        model: "Specification"
      })
      .sort({ [sortField]: sortDir })
      .limit(limit)
      .skip(skip);

    // تحسين البحث عن النصوص لتجاهل حالة الأحرف عند الترتيب الأبجدي
    if (sortField.startsWith('name')) {
      query = query.collation({ locale: 'en', strength: 2 });
    }

    // تنفيذ البحث والعد بالتوازي لزيادة السرعة
    const [products, productsCount] = await Promise.all([
      query.lean(),
      Product.countDocuments(finalFilter)
    ]);

    /**
     * 8. استخراج الفلاتر المتاحة بناءً على النتائج (Dynamic Filters)
     * هذا الجزء يضمن أن المستخدم يرى فقط الألوان/المقاسات المتوفرة للمنتجات المعروضة
     */
    const productsInContext = await Product.find(finalFilter).select("specifications").limit(200).lean();
    const allRelatedSpecIds = Array.from(new Set(
      productsInContext.flatMap((p) => (p.specifications ? p.specifications.map(s => s.toString()) : []))
    ));

    const [availableColors, availableSizes, availableTypes] = await Promise.all([
      Specification.distinct("color", { _id: { $in: allRelatedSpecIds }, color: { $exists: true, $ne: null } }),
      Specification.distinct("size", { _id: { $in: allRelatedSpecIds }, size: { $exists: true, $ne: null } }),
      Specification.distinct("type", { _id: { $in: allRelatedSpecIds }, type: { $exists: true, $ne: null } }),
    ]);

    return {
      products,
      productsCount,
      availableColors,
      availableSizes,
      availableTypes,
    };

  } catch (err) {
    console.error("Error in getProductsBySearch:", err);
    throw err;
  }
};

// export const getMostProductExpensive = async () => {
//   try {
//     const result = await Product.aggregate([
//       // Populate full specifications
//       {
//         $lookup: {
//           from: "specifications",
//           localField: "specifications",
//           foreignField: "_id",
//           as: "specifications"
//         }
//       },

//       // Sort specifications array by price DESC
//       {
//         $addFields: {
//           specifications: {
//             $sortArray: {
//               input: "$specifications",
//               sortBy: { price: -1 }
//             }
//           }
//         }
//       },

//       // Now sort products by highest specification price
//       {
//         $sort: {
//           "specifications.0.price": -1
//         }
//       },

//       // Take only the top product
//       { $limit: 1 }
//     ]);

//     return result[0] || null;
//   } catch (err) {
//     throw err;
//   }
// };

export const getMostProductExpensive = async (status: ProductStatus[] = ["active"]) => {
  try {
    const result = await Product.findOne({ status: { $in: status } })
      .sort({ price: -1 })
      .select("price")
      .lean();

    return result;
  } catch (err) {
    throw err;
  }
};

export const updateProduct = async (updatedData: ProductType) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      updatedData._id,
      { $set: updatedData },
      { new: true }
    )
      .populate("specifications")
      .populate({
        path: "images.specification",
        model: "Specification"
      })
      .lean();

    if (!updatedProduct) {
      throw new Error("Product not found !");
    }

    return updatedProduct || null;

  } catch (err) {
    throw err;
  }
};

export const deleteProducts = async (productIds: string[]) => {
  try {
    if (!productIds || productIds.length === 0) {
      throw new Error("Product IDs list is required and cannot be empty");
    }

    // 1. Fetch products to get image URLs and specification IDs
    const products = await Product.find({ _id: { $in: productIds } }).lean();
    if (products.length === 0) return { deletedCount: 0 };

    const specIdsSet = new Set<string>();
    const imageUrlsSet = new Set<string>();

    products.forEach((p: any) => {
      // Collect specifications from the product's specifications array
      if (p.specifications && Array.isArray(p.specifications)) {
        p.specifications.forEach((id: any) => specIdsSet.add(id.toString()));
      }

      // Collect specifications from the images array (some images have specific specs)
      if (p.images && Array.isArray(p.images)) {
        p.images.forEach((img: any) => {
          if (img.specification) specIdsSet.add(img.specification.toString());
          if (img.uri) imageUrlsSet.add(img.uri);
        });
      }

      // Collect thumbnail URL
      if (p.thumbNail) imageUrlsSet.add(p.thumbNail);
    });

    const specIds = Array.from(specIdsSet);
    const imageUrls = Array.from(imageUrlsSet);

    // 2. Fetch and Freeze Purchases
    // We update purchases associated with these products to keep their details
    const relatedPurchases = await Purchase.find({ 
      product: { $in: productIds },
      status: { $in: ["ordered", "delivered"] }
    }).lean();

    if (relatedPurchases.length > 0) {
      const specs = await Specification.find({ _id: { $in: specIds } }).lean();
      
      for (const purchase of relatedPurchases) {
        const product = products.find(p => p._id.toString() === purchase.product?.toString());
        const spec = specs.find(s => s._id.toString() === purchase.specification?.toString());

        await Purchase.findByIdAndUpdate(purchase._id, {
          $set: {
            productName: (product as any)?.name || null,
            productThumb: (product as any)?.thumbNail || (product as any)?.images?.[0] || null,
            specPrice: (spec as any)?.price || 0,
            specColor: (spec as any)?.color || null,
            specSize: (spec as any)?.size || null,
            productId: purchase.product?.toString()
          }
        });
      }
    }

    // 3. Delete images from Cloudinary
    if (imageUrls.length > 0) {
      await deleteCloudinaryImages(imageUrls);
    }

    // 4. Delete specifications from DB
    if (specIds.length > 0) {
      await Specification.deleteMany({ _id: { $in: specIds } });
    }

    // 5. Delete associated data (Likes, Evaluations, Transient Purchases)
    // viewed and inCart purchases are deleted because the client can no longer buy them
    await Promise.all([
      Like.deleteMany({ product: { $in: productIds } }),
      Evaluation.deleteMany({ product: { $in: productIds } }),
      Purchase.deleteMany({
        product: { $in: productIds },
        status: { $in: ["viewed", "inCart"] }
      })
    ]);

    // 6. Delete products from DB
    const result = await Product.deleteMany({ _id: { $in: productIds } });

    return result;
  } catch (err: any) {
    throw err;
  }
};

export const hideProducts = async (productIds: string[], status: ProductStatus = "archived") => {
  try {
    if (!productIds || productIds.length === 0) {
      throw new Error("Product IDs list is required and cannot be empty");
    }

    const result = await Product.updateMany(
      { _id: { $in: productIds } },
      { $set: { status: status } }
    );

    return result;
  } catch (err: any) {
    throw err;
  }
};

export const getProductsSalesAnalytics = async (
  from?: number,
  to?: number,
  limit: number = 10,
  skip: number = 0,
  status: ProductStatus[] = ["active"]
) => {
  try {
    const matchStage: any = { 'orderDoc.status': 'delivered' };

    if (from && to) {
      const startDate = new Date(Number(from));
      const endDate = new Date(Number(to));
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      matchStage['orderDoc.updatedAt'] = {
        $gte: startDate,
        $lte: endDate
      };
    }

    const products = await Purchase.aggregate([
      {
        $lookup: {
          from: 'orders',
          localField: 'order',
          foreignField: '_id',
          as: 'orderDoc'
        }
      },
      { $unwind: '$orderDoc' },
      { $match: matchStage },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' },
      { $match: { 'productInfo.status': { $in: status } } },
      {
        // Fetch specifications to get the correct price for each item
        $lookup: {
          from: 'specifications',
          localField: 'specification',
          foreignField: '_id',
          as: 'specInfo'
        }
      },
      { $unwind: { path: '$specInfo', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$product',
          name: { $first: '$productInfo.name.en' },
          image: { $first: '$productInfo.thumbNail' },
          // 1. Group total items sold (Quantity)
          totalSales: { $sum: '$quantity' },
          // 2. Group total revenue (Quantity x Specification Price)
          totalRevenue: {
            $sum: {
              $multiply: [
                "$quantity",
                { $ifNull: ["$specInfo.price", "$productInfo.price"] } // Use base product price as fallback
              ]
            }
          }
        }
      },
      { $sort: { totalSales: -1, totalRevenue: -1 } },
      { $skip: skip },
      { $limit: limit }
    ]);

    return products;
  } catch (error) {
    throw error;
  }
};

export const getProductAnalytics = async (productId: string) => {
  try {
    const pId = new Types.ObjectId(productId);

    // 1. Sales & Revenue from delivered orders
    const salesData = await Purchase.aggregate([
      {
        $lookup: {
          from: 'orders',
          localField: 'order',
          foreignField: '_id',
          as: 'orderDoc'
        }
      },
      { $unwind: '$orderDoc' },
      {
        $match: {
          product: pId,
          'orderDoc.status': 'delivered'
        }
      },
      {
        $lookup: {
          from: 'specifications',
          localField: 'specification',
          foreignField: '_id',
          as: 'specInfo'
        }
      },
      { $unwind: { path: '$specInfo', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'clients',
          localField: 'client',
          foreignField: '_id',
          as: 'clientInfo'
        }
      },
      { $unwind: { path: '$clientInfo', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$product',
          totalQuantity: { $sum: '$quantity' },
          totalRevenue: {
            $sum: {
              $multiply: [
                '$quantity',
                { $ifNull: ['$specInfo.price', 0] }
              ]
            }
          },
          orders: { $addToSet: '$order' },
          revenueDetails: {
            $push: {
              clientId: '$clientInfo._id',
              clientName: '$clientInfo.fullName',
              orderNumber: '$orderDoc.orderNumber',
              date: '$orderDoc.updatedAt',
              quantity: '$quantity',
              amount: { $multiply: ['$quantity', { $ifNull: ['$specInfo.price', 0] }] }
            }
          }
        }
      },
      {
        $project: {
          totalQuantity: 1,
          totalRevenue: 1,
          orderCount: { $size: '$orders' },
          revenueDetails: 1
        }
      }
    ]);

    // 2. Favorites count from the Like collection
    const favorites = await Like.find({ product: pId }).populate('client', 'fullName').lean();
    const favoriteDetails = favorites.map(f => ({
      clientId: (f.client as any)?._id,
      clientName: (f.client as any)?.fullName || 'Someone',
      date: (f as any).createdAt
    }));

    // 3. Count currently in carts
    const inCartData = await Purchase.aggregate([
      {
        $match: {
          product: pId,
          status: 'inCart'
        }
      },
      {
        $lookup: {
          from: 'clients',
          localField: 'client',
          foreignField: '_id',
          as: 'clientInfo'
        }
      },
      { $unwind: { path: '$clientInfo', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: null,
          count: { $sum: '$quantity' },
          details: {
            $push: {
              clientId: '$clientInfo._id',
              clientName: '$clientInfo.fullName',
              quantity: '$quantity',
              date: '$updatedAt'
            }
          }
        }
      }
    ]);
    const inCartCount = inCartData[0]?.count || 0;
    const inCartDetails = inCartData[0]?.details || [];

    const stats = (salesData && salesData.length > 0) ? salesData[0] : { totalQuantity: 0, totalRevenue: 0, orderCount: 0, revenueDetails: [] };

    return {
      ...stats,
      favoriteCount: favorites.length,
      favoriteDetails,
      inCartCount,
      inCartDetails
    };

  } catch (error) {
    throw error;
  }
};