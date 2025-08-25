# Changelog

All notable changes to this project will be documented in this file.

## [v0.2.0] - 2025-08-25

- __Backend__
  - Friend requests: add `FriendRequest` model and routes
    - `POST /api/friend-requests { toUsername }` — send request (auto-accept if reciprocal pending)
    - `GET /api/friend-requests` — list `{ incoming, outgoing }`
    - `POST /api/friend-requests/:id/accept` — accept and add mutual friendship
    - `POST /api/friend-requests/:id/decline` — decline
  - Friends: list/remove remain available (`GET /api/friends`, `DELETE /api/friends/:friendId`)
  - Availability
    - `GET /api/availability/friends/today` — overlaps vs your hours
    - `GET /api/availability/user/:userId/today` — a friend’s hours + overlap
    - Fix earlier route nesting bug
- __Frontend__
  - Friends screen
    - Send request by username (no instant add)
    - Requests section: Incoming (Accept/Decline), Outgoing (Pending)
    - Friend detail: today’s hours chips with overlap highlighting
    - Pull-to-refresh for lists
  - API client additions: `FriendRequestsAPI.*`, `AvailabilityAPI.getUserToday()`
- __Repo__
  - Unified monorepo (frontend + backend)
  - Fixed GitHub submodule arrow; `frontend/` is a normal folder
  - `.env` ignored (e.g., `frontend/.env`)

## [v0.1.0] - 2025-08-12

- Initial MVP scaffold
  - React Native (Expo) frontend with tabs: Home, Friends, Groups, Profile
  - Express backend with auth (register/login, JWT), `/api/auth/me`
  - Hourly opt-in with lunch/dinner quick-select, batched updates, dirty indicator, toast
  - Availability model (per-day hours), endpoints to set/get/clear today
  - Basic friends overlap list on Home
  - README and .gitignore

[Unreleased]: https://github.com/brianchiem/downtodine/compare/main...HEAD
[v0.2.0]: https://github.com/brianchiem/downtodine/releases/tag/v0.2.0
[v0.1.0]: https://github.com/brianchiem/downtodine/releases/tag/v0.1.0
