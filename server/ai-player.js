// ============================================================
//  三国杀 — AI 玩家引擎（标准版全武将支持）
// ============================================================
const { IDENTITY, SUIT, WEAPON_RANGE } = require('./game-engine');

class AIPlayer {
  constructor(game) { this.game = game; this._timers = {}; }

  _setTimer(playerId, key, ms, fn) {
    const k = playerId + ':' + key;
    if (this._timers[k]) clearTimeout(this._timers[k]);
    this._timers[k] = setTimeout(() => { delete this._timers[k]; if (this.game.status === 'playing') fn(); }, ms);
  }
  _clearAllTimers(playerId) {
    for (const k of Object.keys(this._timers)) {
      if (k.startsWith(playerId + ':')) { clearTimeout(this._timers[k]); delete this._timers[k]; }
    }
  }

  // ----- 外部接口 -----
  onAwaitPlay(playerId) {
    this._clearAllTimers(playerId);
    // 8秒安全超时
    this._setTimer(playerId, 'play', 8000, () => this._forceEndPlay(playerId));
    setTimeout(() => this._runPlay(playerId), 150);
  }

  onAwaitDiscard(playerId, count) {
    this._clearAllTimers(playerId);
    this._setTimer(playerId, 'discard', 5000, () => this._forceDiscard(playerId, count));
    setTimeout(() => this._runDiscard(playerId, count), 150);
  }

  onAwaitResponse(playerId, type, label) {
    this._clearAllTimers(playerId);
    this._setTimer(playerId, 'resp', 5000, () => this._forcePassResponse(playerId));
    setTimeout(() => this._runResponse(playerId, type), 150);
  }

  onAwaitDrawChoice(playerId, skillId) {
    this._clearAllTimers(playerId);
    this._setTimer(playerId, 'drawChoice', 5000, () => { if (this.game.status === 'playing') this.game.playerDrawChoice(playerId, false); });
    setTimeout(() => {
      const g = this.game; const p = g.players.find(x => x.id === playerId);
      if (!p || !p.alive || g.status !== 'playing') return;
      // AI策略：手牌少于3张时发动裸衣
      const useSkill = skillId === 'luoYi' && p.hand.length < 3;
      g.playerDrawChoice(playerId, useSkill);
    }, 150);
  }

  // ----- 强制操作 -----
  _forceEndPlay(playerId) {
    const g = this.game;
    if (g.status !== 'playing' || g.phase !== 'play') return;
    // 清理残留响应
    while (g.waitingFor === 'response' && g.pendingResponse) {
      const cb = g.pendingResponse.onPass;
      g.waitingFor = null; g.pendingResponse = null;
      if (cb) cb();
    }
    g.waitingFor = 'play'; g.waitingPlayerId = playerId;
    g.playerEndPlay(playerId);
  }

  _forceDiscard(playerId, count) {
    const g = this.game; const p = g.players.find(x => x.id === playerId);
    if (!p || !p.alive) return;
    while (g.waitingFor === 'response' && g.pendingResponse) {
      const cb = g.pendingResponse.onPass; g.waitingFor = null; g.pendingResponse = null; if (cb) cb();
    }
    const need = Math.min(count || 1, p.hand.length);
    g.playerDiscard(playerId, p.hand.slice(0, need).map((_, i) => i));
  }

  _forcePassResponse(playerId) {
    const g = this.game;
    if (g.waitingFor === 'response' && g.pendingResponse && g.pendingResponse.playerId === playerId) {
      g.playerPassResponse(playerId);
    }
  }

