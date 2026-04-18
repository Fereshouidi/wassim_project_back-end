import Order from "../models/order.js";
import { OrderType, OwnerInfoType } from "../types/index.js";
import { createNotification } from "./notification.js";
import { getPurchasesInCartByClient, setOrderToPurchase } from "./purchase.js";

export const AddOrder = async (orderdata: OrderType) => {
    try {
        const newOrder = new Order(orderdata);
        await newOrder.save();

        // Populate client to get name for notification
        const populatedOrder = await Order.findById(newOrder._id).populate('client').lean();
        const clientName = (populatedOrder as any)?.client?.fullName || orderdata.fullName || "A client";

        await createNotification(
            "New Order Received",
            `${clientName} has placed a new order #${newOrder.orderNumber}.`,
            "new_order",
            newOrder._id.toString(),
            orderdata.client?.toString()
        );

        return newOrder

    } catch (err) {
        throw err;
    }
}

export const checkout = async (clientId: string, orderData: Partial<OrderType>) => {
    try {
        // 1. Get all items in cart
        const cartItems = await getPurchasesInCartByClient(clientId);
        if (cartItems.length === 0) throw new Error("Cart is empty");

        const lastOrder = await getLastOrderNumber() as OrderType;
        const ownerInfo = await getOwnerInfo() as unknown as OwnerInfoType

        // 2. Create the order
        const order = await AddOrder({
            ...orderData,
            shippingCoast: ownerInfo?.shippingCost,
            orderNumber: lastOrder ? (lastOrder.orderNumber || 0) + 1 : 1,
            client: clientId,
            status: "pending"
        } as OrderType);

        // 3. Link purchases to this order
        for (const item of cartItems) {
            await setOrderToPurchase(item._id.toString(), order._id.toString());
        }

        return order;
    } catch (err) {
        throw err;
    }
};

export const getLastOrderNumber = async () => {
    try {
        const lastOrder = await Order.findOne().sort({ orderNumber: -1 }) || 0;

        if (!lastOrder && lastOrder != 0) {
            throw new Error("No orders found");
        }

        return lastOrder;

    } catch (err) {
        throw err;
    }
}

export const getInationalOrderBatches = async (limit: number) => {
    try {

        const pendingOrders = await Order.find({ status: "pending" })
            .limit(limit)
            .populate("client")
            .populate({
                path: "purchases",
                populate: [
                    { path: "client" },
                    { path: "product" },
                    { path: "specification" },
                    { path: "customizedCharms.charm" }
                ]
            })
            .sort({ createdAt: -1 })
            .lean();

        const failedOrders = await Order.find({ status: "failed" })
            .limit(limit)
            .populate("client")
            .populate({
                path: "purchases",
                populate: [
                    { path: "client" },
                    { path: "product" },
                    { path: "specification" },
                    { path: "customizedCharms.charm" }
                ]
            })
            .sort({ createdAt: -1 })
            .lean();

        const deliveredOrders = await Order.find({ status: "delivered" })
            .limit(limit)
            .populate("client")
            .populate({
                path: "purchases",
                populate: [
                    { path: "client" },
                    { path: "product" },
                    { path: "specification" },
                    { path: "customizedCharms.charm" }
                ]
            })
            .sort({ createdAt: -1 })
            .lean();


        return {
            pendingOrders,
            failedOrders,
            deliveredOrders
        }

    } catch (err) {
        throw err;
    }
}

export const getOrdersByStatus = async (
    status: "pending" | "failed" | "delivered",
    limit: number,
    skip: number
) => {

    try {
        const filter = { status };

        const orders = await Order.find(filter)
            .limit(limit)
            .skip(skip)
            .populate("client")
            .populate({
                path: "purchases",
                populate: [
                    { path: "client" },
                    { path: "product", populate: { path: "specifications" } },
                    { path: "specification" },
                    { path: "customizedCharms.charm", populate: { path: "specifications" } },
                    { path: "customizedCharms.spec" }
                ],
            })
            .sort({ createdAt: -1 })
            .lean();

        return orders;
    } catch (err) {
        throw err;
    }

}

export const getOrdersByClientAndStatus = async (
    clientId: string,
    status: "pending" | "failed" | "delivered",
    limit: number,
    skip: number
) => {

    try {
        const filter = { status, client: clientId };

        const orders = await Order.find(filter)
            .limit(limit)
            .skip(skip)
            .populate("client")
            .populate({
                path: "purchases",
                populate: [
                    { path: "client" },
                    { path: "product", populate: { path: "specifications" } },
                    { path: "specification" },
                    { path: "customizedCharms.charm", populate: { path: "specifications" } },
                    { path: "customizedCharms.spec" }
                ],
            })
            .sort({ createdAt: -1 })
            .lean();

        return orders;
    } catch (err) {
        throw err;
    }

}

