/* =========================================================
  Math Pinkyland - FULL
  Added:
  ✅ Mode Ujian (timer + nilai akhir)
  ✅ Leaderboard (top scores localStorage)
  ✅ Game cepat 60 detik
  Includes:
  ✅ Anti hang genSetForClass (mcq/input safe)
========================================================= */

// ---------------------
// Utilities
// ---------------------
const $ = (id) => document.getElementById(id);
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

function normalizeAnswer(s) {
  if (s == null) return "";
  let t = String(s).trim().toLowerCase();
  t = t.replace(/\s+/g, "");
  t = t.replace(",", ".");
  return t;
}

function isAnswerCorrect(user, expected) {
  const u = normalizeAnswer(user);
  const e = normalizeAnswer(expected);
  if (!u) return false;
  if (u === e) return true;

  // words
  if (!/[0-9]/.test(e) && !/[0-9]/.test(u)) return u === e;

  // percent
  if (e.endsWith("%")) {
    const eNum = parseFloat(e.replace("%", ""));
    const uNum = parseFloat(u.replace("%", ""));
    if (!Number.isNaN(eNum) && !Number.isNaN(uNum) && Math.abs(uNum - eNum) < 1e-9) return true;
  }

  // fraction
  const fracToNum = (x) => {
    if (!x.includes("/")) return null;
    const [a, b] = x.split("/");
    const na = parseFloat(a), nb = parseFloat(b);
    if (Number.isNaN(na) || Number.isNaN(nb) || nb === 0) return null;
    return na / nb;
  };
  const uf = fracToNum(u);
  const ef = fracToNum(e);
  if (uf != null && ef != null && Math.abs(uf - ef) < 1e-9) return true;

  // numeric
  const uNum = parseFloat(u.replace("%", ""));
  const eNum = parseFloat(e.replace("%", ""));
  if (!Number.isNaN(uNum) && !Number.isNaN(eNum) && Math.abs(uNum - eNum) < 1e-9) return true;

  return false;
}

function gcd(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}
function lcm(a, b) {
  return Math.abs(a * b) / gcd(a, b);
}

function formatMMSS(sec){
  sec = Math.max(0, sec|0);
  const m = Math.floor(sec/60);
  const s = sec % 60;
  return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

// ---------------------
// Sound (WebAudio)
// ---------------------
let soundOn = true;
let audioCtx = null;

function ensureAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}
function beep(type = "good") {
  if (!soundOn) return;
  try {
    ensureAudio();
    const t0 = audioCtx.currentTime;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);

    const freq = type === "good" ? 880 : 220;
    o.frequency.setValueAtTime(freq, t0);
    o.type = "sine";

    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(type === "good" ? 0.12 : 0.16, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);

    o.start(t0);
    o.stop(t0 + 0.2);
  } catch (e) {}
}

// ---------------------
// Confetti
// ---------------------
function confettiBurst() {
  const layer = $("confetti");
  if (!layer) return;

  const pieces = 18;
  for (let i = 0; i < pieces; i++) {
    const el = document.createElement("div");
    el.className = "piece";
    el.style.left = `${randInt(0, 100)}%`;
    el.style.animationDuration = `${randInt(900, 1400)}ms`;
    el.style.transform = `translateY(-10px) rotate(${randInt(0, 180)}deg)`;

    const colors = [
      "rgba(255,79,139,0.95)",
      "rgba(255,157,187,0.95)",
      "rgba(255,209,220,0.95)",
      "rgba(255,255,255,0.90)",
    ];
    el.style.background = colors[randInt(0, colors.length - 1)];
    el.style.width = `${randInt(8, 12)}px`;
    el.style.height = `${randInt(10, 18)}px`;

    layer.appendChild(el);
    setTimeout(() => el.remove(), 1700);
  }
}

