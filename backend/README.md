# Bright Backend

Express + MongoDB backend for the Bright e-commerce app, structured with an MVC
architecture. This first slice implements **authentication only: login & signup**
with JWT. (Google sign-in is intentionally NOT implemented.)

## Structure (MVC)

```
backend/
├── server.js                 # entry point (loads env, connects DB, starts server)
└── src/
    ├── app.js                # express app: CORS, json, routes, error handling
    ├── config/db.js          # Mongoose connection
    ├── models/User.js        # User schema (bcrypt hashing, JWT helpers)
    ├── controllers/          # thin HTTP layer (authController)
    ├── services/             # business logic (authService)
    ├── routes/               # route → controller mapping (authRoutes)
    ├── middleware/           # protect/authorize, errorHandler
    └── utils/                # generateToken, generateCode, validators
```

## Setup

```bash
cd backend
npm install
cp .env.example .env   # then edit values (a working .env is already provided for dev)
npm run dev            # nodemon, or: npm start
```

Requires a running MongoDB instance at the `MONGO_URI` in `.env`
(defaults to `mongodb://127.0.0.1:27017/bright`).

## Auth API

Base URL: `http://localhost:5000/api/auth`

### Signup

| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/register` | `{ name, email, password, phone? }` | Creates an **unverified** account, returns a 6-digit code. Does not issue a token yet. |
| POST | `/verify-email` | `{ email, code }` | Activates the account and returns `{ token, user }`. |
| POST | `/resend-code` | `{ email }` | Issues a fresh verification code. |

### Login

| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/login` | `{ email, password }` | Returns `{ token, user }`, or `{ require2FA: true, userId }` if 2FA is enabled. Blocks unverified emails. |
| POST | `/2fa/verify` | `{ userId, code }` | Completes a 2FA login and returns `{ token, user }`. |

### Cases handled
- Duplicate email (409), wrong password / unknown email (401, generic message),
  unverified email blocked at login (403), invalid/expired verification & 2FA codes (400),
  field validation (400), bcrypt password hashing, JWT signing, role assignment
  (`USER` default; `EMPLOYEE`/`ADMIN` supported).

### Dev convenience
When `NODE_ENV=development`, `/register`, `/resend-code`, and `/login` (2FA path)
return the generated code as `devVerificationCode` / `devTwoFactorCode` so you can
test the flow without an email/SMS provider.

`user` shape returned to the frontend: `{ id, email, name, role, phone }`.
