export const uiControllerTools = [
  {
    type: "function",
    function: {
      name: "controlUI",
      description: "التحكم في عناصر الواجهة مثل فتح السلة أو القائمة الجانبية أو الانتقال بين الصفحات",
      parameters: {
        type: "object",
        properties: {
          element: {
            type: "string",
            enum: ["cart", "sidebar", "search_bar", "textDirection", "theme", "navigation"],
            description: "العنصر المراد التحكم به. استخدم navigation للانتقال لصفحة أخرى"
          },
          state: {
            type: "string",
            description: "الحالة المطلوبة. في حال كانت element هي navigation، ضع المسار هنا (مثل '/', '/account', '/collections')"
          }
        },
        required: ["element", "state"]
      }
    },
  }
]