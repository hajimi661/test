// ============================================================
//  三国杀 — 客户端（Socket + 渲染 + 动画）
// ============================================================

const socket = io();
let myId = null;

// ============================================================
//  音效系统（Web Audio API 合成）
// ============================================================
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let _audioCtx = null;
function getAudioCtx() { if (!_audioCtx) _audioCtx = new AudioCtx(); return _audioCtx; }

function playSound(type) {
  try {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    switch (type) {
      case 'card': osc.type = 'sine'; osc.frequency.setValueAtTime(800, now); osc.frequency.linearRampToValueAtTime(400, now + 0.1); gain.gain.setValueAtTime(0.15, now); gain.gain.linearRampToValueAtTime(0, now + 0.15); osc.start(now); osc.stop(now + 0.15); break;
      case 'damage': osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200, now); osc.frequency.linearRampToValueAtTime(80, now + 0.2); gain.gain.setValueAtTime(0.2, now); gain.gain.linearRampToValueAtTime(0, now + 0.3); osc.start(now); osc.stop(now + 0.3); break;
      case 'heal': osc.type = 'sine'; osc.frequency.setValueAtTime(400, now); osc.frequency.linearRampToValueAtTime(800, now + 0.2); gain.gain.setValueAtTime(0.12, now); gain.gain.linearRampToValueAtTime(0, now + 0.25); osc.start(now); osc.stop(now + 0.25); break;
      case 'skill': osc.type = 'triangle'; osc.frequency.setValueAtTime(600, now); osc.frequency.linearRampToValueAtTime(1200, now + 0.15); gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 0.2); osc.start(now); osc.stop(now + 0.2); break;
      case 'turn': osc.type = 'sine'; osc.frequency.setValueAtTime(500, now); osc.frequency.setValueAtTime(700, now + 0.1); gain.gain.setValueAtTime(0.08, now); gain.gain.linearRampToValueAtTime(0, now + 0.3); osc.start(now); osc.stop(now + 0.3); break;
      case 'die': osc.type = 'sawtooth'; osc.frequency.setValueAtTime(300, now); osc.frequency.linearRampToValueAtTime(50, now + 0.5); gain.gain.setValueAtTime(0.15, now); gain.gain.linearRampToValueAtTime(0, now + 0.6); osc.start(now); osc.stop(now + 0.6); break;
      case 'win': osc.type = 'sine'; osc.frequency.setValueAtTime(523, now); osc.frequency.setValueAtTime(659, now + 0.15); osc.frequency.setValueAtTime(784, now + 0.3); gain.gain.setValueAtTime(0.12, now); gain.gain.linearRampToValueAtTime(0, now + 0.5); osc.start(now); osc.stop(now + 0.5); break;
    }
  } catch (e) {}
}

let G = {
  players: [], currentPlayerId: null, phase: null, phaseLabel: '',
  turnNum: 0, deckCount: 0, discardCount: 0, logs: [], winner: null, status: 'idle',
};

let myHand = [];
let myIdentity = '';
let myIdentityLabel = '';
let myHero = null;
let myHeroSkill = null;

let targetMode = false;
let validTargets = [];
let selectedCardIdx = -1;
let skillState = null;
let discardSelection = new Set();
let _isHost = false;
let _prevTurnId = null;
let _prevPhase = null;

const $ = (s, p) => (p || document).querySelector(s);
const $$ = (s, p) => (p || document).querySelectorAll(s);

const el = {
  lobbyScreen:    $('#lobby-screen'), gameScreen: $('#game-screen'),
  inputName:      $('#input-name'), inputMaxPlayers: $('#input-max-players'),
  playerCountDisplay: $('#player-count-display'),
  btnCreateRoom:  $('#btn-create-room'), inputRoomId: $('#input-room-id'),
  btnJoinRoom:    $('#btn-join-room'), roomPanel: $('#room-panel'),
  roomIdDisplay:  $('#room-id-display'), roomPlayerCount: $('#room-player-count'),
  roomMaxDisplay: $('#room-max-display'), roomPlayerList: $('#room-player-list'),
  btnLeaveRoom:   $('#btn-leave-room'), btnStartGame: $('#btn-start-game'),
  lobbyError:     $('#lobby-error'),
  phaseDisplay:   $('#phase-display'), turnDisplay: $('#turn-display'),
  onlineCount:    $('#online-count'), seatingArea: $('#seating-area'),
  deckCount:      $('#deck-pile .pile-count'),
  discardCount:   $('#discard-count'),
  discardList:    $('#discard-list'),
  gameLog:        $('#game-log'),
  selfName:       $('.self-name'), selfHero: $('.self-hero'),
  selfIdentity:   $('.self-identity-tag'), selfHealthDots: $('#self-health-dots'),
  selfHpText:     $('#self-hp-text'), handCount: $('#hand-count'),
  handHint:       $('#hand-hint'), handCards: $('#hand-cards'),
  btnSkill:       $('#btn-skill'), btnEndPlay: $('#btn-end-play'),
  btnConfirmDiscard: $('#btn-confirm-discard'),
  btnConfirmSkill: $('#btn-confirm-skill'), btnCancelSkill: $('#btn-cancel-skill'),
  promptBar:      $('#prompt-bar'), promptMsg: $('#prompt-message'), promptBtns: $('#prompt-buttons'),
  chatMessages:   $('#chat-messages'), chatInput: $('#chat-input'), chatSend: $('#chat-send'),
  gameoverOverlay: $('#gameover-overlay'), gameoverTitle: $('#gameover-title'),
  gameoverDetail: $('#gameover-detail'), restartBtn: $('#restart-btn'),
  btnAddAi:       $('#btn-add-ai'), roomAiRow: $('#room-ai-row'),
  btnQuitGame:    $('#btn-quit-game'), btnRestartGame: $('#btn-restart-game'),
  animLayer:      $('#anim-layer'),
};

// ============================================================
//  动画系统
// ============================================================
function getAnimLayer() { return el.animLayer || document.body; }

// 卡牌飞行动画（从某处飞到某处）
function animCardFly(fromX, fromY, toX, toY, cardInfo) {
  const layer = getAnimLayer();
  const fly = document.createElement('div');
  fly.className = 'card-fly';
  fly.style.left = fromX + 'px';
  fly.style.top = fromY + 'px';
  fly.style.background = 'linear-gradient(145deg, #faf6eb, #f0e8d0)';
  fly.style.border = '2px solid #c9b99a';
  const subtype = cardInfo?.subtype || '';
  const colorMap = { strike: '#a03030', dodge: '#2060a0', peach: '#d06080', wine: '#c08030' };
  const name = cardInfo?.name || '牌';
  fly.innerHTML = `<span style="font-size:14px;color:${colorMap[subtype] || '#333'}">${name}</span>`;
  layer.appendChild(fly);

  // 使用 JS 动画实现平滑飞行
  const dx = toX - fromX;
  const dy = toY - fromY;
  const duration = 500;
  const start = performance.now();

  function animate(now) {
    const t = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3); // ease-out cubic
    fly.style.left = (fromX + dx * ease) + 'px';
    fly.style.top = (fromY + dy * ease) + 'px';
    fly.style.opacity = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
    fly.style.transform = `scale(${1 - t * 0.4})`;
    if (t < 1) requestAnimationFrame(animate);
    else fly.remove();
  }
  requestAnimationFrame(animate);
}

// 伤害数字浮动
function animDamageFloat(targetEl, amount, isHeal) {
  if (!targetEl) return;
  const rect = targetEl.getBoundingClientRect();
  const layer = getAnimLayer();
  const floater = document.createElement('div');
  floater.className = 'damage-float' + (isHeal ? ' heal' : '');
  floater.textContent = isHeal ? `+${amount}` : `-${amount}`;
  floater.style.left = (rect.left + rect.width / 2 - 20) + 'px';
  floater.style.top = (rect.top) + 'px';
  layer.appendChild(floater);
  setTimeout(() => floater.remove(), 1200);
}

