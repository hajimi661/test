// ============================================================
//  三国杀 — 服务端（Express + Socket.IO + 房间管理 + AI）
// ============================================================
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { SanguoshaGame, IDENTITY_LABEL, HEROES } = require('./game-engine');
const { AIPlayer } = require('./ai-player');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.static(path.join(__dirname, '..', 'client')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'client', 'index.html')));

// ---------- AI ----------
let aiCounter = 0;
const AI_NAMES = ['赵云','张飞','马超','黄忠','魏延','姜维','甘宁','吕蒙','张辽','徐晃','曹仁','夏侯惇','典韦','许褚','周瑜','陆逊'];

// ---------- 房间管理 ----------
const rooms = new Map();

function generateRoomId() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

class Room {
  constructor(id, hostId, hostName, maxPlayers) {
    this.id = id;
    this.hostId = hostId;
    this.maxPlayers = Math.max(2, Math.min(10, maxPlayers));
    this.players = [{ id: hostId, name: hostName, isAI: false }];
    this.game = null;
    this.ai = null;
    this.status = 'waiting';
  }
  addPlayer(id, name) {
    if (this.players.length >= this.maxPlayers) return false;
    if (this.players.find(p => p.id === id)) return false;
    this.players.push({ id, name, isAI: false });
    return true;
  }
  addAI() {
    if (this.players.length >= this.maxPlayers) return null;
    const idx = aiCounter++;
    const id = `ai_${idx}`;
    const name = `AI-${AI_NAMES[idx % AI_NAMES.length]}`;
    this.players.push({ id, name, isAI: true });
    return { id, name };
  }
  removePlayer(id) {
    const idx = this.players.findIndex(p => p.id === id);
    if (idx === -1) return false;
    if (this.players[idx].isAI === false && this.hostId === id && this.players.length > 1) {
      const next = this.players.find((p, i) => i !== idx);
      if (next) this.hostId = next.id;
    }
    this.players.splice(idx, 1);
    if (this.players.length > 0 && this.hostId === id) this.hostId = this.players[0].id;
    return true;
  }
  toJSON() {
    return {
      id: this.id, hostId: this.hostId, maxPlayers: this.maxPlayers,
      playerCount: this.players.length,
      players: this.players.map(p => ({ id: p.id, name: p.name, isAI: p.isAI })),
      status: this.status,
    };
  }
}

// ---------- 英雄选择后启动游戏 ----------
function startGameWithHeroes(room, roomId) {
  if (!room.game) return;
  const choices = room._heroChoices || {};
  const selectable = room._selectableHeroes || [];
  const usedHeroIds = new Set();

  for (let i = 0; i < room.players.length; i++) {
    const rp = room.players[i];
    let heroId = choices[rp.id];
    // 如果人类玩家没选，或AI玩家，从剩余中随机
    if (!heroId || !HEROES[heroId] || usedHeroIds.has(heroId)) {
      const available = Object.keys(HEROES).filter(k => !usedHeroIds.has(k));
      heroId = available[Math.floor(Math.random() * available.length)];
    }
    usedHeroIds.add(heroId);
    room.game.players[i].hero = HEROES[heroId];
  }

  // 启动游戏
  room.game.start();
  for (const p of room.players) {
    if (!p.isAI) {
      const state = room.game.getStateForPlayer(p.id);
      if (state) io.to(p.id).emit('your_info', state);
    }
  }
  console.log(`[游戏] ${roomId} 开始 (${room.players.length}人, AI:${room.players.filter(x=>x.isAI).length})`);
}

