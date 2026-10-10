/**
 * ORBITAL//CYBER smoke test.
 *
 * Verifies the built app end to end: every route responds, the contact API
 * enforces its full defence chain (token → abuse ceiling → honeypot →
 * sanitisation → validation → success budget → storage), and no server secret
 * leaks into the client bundle.
 *
 * Usage:
 *   npm run build
 *   npm run start          # or: CONTACT_ALLOW_LOG_ONLY=true npm run start
 *   node scripts/smoke-test.mjs [--base http://127.0.0.1:3000] [--abuse]
 *
 * Exit code 0 = all checks passed, 1 = at least one failure.
 */
import { createHmac } from "node:crypto";
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index !== -1 && args[index + 1] ? args[index + 1] : fallback;
};

const BASE = getArg("base", process.env.BASE_URL ?? "http://127.0.0.1:3000");
const RUN_ABUSE = args.includes("--abuse");

/* Read the signing secret the server is using (env wins over .env.local). */
function readSecret() {
  if (process.env.CONTACT_FORM_SECRET) return process.env.CONTACT_FORM_SECRET;
  const path = join(process.cwd(), ".env.local");
  if (!existsSync(path)) return null;
  const match = readFileSync(path, "utf8").match(/^\s*CONTACT_FORM_SECRET\s*=\s*"?([^"\n]+)"?/m);
  return match?.[1] ?? null;
}
const SECRET = readSecret();

