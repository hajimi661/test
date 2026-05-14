// ============================================================
//  三国杀 — 数据定义
// ============================================================

// ----- 身份 -----
const IDENTITY = {
  LORD: 'lord',
  LOYALIST: 'loyalist',
  REBEL: 'rebel',
  TRAITOR: 'traitor',
};

const IDENTITY_LABEL = {
  [IDENTITY.LORD]: '主公',
  [IDENTITY.LOYALIST]: '忠臣',
  [IDENTITY.REBEL]: '反贼',
  [IDENTITY.TRAITOR]: '内奸',
};

// ----- 阶段 -----
const PHASE = {
  READY: 'ready',
  JUDGMENT: 'judgment',
  DRAW: 'draw',
  PLAY: 'play',
  DISCARD: 'discard',
  END: 'end',
};

const PHASE_LABEL = {
  [PHASE.READY]: '准备阶段',
  [PHASE.JUDGMENT]: '判定阶段',
  [PHASE.DRAW]: '摸牌阶段',
  [PHASE.PLAY]: '出牌阶段',
  [PHASE.DISCARD]: '弃牌阶段',
  [PHASE.END]: '结束阶段',
};

const PHASE_ORDER = [PHASE.READY, PHASE.JUDGMENT, PHASE.DRAW, PHASE.PLAY, PHASE.DISCARD, PHASE.END];

// ----- 花色 -----
const SUIT = { SPADE: 0, HEART: 1, CLUB: 2, DIAMOND: 3 };
const SUIT_SYMBOL = ['♠', '♥', '♣', '♦'];
const SUIT_COLOR = ['#222', '#c0392b', '#222', '#c0392b'];
const SUIT_NAME = ['黑桃', '红桃', '梅花', '方块'];

// ----- 卡牌数据库 58 张（标准版基本牌）-----
// 每项: [花色, 点数]
const CARD_TEMPLATES = {
  // 杀 × 30
  strike: [
    [0, 7], [0, 8], [0, 8], [0, 9], [0, 9], [0, 10], [0, 10],
    [2, 2], [2, 3], [2, 4], [2, 5], [2, 6], [2, 7], [2, 7],
    [2, 8], [2, 8], [2, 9], [2, 9], [2, 10], [2, 10], [2, 'J'],
    [2, 'J'],
    [1, 10], [1, 10],
    [3, 6], [3, 7], [3, 8], [3, 9], [3, 10], [3, 'K'],
  ],
  // 闪 × 15
  dodge: [
    [1, 2], [1, 2],
    [3, 2], [3, 3], [3, 4], [3, 5], [3, 6], [3, 7],
    [3, 8], [3, 9], [3, 10], [3, 'J'], [3, 'J'],
    [3, 'Q'], [3, 'K'],
  ],
  // 桃 × 8
  peach: [
    [1, 3], [1, 4], [1, 6], [1, 7], [1, 8], [1, 9], [1, 'Q'],
    [3, 'Q'],
  ],
  // 酒 × 5
  wine: [
    [0, 3], [0, 9], [2, 3], [2, 9], [3, 9],
  ],
};

// ----- 武将 -----
const HEROES = {
  liubei: { id: 'liubei', name: '刘备', skillId: 'renDe', skillName: '仁德', skillDesc: '出牌阶段可将手牌交给其他玩家，每回合限一次' },
  guanyu: { id: 'guanyu', name: '关羽', skillId: 'wuSheng', skillName: '武圣', skillDesc: '可以将任意红色手牌当【杀】使用' },
  sunquan: { id: 'sunquan', name: '孙权', skillId: 'zhiHeng', skillName: '制衡', skillDesc: '出牌阶段可弃置任意数量的手牌，摸等量的牌，每回合限一次' },
};

function createCardDB() {
  const db = [];
  let uid = 0;
  for (const [subtype, templates] of Object.entries(CARD_TEMPLATES)) {
    const nameMap = { strike: '杀', dodge: '闪', peach: '桃', wine: '酒' };
    const type = 'basic';
    const name = nameMap[subtype];
    for (const [suit, num] of templates) {
      db.push({ uid: uid++, name, type, subtype, suit, num: String(num) });
    }
  }
  return db;
}