// 技能光效
function animSkillFlash(targetEl, color) {
  if (!targetEl) return;
  const rect = targetEl.getBoundingClientRect();
  const layer = getAnimLayer();
  const flash = document.createElement('div');
  flash.className = 'skill-flash';
  flash.style.left = (rect.left + rect.width / 2 - 60) + 'px';
  flash.style.top = (rect.top + rect.height / 2 - 60) + 'px';
  flash.style.background = `radial-gradient(circle, ${color || 'rgba(212,168,67,0.4)'}, transparent)`;
  layer.appendChild(flash);
  setTimeout(() => flash.remove(), 800);
}

// 回合切换公告
function animTurnAnnounce(playerName) {
  const layer = getAnimLayer();
  const ann = document.createElement('div');
  ann.className = 'turn-announce';
  ann.textContent = `${playerName} 的回合`;
  layer.appendChild(ann);
  setTimeout(() => ann.remove(), 1500);
}

// 阶段指示器
function animPhaseIndicator(phaseLabel) {
  // 移除旧的
  const old = document.querySelectorAll('.phase-indicator');
  old.forEach(e => e.remove());

  const layer = getAnimLayer();
  const ind = document.createElement('div');
  ind.className = 'phase-indicator';
  ind.textContent = phaseLabel;
  layer.appendChild(ind);
  setTimeout(() => ind.remove(), 1000);
}

// 获取元素中心坐标
function getElCenter(selector) {
  const e = typeof selector === 'string' ? $(selector) : selector;
  if (!e) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const r = e.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

// 获取玩家座位元素
function getPlayerSlotEl(playerId) {
  const slots = $$('.player-slot');
  for (const slot of slots) {
    if (slot.dataset.playerId === playerId) return slot;
  }
  return null;
}

// ============================================================
//  Socket 事件
// ============================================================
socket.on('connect', () => { myId = socket.id; console.log('[socket] 已连接', myId); });
socket.on('room_created', (r) => { el.roomIdDisplay.textContent = r.id; showRoomPanel(r); });
socket.on('room_joined', (r) => { el.roomIdDisplay.textContent = r.id; showRoomPanel(r); });
socket.on('room_update', (r) => { showRoomPanel(r); });

socket.on('game_start', (data) => {
  console.log('[game_start] myId:', socket.id, 'data:', data);
  // 完全重建G，清除上一局所有残留状态
  G = { players: [], currentPlayerId: null, phase: null, phaseLabel: '', turnNum: 0, deckCount: 0, discardCount: 0, logs: [], winner: null, status: 'playing', waitingFor: null, pendingResponse: null, discardNeeded: 0 };
  myHand = []; myHero = null; myHeroSkill = null; myIdentity = ''; myIdentityLabel = '';
  targetMode = false; validTargets = []; selectedCardIdx = -1; discardSelection = new Set();
  skillState = null; _prevTurnId = null; _prevPhase = null;
  hidePrompt();
  showGameScreen();
});

// 英雄选择
socket.on('hero_selection', ({ heroes }) => {
  showHeroSelection(heroes);
});
socket.on('hero_selected', ({ heroId }) => {
  const overlay = document.getElementById('hero-select-overlay');
  if (overlay) overlay.remove();
});

socket.on('your_info', (info) => {
  myHand = info.hand || []; myIdentity = info.identity; myIdentityLabel = info.identityLabel;
  myHero = info.hero; myHeroSkill = info.heroSkill; renderAll();
});
socket.on('your_cards', ({ cards }) => {
  if (cards && cards.length > 0) {
    myHand.push(...cards);
    playSound('card');
    const deckPos = getElCenter('#deck-pile');
    const selfPos = getElCenter('#self-area');
    cards.forEach((c, i) => {
      setTimeout(() => animCardFly(deckPos.x, deckPos.y, selfPos.x, selfPos.y, c), i * 100);
    });
  }
});
socket.on('hand_update', (hand) => {
  myHand = hand || [];
  console.log('[hand_update]', myHand.map(c => c.name).join(','));
  renderAll();
});

socket.on('game_state', (state) => {
  console.log('[game_state] currentPlayerId:', state.currentPlayerId, 'myId:', myId, 'phase:', state.phase, 'status:', state.status, 'waitingFor:', G.waitingFor);
  const prevPhase = G.phase;
  const prevTurnId = G.currentPlayerId;
  // 保留客户端的等待状态，不被服务端的公共状态覆盖
  // waitingFor 只由 your_action 事件管理，game_state 不应清除它
  const savedWaitingFor = G.waitingFor;
  const savedPendingResponse = G.pendingResponse;
  const savedDiscardNeeded = G.discardNeeded;
  G = { ...G, ...state };
  G.waitingFor = savedWaitingFor;
  G.pendingResponse = savedPendingResponse;
  G.discardNeeded = savedDiscardNeeded;

  // 游戏结束时清除等待状态
  if (state.status === 'ended') {
    G.waitingFor = null;
    G.pendingResponse = null;
    hidePrompt();
  }

  // 回合切换动画
  if (state.currentPlayerId && state.currentPlayerId !== prevTurnId) {
    const player = G.players.find(p => p.id === state.currentPlayerId);
    if (player) { animTurnAnnounce(player.name); playSound('turn'); }
  }

  // 阶段切换动画
  if (state.phase && state.phase !== prevPhase && state.phaseLabel) {
    animPhaseIndicator(state.phaseLabel);
  }

  renderAll();
});

socket.on('your_action', (action) => {
  console.log('[your_action]', action.type, 'currentPlayerId:', G.currentPlayerId, 'myId:', myId, 'socketId:', socket.id);
  switch (action.type) {
    case 'play': G.waitingFor = 'play'; G.discardNeeded = 0; skillState = null; targetMode = false; renderAll(); break;
    case 'discard': G.waitingFor = 'discard'; G.discardNeeded = action.count; discardSelection = new Set(); el.handHint.textContent = `需要弃 ${action.count} 张牌`; renderAll(); break;
    case 'response': G.waitingFor = 'response'; G.pendingResponse = { type: action.respondType, label: action.label }; renderAll(); showPrompt(action.respondType, action.label); break;
    case 'draw_choice': G.waitingFor = 'draw_choice'; G.drawChoiceSkill = action.skillId; renderAll(); showDrawChoicePrompt(action.label); break;
    case 'guanXing': G.waitingFor = 'guanXing'; renderAll(); showGuanXingUI(action.cards, action.count); break;
  }
});

socket.on('game_log', (msg) => { appendLog(msg); });

// 伤害事件（从服务端日志解析）
socket.on('game_log', function detectDamage(msg) {
  // 解析伤害日志
  const dmgMatch = msg.match(/(.+) 受到 (\d+) 点伤害/);
  if (dmgMatch) {
    const name = dmgMatch[1];
    const amount = parseInt(dmgMatch[2]);
    const player = G.players.find(p => p.name === name);
    if (player) {
      const slotEl = getPlayerSlotEl(player.id);
      animDamageFloat(slotEl, amount, false);
      playSound('damage');
    }
  }
  // 解析回血日志
  const healMatch = msg.match(/(.+) 使用了【桃】/);
  if (healMatch) {
    const name = healMatch[1];
    const player = G.players.find(p => p.name === name);
    if (player) {
      const slotEl = getPlayerSlotEl(player.id);
      animDamageFloat(slotEl, 1, true);
      playSound('heal');
    }
  }
});

socket.on('game_over', ({ winnerId }) => {
  G.winner = winnerId; G.status = 'ended'; renderAll(); showGameOver();
  playSound('win');
});

socket.on('room_dissolved', ({ msg }) => {
  el.lobbyError.textContent = msg || '房间已解散'; el.lobbyError.classList.remove('hidden');
  backToLobby();
});
socket.on('room_reset', () => { backToLobby(); });
socket.on('quit_accepted', () => { backToLobby(); });

socket.on('chat_message', ({ id, name, msg }) => { appendChat(name, msg, id === myId); });
socket.on('action_error', ({ msg }) => { if (msg) { appendLog(`[提示] ${msg}`, 'system'); console.log('[action_error]', msg, 'waitingFor:', G.waitingFor, 'currentPlayerId:', G.currentPlayerId, 'myId:', myId); } });
socket.on('error', ({ msg }) => { showLobbyError(msg); });

// ============================================================
//  大厅 UI
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  const names = ['刘备','关羽','孙权','曹操','赵云','诸葛亮','周瑜','吕布','貂蝉','司马懿'];
  el.inputName.value = names[Math.floor(Math.random() * names.length)] + Math.floor(Math.random() * 100);

  el.inputMaxPlayers.addEventListener('input', () => { el.playerCountDisplay.textContent = el.inputMaxPlayers.value; });
  el.btnCreateRoom.addEventListener('click', () => {
    socket.emit('create_room', { name: el.inputName.value.trim() || '玩家', maxPlayers: parseInt(el.inputMaxPlayers.value) });
  });
  el.btnJoinRoom.addEventListener('click', () => {
    const roomId = el.inputRoomId.value.trim().toUpperCase();
    if (roomId.length < 4) return showLobbyError('请输入4位房间号');
    socket.emit('join_room', { roomId, name: el.inputName.value.trim() || '玩家' });
  });
  el.btnLeaveRoom.addEventListener('click', () => { socket.emit('leave_room'); el.roomPanel.classList.add('hidden'); });
  el.btnStartGame.addEventListener('click', () => { socket.emit('start_game'); });
  el.btnAddAi.addEventListener('click', () => { socket.emit('add_ai'); });
  el.btnQuitGame.addEventListener('click', () => { socket.emit('quit_game'); });
  el.btnRestartGame.addEventListener('click', () => { socket.emit('restart_room'); });

  el.restartBtn.addEventListener('click', backToLobby);

  el.btnEndPlay.addEventListener('click', () => { if (G.waitingFor === 'play') { socket.emit('end_play'); G.waitingFor = null; renderAll(); } });
  el.btnConfirmDiscard.addEventListener('click', () => {
    if (G.waitingFor === 'discard') { socket.emit('discard', { indices: [...discardSelection] }); G.waitingFor = null; renderAll(); }
  });
  el.btnSkill.addEventListener('click', onSkillClick);
  el.btnConfirmSkill.addEventListener('click', onConfirmSkill);
  el.btnCancelSkill.addEventListener('click', () => { skillState = null; renderAll(); });
  el.chatSend.addEventListener('click', sendChat);
  el.chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendChat(); });
  el.inputRoomId.addEventListener('input', () => { el.inputRoomId.value = el.inputRoomId.value.toUpperCase(); });
});

