// Copyright 2022 DecoTax.  Licensed under AGPL; see COPYING file.

let g_menu;
let g_current_opened_link_config;

function initHeader(link_configs) {
  g_menu = document.querySelector("#hdr-links");
  for (const link_config of link_configs)
    _setupLink(link_config);
}

function _setupLink(link_config) {
  const { link_id, opened_class, observer } = link_config;
  const link_el = document.querySelector(link_id);
  link_el.addEventListener("click", e => {
    const should_open =
        g_current_opened_link_config != link_config;

    _closeAnyOpened();

    if (should_open) {
      g_menu.classList.add(opened_class);
      g_current_opened_link_config = link_config;

      if (observer && observer.onOpened)
        observer.onOpened();
    }
    e.preventDefault();
  });
}

function _closeAnyOpened() {
  if (g_current_opened_link_config == null)
    return;

  const { opened_class, observer } = g_current_opened_link_config;

  g_menu.classList.remove(opened_class);
  g_current_opened_link_config = null;

  if (observer && observer.onClosed)
    observer.onClosed();
}

export { initHeader };
