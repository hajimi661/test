// ============================================================
//  三国杀 — 服务端游戏引擎（标准版完整规则）
// ============================================================

// ---------- 常量 ----------
const IDENTITY = { LORD: 'lord', LOYALIST: 'loyalist', REBEL: 'rebel', TRAITOR: 'traitor' };
const IDENTITY_LABEL = { [IDENTITY.LORD]: '主公', [IDENTITY.LOYALIST]: '忠臣', [IDENTITY.REBEL]: '反贼', [IDENTITY.TRAITOR]: '内奸' };

const PHASE = { READY: 'ready', JUDGMENT: 'judgment', DRAW: 'draw', PLAY: 'play', DISCARD: 'discard', END: 'end' };
const PHASE_LABEL = {
  [PHASE.READY]: '准备阶段', [PHASE.JUDGMENT]: '判定阶段', [PHASE.DRAW]: '摸牌阶段',
  [PHASE.PLAY]: '出牌阶段', [PHASE.DISCARD]: '弃牌阶段', [PHASE.END]: '结束阶段',
};
const PHASE_ORDER = [PHASE.READY, PHASE.JUDGMENT, PHASE.DRAW, PHASE.PLAY, PHASE.DISCARD, PHASE.END];

const SUIT = { SPADE: 0, HEART: 1, CLUB: 2, DIAMOND: 3 };
const SUIT_SYMBOL = ['♠', '♥', '♣', '♦'];
const SUIT_NAME = ['黑桃', '红桃', '梅花', '方块'];
const CARD_TYPE = { BASIC: 'basic', EQUIP: 'equip', TRICK: 'trick' };
const EQUIP_SLOT = { WEAPON: 'weapon', ARMOR: 'armor', DEF_HORSE: 'defHorse', ATK_HORSE: 'atkHorse' };

// 武器范围
const WEAPON_RANGE = { zhuGeLianNu: 1, hanBingJian: 2, ciXiongShuangJian: 2, qingGangJian: 2, zhangba: 3, guanShiFu: 3, qingLong: 3, fangTianHuaJi: 4 };

const CARD_NAME = {
  strike: '杀', dodge: '闪', peach: '桃', wine: '酒',
  zhangba: '丈八蛇矛', guanShiFu: '贯石斧', qingLong: '青龙偃月刀',
  zhuGeLianNu: '诸葛连弩', hanBingJian: '寒冰剑', ciXiongShuangJian: '雌雄双股剑',
  fangTianHuaJi: '方天画戟', qingGangJian: '青釭剑',
  baGuaZhen: '八卦阵', renWangDun: '仁王盾',
  jueYing: '绝影', zhuaHuangFeiDian: '爪黄飞电', diLu: '的卢',
  chiTu: '赤兔', ziXing: '紫骍', daYuan: '大宛',
  wuZhongShengYou: '无中生有', guoHeChaiQiao: '过河拆桥', shunShouQianYang: '顺手牵羊',
  jueDou: '决斗', nanManRuQin: '南蛮入侵', wanJianQiFa: '万箭齐发',
  wuXieKeJi: '无懈可击', jieDaoShaRen: '借刀杀人', taoYuanJieYi: '桃园结义',
  huoGong: '火攻', tieSuoLianHuan: '铁索连环',
  leBuSiShu: '乐不思蜀', shanDian: '闪电', bingLiangCunDuan: '兵粮寸断',
};

// 标准版25武将
const HEROES = {
  liubei: { id: 'liubei', name: '刘备', hp: 4, skillId: 'renDe', skillName: '仁德', skillDesc: '出牌阶段可将手牌交给其他玩家，每阶段限一次；若给出不少于2张，回复1点体力', skillType: 'active' },
  guanyu: { id: 'guanyu', name: '关羽', hp: 4, skillId: 'wuSheng', skillName: '武圣', skillDesc: '你可以将一张红色牌当【杀】使用或打出', skillType: 'convert' },
  zhangfei: { id: 'zhangfei', name: '张飞', hp: 4, skillId: 'paoXiao', skillName: '咆哮', skillDesc: '锁定技，你使用【杀】无次数限制', skillType: 'passive' },
  zhaoyun: { id: 'zhaoyun', name: '赵云', hp: 4, skillId: 'longDan', skillName: '龙胆', skillDesc: '你可以将【杀】当【闪】、【闪】当【杀】使用或打出', skillType: 'convert' },
  zhugeliang: { id: 'zhugeliang', name: '诸葛亮', hp: 3, skillId: 'guanXing', skillName: '观星', skillDesc: '准备阶段，你可以观看牌堆顶X张牌并排列（X=min(存活数,5)）', skillType: 'active' },
  huangyueying: { id: 'huangyueying', name: '黄月英', hp: 3, skillId: 'jiZhi', skillName: '集智', skillDesc: '每当你使用非延时锦囊牌时，你可以摸一张牌', skillType: 'trigger' },
  machao: { id: 'machao', name: '马超', hp: 4, skillId: 'maShu', skillName: '马术', skillDesc: '锁定技，你计算与其他角色的距离-1', skillType: 'passive' },
  huangzhong: { id: 'huangzhong', name: '黄忠', hp: 4, skillId: 'lieGong', skillName: '烈弓', skillDesc: '你使用的【杀】被【闪】抵消时，可以弃置目标一张牌', skillType: 'trigger' },
  caocao: { id: 'caocao', name: '曹操', hp: 4, skillId: 'jianXiong', skillName: '奸雄', skillDesc: '每当你受到伤害后，你可以获得造成伤害的牌', skillType: 'trigger' },
  simayi: { id: 'simayi', name: '司马懿', hp: 3, skillId: 'fanKui', skillName: '反馈', skillDesc: '每当你受到伤害后，你可以获得伤害来源的一张手牌', skillType: 'trigger' },
  xiahoudun: { id: 'xiahoudun', name: '夏侯惇', hp: 4, skillId: 'gangLie', skillName: '刚烈', skillDesc: '每当你受到伤害后，你可以判定：不为红桃则伤害来源弃2牌或受1伤害', skillType: 'trigger' },
  zhangliao: { id: 'zhangliao', name: '张辽', hp: 4, skillId: 'tuXi', skillName: '突袭', skillDesc: '摸牌阶段，你可以放弃摸牌，获得至多两名其他角色各一张手牌', skillType: 'active' },
  xuchu: { id: 'xuchu', name: '许褚', hp: 4, skillId: 'luoYi', skillName: '裸衣', skillDesc: '摸牌阶段，你可以少摸一张牌，若如此做你使用【杀】或【决斗】伤害+1', skillType: 'active' },
  guojia: { id: 'guojia', name: '郭嘉', hp: 3, skillId: 'yiJi', skillName: '遗计', skillDesc: '每当你受到1点伤害后，你可以摸两张牌，然后将两张手牌交给任意角色', skillType: 'trigger' },
  zhenji: { id: 'zhenji', name: '甄姬', hp: 3, skillId: 'qingGuo', skillName: '倾国', skillDesc: '你可以将一张黑色手牌当【闪】使用或打出', skillType: 'convert' },
  sunquan: { id: 'sunquan', name: '孙权', hp: 4, skillId: 'zhiHeng', skillName: '制衡', skillDesc: '出牌阶段可弃置任意数量的牌，摸等量的牌，每阶段限一次', skillType: 'active' },
  ganning: { id: 'ganning', name: '甘宁', hp: 4, skillId: 'qiXi', skillName: '奇袭', skillDesc: '你可以将一张黑色牌当【过河拆桥】使用', skillType: 'convert' },
  lvmeng: { id: 'lvmeng', name: '吕蒙', hp: 4, skillId: 'keJi', skillName: '克己', skillDesc: '若你出牌阶段未使用或打出【杀】，可以跳过弃牌阶段', skillType: 'passive' },
  huanggai: { id: 'huanggai', name: '黄盖', hp: 4, skillId: 'kuRou', skillName: '苦肉', skillDesc: '出牌阶段，你可以失去1点体力，然后摸两张牌', skillType: 'active' },
  zhouyu: { id: 'zhouyu', name: '周瑜', hp: 3, skillId: 'fanJian', skillName: '反间', skillDesc: '出牌阶段，你可以令一名其他角色选择花色，展示你一张手牌，若不同则该角色受1伤害，该角色获得此牌', skillType: 'active' },
  daqiao: { id: 'daqiao', name: '大乔', hp: 3, skillId: 'guoSe', skillName: '国色', skillDesc: '你可以将一张方块牌当【乐不思蜀】使用', skillType: 'convert' },
  luxun: { id: 'luxun', name: '陆逊', hp: 3, skillId: 'qianXun', skillName: '谦逊', skillDesc: '锁定技，你不能成为【乐不思蜀】和【顺手牵羊】的目标', skillType: 'passive' },
  sunshangxiang: { id: 'sunshangxiang', name: '孙尚香', hp: 3, skillId: 'jieYin', skillName: '结姻', skillDesc: '出牌阶段，你可以弃两张手牌，选择一名已受伤男性角色，各回复1体力', skillType: 'active' },
  huatuo: { id: 'huatuo', name: '华佗', hp: 3, skillId: 'jiJiu', skillName: '急救', skillDesc: '你的回合外，你可以将一张红色牌当【桃】使用', skillType: 'convert' },
  lvbu: { id: 'lvbu', name: '吕布', hp: 4, skillId: 'wuShuang', skillName: '无双', skillDesc: '锁定技，你使用的【杀】需两张【闪】抵消；与你【决斗】的角色每次需出两张【杀】', skillType: 'passive' },
  diaochan: { id: 'diaochan', name: '貂蝉', hp: 3, skillId: 'liJian', skillName: '离间', skillDesc: '出牌阶段，你可以弃一张牌，令一名男性角色对另一名男性角色使用【杀】，每阶段限一次', skillType: 'active' },
};