function showRoomPanel(room) {
  el.roomPanel.classList.remove('hidden');
  el.roomIdDisplay.textContent = room.id;
  el.roomPlayerCount.textContent = room.players.length;
  el.roomMaxDisplay.textContent = room.maxPlayers;
  el.lobbyError.classList.add('hidden');

  _isHost = room.hostId === myId;
  el.roomPlayerList.innerHTML = '';
  for (const p of room.players) {
    const div = document.createElement('div');
    div.className = 'room-player';
    div.innerHTML = `${p.name}<span style="color:var(--text-secondary);font-size:11px">${p.isAI ? ' · AI' : ''}</span>`;
    if (p.id === room.hostId) div.innerHTML += ' <span style="color:var(--accent-gold)">房主</span>';
    if (p.id === myId) div.innerHTML += ' <span style="color:var(--accent-green)">我</span>';
    if (_isHost && p.isAI) {
      const rmBtn = document.createElement('button');
      rmBtn.textContent = '×'; rmBtn.style.cssText = 'margin-left:auto;background:none;border:1px solid var(--accent-red);color:var(--accent-red);border-radius:3px;cursor:pointer;padding:0 6px;font-size:13px';
      rmBtn.onclick = () => socket.emit('remove_ai', { aiId: p.id });
      div.appendChild(rmBtn);
    }
    el.roomPlayerList.appendChild(div);
  }

  el.roomAiRow.classList.toggle('hidden', !_isHost);
  el.roomAiRow.style.display = _isHost ? 'flex' : 'none';
  el.btnAddAi.disabled = room.players.length >= room.maxPlayers;
  el.btnStartGame.classList.toggle('hidden', !_isHost);
  el.btnStartGame.disabled = room.players.length < 2;
}

function showLobbyError(msg) {
  el.lobbyError.textContent = msg; el.lobbyError.classList.remove('hidden');
  setTimeout(() => el.lobbyError.classList.add('hidden'), 3000);
}

function showHeroSelection(heroes) {
  // 移除旧的选择界面
  const old = document.getElementById('hero-select-overlay');
  if (old) old.remove();

  const overlay = document.createElement('div');
  overlay.id = 'hero-select-overlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:1000;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#e8d5a3;font-family:"Microsoft YaHei",sans-serif';

  const title = document.createElement('h2');
  title.textContent = '选择武将';
  title.style.cssText = 'color:#f0c060;margin-bottom:20px;font-size:24px';
  overlay.appendChild(title);

  const grid = document.createElement('div');
  grid.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:15px;max-width:700px';

  for (const hero of heroes) {
    const card = document.createElement('div');
    card.style.cssText = 'background:linear-gradient(145deg,#2a2520,#1a1510);border:2px solid #665533;border-radius:10px;padding:15px;cursor:pointer;transition:all 0.2s;text-align:center;min-width:180px';
    card.innerHTML = `
      <div style="font-size:20px;color:#f0c060;margin-bottom:8px">${hero.name}</div>
      <div style="font-size:13px;color:#aaa;margin-bottom:5px">体力: ${hero.hp} | ${hero.gender === 'male' ? '男' : '女'}</div>
      <div style="font-size:14px;color:#e8d5a3;margin-bottom:5px">【${hero.skillName}】</div>
      <div style="font-size:11px;color:#999;line-height:1.4">${hero.skillDesc || ''}</div>
    `;
    card.onmouseenter = () => { card.style.borderColor = '#f0c060'; card.style.transform = 'scale(1.05)'; };
    card.onmouseleave = () => { card.style.borderColor = '#665533'; card.style.transform = 'scale(1)'; };
    card.onclick = () => {
      socket.emit('select_hero', { heroId: hero.id });
      // 高亮选中的
      grid.querySelectorAll('div').forEach(d => { d.style.borderColor = '#665533'; d.style.opacity = '0.5'; });
      card.style.borderColor = '#f0c060'; card.style.opacity = '1';
    };
    grid.appendChild(card);
  }
  overlay.appendChild(grid);

  const hint = document.createElement('div');
  hint.textContent = '10秒后自动随机选择';
  hint.style.cssText = 'color:#777;margin-top:15px;font-size:12px';
  overlay.appendChild(hint);

  document.body.appendChild(overlay);
}

function showGameScreen() {
  el.lobbyScreen.classList.add('hidden'); el.gameScreen.classList.remove('hidden');
  el.gameLog.innerHTML = ''; renderAll();
}

function backToLobby() {
  el.gameoverOverlay.classList.add('hidden');
  el.gameScreen.classList.add('hidden');
  el.lobbyScreen.classList.remove('hidden');
  el.roomPanel.classList.add('hidden');
  G = { players: [], phase: null, phaseLabel: '', turnNum: 0, deckCount: 0, discardCount: 0, logs: [], status: 'idle', currentPlayerId: null, winner: null, waitingFor: null, pendingResponse: null, discardNeeded: 0 };
  myHand = []; skillState = null; _isHost = false; _prevTurnId = null; _prevPhase = null;
  targetMode = false; validTargets = []; selectedCardIdx = -1; discardSelection = new Set();
}

// ============================================================
//  游戏渲染
// ============================================================
function renderAll() { renderTopBar(); renderSeating(); renderCenterArea(); renderSelfArea(); renderEquipment(); renderHand(); renderActionBar(); }

