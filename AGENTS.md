# AGENTS

Local-only agent instructions and reminders.
This file is ignored by git.

## Codex 5.3 Usuals

- Optimize for low token usage:
  - Keep responses concise unless detail is requested.
  - Avoid repeating context already established.
  - Summarize long outputs instead of pasting large blocks.
- Optimize rate-limit usage:
  - Batch independent tool calls when possible.
  - Read only files needed for the current change.
  - Prefer focused search patterns over broad scans.
- Keep execution efficient:
  - Prefer minimal-diff edits.
  - Avoid unnecessary rewrites and duplicate work.
  - Reuse existing components and utilities when feasible.
- Maintain realism:
  - Call out risky assumptions.
  - Ask clarifying questions if ambiguity can cause rework.
  - Recommend phased delivery when scope is too large.
