(function () {
  "use strict";

  if (!window.AggerAuth) {
    return;
  }

  var authForm = document.getElementById("authForm");
  var emailInput = document.getElementById("email");
  var passwordInput = document.getElementById("password");
  var displayNameInput = document.getElementById("displayName");
  var loginBtn = document.getElementById("loginBtn");
  var createAccountBtn = document.getElementById("createAccountBtn");
  var statusEl = document.getElementById("authStatus");
  var currentUserPanel = document.getElementById("currentUserPanel");
  var currentUserEmailEl = document.getElementById("currentUserEmail");
  var submissionCountEl = document.getElementById("submissionCount");
  var submissionListEl = document.getElementById("submissionList");
  var logoutBtn = document.getElementById("logoutBtn");
  var deleteAccountBtn = document.getElementById("deleteAccountBtn");

  function setStatus(message, kind) {
    statusEl.textContent = message || "";
    statusEl.classList.remove("status-error", "status-success");
    if (kind === "error") statusEl.classList.add("status-error");
    if (kind === "success") statusEl.classList.add("status-success");
  }

  function clearForm() {
    authForm.reset();
  }

  function escapeHtml(text) {
    return String(text == null ? "" : text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function recordSummary(record) {
    var profile = record.profile || {};
    var name = [profile.firstName || "", profile.lastName || ""].join(" ").trim();
    var growType = profile.growType || "Unknown setup";
    var when = new Date(record.createdAt).toLocaleString();
    return {
      when: when,
      description: (name ? name + " - " : "") + growType
    };
  }

  async function renderCurrentUserPanel() {
    var user = await window.AggerAuth.getCurrentUser();
    if (!user) {
      currentUserPanel.hidden = true;
      currentUserEmailEl.textContent = "";
      submissionCountEl.textContent = "0";
      submissionListEl.innerHTML = "";
      return;
    }

    var records = await window.AggerAuth.listOnboardingRecords();
    currentUserPanel.hidden = false;
    currentUserEmailEl.textContent = user.email;
    submissionCountEl.textContent = String(records.length);

    if (!records.length) {
      submissionListEl.innerHTML = "<li>No onboarding submissions yet.</li>";
      return;
    }

    submissionListEl.innerHTML = records.slice(0, 5).map(function (record) {
      var summary = recordSummary(record);
      return "<li><strong>" + escapeHtml(summary.when) + "</strong><br>" + escapeHtml(summary.description) + "</li>";
    }).join("");
  }

  async function handleLogin() {
    try {
      setStatus("", "");
      await window.AggerAuth.login({
        email: emailInput.value,
        password: passwordInput.value
      });
      setStatus("Signed in successfully. Redirecting to onboarding...", "success");
      await renderCurrentUserPanel();
      clearForm();
      window.setTimeout(function () {
        window.location.href = "../onboarding/onboard.html";
      }, 500);
    } catch (error) {
      setStatus(error.message || "Unable to sign in.", "error");
    }
  }

  async function handleCreateAccount() {
    try {
      setStatus("", "");
      await window.AggerAuth.register({
        email: emailInput.value,
        password: passwordInput.value,
        displayName: displayNameInput.value
      });
      setStatus("Account created. Redirecting to onboarding...", "success");
      await renderCurrentUserPanel();
      clearForm();
      window.setTimeout(function () {
        window.location.href = "../onboarding/onboard.html";
      }, 500);
    } catch (error) {
      setStatus(error.message || "Unable to create account.", "error");
    }
  }

  async function handleLogout() {
    try {
      await window.AggerAuth.logout();
      await renderCurrentUserPanel();
      setStatus("You are logged out.", "success");
    } catch (error) {
      setStatus(error.message || "Unable to log out.", "error");
    }
  }

  async function handleDeleteAccount() {
    var user;
    try {
      user = await window.AggerAuth.getCurrentUser();
    } catch (error) {
      setStatus(error.message || "Unable to check account state.", "error");
      return;
    }

    if (!user) {
      setStatus("Sign in first to delete an account.", "error");
      return;
    }

    var confirmed = window.confirm(
      "Delete account " + user.email + " and all onboarding records? This is for development testing."
    );
    if (!confirmed) {
      return;
    }

    try {
      await window.AggerAuth.deleteAccount();
      await renderCurrentUserPanel();
      setStatus("Account deleted. You can now re-register the same email.", "success");
      emailInput.value = user.email;
      passwordInput.value = "";
      displayNameInput.value = "";
      emailInput.focus();
    } catch (error) {
      setStatus(error.message || "Unable to delete account.", "error");
    }
  }

  loginBtn.addEventListener("click", function () {
    handleLogin();
  });
  createAccountBtn.addEventListener("click", function () {
    handleCreateAccount();
  });
  logoutBtn.addEventListener("click", function () {
    handleLogout();
  });
  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener("click", function () {
      handleDeleteAccount();
    });
  }
  authForm.addEventListener("submit", function (event) {
    event.preventDefault();
    handleLogin();
  });

  renderCurrentUserPanel().catch(function () {
    currentUserPanel.hidden = true;
  });
})();
