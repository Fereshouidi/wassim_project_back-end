// constent/index.ts

// --- API Keys (Secrets from .env) ---
export const geminiApiKey = process.env.GEMINI_API_KEY || "";
export const openRouterApiKey = process.env.OPENROUTER_API_KEY || "";
// export const grokApiKey = process.env.GROQ_API_KEY || "";

export const grokApiKey = process.env.GROQ_API_KEY || "";



// --- AI Models Configuration ---
export let activeGeminiModel = "gemini-2.5-flash";
export let activeOpenRouterModel = "google/gemini-3-pro-preview";
export let activeGrokModel = "openai/gpt-oss-20b";

export const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME || "";
export const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY || "";
export const cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET || "";

// --- Email & Database (Secrets from .env) ---
export const gmailPass = process.env.GMAIL_PASS || "";
export const databaseLink_demo = process.env.DATABASE_LINK_DEMO || "";
export const databaseLink_real = process.env.DATABASE_LINK_REAL || "";

// --- Logic ---
export const databaseLink = databaseLink_real || "";

// Set active key (Setting Groq as default based on original code)
export const activeAiApiKey = grokApiKey;
export const numOfMessageToSummary = 10;

// groq/compound
// Model name (ID), Status
// llama-3.3-70b-versatile, Best and recommended currently
// llama-3.1-70b-versatile, Good tool support
// mixtral-8x7b-32768, Supports tools
