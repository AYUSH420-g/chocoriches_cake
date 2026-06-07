const USER_TOKEN_KEY = "chocoriches_user_token";
const USER_KEY = "chocoriches_user";
const CART_SESSION_KEY = "chocoriches_cart_session";
const SESSION_EVENT = "chocoriches-session-change";

function clearLegacySharedSession() {
  localStorage.removeItem(USER_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function readJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}

export function getUserToken() {
  return localStorage.getItem(USER_TOKEN_KEY) || "";
}

export function getCartSessionId() {
  const existingSessionId = localStorage.getItem(CART_SESSION_KEY);
  if (existingSessionId) {
    return existingSessionId;
  }

  const nextSessionId = window.crypto?.randomUUID?.() || `cart-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  localStorage.setItem(CART_SESSION_KEY, nextSessionId);
  return nextSessionId;
}

export function getStoredUser() {
  return readJson(USER_KEY);
}

export function saveUserSession({ token, user }) {
  if (token !== undefined) {
    if (token) {
      localStorage.setItem(USER_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(USER_TOKEN_KEY);
    }
  }
  
  if (user !== undefined) {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }
  
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function clearUserSession() {
  localStorage.removeItem(USER_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  clearLegacySharedSession();
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function isUserLoggedIn() {
  return Boolean(getUserToken());
}

export function getGuestUser() {
  const data = readJson("chocoriches_guest_user") || {};
  if (data.timestamp && Date.now() - data.timestamp > 365 * 24 * 60 * 60 * 1000) {
    return {};
  }
  return data;
}

export function saveGuestUser(data) {
  const current = getGuestUser();
  localStorage.setItem("chocoriches_guest_user", JSON.stringify({ ...current, ...data, timestamp: Date.now() }));
}

export {
  SESSION_EVENT
};
