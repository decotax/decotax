// Copyright 2022 DecoTax.  Licensed under AGPL; see COPYING file.

// The firebase configuration and cloud function urls.

function getFirebaseConfig() {
  return {
    // It's ok for the API key to be public.
    // https://firebase.google.com/docs/projects/api-keys

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
  if (process.env.NODE_ENV == "production") {
    return {
      "process-new-form":
          "https://process-new-form-6b2emivy3a-ue.a.run.app"
    }
  }
  else {
    // In dev mode we run a local instance (see run.sh).
    return {
      "process-new-form": "http://localhost:8081/"
    }
  }
}

export { getFirebaseConfig, getCloudFunctionUrls };
