import { MOVES, GENERAL_POINTS } from './moves.js';
import { createStage, samplePose, captionFor, blendPose, idlePose } from './model.js';
import { PRESETS } from './presets.js';

const $ = (id) => document.getElementById(id);
const stageEl = $('stage');
const stage = createStage(stageEl);
const byId = Object.fromEntries(MOVES.map((m) => [m.id, m]));

// ================= 共通表示 =================
let mode = 'learn';
let shown = null; // 今HUDに出しているムーブ
let lastKey = -1, flash = 0;

function showMove(m) {
  if (shown === m) return;
  shown = m;
  lastKey = -1;
  $('moveGroup').textContent = m ? m.group : '';
  $('moveName').textContent = m ? m.name : '待機中';
  $('moveEn').textContent = m ? m.en : '';
  $('summary').textContent = m ? m.summary : '';
  $('points').innerHTML = m ? m.points.map((p) => `<li>${p}</li>`).join('') : '';
  const ts = $('ts');
  if (m) {
    const [mm, ss] = m.time.split(':').map(Number);
    ts.textContent = `▶ 動画 ${m.time}〜`;
    ts.href = `https://youtu.be/FYvDc13txdw?t=${mm * 60 + ss}`;
  } else ts.textContent = '';
  stage.setHighlight(m && m.parts, $('hl').checked);
  const n = m ? Math.max(2, Math.ceil(m.cycle)) : 0;
  $('beats').innerHTML = '<i></i>'.repeat(n);
}
$('hl').onchange = () => stage.setHighlight(shown && shown.parts, $('hl').checked);

function setCam(name) {
  stage.setCam(name);
  document.querySelectorAll('[data-cam]').forEach((b) => b.classList.toggle('on', b.dataset.cam === name));
}
document.querySelectorAll('[data-cam]').forEach((b) => (b.onclick = () => setCam(b.dataset.cam)));

// ムーブをある拍位置で描画し、キャプション・カウント・光を更新
function drawMove(m, beat, prev) {
  const { pose, keyIndex } = samplePose(m, beat);
  let p = pose;
  if (prev && prev.t < 1) p = blendPose(samplePose(prev.move, prev.beat).pose, pose, 0.5 - 0.5 * Math.cos(Math.PI * prev.t));
  stage.applyPose(p, m.stance || 0.12);
  if (keyIndex !== lastKey) {
    lastKey = keyIndex;
    const hit = m._keys[keyIndex].ease === 'hit';
    if (hit) flash = 1;
    $('caption').textContent = captionFor(m, keyIndex);
    $('caption').classList.toggle('hit', hit);
  }
  const b = Math.floor(beat), frac = beat - b;
  $('count').textContent = frac < 0.5 ? String((((b % 8) + 8) % 8) + 1) : '&';
  const tau = ((beat % m.cycle) + m.cycle) % m.cycle;
  [...$('beats').children].forEach((d, i) => d.classList.toggle('on', i === Math.floor(tau)));
}

// ================= 解説モード =================
const learn = { cur: MOVES[0], beats: 0, playing: true, speed: 1, lastBeat: -1, autoCycles: 0 };
const list = $('moveList');
let lastGroup = '';
for (const m of MOVES) {
  if (m.group !== lastGroup) {
    const h = document.createElement('h3');
    h.textContent = m.group;
    list.append(h);
    lastGroup = m.group;
  }
  const b = document.createElement('button');
  b.dataset.id = m.id;
  b.innerHTML = `${m.name}<small>${m.en}</small>`;
  b.onclick = () => selectLearn(m.id, true);
  list.append(b);
}
$('general').innerHTML = GENERAL_POINTS.map((g) => `<li><b>${g.t}</b>${g.s}</li>`).join('');
document.querySelectorAll('[data-go]').forEach((b) => (b.onclick = () => { selectLearn(b.dataset.go, true); stageEl.scrollIntoView({ behavior: 'smooth', block: 'center' }); }));

function selectLearn(id, user) {
  const m = byId[id] || MOVES[0];
  Object.assign(learn, { cur: m, beats: 0, lastBeat: -1, autoCycles: 0 });
  document.querySelectorAll('#moveList button').forEach((b) => b.classList.toggle('on', b.dataset.id === m.id));
  shown = null;
  showMove(m);
  setCam(m.camera);
  updateBpm();
  if (user) {
    history.replaceState(null, '', '#' + m.id);
    list.querySelector(`[data-id="${m.id}"]`)?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }
}
function updateBpm() { $('bpm').textContent = `${Math.round(learn.cur.bpm * learn.speed)} BPM`; }
$('speed').oninput = (e) => { learn.speed = +e.target.value; updateBpm(); };
$('play').onclick = () => { learn.playing = !learn.playing; $('play').textContent = learn.playing ? '❚❚ 一時停止' : '▶ 再生'; };

