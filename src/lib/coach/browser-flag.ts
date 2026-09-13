/** Feature flag only; no SDK imports, safe to load anywhere. */
export const browserEnabled = Boolean(process.env.BROWSERBASE_API_KEY && process.env.CREDIT_BROWSER_ENABLED === "1");
