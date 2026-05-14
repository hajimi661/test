// ============================================================
//  三国杀 — 游戏引擎（牌堆 / 玩家 / 规则 / AI）
// ============================================================

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

  discard(...cards) {
    this.discards.push(...cards);
  }

  get totalRemaining() { return this.cards.length; }
  get totalDiscarded() { return this.discards.length; }
}

// ---------- Player ----------
class Player {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.identity = null;
    this.hp = 4;
    this.maxHp = 4;
    this.hand = [];
    this.equipment = { weapon: null, armor: null, mount: null, treasure: null };
    this.alive = true;
    this.hasUsedStrike = false;
    this.wineBuff = false;
    this.identityRevealed = false;
    this.hero = null;
    this.skillsUsed = {};
  }

  setIdentity(id) {
    this.identity = id;
    if (id === IDENTITY.LORD) this.identityRevealed = true;
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

  findCard(subtype) {
    return this.hand.findIndex(c => c.subtype === subtype);
  }

  get handLimit() { return Math.max(this.hp, 0); }
  get isLord() { return this.identity === IDENTITY.LORD; }
  get isRebel() { return this.identity === IDENTITY.REBEL; }

  // 简化阵营: 相同身份即为队友
  isAllyOf(other) {
    if (!this.identity || !other.identity) return false;
    return this.identity === other.identity;
  }

  isEnemyOf(other) {
    if (!this.identity || !other.identity) return false;
    return this.identity !== other.identity;
  }
}

// ---------- GameEngine ----------
class SanguoshaGame {
  constructor() {
    this.deck = new Deck();
    this.players = [];
    this.currentIdx = 0;
    this.phase = null;
    this.turnNum = 0;
    this.status = 'idle'; // idle | playing | ended
    this.humanIdx = 0;
    this.winner = null;
    this.logs = [];

    // UI callbacks
    this.onUpdate = null;        // () => void  重新渲染
    this.onLog = null;           // (msg) => void
    this.onAwaitPlay = null;     // () => void  等待出牌
    this.onAwaitDiscard = null;  // (count) => void  等待弃牌
    this.onAwaitResponse = null; // (type, label) => void  等待响应(出闪/救桃)
    this.onGameOver = null;      // (winner) => void

    // 等待状态
    this.waitingFor = null;      // 'play' | 'discard' | 'response'
    this.pendingResponse = null; // { type, onUse, onPass }
    this.discardNeeded = 0;      // 需要弃几张
  }

  // ----- 初始化 -----
  init(playerCount) {
    this.deck.init();
    this.players = [];
    this.logs = [];
    this.turnNum = 0;
    this.status = 'playing';
    this.winner = null;

    const names = ['你', '陆逊', '吕布', '貂蝉', '赵云', '关羽', '张飞', '曹操'];
    for (let i = 0; i < playerCount; i++) {
      this.players.push(new Player(i, names[i] || `玩家${i}`));
    }

    this.assignIdentities(playerCount);
    this.assignHeroes();
    this.deck.shuffle();

    // 主公 5 牌, 其余 4 牌
    for (const p of this.players) {
      const count = p.isLord ? 5 : 4;
      p.addCards(this.deck.draw(count));
      p.hp = p.maxHp = p.isLord ? 5 : 4;
    }

    this.log('游戏开始！');
    this.log(`你的身份: ${IDENTITY_LABEL[this.players[this.humanIdx].identity]}`);
    this.log(`你的武将: ${this.players[this.humanIdx].hero.name} · ${this.players[this.humanIdx].hero.skillName}`);

    this.currentIdx = 0;
    this.startTurn();
  }

  assignIdentities(n) {
    // 简化：玩家固定为主公，其他玩家为反贼
    for (let i = 0; i < n; i++) {
      this.players[i].setIdentity(i === 0 ? IDENTITY.LORD : IDENTITY.REBEL);
    }
  }

  assignHeroes() {
    // 人类固定为刘备，AI随机分配
    const pool = ['liubei', 'guanyu', 'sunquan'];
    this.players[0].hero = HEROES.liubei;
    for (let i = 1; i < this.players.length; i++) {
      this.players[i].hero = HEROES[pool[Math.floor(Math.random() * pool.length)]];
    }
  }