// ---------------------
// DATA Materi (ringkas - tetap ceria)
// ---------------------
const DATA = {
  1: {
    subtitle: "🌟 Fondasi: bilangan, tambah-kurang, dan bangun datar dasar.",
    topics: [
      { id:"k1-bilangan", title:"🔢 Bilangan 1–100",
        body:`<p><b>Bilangan</b> adalah angka untuk menyatakan banyak benda. Bisa urut maju/mundur, dan dibandingkan pakai <code>&gt;</code> <code>&lt;</code> <code>=</code>.</p>`,
        examples:`<ul><li>Setelah 48 adalah 49</li><li>Urut: 15,9,20 → 9,15,20</li></ul>`,
        mini:[{q:"Angka setelah 48?",a:"49"},{q:"Tanda yang tepat: 23 … 32",a:"<"}]
      },
      { id:"k1-tambahkurang", title:"➕➖ Penjumlahan & Pengurangan",
        body:`<p><b>Tambah</b> = gabung. <b>Kurang</b> = ambil sebagian. Pakai garis bilangan: tambah ke kanan 👉, kurang ke kiri 👈.</p>`,
        examples:`<ul><li>6+3=9</li><li>10−4=6</li></ul>`,
        mini:[{q:"7+2=?",a:"9"},{q:"10−6=?",a:"4"}]
      },
      { id:"k1-bangundatar", title:"📐 Bangun Datar Dasar",
        body:`<p>Bangun datar: persegi, persegi panjang, segitiga, lingkaran. Coba cari di rumah: pintu (pp), jam (lingkaran).</p>`,
        examples:`<ul><li>Segitiga: 3 sisi</li><li>Persegi: 4 sisi sama</li></ul>`,
        mini:[{q:"Bangun 3 sisi?",a:"segitiga"},{q:"Benda lingkaran? (contoh)",a:"jam"}]
      },
    ]
  },
  2: { subtitle:"🌈 Nilai tempat, perkalian, pembagian.", topics:[
    { id:"k2-nilaitempat", title:"🏗️ Nilai Tempat sampai 1.000",
      body:`<p>Contoh: <code>732</code> = 7 ratusan, 3 puluhan, 2 satuan. Bandingkan dari ratusan dulu.</p>`,
      examples:`<ul><li>689 &lt; 698</li></ul>`, mini:[{q:"Dalam 456, ratusan?",a:"4"},{q:"589 … 598",a:"<"}]
    },
    { id:"k2-perkalian", title:"✖️ Perkalian (Tambah Berulang)",
      body:`<p><code>4×3 = 3+3+3+3</code>. Hafal tabel 1–10 bikin cepat!</p>`,
      examples:`<ul><li>5×4=20</li></ul>`, mini:[{q:"3×6=?",a:"18"},{q:"4×5=?",a:"20"}]
    },
    { id:"k2-pembagian", title:"➗ Pembagian (Bagi Rata)",
      body:`<p>12 kue ÷ 4 anak = 3. Pembagian kebalikan perkalian.</p>`,
      examples:`<ul><li>20÷5=4</li></ul>`, mini:[{q:"10÷2=?",a:"5"},{q:"12÷3=?",a:"4"}]
    }
  ]},
  3: { subtitle:"🧩 Operasi campuran, pecahan, keliling.", topics:[
    { id:"k3-campuran", title:"🧠 Operasi Campuran",
      body:`<p>Aturan: <b>× dan ÷ dulu</b>, baru + dan −. Kurung dikerjakan paling dulu.</p>`,
      examples:`<ul><li>6+4×2=14</li></ul>`, mini:[{q:"10−2×3=?",a:"4"},{q:"8+12÷4=?",a:"11"}]
    },
    { id:"k3-pecahan", title:"🍰 Pecahan",
      body:`<p>Pecahan adalah bagian dari satu utuh. <code>1/2</code> lebih besar dari <code>1/4</code>.</p>`,
      examples:`<ul><li>2/4 = 1/2</li></ul>`, mini:[{q:"Setengah ditulis?",a:"1/2"},{q:"Lebih besar 1/2 atau 1/4?",a:"1/2"}]
    },
    { id:"k3-keliling", title:"🧷 Keliling",
      body:`<p>Keliling = jumlah semua sisi. Persegi: <code>4×s</code>. PP: <code>2×(p+l)</code>.</p>`,
      examples:`<ul><li>s=5 → 20</li></ul>`, mini:[{q:"Keliling persegi s=4?",a:"16"},{q:"PP p=6 l=2?",a:"16"}]
    }
  ]},
  4: { subtitle:"🚀 FPB, KPK, konversi pecahan-desimal-persen.", topics:[
    { id:"k4-fpb", title:"🧱 FPB", body:`<p>FPB = faktor terbesar yang sama. Contoh FPB(12,18)=6.</p>`,
      examples:`<ul><li>FPB(8,12)=4</li></ul>`, mini:[{q:"FPB 12 dan 18?",a:"6"},{q:"FPB 8 dan 12?",a:"4"}]
    },
    { id:"k4-kpk", title:"⏰ KPK", body:`<p>KPK = kelipatan terkecil yang sama. Contoh KPK(4,6)=12.</p>`,
      examples:`<ul><li>KPK(3,5)=15</li></ul>`, mini:[{q:"KPK 4 dan 6?",a:"12"},{q:"KPK 3 dan 5?",a:"15"}]
    },
    { id:"k4-konversi", title:"💯 Desimal–Persen", body:`<p>0,25 = 25% (kali 100). 50% = 0,5 (bagi 100).</p>`,
      examples:`<ul><li>3/4=75%</li></ul>`, mini:[{q:"0,25 = ...%",a:"25%"},{q:"50% = desimal?",a:"0.5"}]
    }
  ]},
  5: { subtitle:"🏅 Perbandingan, skala, kecepatan-jarak-waktu.", topics:[
    { id:"k5-perbandingan", title:"⚖️ Perbandingan",
      body:`<p>Perbandingan bisa disederhanakan dengan membagi FPB. 2:4 → 1:2.</p>`,
      examples:`<ul><li>6:9 → 2:3</li></ul>`, mini:[{q:"2:4 jadi?",a:"1:2"},{q:"6:9 jadi?",a:"2:3"}]
    },
    { id:"k5-skala", title:"🗺️ Skala",
      body:`<p>Skala 1:100 artinya 1 cm peta = 100 cm sebenarnya. Rumus: peta × penyebut.</p>`,
      examples:`<ul><li>2 cm → 200 cm</li></ul>`, mini:[{q:"1:100, 2 cm → cm?",a:"200"},{q:"1:1000, 4 cm → cm?",a:"4000"}]
    },
    { id:"k5-kjt", title:"🚗 K-J-T",
      body:`<p>Kecepatan=Jarak/Waktu. Jarak=Kecepatan×Waktu. Waktu=Jarak/Kecepatan.</p>`,
      examples:`<ul><li>60 km/jam 2 jam → 120 km</li></ul>`, mini:[{q:"60×3=?",a:"180"},{q:"100÷2=?",a:"50"}]
    }
  ]},
  6: { subtitle:"👑 Volume, data, persen, siap SMP!", topics:[
    { id:"k6-volume", title:"📦 Volume Kubus & Balok",
      body:`<p>Kubus: V=s³. Balok: V=p×l×t.</p>`,
      examples:`<ul><li>s=4 → 64</li></ul>`, mini:[{q:"Kubus s=4 vol?",a:"64"},{q:"Balok 6×2×5?",a:"60"}]
    },
    { id:"k6-data", title:"📊 Persentase Data",
      body:`<p>Persentase = (bagian/total)×100%. 5 dari 20 = 25%.</p>`,
      examples:`<ul><li>12 dari 48 = 25%</li></ul>`, mini:[{q:"5 dari 20 = ...%",a:"25%"},{q:"12 dari 48 = ...%",a:"25%"}]
    },
    { id:"k6-campuran", title:"🧠 Campuran",
      body:`<p>Soal campuran: tulis diketahui-ditanya, pilih rumus, cek satuan.</p>`,
      examples:`<ul><li>20% dari 80 = 16</li></ul>`, mini:[{q:"20% dari 80=?",a:"16"},{q:"25% dari 200=?",a:"50"}]
    }
  ]}
};

