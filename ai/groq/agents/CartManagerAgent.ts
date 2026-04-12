import { Groq } from "groq-sdk";
import { activeAiApiKey, activeGrokModel } from "../../../constent/index.js";
import { cartTools } from "../tools.ts/cartTools.js";
import { addPurchase, getPurchasesInCartByClient, removePurchase } from "../../../controller/purchase.js";
import { PurchaseType } from "../../../types/index.js";
import { getOwnerInfo } from "../../../controller/ownerInfo.js";
import { sanitizeMessages } from "../utils.js";

const groq = new Groq({ apiKey: activeAiApiKey });

/**
 * Fallback: parse CART_OPERATION text blocks that the LLM sometimes
 * outputs instead of calling the tool properly.
 */
function parseCartOperationsFromText(text: string): Array<{ productId: string; specificationId: string; quantity: number }> {
    const ops: Array<{ productId: string; specificationId: string; quantity: number }> = [];
    // Match CART_OPERATION: { ... } patterns
    const regex = /CART_OPERATION\s*:\s*\{([^}]+)\}/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
        try {
            const json = JSON.parse(`{${match[1]}}`);
            if (json.productId && json.specificationId) {
                ops.push({
                    productId: json.productId,
                    specificationId: json.specificationId,
                    quantity: json.quantity || 1
                });
            }
        } catch (e) {
            // skip malformed
        }
    }
    return ops;
}

/**
 * Strip CART_OPERATION blocks from text to produce a clean user-facing message.
 */
function cleanResponseText(text: string): string {
    return text
        .replace(/CART_OPERATION\s*:\s*\{[^}]+\}/g, '')
        .replace(/\n{2,}/g, '\n')
        .trim();
}