  // ----- 回合流转 -----
  startTurn() {
    this.currentIdx = this.nextAliveFrom(this.currentIdx);
    if (this.currentIdx === -1) return;
    this.turnNum++;
    const p = this.cur;
    p.resetTurnState();
    this.phase = PHASE.READY;
    this.emitUpdate();
    this.log(`--- 第 ${this.turnNum} 回合 · ${p.name} 的回合 ---`);
    this.runPhase();
  }

  get cur() { return this.players[this.currentIdx]; }
  get isHumanTurn() { return this.currentIdx === this.humanIdx; }

  nextAliveFrom(from) {
    for (let i = 0; i < this.players.length; i++) {
      const idx = (from + 1 + i) % this.players.length;
      if (this.players[idx].alive) return idx;
    }
    return -1;
  }

  runPhase() {
    if (this.status !== 'playing') return;
    const p = this.cur;

    switch (this.phase) {
      case PHASE.READY:
        this.log(`${p.name} 进入准备阶段`);
        this.nextPhase();
        return;

      case PHASE.JUDGMENT:
        this.log(`${p.name} 进入判定阶段`);
        this.nextPhase();
        return;

      case PHASE.DRAW:
        this.log(`${p.name} 进入摸牌阶段`);
        const drawn = this.deck.draw(2);
        p.addCards(drawn);
        this.log(`${p.name} 摸了 2 张牌 (剩余 ${this.deck.totalRemaining} 张)`);
        this.emitUpdate();
        this.nextPhase();
        return;

      case PHASE.PLAY:
        this.log(`${p.name} 进入出牌阶段`);
        this.emitUpdate();
        if (this.isHumanTurn) {
          this.waitingFor = 'play';
          if (this.onAwaitPlay) this.onAwaitPlay();
        } else {
          this.delayed(400, () => this.runAIPlay());
        }
        return;

      case PHASE.DISCARD:
        const limit = p.handLimit;
        if (p.hand.length > limit) {
          const need = p.hand.length - limit;
          this.log(`${p.name} 需要弃 ${need} 张牌 (手牌 ${p.hand.length} / 体力 ${p.hp})`);
          this.emitUpdate();
          if (this.isHumanTurn) {
            this.waitingFor = 'discard';
            this.discardNeeded = need;
            if (this.onAwaitDiscard) this.onAwaitDiscard(need);
          } else {
            this.runAIDiscard(need);
          }
        } else {
          this.nextPhase();
        }
        return;

      case PHASE.END:
        this.log(`${p.name} 结束回合`);
        this.emitUpdate();
        this.delayed(300, () => this.startTurn());
        return;
    }
  }

  nextPhase() {
    const idx = PHASE_ORDER.indexOf(this.phase);
    if (idx < PHASE_ORDER.length - 1) {
      this.phase = PHASE_ORDER[idx + 1];
      this.emitUpdate();
      this.runPhase();
    }
  }

  // ----- 出牌（玩家调用）-----
  playerPlayCard(cardIdx, targetIdx) {
    if (this.waitingFor !== 'play') return false;
    const p = this.cur;
    if (cardIdx < 0 || cardIdx >= p.hand.length) return false;
    const card = p.hand[cardIdx];

    switch (card.subtype) {
      case 'strike': return this.useStrike(cardIdx, targetIdx);
      case 'peach': return this.usePeach(cardIdx);
      case 'wine': return this.useWine(cardIdx);
      default: return false;
    }
  }

  playerEndPlay() {
    if (this.waitingFor !== 'play') return;
    this.waitingFor = null;
    this.phase = PHASE.DISCARD;
    this.emitUpdate();
    this.runPhase();
  }

  playerDiscard(indices) {
    if (this.waitingFor !== 'discard') return;
    if (indices.length !== this.discardNeeded) return;
    const p = this.cur;
    // 从大到小排序以安全删除
    const sorted = [...indices].sort((a, b) => b - a);
    for (const idx of sorted) {
      const card = p.removeCard(idx);
      if (card) this.deck.discard(card);
    }
    this.log(`${p.name} 弃置了 ${indices.length} 张牌`);
    this.waitingFor = null;
    this.nextPhase();
  }