// ---------------------
// Quiz Generator (SAFE)
// ---------------------
function genSetForClass(cls, count, mode = "mix") {
  const set = [];
  const makeId = () => `${cls}-${uid()}`;
  const mcq = (q, choices, ansIndex, exp) => ({ id: makeId(), type: "mcq", q, choices, ans: ansIndex, exp });
  const inp = (q, answer, exp) => ({ id: makeId(), type: "input", q, ans: String(answer), exp });

  function inputToMcq(qObj) {
    const correct = String(qObj.ans);
    const distract = new Set();
    const isNumeric =
      !Number.isNaN(Number(correct.replace("%", "").replace(",", "."))) ||
      /^\d+\/\d+$/.test(correct.replace(/\s+/g, ""));

    while (distract.size < 3) {
      let d = correct;
      if (isNumeric) {
        const num = Number(correct.replace("%", "").replace(",", "."));
        if (!Number.isNaN(num)) {
          const delta = randInt(1, 5);
          const candidate = Math.random() < 0.5 ? num + delta : Math.max(0, num - delta);
          d = correct.includes("%") ? `${candidate}%` : String(candidate);
        } else {
          const poolFrac = ["1/2", "1/3", "1/4", "2/3", "3/4"];
          d = poolFrac[randInt(0, poolFrac.length - 1)];
        }
      } else {
        const pool = ["persegi", "segitiga", "lingkaran", "persegi panjang", "jam", "pintu", "buku"];
        d = pool[randInt(0, pool.length - 1)];
      }
      if (d !== correct) distract.add(String(d));
      if (distract.size > 10) break;
    }

    const choices = shuffle([correct, ...Array.from(distract)].slice(0, 4));
    const ansIndex = choices.indexOf(correct);
    return mcq(qObj.q, choices, ansIndex, qObj.exp);
  }

  function mcqToInput(qObj) {
    const correct = qObj.choices[qObj.ans];
    return inp(qObj.q, correct, qObj.exp);
  }

  // Generators per kelas
  const generators = {
    1: () => {
      const pick = randInt(1, 4);
      if (pick === 1) {
        const a = randInt(1, 90);
        return inp(`Angka setelah ${a} adalah ...`, a + 1, `Sesudah ${a} adalah ${a + 1}.`);
      }
      if (pick === 2) {
        const a = randInt(1, 20), b = randInt(1, 20);
        return inp(`${a} + ${b} = ...`, a + b, `Jumlahkan ${a} dan ${b} → ${a + b}.`);
      }
      if (pick === 3) {
        const a = randInt(5, 30), b = randInt(1, a - 1);
        return inp(`${a} − ${b} = ...`, a - b, `Kurangi ${a} dengan ${b} → ${a - b}.`);
      }
      const a = randInt(1, 50), b = randInt(1, 50);
      const correct = a > b ? ">" : a < b ? "<" : "=";
      const choices = shuffle([">", "<", "="]);
      return mcq(`Tanda yang tepat: ${a} … ${b}`, choices, choices.indexOf(correct), `Bandingkan ${a} dan ${b}.`);
    },

    2: () => {
      const pick = randInt(1, 3);
      if (pick === 1) {
        const n = randInt(100, 999);
        const hundreds = Math.floor(n / 100);
        const choices = shuffle([hundreds, clamp(hundreds - 1, 0, 9), clamp(hundreds + 1, 0, 9), randInt(0, 9)]);
        return mcq(`Bilangan ${n} memiliki angka ratusan ...`, choices.map(String), choices.indexOf(hundreds), `${n} = ${hundreds} ratusan ...`);
      }
      if (pick === 2) {
        const a = randInt(2, 9), b = randInt(2, 9);
        const correct = a * b;
        const choices = shuffle([correct, correct + randInt(1, 5), Math.max(0, correct - randInt(1, 5)), correct + randInt(6, 10)].map(String));
        return mcq(`${a} × ${b} = ...`, choices, choices.indexOf(String(correct)), `${a}×${b}=${correct}.`);
      }
      const b = randInt(2, 9), k = randInt(2, 9);
      const a = b * k;
      return inp(`${a} ÷ ${b} = ...`, k, `${a} dibagi ${b} = ${k}.`);
    },

    3: () => {
      const pick = randInt(1, 4);
      if (pick === 1) {
        const a = randInt(5, 20), b = randInt(2, 9), c = randInt(2, 9);
        return inp(`${a} + ${b} × ${c} = ...`, a + b * c, `Kerjakan ${b}×${c} dulu, lalu tambah ${a}.`);
      }
      if (pick === 2) {
        const s = randInt(2, 10);
        return inp(`Keliling persegi sisi ${s} cm adalah ... cm`, 4 * s, `Keliling = 4×${s} = ${4 * s}.`);
      }
      if (pick === 3) {
        const p = randInt(4, 12), l = randInt(2, 10);
        return inp(`Keliling persegi panjang p=${p} cm dan l=${l} cm adalah ... cm`, 2 * (p + l), `K = 2×(${p}+${l}) = ${2 * (p + l)}.`);
      }
      return mcq(`Mana yang lebih besar?`, ["1/2", "1/4", "1/8", "1/3"], 0, "Penyebut lebih kecil → pecahan lebih besar.");
    },

    4: () => {
      const pick = randInt(1, 4);
      if (pick === 1) {
        const base = randInt(2, 9);
        const a = base * randInt(2, 7);
        const b = base * randInt(2, 7);
        return inp(`FPB dari ${a} dan ${b} adalah ...`, base, `Keduanya kelipatan ${base}.`);
      }
      if (pick === 2) {
        const a = randInt(2, 9), b = randInt(2, 9);
        return inp(`KPK dari ${a} dan ${b} adalah ...`, lcm(a, b), `KPK(${a},${b}) = ${lcm(a, b)}.`);
      }
      if (pick === 3) {
        const options = [{ d: "0.25", p: "25%" }, { d: "0.5", p: "50%" }, { d: "0.75", p: "75%" }];
        const o = options[randInt(0, options.length - 1)];
        return inp(`${o.d.replace(".", ",")} sama dengan ... %`, o.p, `Desimal × 100% = ${o.p}.`);
      }
      return inp(`3/4 sama dengan ... %`, "75%", "3/4 = 0,75 = 75%.");
    },

    5: () => {
      const pick = randInt(1, 4);
      if (pick === 1) {
        const a = randInt(1, 9) * 2;
        const b = randInt(1, 9) * 4;
        const g = gcd(a, b);
        return inp(`Sederhanakan perbandingan ${a}:${b} menjadi ...`, `${a / g}:${b / g}`, `Bagi keduanya dengan FPB=${g}.`);
      }
      if (pick === 2) {
        const scale = [100, 200, 500, 1000][randInt(0, 3)];
        const map = randInt(2, 9);
        return inp(`Skala 1:${scale}. Jarak peta ${map} cm. Jarak sebenarnya ... cm`, map * scale, `${map}×${scale} = ${map * scale} cm.`);
      }
      if (pick === 3) {
        const v = randInt(10, 80), t = randInt(2, 6);
        return inp(`Kecepatan ${v} km/jam selama ${t} jam. Jaraknya ... km`, v * t, `Jarak = v×t = ${v * t}.`);
      }
      const s = randInt(60, 180), v = randInt(20, 90);
      return inp(`Jarak ${s} km, kecepatan ${v} km/jam. Waktu ... jam`, (s / v).toFixed(2), `Waktu = ${s} ÷ ${v} (2 desimal).`);
    },

    6: () => {
      const pick = randInt(1, 4);
      if (pick === 1) {
        const s = randInt(2, 10);
        return inp(`Volume kubus sisi ${s} cm adalah ... cm³`, s * s * s, `V = ${s}³ = ${s * s * s}.`);
      }
      if (pick === 2) {
        const p = randInt(4, 12), l = randInt(2, 10), t = randInt(2, 9);
        return inp(`Volume balok p=${p}, l=${l}, t=${t} adalah ...`, p * l * t, `V = ${p}×${l}×${t} = ${p * l * t}.`);
      }
      if (pick === 3) {
        const total = [20, 24, 40, 48, 60][randInt(0, 4)];
        const part = total / 4;
        return inp(`Jika ${part} dari ${total}, persentasenya ...`, "25%", `(bagian/total)×100% = 25%.`);
      }
      const percent = [10, 20, 25, 50][randInt(0, 3)];
      const base = [40, 80, 120, 200][randInt(0, 3)];
      return inp(`${percent}% dari ${base} adalah ...`, (percent / 100) * base, `${percent}% × ${base} = ${(percent / 100) * base}.`);
    },
  };

  const MAX_TRIES = count * 30;
  let tries = 0;

  while (set.length < count && tries < MAX_TRIES) {
    tries++;
    let q = generators[cls]();

    if (mode === "mix") {
      set.push(q);
      continue;
    }

    if (q.type === mode) {
      set.push(q);
      continue;
    }

    if (mode === "mcq" && q.type === "input") {
      set.push(inputToMcq(q));
      continue;
    }

    if (mode === "input" && q.type === "mcq") {
      set.push(mcqToInput(q));
      continue;
    }
  }

  while (set.length < count) set.push(generators[cls]());
  return set;
}

