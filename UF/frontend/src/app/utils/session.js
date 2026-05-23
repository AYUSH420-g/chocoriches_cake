const USER_TOKEN_KEY = "chocoriches_user_token";
const USER_KEY = "chocoriches_user";
const SESSION_EVENT = "chocoriches-session-change";

function clearLegacySharedSession() {
  localStorage.removeItem(USER_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function readJson(key) {
  try {
    return JSON.parse(sessionStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}

export function getUserToken() {
  return sessionStorage.getItem(USER_TOKEN_KEY) || "";
}

export function getStoredUser() {
  return readJson(USER_KEY);
}

export function saveUserSession({ token, user }) {
  clearLegacySharedSession();
  if (token) {
    sessionStorage.setItem(USER_TOKEN_KEY, token);
  }
  if (user) {
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  }
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function clearUserSession() {
  sessionStorage.removeItem(USER_TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  clearLegacySharedSession();
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function isUserLoggedIn() {
  return Boolean(getUserToken());
}

export {
  SESSION_EVENT
};