const CARD_TEMPLATES = {
  strike: [[0,7],[0,8],[0,8],[0,9],[0,9],[0,10],[0,10],[2,2],[2,3],[2,4],[2,5],[2,6],[2,7],[2,7],[2,8],[2,8],[2,9],[2,9],[2,10],[2,10],[2,'J'],[2,'J'],[1,10],[1,10],[3,6],[3,7],[3,8],[3,9],[3,10],[3,'K']],
  dodge: [[1,2],[1,2],[3,2],[3,3],[3,4],[3,5],[3,6],[3,7],[3,8],[3,9],[3,10],[3,'J'],[3,'J'],[3,'Q'],[3,'K']],
  peach: [[1,3],[1,4],[1,6],[1,7],[1,8],[1,9],[1,'Q'],[3,'Q']],
  wine: [[0,3],[0,9],[2,3],[2,9],[3,9]],
  zhangba: [[2,'Q']], guanShiFu: [[0,5]], qingLong: [[0,6]], zhuGeLianNu: [[0,1]],
  hanBingJian: [[2,2]], ciXiongShuangJian: [[0,2]], fangTianHuaJi: [[1,'K']], qingGangJian: [[1,3]],
  baGuaZhen: [[0,'K'],[2,'K']], renWangDun: [[2,'J']],
  jueYing: [[2,5]], zhuaHuangFeiDian: [[1,5]], diLu: [[1,'K']],
  chiTu: [[3,5]], ziXing: [[3,'K']], daYuan: [[3,3]],
  wuZhongShengYou: [[1,7],[1,8],[1,9],[1,'J']],
  guoHeChaiQiao: [[0,3],[0,4],[1,'Q'],[1,'K']],
  shunShouQianYang: [[0,3],[0,4],[0,'J']],
  jueDou: [[0,'A'],[2,'A']],
  nanManRuQin: [[0,7],[2,7]],
  wanJianQiFa: [[1,'A']],
  wuXieKeJi: [[0,'J'],[0,'Q'],[2,'Q'],[2,'K']],
  jieDaoShaRen: [[2,'J']],
  taoYuanJieYi: [[1,'A']],
  huoGong: [[2,'J'],[2,'Q']],
  tieSuoLianHuan: [[2,10],[2,'J'],[0,'J'],[0,'Q']],
  leBuSiShu: [[2,6],[2,'J'],[1,6]],
  shanDian: [[0,'A'],[1,'A']],
  bingLiangCunDuan: [[0,10]],
};

function createCardDB() {
  const db = []; let uid = 0;
  const typeMap = {
    strike:'basic',dodge:'basic',peach:'basic',wine:'basic',
    zhangba:'equip',guanShiFu:'equip',qingLong:'equip',zhuGeLianNu:'equip',hanBingJian:'equip',ciXiongShuangJian:'equip',fangTianHuaJi:'equip',qingGangJian:'equip',
    baGuaZhen:'equip',renWangDun:'equip',jueYing:'equip',zhuaHuangFeiDian:'equip',diLu:'equip',chiTu:'equip',ziXing:'equip',daYuan:'equip',
  };
  const slotMap = {
    zhangba:'weapon',guanShiFu:'weapon',qingLong:'weapon',zhuGeLianNu:'weapon',hanBingJian:'weapon',ciXiongShuangJian:'weapon',fangTianHuaJi:'weapon',qingGangJian:'weapon',
    baGuaZhen:'armor',renWangDun:'armor',jueYing:'defHorse',zhuaHuangFeiDian:'defHorse',diLu:'defHorse',chiTu:'atkHorse',ziXing:'atkHorse',daYuan:'atkHorse',
  };
  for (const [subtype, templates] of Object.entries(CARD_TEMPLATES)) {
    for (const [suit, num] of templates) {
      const card = { uid: uid++, name: CARD_NAME[subtype], type: typeMap[subtype] || 'trick', subtype, suit, num: String(num) };
      if (slotMap[subtype]) card.equipSlot = slotMap[subtype];
      if (WEAPON_RANGE[subtype]) card.range = WEAPON_RANGE[subtype];
      db.push(card);
    }
  }
  return db;
}

// ---------- Deck ----------
class Deck {
  constructor() { this.cards = []; this.discards = []; }
  init() { this.cards = createCardDB(); this.discards = []; this.shuffle(); }
  shuffle() { for (let i = this.cards.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]]; } }
  draw(n) {
    const drawn = [];
    for (let i = 0; i < n; i++) { if (this.cards.length === 0) this.recycle(); if (this.cards.length === 0) break; drawn.push(this.cards.pop()); }
    return drawn;
  }
  recycle() { if (this.discards.length === 0) return; this.cards.push(...this.discards); this.discards = []; this.shuffle(); }
  discard(...cards) { this.discards.push(...cards); }
  get totalRemaining() { return this.cards.length; }
  get totalDiscarded() { return this.discards.length; }
}

// ---------- Player ----------
class Player {
  constructor(id, name) {
    this.id = id; this.name = name; this.identity = null;
    this.hp = 4; this.maxHp = 4;
    this.hand = []; this.equipment = {}; this.judgments = [];
    this.alive = true; this.hasUsedStrike = false; this.wineBuff = false;
    this.identityRevealed = false; this.hero = null; this.skillsUsed = {};
    this.isHuman = true; this.hasUsedStrikeThisTurn = false;
    this.luoYiBuff = false; this.keJiUsedStrike = false;
    this.chained = false; // 铁索连环状态
  }
  setIdentity(id) { this.identity = id; }
  resetTurnState() {
    this.hasUsedStrike = false; this.wineBuff = false; this.skillsUsed = {};
    this.hasUsedStrikeThisTurn = false; this.luoYiBuff = false; this.keJiUsedStrike = false;
  }
  addCards(cards) { this.hand.push(...cards); }
  removeCard(index) { if (index < 0 || index >= this.hand.length) return null; return this.hand.splice(index, 1)[0]; }
  findCard(subtype) { return this.hand.findIndex(c => c.subtype === subtype); }
  get handLimit() { return Math.max(this.hp, 0); }
  get isLord() { return this.identity === IDENTITY.LORD; }
  get isLoyalist() { return this.identity === IDENTITY.LOYALIST; }
  get isRebel() { return this.identity === IDENTITY.REBEL; }
  get isTraitor() { return this.identity === IDENTITY.TRAITOR; }
  isAllyOf(other) { if (!this.identity || !other.identity) return false; return this.identity === other.identity; }
  isEnemyOf(other) { if (!this.identity || !other.identity) return false; return this.identity !== other.identity; }
  get weaponRange() { return this.equipment.weapon ? (WEAPON_RANGE[this.equipment.weapon.subtype] || 1) : 1; }
  get attackRangeBonus() { return this.equipment.atkHorse ? 1 : 0; }
  get defenseRangeBonus() { return this.equipment.defHorse ? 1 : 0; }
  hasArmor() { return !!this.equipment.armor; }
  armorType() { return this.equipment.armor ? this.equipment.armor.subtype : null; }
  hasTargetRestriction(subtype) {
    if (subtype === 'leBuSiShu' || subtype === 'shunShouQianYang') {
      return this.hero && this.hero.skillId === 'qianXun';
    }
    return false;
  }
}

// ---------- 身份分配 ----------
function getIdentityDistribution(n) {
  const m = { 2:[0,1,0], 3:[0,2,0], 4:[0,3,0], 5:[1,2,1], 6:[1,3,1], 7:[2,3,1], 8:[2,4,1], 9:[3,4,1], 10:[3,5,1] };
  const [loy, reb, tra] = m[n] || [0, n-1, 0];
  const ids = [IDENTITY.LORD];
  for (let i = 0; i < loy; i++) ids.push(IDENTITY.LOYALIST);
  for (let i = 0; i < reb; i++) ids.push(IDENTITY.REBEL);
  for (let i = 0; i < tra; i++) ids.push(IDENTITY.TRAITOR);
  for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
  return ids;
}

// ---------- GameEngine ----------
class SanguoshaGame {
  constructor(playerIds, playerNames) {
    this.deck = new Deck(); this.players = []; this.currentIdx = 0;
    this.phase = null; this.turnNum = 0; this.status = 'playing'; this.winner = null;
    this.logs = []; this.waitingFor = null; this.waitingPlayerId = null;
    this.pendingResponse = null; this.discardNeeded = 0; this._listeners = {};
    this._busy = false;
    for (let i = 0; i < playerIds.length; i++) {
      this.players.push(new Player(playerIds[i], playerNames[i] || `玩家${i + 1}`));
    }
  }

  on(event, fn) { if (!this._listeners[event]) this._listeners[event] = []; this._listeners[event].push(fn); }
  _emit(event, data) { if (this._listeners[event]) this._listeners[event].forEach(fn => fn(data)); }

  // ----- 初始化 -----
  start() {
    this.deck.init(); this.assignIdentities(); this.assignHeroes();
    for (const p of this.players) {
      const count = p.isLord ? 5 : 4;
      p.addCards(this.deck.draw(count));
      p.maxHp = p.hero ? p.hero.hp : 4;
      p.hp = p.isLord ? p.maxHp + 1 : p.maxHp;
      if (p.isLord) p.maxHp = p.hp;
      p.identityRevealed = false;
    }
    this.log('游戏开始！');
    this.currentIdx = 0;
    this.startTurn();
  }

  assignIdentities() {
    const ids = getIdentityDistribution(this.players.length);
    for (let i = 0; i < this.players.length; i++) this.players[i].setIdentity(ids[i]);
  }

  assignHeroes() {
    const pool = Object.keys(HEROES);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    for (let i = 0; i < this.players.length; i++) {
      this.players[i].hero = HEROES[shuffled[i % shuffled.length]];
    }
  }

  get cur() { return this.players[this.currentIdx]; }

  // ----- 公共/私有状态 -----
  getPublicState() {
    return {
      players: this.players.map(p => ({
        id: p.id, name: p.name, heroName: p.hero ? p.hero.name : '',
        hp: p.hp, maxHp: p.maxHp, alive: p.alive,
        cardCount: p.alive ? p.hand.length : 0,
        identity: p.identityRevealed ? p.identity : null,
        identityRevealed: p.identityRevealed,
        equipment: this._getEquipmentSummary(p),
        judgments: p.judgments.map(c => ({ name: c.name, subtype: c.subtype, suit: c.suit, num: c.num })),
      })),
      currentPlayerId: this.cur ? this.cur.id : null,
      phase: this.phase, phaseLabel: this.phase ? PHASE_LABEL[this.phase] : '等待中',
      turnNum: this.turnNum, deckCount: this.deck.totalRemaining,
      discardCount: this.deck.totalDiscarded,
      discardPile: this.deck.discards.slice(-20).map(c => ({ name: c.name, subtype: c.subtype, suit: c.suit, num: c.num })),
      logs: this.logs.slice(-30),
      winner: this.winner, status: this.status,
    };
  }

  _getEquipmentSummary(p) {
    const eq = {};
    for (const [slot, card] of Object.entries(p.equipment)) {
      eq[slot] = { name: card.name, subtype: card.subtype, suit: card.suit, num: card.num };
    }
    return eq;
  }

