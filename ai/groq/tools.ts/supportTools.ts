export const supportTools = [
  {
    type: "function",
    function: {
      name: "controlUI",
      description: "التحكم في عناصر الواجهة مثل فتح السلة أو القائمة الجانبية",
      parameters: {
        type: "object",
        properties: {
          element: {
            type: "string",
            enum: ["cart", "sidebar", "search_bar", "textDirection"],
            description: "العنصر المراد التحكم به"
          },
          state: {
            type: "string",
            enum: ["open", "close", "rtl"],
            description: "الحالة المطلوبة"
          }
        },
        required: ["element", "state"]
      }
    },
  },
{
        type: "function",
        function: {
            name: "searchProducts",
            description: "استخدم هذه الأداة عندما يطلب المستخدم البحث عن منتجات أو يسأل عن الأسعار والمواصفات",
            parameters: {
                type: "object",
                properties: {
                    query: { type: "string", description: "نص البحث" }
                }
            }
        }
    }
]