// ============================================================
//  卡牌效果说明数据库
// ============================================================
const CARD_DESC = {
  strike: '出牌阶段对攻击范围内的一名角色使用，目标需打出【闪】响应，否则受到1点伤害。',
  dodge: '当你成为【杀】的目标时，可以打出【闪】来抵消。',
  peach: '出牌阶段对自己使用，回复1点体力；或在其他角色濒死时对其使用。',
  wine: '出牌阶段使用，本回合下一张【杀】伤害+1；濒死时可自救回复1点体力。',
  wuZhongShengYou: '出牌阶段使用，摸两张牌。',
  guoHeChaiQiao: '出牌阶段对其他角色使用，随机弃置其一张牌（手牌或装备）。',
  shunShouQianYang: '出牌阶段对距离1以内的角色使用，随机获得其一张牌。',
  jueDou: '出牌阶段对其他角色使用，双方轮流打出【杀】，无法打出者受到1点伤害。',
  nanManRuQin: '出牌阶段使用，所有其他角色需各打出一张【杀】，否则受到1点伤害。',
  wanJianQiFa: '出牌阶段使用，所有其他角色需各打出一张【闪】，否则受到1点伤害。',
  taoYuanJieYi: '出牌阶段使用，所有已受伤角色各回复1点体力。',
  leBuSiShu: '延时锦囊，判定非红桃则跳过出牌阶段。',
  bingLiangCunDuan: '延时锦囊，判定非梅花则跳过摸牌阶段。',
  shanDian: '延时锦囊，判定黑桃2-9则受到3点雷电伤害，否则传给下家。',
  wuXieKeJi: '在锦囊牌生效前使用，抵消该锦囊的效果。',
  huoGong: '出牌阶段对有手牌的角色使用，目标展示一张手牌，你弃一张同花色牌则目标受1点火焰伤害。',
  tieSuoLianHuan: '出牌阶段使用，选择1-2名角色横置或重置（铁索连环状态）。',
  jieDaoShaRen: '出牌阶段对有武器的其他角色使用，令其对你指定的角色出【杀】。',
  zhangba: '武器，范围3。你可以将两张手牌当【杀】使用或打出。',
  guanShiFu: '武器，范围3。你使用的【杀】被【闪】抵消时，可以弃两张牌令此【杀】继续造成伤害。',
  qingLong: '武器，范围3。你使用的【杀】被【闪】抵消时，可以再出一张【杀】。',
  zhuGeLianNu: '武器，范围1。你使用【杀】无次数限制。',
  hanBingJian: '武器，范围2。你使用的【杀】造成伤害时，可以防止此伤害，改为弃置目标两张牌。',
  ciXiongShuangJian: '武器，范围2。你对异性角色使用【杀】时，目标需弃一张手牌或你摸一张牌。',
  fangTianHuaJi: '武器，范围4。你使用的【杀】是最后一张手牌时，可以额外指定两个目标。',
  qingGangJian: '武器，范围2。你使用的【杀】无视目标的防具。',
  baGuaZhen: '防具。每当你需要打出【闪】时，可以判定：红桃或方块视为打出【闪】。',
  renWangDun: '防具。黑色【杀】对你无效。',
  chiTu: '进攻坐骑，你与其他角色的距离-1。',
  ziXing: '进攻坐骑，你与其他角色的距离-1。',
  daYuan: '进攻坐骑，你与其他角色的距离-1。',
  jueYing: '防御坐骑，其他角色与你的距离+1。',
  zhuaHuangFeiDian: '防御坐骑，其他角色与你的距离+1。',
  diLu: '防御坐骑，其他角色与你的距离+1。',
};

// ============================================================
//  装备区渲染
// ============================================================
function renderEquipment() {
  const me = G.players.find(p => p.id === myId);
  if (!me) return;
  const slots = [
    { key: 'weapon', label: '武器', type: '武器' },
    { key: 'armor', label: '防具', type: '防具' },
    { key: 'defHorse', label: '+1马', type: '防御坐骑' },
    { key: 'atkHorse', label: '-1马', type: '进攻坐骑' },
  ];
  for (const { key, label, type } of slots) {
    const el = document.querySelector(`.equip-slot[data-slot="${key}"]`);
    if (!el) continue;
    const card = me.equipment?.[key];
    const cardEl = el.querySelector('.equip-slot-card');
    const labelEl = el.querySelector('.equip-slot-label');
    if (card) {
      el.classList.add('has-card');
      cardEl.textContent = card.name;
      labelEl.textContent = card.name;
      el.onmouseenter = (e) => showTooltip(e, card.name, type, CARD_DESC[card.subtype] || '');
      el.onmousemove = (e) => moveTooltip(e);
      el.onmouseleave = hideTooltip;
    } else {
      el.classList.remove('has-card');
      cardEl.textContent = '';
      labelEl.textContent = label;
      el.onmouseenter = null;
      el.onmousemove = null;
      el.onmouseleave = null;
    }
  }
}

function getCardTypeLabel(card) {
  if (card.equipSlot === 'weapon' || (card.type === 'equip' && ['zhangba','guanShiFu','qingLong','zhuGeLianNu','hanBingJian','ciXiongShuangJian','fangTianHuaJi','qingGangJian'].includes(card.subtype))) return '武器';
  if (card.equipSlot === 'armor' || (card.type === 'equip' && ['baGuaZhen','renWangDun'].includes(card.subtype))) return '防具';
  if (card.equipSlot === 'defHorse' || (card.type === 'equip' && ['jueYing','zhuaHuangFeiDian','diLu'].includes(card.subtype))) return '防御坐骑';
  if (card.equipSlot === 'atkHorse' || (card.type === 'equip' && ['chiTu','ziXing','daYuan'].includes(card.subtype))) return '进攻坐骑';
  if (card.subtype === 'strike' || card.subtype === 'dodge' || card.subtype === 'peach' || card.subtype === 'wine') return '基本牌';
  return '锦囊牌';
}

// ============================================================
//  悬停提示系统
// ============================================================
let _tooltipEl = null;
function showTooltip(e, name, type, desc) {
  if (!_tooltipEl) {
    _tooltipEl = document.createElement('div');
    _tooltipEl.className = 'card-tooltip';
    document.body.appendChild(_tooltipEl);
  }
  _tooltipEl.innerHTML = `<div class="tt-name">${name}</div><div class="tt-type">${type}</div><div class="tt-desc">${desc}</div>`;
  _tooltipEl.style.display = 'block';
  moveTooltip(e);
}
function moveTooltip(e) {
  if (!_tooltipEl) return;
  const x = e.clientX + 15;
  const y = e.clientY - 10;
  _tooltipEl.style.left = Math.min(x, window.innerWidth - 280) + 'px';
  _tooltipEl.style.top = Math.min(y, window.innerHeight - 150) + 'px';
}
function hideTooltip() {
  if (_tooltipEl) _tooltipEl.style.display = 'none';
}

function renderTopBar() {
  el.phaseDisplay.textContent = G.phaseLabel || '等待中';
  el.turnDisplay.textContent = `第 ${G.turnNum} 回合`;
  el.onlineCount.textContent = G.players.filter(p => p.alive).length;
  el.btnRestartGame.classList.toggle('hidden', !_isHost);
}

function renderSeating() {
  el.seatingArea.innerHTML = '';
  if (!G.players || G.players.length === 0) return;
  const myIdx = G.players.findIndex(p => p.id === myId);
  const others = G.players.filter((_, i) => i !== myIdx);
  const me = G.players[myIdx];
  const grid = document.createElement('div'); grid.className = 'seating-grid';
  for (const p of others) grid.appendChild(createSlot(p, false));
  if (me) grid.appendChild(createSlot(me, true));
  el.seatingArea.appendChild(grid);
}

