# DeepRank Tech Static Site

Static website for DeepRank Tech.

## Local Preview

Run `npm run build` to create the whitelisted static site in `dist`.

## Netlify

This repository is ready for Netlify import.

- Build command: `npm run build`
- Publish directory: `dist`

The same settings are also included in `netlify.toml`.

## Contact Channel

- 企业邮箱尚未正式配置。
- 当前官网仅通过联系表单接收咨询。
- 将来确认企业邮箱后才能恢复公开邮箱入口。

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
