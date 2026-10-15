// 各ムーブの定義。キーフレームは「拍(beat)」単位。
// ease: 'hit' = 拍ちょうどにピタッと止まる打ち / 'smooth' = 滑らかに移動
// 座標: キャラクターは +z を向く。+x がキャラの左、-x がキャラの右。

export const DEFAULT_POSE = {
  hipX: 0, hipY: 0.93, hipZ: 0, hipPitch: 0, hipRoll: 0, hipYaw: 0,
  spinePitch: 0.02, spineRoll: 0,
  chestX: 0, chestY: 0, chestZ: 0, chestPitch: 0, chestRoll: 0, chestYaw: 0,
  headX: 0, headY: 0, headZ: 0, headPitch: 0, headYaw: 0, headRoll: 0,
  shLY: 0, shRY: 0, shLZ: 0, shRZ: 0,
  armLF: 0.05, armRF: 0.05, armLOut: 0.12, armROut: 0.12, elbL: 0.25, elbR: 0.25,
};

const both = (o) => {
  // 左右対称のショートカット: shY, shZ, armF, armOut, elb
  const r = { ...o };
  if ('shY' in o) { r.shLY = o.shY; r.shRY = o.shY; delete r.shY; }
  if ('shZ' in o) { r.shLZ = o.shZ; r.shRZ = o.shZ; delete r.shZ; }
  if ('armF' in o) { r.armLF = o.armF; r.armRF = o.armF; delete r.armF; }
  if ('armOut' in o) { r.armLOut = o.armOut; r.armROut = o.armOut; delete r.armOut; }
  if ('elb' in o) { r.elbL = o.elb; r.elbR = o.elb; delete r.elb; }
  return r;
};
const k = (t, p, ease, cap) => ({ t, p: both(p), ease, cap });

// ---------- 共通ポーズ ----------
const R = -1, L = 1; // キャラの右 = -x, 左 = +x

const downPose = (side = 0) => ({ hipY: 0.865, hipX: 0.06 * side, chestX: 0.015 * side, shY: 0.035, armF: 0.35, elb: 1.05 });
const neutralDown = (side = 0) => ({ hipY: 0.93, hipX: 0.02 * side, shY: 0, armF: 0.12, elb: 0.55 });

const upTop = (side = 0) => ({ hipY: 0.958, hipX: 0.06 * side, headPitch: 0.5, headZ: 0.025, headY: -0.01 });
const upPrep = (side = 0) => ({ hipY: 0.875, hipX: 0.02 * side, headPitch: -0.05, headZ: 0 });

const birdFwd = { headZ: 0.08, headPitch: -0.06, chestZ: -0.012, chestPitch: 0.04, hipY: 0.93, shY: -0.01 };
const birdBack = { headZ: -0.04, headY: -0.012, headPitch: 0.04, chestZ: 0.055, chestY: 0.012, chestPitch: -0.13, hipY: 0.885, hipZ: -0.01 };

const swanOut = { chestZ: 0.07, chestPitch: -0.15, shZ: -0.035, hipZ: -0.04, hipPitch: 0.13 };
const swanIn = { chestZ: -0.045, chestPitch: 0.13, shZ: 0.035, hipZ: 0.035, hipPitch: -0.12 };
const swanSide = (s) => ({ chestX: 0.065 * s, chestRoll: -0.05 * s, chestZ: 0.01, shZ: 0, hipX: -0.012 * s });

const batUp = { chestY: 0.032, chestZ: 0.03, chestPitch: -0.09, shY: 0.015 };
const batDrop = { chestY: -0.035, chestZ: -0.065, chestPitch: 0.22, shZ: 0.03, shY: -0.02 };

const pantherUp = { chestY: 0.035, chestX: 0, chestRoll: 0, shLY: 0.01, shRY: 0.01, hipX: 0, hipRoll: 0 };
const pantherSide = (s) => ({
  chestX: 0.075 * s, chestY: 0.005, chestRoll: 0.06 * s,
  // 胸を出した側の肩が上がり、反対側の腰が逆方向へ出て「引っ張り合う」
  shLY: s === L ? 0.035 : -0.02, shRY: s === R ? 0.035 : -0.02,
  hipX: -0.035 * s, hipRoll: 0.09 * s,
});

