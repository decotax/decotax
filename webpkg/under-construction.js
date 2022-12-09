// Copyright 2022 DecoTax.  Licensed under AGPL; see COPYING file.

import { initApp } from "./app.js";

// The user can type the magic word to show the real (not yet functional) app
// in place of the "under construction" message.
function setupSecretLaunch() {
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
      initApp();
      launched = true;
    }
  };

  // Watch change event for mobile, keyup for desktop.
  uc_field.addEventListener("change", check_cb);
  uc_field.addEventListener("keyup", check_cb);
}

export { setupSecretLaunch };