  getStateForPlayer(playerId) {
    const p = this.players.find(x => x.id === playerId);
    if (!p) return null;
    return {
      hand: p.hand, identity: p.identity, identityLabel: IDENTITY_LABEL[p.identity],
      hero: p.hero, heroSkill: p.hero ? { name: p.hero.skillName, desc: p.hero.skillDesc || '', used: p.skillsUsed[p.hero.skillId] } : null,
      hasUsedStrike: p.hasUsedStrike, wineBuff: p.wineBuff,
    };
  }

  // ----- 距离计算（最短路径）-----
  calcDistance(fromIdx, toIdx) {
    const n = this.players.length;
    // 顺时针距离
    let cw = 0;
    for (let i = 1; i < n; i++) {
      const idx = (fromIdx + i) % n;
      if (this.players[idx].alive) { cw++; if (idx === toIdx) break; }
    }
    // 逆时针距离
    let ccw = 0;
    for (let i = 1; i < n; i++) {
      const idx = (fromIdx - i + n) % n;
      if (this.players[idx].alive) { ccw++; if (idx === toIdx) break; }
    }
    let dist = Math.min(cw, ccw);
    // 马术：计算距离-1
    const from = this.players[fromIdx];
    if (from.hero && from.hero.skillId === 'maShu') dist = Math.max(1, dist - 1);
    // 攻击方-1马
    dist = Math.max(1, dist - from.attackRangeBonus);
    // 防御方+1马
    dist += this.players[toIdx].defenseRangeBonus;
    return dist;
  }

  canReach(srcIdx, targetIdx) {
    const src = this.players[srcIdx];
    const dist = this.calcDistance(srcIdx, targetIdx);
    return dist <= src.weaponRange;
  }

  // ----- 回合流转 -----
  startTurn() {
    this.currentIdx = this.nextAliveFrom(this.currentIdx);
    if (this.currentIdx === -1) return;
    this.turnNum++;
    const p = this.cur;
    p.resetTurnState();
    this.phase = PHASE.READY;
    this._emit('stateChanged');
    this.log(`--- 第 ${this.turnNum} 回合 · ${p.name} 的回合 ---`);
    this._emit('turnStart', { playerId: p.id, playerName: p.name, turnNum: this.turnNum });
    this.runPhase();
  }

  nextAliveFrom(from) {
    for (let i = 0; i < this.players.length; i++) {
      const idx = (from + 1 + i) % this.players.length;
      if (this.players[idx].alive) return idx;
    }
    return -1;
  }

  runPhase() {
    if (this.status !== 'playing') return;
    switch (this.phase) {
      case PHASE.READY: this.nextPhase(); return;
      case PHASE.JUDGMENT: this.runJudgment(); return;
      case PHASE.DRAW: this.runDraw(); return;
      case PHASE.PLAY: this.runPlay(); return;
      case PHASE.DISCARD: this.runDiscard(); return;
      case PHASE.END: this.runEnd(); return;
    }
  }

  nextPhase() {
    const idx = PHASE_ORDER.indexOf(this.phase);
    if (idx < PHASE_ORDER.length - 1) { this.phase = PHASE_ORDER[idx + 1]; this._emit('stateChanged'); this.runPhase(); }
  }

  // 判定阶段
  runJudgment() {
    const p = this.cur;
    if (p.judgments.length === 0) { this.nextPhase(); return; }
    this._resolveNextJudgment();
  }

  _resolveNextJudgment() {
    const p = this.cur;
    if (p.judgments.length === 0) { this.nextPhase(); return; }

    const judgment = p.judgments.shift(); // 取出并移除第一张判定牌
    const result = this.deck.draw(1)[0];
    this.log(`${p.name} 判定【${judgment.name}】：${result.name}(${SUIT_SYMBOL[result.suit]}${result.num})`);
    this.deck.discard(result);
    this._emit('stateChanged');

    // 乐不思蜀：判定非红桃则跳过出牌阶段
    if (judgment.subtype === 'leBuSiShu') {
      if (result.suit !== SUIT.HEART) {
        this.log(`${p.name} 判定失败，跳过出牌阶段`);
        p.judgments = []; // 跳过出牌阶段后，剩余判定也不再处理（规则：跳过出牌阶段）
        this.phase = PHASE.DISCARD;
        this._emit('stateChanged');
        this.runPhase();
        return;
      }
      this.log(`${p.name} 判定成功，不受影响`);
    }
    // 兵粮寸断：判定非梅花则跳过摸牌阶段
    else if (judgment.subtype === 'bingLiangCunDuan') {
      if (result.suit !== SUIT.CLUB) {
        this.log(`${p.name} 判定失败，跳过摸牌阶段`);
        p.judgments = []; // 跳过摸牌阶段后，剩余判定也不再处理
        this.phase = PHASE.PLAY;
        this._emit('stateChanged');
        this.runPhase();
        return;
      }
      this.log(`${p.name} 判定成功，不受影响`);
    }
    // 闪电：判定黑桃2-9则受3点伤害，否则传给下家
    else if (judgment.subtype === 'shanDian') {
      if (result.suit === SUIT.SPADE && parseInt(result.num) >= 2 && parseInt(result.num) <= 9) {
        this.log(`${p.name} 被闪电击中！受到3点雷电伤害`);
        this.dealDamage(this.currentIdx, this.currentIdx, 3, 'thunder');
      } else {
        const nextIdx = this.nextAliveFrom(this.currentIdx);
        if (nextIdx !== -1 && nextIdx !== this.currentIdx) {
          const nextP = this.players[nextIdx];
          nextP.judgments.push(judgment);
          this.log(`闪电传递给 ${nextP.name}`);
        }
      }
    }

    // 继续判定下一张
    this.delayed(() => this._resolveNextJudgment());
  }

  // 摸牌阶段
  runDraw() {
    const p = this.cur;
    // 许褚裸衣：自动触发（AI/玩家都可以选择）
    if (p.hero && p.hero.skillId === 'luoYi' && !p.skillsUsed.luoYi) {
      p.luoYiBuff = true;
      p.skillsUsed.luoYi = true;
      const drawn = this.deck.draw(1);
      p.addCards(drawn);
      this.log(`${p.name} 发动【裸衣】，少摸1张牌，本回合使用【杀】或【决斗】伤害+1`);
      this._emit('drawCards', { playerId: p.id, count: 1, cards: drawn });
    }
    // 周瑜英姿：多摸一张
    else if (p.hero && p.hero.skillId === 'yingZi') {
      const drawn = this.deck.draw(3);
      p.addCards(drawn);
      this.log(`${p.name} 【英姿】摸了3张牌`);
      this._emit('drawCards', { playerId: p.id, count: 3, cards: drawn });
    }
    else {
      const drawn = this.deck.draw(2);
      p.addCards(drawn);
      this.log(`${p.name} 摸了2张牌`);
      this._emit('drawCards', { playerId: p.id, count: 2, cards: drawn });
    }
    this._emit('stateChanged');
    this.nextPhase();
  }

  // 出牌阶段
  runPlay() {
    this._emit('stateChanged');
    this.waitingFor = 'play';
    this.waitingPlayerId = this.cur.id;
    this._emit('awaitPlay', { playerId: this.cur.id });
  }

  // 弃牌阶段
  runDiscard() {
    const p = this.cur;
    // 吕蒙克己：未使用杀可跳过弃牌
    if (p.hero && p.hero.skillId === 'keJi' && !p.keJiUsedStrike) {
      this.log(`${p.name} 【克己】跳过弃牌阶段`);
      this.nextPhase();
      return;
    }
    const limit = p.handLimit;
    if (p.hand.length > limit) {
      const need = p.hand.length - limit;
      this.discardNeeded = need;
      this.waitingFor = 'discard';
      this.waitingPlayerId = p.id;
      this.log(`${p.name} 需要弃 ${need} 张牌`);
      this._emit('stateChanged');
      this._emit('awaitDiscard', { playerId: p.id, count: need });
    } else { this.nextPhase(); }
  }

  // 结束阶段
  runEnd() {
    this.log(`${this.cur.name} 结束回合`);
    this._emit('stateChanged');
    this._emit('turnEnd', { playerId: this.cur.id });
    this.delayed(() => this.startTurn());
  }

  // ----- 玩家动作 -----
  playerPlayCard(playerId, cardIdx, targetIdx) {
    if (this.waitingFor !== 'play' || this.waitingPlayerId !== playerId) return { ok: false, msg: '不是你的出牌阶段' };
    const p = this.cur;
    if (cardIdx < 0 || cardIdx >= p.hand.length) return { ok: false, msg: '无效手牌' };
    const card = p.hand[cardIdx];

    // 1. 基本牌（按 subtype 精确匹配）
    if (card.subtype === 'strike') return this.useStrike(cardIdx, targetIdx);
    if (card.subtype === 'peach') return this.usePeach(cardIdx);
    if (card.subtype === 'wine') return this.useWine(cardIdx);
    if (card.subtype === 'dodge') return { ok: false, msg: '【闪】不能主动使用' };

    // 2. 装备牌（equipSlot 字段 或 type==='equip' 双重判断）
    const VALID_SLOTS = ['weapon', 'armor', 'defHorse', 'atkHorse'];
    if ((card.equipSlot && VALID_SLOTS.includes(card.equipSlot)) || card.type === 'equip') {
      return this.useEquipment(cardIdx);
    }

    // 3. 锦囊牌（所有非基本非装备的牌都是锦囊）
    return this.useTrick(cardIdx, targetIdx);
  }

  playerEndPlay(playerId) {
    if (this.waitingFor !== 'play' || this.waitingPlayerId !== playerId) return { ok: false };
    this.waitingFor = null; this.waitingPlayerId = null;
    this.phase = PHASE.DISCARD;
    this._emit('stateChanged');
    this.runPhase();
    return { ok: true };
  }

  playerDiscard(playerId, indices) {
    if (this.waitingFor !== 'discard' || this.waitingPlayerId !== playerId) return { ok: false };
    if (indices.length !== this.discardNeeded) return { ok: false, msg: `需要弃 ${this.discardNeeded} 张` };
    const p = this.cur;
    const sorted = [...indices].sort((a, b) => b - a);
    for (const idx of sorted) { const card = p.removeCard(idx); if (card) this.deck.discard(card); }
    this.log(`${p.name} 弃置了 ${indices.length} 张牌`);
    this.waitingFor = null; this.waitingPlayerId = null;
    this.nextPhase();
    return { ok: true };
  }