let actx = null;
function click(accent) {
  if (!$('click').checked) return;
  actx ||= new AudioContext();
  const o = actx.createOscillator(), g = actx.createGain();
  o.frequency.value = accent ? 1500 : 1000;
  g.gain.setValueAtTime(0.25, actx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.06);
  o.connect(g).connect(actx.destination);
  o.start(); o.stop(actx.currentTime + 0.07);
}

function tickLearn(dt) {
  const m = learn.cur;
  if (learn.playing) learn.beats += dt * (m.bpm * learn.speed) / 60;
  const bi = Math.floor(learn.beats);
  if (bi !== learn.lastBeat) {
    learn.lastBeat = bi;
    click(bi % m.cycle === 0);
    if ($('auto').checked && bi > 0 && bi % Math.ceil(m.cycle) === 0 && ++learn.autoCycles >= Math.max(2, Math.ceil(8 / m.cycle))) {
      selectLearn(MOVES[(MOVES.indexOf(m) + 1) % MOVES.length].id, true);
      return;
    }
  }
  drawMove(m, learn.beats);
}

// ================= 練習モード =================
const audio = new Audio();
audio.preservesPitch = true;
let song = null;   // { title, beats[], sections[{s,e,lv,move}] }
let rate = 1;
const RATES = [0.5, 0.6, 0.75, 0.85, 1, 1.1, 1.25];
const BASIC = ['bodydown', 'bodyup', 'bird', 'swan', 'bat', 'panther', 'duck', 'shrimp', 'alligator'];

$('rates').innerHTML = RATES.map((r) => `<button data-rate="${r}" class="${r === 1 ? 'on' : ''}">${r}x</button>`).join('');
$('rates').onclick = (e) => {
  const r = e.target.dataset?.rate;
  if (!r) return;
  rate = +r;
  audio.playbackRate = rate;
  document.querySelectorAll('[data-rate]').forEach((b) => b.classList.toggle('on', +b.dataset.rate === rate));
  updateRateInfo();
};
function songBpm() {
  if (!song) return 0;
  const b = song.beats, n = b.length;
  return 60 / ((b[n - 1] - b[0]) / (n - 1));
}
function updateRateInfo() {
  $('rateInfo').textContent = song ? `元の約 ${Math.round(songBpm())} BPM → いま約 ${Math.round(songBpm() * rate)} BPM（音程はそのまま）` : '音程を変えずに速さだけ変えます';
}
updateRateInfo();

// --- 音源の読み込み ---
async function loadFile(file) {
  if (!file) return;
  $('songStatus').textContent = '読み込み中…';
  audio.pause();
  if (audio.src) URL.revokeObjectURL(audio.src);
  audio.src = URL.createObjectURL(file);
  audio.playbackRate = rate;
  await new Promise((ok, ng) => { audio.onloadedmetadata = ok; audio.onerror = () => ng(new Error('この形式は再生できませんでした')); }).catch((e) => { $('songStatus').textContent = e.message; throw e; });
  const preset = PRESETS.find((p) => Math.abs(p.duration - audio.duration) < 2);
  let data;
  if (preset) {
    data = { title: preset.title, beats: preset.beats, sections: preset.sections.map((s) => ({ ...s })), preset: true };
  } else {
    $('songStatus').textContent = '拍を解析中…（数秒かかります）';
    data = await analyzeAudio(await file.arrayBuffer());
    data.title = file.name;
  }
  song = data;
  assignMoves();
  $('songStatus').innerHTML = `<b>${escapeHtml(song.title)}</b><br>${song.beats.length}拍・${song.sections.length}セクション${song.preset ? '（解析済みデータを使用）' : '（自動解析）'}`;
  $('pPlay').disabled = false;
  $('seek').disabled = false;
  $('seek').max = audio.duration;
  updateRateInfo();
}
const escapeHtml = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
$('file').onchange = (e) => loadFile(e.target.files[0]).catch(() => {});
const drop = $('drop');
drop.ondragover = (e) => { e.preventDefault(); drop.classList.add('over'); };
drop.ondragleave = () => drop.classList.remove('over');
drop.ondrop = (e) => { e.preventDefault(); drop.classList.remove('over'); loadFile(e.dataTransfer.files[0]).catch(() => {}); };

