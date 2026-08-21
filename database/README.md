# Hylire Construction Database

This directory contains the database definition scripts and storage files for the Hylire Construction Management Portal.

## 📁 Files in this directory:
- **`schema.sql`**: Full PostgreSQL DDL database schema for Supabase (Tables: `users`, `projects`, `sites`, `tasks`, `materials`, `brick_estimations`, `cost_estimations`, `documents`, `chat_messages`).
- **`hylire_db.json`**: Persistent local JSON database storage used by the backend application to persist all records across server restarts.

## 🚀 How to connect to Supabase PostgreSQL:
1. Create a project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard and run the contents of [`schema.sql`](schema.sql).
3. Copy your Project URL and Anon Public Key.
4. In `backend/.env`:
   ```env
   PORT=5000
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-supabase-anon-key
   USE_FALLBACK_DB=false
   ```
5. When `SUPABASE_URL` is configured, all operations read and write directly to your Supabase PostgreSQL database. When running locally without cloud credentials, the system automatically uses the persistent `hylire_db.json` file.
