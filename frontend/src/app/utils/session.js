const USER_TOKEN_KEY = "chocoriches_user_token";
const USER_KEY = "chocoriches_user";
const CART_SESSION_KEY = "chocoriches_cart_session";
const SESSION_EVENT = "chocoriches-session-change";

// Remove bearer credentials left by older deployments. Authentication now uses
// HttpOnly cookies that JavaScript cannot read or exfiltrate.
localStorage.removeItem(USER_TOKEN_KEY);
localStorage.removeItem("chocoriches_admin_token");
localStorage.removeItem("chocoriches_admin_session");
if (localStorage.getItem(CART_SESSION_KEY)) {
  sessionStorage.setItem(CART_SESSION_KEY, localStorage.getItem(CART_SESSION_KEY));
  localStorage.removeItem(CART_SESSION_KEY);
}

function clearLegacySharedSession() {
  localStorage.removeItem(USER_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(USER_KEY);
}

function readJson(key) {
  try {
    return JSON.parse(sessionStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}

export function getUserToken() {
  return "";
}

export function getCartSessionId() {
  const existingSessionId = sessionStorage.getItem(CART_SESSION_KEY);
  if (existingSessionId) {
    return existingSessionId;
  }

  const nextSessionId = window.crypto?.randomUUID?.() || `cart-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  sessionStorage.setItem(CART_SESSION_KEY, nextSessionId);
  return nextSessionId;
}

export function getStoredUser() {
  return readJson(USER_KEY);
}

export function saveUserSession({ token, user }) {
  localStorage.removeItem(USER_TOKEN_KEY);
  
  if (user !== undefined) {
    if (user) {
      sessionStorage.setItem(USER_KEY, JSON.stringify(user));
      localStorage.removeItem(USER_KEY);
    } else {
      localStorage.removeItem(USER_KEY);
      sessionStorage.removeItem(USER_KEY);
    }
  }
  
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function clearUserSession() {
  localStorage.removeItem(USER_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(USER_KEY);
  clearLegacySharedSession();
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function isUserLoggedIn() {
  return Boolean(getStoredUser());
}

export function getGuestUser() {
  let data = {};
  try {
    data = JSON.parse(sessionStorage.getItem("chocoriches_guest_user") || "null") || {};
  } catch {
    data = {};
  }
  localStorage.removeItem("chocoriches_guest_user");
  if (data.timestamp && Date.now() - data.timestamp > 24 * 60 * 60 * 1000) {
    sessionStorage.removeItem("chocoriches_guest_user");
    return {};
  }
  return data;
}

export function saveGuestUser(data) {
  const current = getGuestUser();
  sessionStorage.setItem("chocoriches_guest_user", JSON.stringify({ ...current, ...data, timestamp: Date.now() }));
}

export {
  SESSION_EVENT
};
