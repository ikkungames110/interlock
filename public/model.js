import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { MOVES, DEFAULT_POSE } from './moves.js';

// ================= ステージ =================
export function createStage(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.05, 50);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.minDistance = 1.2;
  controls.maxDistance = 7;

  scene.add(new THREE.HemisphereLight(0xfff4f8, 0x6b5a7a, 1.6));
  const key = new THREE.DirectionalLight(0xfff6ee, 2.0);
  key.position.set(2.2, 4, 3);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.radius = 4;
  Object.assign(key.shadow.camera, { left: -2, right: 2, top: 2.5, bottom: -0.5 });
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xc8b6ff, 1.1);
  rim.position.set(-3, 2.5, -3);
  scene.add(rim);

  const floor = new THREE.Mesh(new THREE.CircleGeometry(2.4, 64), new THREE.MeshStandardMaterial({ color: 0x3b3656, roughness: 0.95 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.62, 0.66, 64), new THREE.MeshBasicMaterial({ color: 0x8f86c8, transparent: true, opacity: 0.5 }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.003;
  scene.add(ring);
  const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.12, 3), new THREE.MeshBasicMaterial({ color: 0x8f86c8 }));
  arrow.rotation.x = Math.PI / 2;
  arrow.position.set(0, 0.01, 0.76);
  scene.add(arrow);

  const char = buildCharacter();
  scene.add(char.body);

  const CAMS = { front: [0, 1.15, 3.0], side: [3.0, 1.1, 0.2], diag: [2.1, 1.25, 2.2], back: [0, 1.2, -3.0] };
  function setCam(name) {
    const [x, y, z] = CAMS[name];
    camera.position.set(x, y, z);
    controls.target.set(0, 0.9, 0);
  }

  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(container);
  resize();

  function render() {
    controls.update();
    renderer.render(scene, camera);
  }
  return { setCam, render, ...char };
}

// ================= キャラクター =================
// オリジナルのちびキャラ。ボブヘア＋アホ毛、大きな目、ほっぺ。パステルの服。
const C = {
  skin: 0xffdcc8, hair: 0x6b4536, top: 0x9fe3d2, topDark: 0x7fcfbd, pants: 0xb7b2f0,
  shoe: 0xffffff, sole: 0xff9fb5, eye: 0x2d2236, blush: 0xff9fb0, mouth: 0xc0505f,
};
const ROLE_GLOW = { primary: new THREE.Color(0xffa14a), linked: new THREE.Color(0x4cc3ff) };

