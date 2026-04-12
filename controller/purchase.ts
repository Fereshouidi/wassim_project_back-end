import Purchase from "../models/purchase.js";
import { PurchaseType } from "../types/index.js";
import Specification from '../models/specification.js';
import { createNotification } from "./notification.js";
import Product from "../models/product.js";


export const addPurchase = async (purchaseData: PurchaseType) => {

    try {
        // Fetch product and specification to save static details
        const spec = await Specification.findById(purchaseData.specification);
        const prod = await Product.findById(purchaseData.product);

        const newPurchase = new Purchase({
            ...purchaseData,
            productId: purchaseData.product?.toString(),
            productName: (prod as any)?.name || null,
            productThumb: (prod as any)?.thumbNail || null,
            specPrice: (spec as any)?.price || 0,
            specColor: (spec as any)?.color || null,
            specSize: (spec as any)?.size || null
        });

        // Stock Reservation Logic (for direct Add to Cart)
        if (purchaseData.status === "inCart" && spec && !spec.unlimited) {
            await Specification.findByIdAndUpdate(
                spec._id,
                { $inc: { quantity: -(purchaseData.quantity || 1) } }
            );
        }

        await newPurchase.save();

        const populatedPurchase = await Purchase.findOne({ _id: newPurchase._id })
            .populate('specification')
            .populate('product')
            .populate('client')
            .lean()

        if (purchaseData.status === "inCart" && populatedPurchase) {
            const clientName = (populatedPurchase.client as any)?.fullName || "A client";
            const productName = (populatedPurchase.product as any)?.name?.en || (populatedPurchase.product as any)?.name?.fr || "a product";

            await createNotification(
                "Product Added To Cart",
                `${clientName} added ${productName} to their cart.`,
                "add_to_cart",
                (populatedPurchase.client as any)?._id?.toString() || populatedPurchase.client?.toString(),
                (populatedPurchase.client as any)?._id?.toString() || populatedPurchase.client?.toString(),
                (populatedPurchase.product as any)?._id?.toString() || populatedPurchase.product?.toString(),
                { quantity: populatedPurchase.quantity, spec: populatedPurchase.specification }
            );
        }

        return populatedPurchase;
    } catch (err) {
        throw err;
    }

}

export const updatePurchase = async (updatedData: PurchaseType) => {

    try {
        const oldPurchase = await Purchase.findById(updatedData._id).populate('specification').lean();
        if (!oldPurchase) throw new Error("Purchase not found");

        const oldStatus = oldPurchase.status;
        const newStatus = updatedData.status;

        // Stock Management (Reservation)
        if (newStatus === "inCart" && oldStatus !== "inCart") {
            // Check for specification and decrement stock
            if (oldPurchase.specification && !(oldPurchase.specification as any).unlimited) {
                await Specification.findByIdAndUpdate(
                    (oldPurchase.specification as any)._id,
                    { $inc: { quantity: -(updatedData.quantity || oldPurchase.quantity || 1) } }
                );
            }
        } else if (oldStatus === "inCart" && newStatus !== "inCart" && newStatus !== "ordered") {
            // Return stock (removed from cart, but NOT if it was ordered which handled elsewhere)
            if (oldPurchase.specification && !(oldPurchase.specification as any).unlimited) {
                await Specification.findByIdAndUpdate(
                    (oldPurchase.specification as any)._id,
                    { $inc: { quantity: oldPurchase.quantity || 1 } }
                );
            }
        } else if (oldStatus === "inCart" && newStatus === "inCart" && updatedData.quantity !== undefined && updatedData.quantity !== oldPurchase.quantity) {
            // Adjust stock for quantity change in cart
            if (oldPurchase.specification && !(oldPurchase.specification as any).unlimited) {
                const diff = (updatedData.quantity || 1) - (oldPurchase.quantity || 1);
                await Specification.findByIdAndUpdate(
                    (oldPurchase.specification as any)._id,
                    { $inc: { quantity: -diff } }
                );
            }
        }

        const updatedPurchase = await Purchase.findOneAndUpdate(
            { _id: updatedData._id },
            updatedData,
            { new: true }
        )
            .populate('specification')
            .populate('product')
            .populate('client')
            .lean();

        if (updatedData.status === "inCart" && updatedPurchase) {
            const clientName = (updatedPurchase as any)?.client?.fullName || "A client";
            const productName = (updatedPurchase as any)?.product?.name?.en || (updatedPurchase as any)?.product?.name?.fr || "a product";

            await createNotification(
                "Product Added To Cart",
                `${clientName} added ${productName} to their cart.`,
                "add_to_cart",
                (updatedPurchase as any)?.client?._id?.toString() || (updatedPurchase as any)?.client?.toString(),
                (updatedPurchase as any)?.client?._id?.toString() || (updatedPurchase as any)?.client?.toString(),
                (updatedPurchase as any)?.product?._id?.toString() || (updatedPurchase as any)?.product?.toString(),
                { quantity: updatedPurchase?.quantity, spec: updatedPurchase?.specification }
            );
        } else if (updatedData.status === "viewed" && updatedPurchase && oldStatus === "inCart") {
            const clientName = (updatedPurchase as any)?.client?.fullName || "A client";
            const productName = (updatedPurchase as any)?.product?.name?.en || (updatedPurchase as any)?.product?.name?.fr || "a product";

            await createNotification(
                "Product Removed From Cart",
                `${clientName} removed ${productName} from their cart.`,
                "remove_from_cart",
                (updatedPurchase as any)?.client?._id?.toString() || (updatedPurchase as any)?.client?.toString(),
                (updatedPurchase as any)?.client?._id?.toString() || (updatedPurchase as any)?.client?.toString(),
                (updatedPurchase as any)?.product?._id?.toString() || (updatedPurchase as any)?.product?.toString()
            );
        }

        return updatedPurchase;
    } catch (err) {
        throw err;
    }

}