// ---------------------
// Leaderboard (localStorage)
// ---------------------
const LB_KEY = "math_pinkyland_leaderboard_v1";
function loadLB(){
  try{
    const raw = localStorage.getItem(LB_KEY);
    if(!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  }catch(e){ return []; }
}
function saveLB(arr){
  localStorage.setItem(LB_KEY, JSON.stringify(arr));
}
function addToLB(entry){
  // entry: {name, mode, cls, score, createdAt}
  const list = loadLB();
  list.push(entry);
  // sort desc score, then newest
  list.sort((a,b)=> (b.score - a.score) || (b.createdAt - a.createdAt));
  const top = list.slice(0, 10);
  saveLB(top);
  renderLB();
}
function renderLB(){
  const box = $("leaderboardBox");
  if(!box) return;
  const list = loadLB();
  if(list.length === 0){
    box.innerHTML = `<div class="lb-item"><b>Belum ada skor</b><span>Yuk main! 💗</span></div>`;
    return;
  }
  box.innerHTML = "";
  list.forEach((e, i)=>{
    const row = document.createElement("div");
    row.className = "lb-item";
    row.innerHTML = `
      <b>#${i+1} ${escapeHtml(e.name || "Anon")}</b>
      <span>${escapeHtml(e.mode)} • K${e.cls} • ${e.score}</span>
    `;
    box.appendChild(row);
  });
}
function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, (m)=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  })[m]);
}

// ---------------------
// Global State + Storage
// ---------------------
const STORAGE_KEY = "math_pinkyland_v2";

let state = {
  activeView: "home",
  activeClass: 1,
  activeTab: "explain",
  activeTopicId: null,

  quizSetByClass: { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] },
  qPointer: 0,
  selectedChoice: null,

  scoreByClass: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
  answered: 0,
  correct: 0,
  answeredMap: {},

  setCount: 20,
  setMode: "mix",

  // Exam
  exam: {
    running: false,
    durationSec: 300,
    timeLeft: 300,
    cls: 1,
    set: [],
    index: 0,
    selectedChoice: null,
    answered: {},
    correct: 0
  },

  // Game 60s
  game: {
    running: false,
    durationSec: 60,
    timeLeft: 60,
    cls: 1,
    score: 0,
    streak: 0,
    current: null // {q, ans}
  }
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      state.scoreByClass = parsed.scoreByClass || state.scoreByClass;
      state.answered = parsed.answered || 0;
      state.correct = parsed.correct || 0;
      state.answeredMap = parsed.answeredMap || {};
      soundOn = parsed.soundOn ?? true;

      state.setCount = parsed.setCount || 20;
      state.setMode = parsed.setMode || "mix";
    }
  } catch (e) {}
}

function saveState() {
  const payload = {
    scoreByClass: state.scoreByClass,
    answered: state.answered,
    correct: state.correct,
    answeredMap: state.answeredMap,
    soundOn,
    setCount: state.setCount,
    setMode: state.setMode,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

// ---------------------
// Progress UI
// ---------------------
function totalScore() {
  return Object.values(state.scoreByClass).reduce((a, b) => a + b, 0);
}
function updateProgressUI() {
  $("totalScore").textContent = totalScore();
  $("homeScore").textContent = totalScore();

  $("answeredCount").textContent = state.answered;
  const acc = state.answered === 0 ? 0 : Math.round((state.correct / state.answered) * 100);
  $("accuracy").textContent = `${acc}%`;
  $("homeAcc").textContent = `${acc}%`;

  $("activeClassLabel").textContent = state.activeView === "class" ? `Kelas ${state.activeClass}` : "-";
  $("meterBar").style.width = `${acc}%`;
}

function setMascotLine(text) {
  const el = $("mascotLine");
  if (el) el.textContent = text;
}

// ---------------------
// Navigation
// ---------------------
function setActiveMenuButton(view, cls = null) {
  document.querySelectorAll(".menu-item").forEach((btn) => {
    const isHome = btn.dataset.view === "home" && view === "home";
    const isClass = btn.dataset.view === "class" && view === "class" && Number(btn.dataset.class) === Number(cls);
    btn.classList.toggle("active", isHome || isClass);
  });
}
function showView(name) {
  state.activeView = name;
  $("viewHome").classList.toggle("hidden", name !== "home");
  $("viewClass").classList.toggle("hidden", name !== "class");
}

function setTab(tab) {
  state.activeTab = tab;
  const explain = tab === "explain";
  const topic = tab === "topic";
  const quiz = tab === "quiz";
  const exam = tab === "exam";
  const game = tab === "game";

  $("panelExplain").classList.toggle("hidden", !explain);
  $("panelTopic").classList.toggle("hidden", !topic);
  $("panelQuiz").classList.toggle("hidden", !quiz);
  $("panelExam").classList.toggle("hidden", !exam);
  $("panelGame").classList.toggle("hidden", !game);

  $("tabExplain").classList.toggle("active", explain);
  $("tabQuiz").classList.toggle("active", quiz);
  $("tabExam").classList.toggle("active", exam);
  $("tabGame").classList.toggle("active", game);
}

// ---------------------
// Explain
// ---------------------
function renderTopics(cls, filter = "") {
  const topics = DATA[cls].topics;
  const q = filter.trim().toLowerCase();
  const filtered = q ? topics.filter((t) => (t.title + " " + t.body + " " + t.examples).toLowerCase().includes(q)) : topics;

  const container = $("topicList");
  container.innerHTML = "";

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="topic" style="cursor:default;">
        <h4>Tidak ditemukan 😿</h4>
        <p>Coba: <b>pecahan</b>, <b>volume</b>, <b>skala</b>.</p>
      </div>
    `;
    return;
  }

  filtered.forEach((t, idx) => {
    const el = document.createElement("div");
    el.className = "topic";
    el.innerHTML = `
      <h4>${idx + 1}. ${t.title}</h4>
      <p>Klik untuk buka penjelasan + latihan mini 🎯</p>
      <div class="tagline">✨ Materi per halaman (SPA)</div>
    `;
    el.addEventListener("click", () => openTopic(cls, t.id));
    container.appendChild(el);
  });
}

function openTopic(cls, topicId) {
  state.activeTopicId = topicId;
  const topic = DATA[cls].topics.find((t) => t.id === topicId);
  if (!topic) return;

  $("topicTitle").textContent = topic.title;
  $("topicMeta").textContent = `Kelas ${cls} • Materi`;
  $("topicBody").innerHTML = topic.body;
  $("topicExamples").innerHTML = topic.examples;

  const miniWrap = $("topicMiniQuiz");
  miniWrap.innerHTML = "";
  (topic.mini || []).forEach((m, i) => {
    const box = document.createElement("div");
    box.className = "mini-q";
    box.innerHTML = `
      <strong>${i + 1}. ${m.q}</strong>
      <div class="row">
        <input class="input" data-mini="${i}" type="text" placeholder="Jawab..." />
        <button class="btn ghost" data-checkmini="${i}">Cek</button>
        <span class="result muted" id="miniRes${i}"></span>
      </div>
    `;
    miniWrap.appendChild(box);

    const input = box.querySelector("input[data-mini]");
    const btn = box.querySelector("button[data-checkmini]");
    const res = box.querySelector(`#miniRes${i}`);

    btn.addEventListener("click", () => {
      const ok = isAnswerCorrect(input.value, m.a);
      res.classList.remove("muted");
      res.textContent = ok ? "✅ Benar! Hebat!" : `❌ Belum tepat. Jawaban: ${m.a}`;
      beep(ok ? "good" : "bad");
      if (ok) confettiBurst();
      box.classList.add(ok ? "pop" : "shake");
      setTimeout(() => box.classList.remove("pop", "shake"), 240);
    });
  });

  setMascotLine("Bagus! Baca materi ini pelan-pelan ya 🌸");
  setTab("topic");
}

