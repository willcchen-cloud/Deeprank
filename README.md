# DeepRank Tech Static Site

Static website for DeepRank Tech.

## Local Preview

Open `index.html` directly in a browser, or serve the folder with any static file server.

## Netlify

This repository is ready for Netlify import.

- Build command: leave empty
- Publish directory: `.`

The same settings are also included in `netlify.toml`.

## Contact Lead Backend

The contact form uses a Netlify Function mounted at `/api/contact-leads`.

Required Netlify environment variables:

- `DATABASE_URL`: PostgreSQL connection string
- `ADMIN_API_TOKEN`: private token used by the admin page

Run the database migration before using the form:

```bash
psql "$DATABASE_URL" -f db/migrations/001_create_contact_leads.sql
```

The function also creates the table if it does not exist, but running the migration explicitly is recommended.

## Admin Page

Open `/admin/contact-leads.html` after deployment. This page is not linked from the public website navigation.

Use the `ADMIN_API_TOKEN` value to view leads, filter by status, and update status or remarks.

## API

Public endpoint:

- `POST /api/contact-leads`

Admin endpoints:

- `GET /api/contact-leads?status=all|new|contacted|closed`
- `PATCH /api/contact-leads/:id`

Statuses:

- `new`: 未处理
- `contacted`: 已联系
- `closed`: 已完成 / 已关闭