export const removePurchase = async (purchaseId: string) => {
    try {
        const purchase = await Purchase.findById(purchaseId).populate('specification').lean();
        if (!purchase) return null;

        // Stock recovery if it was in cart
        if (purchase.status === "inCart") {
            if (purchase.specification && !(purchase.specification as any).unlimited) {
                await Specification.findByIdAndUpdate(
                    (purchase.specification as any)._id,
                    { $inc: { quantity: purchase.quantity || 1 } }
                );
            }
        }

        await Purchase.findByIdAndDelete(purchaseId);
        return purchase;
    } catch (err) {
        throw err;
    }
}

export const getPurchaseByClientAndProduct = async (clientId: string, productId: string) => {

    try {

        const purchase = await Purchase.findOne({
            client: clientId,
            product: productId,
            status: { $in: ["viewed"] }
        })
            .populate('specification')
            .populate("product")
            .lean()
        return purchase;

    } catch (err) {
        throw err;
    }

}

export const getPurchaseById = async (purchaseId: string) => {

    try {

        const purchase = await Purchase.findOne({ _id: purchaseId })
            .populate('specification')
            .populate("product")
            .lean()
        return purchase;

    } catch (err) {
        throw err;
    }

}



export const getPurchasesInCartByClient = async (clientId: string) => {



    try {

        const purchases = await Purchase.find({
            client: clientId,
            status: "inCart"
        })
            .populate('product')
            .populate('specification')
            .lean();

        return purchases;

    } catch (err) {
        throw err;
    }

}

export const setOrderToPurchase = async (
    purchaseId: string,
    orderId: string
) => {
    try {
        const updatedPurchase = await Purchase.findByIdAndUpdate(
            purchaseId,
            { $set: { order: orderId, status: "ordered" } },
            { new: true }
        )
            .populate('product')
            .populate('specification')
            .lean();

        return updatedPurchase;
    } catch (err) {
        throw err;
    }
};

export const unsetcartToPurchase = async (
    purchaseId: string,
) => {
    try {
        const updatedPurchase = await Purchase.findByIdAndUpdate(
            purchaseId,
            { $set: { cart: null } },
            { new: true }
        )
            .populate('product')
            .populate('specification')
            .lean();

        return updatedPurchase;
    } catch (err) {
        throw err;
    }
};

export const getdeliveredOrdersByClientAndProduct = async (productId: string, clientId: string) => {
    try {
        const purchases = await Purchase.find({
            client: clientId,
            product: productId,
            order: { $ne: null }
        })
            .populate({
                path: 'order',
                match: { status: 'delivered' }
            })
            .lean();

        const deliveredPurchases = purchases.filter(p => p.order !== null);

        return deliveredPurchases;
    } catch (error) {
        return [];
    }
};

