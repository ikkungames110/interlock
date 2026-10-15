import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { MOVES, DEFAULT_POSE, GENERAL_POINTS } from './moves.js';

// ---------- シーン ----------
const stage = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
stage.prepend(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, 1, 0.05, 50);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.0, 0);
controls.enableDamping = true;
controls.minDistance = 1.2;
controls.maxDistance = 7;

scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x3a2f28, 1.4));
const key = new THREE.DirectionalLight(0xffffff, 2.2);
key.position.set(2.5, 4, 3);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
Object.assign(key.shadow.camera, { left: -2, right: 2, top: 2.5, bottom: -0.5 });
scene.add(key);
const rim = new THREE.DirectionalLight(0x88aaff, 1.0);
rim.position.set(-3, 2.5, -3);
scene.add(rim);

const floor = new THREE.Mesh(new THREE.CircleGeometry(2.4, 64), new THREE.MeshStandardMaterial({ color: 0x23262f, roughness: 0.9 }));
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);
const grid = new THREE.PolarGridHelper(2.4, 8, 6, 64, 0x3a4050, 0x30353f);
grid.position.y = 0.002;
scene.add(grid);
// 前方向マーカー
const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.14, 3), new THREE.MeshBasicMaterial({ color: 0x555d70 }));
arrow.rotation.x = Math.PI / 2;
arrow.position.set(0, 0.01, 0.55);
scene.add(arrow);

// ---------- 人体モデル ----------
const COLORS = { skin: 0xe0b48f, shirt: 0xd8433b, pants: 0x262b3a, shoe: 0xf1f1f1, hat: 0x1a1a1a };
const PART_COLOR = { primary: new THREE.Color(0xff8a3d), linked: new THREE.Color(0x3fc3ff) };
const parts = {}; // name -> mesh[]

function mesh(geo, color, part) {
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 0.65 }));
  m.castShadow = true;
  m.userData.base = new THREE.Color(color);
  (parts[part] ||= []).push(m);
  return m;
}
const ellipsoid = (rx, ry, rz, color, part) => {
  const m = mesh(new THREE.SphereGeometry(1, 28, 20), color, part);
  m.scale.set(rx, ry, rz);
  return m;
};
const capsule = (r, len, color, part) => mesh(new THREE.CapsuleGeometry(r, len, 8, 16), color, part);

const body = new THREE.Group();
scene.add(body);

const pelvis = new THREE.Group();
body.add(pelvis);
pelvis.rotation.order = 'YXZ';
pelvis.add(ellipsoid(0.165, 0.11, 0.115, COLORS.pants, 'pelvis'));
const belt = mesh(new THREE.TorusGeometry(0.15, 0.012, 8, 32), 0x111111, 'pelvis');
belt.rotation.x = Math.PI / 2; belt.scale.set(1.05, 0.75, 1); belt.position.y = 0.075;
pelvis.add(belt);

const spine = new THREE.Group();
spine.position.y = 0.07;
pelvis.add(spine);
// お腹: spine原点から chest原点までを伸縮するカプセルで繋ぐ
const abdomen = capsule(0.125, 0.12, COLORS.shirt, 'abdomen');
abdomen.scale.z = 0.8;
const abdomenPivot = new THREE.Group();
abdomenPivot.add(abdomen);
spine.add(abdomenPivot);

const chest = new THREE.Group();
spine.add(chest);
const CHEST_BASE_Y = 0.2;
const ribs = ellipsoid(0.175, 0.17, 0.115, COLORS.shirt, 'chest');
ribs.position.y = 0.14;
chest.add(ribs);
const pecs = ellipsoid(0.15, 0.08, 0.06, COLORS.shirt, 'chest');
pecs.position.set(0, 0.19, 0.07);
chest.add(pecs);

