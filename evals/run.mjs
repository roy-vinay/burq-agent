#!/usr/bin/env node
/**
 * Dispatch Agent Evals
 *
 * Runs every fixture through the real Anthropic API and asserts:
 *   1. Parse eval   — Claude's output is parseable (no null verdict)
 *   2. Route eval   — Routed to the expected team
 *   3. Range eval   — Urgency/severity/confidence are in expected bounds
 *
 * Usage:
 *   node evals/run.mjs               # run all fixtures
 *   node evals/run.mjs --id wrong-order   # run one fixture by id
 *   node evals/run.mjs --runs 3      # run each fixture N times (consistency check)
 */

import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

// Load .env.local from project root (no dotenv dependency needed)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "../.env.local");
try {
  const envContent = readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
} catch {}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Prompts (mirrors the API routes exactly) ──────────────────────────────

const CALL_SYSTEM_PROMPT = `You are the platform's Inbound Call Triage Agent. You read transcripts of inbound calls to restaurants and merchants and determine the right routing action automatically.

The transcript may be in any language. Perform your analysis in English but note the caller's language in STEP 1.

You reason through every transcript in exactly five steps using these exact headers:

**STEP 1: CALL PARSE**
Extract what you can: caller type (customer vs merchant vs driver vs partner), caller name if mentioned, order ID if present, restaurant or merchant name, what specifically they called about, emotional tone (calm/frustrated/angry/distressed), urgency level (low/medium/high), caller's language, and any time-sensitive flags (active order in progress, food already cold, event happening today, etc).

**STEP 2: INTENT CLASSIFICATION**
Classify the call intent as one of: REFUND_REQUEST, ESCALATION, NEW_ORDER, PARTNERSHIP_INQUIRY, or GENERAL_SUPPORT. State your confidence as a percentage. If below 75%, explain why it is ambiguous and what additional information would resolve it.

**STEP 3: URGENCY ASSESSMENT**
Score urgency 1-10. Consider: whether an order is currently active, food or medical sensitivity, repeat caller signals (words like "again", "every time", "third time"), churn risk signals, partner relationship value for partnership calls, and time pressure (event today, customer waiting, etc). Explain your score.

**STEP 4: ROUTING DECISION**
Pick one routing destination: REFUNDS_TEAM, OPS_ESCALATION, ORDER_DESK, PARTNERSHIPS_TEAM, SUPPORT_L1, or HUMAN_REVIEW. If confidence in Step 2 was below 70%, you MUST route to HUMAN_REVIEW regardless of intent. Explain exactly which team should handle this and why.

**STEP 5: AGENT HANDOFF SUMMARY**
Write the internal handoff note for the receiving team. Include: caller name, what they called about, order context if present, urgency level, key quotes or details from the call, and the recommended immediate next action. Keep it tight and actionable.

End with: INTENT: [intent type] | URGENCY: [1-10] | ROUTE: [team] | CONFIDENCE: [percentage]%`;

const EMAIL_SYSTEM_PROMPT = `You are the platform's Email Triage Agent. You classify, score, and route inbound customer emails.

You reason through every email in exactly five steps using these exact headers:

**STEP 1: EMAIL PARSE**
**STEP 2: ISSUE CLASSIFICATION**
**STEP 3: SEVERITY ASSESSMENT**
**STEP 4: RECOMMENDED ACTION**
**STEP 5: DRAFT OUTPUT**

End with: ACTION: [action] | SEVERITY: [1-10] | CONFIDENCE: [percentage]%

Valid actions: INITIATE_REFUND, ESCALATE_PROVIDER, REROUTE_ORDER, DRAFT_APOLOGY, FLAG_FRAUD, FLAG_HUMAN_REVIEW`;

// ─── Parsers ───────────────────────────────────────────────────────────────

function extractCallVerdict(text) {
  // Use [^|]* between fields so any parentheticals or qualifiers don't break the match
  const m = text.match(
    /\*{0,2}INTENT:\*{0,2}\s*([A-Z_]+)[^|]*\|\s*\*{0,2}\s*URGENCY:\*{0,2}\s*(\d+)(?:\/\d+)?\s*\*{0,2}\s*\|\s*\*{0,2}\s*ROUTE:\*{0,2}\s*([A-Z_]+)[^|]*\|\s*\*{0,2}\s*CONFIDENCE:\*{0,2}\s*(\d+)%\*{0,2}/i
  );
  if (!m) return null;
  return { intent: m[1], urgency: parseInt(m[2]), route: m[3], confidence: parseInt(m[4]) };
}

