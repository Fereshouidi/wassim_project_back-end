import express from "express";
import { getAdminsByAccesses } from "../controller/admin.js";
import { getClientById, updateClient } from "../controller/client.js";
import { AddOrder, getDailySalesByDateRange, getInationalOrdeByClient, getInationalOrderBatches, getLastOrderNumber, getOrderById, getOrderCount, getOrdersAnalytics, getOrdersByClientAndStatus, getOrdersByStatus, getOrdersDetailsByDateRange, updateOrderStatus } from "../controller/order.js";
import { getOwnerInfo } from "../controller/ownerInfo.js";
import { getPurchaseById, setOrderToPurchase, unsetcartToPurchase } from "../controller/purchase.js";
import { sendPushNotification } from "../services/notificationService.js";
import Specification from "../models/specification.js";
import { OrderType } from "../types/index.js";

// export const AddOrder_ = async (
//     orderForm: OrderType,
//     purchasesId: string[],
//     socket: Server
// ) => {
//     try {

//         if (!purchasesId || purchasesId.length === 0) {
//             throw new Error("No purchases provided");
//         }

//         const firstPurchase = await getPurchaseById(purchasesId[0]) as unknown as PurchaseType;

//         if (!firstPurchase?._id) {
//             throw new Error("Invalid purchase ID");
//         }

//         if (firstPurchase.client) {
//             try {
//                 await updateClient({
//                     _id: firstPurchase.client,
//                     address: orderForm.address,
//                     email: orderForm.email,
//                     fullName: orderForm?.fullName,
//                     phone: orderForm.phone
//                 });
//             } catch (updateErr: any) {
//                 if (updateErr.code === 11000) {
//                     const duplicateField = Object.keys(updateErr.keyPattern || {})[0];
//                     socket.emit("receive_update_purchase_result", {
//                         message: `${ duplicateField === 'email' ? 'Email' : 'Phone number' } already exists for another client`,
//                         error: true
//                     });
//                     return;
//                 }
//                 throw updateErr;
//             }
//         }

//         const lastOrderNumber = await getLastOrderNumber();
//         orderForm.orderNumber = lastOrderNumber ? lastOrderNumber.orderNumber + 1 : 1;

//         const newOrder = await AddOrder(orderForm) as unknown as OrderType;

//         if (!newOrder?._id) {
//             throw new Error("Failed to create order");
//         }

//         // Update all purchases
//         const updatedPurchases = await Promise.all(
//             purchasesId.map(async (purchaseId) => {
//                 try {
//                     let purchase = await getPurchaseById(purchaseId) as unknown as PurchaseType;

//                     if (!purchase?._id) {
//                         return null;
//                     }

//                     purchase = await setOrderToPurchase(purchaseId, newOrder._id as string) as unknown as PurchaseType;

//                     purchase = await unsetcartToPurchase(purchaseId) as unknown as PurchaseType;

//                     socket.emit("receive_update_purchase_result", {
//                         message: "Purchase updated successfully!",
//                         purchase
//                     });

//                     return purchase;
//                 } catch (purchaseErr) {
//                     return null;
//                 }
//             })
//         );

//         socket.emit("receive_new_order", {
//             message: "A new order has been added successfully!",
//             newOrder
//         });

//     } catch (err: any) {
//         socket.emit("receive_update_purchase_result", {
//             message: err.message || "An error occurred while adding a new order",
//             error: true
//         });
//     }
// }

// export const getInationalOrderBatches_ = async (
//         limit: number,
//         socket: Server
//     ) => {
//         try {

//             const orders = await getInationalOrderBatches(limit) as unknown as OrderType;

//             const pendingOrdersCount = await getOrderCount("pending");
//             const failedOrdersCount = await getOrderCount("failed");
//             const deliveredOrdersCount = await getOrderCount("delivered");


//             socket.emit("receive_order", {
//                 orders,
//                 pendingOrdersCount,
//                 failedOrdersCount,
//                 deliveredOrdersCount
//             });

//         } catch (err) {

//             socket.emit("receive_order", {
//                 message: "An error occurred while adding a new order",
//             });
//         }
// }

