import { Tool, SchemaType } from "@google/generative-ai";

export const searchTools: Tool = {
  functionDeclarations: [
    {
      name: "findProducts",
      description: "Search the store database. Use it to find products, filter prices, or explore available colors and sizes.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          query: {
            type: SchemaType.STRING,
            description: "Search text (product name or description). Leave empty '' if search depends only on other filters.",
          },
          category: {
            type: SchemaType.STRING,
            description: "Category or collection (e.g., 'shirts', 'shoes').",
          },
          maxPrice: {
            type: SchemaType.NUMBER,
            description: "Maximum price requested by the client.",
          },
          colors: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: "List of required colors. Send ['all'] if no specific color is specified.",
          },
          sizes: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: "List of required sizes. Send ['all'] if no size is specified.",
          },
          types: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: "List of product types. Send ['all'] for all.",
          }
        },
        // Removed query from required to allow searching with filters only
        required: [],
      },
    },
  ],
};