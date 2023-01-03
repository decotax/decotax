// Copyright 2022 DecoTax.  Licensed under AGPL; see COPYING file.

import {
  collection,
  doc,
  updateDoc
} from "firebase/firestore/lite";

import { $, removeAllChildren } from "../util.js";

let g_db;
let g_docId;
let g_fields;
let g_pageNum;

let g_fieldOverlays = new Map;
let g_fieldTiles = new Map;
let g_selectedLine = null;

async function persist() {
  await updateDoc(
      doc(collection(g_db, "dtmodules"), g_docId),
      { "fields": g_fields });
}

function add(dragResult) {
  const r = dragResult.rect;
  // TODO: ensure uniqueness
  const line = String(g_fields.length + 1);
  g_fields.push({
    line: line,
    name: "[name]",
    page: g_pageNum,
    rect: [r.x, r.y, r.width, r.height]
  });
  g_fieldOverlays.set(line, dragResult.field_el);
  persist();
}

function initForForm(form, db) {
  g_db = db;
  g_docId = form.id;
  g_fields = form.fields;
  if (!g_fields) {
    g_fields = form.fields = [];
  }
  _rebuildTilesAndOverlays();
}

function onChangePage(page_num) {
  if (g_pageNum == page_num)
    return;
  g_pageNum = page_num;
  if (!g_fields)
    return;
  _rebuildTilesAndOverlays();
}

function _rebuildTilesAndOverlays() {
  _rebuildFieldOverlays();
  _rebuildFieldTiles();
  g_selectedLine = null;
}

function _rebuildFieldOverlays() {
  const container = $("#frm-canvas-overlays");
  removeAllChildren(container);
  g_fieldOverlays.clear();

  for (const field of g_fields) {
    if (field.page != g_pageNum)
      continue;

    const r = field.rect;
    const rect = new Rect(r[0], r[1], r[2], r[3]);

    const overlay = document.createElement("div");
    overlay.setAttribute("class", "frm-field");
    rect.positionElement(overlay, 1);
    container.appendChild(overlay);
    g_fieldOverlays.set(field.line, overlay);
  }
}

function _createPropDom(field, prop, idx) {
  const dom = document.createElement("div");
  dom.classList.add("frm-prop");
  dom.classList.add(prop);
  let val = field[prop];
  if (idx != null)
    val = val[idx];
  dom.innerText = val;
  return dom;
}

function _rebuildFieldTiles() {
  const container = $("#frm-edit-tiles");
  removeAllChildren(container);
  g_fieldTiles.clear();

  for (const field of g_fields) {
    if (field.page != g_pageNum)
      continue;

    const tile = document.createElement("div");
    tile.classList.add("frm-field-tile");
    tile.appendChild(_createPropDom(field, "line"));
    tile.appendChild(_createPropDom(field, "name"));
    tile.appendChild(document.createElement("br"));
    tile.appendChild(_createPropDom(field, "rect", 0));
    tile.appendChild(_createPropDom(field, "rect", 1));
    tile.appendChild(_createPropDom(field, "rect", 2));
    tile.appendChild(_createPropDom(field, "rect", 3));
    container.appendChild(tile);
    g_fieldTiles.set(field.line, tile);
  }
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
