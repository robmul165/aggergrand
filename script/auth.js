(function () {
  "use strict";

  var AUTH_REGISTER_ENDPOINT = "/api/auth/register";
  var AUTH_LOGIN_ENDPOINT = "/api/auth/login";
  var AUTH_LOGOUT_ENDPOINT = "/api/auth/logout";
  var AUTH_DELETE_ACCOUNT_ENDPOINT = "/api/auth/delete-account";
  var AUTH_ME_ENDPOINT = "/api/auth/me";
  var ONBOARDING_RECORDS_ENDPOINT = "/api/onboarding/records";

  function isObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function normalizeEmail(email) {
    return (email || "").trim().toLowerCase();
  }

  function isEmailValid(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  async function parseJson(response) {
    var text = await response.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch (error) {
      return {};
    }
  }

  async function requestJson(url, options) {
    var requestOptions = options && typeof options === "object" ? options : {};
    var method = requestOptions.method || "GET";
    var hasBody = Object.prototype.hasOwnProperty.call(requestOptions, "body");
    var headers = {
      "Accept": "application/json"
    };
    var fetchOptions = {
      method: method,
      headers: headers,
      credentials: "same-origin"
    };

    if (hasBody) {
      headers["Content-Type"] = "application/json";
      fetchOptions.body = JSON.stringify(requestOptions.body);
    }

    var response;
    try {
      response = await fetch(url, fetchOptions);
    } catch (error) {
      throw new Error("Could not reach the backend server.");
    }

    var contentType = response.headers.get("content-type") || "";
    if (contentType.toLowerCase().indexOf("application/json") === -1) {
      throw new Error("Unexpected backend response. Open the app from http://127.0.0.1:8000.");
    }

    var data = await parseJson(response);
    if (!response.ok) {
      var message = data && typeof data.error === "string" ? data.error : "Request failed (" + response.status + ").";
      throw new Error(message);
    }

    return data;
  }

  async function register(payload) {
    var input = isObject(payload) ? payload : {};
    var email = normalizeEmail(input.email);
    var password = String(input.password || "");
    var displayName = String(input.displayName || "").trim();

    if (!isEmailValid(email)) {
      throw new Error("Please enter a valid email address.");
    }
    if (password.trim().length < 8) {
      throw new Error("Password must be at least 8 characters.");
    }

    var data = await requestJson(AUTH_REGISTER_ENDPOINT, {
      method: "POST",
      body: {
        email: email,
        password: password,
        displayName: displayName
      }
    });
    if (!data || !data.user) {
      throw new Error("Backend did not return a created user.");
    }
    return data.user;
  }

  async function login(payload) {
    var input = isObject(payload) ? payload : {};
    var email = normalizeEmail(input.email);
    var password = String(input.password || "");

    if (!isEmailValid(email)) {
      throw new Error("Please enter a valid email address.");
    }
    if (!password.trim()) {
      throw new Error("Password is required.");
    }

    var data = await requestJson(AUTH_LOGIN_ENDPOINT, {
      method: "POST",
      body: {
        email: email,
        password: password
      }
    });
    if (!data || !data.user) {
      throw new Error("Backend did not return a logged-in user.");
    }
    return data.user;
  }

  async function logout() {
    await requestJson(AUTH_LOGOUT_ENDPOINT, {
      method: "POST"
    });
    return true;
  }

  async function deleteAccount() {
    var data = await requestJson(AUTH_DELETE_ACCOUNT_ENDPOINT, {
      method: "POST"
    });
    if (!data || data.ok !== true) {
      throw new Error("Backend did not confirm account deletion.");
    }
    return data;
  }

  async function getCurrentUser() {
    var data = await requestJson(AUTH_ME_ENDPOINT, {
      method: "GET"
    });
    return data && data.user ? data.user : null;
  }

  async function isLoggedIn() {
    return !!(await getCurrentUser());
  }

  async function requireLogin(redirectPath) {
    var user = await getCurrentUser();
    if (user) {
      return user;
    }
    window.location.href = redirectPath || "login/login.html";
    return null;
  }

  async function listOnboardingRecords() {
    var data = await requestJson(ONBOARDING_RECORDS_ENDPOINT, {
      method: "GET"
    });
    var records = Array.isArray(data.records) ? data.records : [];
    return records.sort(function (a, b) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }

  async function saveOnboardingRecord(payload) {
    var input = isObject(payload) ? payload : {};
    var body = {
      profile: isObject(input.profile) ? input.profile : {},
      inputs: isObject(input.inputs) ? input.inputs : {},
      metrics: isObject(input.metrics) ? input.metrics : {},
      discussion: typeof input.discussion === "string" ? input.discussion : ""
    };
    var data = await requestJson(ONBOARDING_RECORDS_ENDPOINT, {
      method: "POST",
      body: body
    });
    if (!data || !data.record) {
      throw new Error("Backend did not return a saved onboarding record.");
    }
    return data.record;
  }

  window.AggerAuth = {
    register: register,
    login: login,
    logout: logout,
    deleteAccount: deleteAccount,
    getCurrentUser: getCurrentUser,
    isLoggedIn: isLoggedIn,
    requireLogin: requireLogin,
    saveOnboardingRecord: saveOnboardingRecord,
    listOnboardingRecords: listOnboardingRecords
  };
})();
