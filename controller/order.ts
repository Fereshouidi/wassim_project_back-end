import Order from "../models/order.js";
import { OrderType } from "../types/index.js";
import { createNotification } from "./notification.js";

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
            .populate({
                path: "purchases",
                populate: [
                    { path: "client" },
                    { path: "product" },
                    { path: "specification" },
                ]
            })
            .sort({ createdAt: -1 })
            .lean();

        const failedOrders = await Order.find({ status: "failed" })
            .limit(limit)
            .populate({
                path: "purchases",
                populate: [
                    { path: "client" },
                    { path: "product" },
                    { path: "specification" },
                ]
            })
            .sort({ createdAt: -1 })
            .lean();

        const deliveredOrders = await Order.find({ status: "delivered" })
            .limit(limit)
            .populate({
                path: "purchases",
                populate: [
                    { path: "client" },
                    { path: "product" },
                    { path: "specification" },
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
            .populate({
                path: "purchases",
                populate: [
                    { path: "client" },
                    { path: "product" },
                    { path: "specification" },
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
            .populate({
                path: "purchases",
                populate: [
                    { path: "client" },
                    { path: "product" },
                    { path: "specification" },
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
                    { path: "product" },
                    { path: "client" },
                    { path: "specification" }
                ]
            })
            .sort({ createdAt: -1 });
    } catch (err) { return []; }
};

export const getOrderById = async (orderId: string) => {
    try {
        return await Order.findById(orderId)
            .populate("client")
            .populate({
                path: "purchases",
                populate: [
                    { path: "product" },
                    { path: "client" },
                    { path: "specification" }
                ]
            });
    } catch (err) { return null; }
};

export const getInationalOrdeByClient = async (clientId: string, limit: number) => {
    try {

        const pendingOrders = await Order.find({ status: "pending", client: clientId })
            .limit(limit)
            .populate({
                path: "purchases",
                populate: [
                    { path: "client" },
                    { path: "product" },
                    { path: "specification" },
                ]
            })
            .sort({ createdAt: -1 })
            .lean();

        const failedOrders = await Order.find({ status: "failed", client: clientId })
            .limit(limit)
            .populate({
                path: "purchases",
                populate: [
                    { path: "client" },
                    { path: "product" },
                    { path: "specification" },
                ]
            })
            .sort({ createdAt: -1 })
            .lean();

        const deliveredOrders = await Order.find({ status: "delivered", client: clientId })
            .limit(limit)
            .populate({
                path: "purchases",
                populate: [
                    { path: "client" },
                    { path: "product" },
                    { path: "specification" },
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

export const updateOrderStatus = async (orderId?: string, newStatus?: string) => {
    try {
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
                createdAt: { $gte: currentFrom, $lte: currentTo }
            }),
            Order.countDocuments({
                createdAt: { $gte: previousFrom, $lte: previousTo }
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
                populate: { path: "product" }
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
                $group: {
                    _id: "$_id",
                    orderDate: { $first: "$createdAt" },
                    shipping: { $first: { $ifNull: ["$shippingCoast", 0] } },
                    itemsTotal: {
                        $sum: {
                            $multiply: [
                                { $ifNull: ["$specData.price", 0] },
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