function buildCharacter() {
  const parts = {};
  const mat = (color, opts = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0, ...opts });
  function mesh(geo, color, part, opts) {
    const m = new THREE.Mesh(geo, mat(color, opts));
    m.castShadow = true;
    if (part) (parts[part] ||= []).push(m);
    return m;
  }
  const ell = (rx, ry, rz, color, part) => {
    const m = mesh(new THREE.SphereGeometry(1, 32, 24), color, part);
    m.scale.set(rx, ry, rz);
    return m;
  };
  const cap = (r, len, color, part) => mesh(new THREE.CapsuleGeometry(r, len, 10, 18), color, part);

  const body = new THREE.Group();
  const pelvis = new THREE.Group();
  pelvis.rotation.order = 'YXZ';
  body.add(pelvis);
  pelvis.add(ell(0.15, 0.105, 0.118, C.pants, 'pelvis'));

  const spine = new THREE.Group();
  spine.position.y = 0.07;
  pelvis.add(spine);
  const abdomen = cap(0.13, 0.1, C.top, 'abdomen');
  abdomen.scale.z = 0.85;
  const abdomenPivot = new THREE.Group();
  abdomenPivot.add(abdomen);
  spine.add(abdomenPivot);

  const chest = new THREE.Group();
  spine.add(chest);
  const ribs = ell(0.165, 0.165, 0.125, C.top, 'chest');
  ribs.position.y = 0.13;
  chest.add(ribs);
  // パーカーのフードっぽい襟
  const hood = mesh(new THREE.TorusGeometry(0.085, 0.032, 10, 24), C.topDark, 'chest');
  hood.rotation.x = Math.PI / 2 + 0.25;
  hood.position.set(0, 0.27, -0.02);
  chest.add(hood);
  // 胸のワンポイント（星）
  const star = new THREE.Mesh(starGeo(0.035, 0.016), mat(0xfff3a6));
  star.position.set(0.06, 0.16, 0.112);
  star.rotation.x = -0.12;
  chest.add(star);

  const NECK_BASE = new THREE.Vector3(0, 0.27, 0);
  const neckPivot = new THREE.Group();
  const neck = cap(0.045, 0.03, C.skin, 'neck');
  neckPivot.add(neck);
  chest.add(neckPivot);

  // 頭
  const head = new THREE.Group();
  head.rotation.order = 'YXZ';
  chest.add(head);
  const HR = 0.155;
  const skull = ell(HR, HR * 0.94, HR * 0.94, C.skin, 'head');
  skull.position.y = 0.13;
  head.add(skull);
  // 髪: 頭頂〜後ろを覆うキャップ＋前髪＋サイド＋アホ毛
  const hairCap = mesh(new THREE.SphereGeometry(HR * 1.07, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.56), C.hair, 'head');
  hairCap.position.set(0, 0.135, -0.012);
  hairCap.rotation.x = -0.5;
  head.add(hairCap);
  const back = ell(HR * 1.03, HR * 0.8, HR * 0.75, C.hair, 'head');
  back.position.set(0, 0.1, -0.055);
  head.add(back);
  for (const [x, y, s, rz] of [[-0.075, 0.215, 0.07, 0.5], [0, 0.228, 0.075, 0], [0.075, 0.215, 0.07, -0.5]]) {
    const bang = ell(s, s * 0.55, s * 0.6, C.hair, 'head');
    bang.position.set(x, y, 0.09);
    bang.rotation.set(-0.5, 0, rz);
    head.add(bang);
  }
  for (const sd of [-1, 1]) {
    const side = ell(0.045, 0.1, 0.06, C.hair, 'head');
    side.position.set(0.14 * sd, 0.08, -0.03);
    side.rotation.z = 0.12 * sd;
    head.add(side);
  }
  const ahoge = mesh(new THREE.TorusGeometry(0.035, 0.008, 6, 16, Math.PI * 1.2), C.hair, 'head');
  ahoge.position.set(0.0, 0.305, 0.0);
  ahoge.rotation.set(0, Math.PI / 2, 0.4);
  head.add(ahoge);
  // 顔
  for (const sd of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat(C.eye, { roughness: 0.2 }));
    eye.scale.set(0.022, 0.03, 0.012);
    eye.position.set(0.055 * sd, 0.115, 0.135);
    eye.rotation.y = 0.35 * sd;
    head.add(eye);
    const hi = new THREE.Mesh(new THREE.SphereGeometry(0.0075, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    hi.position.set(0.055 * sd + 0.008, 0.127, 0.145);
    head.add(hi);
    const blush = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), new THREE.MeshBasicMaterial({ color: C.blush, transparent: true, opacity: 0.55 }));
    blush.scale.set(0.026, 0.014, 0.008);
    blush.position.set(0.092 * sd, 0.078, 0.118);
    blush.rotation.y = 0.65 * sd;
    head.add(blush);
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.0045, 6, 14, Math.PI), mat(C.mouth));
  mouth.rotation.z = Math.PI;
  mouth.position.set(0, 0.078, 0.142);
  head.add(mouth);

  // 腕
  function makeArm(side) {
    const shoulder = new THREE.Group();
    chest.add(shoulder);
    shoulder.add(ell(0.065, 0.062, 0.065, C.top, 'shoulders'));
    const upper = new THREE.Group();
    shoulder.add(upper);
    const ua = cap(0.05, 0.19, C.top, 'arms');
    ua.position.y = -0.13;
    upper.add(ua);
    const cuff = mesh(new THREE.TorusGeometry(0.046, 0.014, 8, 18), C.topDark, 'arms');
    cuff.rotation.x = Math.PI / 2;
    cuff.position.y = -0.26;
    upper.add(cuff);
    const fore = new THREE.Group();
    fore.position.y = -0.28;
    upper.add(fore);
    const fa = cap(0.04, 0.17, C.skin, 'arms');
    fa.position.y = -0.1;
    fore.add(fa);
    const hand = ell(0.05, 0.052, 0.045, C.skin, 'arms');
    hand.position.y = -0.24;
    fore.add(hand);
    return { side, shoulder, upper, fore };
  }
  const arms = [makeArm(1), makeArm(-1)];

  // 脚（2ボーンIK）
  const L1 = 0.445, L2 = 0.43, ANKLE_Y = 0.085;
  function makeLeg(side) {
    const thigh = new THREE.Group();
    const tm = cap(0.078, L1 - 0.07, C.pants, 'legs');
    tm.position.y = -L1 / 2;
    thigh.add(tm);
    const shin = new THREE.Group();
    const sm = cap(0.065, L2 - 0.07, C.pants, 'legs');
    sm.position.y = -L2 / 2;
    shin.add(sm);
    const foot = new THREE.Group();
    const shoe = cap(0.06, 0.13, C.shoe, 'feet');
    shoe.rotation.x = Math.PI / 2;
    shoe.scale.set(1.05, 1, 0.75);
    shoe.position.set(0, 0.012, 0.05);
    const sole = mesh(new THREE.BoxGeometry(0.12, 0.022, 0.26), C.sole, 'feet');
    sole.position.set(0, -0.03, 0.05);
    foot.add(shoe, sole);
    body.add(thigh, shin, foot);
    return { side, thigh, shin, foot };
  }
  const legs = [makeLeg(1), makeLeg(-1)];

  const DOWN = new THREE.Vector3(0, -1, 0), UP = new THREE.Vector3(0, 1, 0);
  const _v = new THREE.Vector3(), _d = new THREE.Vector3(), _f = new THREE.Vector3(), _k = new THREE.Vector3();
  function solveLeg(leg, stance) {
    const hip = new THREE.Vector3(0.085 * leg.side, -0.045, 0).applyMatrix4(pelvis.matrix);
    const ankle = new THREE.Vector3(stance * leg.side, ANKLE_Y, 0);
    _d.subVectors(ankle, hip);
    const dir = _d.clone().normalize();
    const dist = Math.min(_d.length(), L1 + L2 - 0.0005);
    const a = (L1 * L1 - L2 * L2 + dist * dist) / (2 * dist);
    const h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
    _f.set(0.12 * leg.side, 0, 1);
    _f.addScaledVector(dir, -_f.dot(dir)).normalize();
    _k.copy(hip).addScaledVector(dir, a).addScaledVector(_f, h);
    leg.thigh.position.copy(hip);
    leg.thigh.quaternion.setFromUnitVectors(DOWN, _v.subVectors(_k, hip).normalize());
    leg.shin.position.copy(_k);
    const ankleReal = hip.clone().addScaledVector(dir, dist);
    leg.shin.quaternion.setFromUnitVectors(DOWN, _v.subVectors(ankleReal, _k).normalize());
    leg.foot.position.set(ankle.x, ANKLE_Y - 0.03, 0.0);
  }
  function stretch(pivot, m, from, to, baseLen) {
    pivot.position.copy(from);
    _v.subVectors(to, from);
    const len = _v.length();
    pivot.quaternion.setFromUnitVectors(UP, _v.normalize());
    m.position.y = len / 2;
    m.scale.y = Math.max(0.3, len / baseLen);
  }

  const CHEST_BASE_Y = 0.2;
  function applyPose(p, stance = 0.12) {
    pelvis.position.set(p.hipX, p.hipY + 0.04, p.hipZ);
    pelvis.rotation.set(p.hipPitch, p.hipYaw, p.hipRoll);
    // 背骨は骨盤の傾きを打ち消して上体を立てる
    spine.rotation.set(p.spinePitch - p.hipPitch * 0.85, -p.hipYaw * 0.8, p.spineRoll - p.hipRoll * 0.85);
    chest.position.set(p.chestX, CHEST_BASE_Y + p.chestY, p.chestZ);
    chest.rotation.set(p.chestPitch, p.chestYaw, p.chestRoll);
    stretch(abdomenPivot, abdomen, new THREE.Vector3(), chest.position.clone().add(new THREE.Vector3(0, 0.04, 0)), 0.36);
    head.position.set(p.headX, NECK_BASE.y + 0.03 + p.headY, p.headZ);
    head.rotation.set(p.headPitch, p.headYaw, p.headRoll);
    stretch(neckPivot, neck, NECK_BASE.clone().add(new THREE.Vector3(0, -0.03, -0.01)), head.position.clone().add(new THREE.Vector3(0, 0.03, -0.01)), 0.12);
    for (const a of arms) {
      const left = a.side === 1;
      a.shoulder.position.set(0.18 * a.side, 0.235 + (left ? p.shLY : p.shRY), left ? p.shLZ : p.shRZ);
      a.upper.rotation.set(-(left ? p.armLF : p.armRF), 0, (left ? p.armLOut : p.armROut) * a.side);
      a.fore.rotation.set(-(left ? p.elbL : p.elbR), 0, 0);
    }
    pelvis.updateMatrix();
    for (const l of legs) solveLeg(l, stance);
  }

  // 強調表示: 色は変えず、ほんのり発光させるだけ
  let roles = {};
  function setHighlight(spec, on) {
    roles = {};
    if (on && spec) {
      for (const n of spec.linked || []) roles[n] = 'linked';
      for (const n of spec.primary || []) roles[n] = 'primary';
    }
    updateGlow(0);
  }
  function updateGlow(flash) {
    for (const [name, ms] of Object.entries(parts)) {
      const role = roles[name];
      for (const m of ms) {
        if (!role) { m.material.emissive.setRGB(0, 0, 0); continue; }
        const k = role === 'primary' ? 0.16 + 0.34 * flash : 0.13;
        m.material.emissive.copy(ROLE_GLOW[role]).multiplyScalar(k);
      }
    }
  }
  return { body, applyPose, setHighlight, updateGlow };
}

