const crypto = require("crypto");
const { Pool } = require("pg");

const PROJECT_TYPES = new Set(["数据采集", "视频清洗", "数据标注", "质量审核", "其他"]);
const LEAD_STATUSES = new Set(["new", "contacted", "closed"]);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let pool;
let schemaReady = false;

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify(body),
  };
}

function getPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    const error = new Error("DATABASE_URL is not configured.");
    error.statusCode = 500;
    throw error;
  }

  if (!pool) {
    const isLocal = /localhost|127\.0\.0\.1/i.test(connectionString);
    pool = new Pool({
      connectionString,
      max: 3,
      ssl: isLocal ? false : { rejectUnauthorized: false },
    });
  }

  return pool;
}

async function ensureSchema() {
  if (schemaReady) return;

  await getPool().query(`
    CREATE TABLE IF NOT EXISTS contact_leads (
      id BIGSERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      name_company TEXT,
      project_type TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed')),
      remark TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_contact_leads_status_created_at
      ON contact_leads (status, created_at DESC);
  `);

  schemaReady = true;
}

function readJsonBody(event) {
  if (!event.body) return {};

  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf8")
    : event.body;

  try {
    return JSON.parse(rawBody);
  } catch (error) {
    const parseError = new Error("Invalid JSON body.");
    parseError.statusCode = 400;
    throw parseError;
  }
}

function validateCreateLead(body) {
  const lead = {
    email: String(body.email || "").trim(),
    name_company: String(body.name_company || "").trim(),
    project_type: String(body.project_type || "").trim(),
    message: String(body.message || "").trim(),
  };

  const errors = {};
  if (!lead.email || !EMAIL_PATTERN.test(lead.email)) errors.email = "A valid email is required.";
  if (!PROJECT_TYPES.has(lead.project_type)) errors.project_type = "A valid project_type is required.";
  if (!lead.message) errors.message = "message is required.";
  if (lead.name_company.length > 240) errors.name_company = "name_company is too long.";
  if (lead.message.length > 5000) errors.message = "message is too long.";

  return { lead, errors };
}

function getHeader(event, name) {
  const headers = event.headers || {};
  return headers[name] || headers[name.toLowerCase()] || headers[name.toUpperCase()] || "";
}

function secureCompare(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function requireAdmin(event) {
  const expectedToken = process.env.ADMIN_API_TOKEN;
  if (!expectedToken) {
    const error = new Error("ADMIN_API_TOKEN is not configured.");
    error.statusCode = 500;
    throw error;
  }

  const authorization = getHeader(event, "authorization");
  const bearerToken = authorization.replace(/^Bearer\s+/i, "").trim();
  const token = bearerToken || getHeader(event, "x-admin-token").trim();

  if (!token || !secureCompare(token, expectedToken)) {
    const error = new Error("Unauthorized.");
    error.statusCode = 401;
    throw error;
  }
}

function parseLeadId(event) {
  const match = String(event.path || "").match(/\/contact-leads\/(\d+)\/?$/);
  return match ? Number(match[1]) : null;
}

async function createLead(event) {
  const body = readJsonBody(event);
  const { lead, errors } = validateCreateLead(body);

  if (Object.keys(errors).length > 0) {
    return json(400, { error: "Validation failed.", details: errors });
  }

  await ensureSchema();

  const result = await getPool().query(
    `
      INSERT INTO contact_leads (email, name_company, project_type, message)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, name_company, project_type, message, status, remark, created_at, updated_at
    `,
    [lead.email, lead.name_company || null, lead.project_type, lead.message],
  );

  return json(201, { ok: true, lead: result.rows[0] });
}

async function listLeads(event) {
  requireAdmin(event);
  await ensureSchema();

  const status = event.queryStringParameters?.status || "all";
  if (status !== "all" && !LEAD_STATUSES.has(status)) {
    return json(400, { error: "Invalid status filter." });
  }

  const params = [];
  let where = "";
  if (status !== "all") {
    params.push(status);
    where = "WHERE status = $1";
  }

  const result = await getPool().query(
    `
      SELECT id, email, name_company, project_type, message, status, remark, created_at, updated_at
      FROM contact_leads
      ${where}
      ORDER BY created_at DESC, id DESC
    `,
    params,
  );

  return json(200, { ok: true, leads: result.rows });
}

async function updateLead(event) {
  requireAdmin(event);
  const id = parseLeadId(event);
  if (!id) return json(404, { error: "Lead not found." });

  const body = readJsonBody(event);
  const status = String(body.status || "").trim();
  const remark = body.remark == null ? null : String(body.remark).trim();

  if (!LEAD_STATUSES.has(status)) {
    return json(400, { error: "Invalid status." });
  }

  if (remark && remark.length > 3000) {
    return json(400, { error: "remark is too long." });
  }

  await ensureSchema();

  const result = await getPool().query(
    `
      UPDATE contact_leads
      SET status = $1, remark = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING id, email, name_company, project_type, message, status, remark, created_at, updated_at
    `,
    [status, remark || null, id],
  );

  if (result.rowCount === 0) return json(404, { error: "Lead not found." });
  return json(200, { ok: true, lead: result.rows[0] });
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: { "Cache-Control": "no-store" }, body: "" };
  }

  try {
    if (event.httpMethod === "POST") return createLead(event);
    if (event.httpMethod === "GET") return listLeads(event);
    if (event.httpMethod === "PATCH") return updateLead(event);

    return json(405, { error: "Method not allowed." });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return json(statusCode, {
      error: statusCode === 500 ? "Server error." : error.message,
    });
  }
};
