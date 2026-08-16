import { uiControllerTools } from "./uiControllerTools.js";

export const supportTools = [
    ...uiControllerTools,
    {
        type: "function",
        function: {
            name: "searchProducts",
            description: "use this tool when the user wants to search for products or asks about prices and specifications",
            // parameters: {
            //     type: "object",
            //     properties: {
            //         query: { type: "string", description: "نص البحث" }
            //     }
            // }
        }
    },
    {
      type: "function",
      function: {
        name: "manageCart",
        description: "Use this tool to manage cart data like put product in cart or remove product from cart",
        parameters: {
          type: "object",
          properties: {},
          required: []
        }
      },
    },
    {
       type: "function",
       function: {
         name: "manageOrders",
         description: "Use this tool when the user asks about their orders, delivery status, order history, or to make a new order",
         parameters: {
           type: "object",
           properties: {},
           required: []
         }
       },
    }
]