function createSlot(p, isMe) {
  const slot = document.createElement('div'); slot.className = 'player-slot';
  slot.dataset.playerId = p.id;
  if (!p.alive) slot.classList.add('dead');
  if (p.id === G.currentPlayerId && p.alive) slot.classList.add('current-turn');
  if (isMe) slot.classList.add('me');
  const av = document.createElement('div'); av.className = 'player-avatar';
  av.textContent = p.alive ? (p.heroName ? p.heroName[0] : '?') : '💀'; slot.appendChild(av);
  // 武将头像悬停提示
  const heroData = p.heroName ? Object.values(HEROES).find(h => h.name === p.heroName) : null;
  if (heroData && p.alive) {
    av.style.cursor = 'help';
    av.addEventListener('mouseenter', (e) => showTooltip(e, heroData.name, '武将', `${heroData.skillName}：${heroData.skillDesc || heroData.skillType || ''}`));
    av.addEventListener('mousemove', (e) => moveTooltip(e));
    av.addEventListener('mouseleave', hideTooltip);
  }
  const nm = document.createElement('div'); nm.className = 'player-name'; nm.textContent = p.name; slot.appendChild(nm);
  // 武将名 + 技能名
  const hr = document.createElement('div'); hr.className = 'player-hero';
  if (p.alive && heroData) {
    hr.innerHTML = `<span style="color:#e8d5a3">${p.heroName}</span> <span style="color:#f0c060;font-size:10px">【${heroData.skillName}】</span>`;
    hr.style.cursor = 'help';
    hr.addEventListener('mouseenter', (e) => showTooltip(e, heroData.skillName, '武将技能', heroData.skillDesc || ''));
    hr.addEventListener('mousemove', (e) => moveTooltip(e));
    hr.addEventListener('mouseleave', hideTooltip);
  } else {
    hr.textContent = p.heroName || '';
  }
  if (!p.alive) hr.style.display = 'none'; slot.appendChild(hr);
  const idtag = document.createElement('div'); idtag.className = 'player-identity';
  if (p.identityRevealed && p.identity) {
    idtag.textContent = ({ lord:'主公', loyalist:'忠臣', rebel:'反贼', traitor:'内奸' })[p.identity] || '';
    idtag.classList.add(p.identity);
  }
  slot.appendChild(idtag);
  const hp = document.createElement('div'); hp.className = 'player-health';
  const dots = document.createElement('div'); dots.className = 'health-dots';
  for (let h = 0; h < p.maxHp; h++) { const d = document.createElement('span'); d.className = 'health-dot'; d.classList.add(h < p.hp ? 'full' : 'lost'); dots.appendChild(d); }
  hp.appendChild(dots); slot.appendChild(hp);
  const cc = document.createElement('div'); cc.className = 'player-card-count'; cc.textContent = p.alive ? `牌 ${p.cardCount}` : ''; slot.appendChild(cc);
  // 显示装备（带tooltip）
  if (p.equipment && p.alive) {
    const eqDiv = document.createElement('div'); eqDiv.className = 'player-equip';
    eqDiv.style.cssText = 'font-size:9px;color:var(--text-dim);max-width:100px;text-align:center;margin-top:2px';
    const equipSlots = [
      { key: 'weapon', label: '武器' },
      { key: 'armor', label: '防具' },
      { key: 'defHorse', label: '+1马' },
      { key: 'atkHorse', label: '-1马' },
    ];
    for (const { key, label } of equipSlots) {
      const card = p.equipment[key];
      if (card) {
        const eqItem = document.createElement('div');
        eqItem.style.cssText = 'cursor:help;white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
        const typeLabel = getCardTypeLabel(card);
        const desc = CARD_DESC[card.subtype] || '';
        eqItem.textContent = card.name;
        eqItem.addEventListener('mouseenter', (e) => showTooltip(e, card.name, typeLabel, desc));
        eqItem.addEventListener('mousemove', (e) => moveTooltip(e));
        eqItem.addEventListener('mouseleave', hideTooltip);
        eqDiv.appendChild(eqItem);
      }
    }
    if (eqDiv.children.length > 0) slot.appendChild(eqDiv);
  }
  // 显示判定区（面朝下，只显示数量）
  if (p.judgments && p.judgments.length > 0 && p.alive) {
    const jDiv = document.createElement('div'); jDiv.className = 'player-judgments';
    jDiv.style.cssText = 'font-size:9px;color:#e74c3c;max-width:100px;text-align:center;margin-top:2px';
    const jNames = p.judgments.map(c => c.name).join(' ');
    jDiv.textContent = `判定: ${jNames}`;
    jDiv.style.cursor = 'help';
    jDiv.addEventListener('mouseenter', (e) => showTooltip(e, '判定区', '延时锦囊', p.judgments.map(c => `${c.name}: ${CARD_DESC[c.subtype] || ''}`).join('\n')));
    jDiv.addEventListener('mousemove', (e) => moveTooltip(e));
    jDiv.addEventListener('mouseleave', hideTooltip);
    slot.appendChild(jDiv);
  }
  if (targetMode && validTargets.includes(p.id) && p.alive) { slot.classList.add('targetable'); slot.onclick = () => onTargetClick(p.id); }
  if (skillState && skillState.phase === 'selectTarget' && p.alive && p.id !== myId) { slot.classList.add('targetable'); slot.onclick = () => onSkillTargetClick(p.id); }
  return slot;
}

function renderCenterArea() {
  el.deckCount.textContent = G.deckCount;
  if (el.discardCount) el.discardCount.textContent = G.discardCount + ' 张';
  // 渲染弃牌堆内容
  if (el.discardList) {
    el.discardList.innerHTML = '';
    const pile = G.discardPile || [];
    for (let i = pile.length - 1; i >= 0; i--) {
      const c = pile[i];
      const d = document.createElement('div'); d.className = 'discard-item';
      const symbol = SUIT_SYMBOL[c.suit] || '';
      d.textContent = `${c.name}${symbol}${c.num}`;
      el.discardList.appendChild(d);
    }
  }
}

function renderSelfArea() {
  const me = G.players.find(p => p.id === myId); if (!me) return;
  el.selfName.textContent = me.name + (myHero ? ` · ${myHero.name}` : '');
  const skillDesc = myHeroSkill?.desc || myHero?.skillDesc || myHero?.skillName || '';
  el.selfHero.textContent = myHero ? `${myHero.skillName || ''}${skillDesc ? ': ' + skillDesc : ''}` : '';
  el.selfIdentity.textContent = myIdentityLabel || '';
  el.selfIdentity.className = 'self-identity-tag ' + (myIdentity || '');
  el.selfHealthDots.innerHTML = '';
  for (let i = 0; i < me.maxHp; i++) { const d = document.createElement('span'); d.className = 'health-dot'; d.classList.add(i < me.hp ? 'full' : 'lost'); el.selfHealthDots.appendChild(d); }
  el.selfHpText.textContent = `${me.hp}/${me.maxHp}`;
}

