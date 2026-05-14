// ============================================================
//  三国杀 — 服务端游戏引擎（纯逻辑，无UI）
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

// 卡牌数据库
const CARD_TEMPLATES = {
  strike: [
    [0,7],[0,8],[0,8],[0,9],[0,9],[0,10],[0,10],
    [2,2],[2,3],[2,4],[2,5],[2,6],[2,7],[2,7],
    [2,8],[2,8],[2,9],[2,9],[2,10],[2,10],[2,'J'],[2,'J'],
    [1,10],[1,10],[3,6],[3,7],[3,8],[3,9],[3,10],[3,'K'],
  ],
  dodge: [
    [1,2],[1,2],[3,2],[3,3],[3,4],[3,5],[3,6],[3,7],
    [3,8],[3,9],[3,10],[3,'J'],[3,'J'],[3,'Q'],[3,'K'],
  ],
  peach: [
    [1,3],[1,4],[1,6],[1,7],[1,8],[1,9],[1,'Q'],[3,'Q'],
  ],
  wine: [
    [0,3],[0,9],[2,3],[2,9],[3,9],
  ],
};

const CARD_NAME = { strike: '杀', dodge: '闪', peach: '桃', wine: '酒' };

const HEROES = {
  liubei: { id: 'liubei', name: '刘备', skillId: 'renDe', skillName: '仁德', skillDesc: '出牌阶段可将手牌交给其他玩家，每回合限一次' },
  guanyu: { id: 'guanyu', name: '关羽', skillId: 'wuSheng', skillName: '武圣', skillDesc: '可以将任意红色手牌当【杀】使用' },
  sunquan: { id: 'sunquan', name: '孙权', skillId: 'zhiHeng', skillName: '制衡', skillDesc: '出牌阶段可弃置任意数量的手牌，摸等量的牌，每回合限一次' },
};

function createCardDB() {
  const db = []; let uid = 0;
  for (const [subtype, templates] of Object.entries(CARD_TEMPLATES)) {
    for (const [suit, num] of templates) {
      db.push({ uid: uid++, name: CARD_NAME[subtype], type: 'basic', subtype, suit, num: String(num) });
    }
  }
  return db;
}

// ---------- Deck ----------
class Deck {
  constructor() {
    this.cards = [];
    this.discards = [];
  }
  init() {
    this.cards = createCardDB();
    this.discards = [];
    this.shuffle();
  }
  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }
  draw(n) {
    const drawn = [];
    for (let i = 0; i < n; i++) {
      if (this.cards.length === 0) this.recycle();
      if (this.cards.length === 0) break;
      drawn.push(this.cards.pop());
    }
    return drawn;
  }
  recycle() {
    if (this.discards.length === 0) return;
    this.cards.push(...this.discards);
    this.discards = [];
    this.shuffle();
  }
  discard(...cards) { this.discards.push(...cards); }
  get totalRemaining() { return this.cards.length; }
  get totalDiscarded() { return this.discards.length; }
}

// ---------- Player ----------
class Player {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.identity = null;
    this.hp = 4; this.maxHp = 4;
    this.hand = [];
    this.equipment = {};
    this.alive = true;
    this.hasUsedStrike = false;
    this.wineBuff = false;
    this.identityRevealed = false;
    this.hero = null;
    this.skillsUsed = {};
    this.isHuman = true;
  }
  setIdentity(id) {
    this.identity = id;
  }
  resetTurnState() {
    this.hasUsedStrike = false;
    this.wineBuff = false;
    this.skillsUsed = {};
  }
  addCards(cards) { this.hand.push(...cards); }
  removeCard(index) {
    if (index < 0 || index >= this.hand.length) return null;
    return this.hand.splice(index, 1)[0];
  }
  findCard(subtype) { return this.hand.findIndex(c => c.subtype === subtype); }
  get handLimit() { return Math.max(this.hp, 0); }
  get isLord() { return this.identity === IDENTITY.LORD; }
  get isLoyalist() { return this.identity === IDENTITY.LOYALIST; }
  get isRebel() { return this.identity === IDENTITY.REBEL; }
  get isTraitor() { return this.identity === IDENTITY.TRAITOR; }
  isAllyOf(other) {
    if (!this.identity || !other.identity) return false;
    return this.identity === other.identity;
  }
  isEnemyOf(other) {
    if (!this.identity || !other.identity) return false;
    return this.identity !== other.identity;
  }
}