const duckFront = { hipZ: 0.065, hipPitch: -0.3, hipY: 0.912, armF: -0.45, elb: 0.3 };
const duckBack = { hipZ: -0.02, hipPitch: 0.08, hipY: 0.925, armF: 0.28, elb: 0.35 };

const shrimpBack = { hipZ: -0.065, hipPitch: 0.34, hipY: 0.912, armF: 0.38, elb: 0.4, chestZ: 0.01 };
const shrimpFront = { hipZ: 0.035, hipPitch: -0.16, hipY: 0.925, armF: -0.25, elb: 0.3 };

const alliSide = (s, dip = 0) => ({ hipX: 0.075 * s, hipRoll: 0.07 * s, chestX: 0.022 * s, hipY: 0.915 - dip, chestRoll: -0.02 * s, spineRoll: -0.02 * s });

// ---------- ムーブ定義 ----------
export const MOVES = [
  {
    id: 'bodydown', group: 'リズムの取り方', name: 'ボディダウン', en: 'Body Down', time: '0:14',
    bpm: 92, cycle: 1, camera: 'diag', bounce: 0,
    parts: { primary: ['legs'], linked: ['shoulders', 'arms'] },
    summary: '膝を曲げてリズムを取る。膝を曲げた瞬間に両腕（肩）で体を引き上げるのがミソ。',
    keys: [
      k(0, downPose(), 'hit', '膝を曲げてダウン（オン）＋ 同時に両腕で引き上げる'),
      k(0.5, neutralDown(), 'smooth', '戻る ― 力を入れずにバウンス'),
    ],
    points: [
      'リズムの取り方は「ボディダウン」と「ボディアップ」の2つ。',
      'ボディダウンは簡単。膝を曲げてリズムを取る。',
      '膝を曲げたときに両腕で（体を）引っ張り上げるのがミソ。',
      '力を入れないように、バウンスとともに引き上げる。',
    ],
  },
  {
    id: 'bodydown-lr', group: 'リズムの取り方', name: 'ボディダウン（左右に体重）', en: 'Body Down / weight shift', time: '0:53',
    bpm: 92, cycle: 8, camera: 'front', bounce: 0,
    parts: { primary: ['legs'], linked: ['shoulders', 'arms', 'pelvis'] },
    summary: '右→右→左→左（2回ずつ）、そのあと右→左（1回ずつ）と体重を落とす。',
    keys: [
      k(0, downPose(R), 'hit', '右に体重を落とす（2回ずつ）'), k(0.5, neutralDown(R), 'smooth'),
      k(1, downPose(R), 'hit'), k(1.5, neutralDown(0), 'smooth'),
      k(2, downPose(L), 'hit', '左に体重を落とす'), k(2.5, neutralDown(L), 'smooth'),
      k(3, downPose(L), 'hit'), k(3.5, neutralDown(0), 'smooth'),
      k(4, downPose(R), 'hit', '今度は1回ずつ 右'), k(4.5, neutralDown(0), 'smooth'),
      k(5, downPose(L), 'hit', '左'), k(5.5, neutralDown(0), 'smooth'),
      k(6, downPose(R), 'hit', '右'), k(6.5, neutralDown(0), 'smooth'),
      k(7, downPose(L), 'hit', '左'), k(7.5, neutralDown(0), 'smooth'),
    ],
    points: [
      '左右に体重を落としながらダウン。最初は2回ずつ、次に1回ずつ。',
      'どちらに体重を落とすときも、膝を曲げた瞬間の「引き上げ」は同じ。',
    ],
  },
  {
    id: 'bodyup', group: 'リズムの取り方', name: 'ボディアップ', en: 'Body Up', time: '1:29',
    bpm: 88, cycle: 1, camera: 'side', bounce: 0, base: { spinePitch: 0.2 },
    parts: { primary: ['legs'], linked: ['head', 'neck'] },
    summary: '膝を伸ばして体を上へ持ち上げる（上が強調）。体が上がるとき同時に首が前に倒れる。上体を前傾させておくのがコツ。',
    keys: [
      k(0, upTop(), 'hit', '膝を伸ばして上へ（オン）＝ 同時に首が前に倒れる'),
      k(0.5, upPrep(), 'smooth', '膝を曲げて準備 ― 上体の前傾はキープ'),
    ],
    points: [
      'ボディアップは膝を伸ばして体を上に上に持ち上げる。強調は「上」。',
      '体が上がるときに、同時に首が前に倒れる。',
      '最初はやりにくいので、ゆっくり「体が上がる＝首が倒れる」を合わせる。',
      '首だけ「居眠り」のようにコクンと落とすと崩れる。そうならないよう、先に上体を前傾させておき、そこから上へ上がる。',
    ],
  },
  {
    id: 'bodyup-lr', group: 'リズムの取り方', name: 'ボディアップ（左右に体重）', en: 'Body Up / weight shift', time: '2:30',
    bpm: 88, cycle: 8, camera: 'diag', bounce: 0, base: { spinePitch: 0.2 },
    parts: { primary: ['legs'], linked: ['head', 'neck', 'pelvis'] },
    summary: 'ボディアップのまま体重を右・左へ。2回ずつ → 1回ずつ。',
    keys: [
      k(0, upTop(R), 'hit', '右に体重を乗せてアップ（2回ずつ）'), k(0.5, upPrep(R), 'smooth'),
      k(1, upTop(R), 'hit'), k(1.5, upPrep(0), 'smooth'),
      k(2, upTop(L), 'hit', '左でアップ'), k(2.5, upPrep(L), 'smooth'),
      k(3, upTop(L), 'hit'), k(3.5, upPrep(0), 'smooth'),
      k(4, upTop(R), 'hit', '1回ずつ 右'), k(4.5, upPrep(0), 'smooth'),
      k(5, upTop(L), 'hit', '左'), k(5.5, upPrep(0), 'smooth'),
      k(6, upTop(R), 'hit', '右'), k(6.5, upPrep(0), 'smooth'),
      k(7, upTop(L), 'hit', '左'), k(7.5, upPrep(0), 'smooth'),
    ],
    points: ['体重を左右に移しても「上がる＝首が前に倒れる」の連動は崩さない。'],
  },

  // ---------------- 首 ----------------
  {
    id: 'bird', group: '① 首', name: 'バード', en: 'Bird（首）', time: '4:07',
    bpm: 80, cycle: 2, camera: 'side', bounce: 0,
    parts: { primary: ['head', 'neck'], linked: ['chest', 'pelvis', 'legs'] },
    summary: '首を前に出す＝オン。すぐ斜め後ろへ引く。引いたとき胸が前に出て、腰が下がる（ためている状態）。',
    keys: [
      k(0, birdFwd, 'hit', '首を前へ出す（オン）― 肩の力は抜く'),
      k(0.6, birdBack, 'smooth', '首を斜め後ろへグーッと引く ＝ 胸が出る・腰が下がる（ためる）'),
    ],
    points: [
      'まず肩の力を抜いて、首を前に出す。これが「オン」。',
      '出したらすぐに後ろに引く。',
      '引いたときに胸が前に出て、腰が下がる（＝連動）。これが「ためている」状態。',
      '横から見ると：首を前 → そのまま斜め後ろへグーッと引きながら胸が出て、同時に腰が下がる。',
      '膝を固めない。膝の力を抜いてリラックス。',
    ],
  },
  {
    id: 'bird-fast', group: '① 首', name: 'バード（速いテンポ）', en: 'Bird / fast', time: '5:00',
    bpm: 104, cycle: 1, camera: 'side', bounce: 0.006,
    parts: { primary: ['head', 'neck'], linked: ['chest', 'pelvis', 'legs'] },
    summary: '速いテンポでも「前で打つ→引くと胸が出て腰が下がる」は同じ。膝は固めない。',
    keys: [
      k(0, birdFwd, 'hit', '首を前（オン）'),
      k(0.5, birdBack, 'hit', '引く ＝ 胸が前・腰が下'),
    ],
    points: ['テンポを上げても膝を固めず、リラックスしたまま。'],
  },
  {
    id: 'bird-side', group: '① 首', name: 'バード（センター→横）', en: 'Bird / center & side', time: '5:30',
    bpm: 80, cycle: 8, camera: 'front', bounce: 0,
    parts: { primary: ['head', 'neck'], linked: ['chest', 'pelvis', 'legs'] },
    summary: 'センターで打ったあと、絵を描くように首を前から横へ持っていき、逆に戻す。左右交互に。',
    keys: [
      k(0, birdFwd, 'hit', 'センター：首を前（オン）'),
      k(1, birdBack, 'smooth', '引く ＝ 胸が前・腰が下'),
      k(1.6, { ...birdFwd, headX: -0.02, headYaw: -0.15 }, 'smooth', '絵を描くように前から横へ…'),
      k(2, { ...birdFwd, headX: -0.06, headZ: 0.045, headYaw: -0.55 }, 'hit', '右を向いて横で打つ'),
      k(3, birdBack, 'smooth', '逆に戻して引く'),
      k(4, birdFwd, 'hit', 'センター：首を前'),
      k(5, birdBack, 'smooth', '引く'),
      k(5.6, { ...birdFwd, headX: 0.02, headYaw: 0.15 }, 'smooth', '今度は左へ…'),
      k(6, { ...birdFwd, headX: 0.06, headZ: 0.045, headYaw: 0.55 }, 'hit', '左を向いて横で打つ'),
      k(7, birdBack, 'smooth', '戻して引く'),
    ],
    points: [
      'センターと横を向くバリエーション。前から横へ、絵を描くように首を持っていく。',
      '逆に戻して、今度は左へ。',
      'バードはインターロックの中で一番簡単。ただしイメージ（感覚）をつかむのは難しい。リズムに乗れるまで練習。',
    ],
  },

  // ---------------- 胸 ----------------
  {
    id: 'swan', group: '② 胸（前）', name: 'スワン', en: 'Swan（胸・前）', time: '6:28',
    bpm: 84, cycle: 1, camera: 'side', bounce: 0.014,
    parts: { primary: ['chest'], linked: ['shoulders', 'pelvis'] },
    summary: '胸の前でビートを刻む。胸を出すと肩は後ろ・腰も後ろ。胸を引くと肩が前・腰が前（連動）。常に足でバウンス。',
    keys: [
      k(0, swanOut, 'hit', '胸を前へ（オン）＝ 肩は後ろ・腰も後ろへ'),
      k(0.5, swanIn, 'smooth', '胸を引く ＝ 肩が前・腰が前へ（連動）'),
    ],
    points: [
      '胸の前でビートを刻む。',
      '胸を前に出すと肩が後ろに下がり、そのとき腰も後ろに下がる。これがインターロック（連動）。',
      '胸を後ろに引くと、今度は肩が前にやられて、腰が前に行く。',
      'スワンをやるときは必ず足（体全体）でバウンスする。8ビートで「トントン」と刻みながら胸を動かすことが一番重要。',
    ],
  },
  {
    id: 'swan-side', group: '② 胸（前）', name: 'スワン（前→横）', en: 'Swan / front & side', time: '7:16',
    bpm: 92, cycle: 4, camera: 'diag', bounce: 0.014,
    parts: { primary: ['chest'], linked: ['shoulders', 'pelvis'] },
    summary: '前・横・前・横。しっかりビートを刻みながら胸を前と横へ。',
    keys: [
      k(0, swanOut, 'hit', '前（オン）'), k(0.5, swanIn, 'smooth'),
      k(1, swanSide(R), 'hit', '横（右）'), k(1.5, { chestZ: 0 }, 'smooth'),
      k(2, swanOut, 'hit', '前'), k(2.5, swanIn, 'smooth'),
      k(3, swanSide(L), 'hit', '横（左）'), k(3.5, { chestZ: 0 }, 'smooth'),
    ],
    points: ['前と横を交互に。しっかりビートを刻む。'],
  },
  {
    id: 'swan-arms', group: '② 胸（前）', name: 'スワン（腕を後ろへ放る）', en: 'Swan / arms thrown back', time: '7:29',
    bpm: 84, cycle: 1, camera: 'side', bounce: 0.014,
    parts: { primary: ['chest'], linked: ['shoulders', 'pelvis', 'arms'] },
    summary: '胸をしっかり出し、腕の力を抜いて後ろへ放り投げる。',
    keys: [
      k(0, { ...swanOut, armF: -0.65, elb: 0.1 }, 'hit', '胸をしっかり出す ＋ 脱力した腕を後ろへ放り投げる'),
      k(0.5, { ...swanIn, armF: 0.22, elb: 0.45 }, 'smooth', '胸を引く ＝ 腕は自然に戻る'),
    ],
    points: ['腕は力を抜いて、胸を出す勢いで後ろへ放り投げる。'],
  },
  {
    id: 'swan-armsup', group: '② 胸（前）', name: 'スワン（腕を上げて）', en: 'Swan / arms up', time: '7:46',
    bpm: 84, cycle: 1, camera: 'diag', bounce: 0.014,
    base: { armF: 1.25, armOut: 0.45, elb: 1.35 },
    parts: { primary: ['chest'], linked: ['shoulders', 'pelvis'] },
    summary: '腕を上げた状態でも胸の前で打つ。翼のように腕を構える。',
    keys: [
      k(0, { ...swanOut, armF: 1.1, armOut: 0.5 }, 'hit', '腕を上げたまま胸を前（オン）'),
      k(0.5, { ...swanIn, armF: 1.35, armOut: 0.4 }, 'smooth', '胸を引く ＝ 肩・腰が前'),
    ],
    points: ['腕を上げても胸・肩・腰の連動は同じ。'],
  },
  {
    id: 'bat', group: '③ 胸（後ろ）', name: 'バット', en: 'Bat（胸・後ろ）', time: '8:13',
    bpm: 78, cycle: 2, camera: 'side', bounce: 0.008,
    base: { hipPitch: 0.1, hipZ: -0.015 },
    parts: { primary: ['chest'], linked: ['pelvis', 'shoulders'] },
    summary: 'バット＝コウモリ。チェストの後ろでビートを刻む。胸を上げた状態から斜め下へ「どっさん」と落とす。腰はしっかり張っておく。',
    keys: [
      k(0, batDrop, 'hit', '斜め下へ「どっさん」と落とす（オン：胸の後ろ）― 腰は張ったまま'),
      k(1, batUp, 'smooth', '胸を上に上げる（準備）'),
    ],
    points: [
      'バット（コウモリ）はチェストのバック（後ろ）でビートを刻む。',
      'まず胸を上に上げた状態を作り、そこから斜め下に向かって「どっさん」と落とす。',
      'このとき腰がしっかり張っているようにする。',
      '意識はしっかり胸に置く。',
    ],
  },
  {
    id: 'bat-fast', group: '③ 胸（後ろ）', name: 'バット（速いテンポ）', en: 'Bat / fast', time: '8:49',
    bpm: 100, cycle: 1, camera: 'side', bounce: 0.008,
    base: { hipPitch: 0.1, hipZ: -0.015 },
    parts: { primary: ['chest'], linked: ['pelvis', 'shoulders'] },
    summary: '速いテンポでも意識は胸に。',
    keys: [
      k(0, batDrop, 'hit', '落とす（オン）'),
      k(0.5, batUp, 'smooth', '上げる'),
    ],
    points: ['しっかり意識を胸に置いたまま、テンポを上げる。'],
  },
  {
    id: 'bat-punch', group: '③ 胸（後ろ）', name: 'バット（ダブルパンチ）', en: 'Bat / double punch', time: '9:35',
    bpm: 78, cycle: 2, camera: 'side', bounce: 0.006,
    base: { hipPitch: 0.06 },
    parts: { primary: ['chest'], linked: ['pelvis', 'arms', 'legs'] },
    summary: '胸を後ろで打つとき、体は前に出す。同時に肘を引く（パンチを打つように）。それを2回。',
    keys: [
      k(0, { ...batDrop, hipZ: 0.05, hipY: 0.9, armF: -0.4, elb: 1.7, armOut: 0.18 }, 'hit', '胸を後ろで打つ ＋ 体は前へ ＋ 肘を引く（1発目）'),
      k(0.5, { ...batUp, hipZ: 0.02, hipY: 0.92, armF: 0.35, elb: 0.9 }, 'smooth'),
      k(1, { ...batDrop, hipZ: 0.05, hipY: 0.9, armF: -0.4, elb: 1.7, armOut: 0.18 }, 'hit', 'もう一度（2発目）'),
      k(1.5, { ...batUp, hipZ: -0.01, armF: 0.2, elb: 0.8 }, 'smooth', '胸を上げて戻る'),
    ],
    points: [
      'バリエーション「ダブルパンチ」。',
      '胸を後ろで打つのだが、そのときに体を前に出す。',
      '同時に肘を引く。',
    ],
  },
  {
    id: 'panther', group: '④ 胸（横）', name: 'パンサー', en: 'Panther（胸・横）', time: '10:20',
    bpm: 80, cycle: 2, camera: 'front', bounce: 0.008,
    parts: { primary: ['chest'], linked: ['shoulders', 'pelvis'] },
    summary: '一番大事なのはリズム。胸をポイッと上に上げてから横へ。そのとき肩と（反対側の）腰が引っ張り合う。',
    keys: [
      k(0, pantherUp, 'hit', 'ポイッと胸を上へ（このリズムが基本）'),
      k(1, pantherSide(R), 'hit', '横へ（右）＝ 右肩と左腰が引っ張り合う'),
    ],
    points: [
      'パンサーで一番大事なポイントはリズム。',
      'まず胸を上に「ポイッ」と上げて、それから横へ。このリズムが基本になる。',
      '横に出したとき、肩と腰が引っ張り合う。',
    ],
  },
  {
    id: 'panther-lr', group: '④ 胸（横）', name: 'パンサー（左右）', en: 'Panther / both sides', time: '10:52',
    bpm: 84, cycle: 4, camera: 'front', bounce: 0.008,
    parts: { primary: ['chest'], linked: ['shoulders', 'pelvis'] },
    summary: 'アップ→右、アップ→左。今度は左肩と右腰が引っ張り合う。',
    keys: [
      k(0, pantherUp, 'hit', 'アップ'),
      k(1, pantherSide(R), 'hit', '右 ＝ 右肩と左腰が引っ張り合う'),
      k(2, pantherUp, 'hit', 'アップ（センター）'),
      k(3, pantherSide(L), 'hit', '左 ＝ 左肩と右腰が引っ張り合う'),
    ],
    points: ['逆側では左肩と右の腰が引っ張り合う。'],
  },

  // ---------------- 腰 ----------------
  {
    id: 'duck', group: '⑤ 腰（前）', name: 'ダック', en: 'Duck（腰・前）', time: '11:22',
    bpm: 84, cycle: 1, camera: 'side', bounce: 0.01,
    parts: { primary: ['pelvis'], linked: ['arms'] },
    summary: '腰の前でリズムを取る。腰が前のとき腕は後ろ、腰が後ろのとき腕は前。この腕と腰の関係を必ずキープ。',
    keys: [
      k(0, duckFront, 'hit', '腰を前へ（オン）＝ 腕は後ろ'),
      k(0.5, duckBack, 'smooth', '腰を戻す ＝ 腕は前（腕と腰の関係をキープ）'),
    ],
    points: [
      'ダックは腰を前に出してリズムを取る。',
      '腰が前に入っているときは腕が後ろ。腰が後ろのときは腕が前。（横から見るとわかりやすい）',
      '最初は必ずこの腕と腰の関係をキープして練習する。',
    ],
  },
  {
    id: 'duck-side', group: '⑤ 腰（前）', name: 'ダック（センター→横）', en: 'Duck / center & side', time: '12:14',
    bpm: 88, cycle: 4, camera: 'diag', bounce: 0.01,
    parts: { primary: ['pelvis'], linked: ['arms'] },
    summary: '今のリズムのままセンター→横へ。体で刻みながら。',
    keys: [
      k(0, duckFront, 'hit', '前（センター）'), k(0.5, duckBack, 'smooth'),
      k(1, { hipX: -0.07, hipRoll: -0.14, hipZ: 0.02, hipPitch: -0.1, armF: 0, armROut: 0.3, armLOut: 0.08 }, 'hit', '横（右）'), k(1.5, duckBack, 'smooth'),
      k(2, duckFront, 'hit', '前'), k(2.5, duckBack, 'smooth'),
      k(3, { hipX: 0.07, hipRoll: 0.14, hipZ: 0.02, hipPitch: -0.1, armF: 0, armLOut: 0.3, armROut: 0.08 }, 'hit', '横（左）'), k(3.5, duckBack, 'smooth'),
    ],
    points: ['リズムを保ったまま、センターと横を行き来する。しっかり体で刻む。'],
  },
  {
    id: 'duck-updown', group: '⑤ 腰（前）', name: 'ダック（アップ&ダウン）', en: 'Duck / up & down', time: '12:46',
    bpm: 84, cycle: 8, camera: 'side', bounce: 0.006,
    parts: { primary: ['pelvis'], linked: ['arms', 'legs'] },
    summary: '前で打ちながら斜め下へ下がっていく。膝の抵抗を感じながら。立った状態の前打ちができていないとお尻が抜ける。',
    keys: (() => {
      const ks = [];
      const ys = [0.9, 0.87, 0.84, 0.81, 0.81, 0.84, 0.87, 0.9];
      for (let i = 0; i < 8; i++) {
        ks.push(k(i, { ...duckFront, hipY: ys[i], hipZ: 0.065 + (0.93 - ys[i]) * 0.5, spinePitch: 0.02 + (0.93 - ys[i]) * 0.6 }, 'hit',
          i === 0 ? '前で打ちながら斜め下へ下がる' : i === 3 ? '膝の抵抗を感じながら' : i === 4 ? '打ちながら上がってくる' : undefined));
        ks.push(k(i + 0.5, { ...duckBack, hipY: ys[i] + 0.01, spinePitch: 0.02 + (0.93 - ys[i]) * 0.6 }, 'smooth'));
      }
      return ks;
    })(),
    points: [
      '前で打ちながら斜め下に下がってくる。膝の抵抗を感じながら。',
      'きつい練習だが、まず「腰の前」がしっかりできていないとダメ。',
      '立ったままの状態ができていないと、お尻が抜けてしまってうまくいかない。前をしっかり練習する。',
    ],
  },
  {
    id: 'shrimp', group: '⑥ 腰（後ろ）', name: 'シュリンプ', en: 'Shrimp（腰・後ろ）', time: '13:35',
    bpm: 84, cycle: 1, camera: 'side', bounce: 0.01,
    parts: { primary: ['pelvis'], linked: ['arms'] },
    summary: 'ダックと同じ前後運動だが、ビートは後ろ。腰が後ろのとき腕は前。打ったら必ず腰を前に戻す。',
    keys: [
      k(0, shrimpBack, 'hit', '腰を後ろへ（オン）＝ 腕は前'),
      k(0.5, shrimpFront, 'smooth', '必ず腰を前に戻す（後ろだけにならない）＝ 腕は後ろ'),
    ],
    points: [
      'ダックと同じ前後の動きだが、今度は後ろでビートを刻む。強調は後ろ。',
      '腰が後ろのとき腕が前、腰が前のとき腕が後ろ。',
      '多くの人は前を忘れがちで、後ろばかりになる。後ろで打ったら必ず腰を前に持ってくるのを忘れない。',
    ],
  },
  {
    id: 'shrimp-lr', group: '⑥ 腰（後ろ）', name: 'シュリンプ（センター・左右）', en: 'Shrimp / center-left-right', time: '14:34',
    bpm: 92, cycle: 4, camera: 'diag', bounce: 0.01,
    parts: { primary: ['pelvis'], linked: ['arms'] },
    summary: 'センター → 左 → センター → 右 と後ろで打つ方向を変える。',
    keys: [
      k(0, shrimpBack, 'hit', 'センター'), k(0.5, shrimpFront, 'smooth'),
      k(1, { ...shrimpBack, hipX: 0.06, hipYaw: 0.18, hipRoll: 0.06 }, 'hit', '左'), k(1.5, shrimpFront, 'smooth'),
      k(2, shrimpBack, 'hit', 'センター'), k(2.5, shrimpFront, 'smooth'),
      k(3, { ...shrimpBack, hipX: -0.06, hipYaw: -0.18, hipRoll: -0.06 }, 'hit', '右'), k(3.5, shrimpFront, 'smooth'),
    ],
    points: ['速いビートでも「後ろで打ったら前に戻す」を守る。'],
  },
  {
    id: 'shrimp-updown', group: '⑥ 腰（後ろ）', name: 'シュリンプ（アップ&ダウン）', en: 'Shrimp / up & down', time: '14:49',
    bpm: 84, cycle: 8, camera: 'side', bounce: 0.006,
    parts: { primary: ['pelvis'], linked: ['arms', 'legs'] },
    summary: '後ろに引いて打ちながら膝を曲げて下がり、また上がってくる。',
    keys: (() => {
      const ks = [];
      const ys = [0.9, 0.87, 0.84, 0.81, 0.81, 0.84, 0.87, 0.9];
      for (let i = 0; i < 8; i++) {
        ks.push(k(i, { ...shrimpBack, hipY: ys[i], spinePitch: 0.02 + (0.93 - ys[i]) * 1.2 }, 'hit',
          i === 0 ? '後ろに引いて打ちながら膝を曲げて下がる' : i === 4 ? '打ちながら上がる' : undefined));
        ks.push(k(i + 0.5, { ...shrimpFront, hipY: ys[i] + 0.01, spinePitch: 0.02 + (0.93 - ys[i]) * 1.0 }, 'smooth'));
      }
      return ks;
    })(),
    points: ['ダウンしても「後ろ→前に戻す」の往復は崩さない。'],
  },
  {
    id: 'alligator', group: '⑦ 腰（横）', name: 'アリゲーター', en: 'Alligator（腰・横）', time: '15:20',
    bpm: 84, cycle: 2, camera: 'front', bounce: 0.012, stance: 0.17,
    parts: { primary: ['pelvis'], linked: ['abdomen', 'legs'] },
    summary: '腰の横。アイソレーションではない！体重を右・左へキャッチボールするように。動きを途切れさせず、常にバウンスを感じる。',
    keys: [
      k(0, alliSide(R), 'smooth', '右へ体重を投げる（右から練習）'),
      k(1, alliSide(L), 'smooth', '左へキャッチボール ― カクカク切らない'),
    ],
    points: [
      '腰の横の動き。右から練習する。',
      'ポイント：腰をアイソレートしない。インターロックはアイソレーションとは違う。',
      '腰だけカクカク動かすのではなく、体重を右・左へ「トントン」とキャッチボールしていく。',
      '動きが切れないように（カットされないように）、いつも体でバウンスを感じながら腰を動かす。',
    ],
  },
  {
    id: 'alligator-hit', group: '⑦ 腰（横）', name: 'アリゲーター（アップダウン＋ヒット）', en: 'Alligator / with up-down', time: '16:19',
    bpm: 92, cycle: 2, camera: 'front', bounce: 0.006, stance: 0.17, legFromSolarPlexus: true,
    parts: { primary: ['pelvis'], linked: ['abdomen', 'legs'] },
    summary: 'アップダウンを加えて腰でヒット。みぞおちの下（背中は肩甲骨の下）から足だと思って動かす。',
    keys: [
      k(0, alliSide(R, 0.04), 'hit', '右でヒット（ダウン）'),
      k(0.5, alliSide(0, -0.015), 'smooth', 'アップ'),
      k(1, alliSide(L, 0.04), 'hit', '左でヒット（ダウン）'),
      k(1.5, alliSide(0, -0.015), 'smooth', 'アップ'),
    ],
    points: [
      'アップダウンを加えると、腰がヒットする（打ち付ける）。',
      '動かすときは、みぞおちの下から ― 背中側は肩甲骨の下から ― が「足」だと思って動かす。（画面では足として同じ色で表示）',
    ],
  },
];

export const GENERAL_POINTS = [
  { t: '0:02', s: 'インターロックには7つのムーブメントがある。その前にまず体のリズムの取り方（ボディダウン／ボディアップ）を身につける。' },
  { t: '3:09', s: '7つの動き：①首 ②胸の前 ③胸の後ろ ④胸の横 ⑤腰の前 ⑥腰の後ろ ⑦腰の横。' },
  { t: '3:43', s: 'この7つをマスターすることで、音楽に乗っていくことができる。' },
  { t: '3:55', s: '日本人は体幹（体の中心）を使うリズムに慣れていないので、しっかりトレーニングすること。' },
  { t: '13:19', s: 'インターロックはアイソレーションではない。各パーツが連動（インターロック）して動く。' },
  { t: '17:03', s: '体幹をしっかり動かし、音をよく聞き、体の力を抜いて、ビートの上に乗っかるように練習する。' },
  { t: '17:31', s: 'ダンスを踊るためにインターロックがある。インターロックが目的ではなく、うまく踊るためのもの。だから楽しくなきゃいけない、グルーヴがないといけない。' },
];
