// Copyright 2022 DecoTax.  Licensed under AGPL; see COPYING file.

function getFirebaseConfig() {
  return {
    apiKey: "AIzaSyA0up5zy1M_3dv8Ena0Av2y3Hy37ltTRS4",
    authDomain: "decotax.firebaseapp.com",
    projectId: "decotax",
    storageBucket: "decotax.appspot.com",
    messagingSenderId: "170518497841",
    appId: "1:170518497841:web:183be7ff835d5a8865a310",
    measurementId: "G-PZVYE29XX1"
  };
}

function getCloudFunctionUrls() {
  if (process.env.NODE_ENV == 'production') {
    return {
      "process-new-form":
          "https://process-new-form-6b2emivy3a-ue.a.run.app"
    }
  }
  else {
    return {
      "process-new-form": "http://localhost:8080/"
    }
  }
}

export { getFirebaseConfig, getCloudFunctionUrls };
