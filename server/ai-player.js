// ============================================================
//  三国杀 — AI 玩家引擎（服务端）
// ============================================================
const { IDENTITY, SUIT } = require('./game-engine');

class AIPlayer {
  constructor(game) {
    this.game = game;
    this._timers = {};
  }

  // ----- 超时保护（所有阶段）-----
  _setTimer(playerId, phase, ms, fn) {
    this._clearTimer(playerId);
    this._timers[playerId] = setTimeout(() => {
      if (this.game.status !== 'playing') return;
      fn();
    }, ms);
  }

  _clearTimer(playerId) {
    if (this._timers[playerId]) { clearTimeout(this._timers[playerId]); delete this._timers[playerId]; }
  }

  _forceEndTurn(playerId) {
    const g = this.game;
    if (g.cur && g.cur.id === playerId && g.phase === 'play' && g.status === 'playing') {
      g.playerEndPlay(playerId);
    }
  }

  _forceDiscard(playerId, count) {
    const g = this.game;
    const p = g.players.find(x => x.id === playerId);
    if (!p || !p.alive) return;
    const need = Math.min(count || 1, p.hand.length);
    const toDiscard = p.hand.slice(0, need).map((_, i) => i);
    g.playerDiscard(playerId, toDiscard);
  }

  // ----- 对外接口（带超时）-----
  onAwaitPlay(playerId) {
    this._setTimer(playerId, 'play', 5000, () => this._forceEndTurn(playerId));
    setTimeout(() => this._runPlay(playerId), 200);
  }

  onAwaitDiscard(playerId, count) {
    this._setTimer(playerId, 'discard', 5000, () => this._forceDiscard(playerId, count));
    setTimeout(() => {
      this._clearTimer(playerId);
      this._runDiscard(playerId, count);
    }, 200);
  }

  onAwaitResponse(playerId, type, label) {
    this._setTimer(playerId, 'response', 5000, () => {
      const g = this.game;
      if (g.waitingFor === 'response') g.playerPassResponse(playerId);
    });
    setTimeout(() => {
      this._clearTimer(playerId);
      this._runResponse(playerId, type);
    }, 200);
  }

  // ----- 出牌阶段 -----
  _runPlay(playerId) {
    this._setTimer(playerId, 'play', 5000, () => this._forceEndTurn(playerId));
    const g = this.game;
    const p = g.players.find(x => x.id === playerId);
    if (!p || !p.alive || g.status !== 'playing') return;

    // 恢复出牌状态
    if (g.waitingFor === null && g.cur && g.cur.id === playerId && g.phase === 'play') {
      g.waitingFor = 'play';
      g.waitingPlayerId = playerId;
    }
    if (g.waitingFor !== 'play' || g.waitingPlayerId !== playerId) return;

    // 1. 受伤吃桃
    if (p.hp < p.maxHp) {
      const idx = p.findCard('peach');
      if (idx !== -1) { g.usePeach(idx); this._delayPlay(playerId); return; }
    }

    // 2. 出杀
    if (!p.hasUsedStrike) {
      const target = this._pickTarget(playerId);
      const strikeIdx = p.findCard('strike');

      if (strikeIdx !== -1 && target !== null) {
        const wineIdx = p.findCard('wine');
        if (wineIdx !== -1) g.useWine(wineIdx);
        const curStrike = p.findCard('strike');
        if (curStrike !== -1) {
          const r = g.playerPlayCard(playerId, curStrike, target);
          if (r.ok) { this._afterStrike(playerId); return; }
        }
      }

      // 武圣
      if (p.hero && p.hero.skillId === 'wuSheng' && target !== null) {
        const redIdx = p.hand.findIndex(c => c.suit === SUIT.HEART || c.suit === SUIT.DIAMOND);
        if (redIdx !== -1) {
          const r = g.useSkill(playerId, 'wuSheng', { cardIdx: redIdx, targetIdx: target });
          if (r.ok) { this._afterStrike(playerId); return; }
        }
      }
    }

    // 3. 制衡
    if (p.hero && p.hero.skillId === 'zhiHeng' && !p.skillsUsed.zhiHeng && p.hand.length >= 2) {
      const toDiscard = p.hand
        .map((c, i) => ({ idx: i, pri: { strike: 0, wine: 1, dodge: 2, peach: 3 }[c.subtype] ?? -1 }))
        .filter(x => x.pri <= 1).map(x => x.idx);
      if (toDiscard.length >= 2) {
        g.useSkill(playerId, 'zhiHeng', { cardIndices: toDiscard });
        this._delayPlay(playerId);
        return;
      }
    }

    // 4. 仁德
    if (p.hero && p.hero.skillId === 'renDe' && !p.skillsUsed.renDe && p.hand.length > 0) {
      const allies = g.players.filter(t => t.alive && t.id !== playerId && p.isAllyOf(t));
      if (allies.length > 0) {
        const ally = allies.reduce((a, b) => a.hand.length < b.hand.length ? a : b);
        const toGive = [p.hand
          .map((c, i) => ({ idx: i, pri: { strike: 0, wine: 1, dodge: 2, peach: 3 }[c.subtype] ?? -1 }))
          .sort((a, b) => a.pri - b.pri)[0]?.idx].filter(x => x !== undefined);
        if (toGive.length > 0) {
          g.useSkill(playerId, 'renDe', { cardIndices: toGive, targetIdx: g.players.indexOf(ally) });
          this._delayPlay(playerId);
          return;
        }
      }
    }

    // 5. 兜底：没有可出牌的，弃1张结束回合
    this._clearTimer(playerId);
    if (p.hand.length > 0) {
      g.playerDiscard(playerId, [0]); // 弃1张
    }
    g.playerEndPlay(playerId);
  }

