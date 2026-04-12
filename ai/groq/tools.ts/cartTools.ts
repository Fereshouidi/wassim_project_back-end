export const cartTools = [
  {
    type: "function",
    function: {
      name: "getCartItems",
      description: "Retrieve all items currently in the user's shopping cart.",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "executeAddToCart",
      description: "Use this tool to officially add a product to the customer's cart in the database.",
      parameters: {
        type: "object",
        properties: {
          productId: { type: "string", description: "The unique ID of the product." },
          specificationId: { type: "string", description: "The unique ID of the product's specification (size, color, etc.)." },
          quantity: { type: "number", description: "The number of items to add." }
        },
        required: ["productId", "specificationId", "quantity"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "removeFromCart",
      description: "Remove a specific item from the cart using its purchase ID.",
      parameters: {
        type: "object",
        properties: {
          purchaseId: {
            type: "string",
            description: "The unique ID of the purchase record to remove. You can find this in the 'inCart' items list in the history."
          }
        },
        required: ["purchaseId"]
      }
    }
  },
  // {
  //   type: "function",
  //   function: {
  //     name: "findProducts",
  //     description: "Search the store database with full control over filtering, sorting, and results.",
  //     parameters: {
  //       type: "object",
  //       properties: {
  //         query: {
  //           type: "string",
  //           description: "Basic search text (e.g., product name). Leave empty if search depends only on categories or filters."
  //         },
  //         limit: {
  //           type: "number",
  //           description: "Number of products requested. Maximum allowed is 5."
  //         },
  //         skip: {
  //           type: "number",
  //           description: "Number of products to skip (used for pagination)."
  //         },
  //         minPrice: { type: "number", description: "Minimum price" },
  //         maxPrice: { type: "number", description: "Maximum price" },
  //         category: {
  //           type: "string",
  //           description: "Category of products to search in (e.g., rings, watches, necklaces)."
  //         },
  //         colors: {
  //           type: "array",
  //           items: { type: "string" },
  //           description: "List of required colors or ['all'] for all."
  //         },
  //         sizes: {
  //           type: "array",
  //           items: { type: "string" },
  //           description: "List of required sizes or ['all'] for all."
  //         },
  //         types: {
  //           type: "array",
  //           items: { type: "string" },
  //           description: "List of product types or ['all'] for all."
  //         },
  //         sortBy: {
  //           type: "string",
  //           enum: ["price", "name", "date"],
  //           description: "Field to sort by."
  //         },
  //         sortDirection: {
  //           type: "string",
  //           enum: ["asc", "desc"],
  //           description: "Sort direction: asc for ascending, desc for descending."
  //         }
  //       },
  //       // Solution: remove "query" from required list to make it optional
  //       required: []
  //     }
  //   }
  // }
];
