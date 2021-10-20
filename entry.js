import { UI } from './js/ui';
import { initializeApp } from 'firebase/app';
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAOoBBWvETDnv2jMDyP61JHy59K1NsycLQ",
  authDomain: "super-alpaca-world.firebaseapp.com",
  databaseURL: "https://super-alpaca-world-default-rtdb.firebaseio.com",
  projectId: "super-alpaca-world",
  storageBucket: "super-alpaca-world.appspot.com",
  messagingSenderId: "653441589888",
  appId: "1:653441589888:web:765a814b435eee3f0c3c65"
};

const app = initializeApp(firebaseConfig);
// Get a reference to the database service
const db = getDatabase(app);

console.log('%c 🦙 WHOAH! 🦙', 'background: #222; color: #bada55');

UI.start();