export const getOrdersByClient = async (clientId: string) => {
    try {
        return await Order.find({ client: clientId })
            .populate("client")
            .populate({
                path: "purchases",
                populate: [
                    { path: "product", populate: { path: "specifications" } },
                    { path: "client" },
                    { path: "specification" },
                    { path: "customizedCharms.charm", populate: { path: "specifications" } },
                    { path: "customizedCharms.spec" }
                ]
            })
            .sort({ createdAt: -1 })
            .lean();
    } catch (err) { return []; }
};

export const getOrderById = async (orderId: string) => {
    try {
        return await Order.findById(orderId)
            .populate("client")
            .populate({
                path: "purchases",
                populate: [
                    { path: "product", populate: { path: "specifications" } },
                    { path: "client" },
                    { path: "specification" },
                    { path: "customizedCharms.charm", populate: { path: "specifications" } },
                    { path: "customizedCharms.spec" }
                ]
            });
    } catch (err) { return null; }
};

export const getInationalOrdeByClient = async (clientId: string, limit: number) => {
    try {

        const pendingOrders = await Order.find({ status: "pending", client: clientId })
            .limit(limit)
            .populate("client")
            .populate({
                path: "purchases",
                populate: [
                    { path: "client" },
                    { path: "product", populate: { path: "specifications" } },
                    { path: "specification" },
                    { path: "customizedCharms.charm", populate: { path: "specifications" } },
                    { path: "customizedCharms.spec" }
                ]
            })
            .sort({ createdAt: -1 })
            .lean();

        const failedOrders = await Order.find({ status: "failed", client: clientId })
            .limit(limit)
            .populate("client")
            .populate({
                path: "purchases",
                populate: [
                    { path: "client" },
                    { path: "product", populate: { path: "specifications" } },
                    { path: "specification" },
                    { path: "customizedCharms.charm", populate: { path: "specifications" } },
                    { path: "customizedCharms.spec" }
                ]
            })
            .sort({ createdAt: -1 })
            .lean();

        const deliveredOrders = await Order.find({ status: "delivered", client: clientId })
            .limit(limit)
            .populate("client")
            .populate({
                path: "purchases",
                populate: [
                    { path: "client" },
                    { path: "product", populate: { path: "specifications" } },
                    { path: "specification" },
                    { path: "customizedCharms.charm", populate: { path: "specifications" } },
                    { path: "customizedCharms.spec" }
                ]
            })
            .sort({ createdAt: -1 })
            .lean();


        return {
            pendingOrders,
            failedOrders,
            deliveredOrders
        }

    } catch (err) {
        throw err;
    }
}

export const getOrderCount = async (status?: "pending" | "delivered" | "failed", clientId?: string) => {
    try {

        const filter: any = {};

        if (status) {
            filter.status = status;
        }

        if (clientId) {
            filter.client = clientId;
        }

        const count = await Order.countDocuments(filter);
        return count;

    } catch (err) {
        throw err;
    }
}

export const deleteOrderById = async (orderId?: string) => {
    try {

        const isDone = await Order.findOneAndDelete({ _id: orderId })
        return isDone;

    } catch (err) {
        throw err;
    }
}

import Specification from "../models/specification.js";
import { getOwnerInfo } from "./ownerInfo.js";

export const updateOrderStatus = async (orderId?: string, newStatus?: string) => {
    try {
        const currentOrder = await Order.findById(orderId).populate({
            path: 'purchases',
            populate: { path: 'specification' }
        });

        if (!currentOrder) return null;

        const oldStatus = currentOrder.status;

        // Stock Reversion Logic
        if (newStatus === "failed" && oldStatus !== "failed") {
            // Revert stock (add back)
            for (const purchase of ((currentOrder as any).purchases as any[])) {
                if (purchase?.specification && !purchase.specification.unlimited) {
                    await Specification.findByIdAndUpdate(
                        purchase.specification._id,
                        { $inc: { quantity: purchase.quantity || 0 } }
                    );
                }
            }
        } else if (oldStatus === "failed" && newStatus !== "failed") {
            // Re-deduct stock
            for (const purchase of ((currentOrder as any).purchases as any[])) {
                if (purchase?.specification && !purchase.specification.unlimited) {
                    await Specification.findByIdAndUpdate(
                        purchase.specification._id,
                        { $inc: { quantity: -(purchase.quantity || 0) } }
                    );
                }
            }
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            { status: newStatus },
            { new: true }
        );

        return updatedOrder;

    } catch (err) {
        throw err;
    }
}

