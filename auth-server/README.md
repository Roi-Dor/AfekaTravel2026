# Travel Afeka 2026 - Auth Server

Express.js authentication server with JWT-based authentication and silent refresh.

## Features

- User registration with bcrypt password hashing (salted)
- JWT-based authentication with access and refresh tokens
- Silent refresh mechanism (once per 24 hours)
- Developer names embedded in JWT tokens
- MongoDB for data persistence

## API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| POST | `/api/auth/refresh` | Silent token refresh | Cookie |
| POST | `/api/auth/logout` | Logout user | No |
| GET | `/api/auth/profile` | Get user profile | Yes |
| GET | `/api/auth/validate` | Validate JWT token | Yes |
| GET | `/health` | Health check | No |

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from example:
```bash
cp .env.example .env
```

3. Update `.env` with your values:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/travel-afeka
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
DEVELOPERS=Roi,Partner
CLIENT_URL=http://localhost:3000
```

4. Start MongoDB (if not running)

5. Run the server:
```bash
# Development
npm run dev

# Production
npm start
```

## JWT Token Structure

The access token includes:
- `userId`: User's MongoDB ID
- `email`: User's email
- `firstName`: User's first name
- `lastName`: User's last name
- `developers`: Array of developer names (from env)

## Silent Refresh Logic

- Refresh tokens are stored in HTTP-only cookies
- Silent refresh is limited to once per 24 hours
- Access tokens expire in 24 hours
- Refresh tokens expire in 7 days
