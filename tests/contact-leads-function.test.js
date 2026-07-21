const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const Module = require("node:module");
const path = require("node:path");
const { afterEach, test } = require("node:test");

const ROOT = path.resolve(__dirname, "..");
const FUNCTION_PATH = require.resolve(path.join(ROOT, "netlify/functions/contact-leads.js"));
const PG_PATH = require.resolve("pg");
const VALID_LEAD = Object.freeze({
  email: "release-verification@example.com",
  name_company: "Release Verification",
  project_type: "其他",
  message: "FUNCTION_TEST_MARKER",
});

function loadHandler(queryImpl = async () => ({ rows: [], rowCount: 0 })) {
  const queries = [];
  const poolOptions = [];
  const previousPgModule = require.cache[PG_PATH];

  class MockPool {
    constructor(options) {
      poolOptions.push(options);
    }

    async query(text, params) {
      const query = { text, params };
      queries.push(query);
      return queryImpl(query, queries.length - 1);
    }
  }

  const mockPgModule = new Module(PG_PATH);
  mockPgModule.filename = PG_PATH;
  mockPgModule.loaded = true;
  mockPgModule.exports = { Pool: MockPool };

  delete require.cache[FUNCTION_PATH];
  require.cache[PG_PATH] = mockPgModule;

  try {
    return { handler: require(FUNCTION_PATH).handler, poolOptions, queries };
  } finally {
    if (previousPgModule) require.cache[PG_PATH] = previousPgModule;
    else delete require.cache[PG_PATH];
  }
}

async function captureServerErrors(callback) {
  const originalConsoleError = console.error;
  const entries = [];
  console.error = (...args) => entries.push(args);

  try {
    return { result: await callback(), entries };
  } finally {
    console.error = originalConsoleError;
  }
}

function createEvent(httpMethod, overrides = {}) {
  return {
    httpMethod,
    headers: {},
    path: "/api/contact-leads",
    body: JSON.stringify(VALID_LEAD),
    ...overrides,
  };
}

afterEach(() => {
  delete process.env.DATABASE_URL;
  delete process.env.ADMIN_API_TOKEN;
  delete require.cache[FUNCTION_PATH];
});

test("missing DATABASE_URL resolves to a controlled JSON 500 without leaking the exception", async () => {
  const { handler, queries } = loadHandler();
  let captured;

  await assert.doesNotReject(async () => {
    captured = await captureServerErrors(() =>
      handler(createEvent("POST"), { awsRequestId: "request-id-123" }),
    );
  });

  assert.equal(captured.result.statusCode, 500);
  assert.deepEqual(JSON.parse(captured.result.body), { error: "Server error." });
  assert.equal(queries.length, 0);
  assert.deepEqual(captured.entries, [
    [
      "contact-leads request failed",
      {
        method: "POST",
        errorName: "Error",
        statusCode: 500,
        requestId: "request-id-123",
      },
    ],
  ]);
  assert.doesNotMatch(JSON.stringify(captured.entries), /DATABASE_URL|FUNCTION_TEST_MARKER|example\.com/);
});

test("valid POST ensures the schema and inserts the lead with parameters before returning 201", async () => {
  process.env.DATABASE_URL = "test-database-url";
  const insertedLead = {
    id: 42,
    ...VALID_LEAD,
    status: "new",
    remark: null,
    created_at: "2026-07-21T00:00:00.000Z",
    updated_at: "2026-07-21T00:00:00.000Z",
  };
  const { handler, queries, poolOptions } = loadHandler(async (_query, index) =>
    index === 0 ? { rows: [], rowCount: 0 } : { rows: [insertedLead], rowCount: 1 },
  );

  const response = await handler(createEvent("POST"));

  assert.equal(response.statusCode, 201);
  assert.deepEqual(JSON.parse(response.body), { ok: true, lead: insertedLead });
  assert.equal(poolOptions.length, 1);
  assert.equal(queries.length, 2);
  assert.match(queries[0].text, /CREATE TABLE IF NOT EXISTS contact_leads/);
  assert.match(queries[0].text, /CREATE INDEX IF NOT EXISTS idx_contact_leads_status_created_at/);
  assert.equal(queries[0].params, undefined);
  assert.match(queries[1].text, /INSERT INTO contact_leads/);
  assert.match(queries[1].text, /VALUES \(\$1, \$2, \$3, \$4\)/);
  assert.match(queries[1].text, /RETURNING id, email, name_company, project_type, message/);
  assert.deepEqual(queries[1].params, [
    VALID_LEAD.email,
    VALID_LEAD.name_company,
    VALID_LEAD.project_type,
    VALID_LEAD.message,
  ]);
});

test("backend project types stay aligned with the project options in index.html", async () => {
  const [functionSource, indexHtml] = await Promise.all([
    fs.readFile(FUNCTION_PATH, "utf8"),
    fs.readFile(path.join(ROOT, "index.html"), "utf8"),
  ]);
  const backendMatch = functionSource.match(/const PROJECT_TYPES = new Set\((\[[^\n]+\])\);/);
  const selectMatch = indexHtml.match(/<select name="project_type"[\s\S]*?<\/select>/);

  assert.ok(backendMatch, "backend PROJECT_TYPES must remain statically inspectable");
  assert.ok(selectMatch, "frontend project_type select must exist");

  const backendTypes = JSON.parse(backendMatch[1]);
  const frontendTypes = [...selectMatch[0].matchAll(/<option value="([^"]*)"/g)]
    .map((match) => match[1])
    .filter(Boolean);

  assert.deepEqual(frontendTypes, backendTypes);
});

for (const httpMethod of ["GET", "PATCH"]) {
  test(`${httpMethod} async failures resolve to a generic JSON 500`, async () => {
    process.env.DATABASE_URL = "test-database-url";
    process.env.ADMIN_API_TOKEN = "test-admin-token";
    const sensitiveError = new Error("SENSITIVE_INTERNAL_ERROR_DETAIL");
    sensitiveError.statusCode = httpMethod === "GET" ? 418 : 502;
    const { handler } = loadHandler(async () => {
      throw sensitiveError;
    });
    const event = createEvent(httpMethod, {
      headers: { "x-admin-token": "test-admin-token" },
      path: httpMethod === "PATCH" ? "/api/contact-leads/42" : "/api/contact-leads",
      body: httpMethod === "PATCH" ? JSON.stringify({ status: "closed", remark: "verified" }) : undefined,
    });

    const captured = await captureServerErrors(() => handler(event));

    assert.equal(captured.result.statusCode, 500);
    assert.deepEqual(JSON.parse(captured.result.body), { error: "Server error." });
    assert.equal(captured.entries.length, 1);
    assert.deepEqual(captured.entries[0][1], {
      method: httpMethod,
      errorName: "Error",
      statusCode: 500,
    });
    assert.doesNotMatch(JSON.stringify(captured.entries), /SENSITIVE_INTERNAL_ERROR_DETAIL|test-admin-token/);
  });
}