export const AddOrder__ = async (req: express.Request, res: express.Response) => {
    try {
        const { clientId, orderForm, purchasesId } = req.body;

        console.log({ clientId, orderForm, purchasesId });


        if (!purchasesId || !Array.isArray(purchasesId) || purchasesId.length === 0) {
            return res.status(400).json({ error: true, message: "No purchases provided" });
        }

        // 1. Verify Client and First Purchase exists
        const [firstPurchase, client] = await Promise.all([
            getPurchaseById(purchasesId[0]),
            getClientById(clientId)
        ]);

        if (!firstPurchase) {
            return res.status(404).json({ error: true, message: "Invalid purchase ID" });
        }

        // 2. Update Client Info (Always sync address/contact info from the latest order)
        try {
            await updateClient({
                _id: clientId,
                address: orderForm.address,
                email: orderForm.email,
                fullName: orderForm.fullName,
                phone: orderForm.phone
            });
        } catch (updateErr: any) {
            console.log({ updateErr });

            if (updateErr.code === 11000) {
                const field = Object.keys(updateErr.keyPattern || {})[0];
                return res.status(409).json({
                    error: true,
                    message: `${field === 'email' ? 'Email' : 'Phone'} is already linked to another account.`
                });
            }
            throw updateErr;
        }

        // 3. Generate Order Number (Simple increment)
        const lastOrder = await getLastOrderNumber();
        orderForm.orderNumber = lastOrder ? lastOrder.orderNumber + 1 : 1;

        const newOrder = await AddOrder(orderForm) as unknown as OrderType;

        if (!newOrder?._id) throw new Error("Order creation failed");

        // 4. Link Purchases, Unset Cart status, and Decrement Stock
        const updatedPurchases = await Promise.all(
            purchasesId.map(async (pId: string) => {
                const oldPurchase = await getPurchaseById(pId) as any;
                const purchase = await setOrderToPurchase(pId, newOrder._id as string) as any;

                // Stock Decrement Logic: 
                // Only decrement if it WAS NOT in cart (if it was in cart, stock was already deducted)
                if (oldPurchase?.status !== "inCart" && purchase?.specification && !purchase.specification.unlimited) {
                    await Specification.findByIdAndUpdate(
                        purchase.specification._id,
                        { $inc: { quantity: -(purchase.quantity || 1) } }
                    );
                }

                return await unsetcartToPurchase(pId);
            })
        );

        // 5. Notifications (Non-blocking)
        handleOrderNotifications(newOrder, orderForm);

        return res.status(201).json({
            success: true,
            message: "Order placed successfully!",
            newOrder,
            updatedPurchases
        });

    } catch (err: any) {
        console.log({ err });
        return res.status(500).json({
            error: true,
            message: err.message || "Internal server error"
        });
    }
};

/** * Helper to keep the main function clean
 */
async function handleOrderNotifications(newOrder: any, orderForm: any) {
    try {
        // 1. جلب الأدمنز والمالك في نفس الوقت لسرعة التنفيذ
        const [admins, owner] = await Promise.all([
            getAdminsByAccesses(["Manage Orders"]),
            getOwnerInfo()
        ]);

        // 2. استخدام Set لضمان عدم تكرار التوكنز في حال كان الأدمن مسجلاً من أكثر من مكان
        const tokens = new Set<string>();

        admins.forEach(admin => {
            // نتحقق من وجود مصفوفة الأجهزة وأنها ليست فارغة
            if (admin.devices && Array.isArray(admin.devices)) {
                admin.devices.forEach((deviceToken: string) => {
                    if (deviceToken) tokens.add(deviceToken);
                });
            }
        });

        // 3. تجهيز بيانات الإشعار
        const notificationData = {
            orderId: String(newOrder._id),
            image: owner?.logo?.dark || "",
            url: "/(tabs)/orders" // هذا هو الـ path الذي سيفتحه التطبيق عند الضغط
        };

        // 4. إرسال الإشعارات لجميع التوكنز الفريدة
        const promises = Array.from(tokens).map(async (token) => {
            try {
                console.log(`[Order] Attempting to send notification to device: ${token.substring(0, 10)}...`);
                await sendPushNotification(
                    token,
                    "📦 New Order Received!",
                    `Order #${newOrder.orderNumber} from ${orderForm?.fullName || 'Client'} `,
                    notificationData
                );
            } catch (pErr: any) {
                console.error(`[Order] Failed to send notification to token ${token}: `, pErr?.message || pErr);
            }
        });

        await Promise.all(promises);

        console.log(`[Order] Notification dispatch finished for ${tokens.size} unique device(s).`);
    } catch (err: any) {
        console.error('[Order] handleOrderNotifications failed:', err?.message || err);
    }
}

export const getInationalOrderBatches__ = async (req: express.Request, res: express.Response) => {
    try {
        const { limit } = req.query;

        const orders = await getInationalOrderBatches(Number(limit)) as unknown as OrderType[];

        const pendingOrdersCount = await getOrderCount("pending");
        const failedOrdersCount = await getOrderCount("failed");
        const deliveredOrdersCount = await getOrderCount("delivered");

        return res.status(200).json({
            success: true,
            orders,
            counts: {
                pending: pendingOrdersCount,
                failed: failedOrdersCount,
                delivered: deliveredOrdersCount
            }
        });

    } catch (err: any) {
        return res.status(500).json({
            error: true,
            message: err.message || "An error occurred while fetching orders"
        });
    }
}

