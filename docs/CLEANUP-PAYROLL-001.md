Cleanup for PAYROLL-001: debug artifacts and docs
================================================

What I changed:

- Removed generated debug artifacts created during the PR workflow:
  - `.codex/` files
  - `pull_requests/PAYROLL-001-draft.md`
  - `files.txt`

- Added `.gitignore` entries to prevent these from being committed again:
  - `.codex/`
  - `pull_requests/`
  - `files.txt`

Why:

These files were created by local automation during PR creation and are not part
of the project source. Keeping them in the repository causes noise in diffs and
may leak internal debug outputs.

Follow-ups:

- Consider removing any remaining `.codex` mentions in docs if they're not
  relevant.
