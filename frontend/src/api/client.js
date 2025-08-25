export const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

async function jsonFetch(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.message || 'Request failed';
    throw new Error(message);
  }
  return data;
}

export const AuthAPI = {
  register: (payload) => jsonFetch('/api/auth/register', { method: 'POST', body: payload }),
  login: (payload) => jsonFetch('/api/auth/login', { method: 'POST', body: payload }),
  me: (token) => jsonFetch('/api/auth/me', { method: 'GET', token }),
};

export const AvailabilityAPI = {
  getToday: (token) => jsonFetch('/api/availability/today', { method: 'GET', token }),
  optInToday: (token) => jsonFetch('/api/availability/today', { method: 'POST', token }),
  optOutToday: (token) => jsonFetch('/api/availability/today', { method: 'DELETE', token }),
  setTodayHours: (token, hours) => jsonFetch('/api/availability/today', { method: 'POST', token, body: { hours } }),
  getFriendsToday: (token) => jsonFetch('/api/availability/friends/today', { method: 'GET', token }),
  getUserToday: (token, userId) => jsonFetch(`/api/availability/user/${userId}/today`, { method: 'GET', token }),
};

export const FriendsAPI = {
  list: (token) => jsonFetch('/api/friends', { method: 'GET', token }),
  add: (token, username) => jsonFetch('/api/friends', { method: 'POST', token, body: { username } }),
  remove: (token, friendId) => jsonFetch(`/api/friends/${friendId}`, { method: 'DELETE', token }),
};

export const FriendRequestsAPI = {
  list: (token) => jsonFetch('/api/friend-requests', { method: 'GET', token }),
  send: (token, toUsername) => jsonFetch('/api/friend-requests', { method: 'POST', token, body: { toUsername } }),
  accept: (token, requestId) => jsonFetch(`/api/friend-requests/${requestId}/accept`, { method: 'POST', token }),
  decline: (token, requestId) => jsonFetch(`/api/friend-requests/${requestId}/decline`, { method: 'POST', token }),
};

export const UsersAPI = {
  search: (token, q, limit = 10) => {
    const qp = new URLSearchParams({ q, limit: String(limit) }).toString();
    return jsonFetch(`/api/users/search?${qp}`, { method: 'GET', token });
  },
};