export const getInationalOrdeByClient_ = async (
    req: express.Request,
    res: express.Response
) => {

    const { clientId, limit } = req.query;


    try {

        const orders = await getInationalOrdeByClient(
            clientId as string,
            limit as unknown as number
        );

        const pendingOrdersCount = await getOrderCount(
            "pending",
            clientId as string
        );
        const failedOrdersCount = await getOrderCount(
            "failed",
            clientId as string
        );
        const deliveredOrdersCount = await getOrderCount(
            "delivered",
            clientId as string
        );


        res.status(200).json({
            orders,
            pendingOrdersCount,
            failedOrdersCount,
            deliveredOrdersCount
        });

    } catch (err: any) {

        if (err.message.includes("Missing required fields")) {
            return res.status(400).json({ message: err.message });
        }

        res.status(500).json({ message: err.message });
    }
}

export const getOrdersByClientAndStatus_ = async (
    req: express.Request,
    res: express.Response
) => {

    const { clientId, status, limit, skip } = req.query;

    try {

        if (!clientId || !status || !limit || !skip) {
            return res.status(404).json({
                message: "all of {clientId, status, limit, skip} are required ! "
            })
        }

        if (status != "pending" && status != "failed" && status != "delivered") {
            return res.status(404).json({
                message: 'the value of status should be : "pending" or "failed" or "delivered" !'
            })
        }

        const orders = await getOrdersByClientAndStatus(
            clientId as string,
            status,
            limit as unknown as number,
            skip as unknown as number,
        );

        res.status(200).json({
            orders
        })

    } catch (err: any) {

        if (err.message.includes("Missing required fields")) {
            return res.status(400).json({ message: err.message });
        }

        res.status(500).json({ message: err.message });
    }

}

export const getOrdersByStatus_ = async (
    req: express.Request,
    res: express.Response
) => {

    const { status, limit, skip } = req.query;

    try {

        if (!status || !limit || !skip) {
            return res.status(404).json({
                message: "all of {status, limit, skip} are required ! "
            })
        }

        if (status != "pending" && status != "failed" && status != "delivered") {
            return res.status(404).json({
                message: 'the value of status should be : "pending" or "failed" or "delivered" !'
            })
        }

        const orders = await getOrdersByStatus(
            status,
            limit as unknown as number,
            skip as unknown as number,
        );

        const ordersCount = await getOrderCount(status);

        res.status(200).json({
            orders,
            ordersCount
        })

    } catch (err: any) {
        if (err.message.includes("Missing required fields")) {
            return res.status(400).json({ message: err.message });
        }

        res.status(500).json({ message: err.message });
    }

}

export const getOrderStatusCounts_ = async (
    req: express.Request,
    res: express.Response
) => {

    try {

        const pendingOrdersCount = await getOrderCount("pending");
        const failedOrdersCount = await getOrderCount("failed");
        const deliveredOrdersCount = await getOrderCount("delivered");


        return res.status(200).json({
            pendingOrdersCount,
            failedOrdersCount,
            deliveredOrdersCount
        })


    } catch (err: any) {

        if (err.message.includes("Missing required fields")) {
            return res.status(400).json({ message: err.message });
        }

        res.status(500).json({ message: err.message });
    }
}

export const updateOrderStatus_ = async (
    req: express.Request,
    res: express.Response
) => {
    try {
        const { orderId, newStatus } = req.body;

        if (!orderId || !newStatus) {
            return res.status(400).json({
                success: false,
                message: "Missing orderId or newStatus"
            });
        }

        const updatedOrder = await updateOrderStatus(orderId, newStatus);

        if (!updatedOrder) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        return res.status(200).json(updatedOrder);

    } catch (err: any) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const getOrderById_ = async (req: express.Request, res: express.Response) => {
    try {
        const { orderId } = req.query;

        if (!orderId) {
            return res.status(400).json({ success: false, message: "orderId is required" });
        }

        const order = await getOrderById(orderId as string);

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        return res.status(200).json({ success: true, order });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

export const getOrdersCountByDateRange_ = async (req: express.Request, res: express.Response) => {
    try {
        const { from, to } = req.query;

        if (!from || !to) {
            return res.status(400).json({ message: "Dates are required" });
        }

        const stats = await getOrdersAnalytics(Number(from), Number(to));

        return res.status(200).json(stats);
    } catch (error) {
        return res.status(500).json({ message: "Server Error", error });
    }
};

export const getOrdersDetailsByDateRange_ = async (req: express.Request, res: express.Response) => {
    try {
        const { from, to, status, limit, skip } = req.query;
        if (!from || !to) {
            return res.status(400).json({ message: "Dates are required" });
        }
        const orders = await getOrdersDetailsByDateRange(
            Number(from),
            Number(to),
            status as string,
            limit ? Number(limit) : 5,
            skip ? Number(skip) : 0
        );
        return res.status(200).json(orders);
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
};

export const getDailySalesByDateRange_ = async (req: express.Request, res: express.Response) => {
    try {
        const { from, to, limit, skip } = req.query;
        if (!from || !to) {
            return res.status(400).json({ message: "Dates are required" });
        }
        const data = await getDailySalesByDateRange(
            Number(from),
            Number(to),
            limit ? Number(limit) : 5,
            skip ? Number(skip) : 0
        );
        return res.status(200).json(data);
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
};