  playerRespond(playerId, cardIdx) {
    if (this.waitingFor !== 'response' || !this.pendingResponse || this.pendingResponse.playerId !== playerId)
      return { ok: false, msg: '不在响应阶段' };
    const p = this.players.find(x => x.id === playerId);
    if (!p || !p.alive) return { ok: false, msg: '玩家无效' };
    if (cardIdx < 0 || cardIdx >= p.hand.length) return { ok: false, msg: '索引越界' };
    const card = p.hand[cardIdx];

    // 检查牌类型（支持转换技能）
    const needed = this.pendingResponse.type;
    let valid = card.subtype === needed;

    // 龙胆：杀当闪
    if (!valid && needed === 'dodge' && card.subtype === 'strike' && p.hero && p.hero.skillId === 'longDan') valid = true;
    // 龙胆：闪当杀
    if (!valid && needed === 'strike' && card.subtype === 'dodge' && p.hero && p.hero.skillId === 'longDan') valid = true;
    // 倾国：黑色手牌当闪
    if (!valid && needed === 'dodge' && (card.suit === SUIT.SPADE || card.suit === SUIT.CLUB) && p.hero && p.hero.skillId === 'qingGuo') valid = true;
    // 急救：回合外红色牌当桃
    if (!valid && needed === 'peach' && (card.suit === SUIT.HEART || card.suit === SUIT.DIAMOND) && p.hero && p.hero.skillId === 'jiJiu' && this.cur.id !== playerId) valid = true;
    // 武圣：红色牌当杀
    if (!valid && needed === 'strike' && (card.suit === SUIT.HEART || card.suit === SUIT.DIAMOND) && p.hero && p.hero.skillId === 'wuSheng') valid = true;

    if (!valid) return { ok: false, msg: `牌类型不匹配:需要${needed},实际${card.subtype}` };

    p.removeCard(cardIdx); this.deck.discard(card);
    this.waitingFor = null;
    const cb = this.pendingResponse.onUse;
    this.pendingResponse = null;
    this._emit('stateChanged');
    if (cb) cb();
    return { ok: true };
  }

  playerPassResponse(playerId) {
    if (this.waitingFor !== 'response' || !this.pendingResponse || this.pendingResponse.playerId !== playerId)
      return { ok: false };
    this.waitingFor = null;
    const cb = this.pendingResponse.onPass;
    this.pendingResponse = null;
    this._emit('stateChanged');
    if (cb) cb();
    return { ok: true };
  }

  // ----- 装备系统 -----
  useEquipment(cardIdx) {
    const p = this.cur;
    const card = p.hand[cardIdx];
    // 确定装备槽位：优先用 equipSlot，否则从 WEAPON_RANGE 等推断
    let slot = card.equipSlot;
    if (!slot) {
      if (WEAPON_RANGE[card.subtype]) slot = 'weapon';
      else if (['baGuaZhen', 'renWangDun'].includes(card.subtype)) slot = 'armor';
      else if (['jueYing', 'zhuaHuangFeiDian', 'diLu'].includes(card.subtype)) slot = 'defHorse';
      else if (['chiTu', 'ziXing', 'daYuan'].includes(card.subtype)) slot = 'atkHorse';
    }
    if (!slot) return { ok: false, msg: '不是装备牌' };
    const old = p.equipment[slot];
    p.removeCard(cardIdx);
    p.equipment[slot] = card;
    if (old) {
      p.hand.push(old);
      this.log(`${p.name} 更换装备：卸下【${old.name}】，装备【${card.name}】`);
    } else {
      this.log(`${p.name} 装备了【${card.name}】`);
    }
    this._emit('stateChanged');
    return { ok: true };
  }

  // ----- 杀 -----
  useStrike(cardIdx, targetIdx) {
    const src = this.cur;
    // 张飞咆哮 / 诸葛连弩：无次数限制
    const isPaoXiao = src.hero && src.hero.skillId === 'paoXiao';
    const isLianNu = src.equipment.weapon && src.equipment.weapon.subtype === 'zhuGeLianNu';
    if (src.hasUsedStrike && !isPaoXiao && !isLianNu) return { ok: false, msg: '本回合已出过杀' };
    if (!this.players[targetIdx] || !this.players[targetIdx].alive || targetIdx === this.currentIdx)
      return { ok: false, msg: '无效目标' };
    if (!this.canReach(this.currentIdx, targetIdx)) return { ok: false, msg: '目标不在攻击范围内' };

    const card = src.hand[cardIdx];
    let isStrike = card.subtype === 'strike';
    if (!isStrike && src.hero && src.hero.skillId === 'wuSheng' && (card.suit === SUIT.HEART || card.suit === SUIT.DIAMOND)) isStrike = true;
    if (!isStrike && src.hero && src.hero.skillId === 'longDan' && card.subtype === 'dodge') isStrike = true;
    // 丈八蛇矛：两张牌当杀（简化：任意手牌可当杀）
    if (!isStrike && src.equipment.weapon && src.equipment.weapon.subtype === 'zhangba') isStrike = true;
    if (!isStrike) return { ok: false, msg: '不是杀' };

    src.removeCard(cardIdx); this.deck.discard(card);
    src.hasUsedStrike = true; src.keJiUsedStrike = true;
    const damage = (src.wineBuff ? 2 : 1) + (src.luoYiBuff ? 1 : 0);
    src.wineBuff = false; src.luoYiBuff = false;

    const target = this.players[targetIdx];
    const weaponType = src.equipment.weapon ? src.equipment.weapon.subtype : null;
    const ignoreArmor = weaponType === 'qingGangJian';
    const needsTwoDodges = src.hero && src.hero.skillId === 'wuShuang';

    this.log(`${src.name} 对 ${target.name} 使用了【杀】`);
    this._emit('stateChanged');

    // 寒冰剑：命中时改为弃置目标两张牌
    if (weaponType === 'hanBingJian') {
      this.requestResponse(targetIdx, 'dodge',
        () => {
          for (let i = 0; i < 2; i++) {
            if (target.hand.length > 0) { const ri = Math.floor(Math.random() * target.hand.length); const c = target.removeCard(ri); this.deck.discard(c); }
          }
          this.log(`${src.name} 【寒冰剑】弃置了 ${target.name} 的两张牌`);
          this._restorePlayState();
        },
        () => { this.log(`${target.name} 使用了【闪】`); this._restorePlayState(); }
      );
      return { ok: true };
    }

    this.requestResponse(targetIdx, 'dodge',
      () => {
        // 杀命中
        // 雌雄双股剑：命中时弃置目标一张牌
        if (weaponType === 'ciXiongShuangJian' && target.hand.length > 0) {
          const ri = Math.floor(Math.random() * target.hand.length); const c = target.removeCard(ri); this.deck.discard(c);
          this.log(`${src.name} 【雌雄双股剑】弃置了 ${target.name} 的一张牌`);
        }
        this.dealDamage(this.currentIdx, targetIdx, damage, 'normal', ignoreArmor);
      },
      () => {
        // 目标出闪
        if (needsTwoDodges) {
          const hasMoreDodge = target.hand.some(c => c.subtype === 'dodge');
          if (hasMoreDodge) {
            this.requestResponse(targetIdx, 'dodge',
              () => { this.dealDamage(this.currentIdx, targetIdx, damage, 'normal', ignoreArmor); },
              () => { this.log(`${target.name} 使用了两张【闪】抵消了【杀】`); }
            );
          } else {
            this.dealDamage(this.currentIdx, targetIdx, damage, 'normal', ignoreArmor);
          }
        } else {
          this.log(`${target.name} 使用了【闪】`);
          // 青龙偃月刀：被闪后可再出杀
          if (weaponType === 'qingLong') {
            const hasMoreStrike = src.hand.some(c => c.subtype === 'strike');
            if (hasMoreStrike) {
              const nextStrikeIdx = src.hand.findIndex(c => c.subtype === 'strike');
              if (nextStrikeIdx !== -1) {
                const c = src.removeCard(nextStrikeIdx); this.deck.discard(c);
                this.log(`${src.name} 【青龙偃月刀】追加了一张【杀】`);
                this.requestResponse(targetIdx, 'dodge',
                  () => { this.dealDamage(this.currentIdx, targetIdx, damage, 'normal', ignoreArmor); },
                  () => { this.log(`${target.name} 使用了【闪】`); }
                );
                return;
              }
            }
          }
          // 烈弓：杀被闪时弃置目标一张牌
          if (src.hero && src.hero.skillId === 'lieGong' && target.hand.length > 0) {
            if (target.hand.length > 0) {
              const randIdx = Math.floor(Math.random() * target.hand.length);
              const stolen = target.removeCard(randIdx);
              this.deck.discard(stolen);
              this.log(`${src.name} 【烈弓】弃置了 ${target.name} 的一张牌`);
            }
          }
        }
      }
    );
    return { ok: true };
  }

  // ----- 桃 -----
  usePeach(cardIdx) {
    const p = this.cur;
    if (p.hp >= p.maxHp) return { ok: false, msg: '体力已满' };
    const card = p.removeCard(cardIdx);
    this.deck.discard(card);
    p.hp = Math.min(p.hp + 1, p.maxHp);
    this.log(`${p.name} 使用了【桃】，回复1点体力`);
    this._emit('stateChanged');
    return { ok: true };
  }

  // ----- 酒 -----
  useWine(cardIdx) {
    const p = this.cur;
    const card = p.removeCard(cardIdx);
    this.deck.discard(card);
    p.wineBuff = true;
    if (p.hp <= 0) { p.hp = Math.min(p.hp + 1, p.maxHp); this.log(`${p.name} 使用了【酒】自救`); }
    else { this.log(`${p.name} 使用了【酒】`); }
    this._emit('stateChanged');
    return { ok: true };
  }

