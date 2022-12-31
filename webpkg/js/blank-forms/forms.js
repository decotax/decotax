// Copyright 2022 DecoTax.  Licensed under AGPL; see COPYING file.

// The Blank Forms UI.

import {  /* webpackMode: "eager" */
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  query,
  setDoc,
  where
} from "firebase/firestore/lite";

import {
  deleteObject,
  getBlob,
  getStorage,
  ref,
  uploadBytes
} from "firebase/storage";

import {
  getFunctions,
  httpsCallableFromURL
} from "firebase/functions";

import { getCloudFunctionUrls } from "../fb-config.js";
import { $, flashAndFocusField } from "../util.js";
import * as Views from "../views.js";

import "../../css/blank-forms.css";

import g_forms_view_markup from "../../html-embed/blank-forms.html";

let g_auth;
let g_db;
let g_storage;

let g_forms;
let g_forms_by_id;
let g_current_form;
let g_current_page;

async function showBlankForms(app, auth) {
  g_forms = [];
  g_forms_by_id = {};

  g_db = getFirestore(app);
  g_storage = getStorage();
  g_auth = auth;
  const q = query(
      collection(g_db, "dtmodules"),
      where("owner", "==", auth.currentUser.uid),
      where("pdf", "==", true));

  const qSnapshot = await getDocs(q);
  qSnapshot.forEach(doc => {
    const form = {
      id: doc.id,
      name: doc.get("name"),
      page_count: doc.get("page_count"),
      page_blobs: []
    };
    g_forms_by_id[doc.id] = form;
    g_forms.push(form);
  });
  g_forms.sort((f1, f2) => f1.name > f2.name);

  const view_root = document.createElement("div");
  view_root.classList.add("view-blank-forms");
  view_root.innerHTML = g_forms_view_markup;
  Views.setView(view_root);

  g_forms.forEach(form => {
    _addDomForFormListItem(form, false);
  });
  _initToolbar();
  _initUploadDialog();

  return view_root;
}

function _setCanvasBanner(text) {
  const banner = $("#frm-canvas-panel .banner");
  banner.innerText = text;
  banner.style.display = text ? "block" : "none";
}

function _addDomForFormListItem(form, setChecked) {
  const formListEl = $("#form-list");

  const btnId = `form-sel-${form.id}`;
  const radioBtn = document.createElement("input");
  radioBtn.setAttribute("type", "radio");
  radioBtn.setAttribute("name", "form-sel");
  radioBtn.setAttribute("id", btnId);
  radioBtn.setAttribute("value", form.id);

  const labelEl = document.createElement("label");
  labelEl.setAttribute("for", btnId);
  labelEl.innerText = form.name;

  formListEl.appendChild(radioBtn);
  formListEl.appendChild(labelEl);

  radioBtn.addEventListener("change", e => {
    if (e.target && e.target.checked) {
      form = g_forms_by_id[e.target.value];

      // Null page_count means a new form still being processed.
      // Don't blow up if user switched away and back.
      // TODO: improve UX here.
      if (form.page_count != null)
        _showForm(form);
    }
  });

  if (setChecked)
    radioBtn.checked = true;
}

function _removeDomForFormListItem(docId) {
  const formListEl = $("#form-list");
  const radioBtn = $(`#form-sel-${docId}`);

  // Remove <label> and <input>.
  formListEl.removeChild(radioBtn.nextSibling);
  formListEl.removeChild(radioBtn);
}

async function _showForm(form) {
  g_current_page = 0;
  g_current_form = form;
  _setCanvasBanner("");

  $("#frm-page").innerText = "1";
  $("#frm-page-count").innerText = String(g_current_form.page_count);
  $("#frm-toolbar").style.visibility = "visible";

  await _showPage(0);
  $("#frm-canvas").style.display = "block";
}

async function _showPage(page_num) {
  g_current_page = page_num;
  $("#frm-page").innerText = String(page_num + 1);

  const uid = g_auth.currentUser.uid;
  const blobs = g_current_form["page_blobs"];
  let blob_url = blobs[page_num];

  if (!blob_url) {
    const spinner = $("#frm-canvas-panel .spinner");
    spinner.style.display = "block";

    const path = `form/user/${uid}/${g_current_form.id}`;
    const blob = await getBlob(ref(g_storage, `${path}.${page_num}`));
    blob_url = URL.createObjectURL(blob);
    blobs[page_num] = blob_url;

    spinner.style.display = "none";
  }

  $("#frm-canvas > img").setAttribute("src", blob_url);
}

function _initToolbar() {
  $("#frm-page-prev").addEventListener("click", e => {
    if (g_current_page > 0)
      _showPage(g_current_page - 1);
    e.preventDefault();
  });

  $("#frm-page-next").addEventListener("click", e => {
    if (g_current_page < g_current_form.page_count - 1)
      _showPage(g_current_page + 1);
    e.preventDefault();
  });

  $("#btn-frms-delete").addEventListener("click", async () => {
    _deleteForm();
  });

  // Temporary.
  $("#btn-frms-add-field").addEventListener("click", async () => {
    const result = await dragNewRect();
    console.log(result.rect);
  });
}