// ---------------------
// QUIZ (latihan)
// ---------------------
function ensureQuizSet(cls) {
  if (!state.quizSetByClass[cls] || state.quizSetByClass[cls].length === 0) {
    state.quizSetByClass[cls] = genSetForClass(cls, state.setCount, state.setMode);
  }
}
function regenerateSet(cls) {
  state.quizSetByClass[cls] = genSetForClass(cls, state.setCount, state.setMode);
  state.qPointer = 0;
  state.selectedChoice = null;
  renderQuestion();
}
function getCurrentQuestion() {
  const cls = state.activeClass;
  ensureQuizSet(cls);
  return state.quizSetByClass[cls][state.qPointer];
}
function formatCorrectAnswer(q) {
  if (q.type === "mcq") return `${String.fromCharCode(65 + q.ans)}. ${q.choices[q.ans]}`;
  return q.ans;
}
function renderQuestion() {
  const cls = state.activeClass;
  ensureQuizSet(cls);
  const set = state.quizSetByClass[cls];
  const q = getCurrentQuestion();

  $("quizClass").textContent = cls;
  $("qIndex").textContent = state.qPointer + 1;
  $("qTotal").textContent = set.length;
  $("classScore").textContent = state.scoreByClass[cls] || 0;
  $("qText").textContent = q.q;
  $("qType").textContent = q.type === "mcq" ? "Pilihan Ganda" : "Isian";

  $("feedback").className = "feedback";
  $("feedback").textContent = "Pilih/isi jawaban, lalu klik “Cek Jawaban ✅”.";
  state.selectedChoice = null;

  $("mcqArea").classList.toggle("hidden", q.type !== "mcq");
  $("inputArea").classList.toggle("hidden", q.type !== "input");

  $("choices").innerHTML = "";
  if (q.type === "mcq") {
    q.choices.forEach((c, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice";
      btn.textContent = `${String.fromCharCode(65 + i)}. ${c}`;
      btn.addEventListener("click", () => {
        document.querySelectorAll(".choice").forEach((x) => x.classList.remove("selected"));
        btn.classList.add("selected");
        state.selectedChoice = i;
      });
      $("choices").appendChild(btn);
    });
  } else {
    $("answerInput").value = "";
  }

  if (state.answeredMap[q.id]?.answered) {
    const wasCorrect = state.answeredMap[q.id].correct;
    $("feedback").classList.toggle("good", wasCorrect);
    $("feedback").classList.toggle("bad", !wasCorrect);
    $("feedback").textContent = wasCorrect
      ? `✅ Kamu sudah menjawab BENAR. Pembahasan: ${q.exp}`
      : `❌ Kamu sudah menjawab SALAH. Jawaban benar: ${formatCorrectAnswer(q)}. Pembahasan: ${q.exp}`;
  }

  setMascotLine("Semangat! Pilih jawaban yang paling tepat ya 🧸✨");
}
function checkAnswer() {
  const q = getCurrentQuestion();

  if (state.answeredMap[q.id]?.answered) {
    $("feedback").className = "feedback";
    $("feedback").textContent = "Soal ini sudah kamu jawab. Coba soal lain ya 🙂";
    beep("bad");
    return;
  }

  let correct = false;

  if (q.type === "mcq") {
    if (state.selectedChoice === null) {
      $("feedback").className = "feedback bad shake";
      $("feedback").textContent = "Pilih salah satu jawaban dulu ya 🙂";
      setTimeout(() => $("feedback").classList.remove("shake"), 240);
      beep("bad");
      return;
    }
    correct = state.selectedChoice === q.ans;
  } else {
    const user = $("answerInput").value;
    if (!normalizeAnswer(user)) {
      $("feedback").className = "feedback bad shake";
      $("feedback").textContent = "Isi jawaban dulu ya 🙂";
      setTimeout(() => $("feedback").classList.remove("shake"), 240);
      beep("bad");
      return;
    }
    correct = isAnswerCorrect(user, q.ans);
  }

  state.answered += 1;
  if (correct) {
    state.correct += 1;
    state.scoreByClass[state.activeClass] = (state.scoreByClass[state.activeClass] || 0) + 10;
  }
  state.answeredMap[q.id] = { answered: true, correct };

  saveState();
  updateProgressUI();

  $("classScore").textContent = state.scoreByClass[state.activeClass] || 0;
  $("feedback").className = `feedback ${correct ? "good pop" : "bad shake"}`;
  $("feedback").textContent = correct
    ? `✅ BENAR! +10 poin 🎉 Pembahasan: ${q.exp}`
    : `❌ SALAH. Jawaban benar: ${formatCorrectAnswer(q)}. Pembahasan: ${q.exp}`;

  setTimeout(() => $("feedback").classList.remove("pop", "shake"), 260);
  beep(correct ? "good" : "bad");
  if (correct) confettiBurst();
}
function nextQuestion() {
  const cls = state.activeClass;
  ensureQuizSet(cls);
  const total = state.quizSetByClass[cls].length;
  state.qPointer = (state.qPointer + 1) % total;
  renderQuestion();
}
function prevQuestion() {
  const cls = state.activeClass;
  ensureQuizSet(cls);
  const total = state.quizSetByClass[cls].length;
  state.qPointer = (state.qPointer - 1 + total) % total;
  renderQuestion();
}
function shuffleOrder() {
  const cls = state.activeClass;
  ensureQuizSet(cls);
  state.quizSetByClass[cls] = shuffle(state.quizSetByClass[cls]);
  state.qPointer = 0;
  renderQuestion();
  beep("good");
}