  // ----- 锦囊牌 -----
  useTrick(cardIdx, targetIdx) {
    const p = this.cur;
    const card = p.hand[cardIdx];
    switch (card.subtype) {
      case 'wuZhongShengYou': return this.useWuZhong(cardIdx);
      case 'guoHeChaiQiao': return this.useGuoHe(cardIdx, targetIdx);
      case 'shunShouQianYang': return this.useShunShou(cardIdx, targetIdx);
      case 'leBuSiShu': return this.useLeBu(cardIdx, targetIdx);
      case 'taoYuanJieYi': return this.useTaoYuan(cardIdx);
      case 'nanManRuQin': return this.useNanMan(cardIdx);
      case 'wanJianQiFa': return this.useWanJian(cardIdx);
      case 'jueDou': return this.useJueDou(cardIdx, targetIdx);
      case 'wuXieKeJi': return { ok: false, msg: '无懈可击需在锦囊生效时使用' };
      case 'huoGong': return this.useHuoGong(cardIdx, targetIdx);
      case 'tieSuoLianHuan': return this.useTieSuo(cardIdx, targetIdx);
      case 'jieDaoShaRen': return this.useJieDao(cardIdx, targetIdx);
      case 'shanDian': return this.useShanDian(cardIdx, targetIdx);
      case 'bingLiangCunDuan': return this.useBingLiang(cardIdx, targetIdx);
      default: return { ok: false, msg: `锦囊【${card.name}】暂未实现` };
    }
  }

  useWuZhong(cardIdx) {
    const p = this.cur;
    const card = p.removeCard(cardIdx);
    this.deck.discard(card);
    const drawn = this.deck.draw(2);
    p.addCards(drawn);
    this.log(`${p.name} 使用了【无中生有】，摸了2张牌`);
    // 黄月英集智
    this._triggerJiZhi(p);
    this._emit('stateChanged');
    return { ok: true };
  }

  useGuoHe(cardIdx, targetIdx) {
    const target = this.players[targetIdx];
    if (!target || !target.alive || targetIdx === this.currentIdx) return { ok: false, msg: '无效目标' };
    const p = this.cur;
    const card = p.removeCard(cardIdx);
    this.deck.discard(card);
    if (this._checkWuXie(p, '过河拆桥')) return { ok: true };
    // 陆逊谦逊检查
    if (target.hasTargetRestriction('guoHeChaiQiao')) {
      this.log(`${target.name} 【谦逊】不能成为过河拆桥的目标`);
      this._emit('stateChanged');
      return { ok: true };
    }
    // 弃置目标一张牌（手牌或装备随机）
    const allCards = [...target.hand];
    if (target.equipment.weapon) allCards.push(target.equipment.weapon);
    if (target.equipment.armor) allCards.push(target.equipment.armor);
    if (target.equipment.defHorse) allCards.push(target.equipment.defHorse);
    if (target.equipment.atkHorse) allCards.push(target.equipment.atkHorse);
    if (allCards.length > 0) {
      const randIdx = Math.floor(Math.random() * allCards.length);
      const chosen = allCards[randIdx];
      // 从手牌移除
      const handIdx = target.hand.indexOf(chosen);
      if (handIdx !== -1) { target.removeCard(handIdx); }
      // 从装备移除
      else {
        for (const slot of Object.keys(target.equipment)) {
          if (target.equipment[slot] === chosen) { delete target.equipment[slot]; break; }
        }
      }
      this.deck.discard(chosen);
      this.log(`${p.name} 对 ${target.name} 使用了【过河拆桥】，弃置了一张牌`);
    }
    this._triggerJiZhi(p);
    this._emit('stateChanged');
    return { ok: true };
  }

  useShunShou(cardIdx, targetIdx) {
    const target = this.players[targetIdx];
    if (!target || !target.alive || targetIdx === this.currentIdx) return { ok: false, msg: '无效目标' };
    // 距离检查：顺手牵羊距离为1
    if (this.calcDistance(this.currentIdx, targetIdx) > 1) return { ok: false, msg: '目标不在距离1以内' };
    const p = this.cur;
    if (target.hasTargetRestriction('shunShouQianYang')) {
      this.log(`${target.name} 【谦逊】不能成为顺手牵羊的目标`);
      return { ok: false, msg: '目标不可选' };
    }
    const card = p.removeCard(cardIdx);
    this.deck.discard(card);
    if (this._checkWuXie(p, '顺手牵羊')) return { ok: true };
    const allCards = [...target.hand];
    for (const slot of Object.keys(target.equipment)) { if (target.equipment[slot]) allCards.push(target.equipment[slot]); }
    if (allCards.length > 0) {
      const randIdx = Math.floor(Math.random() * allCards.length);
      const chosen = allCards[randIdx];
      const handIdx = target.hand.indexOf(chosen);
      if (handIdx !== -1) { target.removeCard(handIdx); }
      else { for (const slot of Object.keys(target.equipment)) { if (target.equipment[slot] === chosen) { delete target.equipment[slot]; break; } } }
      p.hand.push(chosen);
      this.log(`${p.name} 对 ${target.name} 使用了【顺手牵羊】，获得了一张【${chosen.name}】`);
    }
    this._triggerJiZhi(p);
    this._emit('stateChanged');
    return { ok: true };
  }

  useLeBu(cardIdx, targetIdx) {
    const target = this.players[targetIdx];
    if (!target || !target.alive || targetIdx === this.currentIdx) return { ok: false, msg: '无效目标' };
    if (target.hasTargetRestriction('leBuSiShu')) return { ok: false, msg: '谦逊：不能成为乐不思蜀的目标' };
    // 同名延时锦囊不能重复
    if (target.judgments.some(c => c.subtype === 'leBuSiShu')) return { ok: false, msg: '该角色判定区已有【乐不思蜀】' };
    const p = this.cur;
    const card = p.hand[cardIdx];
    if (card.subtype !== 'leBuSiShu') {
      if (!(p.hero && p.hero.skillId === 'guoSe' && card.suit === SUIT.DIAMOND)) return { ok: false, msg: '不是乐不思蜀' };
    }
    p.removeCard(cardIdx);
    target.judgments.push(card);
    this.log(`${p.name} 对 ${target.name} 使用了【乐不思蜀】`);
    this._triggerJiZhi(p);
    this._emit('stateChanged');
    return { ok: true };
  }

  useTaoYuan(cardIdx) {
    const p = this.cur;
    const card = p.removeCard(cardIdx);
    this.deck.discard(card);
    for (const t of this.players) {
      if (t.alive && t.hp < t.maxHp) { t.hp = Math.min(t.hp + 1, t.maxHp); this.log(`${t.name} 回复1点体力`); }
    }
    this._triggerJiZhi(p);
    this._emit('stateChanged');
    return { ok: true };
  }

  // 南蛮入侵：所有其他角色需出【杀】，否则受1伤害
  useNanMan(cardIdx) {
    const p = this.cur;
    const card = p.removeCard(cardIdx);
    this.deck.discard(card);
    this.log(`${p.name} 使用了【南蛮入侵】`);
    this._triggerJiZhi(p);
    this._emit('stateChanged');
    // 无懈可击检查
    if (this._checkWuXie(p, '南蛮入侵')) return { ok: true };
    const targets = this.players.filter(t => t.alive && t.id !== p.id).map(t => this.players.indexOf(t));
    this._resolveTrickChain(targets, 0, 'strike', 1);
    return { ok: true };
  }

  useWanJian(cardIdx) {
    const p = this.cur;
    const card = p.removeCard(cardIdx);
    this.deck.discard(card);
    this.log(`${p.name} 使用了【万箭齐发】`);
    this._triggerJiZhi(p);
    this._emit('stateChanged');
    if (this._checkWuXie(p, '万箭齐发')) return { ok: true };
    const targets = this.players.filter(t => t.alive && t.id !== p.id).map(t => this.players.indexOf(t));
    this._resolveTrickChain(targets, 0, 'dodge', 1);
    return { ok: true };
  }

  // 锦囊连锁结算：依次询问每个目标
  _resolveTrickChain(targetIndices, index, responseType, damage) {
    if (index >= targetIndices.length) {
      // 所有目标处理完毕，恢复出牌等待
      if (this.waitingFor === null && this.status === 'playing') {
        this.waitingFor = 'play';
        this.waitingPlayerId = this.cur.id;
        this._emit('stateChanged');
      }
      return;
    }
    const targetIdx = targetIndices[index];
    const target = this.players[targetIdx];
    if (!target || !target.alive) { this._resolveTrickChain(targetIndices, index + 1, responseType, damage); return; }

    const savedWaitingPlayerId = this.waitingPlayerId;
    const hasCard = target.hand.some(c => {
      if (c.subtype === responseType) return true;
      if (responseType === 'dodge' && c.subtype === 'strike' && target.hero && target.hero.skillId === 'longDan') return true;
      if (responseType === 'strike' && c.subtype === 'dodge' && target.hero && target.hero.skillId === 'longDan') return true;
      if (responseType === 'dodge' && (c.suit === SUIT.SPADE || c.suit === SUIT.CLUB) && target.hero && target.hero.skillId === 'qingGuo') return true;
      return false;
    });

    if (hasCard) {
      const label = responseType === 'strike' ? '杀' : '闪';
      this.waitingFor = 'response';
      this.pendingResponse = {
        playerId: target.id, type: responseType,
        onUse: () => {
          this.log(`${target.name} 使用了【${label}】`);
          this._resolveTrickChain(targetIndices, index + 1, responseType, damage);
        },
        onPass: () => {
          this.dealDamage(this.currentIdx, targetIdx, damage);
          this._resolveTrickChain(targetIndices, index + 1, responseType, damage);
        },
      };
      this._emit('stateChanged');
      this._emit('awaitResponse', { playerId: target.id, type: responseType, label: `请使用【${label}】` });
    } else {
      this.delayed(() => {
        this.dealDamage(this.currentIdx, targetIdx, damage);
        this._resolveTrickChain(targetIndices, index + 1, responseType, damage);
      });
    }
  }

  // 决斗：双方交替出【杀】，无法出者受1伤害
  useJueDou(cardIdx, targetIdx) {
    const target = this.players[targetIdx];
    if (!target || !target.alive || targetIdx === this.currentIdx) return { ok: false, msg: '无效目标' };
    const p = this.cur;
    const card = p.removeCard(cardIdx);
    this.deck.discard(card);
    this.log(`${p.name} 对 ${target.name} 使用了【决斗】`);
    this._triggerJiZhi(p);
    this._emit('stateChanged');
    if (this._checkWuXie(p, '决斗')) return { ok: true };
    // 目标先出杀
    this._resolveJueDou(targetIdx, this.currentIdx);
    return { ok: true };
  }

