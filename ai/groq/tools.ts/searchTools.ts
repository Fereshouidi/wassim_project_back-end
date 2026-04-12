import { uiControllerTools } from "./uiControllerTools.js";

export const searchTools = [
  ...uiControllerTools,
  {
    type: "function",
    function: {
      name: "findProducts",
      description: "Search the store database with full control over filtering, sorting, and results.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Basic search text (e.g., product name). Leave empty if search depends only on categories or filters."
          },
          limit: {
            type: "number",
            description: "Number of products requested. Maximum allowed is 5."
          },
          skip: {
            type: "number",
            description: "Number of products to skip (used for pagination)."
          },
          minPrice: { type: "number", description: "Minimum price" },
          maxPrice: { type: "number", description: "Maximum price" },
          category: {
            type: "string",
            description: "Category of products to search in (e.g., rings, watches, necklaces)."
          },
          colors: {
            type: "array",
            items: { type: "string" },
            description: "List of required colors or ['all'] for all."
          },
          sizes: {
            type: "array",
            items: { type: "string" },
            description: "List of required sizes or ['all'] for all."
          },
          types: {
            type: "array",
            items: { type: "string" },
            description: "List of product types or ['all'] for all."
          },
          sortBy: {
            type: "string",
            enum: ["price", "name", "date"],
            description: "Field to sort by."
          },
          sortDirection: {
            type: "string",
            enum: ["asc", "desc"],
            description: "Sort direction: asc for ascending, desc for descending."
          }
        },
        // Solution: remove "query" from required list to make it optional
        required: []
      }
    }
  }
];