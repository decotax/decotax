// Copyright 2022 DecoTax.  Licensed under AGPL; see COPYING file.

import {
  collection,
  doc,
  updateDoc
} from "firebase/firestore/lite";

let g_fields = [];
let g_docId;
let g_db;

class Field {
  constructor(line, name, rect) {
    this.line = line;
    this.name = name;
    this.rect = rect;
  }
}

function fieldsAsJson() {
  return g_fields;
}

async function persist() {
  updateDoc(
      doc(collection(g_db, "dtmodules"), g_docId),
      { "fields": fieldsAsJson() });
}

function add(dragResult) {
  const r = dragResult.rect;
  g_fields.push({
    line: String(g_fields.length + 1),  // TODO: ensure uniqueness
    name: "[name]",
    rect: [r.x, r.y, r.width, r.height]
  });
  persist();
}

function onSwitchForms(docId) {
  g_docId = docId;
}

function init(db) {
  g_db = db;
}

export { init, add, onSwitchForms };
