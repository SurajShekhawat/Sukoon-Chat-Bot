// Sukoon AI — AI Provider Connectivity & Streaming Diagnostic
const fs = require("fs");
const path = require("path");

const envPath = path.resolve(".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [k, ...v] = trimmed.split("=");
    if (k && v.length) process.env[k.trim()] = v.join("=").replace(/^["']|["']$/g, "").trim();
  }
}

const provider = (process.env.AI_PROVIDER || (process.env.GEMINI_API_KEY ? "gemini" : "openai")).toLowerCase();

console.log("=== Sukoon AI — AI Diagnostics ===");
console.log("Active Provider:", provider.toUpperCase());

if (provider === "gemini") {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

  console.log("Gemini API Key configured?:", !!apiKey && !apiKey.startsWith("placeholder"));
  console.log("Target Model:", model);

  if (!apiKey || apiKey.startsWith("placeholder")) {
    console.error("❌ CRITICAL: Valid GEMINI_API_KEY is missing in .env.local!");
    process.exit(1);
  }

  const { GoogleGenAI } = require("@google/genai");
  const ai = new GoogleGenAI({ apiKey });

  async function testGemini() {
    try {
      console.log("\nAttempting test stream with Google Gemini API...");
      const stream = await ai.models.generateContentStream({
        model,
        contents: "Namaste Sukoon, test ping. Please reply in warm Hinglish.",
        config: {
          systemInstruction: "You are Sukoon AI, a compassionate companion. Reply briefly.",
        },
      });

      let receivedTokens = "";
      for await (const chunk of stream) {
        if (chunk.text) {
          receivedTokens += chunk.text;
          process.stdout.write(chunk.text);
        }
      }

      console.log("\n\n✅ Stream completed successfully!");
      console.log("🎉 GOOGLE GEMINI IS FULLY OPERATIONAL FOR SUKOON AI!");
      process.exit(0);
    } catch (err) {
      console.error("\n❌ Google Gemini API Call Failed:");
      console.error("Status:", err.status || err.code);
      console.error("Message:", err.message);
      process.exit(1);
    }
  }

  testGemini();
} else {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  console.log("OpenAI API Key configured?:", !!apiKey && apiKey !== "your-openai-api-key");
  console.log("Model target:", model);

  if (!apiKey || apiKey === "your-openai-api-key") {
    console.error("❌ CRITICAL: Valid OPENAI_API_KEY is missing in .env.local!");
    process.exit(1);
  }

  const OpenAI = require("openai");
  const openai = new OpenAI({ apiKey });

  async function testOpenAI() {
    try {
      console.log("\nAttempting test generation with OpenAI Responses API...");
      const stream = await openai.responses.create({
        model,
        instructions: "You are Sukoon AI test diagnostic.",
        input: [{ role: "user", content: "Ping" }],
        stream: true,
      });

      let receivedTokens = "";
      for await (const event of stream) {
        if (event.type === "response.output_text.delta" && event.delta) {
          receivedTokens += event.delta;
          process.stdout.write(event.delta);
        }
      }

      console.log("\n\n✅ Response received successfully!");
      console.log("🎉 OPENAI API IS FULLY OPERATIONAL!");
      process.exit(0);
    } catch (err) {
      console.error("\n❌ OpenAI API Call Failed:");
      if (err.code === "credit_balance_exhausted" || err.type === "insufficient_quota") {
        console.error("🚨 REASON: Credit Balance Exhausted (insufficient_quota)");
        console.error("👉 Your OpenAI account has $0 remaining credits.");
        console.error("👉 Solution: Switch to GEMINI_API_KEY in .env.local for free tier or recharge OpenAI credits.");
      } else if (err.status === 401) {
        console.error("🚨 REASON: Authentication Failed (Invalid API Key)");
        console.error("👉 Solution: Verify your OPENAI_API_KEY in .env.local");
      } else {
        console.error("Error Code:", err.code);
        console.error("Status:", err.status);
        console.error("Message:", err.message);
      }
      process.exit(1);
    }
  }

  testOpenAI();
}
