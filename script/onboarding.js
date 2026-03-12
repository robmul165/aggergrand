(function () {
  "use strict";

  if (!window.AggerAuth) {
    return;
  }

  var form = document.getElementById("onboardingForm");
  var statusEl = document.getElementById("onboardingStatus");
  var currentUserEmailEl = document.getElementById("currentUserEmail");
  var submissionListEl = document.getElementById("submissionList");
  var logoutBtn = document.getElementById("logoutBtn");
  var deleteAccountBtn = document.getElementById("deleteAccountBtn");
  var emailInput = document.getElementById("email");
  var activeUser = null;

  function setStatus(message, kind) {
    statusEl.textContent = message || "";
    statusEl.classList.remove("status-error", "status-success");
    if (kind === "error") statusEl.classList.add("status-error");
    if (kind === "success") statusEl.classList.add("status-success");
  }

  function escapeHtml(text) {
    return String(text == null ? "" : text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getProfileFromForm() {
    return {
      firstName: document.getElementById("firstName").value.trim(),
      lastName: document.getElementById("lastName").value.trim(),
      email: document.getElementById("email").value.trim(),
      phone: document.getElementById("phone").value.trim(),
      location: document.getElementById("location").value.trim(),
      growType: document.getElementById("growType").value,
      experienceLevel: document.getElementById("experienceLevel").value,
      goals: document.getElementById("goals").value.trim()
    };
  }

  function fillForm(profile) {
    if (!profile) return;
    document.getElementById("firstName").value = profile.firstName || "";
    document.getElementById("lastName").value = profile.lastName || "";
    document.getElementById("email").value = profile.email || (activeUser && activeUser.email) || "";
    document.getElementById("phone").value = profile.phone || "";
    document.getElementById("location").value = profile.location || "";
    document.getElementById("growType").value = profile.growType || "";
    document.getElementById("experienceLevel").value = profile.experienceLevel || "";
    document.getElementById("goals").value = profile.goals || "";
  }

  async function renderSubmissions() {
    var records = await window.AggerAuth.listOnboardingRecords();
    if (!records.length) {
      submissionListEl.innerHTML = "<li>No saved onboarding data yet.</li>";
      return;
    }

    submissionListEl.innerHTML = records.slice(0, 10).map(function (record) {
      var profile = record.profile || {};
      var title = [profile.firstName || "", profile.lastName || ""].join(" ").trim() || "Unnamed user";
      var details = [
        profile.email || "No email",
        profile.location || "No location",
        profile.growType || "No grow type"
      ].join(" | ");
      return "<li><strong>" + escapeHtml(new Date(record.createdAt).toLocaleString()) + "</strong><br>" +
        escapeHtml(title) + "<br><span class=\"inline-note\">" + escapeHtml(details) + "</span></li>";
    }).join("");

    fillForm(records[0].profile || {});
  }

  function keepDefaultEmail() {
    window.setTimeout(function () {
      if (!emailInput.value.trim() && activeUser) {
        emailInput.value = activeUser.email;
      }
    }, 0);
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    if (!form.checkValidity()) {
      setStatus("Please complete all required fields.", "error");
      return;
    }

    try {
      var profile = getProfileFromForm();
      var saved = await window.AggerAuth.saveOnboardingRecord({
        profile: profile,
        inputs: {
          source: "onboarding_form_v1"
        },
        metrics: {},
        discussion: "Onboarding submission"
      });
      setStatus("Saved on " + new Date(saved.createdAt).toLocaleString() + ".", "success");
      await renderSubmissions();
    } catch (error) {
      setStatus(error.message || "Unable to save onboarding data.", "error");
    }
  });

  form.addEventListener("reset", keepDefaultEmail);

  logoutBtn.addEventListener("click", async function () {
    try {
      await window.AggerAuth.logout();
    } catch (error) {
      setStatus(error.message || "Unable to log out.", "error");
      return;
    }
    window.location.href = "../login/login.html";
  });

  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener("click", async function () {
      if (!activeUser) {
        setStatus("No authenticated user to delete.", "error");
        return;
      }

      var confirmed = window.confirm(
        "Delete account " + activeUser.email + " and all onboarding records? This is for development testing."
      );
      if (!confirmed) {
        return;
      }

      try {
        await window.AggerAuth.deleteAccount();
      } catch (error) {
        setStatus(error.message || "Unable to delete account.", "error");
        return;
      }

      window.location.href = "../login/login.html";
    });
  }

  async function initialize() {
    try {
      activeUser = await window.AggerAuth.requireLogin("../login/login.html");
      if (!activeUser) {
        return;
      }
      currentUserEmailEl.textContent = activeUser.email;
      emailInput.value = activeUser.email;
      await renderSubmissions();
    } catch (error) {
      setStatus(error.message || "Unable to load onboarding data.", "error");
    }
  }

  initialize();
})();