  _resolveJueDou(defenderIdx, attackerIdx) {
    const defender = this.players[defenderIdx];
    const attacker = this.players[attackerIdx];
    if (!defender || !defender.alive) { this._restorePlayState(); return; }
    if (!attacker || !attacker.alive) { this._restorePlayState(); return; }

    const savedWaitingPlayerId = this.waitingPlayerId;
    const hasStrike = defender.hand.some(c => {
      if (c.subtype === 'strike') return true;
      if (c.suit === SUIT.HEART || c.suit === SUIT.DIAMOND) {
        if (defender.hero && defender.hero.skillId === 'wuSheng') return true;
      }
      if (c.subtype === 'dodge' && defender.hero && defender.hero.skillId === 'longDan') return true;
      return false;
    });

    if (hasStrike) {
      this.waitingFor = 'response';
      this.pendingResponse = {
        playerId: defender.id, type: 'strike',
        onUse: () => { this.log(`${defender.name} 出了【杀】`); this._resolveJueDou(attackerIdx, defenderIdx); },
        onPass: () => { this.dealDamage(attackerIdx, defenderIdx, 1); this._restorePlayState(); },
      };
      this._emit('stateChanged');
      this._emit('awaitResponse', { playerId: defender.id, type: 'strike', label: '决斗中，请出【杀】' });
    } else {
      this.delayed(() => { this.dealDamage(attackerIdx, defenderIdx, 1); this._restorePlayState(); });
    }
  }

  _restorePlayState() {
    this._busy = false;
    // 只在出牌阶段且当前没有等待状态时恢复
    if (this.waitingFor === null && this.status === 'playing' && this.phase === 'play') {
      this.waitingFor = 'play';
      this.waitingPlayerId = this.cur.id;
      this._emit('stateChanged');
      this._emit('awaitPlay', { playerId: this.cur.id });
    }
  }

  // 火攻：目标展示一张手牌，你弃一张同花色牌，目标受1火焰伤害
  useHuoGong(cardIdx, targetIdx) {
    const target = this.players[targetIdx];
    if (!target || !target.alive || targetIdx === this.currentIdx) return { ok: false, msg: '无效目标' };
    const p = this.cur;
    const card = p.removeCard(cardIdx);
    this.deck.discard(card);
    if (this._checkWuXie(p, '火攻')) return { ok: true };
    if (target.hand.length === 0) { this.log(`${target.name} 没有手牌，火攻无效`); this._emit('stateChanged'); return { ok: true }; }
    // 随机展示一张手牌
    const shown = target.hand[Math.floor(Math.random() * target.hand.length)];
    this.log(`${target.name} 展示了【${shown.name}】(${SUIT_SYMBOL[shown.suit]})`);
    // 弃一张同花色牌
    const discardIdx = p.hand.findIndex(c => c.suit === shown.suit && c.uid !== card.uid);
    if (discardIdx !== -1) {
      const disc = p.removeCard(discardIdx);
      this.deck.discard(disc);
      this.dealDamage(this.currentIdx, targetIdx, 1, 'fire');
      this.log(`${p.name} 弃置了一张${SUIT_NAME[shown.suit]}牌，${target.name} 受到1点火焰伤害`);
    } else {
      this.log(`${p.name} 没有同花色牌，火攻无效`);
    }
    this._triggerJiZhi(p);
    this._emit('stateChanged');
    return { ok: true };
  }

  // 铁索连环：选择1-2名角色横置/重置
  useTieSuo(cardIdx, targetIdx) {
    const p = this.cur;
    const card = p.removeCard(cardIdx);
    this.deck.discard(card);
    if (targetIdx !== undefined && targetIdx !== null) {
      const target = this.players[targetIdx];
      if (target && target.alive) {
        target.chained = !target.chained;
        this.log(`${target.name} ${target.chained ? '被连环' : '解除连环'}`);
      }
    }
    this._triggerJiZhi(p);
    this._emit('stateChanged');
    return { ok: true };
  }

  // 借刀杀人：有武器的角色对另一名角色出杀
  useJieDao(cardIdx, targetIdx) {
    const target = this.players[targetIdx];
    if (!target || !target.alive || targetIdx === this.currentIdx) return { ok: false, msg: '无效目标' };
    const p = this.cur;
    const card = p.removeCard(cardIdx);
    this.deck.discard(card);
    if (this._checkWuXie(p, '借刀杀人')) return { ok: true };
    // 找一个有武器的其他角色
    const armed = this.players.find(t => t.alive && t.id !== p.id && t.equipment.weapon);
    if (armed) {
      const strikeIdx = armed.findCard('strike');
      if (strikeIdx !== -1) {
        armed.removeCard(strikeIdx);
        this.deck.discard(armed.hand[strikeIdx] || { uid: -1 });
        this.log(`${armed.name} 对 ${target.name} 使用了【杀】`);
        this.requestResponse(targetIdx, 'dodge',
          () => this.dealDamage(this.players.indexOf(armed), targetIdx, 1),
          () => this.log(`${target.name} 使用了【闪】`)
        );
      } else {
        this.log(`${armed.name} 没有【杀】，弃置武器`);
        const wpn = armed.equipment.weapon;
        delete armed.equipment.weapon;
        this.deck.discard(wpn);
      }
    }
    this._triggerJiZhi(p);
    this._emit('stateChanged');
    return { ok: true };
  }

  // 闪电：延时锦囊，判定黑桃2-9受3雷电伤害
  useShanDian(cardIdx, targetIdx) {
    const target = this.players[targetIdx];
    if (!target || !target.alive) return { ok: false, msg: '无效目标' };
    if (target.judgments.some(c => c.subtype === 'shanDian')) return { ok: false, msg: '该角色判定区已有【闪电】' };
    const p = this.cur;
    const card = p.removeCard(cardIdx);
    target.judgments.push(card);
    this.log(`${p.name} 对 ${target.name} 使用了【闪电】`);
    this._triggerJiZhi(p);
    this._emit('stateChanged');
    return { ok: true };
  }

  // 兵粮寸断：延时锦囊，判定非梅花跳过摸牌
  useBingLiang(cardIdx, targetIdx) {
    const target = this.players[targetIdx];
    if (!target || !target.alive || targetIdx === this.currentIdx) return { ok: false, msg: '无效目标' };
    if (this.calcDistance(this.currentIdx, targetIdx) > 1) return { ok: false, msg: '目标不在距离1以内' };
    if (target.judgments.some(c => c.subtype === 'bingLiangCunDuan')) return { ok: false, msg: '该角色判定区已有【兵粮寸断】' };
    const p = this.cur;
    const card = p.removeCard(cardIdx);
    target.judgments.push(card);
    this.log(`${p.name} 对 ${target.name} 使用了【兵粮寸断】`);
    this._triggerJiZhi(p);
    this._emit('stateChanged');
    return { ok: true };
  }

  // 无懈可击检查：AI自动决定是否使用
  _checkWuXie(caster, trickName) {
    // 按顺序检查每个玩家是否有无懈可击
    for (let i = 0; i < this.players.length; i++) {
      const idx = (this.players.indexOf(caster) + 1 + i) % this.players.length;
      const p = this.players[idx];
      if (!p.alive || p.id === caster.id) continue;
      const wuXieIdx = p.findCard('wuXieKeJi');
      if (wuXieIdx !== -1) {
        // AI 决策：如果锦囊对自己或盟友不利，使用无懈可击
        // 简化：敌人使用锦囊时，盟友自动无懈可击
        if (p.isEnemyOf(caster)) {
          const card = p.removeCard(wuXieIdx);
          this.deck.discard(card);
          this.log(`${p.name} 使用了【无懈可击】，${trickName}无效`);
          this._emit('stateChanged');
          return true;
        }
      }
    }
    return false;
  }

  // 黄月英集智
  _triggerJiZhi(p) {
    if (p.hero && p.hero.skillId === 'jiZhi') {
      const drawn = this.deck.draw(1);
      p.addCards(drawn);
      this.log(`${p.name} 【集智】摸了1张牌`);
    }
  }

  // ----- 技能系统 -----
  useSkill(playerId, skillId, data) {
    const p = this.players.find(x => x.id === playerId);
    if (!p || !p.alive) return { ok: false, msg: '无效玩家' };
    if (this.waitingFor !== 'play' || this.waitingPlayerId !== playerId) return { ok: false, msg: '不是出牌阶段' };
    switch (skillId) {
      case 'renDe': return this.useRenDe(playerId, data);
      case 'wuSheng': return this.useWuSheng(playerId, data);
      case 'zhiHeng': return this.useZhiHeng(playerId, data);
      case 'longDan': return this.useLongDanStrike(playerId, data);
      case 'qiXi': return this.useQiXi(playerId, data);
      case 'kuRou': return this.useKuRou(playerId);
      case 'luoYi': return this.useLuoYi(playerId);
      case 'fanJian': return this.useFanJian(playerId, data);
      case 'guoSe': return this.useGuoSe(playerId, data);
      case 'jieYin': return this.useJieYin(playerId, data);
      case 'liJian': return this.useLiJian(playerId, data);
      default: return { ok: false, msg: '未知技能' };
    }
  }

  useRenDe(playerId, data) {
    const p = this.players.find(x => x.id === playerId);
    if (!p.hero || p.hero.skillId !== 'renDe') return { ok: false };
    if (p.skillsUsed.renDe) return { ok: false, msg: '仁德每阶段限一次' };
    const { cardIndices, targetIdx } = data;
    if (!cardIndices || cardIndices.length === 0) return { ok: false, msg: '未选择牌' };
    const target = this.players[targetIdx];
    if (!target || !target.alive || targetIdx === this.players.indexOf(p)) return { ok: false, msg: '无效目标' };
    const sorted = [...cardIndices].sort((a, b) => b - a);
    const cards = [];
    for (const idx of sorted) { const card = p.removeCard(idx); if (card) cards.push(card); }
    target.addCards(cards);
    p.skillsUsed.renDe = true;
    // 给出不少于2张则回复体力
    if (cards.length >= 2 && p.hp < p.maxHp) {
      p.hp = Math.min(p.hp + 1, p.maxHp);
      this.log(`${p.name} 发动【仁德】，将 ${cards.length} 张牌交给 ${target.name}，回复1点体力`);
    } else {
      this.log(`${p.name} 发动【仁德】，将 ${cards.length} 张牌交给 ${target.name}`);
    }
    this._emit('stateChanged');
    return { ok: true };
  }