  // 响应杀/救
  playerRespond(cardIdx) {
    if (this.waitingFor !== 'response' || !this.pendingResponse) return false;
    const p = this.players[this.pendingResponse.playerIdx];
    if (!p || !p.alive) return false;
    if (cardIdx < 0 || cardIdx >= p.hand.length) return false;
    const card = p.hand[cardIdx];
    if (card.subtype !== this.pendingResponse.type) return false;

    p.removeCard(cardIdx);
    this.deck.discard(card);
    this.waitingFor = null;
    const cb = this.pendingResponse.onUse;
    this.pendingResponse = null;
    this.emitUpdate();
    if (cb) cb();
    // 响应完毕后，如果是AI回合且还在出牌阶段，推进AI回合
    this.tryAdvanceAITurn();
    return true;
  }

  playerPassResponse() {
    if (this.waitingFor !== 'response' || !this.pendingResponse) return;
    this.waitingFor = null;
    const cb = this.pendingResponse.onPass;
    this.pendingResponse = null;
    this.emitUpdate();
    if (cb) cb();
    this.tryAdvanceAITurn();
  }

  tryAdvanceAITurn() {
    if (this.currentIdx === this.humanIdx) return;
    if (this.phase !== PHASE.PLAY) return;
    if (this.status !== 'playing') return;
    if (this.waitingFor !== null) return; // 还有待响应(如濒死求救)
    this.delayed(400, () => {
      if (this.status !== 'playing') return;
      if (this.waitingFor !== null) return;
      this.phase = PHASE.DISCARD;
      this.emitUpdate();
      this.runPhase();
    });
  }

  // ----- 卡牌结算 -----

  useStrike(cardIdx, targetIdx) {
    const src = this.cur;
    if (src.hasUsedStrike) return false;
    if (!this.players[targetIdx] || !this.players[targetIdx].alive || targetIdx === this.currentIdx) return false;

    const card = src.removeCard(cardIdx);
    this.deck.discard(card);
    src.hasUsedStrike = true;

    const damage = src.wineBuff ? 2 : 1;
    src.wineBuff = false;
    this.log(`${src.name} 对 ${this.players[targetIdx].name} 使用了【杀】`);
    this.emitUpdate();

    // 目标出闪
    this.requestResponse(targetIdx, 'dodge',
      () => this.dealDamage(this.currentIdx, targetIdx, damage),
      () => this.log(`${this.players[targetIdx].name} 使用了【闪】`)
    );
    return true;
  }

  usePeach(cardIdx) {
    const p = this.cur;
    if (p.hp >= p.maxHp) return false;
    const card = p.removeCard(cardIdx);
    this.deck.discard(card);
    p.hp = Math.min(p.hp + 1, p.maxHp);
    this.log(`${p.name} 使用了【桃】, 回复 1 点体力`);
    this.emitUpdate();
    return true;
  }

  useWine(cardIdx) {
    const p = this.cur;
    const card = p.removeCard(cardIdx);
    this.deck.discard(card);
    p.wineBuff = true;
    // 酒可以在濒死时当桃用
    if (p.hp <= 0) {
      p.hp = Math.min(p.hp + 1, p.maxHp);
      this.log(`${p.name} 使用了【酒】自救`);
    } else {
      this.log(`${p.name} 使用了【酒】`);
    }
    this.emitUpdate();
    return true;
  }

  // ----- 武将技能 -----

  useRenDe(cardIndices, targetIdx) {
    const p = this.cur;
    if (!p.hero || p.hero.skillId !== 'renDe') return false;
    if (p.skillsUsed.renDe) return false;
    if (cardIndices.length === 0) return false;
    const target = this.players[targetIdx];
    if (!target || !target.alive || targetIdx === this.currentIdx) return false;

    const sorted = [...cardIndices].sort((a, b) => b - a);
    const cards = [];
    for (const idx of sorted) {
      const card = p.removeCard(idx);
      if (card) cards.push(card);
    }
    target.addCards(cards);
    p.skillsUsed.renDe = true;
    this.log(`${p.name} 发动【仁德】，将 ${cards.length} 张牌交给 ${target.name}`);
    this.emitUpdate();
    return true;
  }

