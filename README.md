# SkillSwap Realtime (Chat + Calls)

This repo adds friends-only chat and 1:1 video calls with signaling over Socket.IO, a whiteboard, shared notes, optional client-side recording, and extensible server-side recording.

## Run locally

Backend:

1. cd backend
2. cp .env.example .env and set MONGODB_URI, ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET
3. npm install
4. npm run dev

Frontend:

1. cd frontend
2. npm install
3. npm run dev

Open the frontend at http://localhost:5173

## Verify features

- Register and login (JWT issued)
- Add a friend (Friend requests via /api/friend)
- Open Friends page and use Chat button (loads history + realtime Socket.IO)
- Start Call (creates session, negotiates WebRTC via sockets; screen-share, whiteboard, notes)
- Recording fallback: click Start/Stop Recording to download .webm

## Docker (optional)

cd backend && docker compose up -d

This runs API, MongoDB, and coturn.

## Notes

- Server-side recording is stubbed; integrate mediasoup/Janus via services/recorder.js
- Security: REST and sockets use JWT; server enforces friends-only access
- Scaling: use Redis adapter for Socket.IO and horizontal replicas