  _delayPlay(playerId) {
    this._setTimer(playerId, 'play', 5000, () => this._forceEndTurn(playerId));
    setTimeout(() => this._runPlay(playerId), 200);
  }

  // ----- 异步响应恢复 -----
  _afterStrike(playerId) {
    this._clearTimer(playerId);
    setTimeout(() => this._pollTurn(playerId, 1), 500);
  }

  _pollTurn(playerId, attempt) {
    const g = this.game;
    const p = g.players.find(x => x.id === playerId);
    if (!p || !p.alive || g.status !== 'playing') return;
    if (g.cur.id !== playerId || g.phase !== 'play') return;

    if (g.waitingFor === 'response' && g.pendingResponse) {
      if (attempt < 10) {
        setTimeout(() => this._pollTurn(playerId, attempt + 1), 500);
      } else {
        this._forceEndTurn(playerId);
      }
      return;
    }

    if (g.waitingFor === null || (g.waitingFor === 'play' && g.waitingPlayerId === playerId)) {
      this._runPlay(playerId);
    } else {
      // 未知状态，保底结束
      this._forceEndTurn(playerId);
    }
  }

  // ----- 弃牌阶段 -----
  _runDiscard(playerId, count) {
    const g = this.game;
    const p = g.players.find(x => x.id === playerId);
    if (!p || !p.alive) return;

    const priority = { strike: 0, wine: 1, dodge: 2, peach: 3 };
    const sorted = p.hand
      .map((c, i) => ({ idx: i, pri: priority[c.subtype] ?? -1 }))
      .sort((a, b) => a.pri - b.pri);

    const need = Math.min(count || 0, sorted.length);
    if (need > 0) {
      const toDiscard = sorted.slice(0, need).map(x => x.idx);
      g.playerDiscard(playerId, toDiscard);
    } else {
      g.playerDiscard(playerId, []);
    }
  }

  // ----- 响应阶段 -----
  _runResponse(playerId, type) {
    const g = this.game;
    const p = g.players.find(x => x.id === playerId);
    if (!p || !p.alive) return;
    if (g.waitingFor !== 'response') return;

    const idx = p.findCard(type);
    if (idx !== -1) { g.playerRespond(playerId, idx); }
    else { g.playerPassResponse(playerId); }
  }

  // ----- 选目标 -----
  _pickTarget(playerId) {
    const g = this.game;
    const p = g.players.find(x => x.id === playerId);
    if (!p) return null;

    const targets = g.players
      .map((t, i) => ({ player: t, idx: i }))
      .filter(t => t.player.alive && t.player.id !== playerId);

    if (targets.length === 0) return null;

    const enemies = targets.filter(t => p.isEnemyOf(t.player));
    const pool = enemies.length > 0 ? enemies : targets;
    return pool.reduce((a, b) => a.player.hp < b.player.hp ? a : b).idx;
  }
}

module.exports = { AIPlayer };