function renderHand() {
  el.handCount.textContent = `手牌: ${myHand.length}`; el.handHint.textContent = '';
  el.handCards.innerHTML = '';
  if (myHand.length === 0) { el.handCards.innerHTML = '<div class="card-placeholder">空</div>'; return; }
  const isPlay = G.waitingFor === 'play' && G.currentPlayerId === myId && G.status === 'playing';
  const isDiscard = G.waitingFor === 'discard' && G.currentPlayerId === myId;
  const isResponse = G.waitingFor === 'response';
  if (skillState) {
    const hints = { renDe:'选择要给予的牌', wuSheng:'选红色牌当【杀】', zhiHeng:'选要弃置的牌', longDan:'选【闪】当【杀】', qiXi:'选黑色牌当【过河拆桥】', guoSe:'选方块牌当【乐不思蜀】', jieYin:'选两张手牌', liJian:'选一张牌弃置' };
    el.handHint.textContent = hints[skillState.skill] || '';
  }
  for (let i = 0; i < myHand.length; i++) {
    const card = myHand[i]; const elCard = createCardElement(card);
    if (skillState && skillState.phase === 'selectCards') {
      elCard.classList.toggle('discard-marked', skillState.selectedCards.includes(i));
      elCard.addEventListener('click', () => toggleSkillCard(i));
    } else if (skillState && skillState.skill === 'wuSheng' && skillState.phase === 'selectCard') {
      const isRed = card.suit === SUIT.HEART || card.suit === SUIT.DIAMOND;
      if (isRed) { elCard.classList.add('response-highlight'); elCard.addEventListener('click', () => { skillState.cardIdx = i; skillState.phase = 'selectTarget'; renderAll(); }); }
      else { elCard.classList.add('unplayable'); }
    } else if (skillState && skillState.skill === 'longDan' && skillState.phase === 'selectCard') {
      if (card.subtype === 'dodge') { elCard.classList.add('response-highlight'); elCard.addEventListener('click', () => { skillState.cardIdx = i; skillState.phase = 'selectTarget'; renderAll(); }); }
      else { elCard.classList.add('unplayable'); }
    } else if (skillState && skillState.skill === 'qiXi' && skillState.phase === 'selectCard') {
      const isBlack = card.suit === SUIT.SPADE || card.suit === SUIT.CLUB;
      if (isBlack) { elCard.classList.add('response-highlight'); elCard.addEventListener('click', () => { skillState.cardIdx = i; skillState.phase = 'selectTarget'; renderAll(); }); }
      else { elCard.classList.add('unplayable'); }
    } else if (skillState && skillState.skill === 'guoSe' && skillState.phase === 'selectCard') {
      if (card.suit === SUIT.DIAMOND) { elCard.classList.add('response-highlight'); elCard.addEventListener('click', () => { skillState.cardIdx = i; skillState.phase = 'selectTarget'; renderAll(); }); }
      else { elCard.classList.add('unplayable'); }
    } else if (skillState && skillState.skill === 'liJian' && skillState.phase === 'selectCards') {
      elCard.classList.toggle('discard-marked', skillState.selectedCards.includes(i));
      elCard.addEventListener('click', () => { skillState.selectedCards = [i]; skillState.phase = 'selectTarget'; renderAll(); });
    } else if (isPlay) {
      if (canPlayCard(card)) { elCard.addEventListener('click', () => onCardClick(i)); }
      else { elCard.classList.add('unplayable'); }
    } else if (isDiscard) {
      elCard.classList.toggle('discard-marked', discardSelection.has(i));
      elCard.addEventListener('click', () => { if (discardSelection.has(i)) discardSelection.delete(i); else if (discardSelection.size < (G.discardNeeded || 0)) discardSelection.add(i); renderAll(); });
    } else if (isResponse && G.pendingResponse) {
      const needed = G.pendingResponse.type;
      let canUse = card.subtype === needed;
      if (!canUse && needed === 'dodge' && card.subtype === 'strike' && myHero && myHero.skillId === 'longDan') canUse = true;
      if (!canUse && needed === 'strike' && card.subtype === 'dodge' && myHero && myHero.skillId === 'longDan') canUse = true;
      if (!canUse && needed === 'dodge' && (card.suit === SUIT.SPADE || card.suit === SUIT.CLUB) && myHero && myHero.skillId === 'qingGuo') canUse = true;
      if (!canUse && needed === 'peach' && (card.suit === SUIT.HEART || card.suit === SUIT.DIAMOND) && myHero && myHero.skillId === 'jiJiu') canUse = true;
      if (!canUse && needed === 'strike' && (card.suit === SUIT.HEART || card.suit === SUIT.DIAMOND) && myHero && myHero.skillId === 'wuSheng') canUse = true;
      if (canUse) { elCard.classList.add('response-highlight'); elCard.addEventListener('click', () => { socket.emit('respond', { cardIdx: i }); G.waitingFor = null; hidePrompt(); renderAll(); }); }
      else { elCard.classList.add('unplayable'); }
    }
    el.handCards.appendChild(elCard);
  }
}

function isEquipmentCard(card) {
  if (card.equipSlot && ['weapon','armor','defHorse','atkHorse'].includes(card.equipSlot)) return true;
  if (card.type === 'equip') return true;
  return false;
}

function canPlayCard(card) {
  if (!G || G.waitingFor !== 'play' || G.currentPlayerId !== myId || G.status !== 'playing') return false;
  const me = G.players.find(p => p.id === myId); if (!me) return false;
  // 基本牌
  if (card.subtype === 'strike') return G.players.some(t => t.alive && t.id !== myId);
  if (card.subtype === 'peach') return me.hp < me.maxHp;
  if (card.subtype === 'wine') return true;
  if (card.subtype === 'dodge') return false;
  // 装备牌（equipSlot 或 type 双重判断）
  if (isEquipmentCard(card)) return true;
  // 锦囊牌
  const needsTarget = ['guoHeChaiQiao','shunShouQianYang','leBuSiShu','jueDou','huoGong','tieSuoLianHuan','jieDaoShaRen','shanDian','bingLiangCunDuan'];
  if (needsTarget.includes(card.subtype)) return G.players.some(t => t.alive && t.id !== myId);
  return true;
}

function createCardElement(card) {
  const el = document.createElement('div'); el.className = 'card'; el.dataset.subtype = card.subtype; el.dataset.type = card.type || '';
  const color = SUIT_COLOR[card.suit]; const symbol = SUIT_SYMBOL[card.suit];
  const nameDisplay = card.name.length > 3 ? card.name.substring(0, 3) : card.name;
  el.innerHTML = `<div class="card-corner top-left"><span class="card-num">${card.num}</span><span class="card-suit" style="color:${color}">${symbol}</span></div><div class="card-name">${nameDisplay}</div><div class="card-corner bottom-right"><span class="card-num">${card.num}</span><span class="card-suit" style="color:${color}">${symbol}</span></div>`;
  // 悬停提示
  el.addEventListener('mouseenter', (e) => showTooltip(e, card.name, getCardTypeLabel(card), CARD_DESC[card.subtype] || ''));
  el.addEventListener('mousemove', (e) => moveTooltip(e));
  el.addEventListener('mouseleave', hideTooltip);
  return el;
}

// ============================================================
//  操作按钮
// ============================================================
function renderActionBar() {
  el.btnEndPlay.classList.add('hidden'); el.btnConfirmDiscard.classList.add('hidden');
  el.btnSkill.classList.add('hidden'); el.btnConfirmSkill.classList.add('hidden'); el.btnCancelSkill.classList.add('hidden');
  if (skillState) {
    if (skillState.phase === 'selectCards') {
      const count = skillState.selectedCards.length;
      if (skillState.skill === 'renDe' && count > 0) {
        el.btnConfirmSkill.classList.remove('hidden'); el.btnConfirmSkill.textContent = `确认给予 (${count}张)`;
      } else if (skillState.skill === 'zhiHeng' && count > 0) {
        el.btnConfirmSkill.classList.remove('hidden'); el.btnConfirmSkill.textContent = `确认制衡 (${count}张)`;
      } else if (skillState.skill === 'jieYin' && count === 2) {
        el.btnConfirmSkill.classList.remove('hidden'); el.btnConfirmSkill.textContent = `确认结姻`;
      } else if (skillState.skill === 'liJian' && count > 0) {
        el.btnConfirmSkill.classList.remove('hidden'); el.btnConfirmSkill.textContent = `选择目标`;
      }
      el.btnCancelSkill.classList.remove('hidden'); el.btnCancelSkill.textContent = '取消';
    } else { el.btnCancelSkill.classList.remove('hidden'); el.btnCancelSkill.textContent = '取消'; }
    return;
  }
  const isPlay = G.waitingFor === 'play' && G.currentPlayerId === myId && G.status === 'playing';
  if (isPlay) {
    if (myHero) {
      el.btnSkill.classList.remove('hidden');
      el.btnSkill.textContent = myHero.skillName;
      el.btnSkill.disabled = myHand.length === 0;
      const desc = myHeroSkill?.desc || myHero?.skillDesc || '';
      el.btnSkill.onmouseenter = (e) => showTooltip(e, myHero.skillName, '武将技能', desc);
      el.btnSkill.onmousemove = (e) => moveTooltip(e);
      el.btnSkill.onmouseleave = hideTooltip;
    }
    el.btnEndPlay.classList.remove('hidden'); el.btnEndPlay.textContent = '结束出牌';
  }
  if (G.waitingFor === 'discard' && G.currentPlayerId === myId) {
    const sel = discardSelection.size; const need = G.discardNeeded || 0;
    el.btnConfirmDiscard.classList.remove('hidden'); el.btnConfirmDiscard.textContent = `确认弃牌 (${sel}/${need})`;
    el.btnConfirmDiscard.disabled = sel !== need;
  }
}