// 首と頭
const NECK_BASE = new THREE.Vector3(0, 0.29, 0);
const neckPivot = new THREE.Group();
const neckMesh = capsule(0.05, 0.06, COLORS.skin, 'neck');
neckPivot.add(neckMesh);
chest.add(neckPivot);
const head = new THREE.Group();
head.rotation.order = 'YXZ';
chest.add(head);
const skull = ellipsoid(0.098, 0.115, 0.108, COLORS.skin, 'head');
skull.position.y = 0.09;
head.add(skull);
const nose = mesh(new THREE.ConeGeometry(0.018, 0.04, 8), COLORS.skin, 'head');
nose.rotation.x = Math.PI / 2; nose.position.set(0, 0.075, 0.11);
head.add(nose);
for (const s of [-1, 1]) {
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), new THREE.MeshStandardMaterial({ color: 0x111111 }));
  eye.position.set(0.036 * s, 0.105, 0.096);
  head.add(eye);
}
const hatBrim = mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.012, 32), COLORS.hat, 'head');
hatBrim.position.y = 0.17;
const hatTop = mesh(new THREE.CylinderGeometry(0.095, 0.11, 0.1, 32), COLORS.hat, 'head');
hatTop.position.y = 0.22;
const hatBand = mesh(new THREE.CylinderGeometry(0.112, 0.112, 0.022, 32), 0xe8e2d0, 'head');
hatBand.position.y = 0.185;
head.add(hatBrim, hatTop, hatBand);

// 肩・腕
function makeArm(side) {
  const shoulder = new THREE.Group();
  chest.add(shoulder);
  shoulder.add(ellipsoid(0.07, 0.065, 0.07, COLORS.shirt, 'shoulders'));
  const upper = new THREE.Group();
  shoulder.add(upper);
  const ua = capsule(0.048, 0.22, COLORS.shirt, 'arms');
  ua.position.y = -0.14;
  upper.add(ua);
  const fore = new THREE.Group();
  fore.position.y = -0.29;
  upper.add(fore);
  const fa = capsule(0.04, 0.2, COLORS.skin, 'arms');
  fa.position.y = -0.12;
  fore.add(fa);
  const hand = ellipsoid(0.038, 0.06, 0.025, COLORS.skin, 'arms');
  hand.position.y = -0.27;
  fore.add(hand);
  return { side, shoulder, upper, fore };
}
const arms = [makeArm(1), makeArm(-1)]; // 左(+x)、右(-x)

// 脚（2ボーンIK、body空間）
const L1 = 0.445, L2 = 0.43, ANKLE_Y = 0.085;
function makeLeg(side) {
  const thigh = new THREE.Group();
  const tm = capsule(0.075, L1 - 0.06, COLORS.pants, 'legs');
  tm.position.y = -L1 / 2;
  thigh.add(tm);
  const shin = new THREE.Group();
  const sm = capsule(0.058, L2 - 0.05, COLORS.pants, 'legs');
  sm.position.y = -L2 / 2;
  shin.add(sm);
  const foot = mesh(new THREE.BoxGeometry(0.1, 0.075, 0.26), COLORS.shoe, 'feet');
  foot.receiveShadow = true;
  body.add(thigh, shin, foot);
  return { side, thigh, shin, foot };
}
const legs = [makeLeg(1), makeLeg(-1)];

