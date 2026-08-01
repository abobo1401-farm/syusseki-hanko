import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {
  getFirestore, collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import {
  getAuth, signInAnonymously
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export {
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, onSnapshot, serverTimestamp,
  signInAnonymously
};

export const pad = n => String(n).padStart(2, "0");
export const todayJst = () => {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone:"Asia/Tokyo", year:"numeric", month:"2-digit", day:"2-digit"
  }).formatToParts(new Date());
  const obj = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return `${obj.year}-${obj.month}-${obj.day}`;
};
export const monthOf = date => date.slice(0,7);
export const dayOf = date => Number(date.slice(8,10));
export const periodOf = day => day <= 10 ? "early" : day <= 20 ? "middle" : "late";
export const periodLabel = p => ({early:"上旬",middle:"中旬",late:"下旬"})[p] || "";
export const stampFor = count => count <= 4 ? "🍎" : count <= 7 ? "🍏" : "👑";
export const escapeHtml = s => String(s ?? "").replace(/[&<>"']/g, m => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
}[m]));