export const getOrdersAnalytics = async (from: number, to: number) => {
    try {
        // 1. Set current period dates to include the full day
        const currentFrom = new Date(from);
        currentFrom.setHours(0, 0, 0, 0);

        const currentTo = new Date(to);
        currentTo.setHours(23, 59, 59, 999);

        // 2. Calculate the length of the selected time period (in milliseconds)
        // Added 1 to ensure the whole day is calculated
        const duration = currentTo.getTime() - currentFrom.getTime() + 1;

        // 3. Define previous period for comparison (exactly same length)
        const previousFrom = new Date(currentFrom.getTime() - duration);
        const previousTo = new Date(currentFrom.getTime() - 1); // Ends just before the current period starts

        // 4. Fetch data for both periods simultaneously using countDocuments
        const [currentCount, previousCount] = await Promise.all([
            Order.countDocuments({
                updatedAt: { $gte: currentFrom, $lte: currentTo },
                status: 'delivered'
            }),
            Order.countDocuments({
                updatedAt: { $gte: previousFrom, $lte: previousTo },
                status: 'delivered'
            })
        ]);

        // 5. Calculate Trend percentage
        let trendValue = 0;
        if (previousCount > 0) {
            trendValue = ((currentCount - previousCount) / previousCount) * 100;
        } else {
            // If there were no orders in the previous period
            trendValue = currentCount > 0 ? 100 : 0;
        }

        return {
            totalOrders: currentCount,
            trend: trendValue.toFixed(1) // Returns a value like "12.5" or "-5.2"
        };
    } catch (err) {
        throw err;
    }
};

export const getOrdersDetailsByDateRange = async (from: number, to: number, status?: string, limit: number = 5, skip: number = 0) => {
    try {
        const start = new Date(from);
        start.setHours(0, 0, 0, 0);
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);

        const filter: any = {
            createdAt: { $gte: start, $lte: end }
        };

        if (status) {
            filter.status = status;
        }

        return await Order.find(filter)
            .populate("client")
            .populate({
                path: "purchases",
                populate: [
                    { path: "product" },
                    { path: "specification" },
                    { path: "customizedCharms.charm", populate: { path: "specifications" } },
                    { path: "customizedCharms.spec" }
                ]
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
    } catch (err) {
        throw err;
    }
};

export const getDailySalesByDateRange = async (from: number, to: number, limit: number, skip: number) => {
    try {
        const start = new Date(from);
        start.setHours(0, 0, 0, 0);
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);

        const aggregation = await Order.aggregate([
            { $match: { createdAt: { $gte: start, $lte: end }, status: "delivered" } },
            {
                $lookup: {
                    from: 'purchases',
                    localField: '_id',
                    foreignField: 'order',
                    as: 'orderPurchases'
                }
            },
            {
                $unwind: { path: '$orderPurchases', preserveNullAndEmptyArrays: true }
            },
            {
                $lookup: {
                    from: 'specifications',
                    localField: 'orderPurchases.specification',
                    foreignField: '_id',
                    as: 'specData'
                }
            },
            {
                $unwind: { path: '$specData', preserveNullAndEmptyArrays: true }
            },
            {
                $lookup: {
                    from: 'specifications',
                    localField: 'orderPurchases.customizedCharms.spec',
                    foreignField: '_id',
                    as: 'charmsSpecs'
                }
            },
            {
                $addFields: {
                    charmsTotal: {
                        $reduce: {
                            input: { $ifNull: ["$orderPurchases.customizedCharms", []] },
                            initialValue: 0,
                            in: {
                                $add: [
                                    "$$value",
                                    {
                                        $let: {
                                            vars: {
                                                foundSpec: {
                                                    $arrayElemAt: [
                                                        {
                                                            $filter: {
                                                                input: { $ifNull: ["$charmsSpecs", []] },
                                                                as: "cs",
                                                                cond: { $eq: ["$$cs._id", "$$this.spec"] }
                                                            }
                                                        },
                                                        0
                                                    ]
                                                }
                                            },
                                            in: { $ifNull: ["$$foundSpec.price", 0] }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            },
            {
                $group: {
                    _id: "$_id",
                    orderDate: { $first: "$createdAt" },
                    shipping: { $first: { $ifNull: ["$shippingCoast", 0] } },
                    itemsTotal: {
                        $sum: {
                            $multiply: [
                                { $add: [{ $ifNull: ["$specData.price", { $ifNull: ["$orderPurchases.specPrice", 0] }] }, { $ifNull: ["$charmsTotal", 0] }] },
                                { $ifNull: ["$orderPurchases.quantity", 0] }
                            ]
                        }
                    }
                }
            },
            {
                $project: {
                    orderTotal: { $add: ["$itemsTotal", "$shipping"] },
                    day: { $dateToString: { format: "%Y-%m-%d", date: "$orderDate" } },
                    orderDate: 1
                }
            },
            {
                $group: {
                    _id: "$day",
                    totalSales: { $sum: "$orderTotal" },
                    orderCount: { $sum: 1 },
                    timestamp: { $first: "$orderDate" }
                }
            },
            { $sort: { _id: -1 } },
            { $skip: skip },
            { $limit: limit }
        ]);

        return aggregation.map(day => ({
            _id: day._id,
            date: day._id,
            totalSales: day.totalSales,
            orderCount: day.orderCount,
            avgValue: day.orderCount > 0 ? (day.totalSales / day.orderCount) : 0,
            timestamp: day.timestamp
        }));
    } catch (err) {
        throw err;
    }
};