// --- ブラウザ内の簡易ビート解析（プリセットに無い曲用） ---
async function analyzeAudio(ab) {
  const ac = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, 1, 44100);
  const buf = await ac.decodeAudioData(ab);
  const sr = buf.sampleRate, ch = buf.getChannelData(0), ch2 = buf.numberOfChannels > 1 ? buf.getChannelData(1) : null;
  const hop = Math.round(sr * 0.01), n = Math.floor(ch.length / hop);
  const en = new Float32Array(n), on = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (let j = i * hop, e = Math.min(ch.length, j + hop * 2); j < e; j++) { const v = ch2 ? (ch[j] + ch2[j]) / 2 : ch[j]; s += v * v; }
    en[i] = Math.log(1 + 1000 * s / (hop * 2));
    on[i] = i ? Math.max(0, en[i] - en[i - 1]) : 0;
  }
  // テンポ: 自己相関（80〜160BPM、115付近をやや優先）
  let best = 0, bestLag = 50;
  for (let lag = Math.round(6000 / 160); lag <= Math.round(6000 / 80); lag++) {
    let s = 0;
    for (let i = 0; i + lag < n; i++) s += on[i] * on[i + lag];
    const bpm = 6000 / lag, w = Math.exp(-0.5 * Math.pow(Math.log2(bpm / 115) / 0.6, 2));
    if (s * w > best) { best = s * w; bestLag = lag; }
  }
  // 位相
  let bestPh = 0, bestS = -1;
  for (let ph = 0; ph < bestLag; ph++) {
    let s = 0;
    for (let i = ph; i < n; i += bestLag) s += on[i] + 0.5 * (on[i - 1] || 0) + 0.5 * (on[i + 1] || 0);
    if (s > bestS) { bestS = s; bestPh = ph; }
  }
  const beats = [];
  for (let i = bestPh; i < n; i += bestLag) beats.push(+(i * hop / sr).toFixed(3));
  // 8小節(32拍)ごとにセクション
  const sections = [];
  for (let s = 0; s < beats.length - 4; s += 32) sections.push({ s, e: Math.min(beats.length - 1, s + 32) });
  const lv = sections.map(({ s, e }) => { let a = 0, c = 0; for (let i = Math.floor(beats[s] * 100); i < Math.floor(beats[e] * 100) && i < n; i++) { a += en[i]; c++; } return c ? a / c : 0; });
  const mx = Math.max(...lv) || 1;
  sections.forEach((x, i) => (x.lv = +(lv[i] / mx).toFixed(2)));
  return { beats, sections, preset: false };
}

// --- 動きの割り当て ---
function assignMoves() {
  if (!song) return;
  const pool = document.querySelector('input[name=pool]:checked').value === 'all' ? MOVES.map((m) => m.id) : BASIC;
  let prev = null;
  for (const sec of song.sections) {
    let id;
    do id = pool[Math.floor(Math.random() * pool.length)]; while (id === prev && pool.length > 1);
    sec.move = id;
    prev = id;
  }
  renderTimeline();
}
$('shuffle').onclick = assignMoves;
document.querySelectorAll('input[name=pool]').forEach((r) => (r.onchange = assignMoves));

const HUE = { bodydown: 200, bodyup: 220, bird: 40, swan: 330, bat: 280, panther: 300, duck: 150, shrimp: 170, alligator: 120 };
function hueOf(id) { for (const k in HUE) if (id.startsWith(k)) return HUE[k]; return 0; }
function renderTimeline() {
  const tl = $('timeline');
  const total = song.beats[song.beats.length - 1];
  tl.innerHTML = song.sections.map((s, i) => {
    const a = song.beats[s.s], b = song.beats[Math.min(s.e, song.beats.length - 1)];
    const m = byId[s.move];
    return `<button data-sec="${i}" style="flex:${(b - a) / total};--h:${hueOf(s.move)}" title="${fmt(a)} ${m.name}"><span>${m.name}</span></button>`;
  }).join('');
}
$('timeline').onclick = (e) => {
  const btn = e.target.closest('[data-sec]');
  if (!btn || !song) return;
  const s = song.sections[+btn.dataset.sec];
  audio.currentTime = Math.max(0, song.beats[s.s] - 0.05);
};

// --- 再生操作 ---
const fmt = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
$('pPlay').onclick = () => (audio.paused ? audio.play() : audio.pause());
audio.onplay = () => ($('pPlay').textContent = '❚❚ 一時停止');
audio.onpause = () => ($('pPlay').textContent = '▶ 再生');
let seeking = false;
$('seek').oninput = (e) => { seeking = true; $('time').textContent = `${fmt(+e.target.value)} / ${fmt(audio.duration || 0)}`; };
$('seek').onchange = (e) => { audio.currentTime = +e.target.value; seeking = false; };
document.addEventListener('keydown', (e) => {
  if (mode !== 'practice' || !song || e.target.tagName === 'INPUT' && e.target.type !== 'range') return;
  if (e.code === 'Space') { e.preventDefault(); $('pPlay').click(); }
});

