import { Groq } from "groq-sdk";
import { activeAiApiKey, activeGrokModel } from "../../../constent/index.js";
import { orderTools } from "../tools.ts/orderTools.js";
import { getOrdersByClient, getOrderById, checkout } from "../../../controller/order.js";
import { sanitizeMessages } from "../utils.js";
import { getOwnerInfo } from "../../../controller/ownerInfo.js";
import { ClientType } from "../../../types/index.js";

const groq = new Groq({ apiKey: activeAiApiKey });

export const OrderManagerAgent = async (msgFrom: "user" | "assistant", msg: string, history: any[], client: ClientType, onStatus?: (status: string) => void) => {
    const truncatedHistory = history.slice(-10);

    const info = await getOwnerInfo();
    const managerRules = info?.aiPrompt || "";

    // const clientData = {
    //     fullName: client.fullName,
    //     address: client.address,
    //     phone: client.phone,
    //     email: client.email
    // }

    const messages: any[] = [
        {
            role: "system",
            content: `You are an Order Support Specialist.
            YOUR JOBS:
            1. Help users check the status of their orders.
            2. Provide a list of recent orders for the user.
            3. Explain order details (items, total price, status).
            4. **NEW: Help users place an order (Checkout).**

            this is the client data : ${JSON.stringify(client)}

            RULES:
            1. To see all orders, call 'getOrdersByClient'.
            2. To see a specific order, call 'getOrderDetails' with the orderId.
            3. **TO PLACE AN ORDER:** 
               - Ask for shipping details (fullName, address, phone) if not already known from client data.
               - Call 'checkout' with the details.
            4. When listing orders, provide the Order Number, Date, Status, and Total Price.
            5. If a user asks "where is my order?", call 'getOrdersByClient' first to find their latest order.
            6. Always be helpful and reassuring.

            ${managerRules ? `Additional rules from the manager: ${managerRules}` : ""}
            `
        },
        ...truncatedHistory,
    ];

    if (msgFrom === "user") {
        messages.push({ role: "user", content: msg });
    } else {
        messages.push({ role: "assistant", content: msg });
    }

    try {
        let loopCount = 0;
        const maxLoops = 3;

        while (loopCount < maxLoops) {
            const response = await groq.chat.completions.create({
                model: activeGrokModel,
                messages: sanitizeMessages(messages),
                tools: orderTools as any,
                tool_choice: "auto",
                temperature: 0.1
            });

            const responseMessage = response.choices[0].message;

            if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
                messages.push(responseMessage);

                for (const toolCall of responseMessage.tool_calls) {
                    const functionName = toolCall.function.name;
                    const args = JSON.parse(toolCall.function.arguments);

                    if (functionName === "getOrdersByClient") {
                        if (onStatus) onStatus("Retrieving your orders...");
                        const orders = await getOrdersByClient(client?._id?.toString() || "");
                        
                        // Data thinning for AI context
                        const leanOrders = orders.map((o: any) => ({
                            orderId: o._id,
                            orderNumber: o.orderNumber,
                            status: o.status,
                            date: o.createdAt,
                            total: o.totalAmount || "N/A",
                            itemsCount: o.purchases?.length || 0
                        }));

                        messages.push({
                            role: "tool",
                            name: "getOrdersByClient",
                            tool_call_id: toolCall.id,
                            content: JSON.stringify(leanOrders)
                        });
                    } else if (functionName === "getOrderDetails") {
                        if (onStatus) onStatus("Fetching order details...");
                        const order = await getOrderById(args.orderId);
                        
                        messages.push({
                            role: "tool",
                            name: "getOrderDetails",
                            tool_call_id: toolCall.id,
                            content: JSON.stringify(order || { error: "Order not found" })
                        });
                    } else if (functionName === "checkout") {
                        if (onStatus) onStatus("Placing your order...");
                        console.log("[OrderManager] Tool call -> checkout", args);
                        
                        const result = await checkout(client?._id?.toString() || "", args);
                        
                        messages.push({
                            role: "tool",
                            name: "checkout",
                            tool_call_id: toolCall.id,
                            content: JSON.stringify({ success: true, orderNumber: result.orderNumber })
                        });
                    }
                }
                loopCount++;
            } else {
                // Return text response
                messages.push(responseMessage);
                return {
                    content: responseMessage.content,
                    fullHistory: messages
                };
            }
        }

        // Final text fallback
        const finalResponse = await groq.chat.completions.create({
            model: activeGrokModel,
            messages: sanitizeMessages(messages),
            temperature: 0.5
        });

        return {
            content: finalResponse.choices[0].message.content,
            fullHistory: messages
        };

    } catch (error: any) {
        console.error("OrderManager Error:", error);
        return { content: "I had trouble checking your orders. Please try again.", fullHistory: messages };
    }
};
