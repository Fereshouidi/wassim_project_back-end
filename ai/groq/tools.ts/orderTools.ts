
export const orderTools = [
    {
        type: "function",
        function: {
            name: "getOrdersByClient",
            description: "Retrieve all orders for the current user to show history or status.",
            parameters: {
                type: "object",
                properties: {
                    clientId: { type: "string", description: "The ID of the client." }
                },
                required: ["clientId"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "getOrderDetails",
            description: "Get detailed information about a specific order using its ID.",
            parameters: {
                type: "object",
                properties: {
                    orderId: { type: "string", description: "The ID of the order." }
                },
                required: ["orderId"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "checkout",
            description: "Finalize the purchase by creating an order from current cart items.",
            parameters: {
                type: "object",
                properties: {
                    fullName: { type: "string", description: "Full name for the order." },
                    address: { type: "string", description: "Shipping address." },
                    phone: { type: "number", description: "Phone number." },
                    clientNote: { type: "string", description: "Optional note from the client." }
                },
                required: ["fullName", "address", "phone"]
            }
        }
    }
];
