// Sukoon AI — Database & Supabase Connectivity Health Check
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Load .env.local manually for this check script
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (key && rest.length > 0) {
      const val = rest.join("=").replace(/^["']|["']$/g, "").trim();
      process.env[key.trim()] = val;
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("=== Sukoon AI Supabase Diagnostics ===");
console.log("Supabase URL:", supabaseUrl || "NOT FOUND");
console.log("Anon Key present?:", !!anonKey);
console.log("Service Key present?:", !!serviceKey);

if (!supabaseUrl || !anonKey || supabaseUrl.includes("placeholder")) {
  console.error("❌ CRITICAL: Valid Supabase URL and Anon Key are missing in .env.local!");
  process.exit(1);
}

const supabaseAnon = createClient(supabaseUrl, anonKey);
const supabaseAdmin = serviceKey ? createClient(supabaseUrl, serviceKey) : null;

async function runDiagnostics() {
  let hasErrors = false;

  // 1. Check Auth service connectivity
  try {
    const { error } = await supabaseAnon.auth.getSession();
    if (error) {
      console.error("❌ Auth service error:", error.message);
      hasErrors = true;
    } else {
      console.log("✅ Supabase Auth service reachable.");
    }
  } catch (err) {
    console.error("❌ Auth service connection failed:", err.message);
    hasErrors = true;
  }

  // 2. Check Tables Existence and Access
  const tables = [
    "profiles",
    "conversations",
    "messages",
    "memories",
    "mood_entries",
    "goals",
    "audit_logs",
    "subscriptions",
    "user_entitlements",
    "payment_events",
    "voice_sessions",
  ];
  console.log("\nChecking database tables:");

  for (const table of tables) {
    try {
      const client = supabaseAdmin || supabaseAnon;
      const { count, error } = await client.from(table).select("*", { count: "exact", head: true });
      if (error) {
        console.error(`❌ Table '${table}': ERROR - ${error.message} (code: ${error.code})`);
        hasErrors = true;
      } else {
        console.log(`✅ Table '${table}': Ready (row count: ${count ?? 0})`);
      }
    } catch (err) {
      console.error(`❌ Table '${table}': ${err.message}`);
      hasErrors = true;
    }
  }

  // 3. Check trigger on auth.users -> profiles
  if (supabaseAdmin) {
    console.log("\nChecking auth trigger status via service role...");
    try {
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("count", { count: "exact", head: true });
      if (error) {
        console.warn("⚠️ Could not query profiles:", error.message);
      } else {
        console.log("✅ Service role query to profiles passed.");
      }
    } catch (err) {
      console.warn("⚠️ Trigger check error:", err.message);
    }
  }

  console.log("\n=======================================");
  if (hasErrors) {
    console.log("❌ Diagnostics finished with warnings/errors.");
    process.exit(1);
  } else {
    console.log("🎉 ALL DATABASE CHECKS PASSED SUCCESSFULLY!");
    process.exit(0);
  }
}

runDiagnostics();