function showPrompt(type, label) {
  el.promptBar.classList.remove('hidden'); el.promptMsg.textContent = label; el.promptBtns.innerHTML = '';
  const useBtn = document.createElement('button'); useBtn.className = 'action-btn';
  useBtn.textContent = type === 'dodge' ? '出【闪】' : type === 'strike' ? '出【杀】' : '使用【桃】';
  useBtn.addEventListener('click', () => {
    // 查找可用牌（支持转换技能）
    let idx = myHand.findIndex(c => c.subtype === type);
    // 急救：红色牌当桃（服务器端会检查回合外）
    if (idx === -1 && type === 'peach' && myHero && myHero.skillId === 'jiJiu') {
      idx = myHand.findIndex(c => (c.suit === SUIT.HEART || c.suit === SUIT.DIAMOND) && c.subtype !== 'peach');
    }
    // 龙胆：闪当杀
    if (idx === -1 && type === 'strike' && myHero && myHero.skillId === 'longDan') {
      idx = myHand.findIndex(c => c.subtype === 'dodge');
    }
    // 武圣：红色牌当杀
    if (idx === -1 && type === 'strike' && myHero && myHero.skillId === 'wuSheng') {
      idx = myHand.findIndex(c => (c.suit === SUIT.HEART || c.suit === SUIT.DIAMOND));
    }
    // 倾国：黑色手牌当闪
    if (idx === -1 && type === 'dodge' && myHero && myHero.skillId === 'qingGuo') {
      idx = myHand.findIndex(c => (c.suit === SUIT.SPADE || c.suit === SUIT.CLUB));
    }
    if (idx !== -1) { socket.emit('respond', { cardIdx: idx }); G.waitingFor = null; hidePrompt(); renderAll(); }
  });
  el.promptBtns.appendChild(useBtn);
  const passBtn = document.createElement('button'); passBtn.className = 'action-btn';
  passBtn.textContent = '不响应';
  passBtn.addEventListener('click', () => { socket.emit('pass_response'); G.waitingFor = null; hidePrompt(); renderAll(); });
  el.promptBtns.appendChild(passBtn);
}

function hidePrompt() { el.promptBar.classList.add('hidden'); el.promptBtns.innerHTML = ''; }

function showDrawChoicePrompt(label) {
  el.promptBar.classList.remove('hidden'); el.promptMsg.textContent = label; el.promptBtns.innerHTML = '';
  const useBtn = document.createElement('button'); useBtn.className = 'action-btn';
  useBtn.textContent = '发动技能';
  useBtn.addEventListener('click', () => { socket.emit('draw_choice', { useSkill: true }); G.waitingFor = null; hidePrompt(); renderAll(); });
  el.promptBtns.appendChild(useBtn);
  const passBtn = document.createElement('button'); passBtn.className = 'action-btn';
  passBtn.textContent = '不发动';
  passBtn.addEventListener('click', () => { socket.emit('draw_choice', { useSkill: false }); G.waitingFor = null; hidePrompt(); renderAll(); });
  el.promptBtns.appendChild(passBtn);
}

function showGuanXingUI(cards, count) {
  // 移除旧的观星界面
  const old = document.getElementById('guanxing-overlay');
  if (old) old.remove();

  const overlay = document.createElement('div');
  overlay.id = 'guanxing-overlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:1000;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#e8d5a3;font-family:"Microsoft YaHei",sans-serif';

  const title = document.createElement('h2');
  title.textContent = '观星 — 点击选择放牌堆顶的牌（按点击顺序），其余放牌堆底';
  title.style.cssText = 'color:#f0c060;margin-bottom:20px;font-size:18px;max-width:80%;text-align:center';
  overlay.appendChild(title);

  const grid = document.createElement('div');
  grid.style.cssText = 'display:flex;gap:12px;flex-wrap:wrap;justify-content:center;max-width:80%';

  const selectedIndices = []; // 按点击顺序记录选中的索引

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const color = SUIT_COLOR[card.suit];
    const symbol = SUIT_SYMBOL[card.suit];
    const cardEl = document.createElement('div');
    cardEl.style.cssText = 'background:linear-gradient(145deg,#faf6eb,#f0e8d0);border:2px solid #c9b99a;border-radius:8px;padding:12px;cursor:pointer;transition:all 0.2s;text-align:center;min-width:80px';
    cardEl.innerHTML = `<div style="font-size:16px;color:${color}">${card.num}${symbol}</div><div style="font-size:14px;margin-top:4px">${card.name}</div>`;
    cardEl.onclick = () => {
      const idx = selectedIndices.indexOf(i);
      if (idx !== -1) {
        selectedIndices.splice(idx, 1);
        cardEl.style.borderColor = '#c9b99a';
        cardEl.style.background = 'linear-gradient(145deg,#faf6eb,#f0e8d0)';
      } else {
        selectedIndices.push(i);
        cardEl.style.borderColor = '#f0c060';
        cardEl.style.background = 'linear-gradient(145deg,#f0e8d0,#e8d5a3)';
      }
    };
    grid.appendChild(cardEl);
  }
  overlay.appendChild(grid);

  const hint = document.createElement('div');
  hint.textContent = '点击牌切换选中状态，选中的按点击顺序放牌堆顶，未选中的放牌堆底';
  hint.style.cssText = 'color:#999;margin-top:15px;font-size:12px';
  overlay.appendChild(hint);

  const confirmBtn = document.createElement('button');
  confirmBtn.textContent = '确认排列';
  confirmBtn.style.cssText = 'margin-top:15px;padding:10px 30px;background:#665533;color:#e8d5a3;border:1px solid #f0c060;border-radius:6px;cursor:pointer;font-size:16px';
  confirmBtn.onclick = () => {
    socket.emit('guanXing_choice', { topIndices: selectedIndices });
    overlay.remove();
    G.waitingFor = null;
    renderAll();
  };
  overlay.appendChild(confirmBtn);

  document.body.appendChild(overlay);
}

// ============================================================
//  交互
// ============================================================
function onCardClick(idx) {
  if (!G || G.waitingFor !== 'play' || G.currentPlayerId !== myId || G.status !== 'playing') {
    console.log('[onCardClick] blocked:', 'waitingFor:', G?.waitingFor, 'currentPlayerId:', G?.currentPlayerId, 'myId:', myId, 'status:', G?.status);
    return;
  }
  if (idx < 0 || idx >= myHand.length) return;
  const card = myHand[idx]; if (!card || !canPlayCard(card)) return;

  // 装备牌：直接装备，不需要选择目标
  if (isEquipmentCard(card)) {
    socket.emit('play_card', { cardIdx: idx });
    renderAll();
    return;
  }

  // 需要选择目标的牌
  const needsTarget = ['strike','guoHeChaiQiao','shunShouQianYang','leBuSiShu','jueDou','jieDaoShaRen','huoGong','tieSuoLianHuan','shanDian','bingLiangCunDuan'].includes(card.subtype);

  if (needsTarget) {
    if (targetMode && selectedCardIdx === idx) {
      // 点击同一张牌：取消目标模式
      targetMode = false;
      validTargets = [];
      selectedCardIdx = -1;
    } else {
      // 点击不同牌或首次点击：进入/保持目标模式
      targetMode = true;
      validTargets = G.players.filter(t => t.alive && t.id !== myId).map(t => t.id);
      selectedCardIdx = idx;
    }
    renderAll();
  } else {
    // 无需目标的牌（桃、酒、无中生有、桃园结义、南蛮、万箭等）
    const selfPos = getElCenter('#self-area');
    animCardFly(selfPos.x - 30, selfPos.y, selfPos.x + 30, selfPos.y - 40, card);
    socket.emit('play_card', { cardIdx: idx });
    renderAll();
  }
}

function onTargetClick(playerId) {
  if (!targetMode) return;
  const cardIdx = selectedCardIdx >= 0 ? selectedCardIdx : myHand.findIndex(c => c.subtype === 'strike');
  if (cardIdx === -1 || cardIdx >= myHand.length) return;
  const selfPos = getElCenter('#hand-area');
  const targetSlot = getPlayerSlotEl(playerId);
  const targetPos = targetSlot ? getElCenter(targetSlot) : { x: window.innerWidth / 2, y: 100 };
  animCardFly(selfPos.x, selfPos.y, targetPos.x, targetPos.y, myHand[cardIdx]);

  socket.emit('play_card', { cardIdx: cardIdx, targetIdx: G.players.findIndex(p => p.id === playerId) });
  targetMode = false; validTargets = []; selectedCardIdx = -1; renderAll();
}