  useWuSheng(cardIdx, targetIdx) {
    const p = this.cur;
    if (!p.hero || p.hero.skillId !== 'wuSheng') return false;
    if (p.hasUsedStrike) return false;
    if (cardIdx < 0 || cardIdx >= p.hand.length) return false;
    const card = p.hand[cardIdx];
    if (card.suit !== SUIT.HEART && card.suit !== SUIT.DIAMOND) return false;
    if (!this.players[targetIdx] || !this.players[targetIdx].alive || targetIdx === this.currentIdx) return false;

    p.removeCard(cardIdx);
    this.deck.discard(card);
    p.hasUsedStrike = true;

    const damage = p.wineBuff ? 2 : 1;
    p.wineBuff = false;
    this.log(`${p.name} 发动【武圣】，将【${card.name}】当【杀】使用`);
    this.emitUpdate();

    this.requestResponse(targetIdx, 'dodge',
      () => this.dealDamage(this.currentIdx, targetIdx, damage),
      () => this.log(`${this.players[targetIdx].name} 使用了【闪】`)
    );
    return true;
  }

  useZhiHeng(cardIndices) {
    const p = this.cur;
    if (!p.hero || p.hero.skillId !== 'zhiHeng') return false;
    if (p.skillsUsed.zhiHeng) return false;
    if (cardIndices.length === 0) return false;

    const sorted = [...cardIndices].sort((a, b) => b - a);
    const count = sorted.length;
    for (const idx of sorted) {
      const card = p.removeCard(idx);
      if (card) this.deck.discard(card);
    }

    const drawn = this.deck.draw(count);
    p.addCards(drawn);
    p.skillsUsed.zhiHeng = true;
    this.log(`${p.name} 发动【制衡】，弃 ${count} 张牌摸 ${drawn.length} 张`);
    this.emitUpdate();
    return true;
  }

  requestResponse(playerIdx, type, onFail, onUse) {
    const p = this.players[playerIdx];
    if (!p || !p.alive) { onFail(); return; }

    const hasCard = p.hand.some(c => c.subtype === type);
    if (playerIdx === this.humanIdx && hasCard) {
      const label = type === 'dodge' ? '闪' : type === 'peach' ? '桃' : type;
      this.waitingFor = 'response';
      this.pendingResponse = { playerIdx, type, onUse, onPass: onFail };
      this.emitUpdate();
      if (this.onAwaitResponse) this.onAwaitResponse(type, label);
    } else if (hasCard) {
      // AI: 闪必出, 桃看关系
      this.delayed(300, () => {
        const idx = p.findCard(type);
        if (idx !== -1) {
          const card = p.removeCard(idx);
          this.deck.discard(card);
          if (onUse) onUse();
        } else {
          if (onFail) onFail();
        }
        this.emitUpdate();
      });
    } else {
      this.delayed(200, onFail);
    }
  }

  // ----- 伤害/死亡 -----
  dealDamage(srcIdx, targetIdx, amount) {
    const target = this.players[targetIdx];
    if (!target || !target.alive) return;
    target.hp -= amount;
    this.log(`${target.name} 受到 ${amount} 点伤害 (体力 ${target.hp}/${target.maxHp})`);
    this.emitUpdate();

    if (target.hp <= 0) this.checkDeath(targetIdx);
  }

  checkDeath(idx) {
    const p = this.players[idx];
    if (p.hp > 0) return;

    // 尝试自救
    const peachIdx = p.findCard('peach');
    const wineIdx = p.findCard('wine');
    if (peachIdx !== -1) {
      const card = p.removeCard(peachIdx);
      this.deck.discard(card);
      p.hp = Math.min(p.hp + 1, p.maxHp);
      this.log(`${p.name} 使用【桃】自救`);
      this.emitUpdate();
      if (p.hp > 0) return;
    } else if (wineIdx !== -1) {
      // 酒可以在濒死时当桃
      const card = p.removeCard(wineIdx);
      this.deck.discard(card);
      p.hp = Math.min(p.hp + 1, p.maxHp);
      this.log(`${p.name} 使用【酒】自救`);
      this.emitUpdate();
      if (p.hp > 0) return;
    }

    // 询问其他玩家救
    if (idx === this.humanIdx) {
      this.requestSaveFromAI(idx, () => this.killPlayer(idx));
    } else {
      // AI 濒死, 如果是队友则询问人类是否救
      if (this.players[idx].isAllyOf(this.players[this.humanIdx])) {
        const canSave = this.players[this.humanIdx].hand.some(c => c.subtype === 'peach');
        if (canSave) {
          this.waitingFor = 'response';
          this.pendingResponse = {
            playerIdx: this.humanIdx,
            type: 'peach',
            onUse: () => {
              // playerRespond() 已移除并弃置了桃，这里只需回血
              this.players[idx].hp = Math.min(this.players[idx].hp + 1, this.players[idx].maxHp);
              this.log(`${this.players[this.humanIdx].name} 使用【桃】救活了 ${this.players[idx].name}`);
              this.emitUpdate();
            },
            onPass: () => this.killPlayer(idx),
          };
          this.emitUpdate();
          if (this.onAwaitResponse) {
            this.onAwaitResponse('peach', `是否用【桃】救 ${this.players[idx].name}？`);
          }
        } else {
          this.delayed(300, () => this.killPlayer(idx));
        }
      } else {
        this.delayed(300, () => this.killPlayer(idx));
      }
    }
  }

