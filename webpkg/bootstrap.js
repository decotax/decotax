// Copyright 2022 DecoTax.  Licensed under AGPL; see COPYING file.

// This is the webpack "entry point" (see webpack.config.js).  The main HTML
// page brings this in with <script defer> (written by html-webpack-plugin).

// This makes webpack see our CSS through mini-css-extract-plugin.
import "./main.css";

(() => {

// The user can type the magic word to show the real (not yet functional) app
// in place of the "under construction" message.
function setup_secret_launch() {
  const uc_field = document.querySelector("#under-construction").firstChild;
  uc_field.select();

  let launched = false;

  const check_cb = e => {
    if (launched)
      return;  // Only launch once.

    const magic = "hcnual";
    if (uc_field.value.split("").reverse().join("") == magic) {
      const app_el = document.querySelector("#viewport");
      uc_field.style.display = "none";
      app_el.style.display = "block";
      launched = true;
    }
  };

  // Watch change event for mobile, keyup for desktop.
  uc_field.addEventListener("change", check_cb);
  uc_field.addEventListener("keyup", check_cb);
}

// The bootstrap module is loaded as <script defer> which is guaranteed to run
// before the DOMContentLoaded event fires.
addEventListener("DOMContentLoaded", setup_secret_launch);

})();