export const getProfitsByDate = async (from: number, to: number) => {
    try {
        // 1. Define current period range
        const startDate = new Date(Number(from));
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(Number(to));
        endDate.setHours(23, 59, 59, 999);

        // 2. Calculate previous period for comparison (Trend)
        const duration = endDate.getTime() - startDate.getTime() + 1;
        const previousStartDate = new Date(startDate.getTime() - duration);
        const previousEndDate = new Date(startDate.getTime() - 1);

        // Helper function to fetch and aggregate data
        const fetchProfits = async (start: Date, end: Date) => {
            return await Purchase.aggregate([
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
                        'orderDoc.status': 'delivered',
                        'orderDoc.updatedAt': { $gte: start, $lte: end }
                    }
                },
                {
                    $lookup: {
                        from: 'specifications',
                        localField: 'specification',
                        foreignField: '_id',
                        as: 'specData'
                    }
                },
                { $unwind: { path: '$specData', preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        day: { $dateToString: { format: "%Y-%m-%d", date: "$orderDoc.updatedAt" } },
                        itemRevenue: { $multiply: [{ $ifNull: ["$specData.price", 0] }, "$quantity"] },
                        shipping: { $ifNull: ["$orderDoc.shippingCoast", 0] }
                    }
                },
                {
                    $group: {
                        _id: "$day",
                        profit: { $sum: { $add: ["$itemRevenue", "$shipping"] } }
                    }
                },
                { $sort: { "_id": 1 } },
                {
                    $project: {
                        _id: 0,
                        date: "$_id",
                        profit: "$profit"
                    }
                }
            ]);
        };

        // 3. Fetch current and previous period data
        const [currentProfits, previousProfitsData] = await Promise.all([
            fetchProfits(startDate, endDate),
            fetchProfits(previousStartDate, previousEndDate)
        ]);

        // 4. Calculate total for each period to extract Trend
        const currentTotal = currentProfits.reduce((acc, curr) => acc + curr.profit, 0);
        const previousTotal = previousProfitsData.reduce((acc, curr) => acc + curr.profit, 0);

        let trendValue = 0;
        if (previousTotal > 0) {
            trendValue = ((currentTotal - previousTotal) / previousTotal) * 100;
        } else {
            trendValue = currentTotal > 0 ? 100 : 0;
        }

        // Return detailed profits (for chart) and Trend (for badge)
        return {
            profits: currentProfits,
            trend: trendValue.toFixed(1)
        };

    } catch (error) {
        throw error;
    }
};

export const getTotalSalesByDateRange = async (from: number, to: number) => {
    try {
        // 1. Convert timestamps and date objects to ensure full day coverage
        const currentFrom = new Date(Number(from));
        currentFrom.setHours(0, 0, 0, 0);

        const currentTo = new Date(Number(to));
        currentTo.setHours(23, 59, 59, 999);

        // 2. Calculate previous period for comparison (to extract Trend)
        const duration = currentTo.getTime() - currentFrom.getTime() + 1;
        const previousFrom = new Date(currentFrom.getTime() - duration);
        const previousTo = new Date(currentFrom.getTime() - 1);

        // Internal function to perform Aggregate (same logic as profits exactly)
        const getSum = async (startDate: Date, endDate: Date) => {
            const result = await Purchase.aggregate([
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
                        'orderDoc.status': 'delivered',
                        'orderDoc.updatedAt': { $gte: startDate, $lte: endDate }
                    }
                },
                {
                    $lookup: {
                        from: 'specifications',
                        localField: 'specification',
                        foreignField: '_id',
                        as: 'specData'
                    }
                },
                { $unwind: { path: '$specData', preserveNullAndEmptyArrays: true } },
                {
                    $group: {
                        _id: null,
                        total: {
                            $sum: {
                                $add: [
                                    { $multiply: [{ $ifNull: ["$specData.price", 0] }, "$quantity"] },
                                    { $ifNull: ["$orderDoc.shippingCoast", 0] }
                                ]
                            }
                        }
                    }
                }
            ]);
            return result.length > 0 ? result[0].total : 0;
        };

        // 3. fetch totals for both periods
        const [currentTotal, previousTotal] = await Promise.all([
            getSum(currentFrom, currentTo),
            getSum(previousFrom, previousTo)
        ]);

        // 4. Calculate percentage (Trend)
        let trendValue = 0;
        if (previousTotal > 0) {
            trendValue = ((currentTotal - previousTotal) / previousTotal) * 100;
        } else {
            trendValue = currentTotal > 0 ? 100 : 0;
        }

        return {
            totalSales: currentTotal,
            trend: trendValue.toFixed(1)
        };

    } catch (error) {
        throw error;
    }
};