  requestSaveFromAI(dyingIdx, onFail) {
    // 简化的 AI 拯救: 有桃且是队友就救
    for (const p of this.players) {
      if (!p.alive || p.id === dyingIdx) continue;
      if (p.isAllyOf(this.players[dyingIdx])) {
        const peachIdx = p.findCard('peach');
        if (peachIdx !== -1) {
          p.removeCard(peachIdx);
          this.players[dyingIdx].hp = 1;
          this.log(`${p.name} 使用【桃】救活了 ${this.players[dyingIdx].name}`);
          this.emitUpdate();
          return;
        }
      }
    }
    onFail();
  }

  killPlayer(idx) {
    const p = this.players[idx];
    if (!p.alive) return;
    p.alive = false;
    p.identityRevealed = true;
    // 弃光手牌
    for (const card of p.hand) this.deck.discard(card);
    p.hand = [];

    this.log(`⚔ ${p.name} (${IDENTITY_LABEL[p.identity]}) 阵亡！`);
    this.emitUpdate();
    this.checkWinCondition();
  }

  // ----- 胜利判定（简化：主公 vs 反贼）-----
  checkWinCondition() {
    const lordAlive = this.players.some(p => p.isLord && p.alive);
    const rebelsAlive = this.players.some(p => p.isRebel && p.alive);

    if (!lordAlive) {
      this.endGame(IDENTITY.REBEL);
    } else if (!rebelsAlive) {
      this.endGame(IDENTITY.LORD);
    }
  }

  endGame(winnerId) {
    this.status = 'ended';
    this.winner = winnerId;
    for (const p of this.players) p.identityRevealed = true;

    const human = this.players[this.humanIdx];
    const humanWin = winnerId === human.identity;
    this.log(humanWin ? '🎉 你赢了！' : '💀 你输了...');
    this.emitUpdate();
    if (this.onGameOver) this.onGameOver(winnerId, humanWin);
  }