function starGeo(r1, depth) {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? r1 * 0.45 : r1;
    const a = Math.PI / 2 + (i * Math.PI) / 5;
    i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSize: 0.004, bevelThickness: 0.004, bevelSegments: 2 });
}

// ================= ポーズ補間 =================
const lerp = (a, b, t) => a + (b - a) * t;
const easeSmooth = (u) => 0.5 - 0.5 * Math.cos(Math.PI * u);
// 打ち: 区間の後半で加速して拍ちょうどにピタッと止まる
const easeHit = (u) => Math.pow(Math.min(1, Math.max(0, (u - 0.58) / 0.42)), 1.7);

function expand(o) {
  const r = { ...o };
  for (const [s, a, b] of [['shY', 'shLY', 'shRY'], ['shZ', 'shLZ', 'shRZ'], ['armF', 'armLF', 'armRF'], ['armOut', 'armLOut', 'armROut'], ['elb', 'elbL', 'elbR']]) {
    if (s in r) { r[a] = r[s]; r[b] = r[s]; delete r[s]; }
  }
  return r;
}
for (const m of MOVES) {
  const base = { ...DEFAULT_POSE, ...expand(m.base || {}) };
  m._keys = m.keys.map((kf) => ({ ...kf, pose: { ...base, ...kf.p } }));
}

// beat: ムーブ開始からの拍数（小数）。ポーズと、そのとき表示すべきキー番号を返す。
export function samplePose(move, beat) {
  const C = move.cycle, tau = ((beat % C) + C) % C;
  const ks = move._keys, n = ks.length;
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
  const pose = {};
  for (const key in prev.pose) pose[key] = lerp(prev.pose[key], next.pose[key], e);
  if (move.bounce) {
    const frac = beat - Math.floor(beat);
    pose.hipY -= move.bounce * Math.pow(0.5 + 0.5 * Math.cos(2 * Math.PI * frac), 2);
  }
  return { pose, keyIndex: i };
}
export function captionFor(move, ki) {
  const ks = move._keys;
  for (let i = ki; i >= 0; i--) if (ks[i].cap) return ks[i].cap;
  for (let i = ks.length - 1; i > ki; i--) if (ks[i].cap) return ks[i].cap;
  return '';
}
export function blendPose(a, b, t) {
  const o = {};
  for (const k in a) o[k] = lerp(a[k], b[k], t);
  return o;
}
export const idlePose = () => ({ ...DEFAULT_POSE });
