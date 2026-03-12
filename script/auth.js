(function () {
  "use strict";

  var USERS_KEY = "aggergrand_users_v1";
  var CURRENT_USER_KEY = "aggergrand_current_user_id_v1";
  var ONBOARDING_KEY = "aggergrand_onboarding_records_v1";

  function readJson(key, fallbackValue) {
    try {
      var raw = window.localStorage.getItem(key);
      if (!raw) return fallbackValue;
      var parsed = JSON.parse(raw);
      return parsed == null ? fallbackValue : parsed;
    } catch (error) {
      return fallbackValue;
    }
  }

  function writeJson(key, value) {
    window.localStorage.setItem(key, JSON.stringify(value));
  }

  function normalizeEmail(email) {
    return (email || "").trim().toLowerCase();
  }

  function makeId(prefix) {
    if (window.crypto && window.crypto.randomUUID) {
      return prefix + "_" + window.crypto.randomUUID();
    }
    return prefix + "_" + Date.now() + "_" + Math.floor(Math.random() * 1000000);
  }

  function isEmailValid(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  async function hashSecret(secret) {
    var trimmed = (secret || "").trim();
    if (!trimmed) return "";

    if (window.crypto && window.crypto.subtle && window.TextEncoder) {
      var bytes = new TextEncoder().encode(trimmed);
      var digest = await window.crypto.subtle.digest("SHA-256", bytes);
      var arr = Array.from(new Uint8Array(digest));
      return arr.map(function (b) { return b.toString(16).padStart(2, "0"); }).join("");
    }

    // Fallback keeps old browsers functional, but should not be used for production auth.
    return trimmed;
  }

  function getUsers() {
    return readJson(USERS_KEY, []);
  }

  function setUsers(users) {
    writeJson(USERS_KEY, users);
  }

  function findUserById(id) {
    return getUsers().find(function (user) { return user.id === id; }) || null;
  }

  function findUserByEmail(email) {
    var normalizedEmail = normalizeEmail(email);
    return getUsers().find(function (user) {
      return normalizeEmail(user.email) === normalizedEmail;
    }) || null;
  }

  function toPublicUser(user) {
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName || "",
      createdAt: user.createdAt || null,
      updatedAt: user.updatedAt || null,
      lastLoginAt: user.lastLoginAt || null
    };
  }

  function getCurrentUserId() {
    return window.localStorage.getItem(CURRENT_USER_KEY);
  }

  function setCurrentUserId(userId) {
    window.localStorage.setItem(CURRENT_USER_KEY, userId);
  }

  function clearCurrentUserId() {
    window.localStorage.removeItem(CURRENT_USER_KEY);
  }

  async function register(payload) {
    var email = normalizeEmail(payload && payload.email);
    var password = (payload && payload.password) || "";
    var displayName = (payload && payload.displayName || "").trim();

    if (!isEmailValid(email)) {
      throw new Error("Please enter a valid email address.");
    }
    if (password.trim().length < 8) {
      throw new Error("Password must be at least 8 characters.");
    }
    if (findUserByEmail(email)) {
      throw new Error("An account with this email already exists.");
    }

    var nowIso = new Date().toISOString();
    var passwordHash = await hashSecret(password);
    var user = {
      id: makeId("usr"),
      email: email,
      displayName: displayName,
      passwordHash: passwordHash,
      createdAt: nowIso,
      updatedAt: nowIso,
      lastLoginAt: nowIso
    };

    var users = getUsers();
    users.push(user);
    setUsers(users);
    setCurrentUserId(user.id);
    return toPublicUser(user);
  }

  async function login(payload) {
    var email = normalizeEmail(payload && payload.email);
    var password = (payload && payload.password) || "";

    if (!isEmailValid(email)) {
      throw new Error("Please enter a valid email address.");
    }

    var user = findUserByEmail(email);
    if (!user) {
      throw new Error("No account was found for that email.");
    }

    var passwordHash = await hashSecret(password);
    if (passwordHash !== user.passwordHash) {
      throw new Error("Email and password do not match.");
    }

    user.lastLoginAt = new Date().toISOString();
    user.updatedAt = user.lastLoginAt;

    var users = getUsers().map(function (candidate) {
      return candidate.id === user.id ? user : candidate;
    });
    setUsers(users);
    setCurrentUserId(user.id);
    return toPublicUser(user);
  }

  function logout() {
    clearCurrentUserId();
  }

  function getCurrentUser() {
    var userId = getCurrentUserId();
    if (!userId) return null;
    var user = findUserById(userId);
    if (!user) {
      clearCurrentUserId();
      return null;
    }
    return toPublicUser(user);
  }

  function isLoggedIn() {
    return !!getCurrentUser();
  }

  function requireLogin(redirectPath) {
    var user = getCurrentUser();
    if (user) return user;
    window.location.href = redirectPath || "login/";
    return null;
  }

  function listOnboardingRecords(userId) {
    var effectiveUserId = userId || getCurrentUserId();
    if (!effectiveUserId) return [];

    return readJson(ONBOARDING_KEY, [])
      .filter(function (record) { return record.userId === effectiveUserId; })
      .sort(function (a, b) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }

  function saveOnboardingRecord(payload) {
    var user = getCurrentUser();
    if (!user) {
      throw new Error("You must be logged in to save onboarding data.");
    }

    var records = readJson(ONBOARDING_KEY, []);
    var nowIso = new Date().toISOString();
    var record = {
      id: makeId("onboard"),
      userId: user.id,
      createdAt: nowIso,
      profile: payload && payload.profile ? payload.profile : {},
      inputs: payload && payload.inputs ? payload.inputs : {},
      metrics: payload && payload.metrics ? payload.metrics : {},
      discussion: payload && payload.discussion ? payload.discussion : ""
    };

    records.push(record);
    writeJson(ONBOARDING_KEY, records);
    return record;
  }

  window.AggerAuth = {
    register: register,
    login: login,
    logout: logout,
    getCurrentUser: getCurrentUser,
    isLoggedIn: isLoggedIn,
    requireLogin: requireLogin,
    saveOnboardingRecord: saveOnboardingRecord,
    listOnboardingRecords: listOnboardingRecords,
    storageKeys: {
      users: USERS_KEY,
      currentUser: CURRENT_USER_KEY,
      onboardingRecords: ONBOARDING_KEY
    }
  };
})();