// ============================================================
//  技能交互
// ============================================================
function onSkillClick() {
  if (!myHero || G.waitingFor !== 'play' || G.currentPlayerId !== myId) return;
  animSkillFlash($('#self-area'), 'rgba(212,168,67,0.4)');
  playSound('skill');
  switch (myHero.skillId) {
    case 'renDe': skillState = { skill:'renDe', phase:'selectCards', selectedCards:[] }; break;
    case 'wuSheng': skillState = { skill:'wuSheng', phase:'selectCard', selectedCards:[], cardIdx:-1 }; break;
    case 'zhiHeng': skillState = { skill:'zhiHeng', phase:'selectCards', selectedCards:[] }; break;
    case 'longDan': skillState = { skill:'longDan', phase:'selectCard', selectedCards:[], cardIdx:-1 }; break;
    case 'qiXi': skillState = { skill:'qiXi', phase:'selectCard', selectedCards:[], cardIdx:-1 }; break;
    case 'kuRou': socket.emit('use_skill', { skillId:'kuRou', data:{} }); break;
    case 'luoYi': socket.emit('use_skill', { skillId:'luoYi', data:{} }); break;
    case 'guoSe': skillState = { skill:'guoSe', phase:'selectCard', selectedCards:[], cardIdx:-1 }; break;
    case 'fanJian': skillState = { skill:'fanJian', phase:'selectTarget', selectedCards:[] }; break;
    case 'jieYin': skillState = { skill:'jieYin', phase:'selectCards', selectedCards:[] }; break;
    case 'liJian': skillState = { skill:'liJian', phase:'selectCards', selectedCards:[] }; break;
  }
  renderAll();
}

function toggleSkillCard(idx) {
  if (!skillState || skillState.phase !== 'selectCards') return;
  const i = skillState.selectedCards.indexOf(idx);
  if (i !== -1) skillState.selectedCards.splice(i, 1); else skillState.selectedCards.push(idx);
  renderAll();
}

function onConfirmSkill() {
  if (!skillState) return;
  if (skillState.skill === 'zhiHeng') {
    animSkillFlash($('#self-area'), 'rgba(41,128,185,0.4)');
    socket.emit('use_skill', { skillId:'zhiHeng', data:{ cardIndices:[...skillState.selectedCards] } });
    skillState = null; renderAll();
  } else if (skillState.skill === 'renDe' || skillState.skill === 'jieYin' || skillState.skill === 'liJian') {
    skillState.phase = 'selectTarget'; renderAll();
  }
}

function onSkillTargetClick(playerId) {
  if (!skillState || skillState.phase !== 'selectTarget') return;
  const targetIdx = G.players.findIndex(p => p.id === playerId); if (targetIdx === -1) return;
  const targetSlot = getPlayerSlotEl(playerId);
  const selfPos = getElCenter('#self-area');
  const targetPos = targetSlot ? getElCenter(targetSlot) : { x: window.innerWidth / 2, y: 100 };

  if (skillState.skill === 'renDe') {
    skillState.selectedCards.forEach((_, i) => setTimeout(() => animCardFly(selfPos.x, selfPos.y, targetPos.x, targetPos.y, { name: '牌', subtype: '' }), i * 100));
    animSkillFlash(targetSlot, 'rgba(39,174,96,0.4)');
    socket.emit('use_skill', { skillId:'renDe', data:{ cardIndices:[...skillState.selectedCards], targetIdx } });
    skillState = null; renderAll();
  } else if (skillState.skill === 'wuSheng') {
    animCardFly(selfPos.x, selfPos.y, targetPos.x, targetPos.y, { name: '杀', subtype: 'strike' });
    animSkillFlash(targetSlot, 'rgba(192,57,43,0.3)');
    socket.emit('use_skill', { skillId:'wuSheng', data:{ cardIdx:skillState.cardIdx, targetIdx } });
    skillState = null; renderAll();
  } else if (skillState.skill === 'longDan') {
    animCardFly(selfPos.x, selfPos.y, targetPos.x, targetPos.y, { name: '杀', subtype: 'strike' });
    socket.emit('use_skill', { skillId:'longDan', data:{ cardIdx:skillState.cardIdx, targetIdx } });
    skillState = null; renderAll();
  } else if (skillState.skill === 'qiXi') {
    animCardFly(selfPos.x, selfPos.y, targetPos.x, targetPos.y, { name: '过河拆桥', subtype: '' });
    socket.emit('use_skill', { skillId:'qiXi', data:{ cardIdx:skillState.cardIdx, targetIdx } });
    skillState = null; renderAll();
  } else if (skillState.skill === 'guoSe') {
    socket.emit('use_skill', { skillId:'guoSe', data:{ cardIdx:skillState.cardIdx, targetIdx } });
    skillState = null; renderAll();
  } else if (skillState.skill === 'fanJian') {
    socket.emit('use_skill', { skillId:'fanJian', data:{ targetIdx, guessedSuit: Math.floor(Math.random() * 4) } });
    skillState = null; renderAll();
  } else if (skillState.skill === 'jieYin') {
    socket.emit('use_skill', { skillId:'jieYin', data:{ cardIndices:[...skillState.selectedCards], targetIdx } });
    skillState = null; renderAll();
  } else if (skillState.skill === 'liJian') {
    if (skillState.phase === 'selectTarget') {
      skillState.liJianFrom = targetIdx;
      skillState.phase = 'selectTarget2';
      renderAll();
    } else if (skillState.phase === 'selectTarget2') {
      socket.emit('use_skill', { skillId:'liJian', data:{ cardIdx:0, fromIdx:skillState.liJianFrom, toIdx:targetIdx } });
      skillState = null; renderAll();
    }
  }
}

// ============================================================
//  聊天 / 日志
// ============================================================
function sendChat() { const msg = el.chatInput.value.trim(); if (!msg) return; socket.emit('chat', { msg }); el.chatInput.value = ''; }

function appendLog(msg, type) {
  const d = new Date(); const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  const entry = document.createElement('div'); entry.className = `log-entry ${type || ''}`; entry.textContent = `[${time}] ${msg}`;
  el.gameLog.appendChild(entry); el.gameLog.scrollTop = el.gameLog.scrollHeight;
}

function appendChat(name, msg, isMe) {
  const entry = document.createElement('div'); entry.className = 'chat-msg' + (isMe ? ' mine' : '');
  const nameSpan = document.createElement('span'); nameSpan.className = 'chat-name'; nameSpan.textContent = name;
  entry.appendChild(nameSpan); entry.appendChild(document.createTextNode(': ' + msg));
  el.chatMessages.appendChild(entry); el.chatMessages.scrollTop = el.chatMessages.scrollHeight;
}

function pad(n) { return String(n).padStart(2, '0'); }

// ============================================================
//  游戏结束
// ============================================================
function showGameOver() {
  if (!G.winner) return;
  const me = G.players.find(p => p.id === myId); if (!me) return;
  let humanWin = false;
  if (G.winner === me.identity) humanWin = true;
  if (G.winner === 'lord' && (me.identity === 'lord' || me.identity === 'loyalist')) humanWin = true;
  el.gameoverOverlay.classList.remove('hidden');
  el.gameoverTitle.textContent = humanWin ? '胜 利' : '败 北';
  el.gameoverTitle.className = humanWin ? 'win' : 'lose';
  el.gameoverDetail.textContent = '';
  const msg = document.createTextNode(humanWin ? '恭喜获胜！' : '很遗憾，下次再战！');
  el.gameoverDetail.appendChild(msg);
  el.gameoverDetail.appendChild(document.createElement('br'));
  el.gameoverDetail.appendChild(document.createElement('br'));
  const bold = document.createElement('b'); bold.textContent = '所有玩家身份：';
  el.gameoverDetail.appendChild(bold); el.gameoverDetail.appendChild(document.createElement('br'));
  for (const p of G.players) {
    const label = ({ lord:'主公', loyalist:'忠臣', rebel:'反贼', traitor:'内奸' })[p.identity] || '?';
    const line = document.createTextNode(`${p.name}: ${label}`);
    el.gameoverDetail.appendChild(line); el.gameoverDetail.appendChild(document.createElement('br'));
  }
}
