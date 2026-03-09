export const searchTools = [
  {
    type: "function",
    function: {
      name: "findProducts",
      description: "Search the store database. Use it to find products, filter prices, or explore available colors and sizes.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search text (product name or description). Leave empty '' if search depends only on other filters.",
          },
          category: {
            type: "string",
            description: "Category or collection (e.g., 'shirts', 'shoes').",
          },
          maxPrice: {
            type: "number",
            description: "Maximum price requested by the client.",
          },
          colors: {
            type: "array",
            items: { type: "string" },
            description: "List of required colors. Send ['all'] if no specific color is specified.",
          },
          sizes: {
            type: "array",
            items: { type: "string" },
            description: "List of required sizes. Send ['all'] if no size is specified.",
          },
          types: {
            type: "array",
            items: { type: "string" },
            description: "List of product types. Send ['all'] for all.",
          },
        },
        required: [],
      },
    },
  },
];