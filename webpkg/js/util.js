// Copyright 2022 DecoTax.  Licensed under AGPL; see COPYING file.

// Common utilities.

function $(selector) {
  return document.querySelector(selector);
}

function flashAndFocusField(el) {
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

export { $, flashAndFocusField };