// ---------------------
// MODE UJIAN
// ---------------------
let examTimer = null;

function resetExamUI(){
  $("examFeedback").className = "feedback";
  $("examFeedback").textContent = "";
  $("examChoices").innerHTML = "";
  $("examAnswerInput").value = "";
  $("examMcqArea").classList.remove("hidden");
  $("examInputArea").classList.add("hidden");
}

function startExam(){
  // Setup
  state.exam.running = true;
  state.exam.cls = state.activeClass;
  state.exam.durationSec = 300;
  state.exam.timeLeft = 300;

  // Ujian pakai setCount dan mode MIX (lebih adil)
  const total = state.setCount;
  state.exam.set = genSetForClass(state.exam.cls, total, "mix");
  state.exam.index = 0;
  state.exam.selectedChoice = null;
  state.exam.answered = {};
  state.exam.correct = 0;

  $("btnStartExam").disabled = true;
  $("btnEndExam").disabled = false;
  $("btnExamPrev").disabled = false;
  $("btnExamNext").disabled = false;
  $("btnExamSubmit").disabled = false;
  $("btnSaveExamScore").disabled = true;

  $("examTotal").textContent = total;
  $("examCorrect").textContent = "0";
  $("examIndex").textContent = "1";
  $("examTime").textContent = formatMMSS(state.exam.timeLeft);
  $("examResultBox").innerHTML = `<p class="muted">Ujian berjalan... semangat! 💗</p>`;
  resetExamUI();
  renderExamQuestion();

  // Timer
  if(examTimer) clearInterval(examTimer);
  examTimer = setInterval(()=>{
    if(!state.exam.running) return;
    state.exam.timeLeft -= 1;
    $("examTime").textContent = formatMMSS(state.exam.timeLeft);
    if(state.exam.timeLeft <= 0){
      endExam(true);
    }
  }, 1000);

  beep("good");
  setMascotLine("Mode Ujian dimulai! Fokus ya 🧾✨");
}

function getExamQ(){
  return state.exam.set[state.exam.index];
}

function renderExamQuestion(){
  const q = getExamQ();
  $("examIndex").textContent = String(state.exam.index + 1);
  $("examTotal").textContent = String(state.exam.set.length);
  $("examCorrect").textContent = String(state.exam.correct);
  $("examQText").textContent = q.q;

  $("examFeedback").className = "feedback";
  $("examFeedback").textContent = "Jawab sekali saja ya 🙂";
  state.exam.selectedChoice = null;

  $("examChoices").innerHTML = "";
  $("examMcqArea").classList.toggle("hidden", q.type !== "mcq");
  $("examInputArea").classList.toggle("hidden", q.type !== "input");
  $("examAnswerInput").value = "";

  if(q.type === "mcq"){
    q.choices.forEach((c,i)=>{
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice";
      btn.textContent = `${String.fromCharCode(65+i)}. ${c}`;
      btn.addEventListener("click", ()=>{
        $("examChoices").querySelectorAll(".choice").forEach(x=>x.classList.remove("selected"));
        btn.classList.add("selected");
        state.exam.selectedChoice = i;
      });
      $("examChoices").appendChild(btn);
    });
  }

  const answered = state.exam.answered[q.id];
  if(answered){
    $("examFeedback").classList.toggle("good", answered.correct);
    $("examFeedback").classList.toggle("bad", !answered.correct);
    $("examFeedback").textContent = answered.correct
      ? `✅ Sudah dijawab BENAR.`
      : `❌ Sudah dijawab SALAH. Jawaban: ${formatCorrectAnswer(q)}.`;
  }
}

function submitExamAnswer(){
  const q = getExamQ();
  if(state.exam.answered[q.id]){
    $("examFeedback").className = "feedback";
    $("examFeedback").textContent = "Soal ini sudah dijawab 🙂";
    beep("bad");
    return;
  }

  let correct = false;
  if(q.type === "mcq"){
    if(state.exam.selectedChoice === null){
      $("examFeedback").className = "feedback bad shake";
      $("examFeedback").textContent = "Pilih jawaban dulu 🙂";
      setTimeout(()=> $("examFeedback").classList.remove("shake"), 240);
      beep("bad");
      return;
    }
    correct = state.exam.selectedChoice === q.ans;
  } else {
    const user = $("examAnswerInput").value;
    if(!normalizeAnswer(user)){
      $("examFeedback").className = "feedback bad shake";
      $("examFeedback").textContent = "Isi jawaban dulu 🙂";
      setTimeout(()=> $("examFeedback").classList.remove("shake"), 240);
      beep("bad");
      return;
    }
    correct = isAnswerCorrect(user, q.ans);
  }

  state.exam.answered[q.id] = {correct};
  if(correct){
    state.exam.correct += 1;
    $("examCorrect").textContent = String(state.exam.correct);
    confettiBurst();
    beep("good");
    $("examFeedback").className = "feedback good pop";
    $("examFeedback").textContent = "✅ BENAR!";
    setTimeout(()=> $("examFeedback").classList.remove("pop"), 240);
  } else {
    beep("bad");
    $("examFeedback").className = "feedback bad shake";
    $("examFeedback").textContent = `❌ SALAH. Jawaban: ${formatCorrectAnswer(q)}.`;
    setTimeout(()=> $("examFeedback").classList.remove("shake"), 240);
  }
}

function examNext(){
  state.exam.index = (state.exam.index + 1) % state.exam.set.length;
  renderExamQuestion();
}
function examPrev(){
  state.exam.index = (state.exam.index - 1 + state.exam.set.length) % state.exam.set.length;
  renderExamQuestion();
}

function gradeFromScore(score){
  if(score >= 90) return "A (Hebat!)";
  if(score >= 80) return "B (Bagus!)";
  if(score >= 70) return "C (Cukup)";
  if(score >= 60) return "D (Perlu Latihan)";
  return "E (Ayo Semangat!)";
}

function endExam(auto=false){
  if(!state.exam.running) return;
  state.exam.running = false;
  if(examTimer) clearInterval(examTimer);

  const total = state.exam.set.length;
  const correct = state.exam.correct;
  const score = Math.round((correct / total) * 100);
  const grade = gradeFromScore(score);

  $("btnStartExam").disabled = false;
  $("btnEndExam").disabled = true;
  $("btnSaveExamScore").disabled = false;

  $("btnExamSubmit").disabled = true;

  $("examResultBox").innerHTML = `
    <p><b>Nilai Akhir:</b> ${score}</p>
    <p><b>Grade:</b> ${grade}</p>
    <p><b>Benar:</b> ${correct} / ${total}</p>
    <p><b>Sisa Waktu:</b> ${formatMMSS(state.exam.timeLeft)}</p>
    <p class="muted">${auto ? "⏰ Waktu habis, ujian otomatis selesai." : "✅ Ujian selesai."}</p>
  `;

  beep("good");
  setMascotLine("Ujian selesai! Lihat nilainya ya 🎓💗");
}