// 時刻 → 曲の拍位置（小数）
function beatAt(t) {
  const b = song.beats, n = b.length;
  if (t <= b[0]) return (t - b[0]) / (b[1] - b[0]);
  if (t >= b[n - 1]) return n - 1 + (t - b[n - 1]) / (b[n - 1] - b[n - 2]);
  let lo = 0, hi = n - 1;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (b[mid] <= t) lo = mid; else hi = mid; }
  return lo + (t - b[lo]) / (b[hi] - b[lo]);
}
function sectionIndexAt(beat) {
  const ss = song.sections;
  for (let i = ss.length - 1; i >= 0; i--) if (beat >= ss[i].s) return i;
  return -1;
}

let lastSec = -2;
function tickPractice() {
  if (!song) {
    showMove(null);
    stage.applyPose(idlePose());
    $('caption').textContent = '左の「音源を選ぶ」から曲を読み込んでね';
    $('count').textContent = '';
    return;
  }
  const t = audio.currentTime;
  if (!seeking) {
    $('seek').value = t;
    $('time').textContent = `${fmt(t)} / ${fmt(audio.duration || 0)}`;
  }
  const beat = beatAt(t);
  let si = sectionIndexAt(beat);
  // セクションループ
  if ($('loopSec').checked && lastSec >= 0 && !audio.paused) {
    const cur = song.sections[lastSec];
    if (beat >= cur.e - 0.02 || beat < cur.s - 1) { audio.currentTime = song.beats[cur.s] - 0.02; si = lastSec; }
  }
  if (si < 0 || si >= song.sections.length) {
    showMove(null);
    stage.applyPose(idlePose());
    $('caption').textContent = si < 0 ? 'もうすぐ始まるよ' : 'おつかれさま！';
    $('count').textContent = '';
    $('nextBox').innerHTML = si < 0 && song.sections[0] ? nextHtml(song.sections[0], song.sections[0].s - beat) : '';
    lastSec = si;
    return;
  }
  const sec = song.sections[si];
  const m = byId[sec.move];
  if (si !== lastSec) {
    lastSec = si;
    showMove(m);
    setCam(m.camera);
    document.querySelectorAll('#timeline [data-sec]').forEach((b) => b.classList.toggle('on', +b.dataset.sec === si));
  }
  const local = beat - sec.s;
  // セクション頭の1拍は前の動きからなめらかにつなぐ
  const prevSec = song.sections[si - 1];
  const prev = prevSec && local < 1 ? { move: byId[prevSec.move], beat: beat - prevSec.s, t: local } : null;
  drawMove(m, local, prev);
  // 次の動きの予告
  const nextSec = song.sections[si + 1];
  const remain = sec.e - beat;
  $('nextBox').innerHTML = nextSec && !$('loopSec').checked ? nextHtml(nextSec, remain) : '';
}
function nextHtml(sec, remain) {
  const m = byId[sec.move];
  const soon = remain <= 4;
  return `<div class="nx ${soon ? 'soon' : ''}"><small>つぎ</small><b>${m.name}</b>${soon ? `<span class="cd">${Math.max(1, Math.ceil(remain))}</span>` : ''}</div>`;
}

// ================= モード切替 =================
function setMode(next) {
  mode = next;
  document.body.dataset.mode = mode;
  document.querySelectorAll('.tabs [data-mode]').forEach((b) => b.classList.toggle('on', b.dataset.mode === mode));
  shown = null;
  lastSec = -2;
  if (mode === 'learn') { audio.pause(); selectLearn(learn.cur.id, false); }
  else { setCam('front'); }
}
document.querySelectorAll('.tabs [data-mode]').forEach((b) => (b.onclick = () => setMode(b.dataset.mode)));

// ================= ループ =================
let lastT = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000);
  lastT = now;
  if (mode === 'learn') tickLearn(dt); else tickPractice();
  flash = Math.max(0, flash - dt * 4);
  stage.updateGlow($('hl').checked ? flash : 0);
  stage.render();
  requestAnimationFrame(frame);
}

const initial = location.hash.slice(1);
selectLearn(byId[initial] ? initial : 'bird', false);
// ?freeze=<拍> でその拍の姿勢に固定（確認用）
const freeze = new URLSearchParams(location.search).get('freeze');
if (freeze !== null) { learn.beats = +freeze; learn.playing = false; $('play').textContent = '▶ 再生'; }
if (new URLSearchParams(location.search).get('mode') === 'practice') setMode('practice');
requestAnimationFrame(frame);