const DOWN = new THREE.Vector3(0, -1, 0);
const UP = new THREE.Vector3(0, 1, 0);
const _v = new THREE.Vector3(), _d = new THREE.Vector3(), _f = new THREE.Vector3(), _k = new THREE.Vector3();
function solveLeg(leg, stance) {
  const hip = new THREE.Vector3(0.088 * leg.side, -0.045, 0).applyMatrix4(pelvis.matrix);
  const ankle = new THREE.Vector3(stance * leg.side, ANKLE_Y, 0.0);
  _d.subVectors(ankle, hip);
  let dist = _d.length();
  const max = L1 + L2 - 0.0005;
  const dir = _d.clone().normalize();
  dist = Math.min(dist, max);
  const a = (L1 * L1 - L2 * L2 + dist * dist) / (2 * dist);
  const h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  _f.set(0.12 * leg.side, 0, 1); // 膝は前（少し外）へ
  _f.addScaledVector(dir, -_f.dot(dir)).normalize();
  _k.copy(hip).addScaledVector(dir, a).addScaledVector(_f, h);
  leg.thigh.position.copy(hip);
  leg.thigh.quaternion.setFromUnitVectors(DOWN, _v.subVectors(_k, hip).normalize());
  leg.shin.position.copy(_k);
  const ankleReal = hip.clone().addScaledVector(dir, dist);
  leg.shin.quaternion.setFromUnitVectors(DOWN, _v.subVectors(ankleReal, _k).normalize());
  leg.foot.position.set(ankle.x, ANKLE_Y - 0.045, 0.06);
}

function stretchBetween(pivot, m, from, to, baseLen) {
  pivot.position.copy(from);
  _v.subVectors(to, from);
  const len = _v.length();
  pivot.quaternion.setFromUnitVectors(UP, _v.normalize());
  m.position.y = len / 2;
  m.scale.y = Math.max(0.3, len / baseLen);
}

// ---------- ポーズ適用 ----------
function applyPose(p, stance) {
  pelvis.position.set(p.hipX, p.hipY + 0.04, p.hipZ); // hipY 0.93 ≒ 自然な立ち姿（膝が軽く緩んだ状態）
  pelvis.rotation.set(p.hipPitch, p.hipYaw, p.hipRoll);
  // 背骨は骨盤の傾きを打ち消して上体を立てる（腰だけが動いて見えるように）
  spine.rotation.set(p.spinePitch - p.hipPitch * 0.85, -p.hipYaw * 0.8, p.spineRoll - p.hipRoll * 0.85);
  chest.position.set(p.chestX, CHEST_BASE_Y + p.chestY, p.chestZ);
  chest.rotation.set(p.chestPitch, p.chestYaw, p.chestRoll);
  stretchBetween(abdomenPivot, abdomen, new THREE.Vector3(0, 0, 0), chest.position.clone().add(new THREE.Vector3(0, 0.04, 0)), 0.24 + 0.12);

  head.position.set(p.headX, NECK_BASE.y + 0.07 + p.headY, p.headZ);
  head.rotation.set(p.headPitch, p.headYaw, p.headRoll);
  stretchBetween(neckPivot, neckMesh, NECK_BASE.clone().add(new THREE.Vector3(0, -0.04, -0.01)), head.position.clone().add(new THREE.Vector3(0, 0.02, -0.01)), 0.16);

  for (const a of arms) {
    const left = a.side === 1;
    a.shoulder.position.set(0.185 * a.side, 0.245 + (left ? p.shLY : p.shRY), left ? p.shLZ : p.shRZ);
    a.upper.rotation.set(-(left ? p.armLF : p.armRF), 0, (left ? p.armLOut : p.armROut) * a.side);
    a.fore.rotation.set(-(left ? p.elbL : p.elbR), 0, 0);
  }
  pelvis.updateMatrix();
  for (const l of legs) solveLeg(l, stance);
}

// ---------- 補間 ----------
const lerp = (a, b, t) => a + (b - a) * t;
const easeSmooth = (u) => 0.5 - 0.5 * Math.cos(Math.PI * u);
// 打ち: 区間の後半で加速して拍ちょうどにピタッと止まる
const easeHit = (u) => Math.pow(Math.min(1, Math.max(0, (u - 0.58) / 0.42)), 1.7);