function saveExamToLB(){
  const name = ($("examName").value || "Anon").trim().slice(0,18) || "Anon";
  const total = state.exam.set.length || state.setCount;
  const correct = state.exam.correct || 0;
  const score = Math.round((correct / total) * 100);
  addToLB({name, mode:"EXAM", cls: state.activeClass, score, createdAt: Date.now()});
  $("btnSaveExamScore").disabled = true;
  beep("good");
}

// ---------------------
// GAME 60s
// ---------------------
let gameTimer = null;

function genQuickGameQ(cls){
  // Fokus operasi cepat (tambah/kurang/kali/bagi sederhana) sesuai kelas
  // output: {q, ans}
  if(cls <= 2){
    const type = randInt(1,3);
    if(type===1){ const a=randInt(1,20), b=randInt(1,20); return {q:`${a} + ${b} = ?`, ans:String(a+b)}; }
    if(type===2){ const a=randInt(5,30), b=randInt(1,a-1); return {q:`${a} − ${b} = ?`, ans:String(a-b)}; }
    const a=randInt(2,9), b=randInt(2,9); return {q:`${a} × ${b} = ?`, ans:String(a*b)};
  }
  if(cls <= 4){
    const type = randInt(1,4);
    if(type===1){ const a=randInt(10,40), b=randInt(2,9), c=randInt(2,9); return {q:`${a} + ${b} × ${c} = ?`, ans:String(a + b*c)}; }
    if(type===2){ const a=randInt(2,9), b=randInt(2,9); return {q:`KPK(${a},${b}) = ?`, ans:String(lcm(a,b))}; }
    if(type===3){ const base=randInt(2,9), a=base*randInt(2,7), b=base*randInt(2,7); return {q:`FPB(${a},${b}) = ?`, ans:String(base)}; }
    const d = ["0.25","0.5","0.75"][randInt(0,2)];
    const p = d==="0.25"?"25%":d==="0.5"?"50%":"75%";
    return {q:`${d.replace(".",",")} = ...%`, ans:p};
  }
  // kelas 5-6
  const type = randInt(1,4);
  if(type===1){ const s=[100,200,500,1000][randInt(0,3)], m=randInt(1,9); return {q:`Skala 1:${s}, peta ${m} cm → ... cm`, ans:String(m*s)}; }
  if(type===2){ const v=randInt(10,90), t=randInt(1,5); return {q:`${v} km/jam × ${t} jam = ? km`, ans:String(v*t)}; }
  if(type===3){ const p=randInt(4,12), l=randInt(2,10), tt=randInt(2,9); return {q:`Volume balok ${p}×${l}×${tt} = ?`, ans:String(p*l*tt)}; }
  const percent=[10,20,25,50][randInt(0,3)], base=[40,80,120,200][randInt(0,3)];
  return {q:`${percent}% dari ${base} = ?`, ans:String((percent/100)*base)};
}

function startGame(){
  state.game.running = true;
  state.game.cls = state.activeClass;
  state.game.timeLeft = state.game.durationSec;
  state.game.score = 0;
  state.game.streak = 0;
  state.game.current = genQuickGameQ(state.game.cls);

  $("gameTime").textContent = String(state.game.timeLeft);
  $("gameScore").textContent = "0";
  $("gameStreak").textContent = "0";
  $("gameQText").textContent = state.game.current.q;
  $("gameFeedback").className = "feedback";
  $("gameFeedback").textContent = "Jawab cepat ya! (Enter juga bisa) ⚡";
  $("gameAnswer").disabled = false;
  $("btnGameSubmit").disabled = false;
  $("btnStartGame").disabled = true;
  $("btnStopGame").disabled = false;
  $("btnSaveGameScore").disabled = true;
  $("gameResultBox").innerHTML = `<p class="muted">Game berjalan... 🔥</p>`;
  $("gameAnswer").value = "";
  $("gameAnswer").focus();

  if(gameTimer) clearInterval(gameTimer);
  gameTimer = setInterval(()=>{
    if(!state.game.running) return;
    state.game.timeLeft -= 1;
    $("gameTime").textContent = String(state.game.timeLeft);
    if(state.game.timeLeft <= 0){
      stopGame(true);
    }
  }, 1000);

  beep("good");
  setMascotLine("Game dimulai! Tebak cepat 60 detik! 🎮💗");
}

function submitGame(){
  if(!state.game.running) return;
  const user = $("gameAnswer").value;
  if(!normalizeAnswer(user)){
    $("gameFeedback").className = "feedback bad shake";
    $("gameFeedback").textContent = "Isi jawaban dulu 🙂";
    setTimeout(()=> $("gameFeedback").classList.remove("shake"), 240);
    beep("bad");
    return;
  }

  const ok = isAnswerCorrect(user, state.game.current.ans);
  if(ok){
    state.game.streak += 1;
    const bonus = state.game.streak >= 5 ? 2 : 0; // bonus streak
    state.game.score += (5 + bonus); // poin per benar
    $("gameFeedback").className = "feedback good pop";
    $("gameFeedback").textContent = bonus ? `✅ BENAR! +${5+bonus} (BONUS STREAK!)` : `✅ BENAR! +5`;
    confettiBurst();
    beep("good");
  } else {
    state.game.streak = 0;
    $("gameFeedback").className = "feedback bad shake";
    $("gameFeedback").textContent = `❌ SALAH. Jawaban: ${state.game.current.ans}`;
    beep("bad");
  }

  $("gameScore").textContent = String(state.game.score);
  $("gameStreak").textContent = String(state.game.streak);

  // next question
  state.game.current = genQuickGameQ(state.game.cls);
  $("gameQText").textContent = state.game.current.q;
  $("gameAnswer").value = "";
  $("gameAnswer").focus();
  setTimeout(()=> $("gameFeedback").classList.remove("pop","shake"), 260);
}

function stopGame(auto=false){
  if(!state.game.running) return;
  state.game.running = false;
  if(gameTimer) clearInterval(gameTimer);

  $("gameAnswer").disabled = true;
  $("btnGameSubmit").disabled = true;
  $("btnStartGame").disabled = false;
  $("btnStopGame").disabled = true;
  $("btnSaveGameScore").disabled = false;

  $("gameResultBox").innerHTML = `
    <p><b>Skor Game:</b> ${state.game.score}</p>
    <p><b>Streak Maks (akhir):</b> ${state.game.streak}</p>
    <p class="muted">${auto ? "⏰ Waktu habis! Game selesai." : "✅ Game dihentikan."}</p>
  `;

  beep("good");
  setMascotLine("Game selesai! Mau coba lagi? 🎮✨");
}

