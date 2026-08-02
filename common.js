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
export const STAMP_ICON = "🍎";                            // 記録用の文字ラベル（管理画面などの表示に使用）
export const STAMP_IMAGE = "assets/apple-stamp.png";       // 1〜4個目：赤りんご
export const STAMP_IMAGE_GOLD = "assets/apple-stamp-gold.png"; // 5個目以降：金りんご
export const GOLD_FROM = 5;                                // 何個目から金にするか
export const stampFor = () => STAMP_ICON;

/* 何個目かを渡すと、その番号にふさわしい絵柄を返す。
   番号はカード（旬）ごとに1から数え直します。 */
export const stampImageFor = n => (n >= GOLD_FROM ? STAMP_IMAGE_GOLD : STAMP_IMAGE);

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

/* ===== ハンコの効果音（音声ファイル不要・その場で合成） =====
   ドン（着地）＋紙に当たる衝撃＋きらりと上がる3音。 */
let _actx = null;
export function audioCtx(){
  const AC = window.AudioContext || window.webkitAudioContext;
  if(!AC) return null;
  if(!_actx) _actx = new AC();
  if(_actx.state === "suspended") _actx.resume().catch(()=>{});
  return _actx;
}

export function playStampSound(volume = 0.7){
  if(volume <= 0) return;
  let ctx;
  try{ ctx = audioCtx() }catch(err){ console.warn("音声を初期化できません", err); return }
  if(!ctx) return;
  const t = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.value = volume;
  master.connect(ctx.destination);

  // ドン（本体の重み）
  const osc = ctx.createOscillator(), g = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(190, t);
  osc.frequency.exponentialRampToValueAtTime(55, t + 0.16);
  g.gain.setValueAtTime(0.9, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
  osc.connect(g).connect(master);
  osc.start(t); osc.stop(t + 0.3);

  // 紙に当たる音（ノイズを短く）
  const len = Math.floor(ctx.sampleRate * 0.12);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for(let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  const src = ctx.createBufferSource(); src.buffer = buf;
  const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2200;
  const ng = ctx.createGain(); ng.gain.value = 0.45;
  src.connect(lp).connect(ng).connect(master);
  src.start(t);

  // きらり（ド・ミ・ソを上昇）
  [1046.5, 1318.5, 1568].forEach((f, i) => {
    const o = ctx.createOscillator(), og = ctx.createGain();
    const s = t + 0.12 + i * 0.07;
    o.type = "triangle"; o.frequency.value = f;
    og.gain.setValueAtTime(0.0001, s);
    og.gain.exponentialRampToValueAtTime(0.26, s + 0.01);
    og.gain.exponentialRampToValueAtTime(0.0001, s + 0.22);
    o.connect(og).connect(master);
    o.start(s); o.stop(s + 0.25);
  });
}