  useWuSheng(playerId, data) {
    const p = this.players.find(x => x.id === playerId);
    if (!p.hero || p.hero.skillId !== 'wuSheng') return { ok: false };
    if (p.hasUsedStrike) return { ok: false, msg: '已出过杀' };
    const { cardIdx, targetIdx } = data;
    if (cardIdx < 0 || cardIdx >= p.hand.length) return { ok: false };
    const card = p.hand[cardIdx];
    if (card.suit !== SUIT.HEART && card.suit !== SUIT.DIAMOND) return { ok: false, msg: '不是红色牌' };
    if (!this.players[targetIdx] || !this.players[targetIdx].alive || targetIdx === this.players.indexOf(p)) return { ok: false, msg: '无效目标' };
    if (!this.canReach(this.players.indexOf(p), targetIdx)) return { ok: false, msg: '目标不在攻击范围内' };
    p.removeCard(cardIdx); this.deck.discard(card);
    p.hasUsedStrike = true; p.keJiUsedStrike = true;
    const damage = (p.wineBuff ? 2 : 1) + (p.luoYiBuff ? 1 : 0);
    p.wineBuff = false; p.luoYiBuff = false;
    this.log(`${p.name} 发动【武圣】，将【${card.name}】当【杀】使用`);
    this._emit('stateChanged');
    this.requestResponse(targetIdx, 'dodge',
      () => this.dealDamage(this.players.indexOf(p), targetIdx, damage),
      () => this.log(`${this.players[targetIdx].name} 使用了【闪】`)
    );
    return { ok: true };
  }

  useLongDanStrike(playerId, data) {
    const p = this.players.find(x => x.id === playerId);
    if (!p.hero || p.hero.skillId !== 'longDan') return { ok: false };
    if (p.hasUsedStrike) return { ok: false, msg: '已出过杀' };
    const { cardIdx, targetIdx } = data;
    if (cardIdx < 0 || cardIdx >= p.hand.length) return { ok: false };
    const card = p.hand[cardIdx];
    if (card.subtype !== 'dodge') return { ok: false, msg: '不是闪' };
    if (!this.players[targetIdx] || !this.players[targetIdx].alive || targetIdx === this.players.indexOf(p)) return { ok: false, msg: '无效目标' };
    if (!this.canReach(this.players.indexOf(p), targetIdx)) return { ok: false, msg: '目标不在攻击范围内' };
    p.removeCard(cardIdx); this.deck.discard(card);
    p.hasUsedStrike = true; p.keJiUsedStrike = true;
    const damage = (p.wineBuff ? 2 : 1) + (p.luoYiBuff ? 1 : 0);
    p.wineBuff = false; p.luoYiBuff = false;
    this.log(`${p.name} 发动【龙胆】，将【闪】当【杀】使用`);
    this._emit('stateChanged');
    this.requestResponse(targetIdx, 'dodge',
      () => this.dealDamage(this.players.indexOf(p), targetIdx, damage),
      () => this.log(`${this.players[targetIdx].name} 使用了【闪】`)
    );
    return { ok: true };
  }

  useZhiHeng(playerId, data) {
    const p = this.players.find(x => x.id === playerId);
    if (!p.hero || p.hero.skillId !== 'zhiHeng') return { ok: false };
    if (p.skillsUsed.zhiHeng) return { ok: false, msg: '制衡每阶段限一次' };
    const { cardIndices } = data;
    if (!cardIndices || cardIndices.length === 0) return { ok: false, msg: '未选择牌' };
    const sorted = [...cardIndices].sort((a, b) => b - a);
    for (const idx of sorted) { const card = p.removeCard(idx); if (card) this.deck.discard(card); }
    const drawn = this.deck.draw(cardIndices.length);
    p.addCards(drawn);
    p.skillsUsed.zhiHeng = true;
    this.log(`${p.name} 发动【制衡】，弃 ${cardIndices.length} 张牌摸 ${drawn.length} 张`);
    this._emit('stateChanged');
    return { ok: true };
  }

  useQiXi(playerId, data) {
    const p = this.players.find(x => x.id === playerId);
    if (!p.hero || p.hero.skillId !== 'qiXi') return { ok: false };
    const { cardIdx, targetIdx } = data;
    if (cardIdx < 0 || cardIdx >= p.hand.length) return { ok: false };
    const card = p.hand[cardIdx];
    if (card.suit !== SUIT.SPADE && card.suit !== SUIT.CLUB) return { ok: false, msg: '不是黑色牌' };
    const target = this.players[targetIdx];
    if (!target || !target.alive || targetIdx === this.players.indexOf(p)) return { ok: false, msg: '无效目标' };
    p.removeCard(cardIdx); this.deck.discard(card);
    // 过河拆桥效果
    const allCards = [...target.hand];
    for (const slot of Object.keys(target.equipment)) { if (target.equipment[slot]) allCards.push(target.equipment[slot]); }
    if (allCards.length > 0) {
      const randIdx = Math.floor(Math.random() * allCards.length);
      const chosen = allCards[randIdx];
      const handIdx = target.hand.indexOf(chosen);
      if (handIdx !== -1) { target.removeCard(handIdx); }
      else { for (const slot of Object.keys(target.equipment)) { if (target.equipment[slot] === chosen) { delete target.equipment[slot]; break; } } }
      this.deck.discard(chosen);
    }
    this.log(`${p.name} 发动【奇袭】，将一张黑色牌当【过河拆桥】对 ${target.name} 使用`);
    this._emit('stateChanged');
    return { ok: true };
  }

  useKuRou(playerId) {
    const p = this.players.find(x => x.id === playerId);
    if (!p.hero || p.hero.skillId !== 'kuRou') return { ok: false };
    if (p.skillsUsed.kuRou) return { ok: false, msg: '苦肉每阶段限一次' };
    p.skillsUsed.kuRou = true;
    p.hp -= 1;
    this.log(`${p.name} 发动【苦肉】，失去1点体力 (HP:${p.hp}/${p.maxHp})`);
    const drawn = this.deck.draw(2);
    p.addCards(drawn);
    this.log(`${p.name} 摸了2张牌`);
    this._emit('stateChanged');
    if (p.hp <= 0) this.checkDeath(this.players.indexOf(p), this.players.indexOf(p));
    return { ok: true };
  }

  useLuoYi(playerId) {
    // 裸衣现在在摸牌阶段自动触发
    return { ok: false, msg: '裸衣在摸牌阶段自动发动' };
  }

  useFanJian(playerId, data) {
    const p = this.players.find(x => x.id === playerId);
    if (!p.hero || p.hero.skillId !== 'fanJian') return { ok: false };
    if (p.skillsUsed.fanJian) return { ok: false, msg: '反间每阶段限一次' };
    if (p.hand.length === 0) return { ok: false, msg: '没有手牌' };
    const { targetIdx, guessedSuit } = data;
    const target = this.players[targetIdx];
    if (!target || !target.alive || targetIdx === this.players.indexOf(p)) return { ok: false, msg: '无效目标' };
    // 随机展示一张手牌
    const cardIdx = Math.floor(Math.random() * p.hand.length);
    const card = p.removeCard(cardIdx);
    target.hand.push(card);
    p.skillsUsed.fanJian = true;
    if (card.suit !== guessedSuit) {
      this.dealDamage(this.players.indexOf(p), targetIdx, 1);
      this.log(`${p.name} 发动【反间】，${target.name} 猜错花色，受到1点伤害`);
    } else {
      this.log(`${p.name} 发动【反间】，${target.name} 猜对花色`);
    }
    this._emit('stateChanged');
    return { ok: true };
  }

  useGuoSe(playerId, data) {
    const p = this.players.find(x => x.id === playerId);
    if (!p.hero || p.hero.skillId !== 'guoSe') return { ok: false };
    const { cardIdx, targetIdx } = data;
    if (cardIdx < 0 || cardIdx >= p.hand.length) return { ok: false };
    const card = p.hand[cardIdx];
    if (card.suit !== SUIT.DIAMOND) return { ok: false, msg: '不是方块牌' };
    const target = this.players[targetIdx];
    if (!target || !target.alive || targetIdx === this.players.indexOf(p)) return { ok: false, msg: '无效目标' };
    if (target.hasTargetRestriction('leBuSiShu')) return { ok: false, msg: '谦逊：不能成为乐不思蜀的目标' };
    p.removeCard(cardIdx);
    target.judgments.push(card);
    this.log(`${p.name} 发动【国色】，将一张方块牌当【乐不思蜀】对 ${target.name} 使用`);
    this._emit('stateChanged');
    return { ok: true };
  }

  useJieYin(playerId, data) {
    const p = this.players.find(x => x.id === playerId);
    if (!p.hero || p.hero.skillId !== 'jieYin') return { ok: false };
    if (p.skillsUsed.jieYin) return { ok: false, msg: '结姻每阶段限一次' };
    if (p.hand.length < 2) return { ok: false, msg: '手牌不足' };
    const { cardIndices, targetIdx } = data;
    if (!cardIndices || cardIndices.length !== 2) return { ok: false, msg: '需弃两张牌' };
    const target = this.players[targetIdx];
    if (!target || !target.alive || target.hp >= target.maxHp) return { ok: false, msg: '目标未受伤' };
    // 简化：不检查性别
    const sorted = [...cardIndices].sort((a, b) => b - a);
    for (const idx of sorted) { const card = p.removeCard(idx); if (card) this.deck.discard(card); }
    p.hp = Math.min(p.hp + 1, p.maxHp);
    target.hp = Math.min(target.hp + 1, target.maxHp);
    p.skillsUsed.jieYin = true;
    this.log(`${p.name} 发动【结姻】，与 ${target.name} 各回复1点体力`);
    this._emit('stateChanged');
    return { ok: true };
  }

  useLiJian(playerId, data) {
    const p = this.players.find(x => x.id === playerId);
    if (!p.hero || p.hero.skillId !== 'liJian') return { ok: false };
    if (p.skillsUsed.liJian) return { ok: false, msg: '离间每阶段限一次' };
    if (p.hand.length === 0) return { ok: false, msg: '没有手牌' };
    const { cardIdx, fromIdx, toIdx } = data;
    const from = this.players[fromIdx];
    const to = this.players[toIdx];
    if (!from || !from.alive || !to || !to.alive) return { ok: false, msg: '无效目标' };
    if (fromIdx === toIdx) return { ok: false, msg: '不能选择同一人' };
    const card = p.removeCard(cardIdx !== undefined ? cardIdx : 0);
    if (card) this.deck.discard(card);
    p.skillsUsed.liJian = true;
    this.log(`${p.name} 发动【离间】，令 ${from.name} 对 ${to.name} 使用【杀】`);
    // 令from对to使用杀
    const strikeIdx = from.findCard('strike');
    if (strikeIdx !== -1) {
      from.removeCard(strikeIdx);
      this.deck.discard(from.hand[strikeIdx] || { uid: -1 });
      this.log(`${from.name} 对 ${to.name} 使用了【杀】`);
      this.requestResponse(toIdx, 'dodge',
        () => this.dealDamage(fromIdx, toIdx, 1),
        () => this.log(`${to.name} 使用了【闪】`)
      );
    } else {
      this.log(`${from.name} 没有【杀】，受到1点伤害`);
      this.dealDamage(fromIdx, fromIdx, 1);
    }
    this._emit('stateChanged');
    return { ok: true };
  }

