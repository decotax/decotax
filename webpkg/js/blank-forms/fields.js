// Copyright 2022 DecoTax.  Licensed under AGPL; see COPYING file.

import {
  collection,
  doc,
  updateDoc
} from "firebase/firestore/lite";

import { $ } from "../util.js";

let g_db;
let g_docId;
let g_fields;
let g_pageNum;

let g_fieldOverlays = [];
let g_fieldTiles = [];

async function persist() {
  await updateDoc(
      doc(collection(g_db, "dtmodules"), g_docId),
      { "fields": g_fields });
}

function add(dragResult) {
  const r = dragResult.rect;
  g_fields.push({
    line: String(g_fields.length + 1),  // TODO: ensure uniqueness
    name: "[name]",
    page: g_pageNum,
    rect: [r.x, r.y, r.width, r.height]
  });
  g_fieldOverlays.push(dragResult.field_el);
  persist();
}

function initForForm(form, db) {
  g_db = db;
  g_docId = form.id;
  g_fields = form.fields;
  if (!g_fields) {
    g_fields = form.fields = [];
  }

  _rebuildFieldOverlays();
  _rebuildFieldTiles();
}

function onChangePage(page_num) {
  if (g_pageNum == page_num)
    return;
  g_pageNum = page_num;
  if (!g_fields)
    return;

  _rebuildFieldOverlays();
  _rebuildFieldTiles();
}

function _rebuildFieldOverlays() {
  const canvas_el = $("#frm-canvas");
  for (const overlay of g_fieldOverlays)
    if (overlay.parentNode)
      overlay.parentNode.removeChild(overlay);
  g_fieldOverlays = [];

  for (const field of g_fields) {
    if (field.page != g_pageNum)
      continue;

    const r = field.rect;
    const rect = new Rect(r[0], r[1], r[2], r[3]);

    const overlay = document.createElement("div");
    overlay.setAttribute("class", "frm-field");
    rect.positionElement(overlay, 1);
    canvas_el.appendChild(overlay);
    g_fieldOverlays.push(overlay);
  }
}

function _rebuildFieldTiles() {

}

function reset() {
  g_fields = null;
  g_docId = null;
  g_pageNum = 0;
}

class Rect {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  positionElement(el, border_thickness) {
    const dim_adjust = border_thickness * 2;
    const el_style = el.style;

    const css_width = Math.max(this.width - dim_adjust, 0);
    const css_height = Math.max(this.height - dim_adjust, 0);

    el_style.left = `${this.x}px`;
    el_style.top = `${this.y}px`;
    el_style.width = `${css_width}px`;
    el_style.height = `${css_height}px`;
  }

  static fromCorners(start_point, end_point) {
    const x1 = start_point.x,
          y1 = start_point.y,
          x2 = end_point.x,
          y2 = end_point.y;

    return new Rect(
        x1 <= x2 ? x1 : x2,
        y1 <= y2 ? y1 : y2,
        Math.abs(x2 - x1) + 1,
        Math.abs(y2 - y1) + 1);
  }
}

export { initForForm, add, onChangePage, reset, Rect };