const results = [];
function record(name, passed, detail = "") {
  results.push({ name, passed, detail });
  const mark = passed ? "\x1b[32mPASS\x1b[0m" : "\x1b[31mFAIL\x1b[0m";
  console.log(`${mark}  ${name}${detail ? `  \x1b[90m${detail}\x1b[0m` : ""}`);
}

function sign(issuedAt) {
  return createHmac("sha256", SECRET).update(String(issuedAt)).digest("base64url");
}

/** A token that is old enough to pass the human-timing check. */
const freshToken = () => {
  const issuedAt = Date.now() - 4000;
  return `${issuedAt}.${sign(issuedAt)}`;
};

async function post(body, headers = {}) {
  const response = await fetch(`${BASE}/api/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  return { status: response.status, data, headers: response.headers };
}

const validPayload = (overrides = {}) => ({
  name: "Ada Lovelace",
  email: "ada@analytical.engine",
  subject: "Orbital dashboard enquiry",
  message: "I'm building a real-time orbital dashboard and need help with the WebGL layer plus the ingestion API behind it.",
  projectType: "Web application",
  budget: "$5k – $15k",
  timeline: "1 – 3 months",
  website: "",
  token: freshToken(),
  ...overrides,
});

/* ── 1. routes ────────────────────────────────────────────────── */
const routes = [
  { path: "/", expect: 200, contains: "BUILDING" },
  { path: "/about", expect: 200, contains: "OPERATOR PROFILE" },
  { path: "/services", expect: 200, contains: "SERVICE MODULES" },
  { path: "/skills", expect: 200, contains: "CAPABILITY MATRIX" },
  { path: "/experience", expect: 200, contains: "FLIGHT LOG" },
  { path: "/projects", expect: 200, contains: "CASE FILES" },
  { path: "/projects/nebula-commerce", expect: 200, contains: "Nebula Commerce" },
  { path: "/projects/synapse-copilot", expect: 200, contains: "The problem" },
  { path: "/contact", expect: 200 },
  { path: "/projects/does-not-exist", expect: 404 },
  { path: "/nope", expect: 404 },
  { path: "/sitemap.xml", expect: 200, contains: "<urlset" },
  { path: "/robots.txt", expect: 200, contains: "Sitemap" },
  { path: "/manifest.webmanifest", expect: 200, contains: "ORBITAL" },
  { path: "/og.png", expect: 200 },
  { path: "/favicon.svg", expect: 200 },
];

async function checkRoutes() {
  for (const route of routes) {
    try {
      const response = await fetch(`${BASE}${route.path}`);
      const text = route.contains ? await response.text() : "";
      const statusOk = response.status === route.expect;
      const bodyOk = !route.contains || text.includes(route.contains);
      record(
        `GET ${route.path} → ${route.expect}`,
        statusOk && bodyOk,
        statusOk ? (bodyOk ? "" : `body missing "${route.contains}"`) : `got ${response.status}`,
      );
    } catch (error) {
      record(`GET ${route.path} → ${route.expect}`, false, error.message);
    }
  }
}

/* ── 2. SEO / metadata ────────────────────────────────────────── */
async function checkSeo() {
  const home = await (await fetch(`${BASE}/`)).text();
  record("home: <title> present", /<title>[^<]+<\/title>/.test(home));
  record("home: meta description", home.includes('name="description"'));
  record("home: canonical link", home.includes('rel="canonical"'));
  record("home: Open Graph tags", home.includes('property="og:image"') && home.includes('property="og:title"'));
  record("home: twitter card", home.includes('name="twitter:card"'));
  record("home: JSON-LD Person", home.includes('"@type":"Person"'));
  record("home: JSON-LD WebSite", home.includes('"@type":"WebSite"'));
  record("home: theme-color", home.includes('name="theme-color"'));
  record("home: lang attribute", /<html[^>]+lang="en"/.test(home));
  record("home: skip link", home.includes("Skip to content"));
  record("home: single h1", (home.match(/<h1[\s>]/g) ?? []).length === 1);

  const project = await (await fetch(`${BASE}/projects/atlas-pulse`)).text();
  record("project: canonical per slug", project.includes("/projects/atlas-pulse"));
  record("project: JSON-LD CreativeWork", project.includes('"@type":"CreativeWork"'));

  const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text();
  record("sitemap: lists project routes", sitemap.includes("/projects/nebula-commerce"));
  record("sitemap: lists all sections", ["/about", "/services", "/skills", "/experience", "/contact"].every((p) => sitemap.includes(p)));
}

/* ── 3. contact API defence chain ─────────────────────────────── */
async function checkApi() {
  const health = await (await fetch(`${BASE}/api/contact`)).json();
  record("GET /api/contact health", health.ok === true, `storage=${health.storage}`);
  record("health does not leak the URI", !JSON.stringify(health).includes("mongodb+srv"));

  const max = health.rateLimit?.max ?? 5;
  const storage = health.storage;

  if (!SECRET) {
    record("CONTACT_FORM_SECRET available to the test", false, "set it in .env.local or the environment");
    return;
  }

  // 3.1 non-JSON body
  const notJson = await fetch(`${BASE}/api/contact`, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: "hello",
  });
  record("POST text/plain → 415", notJson.status === 415, `got ${notJson.status}`);

  // 3.2 malformed JSON
  const malformed = await post("{not json");
  record("POST malformed JSON → 400", malformed.status === 400, `got ${malformed.status}`);

  // 3.3 oversized body
  const huge = await post(validPayload({ message: "x".repeat(20_000) }));
  record("POST oversized body → 413", huge.status === 413, `got ${huge.status}`);

  // 3.4 token checks
  const noToken = await post(validPayload({ token: undefined }));
  record("POST without token → 400", noToken.status === 400, `got ${noToken.status}`);

  const tampered = await post(validPayload({ token: `${Date.now() - 5000}.${sign(Date.now() - 4000)}` }));
  record("POST tampered token → 400", tampered.status === 400, `got ${tampered.status}`);

  const tooFast = await post(validPayload({ token: `${Date.now()}.${sign(Date.now())}` }));
  record("POST instant submit → 400 (too fast)", tooFast.status === 400, `got ${tooFast.status}`);

  const expired = await post(validPayload({ token: (() => { const t = Date.now() - 1000 * 60 * 60 * 24; return `${t}.${sign(t)}`; })() }));
  record("POST expired token → 400", expired.status === 400, `got ${expired.status}`);

  // 3.5 validation
  const badEmail = await post(validPayload({ email: "not-an-email" }));
  record(
    "POST invalid email → 422 + fieldErrors.email",
    badEmail.status === 422 && Boolean(badEmail.data?.fieldErrors?.email),
    `got ${badEmail.status}`,
  );

  const shortMessage = await post(validPayload({ message: "too short" }));
  record(
    "POST short message → 422 + fieldErrors.message",
    shortMessage.status === 422 && Boolean(shortMessage.data?.fieldErrors?.message),
    `got ${shortMessage.status}`,
  );

  const missingName = await post(validPayload({ name: "" }));
  record("POST empty name → 422", missingName.status === 422, `got ${missingName.status}`);

  // 3.6 sanitisation: markup and script payloads must not be stored verbatim
  const xss = await post(validPayload({ message: `<script>alert("x")</script> ${"x".repeat(40)}` }));
  record("POST script payload rejected → 422", xss.status === 422, `got ${xss.status}`);

  const sqlish = await post(validPayload({ subject: "'; DROP TABLE users; --" }));
  record("POST SQL-ish subject rejected → 422", sqlish.status === 422, `got ${sqlish.status}`);

  // 3.7 honeypot: silent success, nothing stored
  const bot = await post(validPayload({ website: "https://spam.example" }));
  record(
    "POST honeypot filled → 200 and not persisted",
    bot.status === 200 && bot.data?.persisted === false,
    `got ${bot.status}`,
  );

  // 3.8 happy path (depends on storage mode)
  const ok = await post(validPayload());
  if (storage === "unavailable") {
    record("POST valid (no DB, strict) → 503", ok.status === 503, `got ${ok.status}`);
  } else if (storage === "log-only") {
    record(
      "POST valid (log-only) → 201 persisted:false",
      ok.status === 201 && ok.data?.ok === true && ok.data?.persisted === false,
      `got ${ok.status}`,
    );
  } else {
    record(
      "POST valid (mongodb) → 201 persisted:true",
      ok.status === 201 && ok.data?.persisted === true && Boolean(ok.data?.id),
      `got ${ok.status}`,
    );
  }

  // 3.9 optional: abuse ceiling (max*4 authenticated attempts)
  if (RUN_ABUSE) {
    const abuseMax = health.abuseLimit?.max ?? max * 4;
    let blocked = 0;
    for (let i = 0; i < abuseMax + 3; i += 1) {
      const response = await post(validPayload({ email: `invalid-${i}@nope` }));
      if (response.status === 429) {
        blocked = i + 1;
        record("abuse ceiling returns Retry-After", Number(response.headers.get("retry-after")) > 0);
        break;
      }
    }
    record(`abuse ceiling trips after ~${abuseMax} attempts`, blocked > 0 && blocked <= abuseMax + 2, `tripped at ${blocked || "never"}`);
  }

  // 3.10 success budget (runs last — it exhausts the limiter for this window).
  // Skipped under --abuse: that run already poisoned both buckets for this IP.
  if (!RUN_ABUSE) {
  let limitedAt = 0;
  for (let i = 0; i < max + 3; i += 1) {
    const response = await post(validPayload({ subject: `Rate limit probe ${i}` }));
    if (response.status === 429) {
      limitedAt = i + 1;
      record("429 includes Retry-After header", Number(response.headers.get("retry-after")) > 0);
      record("429 body explains the wait", typeof response.data?.error === "string" && response.data.error.toLowerCase().includes("too many"));
      break;
    }
    if (storage === "unavailable" && response.status === 503) {
      // Strict mode never reaches the success budget; stop probing.
      record("strict mode returns 503 before the success budget", true);
      break;
    }
  }
  if (storage !== "unavailable") {
    record(`success budget trips after ~${max} messages`, limitedAt > 0 && limitedAt <= max + 1, `tripped at ${limitedAt || "never"}`);
  }
  }
}

/* ── 4. secret hygiene in the client bundle ───────────────────── */
function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) walk(full, files);
    else if (/\.(js|mjs|css|json)$/.test(entry)) files.push(full);
  }
  return files;
}

function checkBundleHygiene() {
  const staticDir = join(process.cwd(), ".next", "static");
  if (!existsSync(staticDir)) {
    record("client bundle scan", false, ".next/static missing — run `npm run build` first");
    return;
  }

  const files = walk(staticDir);
  const needles = [
    SECRET ? { label: "CONTACT_FORM_SECRET", value: SECRET } : null,
    process.env.MONGODB_URI ? { label: "MONGODB_URI", value: process.env.MONGODB_URI } : null,
    { label: "mongodb+srv connection string", value: "mongodb+srv://" },
  ].filter(Boolean);

  let leaked = null;
  for (const file of files) {
    const content = readFileSync(file, "utf8");
    for (const needle of needles) {
      if (needle.value && content.includes(needle.value)) {
        leaked = `${needle.label} found in ${file.replace(process.cwd(), "")}`;
        break;
      }
    }
    if (leaked) break;
  }

  record(`client bundle is free of server secrets (${files.length} files scanned)`, !leaked, leaked ?? "");
}

/* ── run ──────────────────────────────────────────────────────── */
console.log(`\n\x1b[1mORBITAL//CYBER smoke test\x1b[0m → ${BASE}\n`);

try {
  await checkRoutes();
  await checkSeo();
  await checkApi();
  checkBundleHygiene();
} catch (error) {
  console.error("\n\x1b[31mSmoke test crashed:\x1b[0m", error);
  process.exit(1);
}

const failed = results.filter((result) => !result.passed);
console.log(
  `\n\x1b[1m${results.length - failed.length}/${results.length} checks passed\x1b[0m${
    failed.length ? `  \x1b[31m(${failed.length} failed)\x1b[0m` : "  \x1b[32m✓\x1b[0m"
  }\n`,
);
if (failed.length) {
  console.log("Failures:");
  failed.forEach((result) => console.log(`  · ${result.name}${result.detail ? ` — ${result.detail}` : ""}`));
  console.log();
}
process.exit(failed.length ? 1 : 0);
