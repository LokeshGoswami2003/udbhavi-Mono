# udbhavi Mono Codex Guide

Treat this repository as the source of truth. Read the current files and docs before making project decisions, and do not rely on older project chat memory unless the user explicitly asks for it.

## Environment

- Shell: PowerShell on Windows.
- Search: use `rg` first for text and file discovery.
- Node: project work is split between `client/` and `server/`.
- Codex project trust is configured globally for this workspace.
- Local URLs: use `http://localhost:4000` for the server and `http://localhost:5173` for the client. Avoid `127.0.0.1` for this project unless the user explicitly asks for it.

## Common Commands

- Client install: `npm install` from `client/`.
- Client dev: `npm run dev` from `client/`.
- Client build: `npm run build` from `client/`.
- Client lint: `npm run lint` from `client/`.
- Server install: `npm install` from `server/`.
- Server dev: `npm run dev` from `server/`.
- Server start: `npm start` from `server/`.

## Working Rules

- Keep frontend and backend code modular.
- Keep implementation notes out of user-facing UI.
- Keep scope tight to the user request.
- If setup or architecture changes, update the relevant docs in the same session.
- Prefer small, verifiable changes and run the closest available check before finishing.
- Add practical logging for new backend work: include request IDs, route or module context, useful lifecycle events, and sanitized error details. Never log secrets, full connection strings, tokens, passwords, or raw credentials.