function prepare(move) {
  const base = { ...DEFAULT_POSE, ...expand(move.base || {}) };
  move._keys = move.keys.map((kf) => ({ ...kf, pose: { ...base, ...kf.p } }));
}
function expand(o) {
  const r = { ...o };
  for (const [s, a, b] of [['shY', 'shLY', 'shRY'], ['shZ', 'shLZ', 'shRZ'], ['armF', 'armLF', 'armRF'], ['armOut', 'armLOut', 'armROut'], ['elb', 'elbL', 'elbR']]) {
    if (s in r) { r[a] = r[s]; r[b] = r[s]; delete r[s]; }
  }
  return r;
}
MOVES.forEach(prepare);

function sample(move, tau) {
  const ks = move._keys, n = ks.length, C = move.cycle;
  let i = n - 1;
  for (let j = 0; j < n; j++) if (ks[j].t <= tau) i = j;
  const prev = ks[i];
  let tp = prev.t;
  if (tp > tau) tp -= C;
  const next = ks[(i + 1) % n];
  let tn = next.t;
  if (tn <= tp) tn += C;
  const u = (tau - tp) / (tn - tp);
  const e = next.ease === 'hit' ? easeHit(u) : easeSmooth(u);
  const out = {};
  for (const key in prev.pose) out[key] = lerp(prev.pose[key], next.pose[key], e);
  return out;
}

// ---------- 状態・UI ----------
let cur = MOVES[0];
let beats = 0, playing = true, speed = 1, lastKey = -1, flash = 0, autoCycles = 0;
let lastBeatInt = -1;
const $ = (id) => document.getElementById(id);

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
  b.onclick = () => select(m.id, true);
  list.append(b);
}
$('general').innerHTML = GENERAL_POINTS.map((g) => `<li><b>${g.t}</b>${g.s}</li>`).join('');
document.querySelectorAll('[data-go]').forEach((b) => (b.onclick = () => { select(b.dataset.go, true); stage.scrollIntoView({ behavior: 'smooth', block: 'center' }); }));

const beatDots = $('beats');
function buildBeatDots() {
  const n = Math.max(2, Math.ceil(cur.cycle));
  beatDots.innerHTML = '<i></i>'.repeat(n);
}

const CAMS = {
  front: [0, 1.15, 3.0], side: [3.0, 1.1, 0.2], diag: [2.1, 1.25, 2.2], back: [0, 1.2, -3.0],
};
function setCam(name) {
  const [x, y, z] = CAMS[name];
  camera.position.set(x, y, z);
  controls.target.set(0, 0.88, 0);
  document.querySelectorAll('[data-cam]').forEach((b) => b.classList.toggle('on', b.dataset.cam === name));
}
document.querySelectorAll('[data-cam]').forEach((b) => (b.onclick = () => setCam(b.dataset.cam)));

function select(id, userAction) {
  cur = MOVES.find((m) => m.id === id) || MOVES[0];
  beats = 0; lastKey = -1; lastBeatInt = -1; autoCycles = 0;
  document.querySelectorAll('#moveList button').forEach((b) => b.classList.toggle('on', b.dataset.id === cur.id));
  $('moveGroup').textContent = cur.group;
  $('moveName').textContent = cur.name;
  $('moveEn').textContent = cur.en;
  $('summary').textContent = cur.summary;
  $('points').innerHTML = cur.points.map((p) => `<li>${p}</li>`).join('');
  const [mm, ss] = cur.time.split(':').map(Number);
  const ts = $('ts');
  ts.textContent = `▶ 動画 ${cur.time}〜`;
  ts.href = `https://youtu.be/FYvDc13txdw?t=${mm * 60 + ss}`;
  setCam(cur.camera);
  buildBeatDots();
  updateBpm();
  applyHighlight();
  if (userAction) history.replaceState(null, '', '#' + cur.id);
  const btn = list.querySelector(`[data-id="${cur.id}"]`);
  if (btn && userAction) btn.scrollIntoView({ block: 'nearest', inline: 'center' });
}