// ---------- 身份分配（官方比例）----------
function getIdentityDistribution(n) {
  let loy = 0, reb = 0, tra = 0;
  const m = { 2: [0,1,0], 3:[0,2,0], 4:[0,3,0], 5:[1,2,1], 6:[1,3,1],
    7:[2,3,1], 8:[2,4,1], 9:[3,4,1], 10:[3,5,1] };
  if (m[n]) { loy = m[n][0]; reb = m[n][1]; tra = m[n][2]; }
  const ids = [IDENTITY.LORD];
  for (let i = 0; i < loy; i++) ids.push(IDENTITY.LOYALIST);
  for (let i = 0; i < reb; i++) ids.push(IDENTITY.REBEL);
  for (let i = 0; i < tra; i++) ids.push(IDENTITY.TRAITOR);
  // 随机打乱
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids;
}

// ---------- GameEngine ----------
class SanguoshaGame {
  constructor(playerIds, playerNames) {
    this.deck = new Deck();
    this.players = [];
    this.currentIdx = 0;
    this.phase = null;
    this.turnNum = 0;
    this.status = 'playing';
    this.winner = null;
    this.logs = [];
    this.waitingFor = null; // 'play' | 'discard' | 'response'
    this.waitingPlayerId = null;
    this.pendingResponse = null;
    this.discardNeeded = 0;

    this._listeners = {};

    // 创建玩家
    for (let i = 0; i < playerIds.length; i++) {
      const p = new Player(playerIds[i], playerNames[i] || `玩家${i + 1}`);
      this.players.push(p);
    }
  }

