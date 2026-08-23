// Lightweight Client-Side Authentication Engine for I HATE PDF

const AUTH_KEY = 'ihatepdf_user_session';

export function getCurrentUser() {
  try {
    const saved = localStorage.getItem(AUTH_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    return null;
  }
}

export function loginUser({ email, password }) {
  const user = {
    id: 'usr_' + Date.now(),
    name: email.split('@')[0],
    email: email,
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${email}`,
    createdAt: new Date().toISOString()
  };
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  return user;
}

export function signupUser({ name, email, password }) {
  const user = {
    id: 'usr_' + Date.now(),
    name: name || email.split('@')[0],
    email: email,
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${email}`,
    createdAt: new Date().toISOString()
  };
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  return user;
}

export function logoutUser() {
  localStorage.removeItem(AUTH_KEY);
}
