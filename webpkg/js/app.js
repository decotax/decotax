// Copyright 2022 DecoTax.  Licensed under AGPL; see COPYING file.

// Set up the app by registering event handlers etc.

function initApp() {
  initUserChip();
}

function initUserChip() {
  // TODO: detect actual login state.
  const user_link = document.querySelector("#hdr-user");
  user_link.classList.add("logged-out");

  let first_open = true;
  user_link.addEventListener("click", e => {
    const menu = document.querySelector("#hdr-links");
    if (menu.className == "open-user") {
      menu.className = "";
    } else {
      menu.className = "open-user";
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
  const login_form = document.querySelector("#popup-user > form");
  const progress_shade = document.querySelector("#popup-user > .shade");
  login_form.addEventListener("submit", e => {
    progress_shade.style.display = "block";
    // TODO: do the login.
    e.preventDefault();
  });
}

export { initApp };
