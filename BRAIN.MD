# BRAIN

Project-memory notes for Agger Grand.
This file is local-only and ignored by git.

## Naming Convention Reminder

- Avoid duplicate generic filenames across feature folders (for example multiple `index.html` pages for different flows).
- Prefer explicit, intent-based page names (for example `login.html`, `onboard.html`) to reduce routing and owner confusion.
- Use `index.html` only when the framework/hosting/router explicitly requires it.
- Before adding a new page, check existing names and keep naming unique unless duplication is technically required.

## What Was Added

### 1) Homepage LOGIN button
- File: `index.html`
- A fifth homepage card was added with label `LOGIN`.
  - Route target is `login/login.html`.
- Styling tweak in `css/style.css`:
  - Added `.grid-item-login` so the fifth card sits centered on its own row on desktop.
  - Mobile override keeps it full width.

### 2) Dedicated login page (separate from nutrient input)
- File: `login/login.html`
- Purpose:
  - Sign in existing users.
  - Create new users.
  - Show who is signed in.
  - Show a summary of saved onboarding submissions.
- Scripts loaded:
  - `script/auth.js` (core auth + storage logic)
  - `script/login.js` (UI actions for login page)
- Styling loaded:
  - `css/auth.css` (form cards/buttons/status UI)

### 3) Dedicated onboarding page
- File: `onboarding/onboard.html`
- Purpose:
  - Collect onboarding user information (name, email, phone, location, grow type, experience, goals).
  - Save that data as history tied to the logged-in user.
  - Display recent submissions for that user.
- Scripts loaded:
  - `script/auth.js`
  - `script/onboarding.js`

### 4) Local workspace persistence server
- File: `workspace_server.py`
- Purpose:
  - Serve static files for local preview.
  - Expose `GET/POST /api/storage/snapshot`.
  - Persist auth/onboarding snapshot to `data/workspace_auth_snapshot.local.json`.
- Auth behavior:
  - `auth.js` still uses `localStorage` keys for app state.
  - When API is available, `auth.js` hydrates from workspace snapshot and syncs writes back to workspace.

## How Login Works (plain English)

1. User opens `/login/login.html`.
2. If they click `Create Account`:
   - `login.js` calls `AggerAuth.register(...)`.
   - `auth.js` validates email + minimum password length.
   - Password is hashed in-browser using SHA-256 (Web Crypto API).
   - User record is saved to `localStorage` under key `aggergrand_users_v1`.
   - Current session user ID is saved under `aggergrand_current_user_id_v1`.
   - If workspace API is running, snapshot is also persisted to workspace JSON.
3. If they click `Sign In`:
   - `login.js` calls `AggerAuth.login(...)`.
   - `auth.js` finds user by normalized email and compares password hash.
   - On success, current session user ID is updated.
4. After success:
   - User is redirected to `/onboarding/onboard.html`.

## How Onboarding Save Works

1. On `/onboarding/onboard.html`, script calls `AggerAuth.requireLogin("../login/login.html")`.
   - If no logged-in user, redirect to login.
2. User submits onboarding form.
3. `onboarding.js` builds a `profile` object from form inputs.
4. `onboarding.js` calls `AggerAuth.saveOnboardingRecord(...)`.
5. `auth.js` writes a record to `localStorage` key `aggergrand_onboarding_records_v1`:
   - `id`
   - `userId` (links record to account)
   - `createdAt`
   - `profile` data
6. UI refreshes and shows saved submissions for that current user only.
7. If workspace API is running, snapshot is synced to workspace JSON.

## Storage Model (current)

- Primary UX state remains in browser `localStorage`.
- Local dev persistence can sync to workspace file `data/workspace_auth_snapshot.local.json` via `workspace_server.py`.
- Data is still local-machine only (not multi-device, not cloud).
- Good for prototype/demo, not production account persistence.

## Security/Behavior Notes

- Passwords are hashed before storage, but this is still not production auth because:
  - Entire auth/db is client-side.
  - No server-side enforcement.
  - No secure session tokens.
- Output in submission history is HTML-escaped to reduce XSS risk in rendered lists.

## Explain-To-Owner Script (quick)

Use this wording:

> We added a standalone account flow that does not touch nutrient input.  
> LOGIN sends users to `/login/login.html`, where they can sign in or create an account.  
> After login, they go to `/onboarding/onboard.html` and each onboarding form submission is saved as user-linked history.  
> In local preview, data is synced to a workspace JSON file through `workspace_server.py` (with `localStorage` still used for session UX).  
> For production, the same flow should be moved to a backend auth + database layer so data is persistent across devices and securely managed.

## Production Upgrade Path (next)

1. Add backend auth provider (Supabase/Auth0/Firebase/custom API).
2. Move user + onboarding records to server database.
3. Replace `localStorage` reads/writes with API calls.
4. Add session token handling and authorization.
5. Keep current UI pages; only data layer changes.