function saveGameToLB(){
  const name = ($("gameName").value || "Anon").trim().slice(0,18) || "Anon";
  addToLB({name, mode:"GAME", cls: state.activeClass, score: state.game.score, createdAt: Date.now()});
  $("btnSaveGameScore").disabled = true;
  beep("good");
}

// ---------------------
// CLASS open
// ---------------------
function openClass(cls) {
  state.activeClass = cls;
  showView("class");
  setActiveMenuButton("class", cls);

  $("classTitle").textContent = `Kelas ${cls}`;
  $("classSubtitle").textContent = DATA[cls].subtitle;

  $("searchTopic").value = "";
  renderTopics(cls, "");

  ensureQuizSet(cls);
  state.qPointer = 0;

  setTab("explain");
  updateProgressUI();
  setMascotLine("Pilih materi atau latihan ya! 🌷");
}

// ---------------------
// Reset
// ---------------------
function resetAll() {
  state.scoreByClass = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  state.answered = 0;
  state.correct = 0;
  state.answeredMap = {};
  state.quizSetByClass = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  state.qPointer = 0;
  state.selectedChoice = null;

  // stop exam/game if running
  if(state.exam.running) endExam(false);
  if(state.game.running) stopGame(false);

  saveState();
  updateProgressUI();
  renderLB();

  setMascotLine("Semua direset. Mulai lagi ya! 🌸");
  beep("good");
}

// ---------------------
// Modal Tips + Exam rules
// ---------------------
function openTips(){ $("modalTips").classList.remove("hidden"); }
function closeTips(){ $("modalTips").classList.add("hidden"); }

function openExamRules(){ $("modalExamRules").classList.remove("hidden"); }
function closeExamRules(){ $("modalExamRules").classList.add("hidden"); }

// ---------------------
// Wire up
// ---------------------
document.addEventListener("DOMContentLoaded", () => {
  $("year").textContent = new Date().getFullYear();

  loadState();
  renderLB();
  updateProgressUI();

  $("selectCount").value = String(state.setCount);
  $("selectMode").value = state.setMode;

  $("btnSound").textContent = `🔊 Suara: ${soundOn ? "ON" : "OFF"}`;
  $("btnSound").addEventListener("click", () => {
    soundOn = !soundOn;
    $("btnSound").textContent = `🔊 Suara: ${soundOn ? "ON" : "OFF"}`;
    saveState();
    beep(soundOn ? "good" : "bad");
  });

  // menu
  document.querySelectorAll(".menu-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const view = btn.dataset.view;
      if (view === "home") {
        showView("home");
        setActiveMenuButton("home");
        updateProgressUI();
        setMascotLine("Ayo pilih kelas ya! 🌸");
        return;
      }
      openClass(Number(btn.dataset.class));
    });
  });

  $("btnHome").addEventListener("click", () => {
    showView("home");
    setActiveMenuButton("home");
    updateProgressUI();
    setMascotLine("Selamat datang lagi! 🥳");
  });

  $("btnStartQuick").addEventListener("click", () => {
    openClass(1);
    setTab("quiz");
    regenerateSet(1);
    renderQuestion();
    beep("good");
  });

  $("btnReset").addEventListener("click", resetAll);

  // Tabs
  $("tabExplain").addEventListener("click", () => setTab("explain"));
  $("tabQuiz").addEventListener("click", () => { setTab("quiz"); renderQuestion(); });
  $("tabExam").addEventListener("click", () => setTab("exam"));
  $("tabGame").addEventListener("click", () => setTab("game"));

  // Search topics
  $("searchTopic").addEventListener("input", (e) => renderTopics(state.activeClass, e.target.value));

  // Topic nav
  $("btnBackToTopics").addEventListener("click", () => setTab("explain"));
  $("btnGoQuiz").addEventListener("click", () => { setTab("quiz"); renderQuestion(); });

  // Quiz actions
  $("btnCheck").addEventListener("click", checkAnswer);
  $("btnNext").addEventListener("click", nextQuestion);
  $("btnPrev").addEventListener("click", prevQuestion);
  $("btnShuffle").addEventListener("click", shuffleOrder);
  $("btnNewSet").addEventListener("click", () => {
    regenerateSet(state.activeClass);
    $("feedback").className = "feedback pop";
    $("feedback").textContent = "Set soal baru dibuat. Ayo mulai! ✨";
    setTimeout(() => $("feedback").classList.remove("pop"), 240);
    beep("good");
  });

  // Settings
  $("selectCount").addEventListener("change", (e) => {
    state.setCount = Number(e.target.value);
    saveState();
    setMascotLine(`Jumlah soal: ${state.setCount} 📝`);
  });
  $("selectMode").addEventListener("change", (e) => {
    state.setMode = e.target.value;
    saveState();
    setMascotLine(`Mode soal: ${state.setMode} 🎯`);
  });
  $("btnGenerateSet").addEventListener("click", () => {
    if (state.activeView !== "class") openClass(1);
    regenerateSet(state.activeClass);
    setTab("quiz");
    beep("good");
  });

  // Tips modal
  $("btnThemeHint").addEventListener("click", openTips);
  $("btnCloseTips").addEventListener("click", closeTips);
  $("btnOkTips").addEventListener("click", closeTips);
  $("modalTips").addEventListener("click", (e) => { if (e.target.id === "modalTips") closeTips(); });

  // Exam rules modal
  $("btnExamRules").addEventListener("click", openExamRules);
  $("btnCloseExamRules").addEventListener("click", closeExamRules);
  $("btnOkExamRules").addEventListener("click", closeExamRules);
  $("modalExamRules").addEventListener("click", (e) => { if (e.target.id === "modalExamRules") closeExamRules(); });

  // Exam actions
  $("btnStartExam").addEventListener("click", startExam);
  $("btnEndExam").addEventListener("click", ()=> endExam(false));
  $("btnExamSubmit").addEventListener("click", submitExamAnswer);
  $("btnExamNext").addEventListener("click", examNext);
  $("btnExamPrev").addEventListener("click", examPrev);
  $("btnSaveExamScore").addEventListener("click", saveExamToLB);

  // Game actions
  $("btnStartGame").addEventListener("click", startGame);
  $("btnStopGame").addEventListener("click", ()=> stopGame(false));
  $("btnGameSubmit").addEventListener("click", submitGame);
  $("gameAnswer").addEventListener("keydown", (e)=>{
    if(e.key === "Enter") submitGame();
  });
  $("btnSaveGameScore").addEventListener("click", saveGameToLB);

  // Leaderboard clear
  $("btnClearLB").addEventListener("click", ()=>{
    saveLB([]);
    renderLB();
    beep("good");
  });

  // Default
  showView("home");
  setActiveMenuButton("home");
  setMascotLine("Ayo pilih kelas dulu ya! 🌸");

  setTimeout(() => {
    if (state.answered === 0) openTips();
  }, 800);
});
