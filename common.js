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

/* ===== 配信日の切り替え時刻 =====
   JSTの23:00を過ぎたら「翌日」として記録します。
   例）8月2日 23:30 に押したハンコ → 8月3日の出席になります。
   時刻を変えたいときはこの数字だけ変更してください（0にすると通常の日付）。 */
export const DAY_ROLLOVER_HOUR = 23;

const jstNow = (d = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).formatToParts(d);
  const o = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return { year: +o.year, month: +o.month, day: +o.day, hour: +o.hour % 24, minute: +o.minute };
};

/* 出席記録に使う日付。23時以降は翌日扱い。 */
export const todayJst = () => {
  const t = jstNow();
  const d = new Date(Date.UTC(t.year, t.month - 1, t.day));
  if (t.hour >= DAY_ROLLOVER_HOUR) d.setUTCDate(d.getUTCDate() + 1);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
};

/* 実際のカレンダー日付（切り替えなし）。表示の補足に使用。 */
export const calendarTodayJst = () => {
  const t = jstNow();
  return `${t.year}-${pad(t.month)}-${pad(t.day)}`;
};

/* 何日か前の日付を返す（通知履歴の掃除用）。 */
export const daysAgoJst = n => {
  const t = jstNow();
  const d = new Date(Date.UTC(t.year, t.month - 1, t.day));
  d.setUTCDate(d.getUTCDate() - n);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
};

export const monthOf = date => date.slice(0, 7);
export const dayOf = date => Number(date.slice(8, 10));
export const periodOf = day => day <= 10 ? "early" : day <= 20 ? "middle" : "late";
export const periodLabel = p => ({ early: "上旬", middle: "中旬", late: "下旬" })[p] || "";

/* ===== ハンコの絵柄 =====
   1種類に統一しています。枚数による絵柄の変化はありません。
   差し替えるときは assets/apple-stamp.png を置き換えてください。 */
export const STAMP_ICON = "🍎";                       // 記録用の文字ラベル（管理画面などの表示に使用）
export const STAMP_IMAGE = "assets/apple-stamp.png";  // 実際に表示するイラスト
export const stampFor = () => STAMP_ICON;

/* ===== スタンプカードの台紙 ===== */
export const CARD_IMAGE = {
  early:  "assets/card-early.png",
  middle: "assets/card-middle.png",
  late:   "assets/card-late.png"
};

/* ===== 日付ごとのマス位置 =====
   台紙画像を解析して求めた [中心X%, 中心Y%, マス幅%, マス高さ%]。
   台紙イラストを描き直したときはここの数値も合わせてください。 */
export const CARD_CELLS = {
  early: {
    1:[34.58,26.02,11.96,39.43],  2:[47.60,26.02,12.12,39.43],  3:[60.70,26.02,12.12,39.43],
    4:[73.80,26.02,12.12,39.43],  5:[86.78,26.02,12.04,39.43],
    6:[34.58,71.34,11.96,41.46],  7:[47.60,71.34,12.12,41.46],  8:[60.66,71.34,12.21,41.46],
    9:[73.80,71.34,12.12,41.46], 10:[86.78,71.34,12.04,41.46]
  },
  middle: {
    11:[34.58,26.11,11.96,39.68], 12:[47.56,26.11,12.21,39.68], 13:[60.66,26.11,12.21,39.68],
    14:[73.80,26.11,12.12,39.68], 15:[86.74,26.11,11.96,39.68],
    16:[34.58,71.66,11.96,41.70], 17:[47.56,71.66,12.21,41.70], 18:[60.66,71.66,12.21,41.70],
    19:[73.80,71.66,12.12,41.70], 20:[86.74,71.66,11.96,41.70]
  },
  late: {
    21:[33.60,26.33,10.33,40.00], 22:[44.91,26.33,10.50,40.00], 23:[56.35,26.33,10.74,40.00],
    24:[67.78,26.33,10.66,40.00], 25:[79.25,26.33,10.66,40.00],
    26:[33.65,71.22,10.41,40.82], 27:[44.91,71.22,10.50,40.82], 28:[56.31,71.22,10.66,40.82],
    29:[67.78,71.22,10.66,40.82], 30:[79.25,71.22,10.66,40.82], 31:[90.60,71.22,10.41,40.82]
  }
};

export const escapeHtml = s => String(s ?? "").replace(/[&<>"']/g, m => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
}[m]));
