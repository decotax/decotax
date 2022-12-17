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

  if (g_active_progress_shade) {
    g_active_progress_shade.style.display = "none";
    g_active_progress_shade = null;
  }
}

function initLoginForm() {
  const login_form = document.querySelector("#frm-login");
  const progress_shade = document.querySelector("#popup-user > .shade");
  login_form.addEventListener("submit", e => {
    const params = preValidate();
    if (params) {
      progress_shade.style.display = "block";
      g_active_progress_shade = progress_shade;

      signInWithEmailAndPassword(g_auth, params.email, params.password);
    }
    e.preventDefault();
  });

  const logout_form = document.querySelector("#frm-logout");
  logout_form.addEventListener("submit", e => {
    signOut(g_auth);
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
