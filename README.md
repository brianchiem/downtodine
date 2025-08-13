# Down to Dine (MVP)

React Native + Node/Express + MongoDB app for spontaneous meal planning with friends via daily/hourly opt-in.

## Stack
- Frontend: Expo (React Native)
- Backend: Node.js (Express), MongoDB Atlas
- Auth: Email/Username/Password with JWT

## Structure
```
frontend/   # Expo app
backend/    # Express API server
```

## Setup
### Backend
1. Create `backend/.env`:
```
PORT=4000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```
2. Install deps and run:
```
cd backend
npm install
npm run dev
```

### Frontend
1. Create `frontend/.env`:
```
EXPO_PUBLIC_API_URL=http://<YOUR_LAN_IP>:4000
```
2. Install deps and run:
```
cd frontend
npm install
npx expo start
```

## Features
- Auth: Register/Login, token persisted in AsyncStorage
- Profile: Shows current user via `/api/auth/me`, Ping API button
- Hourly Opt-In (Home):
  - Select specific hours: Lunch (10–15) and Dinner (16–21)
  - Quick-select Lunch/Dinner/Both, Clear
  - Batched updates via Update button, Revert to server state
  - Dirty indicator and Saved toast
  - Pull-to-refresh; selected-hours counter

## API (selected)
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/availability/today` → `{ date, hours }`
- `POST /api/availability/today` `{ hours:number[] }` → set today’s hours
- `DELETE /api/availability/today` → clear today’s hours

## Notes
- Ensure your LAN IP is reachable from device/emulator.
- If you change env files, restart Expo with cache clear: `npx expo start -c`.
- Request logging is enabled; availability routes log GET/POST/DELETE.

## Roadmap
- Show friends with overlapping hours
- Radial clock UI (react-native-svg)
- Rate limiting & input validation hardening