  // ----- 响应请求 -----
  requestResponse(playerIdx, type, onFail, onUse) {
    const p = this.players[playerIdx];
    if (!p || !p.alive) { onFail(); return; }
    const savedWaitingPlayerId = this.waitingPlayerId;

    // 检查是否有可用牌（包括转换技能）
    const hasCard = p.hand.some(c => {
      if (c.subtype === type) return true;
      // 龙胆
      if (type === 'dodge' && c.subtype === 'strike' && p.hero && p.hero.skillId === 'longDan') return true;
      if (type === 'strike' && c.subtype === 'dodge' && p.hero && p.hero.skillId === 'longDan') return true;
      // 倾国
      if (type === 'dodge' && (c.suit === SUIT.SPADE || c.suit === SUIT.CLUB) && p.hero && p.hero.skillId === 'qingGuo') return true;
      // 急救
      if (type === 'peach' && (c.suit === SUIT.HEART || c.suit === SUIT.DIAMOND) && p.hero && p.hero.skillId === 'jiJiu' && this.cur.id !== playerIdx) return true;
      // 武圣
      if (type === 'strike' && (c.suit === SUIT.HEART || c.suit === SUIT.DIAMOND) && p.hero && p.hero.skillId === 'wuSheng') return true;
      return false;
    });

    if (hasCard) {
      const label = type === 'dodge' ? '闪' : type === 'peach' ? '桃' : type;
      this.waitingFor = 'response';
      this.pendingResponse = {
        playerId: p.id, type,
        onUse: () => { if (onUse) onUse(); if (this.waitingFor === null && this.status === 'playing' && this.phase === 'play') { this.waitingFor = 'play'; this.waitingPlayerId = savedWaitingPlayerId; this._emit('stateChanged'); this._emit('awaitPlay', { playerId: savedWaitingPlayerId }); } },
        onPass: () => { onFail(); if (this.waitingFor === null && this.status === 'playing' && this.phase === 'play') { this.waitingFor = 'play'; this.waitingPlayerId = savedWaitingPlayerId; this._emit('stateChanged'); this._emit('awaitPlay', { playerId: savedWaitingPlayerId }); } },
      };
      this._emit('stateChanged');
      this._emit('awaitResponse', { playerId: p.id, type, label });
    } else {
      this.delayed(() => { onFail(); if (this.waitingFor === null && this.status === 'playing' && this.phase === 'play') { this.waitingFor = 'play'; this.waitingPlayerId = savedWaitingPlayerId; this._emit('stateChanged'); this._emit('awaitPlay', { playerId: savedWaitingPlayerId }); } });
    }
  }

  // ----- 伤害/死亡 -----
  dealDamage(srcIdx, targetIdx, amount, type, ignoreArmor) {
    const target = this.players[targetIdx];
    if (!target || !target.alive) return;
    const src = this.players[srcIdx];

    // 八卦阵：受到伤害时判定，红桃则伤害无效（青釭剑无视）
    if (!ignoreArmor && target.hasArmor() && target.armorType() === 'baGuaZhen') {
      const judge = this.deck.draw(1)[0];
      this.log(`${target.name} 【八卦阵】判定：${SUIT_SYMBOL[judge.suit]}${judge.num}`);
      this.deck.discard(judge);
      if (judge.suit === SUIT.HEART) {
        this.log(`${target.name} 【八卦阵】生效，伤害无效！`);
        this._emit('stateChanged');
        return;
      }
    }

    target.hp -= amount;
    this.log(`${target.name} 受到 ${amount} 点伤害 (HP:${target.hp}/${target.maxHp})`);

    // 受伤后触发技能
    if (srcIdx !== targetIdx) {
      // 奸雄：获得造成伤害的牌
      if (target.hero && target.hero.skillId === 'jianXiong') {
        // 简化：摸一张牌代替获得造成伤害的牌
        const drawn = this.deck.draw(1);
        target.addCards(drawn);
        this.log(`${target.name} 【奸雄】摸了1张牌`);
      }
      // 反馈：获得伤害来源一张手牌
      if (target.hero && target.hero.skillId === 'fanKui' && src.hand.length > 0) {
        const randIdx = Math.floor(Math.random() * src.hand.length);
        const stolen = src.removeCard(randIdx);
        target.hand.push(stolen);
        this.log(`${target.name} 【反馈】获得了 ${src.name} 的一张牌`);
      }
      // 遗计：每受1点伤害摸两张牌
      if (target.hero && target.hero.skillId === 'yiJi') {
        for (let i = 0; i < amount; i++) {
          const drawn = this.deck.draw(2);
          target.addCards(drawn);
          this.log(`${target.name} 【遗计】摸了2张牌`);
        }
      }
    }

    // 铁索连环传导
    if (target.chained && type !== 'normal') {
      for (const p of this.players) {
        if (p !== target && p.alive && p.chained) {
          this.log(`${p.name} 受到铁索连环传导伤害`);
          this.dealDamage(srcIdx, this.players.indexOf(p), amount, 'normal');
        }
      }
    }

    this._emit('stateChanged');
    if (target.hp <= 0) this.checkDeath(srcIdx, targetIdx);
  }

  checkDeath(srcIdx, targetIdx) {
    const p = this.players[targetIdx];
    if (p.hp > 0) return;
    // 自救
    const peachIdx = p.findCard('peach');
    if (peachIdx !== -1) { const card = p.removeCard(peachIdx); this.deck.discard(card); p.hp = Math.min(p.hp + 1, p.maxHp); this.log(`${p.name} 使用【桃】自救`); this._emit('stateChanged'); if (p.hp > 0) return; }
    const wineIdx = p.findCard('wine');
    if (wineIdx !== -1) { const card = p.removeCard(wineIdx); this.deck.discard(card); p.hp = Math.min(p.hp + 1, p.maxHp); this.log(`${p.name} 使用【酒】自救`); this._emit('stateChanged'); if (p.hp > 0) return; }
    // 求救链
    this.requestSaveFromOthers(targetIdx, () => this.killPlayer(srcIdx, targetIdx));
  }

  requestSaveFromOthers(dyingIdx, onFail) {
    const savedWaitingPlayerId = this.waitingPlayerId;
    const dying = this.players[dyingIdx];
    const askOrder = [];
    for (let i = 0; i < this.players.length; i++) { const idx = (dyingIdx + 1 + i) % this.players.length; if (idx !== dyingIdx && this.players[idx].alive) askOrder.push(idx); }

    // AI 自动求救：同步检查是否有人愿意出桃
    // 策略：忠臣救主公/忠臣，反贼不救，内奸看情况
    for (const idx of askOrder) {
      const saver = this.players[idx];
      const peachIdx = saver.findCard('peach');
      // 急救：回合外红色牌当桃
      const jiJiuIdx = (saver.hero && saver.hero.skillId === 'jiJiu')
        ? saver.hand.findIndex(c => (c.suit === SUIT.HEART || c.suit === SUIT.DIAMOND) && c.subtype !== 'peach')
        : -1;
      const cardIdx = peachIdx !== -1 ? peachIdx : jiJiuIdx;
      if (cardIdx !== -1) {
        // AI 决策：同阵营才救
        if (saver.isAllyOf(dying)) {
          const card = saver.removeCard(cardIdx);
          this.deck.discard(card);
          dying.hp = Math.min(dying.hp + 1, dying.maxHp);
          this.log(`${saver.name} 使用【桃】救活了 ${dying.name}`);
          this._emit('stateChanged');
          if (dying.hp > 0) { this._restorePlayState(); return; }
          // 如果仍然濒死，继续求救
        }
      }
    }

    // 没人救，死亡
    onFail();
    this._restorePlayState();
  }

  killPlayer(srcIdx, targetIdx) {
    const target = this.players[targetIdx];
    if (!target.alive) return;
    const src = this.players[srcIdx];
    target.identityRevealed = true; target.alive = false;
    for (const card of target.hand) this.deck.discard(card);
    target.hand = [];
    for (const slot of Object.keys(target.equipment)) { if (target.equipment[slot]) this.deck.discard(target.equipment[slot]); }
    target.equipment = {};
    this.log(`⚔ ${target.name} (${IDENTITY_LABEL[target.identity]}) 阵亡！`);
    this._emit('stateChanged');
    this._emit('playerDied', { playerId: target.id, identity: target.identity, identityLabel: IDENTITY_LABEL[target.identity] });
    // 击杀奖惩
    if (target.isRebel) { const reward = this.deck.draw(3); src.addCards(reward); this.log(`${src.name} 击杀反贼，摸3张牌`); this._emit('stateChanged'); }
    else if (target.isLoyalist && src.isLord) { for (const card of src.hand) this.deck.discard(card); src.hand = []; this.log(`${src.name} 误杀忠臣，弃置所有手牌`); this._emit('stateChanged'); }
    this.checkWinCondition();
  }

  // ----- 胜利判定 -----
  checkWinCondition() {
    const alive = this.players.filter(p => p.alive);
    const lordAlive = alive.some(p => p.isLord);
    const rebelsAlive = alive.some(p => p.isRebel);
    const traitorsAlive = alive.some(p => p.isTraitor);
    const loyalistsAlive = alive.some(p => p.isLoyalist);
    if (!lordAlive) { this.endGame(IDENTITY.REBEL); return; }
    if (!rebelsAlive && !traitorsAlive) { this.endGame(IDENTITY.LORD); return; }
    if (alive.length === 2 && traitorsAlive && lordAlive && !rebelsAlive && !loyalistsAlive) { this.endGame(IDENTITY.TRAITOR); return; }
  }

  endGame(winnerId) {
    this.status = 'ended'; this.winner = winnerId;
    for (const p of this.players) p.identityRevealed = true;
    this._emit('stateChanged');
    this._emit('gameOver', { winnerId });
  }

  log(msg) { this.logs.push(msg); this._emit('log', msg); }
  delayed(fn) { setTimeout(fn, 100); }
}

if (typeof module !== 'undefined') module.exports = { SanguoshaGame, IDENTITY, IDENTITY_LABEL, HEROES, PHASE_LABEL, SUIT, WEAPON_RANGE };
