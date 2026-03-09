import express from 'express';
import { Server } from "socket.io";
import { ProductType, PurchaseType } from "../types/index.js";
import { addPurchase, getdeliveredOrdersByClientAndProduct, getProfitsByDate, getPurchaseByClientAndProduct, getPurchaseById, getPurchasesInCartByClient, updatePurchase } from "../controller/purchase.js";
import { getProductById } from '../controller/product.js';
import Purchase from '../models/purchase.js';


export const addPurchase_ = async (
    // purchaseData: PurchaseType,
    req: express.Request,
    res: express.Response
) => {

    try {

        const { purchaseData } = req.body;



        if (!purchaseData.client || !purchaseData.product) {
            return res.status(404).json({
                message: "error : both of client and product are required !",
            })
        }

        const newPurchase = await addPurchase(purchaseData);

        return res.status(201).json({
            message: "new purchase has been added successfuly!",
            newPurchase
        })

    } catch (err: any) {
        if (err.message.includes("Missing required fields")) {
            return res.status(400).json({ message: err.message });
        }

        res.status(500).json({ message: err.message });
    }
}

export const updatePurchase__ = async (req: express.Request, res: express.Response) => {
    try {
        const updatedData: PurchaseType = req.body;

        if (!updatedData.client || !updatedData.product) {
            return res.status(400).json({
                error: true,
                message: "Error: Both client and product are required!",
            });
        }

        let purchase;
        let isNew = false;

        //@ts-ignore
        if (updatedData._id && !updatedData._id.startsWith('temp-')) {
            // Update and return new data (ensure updatePurchase returns updated document)
            purchase = await updatePurchase(updatedData);
            isNew = false;
        } else {
            // Add new purchase
            purchase = await addPurchase(updatedData);
            isNew = true;
        }

        if (!purchase) throw new Error("Database operation failed");

        return res.status(isNew ? 201 : 200).json({
            success: true,
            message: isNew ? "Added to cart!" : "Updated successfully!",
            purchase // This returns full data (Populated)
        });

    } catch (err: any) {
        return res.status(500).json({ error: true, message: err.message });
    }
};

export const getPurchaseByClientAndProduct_ = async (req: express.Request, res: express.Response) => {
    try {
        const { clientId, productId } = req.query;

        if (!clientId || !productId) {
            return res.status(400).json({ message: "clientId and productId are required!" });
        }

        let purchase = await getPurchaseByClientAndProduct(clientId as string, productId as string);

        if (!purchase) {
            const product = await getProductById(productId as string) as any;
            if (!product) return res.status(404).json({ error: "Product not found" });

            // Create initial purchase process if it doesn't exist
            purchase = await addPurchase({
                client: clientId as string,
                product: productId as string,
                specification: product.specifications?.[0] || null,
                quantity: 1,
                status: 'viewed'
            } as any);
        }

        return res.status(200).json({ purchase });
    } catch (err: any) {
        return res.status(500).json({ message: err.message });
    }
};

export const getPurchaseById_ = async (req: express.Request, res: express.Response) => {

    try {

        const { purchaseId } = req.query;

        if (!purchaseId) return res.status(404).json({ message: "purchaseId is required !" });

        let purchase = await getPurchaseById(purchaseId as string);

        res.status(200).json({
            // message: "product has been added successfully",
            purchase
        })

    } catch (err: any) {
        if (err.message.includes("Missing required fields")) {
            return res.status(400).json({ message: err.message });
        }

        res.status(500).json({ message: err.message });
    }

}

export const getPurchasesInCartByClient_ = async (req: express.Request, res: express.Response) => {

    try {

        const { clientId } = req.query;



        if (!clientId) return res.status(404).json({ message: "clientId is required !" });

        let purchases = await getPurchasesInCartByClient(clientId as unknown as string);

        res.status(200).json({
            // message: "product has been added successfully",
            purchases
        })

    } catch (err: any) {
        if (err.message.includes("Missing required fields")) {
            return res.status(400).json({ message: err.message });
        }

        res.status(500).json({ message: err.message });
    }

}

export const verifyClientPurchase_ = async (req: express.Request, res: express.Response) => {
    try {
        // Receive IDs from params or body depending on your Route settings
        const { productId, clientId } = req.query;



        if (!productId || !clientId) {
            return res.status(400).json({
                success: false,
                message: "Both Product ID and Client ID are required."
            });
        }

        // Fetch array of purchases that reached 'delivered' status
        const deliveredPurchases = await getdeliveredOrdersByClientAndProduct(productId as string, clientId as string);

        // Verify if client has completed at least one purchase
        const isVerifiedPurchaser = deliveredPurchases.length > 0;

        return res.status(200).json({
            success: true,
            isVerifiedPurchaser: isVerifiedPurchaser,
            purchaseCount: deliveredPurchases.length,
            // Send purchase details if frontend needs dates or specs
            history: deliveredPurchases
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "An error occurred while verifying the purchase."
        });
    }
};

export const getProfitsByDate_ = async (req: express.Request, res: express.Response) => {
    try {
        const { from, to } = req.query;

        // Check for dates to ensure server doesn't crash
        if (!from || !to) {
            return res.status(400).json({
                message: "Please provide both 'from' and 'to' timestamps."
            });
        }

        // Convert values to numbers (as they come from Query as Strings)
        const fromTimestamp = Number(from);
        const toTimestamp = Number(to) || Date.now(); // fallback for current time

        // Call logic function written previously
        // This function now returns { profits: ProfitData[], trend: string }
        const analyticsData = await getProfitsByDate(fromTimestamp, toTimestamp);

        // Send ready data to Frontend
        return res.status(200).json(analyticsData);

    } catch (error: any) {
        return res.status(500).json({
            message: "Internal server error while fetching analytics.",
            error: error.message
        });
    }
};

export const getTotalSalesByDateRange_ = async (req: express.Request, res: express.Response) => {
    try {
        const { from, to } = req.query;

        if (!from || !to) {
            return res.status(400).json({ message: "Parameters 'from' and 'to' are required" });
        }

        // --- Start of requested logic function ---

        // 1. Convert Timestamps and Date objects to ensure covering the full day
        const currentFrom = new Date(Number(from));
        currentFrom.setHours(0, 0, 0, 0);

        const currentTo = new Date(Number(to));
        currentTo.setHours(23, 59, 59, 999);

        // 2. Calculate previous period for comparison (for Trend output)
        const duration = currentTo.getTime() - currentFrom.getTime() + 1;
        const previousFrom = new Date(currentFrom.getTime() - duration);
        const previousTo = new Date(currentFrom.getTime() - 1);

        // Internal function to execute Aggregate
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

        // 3. Fetch sum for both periods
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

        // --- End of logic function ---

        // Send final result as JSON response
        return res.status(200).json({
            totalSales: currentTotal,
            trend: trendValue.toFixed(1)
        });

    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

export const deletePurchase_ = async (req: express.Request, res: express.Response) => {
    try {
        const { id } = req.query;

        if (!id) {
            return res.status(400).json({ success: false, message: "Purchase ID is required" });
        }

        const deletedPurchase = await Purchase.findByIdAndDelete(id);

        if (!deletedPurchase) {
            return res.status(404).json({ success: false, message: "Purchase not found" });
        }

        return res.status(200).json({
            success: true,
            message: "Purchase removed successfully"
        });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};