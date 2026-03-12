# Agger Grand
Tell Us All The Dirt

## Project Overview
Agger Grand is a decision support system designed to help gardeners and small-scale farmers analyze soil health. The project integrates USDA soil classification standards with a custom recommendation engine to provide actionable soil improvement guidance.

## Local Auth Preview Setup (Owner + Team)
This project currently uses a local auth prototype for `/login/login.html` and `/onboarding/onboard.html`.
When run with `workspace_server.py`, auth/onboarding data is persisted to a workspace JSON file.

### 1) Run locally
Run the workspace server from the repo root so routes and workspace persistence both work.

Example (Python 3):
```powershell
python workspace_server.py --port 5500
```
Then open:
1. `http://localhost:5500/`
2. `http://localhost:5500/login/login.html`
3. `http://localhost:5500/onboarding/onboard.html`

Workspace file written by the server:
- `data/workspace_auth_snapshot.local.json`

If you use `python -m http.server 5500` instead, the app still works, but falls back to browser `localStorage` only (no workspace file persistence).

### 2) Create account flow (simulated preview behavior)
When `Create Account` is clicked on `/login/login.html`:
1. Email format is validated.
2. Password must be at least 8 characters.
3. Password is hashed in-browser (SHA-256).
4. User is saved to `localStorage` key `aggergrand_users_v1`.
5. Current session user id is saved to `aggergrand_current_user_id_v1`.
6. If workspace server is running, snapshot data is also written to `data/workspace_auth_snapshot.local.json`.
7. User is redirected to `/onboarding/onboard.html` (about 500ms).

### 3) Sign in flow
When `Sign In` is clicked on `/login/login.html`:
1. Email is normalized and looked up in local users.
2. Password hash is compared.
3. On success, current session is updated.
4. User is redirected to `/onboarding/onboard.html`.

### 4) Onboarding saves
On `/onboarding/onboard.html`:
1. Login is required. Unauthenticated users are redirected to `/login/login.html`.
2. Submissions are saved under `aggergrand_onboarding_records_v1`.
3. If workspace server is running, submission data is synced to `data/workspace_auth_snapshot.local.json`.
4. Records are linked by `userId` and shown per logged-in user.

### 5) Important limitations (prototype)
1. Data is local to your machine/workspace (not multi-device or cloud).
2. This is still not production security because auth logic runs in the client.
3. If both localStorage and workspace file are cleared, data is removed.

### 6) Reset local demo data
In browser DevTools Console:
```js
localStorage.removeItem("aggergrand_users_v1");
localStorage.removeItem("aggergrand_current_user_id_v1");
localStorage.removeItem("aggergrand_onboarding_records_v1");
```
Then remove workspace snapshot file:
```powershell
Remove-Item .\data\workspace_auth_snapshot.local.json -ErrorAction SilentlyContinue
```

### 7) Headless mode reminder (VS Code Edge DevTools)
Headless mode should remain off for interactive preview testing.

Workspace setting:
```json
{
  "vscode-edge-devtools.headless": false
}
```

File: `.vscode/settings.json`

## Owner Hand-off Script
Use this summary with non-technical stakeholders:

"We now have a standalone login and onboarding flow for preview/demo use. Users can create an account and sign in at `/login/login.html`, then submit onboarding data at `/onboarding/onboard.html`. In local development, data is persisted to a workspace JSON file through `workspace_server.py`, with browser localStorage used for session behavior. Production rollout still requires moving auth and storage to a proper backend service."


