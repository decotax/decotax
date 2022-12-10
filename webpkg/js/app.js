// Copyright 2022 DecoTax.  Licensed under AGPL; see COPYING file.

// Set up the app by registering event handlers etc.

import { initializeApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";

import { initHeader } from "./header.js";

let g_auth;
let g_active_progress_shade;

function initApp(firebaseConfig) {
  initializeApp(firebaseConfig);
  g_auth = getAuth();
  onAuthStateChanged(g_auth, updateLoginStatus);
  initHeader([
    {
      link_id: "#hdr-toolbox",
      opened_class: "open-toolbox"
    },
    {
      link_id: "#hdr-user",
      opened_class: "open-user",
      observer: {
        onOpened: () => {
          document.querySelector("#email").focus();
        }
      }
    }
  ]);
  initLoginForm();
}

function updateLoginStatus(user) {
  const menu = document.querySelector("#hdr-links");
  const user_label = document.querySelector("#hdr-user-label");
  const label_text = user ? user.email : "Log in";
  user_label.firstChild.nodeValue = ` ${label_text}`;

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
    progress_shade.style.display = "block";
    g_active_progress_shade = progress_shade;

    const email = document.querySelector("#email").value;
    const password = document.querySelector("#password").value;
    signInWithEmailAndPassword(g_auth, email, password);
    e.preventDefault();
  });

  const logout_form = document.querySelector("#frm-logout");
  logout_form.addEventListener("submit", e => {
    signOut(g_auth);
    e.preventDefault();
  });
}

export { initApp };
