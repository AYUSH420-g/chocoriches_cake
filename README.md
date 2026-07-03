# Upload Folder

ChocoRiches is now organized as a MERN stack project with a React frontend and an Express/MongoDB backend.

## Folder Structure

```txt
.
├── frontend/        # React + Vite app, plain .jsx/.js files
├── backend/         # Express + Mongoose API
├── package.json     # Root workspace scripts
└── backend/.env.example # Backend environment template
```

## Running The Project

Install dependencies from the project root:

```bash
npm install
```

Run both frontend and backend together:

```bash
npm run dev
```

Or run them separately:

```bash
npm run dev:backend
npm run dev:frontend
```

The backend runs on `http://localhost:3001`, and the versioned API is available at `http://localhost:3001/api/v1`. The frontend reads `frontend/.env`, including `VITE_API_URL` and `VITE_RAZORPAY_KEY_ID`. Development can use seeded in-memory data; production fails closed if MongoDB is missing or unavailable.

## Build

```bash
npm run build
npm run start
```

## Admin Module

The admin dashboard runs at `http://localhost:5173/admin` during development.

Local admin credentials are read from `backend/.env`. Production also requires a time-based authenticator secret:

```bash
npm run generate:admin-mfa --workspace backend
```

Store the generated `ADMIN_TOTP_SECRET` only in the protected server environment and add the setup key to the administrator's authenticator app. Never commit `.env` files.

For production, use HTTPS, set a 32+ character random `JWT_SECRET`, a strong `ADMIN_PASSWORD`, `ADMIN_TOTP_SECRET`, `MONGODB_URI`, Razorpay secrets (including `RAZORPAY_WEBHOOK_SECRET`), and `TRUST_PROXY=1` only when the app is behind a trusted reverse proxy.

The admin can manage products, categories, users, orders, service pincodes, blocked delivery dates, and maintenance mode.
