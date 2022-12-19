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

import "../../css/blank-forms.css";

import g_forms_view_markup from "../../html-embed/blank-forms.html";

let g_auth;
let g_db;

async function showBlankForms(app, auth) {
  const app_el = $(".app");
  const old_view_root = $(".view-blank-forms");
  if (old_view_root)
    app_el.removeChild(old_view_root);

  g_db = getFirestore(app);
  g_auth = auth;
  const q = query(
      collection(g_db, "dtmodules"),
      where("owner", "==", auth.currentUser.uid),
      where("pdf", "==", true));

  const qSnapshot = await getDocs(q);
  const outLines = [];
  qSnapshot.forEach(doc => {
    outLines.push(`${doc.id} : ${doc.get("name")}`);
  });
  console.log(outLines.join("\n"));

  const view_root = document.createElement("div");
  view_root.classList.add("view-blank-forms");
  view_root.innerHTML = g_forms_view_markup;
  app_el.appendChild(view_root);

  _initUploadDialog();
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
  const canvas_root = $("#frm-canvas");
  canvas_root.innerHTML = '<div class="spinner">⌛</div>';

  const uid = g_auth.currentUser.uid;
  const newRef = doc(collection(g_db, "dtmodules"));

  const storage = getStorage();
  const docId = newRef.id;
  const path = `form/user/${uid}/${docId}`;
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, file);
  _resetDialog();

  const functions = getFunctions();
  const fn_url = getCloudFunctionUrls()["process-new-form"];
  const fn_process = httpsCallableFromURL(functions, fn_url);

  const result = await fn_process({"uid": uid, "docId": docId});

  if (result.data.error) {
    // Clean up.
    await deleteObject(storageRef);
    canvas_root.innerText = result.data.error;
    return;
  }
  const page_count = result.data.page_count;

  // Finalize.
  await setDoc(newRef, {
    "name": name,
    "owner": uid,
    "pdf": true,
    "page_count": page_count
  });

  const page1_blob = await getBlob(ref(storage, `${path}.0`));
  const blob_url = URL.createObjectURL(page1_blob);

  canvas_root.innerHTML = `<img src="${blob_url}">` +
      "<button>Delete</button>";

  canvas_root.querySelector("button").addEventListener("click", () => {
    canvas_root.innerHTML = '<div class="spinner">⌛</div>';
    (async () => {
      // TODO: parallelize?
      await deleteDoc(doc(collection(g_db, "dtmodules"), docId));
      for (var n = 0; n < page_count; n++)
        await deleteObject(ref(storage, `${path}.${n}`));
      deleteObject(ref(storage, path));
      canvas_root.innerHTML = 'deleted';
    })();
  });
}

// <input type="radio" name="form-sel" id="foo" value="foo">
// <label for="foo">Foo</label>

export { showBlankForms };