  // ----- AI 逻辑 -----
  runAIPlay() {
    const p = this.cur;
    if (!p.alive || this.status !== 'playing') return;

    // 1. 受伤时吃桃
    if (p.hp < p.maxHp) {
      const idx = p.findCard('peach');
      if (idx !== -1) {
        const card = p.removeCard(idx);
        this.deck.discard(card);
        p.hp = Math.min(p.hp + 1, p.maxHp);
        this.log(`${p.name} 使用了【桃】`);
        this.emitUpdate();
      }
    }

    // 2. 出杀
    if (!p.hasUsedStrike) {
      // 2a. 武圣: 红色牌当杀
      if (p.hero && p.hero.skillId === 'wuSheng') {
        const redIdx = p.hand.findIndex(c => c.suit === SUIT.HEART || c.suit === SUIT.DIAMOND);
        if (redIdx !== -1) {
          const targets = this.players
            .map((t, i) => ({ player: t, idx: i }))
            .filter(t => t.player.alive && t.idx !== this.currentIdx);
          const enemies = targets.filter(t => p.isEnemyOf(t.player));
          const canTarget = enemies.length > 0 ? enemies : targets;
          const target = canTarget.reduce((best, t) =>
            (!best || t.player.hp < best.player.hp) ? t : best, null);
          if (target) {
            this.useWuSheng(redIdx, target.idx);
            return;
          }
        }
      }

      // 2b. 普通出杀
      const strikeIdx = p.findCard('strike');
      if (strikeIdx !== -1) {
        const targets = this.players
          .map((t, i) => ({ player: t, idx: i }))
          .filter(t => t.player.alive && t.idx !== this.currentIdx);

        const enemies = targets.filter(t => p.isEnemyOf(t.player));
        const canTarget = enemies.length > 0 ? enemies : targets;

        const target = canTarget.reduce((best, t) =>
          (!best || t.player.hp < best.player.hp) ? t : best, null);

        if (target) {
          const wineIdx = p.findCard('wine');
          if (wineIdx !== -1) {
            const wCard = p.removeCard(wineIdx);
            this.deck.discard(wCard);
            p.wineBuff = true;
            this.log(`${p.name} 使用了【酒】`);
            this.emitUpdate();
          }

          const sCard = p.removeCard(strikeIdx);
          this.deck.discard(sCard);
          p.hasUsedStrike = true;
          const damage = p.wineBuff ? 2 : 1;
          p.wineBuff = false;
          this.log(`${p.name} 对 ${target.player.name} 使用了【杀】`);
          this.emitUpdate();

          const endAI = () => {
            if (this.status !== 'playing') return;
            if (this.waitingFor !== null) return;
            this.delayed(400, () => {
              if (this.status !== 'playing') return;
              if (this.waitingFor !== null) return;
              this.phase = PHASE.DISCARD;
              this.emitUpdate();
              this.runPhase();
            });
          };
          this.requestResponse(target.idx, 'dodge',
            () => { this.dealDamage(this.currentIdx, target.idx, damage); endAI(); },
            () => { this.log(`${target.player.name} 使用了【闪】`); endAI(); }
          );
          return;
        }
      }
    }

    // 3. 制衡: 弃低级牌换牌
    if (p.hero && p.hero.skillId === 'zhiHeng' && !p.skillsUsed.zhiHeng) {
      const toDiscard = p.hand
        .map((c, i) => ({ idx: i, pri: { strike: 0, wine: 1, dodge: 2, peach: 3 }[c.subtype] ?? -1 }))
        .filter(x => x.pri <= 1).map(x => x.idx);
      if (toDiscard.length >= 2) {
        this.useZhiHeng(toDiscard);
        this.delayed(200, () => this.runAIPlay());
        return;
      }
    }

    // 4. 仁德: 给盟友牌
    if (p.hero && p.hero.skillId === 'renDe' && !p.skillsUsed.renDe) {
      const allies = this.players.filter(t => t.alive && t.id !== p.id && p.isAllyOf(t));
      if (allies.length > 0) {
        const target = allies.reduce((a, b) => a.hand.length < b.hand.length ? a : b);
        const toGive = p.hand
          .map((c, i) => ({ idx: i, pri: { strike: 0, wine: 1, dodge: 2, peach: 3 }[c.subtype] ?? -1 }))
          .sort((a, b) => a.pri - b.pri).slice(0, 1).map(x => x.idx);
        if (toGive.length > 0) {
          this.useRenDe(toGive, target.id);
          this.delayed(200, () => this.runAIPlay());
          return;
        }
      }
    }

    // 5. 结束出牌
    this.delayed(300, () => {
      this.phase = PHASE.DISCARD;
      this.emitUpdate();
      this.runPhase();
    });
  }

  runAIDiscard(need) {
    const p = this.cur;
    if (need <= 0) { this.nextPhase(); return; }
    // 弃优先级低的牌: 杀 > 酒 > 闪 > 桃
    const priority = { strike: 0, wine: 1, dodge: 2, peach: 3 };
    const sorted = p.hand
      .map((c, i) => ({ idx: i, pri: priority[c.subtype] ?? -1 }))
      .sort((a, b) => a.pri - b.pri);

    const toDiscard = sorted.slice(0, need).map(x => x.idx).sort((a, b) => b - a);
    for (const idx of toDiscard) {
      const card = p.removeCard(idx);
      if (card) this.deck.discard(card);
    }
    this.log(`${p.name} 弃置了 ${need} 张牌`);
    this.emitUpdate();
    this.delayed(300, () => this.nextPhase());
  }

  // ----- 工具 -----
  log(msg) {
    this.logs.push(msg);
    if (this.onLog) this.onLog(msg);
  }

  emitUpdate() {
    if (this.onUpdate) this.onUpdate();
  }

  delayed(ms, fn) {
    setTimeout(fn, ms);
  }

  // 供 AI 使用的简陋 discard，修正：需要传真实 card 对象
  // 已在 runAIDiscard 中正确实现
}
