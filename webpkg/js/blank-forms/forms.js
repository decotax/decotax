// Copyright 2022 DecoTax.  Licensed under AGPL; see COPYING file.

// The Blank Forms UI.

import {  /* webpackMode: "eager" */
  collection,
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
import { $ } from "../util.js";

import "../../css/blank-forms.css";

import g_forms_view_markup from "../../html-embed/blank-forms.html";

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

  const app_el = $(".app");
  app_el.appendChild(view_root);

  const upload_dlg = $("#dlg-upload");

  const upload_btn = $("#btn-frms-upload");
  upload_btn.addEventListener("click", () => {
    upload_dlg.showModal();
  });

  upload_dlg.querySelector("form").addEventListener(
      "submit", () => { uploadNewBlankForm(auth, db); });
}

async function uploadNewBlankForm(auth, db) {
  const canvas_root = $("#frm-canvas");
  canvas_root.innerHTML = '<div class="spinner">⌛</div>';

  const uid = auth.currentUser.uid;
  const newRef = doc(collection(db, "dtmodules"));

  const storage = getStorage();
  const docId = newRef.id;
  const path = `form/user/${uid}/${docId}`;
  const storageRef = ref(storage, path);

  const file = $("#dlg-upload-file").files[0];
  await uploadBytes(storageRef, file);

  const functions = getFunctions();
  const fn_url = getCloudFunctionUrls()["process-new-form"];
  const fn_process = httpsCallableFromURL(functions, fn_url);

  const result = await fn_process({"uid": uid, "docId": docId});

  console.log(result.data);

  if (result.data.error) {
    // Clean up.
    await deleteObject(storageRef);
    canvas_root.innerText = result.data.error;
    return;
  }

  // Finalize.
  await setDoc(newRef, {
    "name": "[new form]",
    "owner": uid,
    "pdf": true
  });

  const page1_blob = await getBlob(ref(storage, `${path}.1`));
  const blob_url = URL.createObjectURL(page1_blob);

  canvas_root.innerHTML = `<img src="${blob_url}">`;
}

export { showBlankForms };
