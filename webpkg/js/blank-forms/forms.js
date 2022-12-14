// Copyright 2022 DecoTax.  Licensed under AGPL; see COPYING file.

import {  /* webpackMode: "eager" */
  collection,
  doc,
  getDocs,
  getFirestore,
  query,
  where
} from "firebase/firestore/lite";

import {
  getStorage,
  ref,
  uploadBytes
} from "firebase/storage";

import {
  getFunctions,
  httpsCallableFromURL
} from "firebase/functions";

import "../../css/blank-forms.css";

const g_forms_view_markup = [
  '<form id="form-list" action="..">',
    '<input type="radio" name="form-sel" id="foo" value="foo">',
    '<label for="foo">Foo</label>',
  '</form>',
  '<button id="btn-frms-upload">',
    'Upload new blank form',
  '</button>',
  '<dialog id="dlg-upload">',
    '<form method="dialog">',
      '<input type="file" id="dlg-upload-file" name="filename">',
      '<input type="submit">',
    '</form>',
  '</dialog>',
  '<div id="frm-canvas"></div>'
].join("");

async function showBlankForms(app, auth) {
  const db = getFirestore(app);
  const q = query(
      collection(db, "dtmodules"),
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

  const app_el = document.querySelector(".app");
  app_el.appendChild(view_root);

  const upload_dlg = document.querySelector("#dlg-upload");

  const upload_btn = document.querySelector("#btn-frms-upload");
  upload_btn.addEventListener("click", () => {
    upload_dlg.showModal();
  });

  upload_dlg.querySelector("form").addEventListener(
      "submit", () => { uploadNewBlankForm(auth, db); });
}

async function uploadNewBlankForm(auth, db) {
  document.querySelector("#frm-canvas").innerHTML =
      '<div class="spinner">⌛</div>';

  const uid = auth.currentUser.uid;
  const newRef = doc(collection(db, "dtmodules"));

  const storage = getStorage();
  const docId = newRef.id;
  const path = `form/user/${uid}/${docId}`;
  const storageRef = ref(storage, path);

  const file = document.querySelector("#dlg-upload-file").files[0];
  await uploadBytes(storageRef, file);

  const functions = getFunctions();
  const process_new_form_url = "http://localhost:8080/";
  fn_process = httpsCallableFromURL(functions, process_new_form_url);

  const result = await fn_process({'docId': docId});
  console.log(result.data);
}

export { showBlankForms };
