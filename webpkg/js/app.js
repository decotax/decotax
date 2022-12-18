// Copyright 2022 DecoTax.  Licensed under AGPL; see COPYING file.

// Set up the app by registering event handlers etc.

import { initializeApp } from "firebase/app";

import * as Header from "./header.js";
import * as Login from "./login.js";

let g_app;
let g_auth;

function initApp(firebaseConfig) {
  g_app = initializeApp(firebaseConfig);
  Header.init([
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
      observer: Login.getPopupObserver()
    }
  ]);
  g_auth = Login.init();
  initToolbox();
}

function initToolbox() {
  const btn = document.querySelector("#btn-blank-forms");
  btn.addEventListener("click", e => {
    Header.closePopups();
    launchBlankForms();
    e.preventDefault();
  });
}

async function launchBlankForms() {
  const main_spinner = document.querySelector(".app > .spinner");
  main_spinner.style.display = "block";
  const Forms = await import(
    /* webpackChunkName: "forms" */
    "./blank-forms/forms.js");
  await Forms.showBlankForms(g_app, g_auth);
  main_spinner.style.display = "none";
}

export { initApp };
