(function () {
  "use strict";

  var USERS_KEY = "aggergrand_users_v1";
  var CURRENT_USER_KEY = "aggergrand_current_user_id_v1";
  var ONBOARDING_KEY = "aggergrand_onboarding_records_v1";
  var WORKSPACE_SYNC_ENDPOINT = "/api/storage/snapshot";

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

  function isHttpProtocol() {
    return window.location.protocol === "http:" || window.location.protocol === "https:";
  }

  function normalizeSnapshot(snapshot) {
    var input = snapshot && typeof snapshot === "object" ? snapshot : {};
    return {
      users: Array.isArray(input.users) ? input.users : [],
      currentUserId: typeof input.currentUserId === "string" && input.currentUserId ? input.currentUserId : null,
      onboardingRecords: Array.isArray(input.onboardingRecords) ? input.onboardingRecords : []
    };
  }

  function hasSnapshotData(snapshot) {
    if (!snapshot) return false;
    if (snapshot.users && snapshot.users.length) return true;
    if (snapshot.onboardingRecords && snapshot.onboardingRecords.length) return true;
    return !!snapshot.currentUserId;
  }

  function getLocalSnapshot() {
    return {
      users: getUsers(),
      currentUserId: getCurrentUserId(),
      onboardingRecords: readJson(ONBOARDING_KEY, [])
    };
  }

  function applySnapshotToLocalStorage(snapshot) {
    var normalized = normalizeSnapshot(snapshot);
    window.localStorage.setItem(USERS_KEY, JSON.stringify(normalized.users));
    window.localStorage.setItem(ONBOARDING_KEY, JSON.stringify(normalized.onboardingRecords));

    if (normalized.currentUserId) {
      window.localStorage.setItem(CURRENT_USER_KEY, normalized.currentUserId);
    } else {
      window.localStorage.removeItem(CURRENT_USER_KEY);
    }
  }

  function requestWorkspaceSnapshotSync(method, payload) {
    if (!isHttpProtocol()) return null;

    try {
      var xhr = new XMLHttpRequest();
      xhr.open(method, WORKSPACE_SYNC_ENDPOINT, false);
      if (method === "POST") {
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(JSON.stringify({ snapshot: normalizeSnapshot(payload) }));
      } else {
        xhr.send();
      }

      if (xhr.status < 200 || xhr.status >= 300) {
        return null;
      }

      var parsed = xhr.responseText ? JSON.parse(xhr.responseText) : {};
      var snapshot = parsed && parsed.snapshot ? parsed.snapshot : parsed;
      return normalizeSnapshot(snapshot);
    } catch (error) {
      return null;
    }
  }

  function hydrateLocalStorageFromWorkspace() {
    var localSnapshot = normalizeSnapshot(getLocalSnapshot());
    var workspaceSnapshot = requestWorkspaceSnapshotSync("GET");

    if (workspaceSnapshot && hasSnapshotData(workspaceSnapshot)) {
      applySnapshotToLocalStorage(workspaceSnapshot);
      return;
    }

    if (hasSnapshotData(localSnapshot)) {
      requestWorkspaceSnapshotSync("POST", localSnapshot);
    }
  }

  function syncWorkspaceSnapshot() {
    requestWorkspaceSnapshotSync("POST", getLocalSnapshot());
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
    syncWorkspaceSnapshot();
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
    syncWorkspaceSnapshot();
  }

  function clearCurrentUserId() {
    window.localStorage.removeItem(CURRENT_USER_KEY);
    syncWorkspaceSnapshot();
  }

  // If a local workspace API is available, use it as the durable store.
  // This keeps the existing localStorage UX while persisting to workspace files.
  hydrateLocalStorageFromWorkspace();

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
    window.location.href = redirectPath || "login/login.html";
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
    syncWorkspaceSnapshot();
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
    syncWorkspaceSnapshot: syncWorkspaceSnapshot,
    storageKeys: {
      users: USERS_KEY,
      currentUser: CURRENT_USER_KEY,
      onboardingRecords: ONBOARDING_KEY
    }
  };
})();