function updateBpm() { $('bpm').textContent = `${Math.round(cur.bpm * speed)} BPM`; }
$('speed').oninput = (e) => { speed = +e.target.value; updateBpm(); };
$('play').onclick = () => { playing = !playing; $('play').textContent = playing ? '❚❚ 一時停止' : '▶ 再生'; };
$('hl').onchange = applyHighlight;

function applyHighlight() {
  const on = $('hl').checked;
  const prim = new Set(cur.parts.primary), link = new Set(cur.parts.linked);
  if (cur.legFromSolarPlexus) link.add('abdomen');
  for (const [name, ms] of Object.entries(parts)) {
    for (const m of ms) {
      const role = !on ? null : prim.has(name) ? 'primary' : link.has(name) ? 'linked' : null;
      m.userData.role = role;
      m.material.color.copy(m.userData.base);
      if (role) m.material.color.lerp(PART_COLOR[role], role === 'primary' ? 0.75 : 0.7);
      m.material.emissive.setRGB(0, 0, 0);
    }
  }
}

// メトロノーム
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

// ---------- ループ ----------
function resize() {
  const w = stage.clientWidth, h = stage.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(stage);

const clock = new THREE.Clock();
const capEl = $('caption'), countEl = $('count');
function frame() {
  const dt = Math.min(0.05, clock.getDelta());
  if (playing) beats += dt * (cur.bpm * speed) / 60;
  const tau = beats % cur.cycle;

  // 拍
  const bi = Math.floor(beats);
  if (bi !== lastBeatInt) {
    lastBeatInt = bi;
    click(bi % cur.cycle === 0);
    if ($('auto').checked && bi > 0 && bi % Math.ceil(cur.cycle) === 0) {
      autoCycles++;
      const need = Math.max(2, Math.ceil(8 / cur.cycle));
      if (autoCycles >= need) {
        const idx = (MOVES.indexOf(cur) + 1) % MOVES.length;
        select(MOVES[idx].id, true);
        requestAnimationFrame(frame);
        return;
      }
    }
  }
  const frac = beats - bi;
  countEl.textContent = frac < 0.5 ? String((bi % 8) + 1) : '&';
  [...beatDots.children].forEach((d, i) => d.classList.toggle('on', i === Math.floor(tau)));

  // キャプションと打ちのフラッシュ
  let ki = -1;
  cur._keys.forEach((kf, i) => { if (kf.t <= tau) ki = i; });
  if (ki === -1) ki = cur._keys.length - 1;
  if (ki !== lastKey) {
    lastKey = ki;
    if (cur._keys[ki].ease === 'hit') flash = 1;
    let c = null;
    for (let i = ki; i >= 0 && !c; i--) c = cur._keys[i].cap;
    if (!c) for (let i = cur._keys.length - 1; i > ki && !c; i--) c = cur._keys[i].cap;
    capEl.textContent = c || '';
    capEl.classList.toggle('hit', cur._keys[ki].ease === 'hit');
  }

  // ポーズ
  const p = sample(cur, tau);
  if (cur.bounce) p.hipY -= cur.bounce * Math.pow(0.5 + 0.5 * Math.cos(2 * Math.PI * frac), 2);
  applyPose(p, cur.stance || 0.12);

  flash = Math.max(0, flash - dt * 4);
  if ($('hl').checked) {
    for (const ms of Object.values(parts)) for (const m of ms) {
      if (m.userData.role === 'primary') m.material.emissive.setRGB(0.55 * flash, 0.22 * flash, 0.05 * flash);
    }
  }

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

const initial = location.hash.slice(1);
select(MOVES.some((m) => m.id === initial) ? initial : 'bird', false);
// ?freeze=<拍> でその拍の姿勢に固定（確認・スクリーンショット用）
const freeze = new URLSearchParams(location.search).get('freeze');
if (freeze !== null) { beats = +freeze; playing = false; $('play').textContent = '▶ 再生'; }
resize();
requestAnimationFrame(frame);
