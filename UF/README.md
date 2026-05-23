# Upload Folder

ChocoRiches is now organized as a MERN stack project with a React frontend and an Express/MongoDB backend.

## Folder Structure

```txt
.
├── frontend/        # React + Vite app, plain .jsx/.js files
├── backend/         # Express + Mongoose API
├── package.json     # Root workspace scripts
└── .env.example     # Shared backend env example
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

The backend runs on `http://localhost:3001`, and the versioned API is available at `http://localhost:3001/api/v1`. The frontend reads `frontend/.env`, including `VITE_API_URL` and `VITE_RAZORPAY_KEY_ID`. MongoDB is used when `MONGODB_URI` is set; otherwise the API uses the same seeded demo data so the current UI output stays unchanged.

## Build

```bash
npm run build
npm run start
```

## Admin Module

The admin dashboard runs at `http://localhost:5173/admin` during development.

Default local admin credentials are read from `backend/.env`:

```txt
ADMIN_EMAIL=admin@chocoriches.com
ADMIN_PASSWORD=change-this-admin-password
```

The admin can manage products, categories, users, orders, service pincodes, blocked delivery dates, and maintenance mode.