function extractEmailVerdict(text) {
  // [^|]* handles multiple actions and any qualifiers; (?:\/\d+)? handles "9/10" severity
  const m = text.match(/\*{0,2}ACTION:\*{0,2}\s*([A-Z_]+)[^|]*\|\s*\*{0,2}\s*SEVERITY:\*{0,2}\s*(\d+)(?:\/\d+)?\s*\*{0,2}\s*\|\s*\*{0,2}\s*CONFIDENCE:\*{0,2}\s*(\d+)%\*{0,2}/i);
  if (!m) return null;
  return { action: m[1], severity: parseInt(m[2]), confidence: parseInt(m[3]) };
}

// ─── Claude calls ──────────────────────────────────────────────────────────

async function triageCall(transcript) {
  const res = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    system: CALL_SYSTEM_PROMPT,
    messages: [{ role: "user", content: `Incoming call transcript to triage:\n\n---\n${transcript}\n---\n\nAnalyze this and determine the right routing action.` }],
  });
  return res.content[0].text;
}

async function triageEmail(email) {
  const res = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    system: EMAIL_SYSTEM_PROMPT,
    messages: [{ role: "user", content: `Incoming email to triage:\n\n---\n${email}\n---\n\nAnalyze this and determine the right action.` }],
  });
  return res.content[0].text;
}

// ─── Assertion helpers ─────────────────────────────────────────────────────

function assertCall(verdict, expected, runIndex) {
  const failures = [];

  if (!verdict) {
    failures.push("PARSE FAILED — extractVerdict returned null");
    return failures;
  }

  const validIntents = ["REFUND_REQUEST", "ESCALATION", "NEW_ORDER", "PARTNERSHIP_INQUIRY", "GENERAL_SUPPORT"];
  const validRoutes = ["REFUNDS_TEAM", "OPS_ESCALATION", "ORDER_DESK", "PARTNERSHIPS_TEAM", "SUPPORT_L1", "HUMAN_REVIEW"];

  if (!validIntents.includes(verdict.intent))
    failures.push(`intent "${verdict.intent}" not in valid set`);

  if (!validRoutes.includes(verdict.route))
    failures.push(`route "${verdict.route}" not in valid set`);

  if (verdict.urgency < 1 || verdict.urgency > 10)
    failures.push(`urgency ${verdict.urgency} out of range 1-10`);

  if (verdict.confidence < 0 || verdict.confidence > 100)
    failures.push(`confidence ${verdict.confidence} out of range 0-100`);

  if (expected.intent && verdict.intent !== expected.intent)
    failures.push(`intent: expected "${expected.intent}", got "${verdict.intent}"`);

  if (expected.intent_any_of && !expected.intent_any_of.includes(verdict.intent))
    failures.push(`intent: expected one of [${expected.intent_any_of.join(", ")}], got "${verdict.intent}"`);

  if (expected.route && verdict.route !== expected.route)
    failures.push(`route: expected "${expected.route}", got "${verdict.route}"`);

  if (expected.route_any_of && !expected.route_any_of.includes(verdict.route))
    failures.push(`route: expected one of [${expected.route_any_of.join(", ")}], got "${verdict.route}"`);

  if (expected.urgency_min !== undefined && verdict.urgency < expected.urgency_min)
    failures.push(`urgency ${verdict.urgency} below minimum ${expected.urgency_min}`);

  if (expected.urgency_max !== undefined && verdict.urgency > expected.urgency_max)
    failures.push(`urgency ${verdict.urgency} above maximum ${expected.urgency_max}`);

  if (expected.confidence_min !== undefined && verdict.confidence < expected.confidence_min)
    failures.push(`confidence ${verdict.confidence}% below minimum ${expected.confidence_min}%`);

  return failures;
}

function assertEmail(verdict, expected) {
  const failures = [];

  if (!verdict) {
    failures.push("PARSE FAILED — extractEmailVerdict returned null");
    return failures;
  }

  if (expected.action && verdict.action !== expected.action)
    failures.push(`action: expected "${expected.action}", got "${verdict.action}"`);

  if (expected.severity_min !== undefined && verdict.severity < expected.severity_min)
    failures.push(`severity ${verdict.severity} below minimum ${expected.severity_min}`);

  if (expected.confidence_min !== undefined && verdict.confidence < expected.confidence_min)
    failures.push(`confidence ${verdict.confidence}% below minimum ${expected.confidence_min}%`);

  return failures;
}

// ─── Runner ────────────────────────────────────────────────────────────────