async function _deleteForm() {
  const spinner = $("#frm-canvas-panel .spinner");
  spinner.style.display = "block";

  const uid = g_auth.currentUser.uid;
  const docId = g_current_form.id;
  const pageCount = g_current_form.page_count;
  const name = g_current_form.name;

  const path = `form/user/${uid}/${docId}`;

  // TODO: parallelize?
  await deleteDoc(doc(collection(g_db, "dtmodules"), docId));
  for (var n = 0; n < pageCount; n++)
    await deleteObject(ref(g_storage, `${path}.${n}`));
  deleteObject(ref(g_storage, path));

  spinner.style.display = "none";
  g_current_form = null;
  g_current_page = null;
  $("#frm-toolbar").style.visibility = "hidden";
  $("#frm-canvas > img").removeAttribute("src");
  $("#frm-canvas").style.display = "none";

  _setCanvasBanner(`Deleted “${name}”.`);
  _removeDomForFormListItem(docId);
}

function _initUploadDialog() {
  const upload_dlg = $("#dlg-upload");

  const upload_btn = $("#btn-frms-upload");
  upload_btn.addEventListener("click", () => {
    upload_dlg.showModal();
  });

  const form_el = upload_dlg.querySelector("form");
  form_el.addEventListener("submit", e => {
    const params = _preValidate();
    if (params)
      uploadNewBlankForm(params.file, params.name);
    else
      e.preventDefault();
  });

  $("#dlg-upload-cancel").addEventListener("click", e => {
    _resetDialog();
    upload_dlg.close();
    e.preventDefault();
  });
}

function _resetDialog() {
  $("#dlg-upload-file").value = "";
  $("#dlg-upload-name").value = "";
}

function _preValidate() {
  const file_el = $("#dlg-upload-file");
  const file = file_el.files[0];

  const name_el = $("#dlg-upload-name");
  const name = name_el.value.trim();

  if (!file)
    flashAndFocusField(file_el);
  else if (!name)
    flashAndFocusField(name_el);
  else if (!file.size || file.type != "application/pdf")
    alert("That doesn't look like a valid PDF file.");
  else
    return { file, name };
}

async function uploadNewBlankForm(file, name) {
  const spinner = $("#frm-canvas-panel .spinner");
  spinner.style.display = "block";

  const uid = g_auth.currentUser.uid;
  const newRef = doc(collection(g_db, "dtmodules"));

  const docId = newRef.id;
  const path = `form/user/${uid}/${docId}`;
  const storageRef = ref(g_storage, path);

  const form = {
    id: docId,
    name: name,
    page_count: null,
    page_blobs: []
  };
  g_forms.push(form);
  g_forms_by_id[docId] = form;
  _addDomForFormListItem(form, true);
  _setCanvasBanner("");
  $("#frm-toolbar").style.visibility = "hidden";
  $("#frm-canvas").style.display = "none";

  await uploadBytes(storageRef, file);
  _resetDialog();

  const functions = getFunctions();
  const fn_url = getCloudFunctionUrls()["process-new-form"];
  const fn_process = httpsCallableFromURL(functions, fn_url);

  const result = await fn_process({"uid": uid, "docId": docId});

  if (result.data.error) {
    // Clean up.
    await deleteObject(storageRef);
    _setCanvasBanner(
        `Something's wrong with this PDF file (${file.name}).\n\n` +
        `The server said:\n${result.data.error}\n\n` +
        "Try uploading a different file.");
    console.log(file);
    _removeDomForFormListItem(docId);
    spinner.style.display = "none";
    return;
  }
  form.page_count = result.data.page_count;

  // Finalize.
  await setDoc(newRef, {
    "name": name,
    "owner": uid,
    "pdf": true,
    "page_count": form.page_count
  });

  _showForm(form);
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

async function dragNewRect() {
  const canvas_el = $("#frm-canvas");
  canvas_el.style.cursor = "crosshair";

  const get_local_point = e => {
    const base_rect = canvas_el.getBoundingClientRect();
    return {
      x: e.clientX - base_rect.x,
      y: e.clientY - base_rect.y
    };
  };

  const start_params = await new Promise(resolve => {
    const pointerdown_fn = e => {
      const pointer_id = e.pointerId;
      canvas_el.setPointerCapture(pointer_id);

      const start_point = get_local_point(e);
      const rect = Rect.fromCorners(start_point, start_point);

      const field_el = document.createElement("div");
      field_el.setAttribute("class", "frm-field");
      rect.positionElement(field_el, 1);
      canvas_el.appendChild(field_el);

      resolve({start_point, pointer_id, field_el});

      canvas_el.removeEventListener("pointerdown", pointerdown_fn);
      e.preventDefault();
    };
    canvas_el.addEventListener("pointerdown", pointerdown_fn);
  });

  return await new Promise(resolve => {
    const pointermove_fn = e => {
      const end_point = get_local_point(e);
      const rect = Rect.fromCorners(start_params.start_point, end_point);
      rect.positionElement(start_params.field_el, 1);
      e.preventDefault();
    };

    const pointerup_fn = e => {
      const end_point = get_local_point(e);
      const rect = Rect.fromCorners(start_params.start_point, end_point);
      const field_el = start_params.field_el;
      rect.positionElement(field_el, 1);

      resolve({rect, field_el});

      canvas_el.releasePointerCapture(start_params.pointer_id);
      canvas_el.removeEventListener("pointermove", pointermove_fn);
      canvas_el.removeEventListener("pointerup", pointerup_fn);
      canvas_el.style.cursor = "";
      e.preventDefault();
    };

    canvas_el.addEventListener("pointermove", pointermove_fn);
    canvas_el.addEventListener("pointerup", pointerup_fn);
  });
}

export { showBlankForms };