  // ----- 出牌逻辑 -----
  _runPlay(playerId) {
    const g = this.game;
    const p = g.players.find(x => x.id === playerId);
    if (!p || !p.alive || g.status !== 'playing') return;
    if (g.waitingFor === null && g.cur && g.cur.id === playerId && g.phase === 'play') { g.waitingFor = 'play'; g.waitingPlayerId = playerId; }
    if (g.waitingFor !== 'play' || g.waitingPlayerId !== playerId) return;

    // 1. 桃回血
    if (p.hp < p.maxHp) { const idx = p.findCard('peach'); if (idx !== -1) { g.usePeach(idx); this._continuePlay(playerId); return; } }

    // 2. 苦肉
    if (p.hero && p.hero.skillId === 'kuRou' && !p.skillsUsed.kuRou && p.hp > 1 && p.hand.length < 3) {
      p.skillsUsed.kuRou = true;
      const r = g.useSkill(playerId, 'kuRou', {});
      if (r.ok) { this._continuePlay(playerId); return; }
    }

    // 3. 出杀
    if (!p.hasUsedStrike) {
      const target = this._pickTarget(playerId);
      const strikeIdx = p.findCard('strike');
      const wuShengIdx = (p.hero && p.hero.skillId === 'wuSheng') ? p.hand.findIndex(c => c.suit === SUIT.HEART || c.suit === SUIT.DIAMOND) : -1;
      const longDanIdx = (p.hero && p.hero.skillId === 'longDan') ? p.findCard('dodge') : -1;
      const cardIdx = strikeIdx !== -1 ? strikeIdx : (wuShengIdx !== -1 ? wuShengIdx : (longDanIdx !== -1 ? longDanIdx : -1));

      if (cardIdx !== -1 && target !== null) {
        // 喝酒
        const wineIdx = p.findCard('wine');
        if (wineIdx !== -1) g.useWine(wineIdx);

        let played = false;
        if (strikeIdx !== -1) { const r = g.playerPlayCard(playerId, strikeIdx, target); played = r.ok; }
        if (!played && wuShengIdx !== -1) { const r = g.useSkill(playerId, 'wuSheng', { cardIdx: wuShengIdx, targetIdx: target }); played = r.ok; }
        if (!played && longDanIdx !== -1) { const r = g.useSkill(playerId, 'longDan', { cardIdx: longDanIdx, targetIdx: target }); played = r.ok; }
        if (played) return; // 杀发出后，由 awaitPlay 事件驱动继续
      }
    }

    // 4. 制衡
    if (p.hero && p.hero.skillId === 'zhiHeng' && !p.skillsUsed.zhiHeng && p.hand.length >= 2) {
      const toDiscard = p.hand.map((c, i) => ({ idx: i, pri: { strike: 0, wine: 1, dodge: 2, peach: 3 }[c.subtype] ?? -1 })).filter(x => x.pri <= 1).map(x => x.idx);
      if (toDiscard.length >= 2) { g.useSkill(playerId, 'zhiHeng', { cardIndices: toDiscard }); this._continuePlay(playerId); return; }
    }

    // 5. 仁德
    if (p.hero && p.hero.skillId === 'renDe' && !p.skillsUsed.renDe && p.hand.length > 0) {
      const allies = g.players.filter(t => t.alive && t.id !== playerId && p.isAllyOf(t));
      if (allies.length > 0) {
        const ally = allies.reduce((a, b) => a.hand.length < b.hand.length ? a : b);
        const toGive = [p.hand.map((c, i) => ({ idx: i, pri: { strike: 0, wine: 1, dodge: 2, peach: 3 }[c.subtype] ?? -1 })).sort((a, b) => a.pri - b.pri)[0]?.idx].filter(x => x !== undefined);
        if (toGive.length > 0) { g.useSkill(playerId, 'renDe', { cardIndices: toGive, targetIdx: g.players.indexOf(ally) }); this._continuePlay(playerId); return; }
      }
    }

    // 6. 奇袭
    if (p.hero && p.hero.skillId === 'qiXi') {
      const blackIdx = p.hand.findIndex(c => c.suit === SUIT.SPADE || c.suit === SUIT.CLUB);
      if (blackIdx !== -1) { const t = this._pickTarget(playerId); if (t !== null) { g.useSkill(playerId, 'qiXi', { cardIdx: blackIdx, targetIdx: t }); this._continuePlay(playerId); return; } }
    }

    // 7. 国色
    if (p.hero && p.hero.skillId === 'guoSe') {
      const diamondIdx = p.hand.findIndex(c => c.suit === SUIT.DIAMOND);
      if (diamondIdx !== -1) { const t = this._pickTarget(playerId); if (t !== null) { g.useSkill(playerId, 'guoSe', { cardIdx: diamondIdx, targetIdx: t }); this._continuePlay(playerId); return; } }
    }

    // 8. 反间
    if (p.hero && p.hero.skillId === 'fanJian' && !p.skillsUsed.fanJian && p.hand.length > 0) {
      const t = this._pickTarget(playerId);
      if (t !== null) { g.useSkill(playerId, 'fanJian', { targetIdx: t, guessedSuit: Math.floor(Math.random() * 4) }); this._continuePlay(playerId); return; }
    }

    // 9. 离间（需要两名男性角色）
    if (p.hero && p.hero.skillId === 'liJian' && !p.skillsUsed.liJian && p.hand.length > 0) {
      const males = g.players.filter(t => t.alive && t.id !== playerId && t.hero && t.hero.gender === 'male');
      if (males.length >= 2) {
        // 优先让敌人互相攻击
        const enemies = males.filter(t => p.isEnemyOf(t));
        const from = enemies.length > 0 ? enemies[0] : males[0];
        const to = enemies.length > 1 ? enemies[1] : males.find(t => t !== from) || males[1];
        g.useSkill(playerId, 'liJian', { cardIdx: 0, fromIdx: g.players.indexOf(from), toIdx: g.players.indexOf(to) });
        this._continuePlay(playerId); return;
      }
    }

    // 10. 装备
    const equipIdx = p.hand.findIndex(c => c.type === 'equip');
    if (equipIdx !== -1) { g.playerPlayCard(playerId, equipIdx); this._continuePlay(playerId); return; }

    // 11. 无中生有
    const wuZhongIdx = p.findCard('wuZhongShengYou');
    if (wuZhongIdx !== -1) { g.playerPlayCard(playerId, wuZhongIdx); this._continuePlay(playerId); return; }

    // 12. 桃园结义
    const taoYuanIdx = p.findCard('taoYuanJieYi');
    if (taoYuanIdx !== -1) { g.playerPlayCard(playerId, taoYuanIdx); this._continuePlay(playerId); return; }

    // 13. 结束出牌
    this._clearAllTimers(playerId);
    g.playerEndPlay(playerId);
  }

