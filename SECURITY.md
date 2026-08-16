# Security

Security model, known risks, and guidance for deployment.

---

## Current Security Model

Learning Tracker v1 is a **single-tenant, personal tool** with no user authentication.

| Layer | Implementation |
|-------|---------------|
| Database | Supabase PostgreSQL with Row Level Security enabled |
| RLS policies | `USING (true)` — any request with a valid anon key can read and write |
| Frontend secret | Only the Supabase anon key is exposed to the browser |
| Auth | None — no sign-in flow |

This model is correct and intentional for a self-hosted personal application **where only the owner accesses it**.

---

## The Anon Key

The Supabase anon key is a **public** key — it is safe to include in browser-side JavaScript bundles. It is designed to be exposed.

What the anon key controls access to is governed entirely by **RLS policies**. In v1, the policies are permissive (`USING (true)`), which means:

> **Anyone who obtains your `VITE_SUPABASE_ANON_KEY` and `VITE_SUPABASE_URL` can read, write, and delete all your learning data.**

### Mitigation for v1

- Do not commit `.env` to version control (it is in `.gitignore`).
- Do not share your Supabase project URL and anon key publicly.
- Do not deploy this application to a public URL without adding authentication first.

For local or private network use, the current model is safe.

---

## Before Deploying Publicly

If you deploy Learning Tracker to a public URL, you must add authentication before doing so. The steps:

### 1. Enable Supabase Auth

In the Supabase Dashboard, enable your preferred OAuth provider (GitHub, Google, or email+password).

### 2. Add `user_id` to both tables

```sql
ALTER TABLE boards ADD COLUMN user_id uuid NOT NULL DEFAULT auth.uid();
ALTER TABLE topics ADD COLUMN user_id uuid NOT NULL DEFAULT auth.uid();
```

### 3. Replace RLS policies

```sql
-- boards
DROP POLICY IF EXISTS "Allow all" ON boards;
CREATE POLICY "Users manage own boards"
  ON boards FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- topics
DROP POLICY IF EXISTS "Allow all" ON topics;
CREATE POLICY "Users manage own topics"
  ON topics FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### 4. Add sign-in to the React app

Use `supabase.auth.signInWithOAuth({ provider: 'github' })`.  
Gate `App.tsx` rendering behind a session check.  
The rest of the application does not need to change.

This migration path is tracked in [BACKLOG.md](docs/BACKLOG.md) as **BL-011**.

---

## Data Privacy

All learning data (board titles, topic titles, notes, resources) is stored in your Supabase project. Supabase's privacy policy applies.

- Data is stored in the region you selected when creating the Supabase project.
- Supabase encrypts data at rest and in transit (TLS).
- You can export all your data at any time via **Settings → Export** in the app.
- You can delete all data via **Settings → Reset all data**.

---

## Dependency Security

```bash
# Check for known vulnerabilities
npm audit

# Update browserslist db (flagged in Vite build output)
npx update-browserslist-db@latest
```

Keep dependencies up to date. The only runtime dependencies with a network surface are `@supabase/supabase-js` and `lucide-react`.

---

## Content Security Policy

The app does not currently set a Content Security Policy header. If deploying behind a web server (nginx, Caddy, Vercel), add:

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co;
  img-src 'self' data:;
```

Adjust `*.supabase.co` to your specific project ref for stricter scoping.
