export const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
export const websocketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL ?? "ws://localhost:3002";
export const chatApiPath = process.env.NEXT_PUBLIC_CHAT_API_PATH ?? "/api/ai-chat";
export const embedPath = process.env.NEXT_PUBLIC_EMBED_PATH ?? "/embed";
export const testPagePath = process.env.NEXT_PUBLIC_TEST_PAGE_PATH ?? "/test";
export const embedScriptPath = process.env.NEXT_PUBLIC_EMBED_SCRIPT_PATH ?? "/webchat-embed.js";
export const embedScriptUrl = process.env.NEXT_PUBLIC_EMBED_SCRIPT_URL ?? `${appUrl}${embedScriptPath}`;