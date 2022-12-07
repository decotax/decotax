// Copyright 2022 DecoTax.  Licensed under AGPL; see COPYING file.

// This is the webpack "entry point" (see webpack.config.js).  The main HTML
// page brings this in with <script defer> (written by html-webpack-plugin).

// This makes webpack see our CSS through mini-css-extract-plugin.
import "./main.css";
