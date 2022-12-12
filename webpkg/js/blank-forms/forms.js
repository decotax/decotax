// Copyright 2022 DecoTax.  Licensed under AGPL; see COPYING file.

import {  /* webpackMode: "eager" */
  collection,
  getDocs,
  getFirestore,
  query,
  where
} from "firebase/firestore/lite";

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
}

export { showBlankForms };