// ---------- Socket 事件 ----------
io.on('connection', (socket) => {
  console.log(`[连接] ${socket.id}`);

  socket.on('list_rooms', () => {
    const list = [];
    for (const [id, room] of rooms) {
      if (room.status === 'waiting') list.push(room.toJSON());
    }
    socket.emit('room_list', list);
  });

  socket.on('create_room', ({ name, maxPlayers }) => {
    // 先从旧房间移除（防止 findRoomByPlayer 找到旧房间）
    for (const [oldId, oldRoom] of rooms) {
      if (oldRoom.players.find(p => p.id === socket.id)) {
        oldRoom.removePlayer(socket.id);
        socket.leave(oldId);
        if (oldRoom.players.length === 0) rooms.delete(oldId);
        else io.to(oldId).emit('room_update', oldRoom.toJSON());
      }
    }
    let id = generateRoomId();
    while (rooms.has(id)) id = generateRoomId();
    const room = new Room(id, socket.id, name || '玩家', parseInt(maxPlayers) || 4);
    rooms.set(id, room);
    socket.join(id);
    socket.emit('room_created', room.toJSON());
    socket.emit('room_joined', room.toJSON());
    io.to(id).emit('room_update', room.toJSON());
    console.log(`[房间] ${id} 创建 (${room.maxPlayers}人) by ${socket.id}`);
  });

  socket.on('join_room', ({ roomId, name }) => {
    const room = rooms.get(roomId);
    if (!room) return socket.emit('error', { msg: '房间不存在' });
    if (room.status !== 'waiting') return socket.emit('error', { msg: '游戏已开始' });
    if (!room.addPlayer(socket.id, name || '玩家')) return socket.emit('error', { msg: '房间已满' });
    socket.join(roomId);
    socket.emit('room_joined', room.toJSON());
    io.to(roomId).emit('room_update', room.toJSON());
    console.log(`[房间] ${socket.id} 加入 ${roomId}`);
  });

  // ---- AI 管理 ----
  socket.on('add_ai', () => {
    for (const [id, room] of rooms) {
      if (room.hostId === socket.id && room.status === 'waiting') {
        const ai = room.addAI();
        if (!ai) return socket.emit('error', { msg: '房间已满' });
        io.to(id).emit('room_update', room.toJSON());
        io.to(id).emit('chat_message', { name: '系统', msg: `AI ${ai.name} 加入了房间` });
        console.log(`[AI] ${ai.name} 加入 ${id}`);
        return;
      }
    }
  });

  socket.on('remove_ai', ({ aiId }) => {
    for (const [id, room] of rooms) {
      if (room.hostId === socket.id && room.status === 'waiting') {
        const p = room.players.find(x => x.id === aiId);
        if (!p || !p.isAI) return;
        room.removePlayer(aiId);
        io.to(id).emit('room_update', room.toJSON());
        return;
      }
    }
  });

  socket.on('leave_room', () => {
    for (const [id, room] of rooms) {
      const p = room.players.find(x => x.id === socket.id);
      if (!p) continue;
      const isHost = room.hostId === socket.id;

      if (room.status === 'playing' && room.game) {
        socket.leave(id);
        room.removePlayer(socket.id);
        io.to(id).emit('room_update', room.toJSON());
        io.to(id).emit('chat_message', { name: '系统', msg: `${p.name} 离开了游戏` });
        return;
      }

      socket.leave(id);
      room.removePlayer(socket.id);

      if (room.players.length === 0) {
        rooms.delete(id);
        console.log(`[房间] ${id} 已删除`);
      } else if (isHost) {
        io.to(id).emit('room_dissolved', { msg: '房主已解散房间' });
        for (const pp of room.players) {
          const s = io.sockets.sockets.get(pp.id);
          if (s) s.leave(id);
        }
        rooms.delete(id);
        console.log(`[房间] ${id} 房主离开，已解散`);
      } else {
        io.to(id).emit('room_update', room.toJSON());
        io.to(id).emit('chat_message', { name: '系统', msg: `${p.name} 离开了房间` });
      }
      return;
    }
  });

  socket.on('start_game', () => {
    for (const [id, room] of rooms) {
      if (room.hostId === socket.id && room.status === 'waiting') {
        if (room.players.length < 2) return socket.emit('error', { msg: '至少需要2名玩家' });

        room.status = 'playing';
        const playerIds = room.players.map(p => p.id);
        const playerNames = room.players.map(p => p.name);

        // 清除旧游戏的事件监听器（防止重复触发）
        if (room.game) { room.game.status = 'ended'; room.game._listeners = {}; }
        room.game = new SanguoshaGame(playerIds, playerNames);
        console.log(`[start_game] 创建游戏, 玩家:`, playerIds);
        // 标记AI玩家
        for (let i = 0; i < room.players.length; i++) {
          if (room.players[i].isAI) room.game.players[i].isHuman = false;
        }
        room.ai = new AIPlayer(room.game);

        room.game.on('stateChanged', () => {
          // 每个玩家收到自己的视角（含距离信息和武将技能）
          for (const rp of room.players) {
            if (!rp.isAI) {
              io.to(rp.id).emit('game_state', room.game.getPublicState(rp.id));
              const ps = room.game.getStateForPlayer(rp.id);
              if (ps) {
                io.to(rp.id).emit('hand_update', ps.hand);
                if (ps.hero) io.to(rp.id).emit('your_info', ps);
              }
            }
          }
          // AI和其他监听者用默认视角
        });
        room.game.on('log', (msg) => { io.to(id).emit('game_log', msg); });
        room.game.on('turnStart', ({ playerId, playerName, turnNum }) => {
          io.to(id).emit('chat_message', { name: '系统', msg: `--- 第 ${turnNum} 回合 · ${playerName} 的回合 ---` });
        });
        room.game.on('awaitPlay', ({ playerId }) => {
          const p = room.players.find(x => x.id === playerId);
          console.log(`[awaitPlay] playerId: ${playerId}, found: ${!!p}, isAI: ${p?.isAI}, gameStatus: ${room.game?.status}`);
          if (!p) return;
          if (p.isAI) { room.ai.onAwaitPlay(playerId); }
          else { io.to(playerId).emit('your_action', { type: 'play' }); }
          io.to(id).emit('chat_message', { name: '系统', msg: `轮到 ${p.name} 出牌` });
        });
        room.game.on('awaitGuanXing', ({ playerId, cards, count }) => {
          const p = room.players.find(x => x.id === playerId);
          if (!p || p.isAI) return;
          io.to(playerId).emit('your_action', { type: 'guanXing', cards, count });
        });
        room.game.on('awaitDiscard', ({ playerId, count }) => {
          const p = room.players.find(x => x.id === playerId);
          if (!p) return;
          if (p.isAI) { room.ai.onAwaitDiscard(playerId, count); }
          else { io.to(playerId).emit('your_action', { type: 'discard', count }); }
        });
        room.game.on('awaitResponse', ({ playerId, type, label }) => {
          const p = room.players.find(x => x.id === playerId);
          if (!p) return;
          if (p.isAI) { room.ai.onAwaitResponse(playerId, type, label); }
          else { io.to(playerId).emit('your_action', { type: 'response', respondType: type, label }); }
        });
        room.game.on('awaitDrawChoice', ({ playerId, skillId, label }) => {
          const p = room.players.find(x => x.id === playerId);
          if (!p) return;
          if (p.isAI) { room.ai.onAwaitDrawChoice(playerId, skillId); }
          else { io.to(playerId).emit('your_action', { type: 'draw_choice', skillId, label }); }
        });
        room.game.on('drawCards', ({ playerId, cards }) => {
          const p = room.players.find(x => x.id === playerId);
          if (p && !p.isAI) io.to(playerId).emit('your_cards', { cards });
        });
        room.game.on('playerDied', ({ playerId, identity, identityLabel }) => {
          const p = room.players.find(x => x.id === playerId);
          io.to(id).emit('chat_message', { name: '系统', msg: `⚔ ${p?.name || playerId} (${identityLabel}) 阵亡！` });
          io.to(id).emit('player_died', { playerId, identity, identityLabel });
        });
        room.game.on('gameOver', ({ winnerId }) => {
          io.to(id).emit('game_over', { winnerId });
          room.status = 'ended';
        });

        io.to(id).emit('room_update', room.toJSON());

        // 英雄选择：给人类玩家发送可选英雄列表
        const allHeroKeys = Object.keys(HEROES);
        const shuffledHeroes = [...allHeroKeys].sort(() => Math.random() - 0.5);
        const selectableHeroes = shuffledHeroes.slice(0, Math.min(6, allHeroKeys.length)).map(k => ({
          id: HEROES[k].id, name: HEROES[k].name, hp: HEROES[k].hp, gender: HEROES[k].gender,
          skillName: HEROES[k].skillName, skillDesc: HEROES[k].skillDesc,
        }));
        room._selectableHeroes = selectableHeroes;
        room._heroChoices = {};

        // 通知所有人类玩家游戏开始（附带可选英雄）
        for (const rp of room.players) {
          if (!rp.isAI) {
            io.to(rp.id).emit('game_start', { myId: rp.id, totalPlayers: room.players.length });
            io.to(rp.id).emit('hero_selection', { heroes: selectableHeroes });
          }
        }

        // 等待人类玩家选择英雄（10秒超时自动随机）
        room._heroSelectionTimeout = setTimeout(() => {
          if (room.game && room.status === 'playing') {
            startGameWithHeroes(room, id);
          }
        }, 10000);

        console.log(`[游戏] ${id} 英雄选择阶段 (${room.players.length}人, AI:${room.players.filter(x=>x.isAI).length})`);
        return;
      }
    }
  });

  // ---- 游戏动作 ----
  socket.on('play_card', ({ cardIdx, targetIdx }) => {
    const room = findRoomByPlayer(socket.id);
    if (!room || !room.game) { console.log(`[play_card] 没找到房间或游戏: ${socket.id}`); return; }
    const g = room.game;
    console.log(`[play_card] player=${socket.id}, cardIdx=${cardIdx}, waitingFor=${g.waitingFor}, curId=${g.cur?.id}, phase=${g.phase}, status=${g.status}, handLen=${g.cur?.hand?.length}`);
    const r = g.playerPlayCard(socket.id, cardIdx, targetIdx);
    if (!r.ok) {
      console.log(`[play_card] 失败: ${r.msg}`);
      socket.emit('action_error', { msg: r.msg });
    }
  });

  // 观星选择
  socket.on('guanXing_choice', ({ topIndices }) => {
    const room = findRoomByPlayer(socket.id);
    if (!room || !room.game) return;
    const r = room.game.playerGuanXing(socket.id, topIndices || []);
    if (!r.ok) socket.emit('action_error', { msg: r.msg });
  });

  // 选择英雄
  socket.on('select_hero', ({ heroId }) => {
    for (const [id, room] of rooms) {
      if (room.players.find(p => p.id === socket.id) && room._heroChoices !== undefined) {
        if (!HEROES[heroId]) return;
        room._heroChoices[socket.id] = heroId;
        io.to(socket.id).emit('hero_selected', { heroId });
        // 检查所有人类玩家是否都已选择
        const humanPlayers = room.players.filter(p => !p.isAI);
        const allChosen = humanPlayers.every(p => room._heroChoices[p.id]);
        if (allChosen) {
          clearTimeout(room._heroSelectionTimeout);
          startGameWithHeroes(room, id);
        }
        return;
      }
    }
  });

  socket.on('end_play', () => {
    const room = findRoomByPlayer(socket.id);
    if (!room || !room.game) return;
    room.game.playerEndPlay(socket.id);
  });
  socket.on('discard', ({ indices }) => {
    const room = findRoomByPlayer(socket.id);
    if (!room || !room.game) return;
    const r = room.game.playerDiscard(socket.id, indices);
    if (!r.ok) socket.emit('action_error', { msg: r.msg });
  });
  socket.on('respond', ({ cardIdx }) => {
    const room = findRoomByPlayer(socket.id);
    if (!room || !room.game) return;
    const r = room.game.playerRespond(socket.id, cardIdx);
    if (!r.ok) socket.emit('action_error', { msg: r.msg });
  });
  socket.on('pass_response', () => {
    const room = findRoomByPlayer(socket.id);
    if (!room || !room.game) return;
    room.game.playerPassResponse(socket.id);
  });
  socket.on('use_skill', ({ skillId, data }) => {
    const room = findRoomByPlayer(socket.id);
    if (!room || !room.game) return;
    const r = room.game.useSkill(socket.id, skillId, data);
    if (!r.ok) socket.emit('action_error', { msg: r.msg });
  });
  socket.on('draw_choice', ({ useSkill }) => {
    const room = findRoomByPlayer(socket.id);
    if (!room || !room.game) return;
    room.game.playerDrawChoice(socket.id, useSkill);
  });

  // ---- 退出/重开 ----
  socket.on('quit_game', () => {
    for (const [id, room] of rooms) {
      const p = room.players.find(x => x.id === socket.id);
      if (!p) continue;
      socket.leave(id);
      room.removePlayer(socket.id);
      io.to(id).emit('chat_message', { name: '系统', msg: `${p.name} 退出了游戏` });
      io.to(id).emit('room_update', room.toJSON());
      const realPlayers = room.players.filter(x => !x.isAI);
      if (realPlayers.length === 0) {
        io.to(id).emit('room_dissolved', { msg: '所有玩家已离开' });
        rooms.delete(id);
        console.log(`[游戏] ${id} 已解散`);
      }
      socket.emit('quit_accepted');
      return;
    }
  });

  socket.on('restart_room', () => {
    for (const [id, room] of rooms) {
      if (room.hostId === socket.id) {
        console.log(`[restart] 房间 ${id} 重置, 当前玩家:`, room.players.map(p => p.id));
        // 停止旧游戏并清除所有监听器（防止旧事件继续触发）
        if (room.game) {
          room.game.status = 'ended';
          clearTimeout(room.game._saveChainTimer);
          room.game._listeners = {}; // 清除自定义事件监听器
        }
        room.status = 'waiting';
        room.game = null;
        room.ai = null;
        room.players = room.players.filter(x => !x.isAI);
        if (room.players.length === 0) {
          rooms.delete(id);
        } else {
          io.to(id).emit('room_reset', room.toJSON());
          io.to(id).emit('room_update', room.toJSON());
          io.to(id).emit('chat_message', { name: '系统', msg: '房间已重置，等待开始游戏' });
        }
        console.log(`[房间] ${id} 已重置`);
        return;
      }
    }
  });

  // ---- 聊天 ----
  socket.on('chat', ({ msg }) => {
    for (const [id, room] of rooms) {
      if (room.players.find(p => p.id === socket.id)) {
        const player = room.players.find(p => p.id === socket.id);
        io.to(id).emit('chat_message', { id: socket.id, name: player?.name || '未知', msg });
        return;
      }
    }
  });

  // ---- 断开 ----
  socket.on('disconnect', () => {
    console.log(`[断开] ${socket.id}`);
    for (const [id, room] of rooms) {
      const p = room.players.find(x => x.id === socket.id);
      if (!p) continue;
      room.removePlayer(socket.id);
      if (room.players.length === 0) {
        rooms.delete(id);
        console.log(`[房间] ${id} 已删除`);
      } else {
        io.to(id).emit('room_update', room.toJSON());
        io.to(id).emit('chat_message', { name: '系统', msg: `${p.name} 断开了连接` });
      }
      break;
    }
  });
});

function findRoomByPlayer(playerId) {
  for (const [id, room] of rooms) {
    if (room.players.find(p => p.id === playerId)) return room;
  }
  return null;
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`[服务] 三国杀联机服务器已启动 -> http://localhost:${PORT}`);
});
