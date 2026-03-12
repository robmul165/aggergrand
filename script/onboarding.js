(function () {
  "use strict";

  if (!window.AggerAuth) {
    return;
  }

  var user = window.AggerAuth.requireLogin("../login/");
  if (!user) {
    return;
  }

  var form = document.getElementById("onboardingForm");
  var statusEl = document.getElementById("onboardingStatus");
  var currentUserEmailEl = document.getElementById("currentUserEmail");
  var submissionListEl = document.getElementById("submissionList");
  var logoutBtn = document.getElementById("logoutBtn");
  var emailInput = document.getElementById("email");

  currentUserEmailEl.textContent = user.email;

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
    document.getElementById("email").value = profile.email || user.email || "";
    document.getElementById("phone").value = profile.phone || "";
    document.getElementById("location").value = profile.location || "";
    document.getElementById("growType").value = profile.growType || "";
    document.getElementById("experienceLevel").value = profile.experienceLevel || "";
    document.getElementById("goals").value = profile.goals || "";
  }

  function renderSubmissions() {
    var records = window.AggerAuth.listOnboardingRecords(user.id);
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
      if (!emailInput.value.trim()) {
        emailInput.value = user.email;
      }
    }, 0);
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!form.checkValidity()) {
      setStatus("Please complete all required fields.", "error");
      return;
    }

    try {
      var profile = getProfileFromForm();
      var saved = window.AggerAuth.saveOnboardingRecord({
        profile: profile,
        inputs: {
          source: "onboarding_form_v1"
        },
        metrics: {},
        discussion: "Onboarding submission"
      });
      setStatus("Saved on " + new Date(saved.createdAt).toLocaleString() + ".", "success");
      renderSubmissions();
    } catch (error) {
      setStatus(error.message || "Unable to save onboarding data.", "error");
    }
  });

  form.addEventListener("reset", keepDefaultEmail);

  logoutBtn.addEventListener("click", function () {
    window.AggerAuth.logout();
    window.location.href = "../login/";
  });

  emailInput.value = user.email;
  renderSubmissions();
})();
