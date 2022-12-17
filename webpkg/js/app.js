// Copyright 2022 DecoTax.  Licensed under AGPL; see COPYING file.

// Set up the app by registering event handlers etc.

import { initializeApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";

import { initHeader, closeHeaderPopups } from "./header.js";

let g_app;
let g_auth;
let g_active_progress_shade;

function initApp(firebaseConfig) {
  g_app = initializeApp(firebaseConfig);
  g_auth = getAuth();
  onAuthStateChanged(g_auth, updateLoginStatus);
  initHeader([
    {
      link_id: "#hdr-home"
    },
    {
      link_id: "#hdr-files"
    },
    {
      link_id: "#hdr-toolbox",
      opened_class: "open-toolbox"
    },
    {
      link_id: "#hdr-about"
    },
    {
      link_id: "#hdr-user",
      opened_class: "open-user",
      observer: {
        onOpened: () => {
          document.querySelector("#email").focus();
        },
        onClosed: () => {
          document.querySelector("#email").value = "";
          document.querySelector("#password").value = "";
          clearError();
        }
      }
    }
  ]);
  initLoginForm();
  initToolbox();
}

function updateLoginStatus(user) {
  const menu = document.querySelector("#hdr-links");
  const user_label = document.querySelector("#hdr-user-label");

  const label_text = user ? (user.displayName || user.email) : "Log in";
  user_label.firstChild.nodeValue = ` ${label_text}`;

  const popup_user_label = document.querySelector("#popup-user-label");
  popup_user_label.firstChild.nodeValue = user ? user.email : "user";

  menu.classList.remove("logged-in");
  menu.classList.remove("logged-out");
  menu.classList.add(user ? "logged-in" : "logged-out");

  hideProgressShade();
  clearError();
  clearBannerMessage();

  document.querySelector("#email").value = "";
  document.querySelector("#password").value = "";

  if (location.search == "?logout") {
    history.replaceState(null, null, "/");
    if (!user) {
      showBannerMessage("You've logged out.");
    }
  }
}

function hideProgressShade() {
  if (g_active_progress_shade) {
    g_active_progress_shade.style.display = "none";
    g_active_progress_shade = null;
  }
}

function clearError() {
  const error_el = document.querySelector("#login-error");
  error_el.style.display = "";
}

function clearBannerMessage() {
  const banner_el = document.querySelector("#banner");
  banner_el.style.display = "none";
  banner_el.innerText = "";
}

function showError() {
  const error_el = document.querySelector("#login-error");
  error_el.style.display = "block";
  error_el.innerText = "Failed to log in. Check that the email and password " +
      "are entered correctly.";
}

function showBannerMessage(message) {
  const banner_el = document.querySelector("#banner");
  banner_el.style.display = "block";
  banner_el.innerText = message;
}

function initLoginForm() {
  const login_form = document.querySelector("#frm-login");
  const progress_shade = document.querySelector("#popup-user > .shade");
  login_form.addEventListener("submit", e => {
    const params = preValidate();
    if (params) {
      progress_shade.style.display = "block";
      g_active_progress_shade = progress_shade;

      (async () => {
        try {
          await signInWithEmailAndPassword(
              g_auth, params.email, params.password);
        } catch (e) {
          hideProgressShade();
          showError();
        }
      })();
    }
    e.preventDefault();
  });

  const logout_form = document.querySelector("#frm-logout");
  logout_form.addEventListener("submit", e => {
    (async () => {
      await signOut(g_auth);
      history.replaceState(null, null, "/?logout");
      location.reload();
    })();
    e.preventDefault();
  });
}

function preValidate() {
  const email_el = document.querySelector("#email");
  const password_el = document.querySelector("#password");

  const email = email_el.value.trim();
  const password = password_el.value;

  const blank_field_err_fn = el => {
    el.classList.remove("error-outline");
    el.focus();
    requestAnimationFrame(() => {
      el.classList.add("error-outline");
      const autoremove_fn = () => {
        el.classList.remove("error-outline");
        el.removeEventListener("animationend", autoremove_fn);
      };
      el.addEventListener("animationend", autoremove_fn);
    });
  }

  if (!email) {
    blank_field_err_fn(email_el);
  } else if (!password) {
    blank_field_err_fn(password_el);
  } else {
    return { email, password };
  }
}

function initToolbox() {
  const btn = document.querySelector("#btn-blank-forms");
  btn.addEventListener("click", e => {
    closeHeaderPopups();
    launchBlankForms();
    e.preventDefault();
  });
}

async function launchBlankForms() {
  const main_spinner = document.querySelector(".app > .spinner");
  main_spinner.style.display = "block";
  const Module = await import(
    /* webpackChunkName: "forms" */
    "./blank-forms/forms.js");
  await Module.showBlankForms(g_app, g_auth);
  main_spinner.style.display = "none";
}

export { initApp };
