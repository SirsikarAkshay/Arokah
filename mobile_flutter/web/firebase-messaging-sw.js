importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBdcrgR4sboxvOp1skab1OAbNIhq3LC7k8",
  authDomain: "arokah-d747f.firebaseapp.com",
  projectId: "arokah-d747f",
  storageBucket: "arokah-d747f.firebasestorage.app",
  messagingSenderId: "862960610034",
  appId: "1:862960610034:web:5c26fba28b21b2874efe6b",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  if (title) {
    self.registration.showNotification(title, { body: body || "" });
  }
});
