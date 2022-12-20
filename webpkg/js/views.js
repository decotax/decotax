// Copyright 2022 DecoTax.  Licensed under AGPL; see COPYING file.

import { $ } from "./util.js";

let g_current_view;
let g_spinner;
let g_app_el;

function init() {
  g_app_el = $(".app");
  g_spinner = $(".app > .spinner");
  g_current_view = $(".app > .view-home");
}

function spin() {
  _clearView();
  g_spinner.style.display = "block";
}

function setView(view_element) {
  g_spinner.style.display = "none";
  _clearView();

  g_app_el.appendChild(view_element);
  g_current_view = view_element;
}

function _clearView() {
  if (g_current_view)
    g_app_el.removeChild(g_current_view);
  g_current_view = null;
}

export { init, spin, setView };
