// Copyright 2022 DecoTax.  Licensed under AGPL; see COPYING file.

// Set up the app by registering event handlers etc.

import { initializeApp } from "firebase/app";

import * as Header from "./header.js";
import * as Login from "./login.js";
import { $ } from "./util.js";
import * as Views from "./views.js";

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
  $("#hdr-home").addEventListener("click", goHome);
  Views.init();
}

function initToolbox() {
  const btn = $("#btn-blank-forms");
  btn.addEventListener("click", e => {
    Header.closePopups();
    launchBlankForms();
    e.preventDefault();
  });
}

function goHome() {
  const view = document.createElement("div");
  view.classList.add("view-home");
  view.innerText = "DecoTax is under construction.";
  Views.setView(view);
  Login.clearBannerMessage();
}

async function launchBlankForms() {
  Views.spin();
  const Forms = await import(
    /* webpackChunkName: "forms" */
    "./blank-forms/forms.js");
  await Forms.showBlankForms(g_app, g_auth);
}

export { initApp };
