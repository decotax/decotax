// Copyright 2022 DecoTax.  Licensed under AGPL; see COPYING file.

// Login and logout UI.

import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";

import { $, flashAndFocusField } from "./util.js";

let g_auth;
let g_active_progress_shade;

function init() {
  g_auth = getAuth();
  onAuthStateChanged(g_auth, _updateLoginStatus);
  _initLoginForm();
  return g_auth;
}

function getPopupObserver() {
  return {
    onOpened: () => {
      $("#email").focus();
    },
    onClosed: () => {
      $("#email").value = "";
      $("#password").value = "";
      _clearError();
    }
  };
}

function _updateLoginStatus(user) {
  const menu = $("#hdr-links");
  const user_label = $("#hdr-user-label");

  const label_text = user ? (user.displayName || user.email) : "Log in";
  user_label.firstChild.nodeValue = ` ${label_text}`;

  const popup_user_label = $("#popup-user-label");
  popup_user_label.firstChild.nodeValue = user ? user.email : "user";

  menu.classList.remove("logged-in");
  menu.classList.remove("logged-out");
  menu.classList.add(user ? "logged-in" : "logged-out");

  _hideProgressShade();
  _clearError();
  _clearBannerMessage();

  $("#email").value = "";
  $("#password").value = "";

  if (location.search == "?logout") {
    history.replaceState(null, null, "/");
    if (!user) {
      _showBannerMessage("You've logged out.");
    }
  }
}

function _hideProgressShade() {
  if (g_active_progress_shade) {
    g_active_progress_shade.style.display = "none";
    g_active_progress_shade = null;
  }
}

function _clearError() {
  const error_el = $("#login-error");
  error_el.style.display = "";
}

function _clearBannerMessage() {
  const banner_el = $("#banner");
  banner_el.style.display = "none";
  banner_el.innerText = "";
}

function _showError() {
  const error_el = $("#login-error");
  error_el.style.display = "block";
  error_el.innerText = "Failed to log in. Check that the email and password " +
      "are entered correctly.";
}

function _showBannerMessage(message) {
  const banner_el = $("#banner");
  banner_el.style.display = "block";
  banner_el.innerText = message;
}


function _initLoginForm() {
  const login_form = $("#frm-login");
  const progress_shade = $("#popup-user > .shade");
  login_form.addEventListener("submit", e => {
    const params = _preValidate();
    if (params) {
      progress_shade.style.display = "block";
      g_active_progress_shade = progress_shade;

      (async () => {
        try {
          await signInWithEmailAndPassword(
              g_auth, params.email, params.password);
        } catch (e) {
          _hideProgressShade();
          _showError();
        }
      })();
    }
    e.preventDefault();
  });

  const logout_form = $("#frm-logout");
  logout_form.addEventListener("submit", e => {
    (async () => {
      await signOut(g_auth);
      history.replaceState(null, null, "/?logout");
      location.reload();
    })();
    e.preventDefault();
  });
}

function _preValidate() {
  const email_el = $("#email");
  const password_el = $("#password");

  const email = email_el.value.trim();
  const password = password_el.value;

  if (!email) {
    flashAndFocusField(email_el);
  } else if (!password) {
    flashAndFocusField(password_el);
  } else {
    return { email, password };
  }
}

export { init, getPopupObserver };