  on(event, fn) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(fn);
  }
  _emit(event, data) {
    if (this._listeners[event]) this._listeners[event].forEach(fn => fn(data));
  }

  // ----- 初始化 -----
  start() {
    this.deck.init();
    this.assignIdentities();
    this.assignHeroes();

    for (const p of this.players) {
      const count = p.isLord ? 5 : 4;
      p.addCards(this.deck.draw(count));
      p.hp = p.maxHp = p.isLord ? 5 : 4;
      p.identityRevealed = false;
    }

    this.log('游戏开始！');
    this.currentIdx = 0;
    this.startTurn();
  }

  assignIdentities() {
    const ids = getIdentityDistribution(this.players.length);
    for (let i = 0; i < this.players.length; i++) {
      this.players[i].setIdentity(ids[i]);
    }
  }

  assignHeroes() {
    const pool = ['liubei', 'guanyu', 'sunquan'];
    for (const p of this.players) {
      p.hero = HEROES[pool[Math.floor(Math.random() * pool.length)]];
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
      })),
      currentPlayerId: this.cur ? this.cur.id : null,
      phase: this.phase,
      phaseLabel: this.phase ? PHASE_LABEL[this.phase] : '等待中',
      turnNum: this.turnNum,
      deckCount: this.deck.totalRemaining,
      discardCount: this.deck.totalDiscarded,
      logs: this.logs.slice(-30),
      winner: this.winner,
      status: this.status,
    };
  }

  getStateForPlayer(playerId) {
    const p = this.players.find(x => x.id === playerId);
    if (!p) return null;
    return {
      hand: p.hand,
      identity: p.identity,
      identityLabel: IDENTITY_LABEL[p.identity],
      hero: p.hero,
      heroSkill: p.hero ? { name: p.hero.skillName, desc: p.hero.skillDesc, used: p.skillsUsed[p.hero.skillId] } : null,
      hasUsedStrike: p.hasUsedStrike,
      wineBuff: p.wineBuff,
    };
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
      case PHASE.READY:
        this.nextPhase();
        return;
      case PHASE.JUDGMENT:
        this.nextPhase();
        return;
      case PHASE.DRAW:
        const drawn = this.deck.draw(2);
        this.cur.addCards(drawn);
        this.log(`${this.cur.name} 摸了 2 张牌`);
        this._emit('drawCards', { playerId: this.cur.id, count: 2, cards: drawn });
        this._emit('stateChanged');
        this.nextPhase();
        return;
      case PHASE.PLAY:
        this._emit('stateChanged');
        this.waitingFor = 'play';
        this.waitingPlayerId = this.cur.id;
        this._emit('awaitPlay', { playerId: this.cur.id });
        return;
      case PHASE.DISCARD:
        const limit = this.cur.handLimit;
        if (this.cur.hand.length > limit) {
          const need = this.cur.hand.length - limit;
          this.discardNeeded = need;
          this.waitingFor = 'discard';
          this.waitingPlayerId = this.cur.id;
          this.log(`${this.cur.name} 需要弃 ${need} 张牌`);
          this._emit('stateChanged');
          this._emit('awaitDiscard', { playerId: this.cur.id, count: need });
        } else {
          this.nextPhase();
        }
        return;
      case PHASE.END:
        this.log(`${this.cur.name} 结束回合`);
        this._emit('stateChanged');
        this._emit('turnEnd', { playerId: this.cur.id });
        this.delayed(() => this.startTurn());
        return;
    }
  }

  nextPhase() {
    const idx = PHASE_ORDER.indexOf(this.phase);
    if (idx < PHASE_ORDER.length - 1) {
      this.phase = PHASE_ORDER[idx + 1];
      this._emit('stateChanged');
      this.runPhase();
    }
  }

  // ----- 玩家动作 -----
  playerPlayCard(playerId, cardIdx, targetIdx) {
    if (this.waitingFor !== 'play' || this.waitingPlayerId !== playerId) return { ok: false, msg: '不是你的出牌阶段' };
    const p = this.cur;
    if (cardIdx < 0 || cardIdx >= p.hand.length) return { ok: false, msg: '无效手牌' };
    const card = p.hand[cardIdx];
    let result;
    switch (card.subtype) {
      case 'strike': result = this.useStrike(cardIdx, targetIdx); break;
      case 'peach': result = this.usePeach(cardIdx); break;
      case 'wine': result = this.useWine(cardIdx); break;
      default: result = { ok: false, msg: '不能使用该牌' };
    }
    return result;
  }

  playerEndPlay(playerId) {
    if (this.waitingFor !== 'play' || this.waitingPlayerId !== playerId) return { ok: false };
    this.waitingFor = null;
    this.waitingPlayerId = null;
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
    for (const idx of sorted) {
      const card = p.removeCard(idx);
      if (card) this.deck.discard(card);
    }
    this.log(`${p.name} 弃置了 ${indices.length} 张牌`);
    this.waitingFor = null;
    this.waitingPlayerId = null;
    this.nextPhase();
    return { ok: true };
  }

  playerRespond(playerId, cardIdx) {
    if (this.waitingFor !== 'response' || !this.pendingResponse || this.pendingResponse.playerId !== playerId)
      return { ok: false };
    const p = this.players.find(x => x.id === playerId);
    if (!p || !p.alive) return { ok: false };
    if (cardIdx < 0 || cardIdx >= p.hand.length) return { ok: false };
    const card = p.hand[cardIdx];
    if (card.subtype !== this.pendingResponse.type) return { ok: false };

    p.removeCard(cardIdx);
    this.deck.discard(card);
    this.waitingFor = null;
    const cb = this.pendingResponse.onUse;
    const respPlayerId = this.pendingResponse.playerId;
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

  // ----- 卡牌结算 -----
  useStrike(cardIdx, targetIdx) {
    const src = this.cur;
    if (src.hasUsedStrike) return { ok: false, msg: '本回合已出过杀，无法再出' };
    if (!this.players[targetIdx] || !this.players[targetIdx].alive || targetIdx === this.currentIdx)
      return { ok: false, msg: '无效目标' };

    const card = src.removeCard(cardIdx);
    this.deck.discard(card);
    src.hasUsedStrike = true;
    const damage = src.wineBuff ? 2 : 1;
    src.wineBuff = false;

    this.log(`${src.name} 对 ${this.players[targetIdx].name} 使用了【杀】`);
    this._emit('stateChanged');
    this.requestResponse(targetIdx, 'dodge',
      () => this.dealDamage(this.currentIdx, targetIdx, damage),
      () => this.log(`${this.players[targetIdx].name} 使用了【闪】`)
    );
    return { ok: true };
  }

  usePeach(cardIdx) {
    const p = this.cur;
    if (p.hp >= p.maxHp) return { ok: false, msg: '体力已满' };
    const card = p.removeCard(cardIdx);
    this.deck.discard(card);
    p.hp = Math.min(p.hp + 1, p.maxHp);
    this.log(`${p.name} 使用了【桃】，回复 1 点体力`);
    this._emit('stateChanged');
    return { ok: true };
  }

  useWine(cardIdx) {
    const p = this.cur;
    const card = p.removeCard(cardIdx);
    this.deck.discard(card);
    p.wineBuff = true;
    if (p.hp <= 0) {
      p.hp = Math.min(p.hp + 1, p.maxHp);
      this.log(`${p.name} 使用了【酒】自救`);
    } else {
      this.log(`${p.name} 使用了【酒】`);
    }
    this._emit('stateChanged');
    return { ok: true };
  }

  // ----- 技能 -----
  useSkill(playerId, skillId, data) {
    const p = this.players.find(x => x.id === playerId);
    if (!p || !p.alive) return { ok: false, msg: '无效玩家' };
    if (this.waitingFor !== 'play' || this.waitingPlayerId !== playerId) return { ok: false, msg: '不是出牌阶段' };

    switch (skillId) {
      case 'renDe': return this.useRenDe(playerId, data);
      case 'wuSheng': return this.useWuSheng(playerId, data);
      case 'zhiHeng': return this.useZhiHeng(playerId, data);
      default: return { ok: false, msg: '未知技能' };
    }
  }

  useRenDe(playerId, data) {
    const p = this.players.find(x => x.id === playerId);
    if (!p.hero || p.hero.skillId !== 'renDe') return { ok: false };
    if (p.skillsUsed.renDe) return { ok: false, msg: '仁德每回合限一次' };
    const cardIndices = data.cardIndices;
    const targetIdx = data.targetIdx;
    if (!cardIndices || cardIndices.length === 0) return { ok: false, msg: '未选择牌' };
    const target = this.players[targetIdx];
    if (!target || !target.alive || targetIdx === this.players.indexOf(p)) return { ok: false, msg: '无效目标' };

    const sorted = [...cardIndices].sort((a, b) => b - a);
    const cards = [];
    for (const idx of sorted) {
      const card = p.removeCard(idx);
      if (card) cards.push(card);
    }
    target.addCards(cards);
    p.skillsUsed.renDe = true;
    this.log(`${p.name} 发动【仁德】，将 ${cards.length} 张牌交给 ${target.name}`);
    this._emit('stateChanged');
    return { ok: true };
  }

  useWuSheng(playerId, data) {
    const p = this.players.find(x => x.id === playerId);
    if (!p.hero || p.hero.skillId !== 'wuSheng') return { ok: false };
    if (p.hasUsedStrike) return { ok: false, msg: '已出过杀' };
    const cardIdx = data.cardIdx;
    const targetIdx = data.targetIdx;
    if (cardIdx < 0 || cardIdx >= p.hand.length) return { ok: false };
    const card = p.hand[cardIdx];
    if (card.suit !== SUIT.HEART && card.suit !== SUIT.DIAMOND) return { ok: false, msg: '不是红色牌' };
    if (!this.players[targetIdx] || !this.players[targetIdx].alive || targetIdx === this.players.indexOf(p))
      return { ok: false, msg: '无效目标' };

    p.removeCard(cardIdx);
    this.deck.discard(card);
    p.hasUsedStrike = true;
    const damage = p.wineBuff ? 2 : 1;
    p.wineBuff = false;
    this.log(`${p.name} 发动【武圣】，将【${card.name}】当【杀】使用`);
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
    if (p.skillsUsed.zhiHeng) return { ok: false, msg: '制衡每回合限一次' };
    const cardIndices = data.cardIndices;
    if (!cardIndices || cardIndices.length === 0) return { ok: false, msg: '未选择牌' };

    const sorted = [...cardIndices].sort((a, b) => b - a);
    for (const idx of sorted) {
      const card = p.removeCard(idx);
      if (card) this.deck.discard(card);
    }
    const drawn = this.deck.draw(cardIndices.length);
    p.addCards(drawn);
    p.skillsUsed.zhiHeng = true;
    this.log(`${p.name} 发动【制衡】，弃 ${cardIndices.length} 张牌摸 ${drawn.length} 张`);
    this._emit('stateChanged');
    return { ok: true };
  }

  // ----- 响应请求 -----
  requestResponse(playerIdx, type, onFail, onUse) {
    const p = this.players[playerIdx];
    if (!p || !p.alive) { onFail(); return; }

    const hasCard = p.hand.some(c => c.subtype === type);
    if (hasCard) {
      const label = type === 'dodge' ? '闪' : type === 'peach' ? '桃' : type;
      this.waitingFor = 'response';
      this.pendingResponse = { playerId: p.id, type, onUse, onPass: onFail };
      this._emit('stateChanged');
      this._emit('awaitResponse', { playerId: p.id, type, label });
    } else {
      this.delayed(() => onFail());
    }
  }

  // ----- 伤害/死亡 -----
  dealDamage(srcIdx, targetIdx, amount) {
    const target = this.players[targetIdx];
    if (!target || !target.alive) return;
    const src = this.players[srcIdx];
    target.hp -= amount;
    this.log(`${target.name} 受到 ${amount} 点伤害 (体力 ${target.hp}/${target.maxHp})`);
    this._emit('stateChanged');
    if (target.hp <= 0) this.checkDeath(srcIdx, targetIdx);
  }

  checkDeath(srcIdx, targetIdx) {
    const p = this.players[targetIdx];
    if (p.hp > 0) return;

    // 尝试自救
    const peachIdx = p.findCard('peach');
    if (peachIdx !== -1) {
      const card = p.removeCard(peachIdx);
      this.deck.discard(card);
      p.hp = Math.min(p.hp + 1, p.maxHp);
      this.log(`${p.name} 使用【桃】自救`);
      this._emit('stateChanged');
      if (p.hp > 0) return;
    }
    const wineIdx = p.findCard('wine');
    if (wineIdx !== -1) {
      const card = p.removeCard(wineIdx);
      this.deck.discard(card);
      p.hp = Math.min(p.hp + 1, p.maxHp);
      this.log(`${p.name} 使用【酒】自救`);
      this._emit('stateChanged');
      if (p.hp > 0) return;
    }

    // 询问所有其他玩家救
    this.requestSaveFromOthers(targetIdx, () => this.killPlayer(srcIdx, targetIdx));
  }

  requestSaveFromOthers(dyingIdx, onFail) {
    // 按顺序询问每个活着的玩家是否出桃救
    const askOrder = [];
    for (let i = 0; i < this.players.length; i++) {
      const idx = (dyingIdx + 1 + i) % this.players.length;
      if (idx !== dyingIdx && this.players[idx].alive) askOrder.push(idx);
    }

    const tryNext = (index) => {
      if (index >= askOrder.length) { onFail(); return; }
      const idx = askOrder[index];
      const saver = this.players[idx];
      const peachIdx = saver.findCard('peach');
      if (peachIdx !== -1) {
        this.waitingFor = 'response';
        this.pendingResponse = {
          playerId: saver.id,
          type: 'peach',
          onUse: () => {
            // playerRespond 已移除并弃置桃，这里只需回血
            if (this.players[dyingIdx] && this.players[dyingIdx].alive) {
              this.players[dyingIdx].hp = Math.min(this.players[dyingIdx].hp + 1, this.players[dyingIdx].maxHp);
              this.log(`${saver.name} 使用【桃】救活了 ${this.players[dyingIdx].name}`);
              this._emit('stateChanged');
              // 如果仍然濒死，继续请求
              if (this.players[dyingIdx].hp <= 0) {
                this.delayed(() => this.requestSaveFromOthers(dyingIdx, () => this.killPlayer(this.players.indexOf(saver), dyingIdx)));
              }
            }
          },
          onPass: () => tryNext(index + 1),
        };
        this._emit('stateChanged');
        this._emit('awaitResponse', { playerId: saver.id, type: 'peach', label: `是否用【桃】救 ${this.players[dyingIdx].name}？` });
      } else {
        tryNext(index + 1);
      }
    };
    tryNext(0);
  }

  killPlayer(srcIdx, targetIdx) {
    const target = this.players[targetIdx];
    if (!target.alive) return;
    const src = this.players[srcIdx];

    target.identityRevealed = true;
    target.alive = false;
    for (const card of target.hand) this.deck.discard(card);
    target.hand = [];

    this.log(`⚔ ${target.name} (${IDENTITY_LABEL[target.identity]}) 阵亡！`);
    this._emit('stateChanged');
    this._emit('playerDied', { playerId: target.id, identity: target.identity, identityLabel: IDENTITY_LABEL[target.identity] });

    // 击杀奖惩
    if (target.isRebel) {
      // 击杀反贼摸3张
      const reward = this.deck.draw(3);
      src.addCards(reward);
      this.log(`${src.name} 击杀反贼，摸 3 张牌`);
      this._emit('stateChanged');
    } else if (target.isLoyalist && src.isLord) {
      // 主公击杀忠臣：弃所有手牌和装备
      for (const card of src.hand) this.deck.discard(card);
      src.hand = [];
      // 简化：没有装备系统，只弃手牌
      this.log(`${src.name} 误杀忠臣，弃置所有手牌`);
      this._emit('stateChanged');
    }

    this.checkWinCondition();
  }

  // ----- 胜利判定 -----
  checkWinCondition() {
    const alive = this.players.filter(p => p.alive);
    const lordAlive = alive.some(p => p.isLord);
    const rebelsAlive = alive.some(p => p.isRebel);
    const traitorsAlive = alive.some(p => p.isTraitor);
    const loyalistsAlive = alive.some(p => p.isLoyalist);

    // 主公死 → 反贼赢
    if (!lordAlive) {
      this.endGame(IDENTITY.REBEL);
      return;
    }

    // 所有反贼和内奸都死了 → 主公阵营赢
    if (!rebelsAlive && !traitorsAlive) {
      this.endGame(IDENTITY.LORD);
      return;
    }

    // 内奸赢：只剩主公和内奸（且忠臣反贼都死光了）
    if (alive.length === 2 && traitorsAlive && lordAlive && !rebelsAlive && !loyalistsAlive) {
      this.endGame(IDENTITY.TRAITOR);
      return;
    }
  }

  endGame(winnerId) {
    this.status = 'ended';
    this.winner = winnerId;
    for (const p of this.players) p.identityRevealed = true;
    this._emit('stateChanged');
    this._emit('gameOver', { winnerId });
  }

  // ----- 工具 -----
  log(msg) {
    this.logs.push(msg);
    this._emit('log', msg);
  }
  delayed(fn) {
    setTimeout(fn, 100);
  }
}

// 导出
if (typeof module !== 'undefined') module.exports = { SanguoshaGame, IDENTITY, IDENTITY_LABEL, HEROES, PHASE_LABEL, SUIT };
