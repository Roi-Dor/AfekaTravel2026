# Travel Afeka 2026 - Frontend

Next.js frontend application with JWT authentication and protected routes.

## Features

- Next.js 14 with App Router
- TypeScript
- Tailwind CSS for styling
- JWT-based authentication with middleware protection
- Hebrew RTL support
- Responsive design

## Pages

| Page | Path | Description |
|------|------|-------------|
| Home | `/` | Landing page with welcome message |
| Login | `/login` | User login form |
| Register | `/register` | User registration form |
| Planning | `/planning` | Trip planning form (Phase 3) |
| History | `/history` | Saved trips list (Phase 4) |

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` from example:
```bash
cp .env.example .env.local
```

3. Make sure the Auth Server is running on port 5001

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Authentication Flow

1. User visits a protected page
2. Middleware checks for `accessToken` cookie
3. If no token → redirect to `/login`
4. If token exists → validate with Auth Server
5. If invalid → clear cookie and redirect to `/login`
6. If valid → allow access

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx      # Root layout with providers
│   │   ├── page.tsx        # Home page
│   │   ├── login/          # Login page
│   │   ├── register/       # Register page
│   │   ├── planning/       # Planning page
│   │   └── history/        # History page
│   ├── components/
│   │   └── Navbar.tsx      # Navigation component
│   ├── contexts/
│   │   └── AuthContext.tsx # Authentication context
│   ├── lib/
│   │   └── auth.ts         # Auth API utilities
│   └── middleware.ts       # JWT validation middleware
├── .env.local              # Environment variables
└── tailwind.config.ts      # Tailwind configuration
```