const PASS = "\x1b[32m✓\x1b[0m";
const FAIL = "\x1b[31m✗\x1b[0m";
const DIM  = "\x1b[2m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const YELLOW = "\x1b[33m";

async function runFixture(fixture, runIndex, totalRuns) {
  const runLabel = totalRuns > 1 ? ` (run ${runIndex + 1}/${totalRuns})` : "";
  process.stdout.write(`  ${DIM}${fixture.label}${runLabel}...${RESET} `);

  const start = Date.now();
  let rawOutput, verdict, failures;

  try {
    if (fixture.type === "email") {
      rawOutput = await triageEmail(fixture.email);
      verdict = extractEmailVerdict(rawOutput);
      failures = assertEmail(verdict, fixture.expected_email);
    } else {
      rawOutput = await triageCall(fixture.transcript);
      verdict = extractCallVerdict(rawOutput);
      failures = assertCall(verdict, fixture.expected, runIndex);
    }
  } catch (err) {
    process.stdout.write(`${FAIL}\n`);
    return { id: fixture.id, run: runIndex, pass: false, failures: [`API error: ${err.message}`], verdict: null, ms: Date.now() - start };
  }

  const ms = Date.now() - start;
  const pass = failures.length === 0;

  if (pass) {
    const summary = verdict
      ? (fixture.type === "email"
          ? `${verdict.action} | severity ${verdict.severity} | conf ${verdict.confidence}%`
          : `${verdict.intent} → ${verdict.route} | urgency ${verdict.urgency} | conf ${verdict.confidence}%`)
      : "";
    process.stdout.write(`${PASS} ${DIM}${summary} (${ms}ms)${RESET}\n`);
  } else {
    process.stdout.write(`${FAIL}\n`);
    for (const f of failures) {
      console.log(`     ${YELLOW}↳ ${f}${RESET}`);
    }
    if (!verdict) {
      const tail = rawOutput ? rawOutput.slice(-300) : "(no output)";
      console.log(`     ${DIM}Raw tail: ${tail}${RESET}`);
    }
  }

  return { id: fixture.id, run: runIndex, pass, failures, verdict, ms };
}

async function main() {
  const args = process.argv.slice(2);
  const idFilter = args.includes("--id") ? args[args.indexOf("--id") + 1] : null;
  const runs = args.includes("--runs") ? parseInt(args[args.indexOf("--runs") + 1]) : 1;

  const fixtures = JSON.parse(readFileSync(path.join(__dirname, "fixtures.json"), "utf8"));
  const targets = idFilter ? fixtures.filter(f => f.id === idFilter) : fixtures;

  if (targets.length === 0) {
    console.error(`No fixtures found${idFilter ? ` with id "${idFilter}"` : ""}`);
    process.exit(1);
  }

  console.log(`\n${BOLD}Dispatch Evals${RESET} — ${targets.length} fixture(s) × ${runs} run(s) = ${targets.length * runs} total calls\n`);

  const allResults = [];

  for (const fixture of targets) {
    console.log(`${BOLD}${fixture.id}${RESET}`);
    for (let r = 0; r < runs; r++) {
      const result = await runFixture(fixture, r, runs);
      allResults.push(result);
    }
  }

  // Summary
  const total = allResults.length;
  const passed = allResults.filter(r => r.pass).length;
  const failed = total - passed;
  const avgMs = Math.round(allResults.reduce((s, r) => s + r.ms, 0) / total);

  console.log(`\n${"─".repeat(52)}`);
  console.log(`${BOLD}Results: ${passed === total ? PASS : FAIL} ${passed}/${total} passed${RESET}  |  avg ${avgMs}ms/call`);

  if (failed > 0) {
    console.log(`\n${YELLOW}Failed:${RESET}`);
    for (const r of allResults.filter(r => !r.pass)) {
      console.log(`  ${r.id}${runs > 1 ? ` run-${r.run + 1}` : ""}: ${r.failures.join("; ")}`);
    }
  }

  // Consistency report (only when --runs > 1)
  if (runs > 1) {
    console.log(`\n${BOLD}Consistency:${RESET}`);
    for (const fixture of targets) {
      const results = allResults.filter(r => r.id === fixture.id && r.verdict);
      if (results.length < 2) continue;

      if (fixture.type === "email") {
        const actions = [...new Set(results.map(r => r.verdict.action))];
        const consistent = actions.length === 1;
        console.log(`  ${consistent ? PASS : FAIL} ${fixture.id}: action ${consistent ? "stable" : `varied: ${actions.join(", ")}`}`);
      } else {
        const routes = [...new Set(results.map(r => r.verdict.route))];
        const intents = [...new Set(results.map(r => r.verdict.intent))];
        const routeOk = routes.length === 1;
        const intentOk = intents.length === 1;
        console.log(`  ${routeOk && intentOk ? PASS : FAIL} ${fixture.id}: route ${routeOk ? "stable" : `varied: ${routes.join(", ")}`} | intent ${intentOk ? "stable" : `varied: ${intents.join(", ")}`}`);
      }
    }
  }

  console.log();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error("Eval runner crashed:", err);
  process.exit(1);
});
