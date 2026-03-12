#!/usr/bin/env python3
"""
Local development server for Agger Grand.

What it does:
- Serves static files from the repository root.
- Persists auth/onboarding snapshot data to a workspace JSON file.
"""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

ROOT_DIR = Path(__file__).resolve().parent
SNAPSHOT_FILE = ROOT_DIR / "data" / "workspace_auth_snapshot.local.json"


def default_snapshot() -> dict:
    return {
        "users": [],
        "currentUserId": None,
        "onboardingRecords": [],
        "updatedAt": None,
    }


def normalize_snapshot(value: object) -> dict:
    snapshot = value if isinstance(value, dict) else {}
    users = snapshot.get("users")
    current_user_id = snapshot.get("currentUserId")
    onboarding_records = snapshot.get("onboardingRecords")

    return {
        "users": users if isinstance(users, list) else [],
        "currentUserId": current_user_id if isinstance(current_user_id, str) and current_user_id else None,
        "onboardingRecords": onboarding_records if isinstance(onboarding_records, list) else [],
        "updatedAt": snapshot.get("updatedAt") if isinstance(snapshot.get("updatedAt"), str) else None,
    }


def read_snapshot() -> dict:
    if not SNAPSHOT_FILE.exists():
        return default_snapshot()

    try:
        data = json.loads(SNAPSHOT_FILE.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return default_snapshot()

    normalized = normalize_snapshot(data)
    if not normalized.get("updatedAt"):
        normalized["updatedAt"] = None
    return normalized


def write_snapshot(value: object) -> dict:
    snapshot = normalize_snapshot(value)
    snapshot["updatedAt"] = datetime.now(timezone.utc).isoformat()

    SNAPSHOT_FILE.parent.mkdir(parents=True, exist_ok=True)
    temp_path = SNAPSHOT_FILE.with_suffix(SNAPSHOT_FILE.suffix + ".tmp")
    temp_path.write_text(json.dumps(snapshot, indent=2), encoding="utf-8")
    temp_path.replace(SNAPSHOT_FILE)
    return snapshot


class WorkspaceRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT_DIR), **kwargs)

    def do_GET(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        if parsed.path == "/api/storage/snapshot":
            self.respond_json(200, {"snapshot": read_snapshot()})
            return

        super().do_GET()

    def do_POST(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        if parsed.path != "/api/storage/snapshot":
            self.respond_json(404, {"error": "Not Found"})
            return

        content_length = int(self.headers.get("Content-Length", "0") or "0")
        payload_text = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else "{}"

        try:
            payload = json.loads(payload_text)
        except json.JSONDecodeError:
            self.respond_json(400, {"error": "Invalid JSON payload"})
            return

        candidate = payload.get("snapshot") if isinstance(payload, dict) and "snapshot" in payload else payload
        snapshot = write_snapshot(candidate)
        self.respond_json(200, {"snapshot": snapshot})

    def respond_json(self, status_code: int, payload: dict) -> None:
        encoded = json.dumps(payload).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run Agger Grand local server with workspace storage.")
    parser.add_argument("--host", default="127.0.0.1", help="Bind host (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=5500, help="Bind port (default: 5500)")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    server = ThreadingHTTPServer((args.host, args.port), WorkspaceRequestHandler)
    print(f"Serving Agger Grand at http://{args.host}:{args.port}")
    print(f"Workspace auth snapshot file: {SNAPSHOT_FILE}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
