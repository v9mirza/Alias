# Alias

Anonymous one-to-one messaging over real-time relays. Users connect by alias — not identity — through discoverable profiles, chat requests, and private conversations.

## Features

- **Alias-based auth** — register and chat without exposing personal identity
- **Discover** — browse and search users by alias, bio, and interests
- **Chat requests** — accept or reject before a conversation starts
- **Real-time messaging** — Socket.IO with typing indicators and read receipts
- **Disappearing chats** — optional temporary conversations with auto-expiry
- **PWA** — installable on mobile and desktop
- **Terminal theme** — per-user accent color (green, indigo, red)

## Stack

| Layer | Technologies |
|-------|--------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Zustand, Socket.IO Client |
| Backend | Node.js, Express, MongoDB, Mongoose, Socket.IO, JWT |
| Security | Helmet, rate limiting, NoSQL sanitization, bcrypt |

## License

Private project — all rights reserved.
