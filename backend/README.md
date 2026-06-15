# Alias Backend

A production-ready, highly secure, real-time messaging backend for **Alias**, an anonymous one-to-one messaging platform. Built using Node.js, Express, MongoDB (Mongoose), and Socket.IO.

---

## Technical Stack

- **Runtime Environment:** Node.js (>= 18.x)
- **Framework:** Express.js (configured with ES Modules)
- **Database:** MongoDB + Mongoose
- **Real-Time Engine:** Socket.IO
- **Security Middlewares:**
  - `helmet`: Web security headers
  - `cors`: Cross-Origin Resource Sharing control
  - `express-rate-limit`: Basic DDoS/Brute Force API protection
  - `express-mongo-sanitize`: NoSQL injection defense
  - `cookie-parser`: Secure HTTP-only cookie parsing
- **Authentication:** JWT (JSON Web Tokens) & bcryptjs password hashing
- **Input Validation:** `express-validator`

---

## Folder Structure

```text
src/
├── config/             # Database connection & configurations
├── controllers/        # Express request handlers
├── jobs/               # Background Cron cleanups (node-cron)
├── middleware/         # Security, JWT auth, validation, & error handlers
├── models/             # Mongoose schemas & indexes
├── routes/             # REST route routing
├── sockets/            # Socket.IO connection & event handlers
├── validators/         # Input schema validation rules
├── app.js              # Express app bootstrap
└── server.js           # Server runner (HTTP + Sockets + Cron)
```

---

## Setup & Running Guide

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher recommended)
- **MongoDB** (Local instance or Atlas cloud cluster URI)

### 2. Installation
Navigate to the `backend/` directory and install dependencies:
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root of the `backend/` directory (you can copy `.env.example` as a template):
```bash
cp .env.example .env
```

Fill out your specific values:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/alias
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
CORS_ORIGIN=*
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### 4. Running the Application
- **Development Mode** (with hot reload using Node's native watch mechanism):
  ```bash
  npm run dev
  ```
- **Production Mode**:
  ```bash
  npm start
  ```

---

## REST API Documentation

All API responses are formatted using standard structures:
- **Success Format**:
  ```json
  {
    "success": true,
    "message": "Action success description",
    "data": { ... }
  }
  ```
- **Error Format**:
  ```json
  {
    "success": false,
    "message": "Error description"
  }
  ```

### 1. Authentication (`/api/auth`)
| Method | Endpoint | Access | Body Payload | Description |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register` | Public | `{ username, password }` | Registers a new anonymous user, issues cookie and JWT. |
| **POST** | `/api/auth/login` | Public | `{ username, password }` | Authenticates user, issues cookie and JWT. |
| **GET** | `/api/auth/me` | Protected | None | Retrieves current authenticated user. |

### 2. User Profiles (`/api/users`)
| Method | Endpoint | Access | Body/Query Params | Description |
| :--- | :--- | :--- | :--- | :--- |
| **PUT** | `/api/users/profile` | Protected | `{ bio, interests }` | Updates current profile fields. |
| **GET** | `/api/users/search` | Protected | `?q=username&page=1&limit=10` | Searches other users by username with pagination. |
| **GET** | `/api/users/:id` | Protected | Path ID | Retrieves user profile by ID (username, bio, interests, status). |

### 3. Chat Requests (`/api/requests`)
| Method | Endpoint | Access | Body Payload | Description |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/requests` | Protected | `{ receiverId, isTemporary, expiryDuration }` | Sends a chat request to another user. |
| **GET** | `/api/requests/incoming` | Protected | None | Lists received pending chat requests. |
| **GET** | `/api/requests/sent` | Protected | None | Lists sent pending/rejected chat requests. |
| **POST** | `/api/requests/:id/accept` | Protected | None | Accepts request, sets up unique conversation. |
| **POST** | `/api/requests/:id/reject` | Protected | None | Rejects request. |

### 4. Conversations (`/api/conversations`)
| Method | Endpoint | Access | Query Params | Description |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/conversations` | Protected | None | Lists conversations with latest message, unread count, and temporary expiration status. |
| **GET** | `/api/conversations/:id/messages` | Protected | `?page=1&limit=20` | Returns chronological messages inside conversation (paginated). |

---

## Socket.IO Events

To connect, clients must authenticate during the Socket.IO handshake. Set the JWT token inside `auth.token`, `headers.authorization`, or query string `token`.

### Client to Server Events
- `send_message`: Emitted to transmit a message.
  - Payload: `{ "conversationId": "...", "content": "..." }`
  - Callback: returns `{ success: true, data: { messageObj } }` on database save.
- `typing_start`: Triggered when the user starts typing.
  - Payload: `{ "conversationId": "..." }`
- `typing_stop`: Triggered when typing ends.
  - Payload: `{ "conversationId": "..." }`
- `message_read`: Signals that the user read all messages in a conversation.
  - Payload: `{ "conversationId": "..." }`

### Server to Client Events
- `receive_message`: Delivers incoming message in real-time.
  - Payload: Message structure with `content`, `sender`, and `conversationId`.
- `typing_start` / `typing_stop`: Propagates typing status to conversation partners.
  - Payload: `{ "conversationId": "...", "senderId": "..." }`
- `message_read_receipt`: Notifies sender that recipient has read their messages.
  - Payload: `{ "conversationId": "...", "readerId": "..." }`
- `user_online` / `user_offline`: Global broadcast of users connecting or disconnecting.
  - Payload: `{ "userId": "...", "username": "..." }`

---

## Temporary Chats Cleanup Job

Expired conversations (where `isTemporary = true` and `expiresAt` < current time) are automatically pruned on an hourly interval using `node-cron`. The cron job:
1. Queries database for expired conversations.
2. Hard-deletes all associated message records in Mongoose.
3. Deletes the conversation document.
