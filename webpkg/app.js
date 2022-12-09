// Copyright 2022 DecoTax.  Licensed under AGPL; see COPYING file.

function initApp() {
  // TODO: detect actual login state.
  const menu = document.querySelector("#hdr-links");
  const user_link = document.querySelector("#hdr-user");
  user_link.classList.add("logged-out");
  user_link.addEventListener("click", e => {
    if (menu.className == "open-user") {
      menu.className = "";
    } else {
      menu.className = "open-user";
      document.querySelector("#email").focus();
    }
    e.preventDefault();
  });
  const login_form = document.querySelector("#popup-user > form");
  const progress_shade = document.querySelector("#popup-user > .shade");
  login_form.addEventListener("submit", e => {
    progress_shade.style.display = "block";
    // TODO: do the login.
    e.preventDefault();
  });
}

export { initApp };
