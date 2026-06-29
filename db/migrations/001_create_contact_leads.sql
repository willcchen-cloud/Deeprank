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