  _continuePlay(playerId) {
    // 短延迟后继续出牌
    setTimeout(() => this._runPlay(playerId), 200);
  }

  // ----- 弃牌逻辑 -----
  _runDiscard(playerId, count) {
    const g = this.game; const p = g.players.find(x => x.id === playerId);
    if (!p || !p.alive) return;
    const priority = { strike: 0, wine: 1, dodge: 2, peach: 3 };
    const sorted = p.hand.map((c, i) => ({ idx: i, pri: priority[c.subtype] ?? -1 })).sort((a, b) => a.pri - b.pri);
    const need = Math.min(count || 0, sorted.length);
    g.playerDiscard(playerId, need > 0 ? sorted.slice(0, need).map(x => x.idx) : []);
  }

  // ----- 响应逻辑 -----
  _runResponse(playerId, type) {
    const g = this.game; const p = g.players.find(x => x.id === playerId);
    if (!p || !p.alive || g.waitingFor !== 'response') return;
    let idx = p.findCard(type);
    if (idx === -1 && type === 'dodge') {
      if (p.hero && p.hero.skillId === 'longDan') idx = p.findCard('strike');
      if (idx === -1 && p.hero && p.hero.skillId === 'qingGuo') idx = p.hand.findIndex(c => c.suit === SUIT.SPADE || c.suit === SUIT.CLUB);
    }
    if (idx === -1 && type === 'strike' && p.hero && p.hero.skillId === 'longDan') idx = p.findCard('dodge');
    if (idx === -1 && type === 'strike' && p.hero && p.hero.skillId === 'wuSheng') idx = p.hand.findIndex(c => c.suit === SUIT.HEART || c.suit === SUIT.DIAMOND);
    if (idx === -1 && type === 'peach' && p.hero && p.hero.skillId === 'jiJiu' && g.cur.id !== playerId) idx = p.hand.findIndex(c => c.suit === SUIT.HEART || c.suit === SUIT.DIAMOND);
    if (idx !== -1) g.playerRespond(playerId, idx);
    else g.playerPassResponse(playerId);
  }

  // ----- 选目标 -----
  _pickTarget(playerId) {
    const g = this.game; const p = g.players.find(x => x.id === playerId);
    if (!p) return null;
    const targets = g.players.map((t, i) => ({ player: t, idx: i })).filter(t => t.player.alive && t.player.id !== playerId);
    if (targets.length === 0) return null;
    const enemies = targets.filter(t => p.isEnemyOf(t.player));
    const pool = enemies.length > 0 ? enemies : targets;
    return pool.reduce((a, b) => a.player.hp < b.player.hp ? a : b).idx;
  }
}

module.exports = { AIPlayer };
