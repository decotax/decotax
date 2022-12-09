// Copyright 2022 DecoTax.  Licensed under AGPL; see COPYING file.

// Set up the app by registering event handlers etc.

import { initializeApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";

let auth;
let first_chip_update = true;
let active_progress_shade;

function initApp(firebaseConfig) {
  initializeApp(firebaseConfig);
  auth = getAuth();
  onAuthStateChanged(auth, updateUserChip);
}

function updateUserChip(user) {
  const menu = document.querySelector("#hdr-links");
  if (user || !first_chip_update) {
    const user_label = document.querySelector("#hdr-user-label");
    const label_text = user ? user.email : "Log in";
    user_label.firstChild.nodeValue = ` ${label_text}`;
  }
  if (first_chip_update) {
    initUserChip();
    first_chip_update = false;
  }
  if (!first_chip_update) {
    menu.classList.remove("logged-in");
    menu.classList.remove("logged-out");
  }
  menu.classList.add(user ? "logged-in" : "logged-out");
  if (active_progress_shade) {
    active_progress_shade.style.display = "none";
    active_progress_shade = null;
  }
}

function initUserChip() {
  const user_link = document.querySelector("#hdr-user");
  let first_open = true;
  user_link.addEventListener("click", e => {
    const menu = document.querySelector("#hdr-links");
    const opening = !menu.classList.contains("open-user");
    menu.classList.toggle("open-user");
    if (opening) {
      if (first_open) {
        initLoginForm();
        first_open = false;
      }
      document.querySelector("#email").focus();
    }
    e.preventDefault();
  });
}

function initLoginForm() {
  const login_form = document.querySelector("#frm-login");
  const progress_shade = document.querySelector("#popup-user > .shade");
  login_form.addEventListener("submit", e => {
    progress_shade.style.display = "block";
    active_progress_shade = progress_shade;

    const email = document.querySelector("#email").value;
    const password = document.querySelector("#password").value;
    signInWithEmailAndPassword(auth, email, password);
    e.preventDefault();
  });

  const logout_form = document.querySelector("#frm-logout");
  logout_form.addEventListener("submit", e => {
    signOut(auth);
    e.preventDefault();
  });
}

export { initApp };