export const CartManagerAgent = async (msgFrom: "user" | "assistant", msg: string, history: any[], clientId: string, onStatus?: (status: string) => void) => {
    // 1. Truncate history to save tokens but keep enough for ID discovery
    const truncatedHistory = history.slice(-20); 

    const info = await getOwnerInfo();
    const managerRules = info?.aiPrompt || "";

    const messages: any[] = [
        {
            role: "system",
            content: `You are a Cart Operations Specialist.
             YOUR JOBS:
            1. Execute "add to cart" action for the user.
            2. Execute "remove from cart" action for the user.
            3. Show the user what is currently in their cart.
            
            RULES:
            1. To ADD: Search through history to find productId and specificationId. Use 'executeAddToCart'.
            2. To REMOVE: If the user wants to remove something but hasn't specified exactly which item (or you don't see a purchaseId in history), ALWAYS call 'getCartItems' FIRST to see what's there. Then, identify the correct 'purchaseId' (or '_id') and call 'removeFromCart'.
            3. To VIEW CART: Call 'getCartItems'. Provide a friendly list to the user including product name, price, and color/size.
            4. If the user mentions multiple items, you MUST call the tools multiple times.
            5. After ALL tools have been called, respond with "done!" or a clear summary of what happened.
            6. NEVER output JSON, CART_OPERATION strings, or technical IDs.
            7. If IDs are missing from history for adding, ask the user to search for the product first.
            8. NEVER perform searches yourself only if you don't have the id of the product.

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
        const maxLoops = 5;
        let totalItemsAdded = 0;

        while (loopCount < maxLoops) {
            const response = await groq.chat.completions.create({
                model: activeGrokModel,
                messages: sanitizeMessages(messages),
                tools: cartTools as any,
                tool_choice: "auto",
                temperature: 0.1
            });

            const responseMessage = response.choices[0].message;

            // --- Path A: Model used tool calls properly ---
            if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
                messages.push(responseMessage);

                for (const toolCall of responseMessage.tool_calls) {
                    if (toolCall.function.name === "executeAddToCart") {
                        if (onStatus) onStatus("Adding to cart...");
                        const args = JSON.parse(toolCall.function.arguments);
                        console.log("[CartManager] Tool call ->", { productId: args.productId, specificationId: args.specificationId, quantity: args.quantity });

                        await addPurchase({
                            client: clientId,
                            product: args.productId,
                            specification: args.specificationId,
                            quantity: args.quantity || 1,
                            status: "inCart"
                        } as PurchaseType);

                        totalItemsAdded++;

                        messages.push({
                            role: "tool",
                            name: "executeAddToCart",
                            tool_call_id: toolCall.id,
                            content: JSON.stringify({ success: true })
                        });
                    } else if (toolCall.function.name === "removeFromCart") {
                        if (onStatus) onStatus("Removing from cart...");
                        const args = JSON.parse(toolCall.function.arguments);
                        console.log("[CartManager] Tool call -> removeFromCart", { purchaseId: args.purchaseId });

                        await removePurchase(args.purchaseId);
                        totalItemsAdded++; // reusing this counter for general operations

                        messages.push({
                            role: "tool",
                            name: "removeFromCart",
                            tool_call_id: toolCall.id,
                            content: JSON.stringify({ success: true })
                        });
                    } else if (toolCall.function.name === "getCartItems") {
                        if (onStatus) onStatus("Retrieving cart items...");
                        console.log("[CartManager] Tool call -> getCartItems", { clientId });
                        const cartItems = await getPurchasesInCartByClient(clientId);
                        
                        // Data thinning for AI
                        const leanCart = cartItems.map(p => ({
                            purchaseId: p._id,
                            productName: (p as any).productName?.en || (p as any).productName?.fr || (p as any).productName,
                            price: p.specPrice,
                            color: p.specColor,
                            size: p.specSize,
                            quantity: p.quantity
                        }));

                        messages.push({
                            role: "tool",
                            name: "getCartItems",
                            tool_call_id: toolCall.id,
                            content: JSON.stringify(leanCart)
                        });
                    }
                }

                // Also check if the model included CART_OPERATION text alongside tool calls
                if (responseMessage.content) {
                    const textOps = parseCartOperationsFromText(responseMessage.content);
                    for (const op of textOps) {
                        console.log("[CartManager] Fallback text parse ->", op);
                        await addPurchase({
                            client: clientId,
                            product: op.productId,
                            specification: op.specificationId,
                            quantity: op.quantity,
                            status: "inCart"
                        } as PurchaseType);
                        totalItemsAdded++;
                    }
                }

                loopCount++;
                continue; // let the model produce its final text response
            }

            // --- Path B: Model responded with text only ---
            const textContent = responseMessage.content || "";

            // Check if the text contains CART_OPERATION blocks (fallback)
            const textOps = parseCartOperationsFromText(textContent);
            if (textOps.length > 0) {
                for (const op of textOps) {
                    console.log("[CartManager] Fallback text parse ->", op);
                    await addPurchase({
                        client: clientId,
                        product: op.productId,
                        specification: op.specificationId,
                        quantity: op.quantity,
                        status: "inCart"
                    } as PurchaseType);
                    totalItemsAdded++;
                }

                // Clean the response and return
                const cleanText = cleanResponseText(textContent);
                const finalContent = cleanText || (totalItemsAdded > 0 ? "Done! Added to your cart." : "I couldn't process that.");

                messages.push({ ...responseMessage, content: finalContent });
                return {
                    content: finalContent,
                    fullHistory: messages,
                    cartChanged: totalItemsAdded > 0
                };
            }

            // No tool calls and no CART_OPERATION text — just a plain response
            messages.push(responseMessage);
            const content = totalItemsAdded > 0
                ? (textContent || "Done! Added to your cart.")
                : (textContent || "I couldn't find the product IDs. Please search for the product first.");

            return {
                content,
                fullHistory: messages,
                cartChanged: totalItemsAdded > 0
            };
        }

        // If we exhausted loops (all were tool calls), get the final text
        const finalResponse = await groq.chat.completions.create({
            model: activeGrokModel,
            messages: sanitizeMessages(messages),
            tool_choice: "auto",
            temperature: 0.5
        });

        const finalResMessage = finalResponse.choices[0].message;
        const finalText = cleanResponseText(finalResMessage.content || "");
        messages.push({ ...finalResMessage, content: finalText || "Done! Added to your cart." });

        return {
            content: finalText || "Done! Added to your cart.",
            fullHistory: messages,
            cartChanged: totalItemsAdded > 0
        };

    } catch (error: any) {
        console.error("CartManager Error:", error);
        return { content: "I had trouble adding that to your cart. Please try again.", fullHistory: messages };
    }
};