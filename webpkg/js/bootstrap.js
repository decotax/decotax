// Copyright 2022 DecoTax.  Licensed under AGPL; see COPYING file.

// This is the webpack "entry point" (see webpack.config.js).  The main HTML
// page brings this in with <script defer> (written by html-webpack-plugin).

// This makes webpack see our CSS through mini-css-extract-plugin.
import "../css/main.css";

import { setupSecretLaunch } from "./under-construction.js";
import { initApp } from "./app.js";
import { getFirebaseConfig } from "./fb-config.js";

// The bootstrap module is loaded as <script defer> which is guaranteed to run
// before the DOMContentLoaded event fires.
addEventListener("DOMContentLoaded", async () => {
  await setupSecretLaunch();
  initApp(getFirebaseConfig());
});
