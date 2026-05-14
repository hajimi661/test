// ============================================================
//  三国杀 — 客户端（Socket + 渲染）
// ============================================================

const socket = io();
let myId = null;

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
let skillState = null;
let discardSelection = new Set();
let _isHost = false; // 缓存当前玩家是否为房主

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
  deckCount:      $('#deck-pile .pile-count'), discardCount: $('#discard-pile .pile-count'),
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
};

// ============================================================
//  Socket 事件
// ============================================================
socket.on('connect', () => { myId = socket.id; console.log('[socket] 已连接', myId); });
socket.on('room_created', (r) => { el.roomIdDisplay.textContent = r.id; showRoomPanel(r); });
socket.on('room_joined', (r) => { el.roomIdDisplay.textContent = r.id; showRoomPanel(r); });
socket.on('room_update', (r) => { showRoomPanel(r); });

socket.on('game_start', () => {
  G.status = 'playing'; targetMode = false; skillState = null; showGameScreen();
});

socket.on('your_info', (info) => {
  myHand = info.hand || []; myIdentity = info.identity; myIdentityLabel = info.identityLabel;
  myHero = info.hero; myHeroSkill = info.heroSkill; renderAll();
});
socket.on('your_cards', ({ cards }) => { if (cards && cards.length > 0) myHand.push(...cards); });
socket.on('hand_update', (hand) => { myHand = hand || []; renderAll(); });

socket.on('game_state', (state) => { G = { ...G, ...state }; renderAll(); });

socket.on('your_action', (action) => {
  switch (action.type) {
    case 'play': G.waitingFor = 'play'; G.discardNeeded = 0; skillState = null; targetMode = false; renderAll(); break;
    case 'discard': G.waitingFor = 'discard'; G.discardNeeded = action.count; discardSelection = new Set(); el.handHint.textContent = `需要弃 ${action.count} 张牌`; renderAll(); break;
    case 'response': G.waitingFor = 'response'; G.pendingResponse = { type: action.respondType, label: action.label }; renderAll(); showPrompt(action.respondType, action.label); break;
  }
});

socket.on('game_log', (msg) => { appendLog(msg); });

socket.on('game_over', ({ winnerId }) => {
  G.winner = winnerId; G.status = 'ended'; renderAll(); showGameOver();
});

socket.on('room_dissolved', ({ msg }) => {
  el.lobbyError.textContent = msg || '房间已解散'; el.lobbyError.classList.remove('hidden');
  backToLobby();
});
socket.on('room_reset', () => { backToLobby(); });
socket.on('quit_accepted', () => { backToLobby(); });

socket.on('chat_message', ({ id, name, msg }) => { appendChat(name, msg, id === myId); });
socket.on('action_error', ({ msg }) => { if (msg) appendLog(`[提示] ${msg}`, 'system'); });
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

function showGameScreen() {
  el.lobbyScreen.classList.add('hidden'); el.gameScreen.classList.remove('hidden');
  el.gameLog.innerHTML = ''; renderAll();
}

function backToLobby() {
  el.gameoverOverlay.classList.add('hidden');
  el.gameScreen.classList.add('hidden');
  el.lobbyScreen.classList.remove('hidden');
  el.roomPanel.classList.add('hidden');
  G = { players: [], phase: null, phaseLabel: '', turnNum: 0, deckCount: 0, discardCount: 0, logs: [], status: 'idle' };
  myHand = []; skillState = null; _isHost = false;
}

// ============================================================
//  游戏渲染
// ============================================================
function renderAll() { renderTopBar(); renderSeating(); renderCenterArea(); renderSelfArea(); renderHand(); renderActionBar(); }

function renderTopBar() {
  el.phaseDisplay.textContent = G.phaseLabel || '等待中';
  el.turnDisplay.textContent = `第 ${G.turnNum} 回合`;
  el.onlineCount.textContent = G.players.filter(p => p.alive).length;
  // 重开按钮仅房主可见
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
  if (!p.alive) slot.classList.add('dead');
  if (p.id === G.currentPlayerId && p.alive) slot.classList.add('current-turn');
  if (isMe) slot.classList.add('me');
  const av = document.createElement('div'); av.className = 'player-avatar';
  av.textContent = p.alive ? (p.heroName ? p.heroName[0] : '?') : '💀'; slot.appendChild(av);
  const nm = document.createElement('div'); nm.className = 'player-name'; nm.textContent = p.name; slot.appendChild(nm);
  const hr = document.createElement('div'); hr.className = 'player-hero';
  hr.textContent = p.heroName || ''; if (!p.alive) hr.style.display = 'none'; slot.appendChild(hr);
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
  if (targetMode && validTargets.includes(p.id) && p.alive) { slot.classList.add('targetable'); slot.onclick = () => onTargetClick(p.id); }
  if (skillState && skillState.phase === 'selectTarget' && p.alive && p.id !== myId) { slot.classList.add('targetable'); slot.onclick = () => onSkillTargetClick(p.id); }
  return slot;
}

function renderCenterArea() { el.deckCount.textContent = G.deckCount; el.discardCount.textContent = G.discardCount; }

function renderSelfArea() {
  const me = G.players.find(p => p.id === myId); if (!me) return;
  el.selfName.textContent = me.name + (myHero ? ` · ${myHero.name}` : '');
  el.selfHero.textContent = myHero ? `${myHero.skillName}: ${myHero.skillDesc}` : '';
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
  const isPlay = G.waitingFor === 'play' && G.currentPlayerId === myId;
  const isDiscard = G.waitingFor === 'discard' && G.currentPlayerId === myId;
  const isResponse = G.waitingFor === 'response';
  if (skillState) { const hints = { renDe:'选择要给予的牌', wuSheng:'选红色牌当【杀】', zhiHeng:'选要弃置的牌' }; el.handHint.textContent = hints[skillState.skill] || ''; }
  for (let i = 0; i < myHand.length; i++) {
    const card = myHand[i]; const elCard = createCardElement(card);
    if (skillState && skillState.phase === 'selectCards') {
      elCard.classList.toggle('discard-marked', skillState.selectedCards.includes(i));
      elCard.addEventListener('click', () => toggleSkillCard(i));
    } else if (skillState && skillState.skill === 'wuSheng' && skillState.phase === 'selectCard') {
      const isRed = card.suit === SUIT.HEART || card.suit === SUIT.DIAMOND;
      if (isRed) { elCard.classList.add('response-highlight'); elCard.addEventListener('click', () => { skillState.cardIdx = i; skillState.phase = 'selectTarget'; renderAll(); }); }
      else { elCard.style.opacity = '0.35'; elCard.style.cursor = 'not-allowed'; }
    } else if (isPlay) {
      if (canPlayCard(card)) { elCard.addEventListener('click', () => onCardClick(i)); }
      else { elCard.style.opacity = '0.45'; elCard.style.cursor = 'not-allowed'; }
    } else if (isDiscard) {
      elCard.classList.toggle('discard-marked', discardSelection.has(i));
      elCard.addEventListener('click', () => { if (discardSelection.has(i)) discardSelection.delete(i); else if (discardSelection.size < (G.discardNeeded || 0)) discardSelection.add(i); renderAll(); });
    } else if (isResponse && G.pendingResponse) {
      if (card.subtype === G.pendingResponse.type) { elCard.classList.add('response-highlight'); elCard.addEventListener('click', () => { socket.emit('respond', { cardIdx: i }); G.waitingFor = null; hidePrompt(); renderAll(); }); }
      else { elCard.style.opacity = '0.35'; }
    }
    el.handCards.appendChild(elCard);
  }
}

function canPlayCard(card) {
  if (!G || G.waitingFor !== 'play' || G.currentPlayerId !== myId) return false;
  const me = G.players.find(p => p.id === myId); if (!me) return false;
  switch (card.subtype) { case 'strike': return G.players.some(t => t.alive && t.id !== myId); case 'peach': return me.hp < me.maxHp; case 'wine': return true; default: return false; }
}

function createCardElement(card) {
  const el = document.createElement('div'); el.className = 'card'; el.dataset.subtype = card.subtype;
  const color = SUIT_COLOR[card.suit]; const symbol = SUIT_SYMBOL[card.suit];
  el.innerHTML = `<div class="card-corner top-left"><span class="card-num">${card.num}</span><span class="card-suit" style="color:${color}">${symbol}</span></div><div class="card-name">${card.name}</div><div class="card-corner bottom-right"><span class="card-num">${card.num}</span><span class="card-suit" style="color:${color}">${symbol}</span></div>`;
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
      if ((skillState.skill === 'renDe' || skillState.skill === 'zhiHeng') && count > 0) {
        el.btnConfirmSkill.classList.remove('hidden');
        el.btnConfirmSkill.textContent = skillState.skill === 'renDe' ? `确认给予 (${count}张)` : `确认制衡 (${count}张)`;
      }
      el.btnCancelSkill.classList.remove('hidden'); el.btnCancelSkill.textContent = '取消';
    } else { el.btnCancelSkill.classList.remove('hidden'); el.btnCancelSkill.textContent = '取消'; }
    return;
  }
  const isPlay = G.waitingFor === 'play' && G.currentPlayerId === myId;
  if (isPlay) {
    if (myHero) { el.btnSkill.classList.remove('hidden'); el.btnSkill.textContent = myHero.skillName; el.btnSkill.disabled = myHand.length === 0; }
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
  useBtn.textContent = type === 'dodge' ? '出【闪】' : '使用【桃】';
  useBtn.addEventListener('click', () => { const idx = myHand.findIndex(c => c.subtype === type); if (idx !== -1) { socket.emit('respond', { cardIdx: idx }); G.waitingFor = null; hidePrompt(); renderAll(); } });
  el.promptBtns.appendChild(useBtn);
  const passBtn = document.createElement('button'); passBtn.className = 'action-btn';
  passBtn.textContent = '不响应';
  passBtn.addEventListener('click', () => { socket.emit('pass_response'); G.waitingFor = null; hidePrompt(); renderAll(); });
  el.promptBtns.appendChild(passBtn);
}

function hidePrompt() { el.promptBar.classList.add('hidden'); el.promptBtns.innerHTML = ''; }

// ============================================================
//  交互
// ============================================================
function onCardClick(idx) {
  if (!G || G.waitingFor !== 'play' || G.currentPlayerId !== myId) return;
  const card = myHand[idx]; if (!canPlayCard(card)) return;
  if (card.subtype === 'strike') {
    targetMode = !targetMode; validTargets = targetMode ? G.players.filter(t => t.alive && t.id !== myId).map(t => t.id) : []; renderAll();
  } else { socket.emit('play_card', { cardIdx: idx }); renderAll(); }
}

function onTargetClick(playerId) {
  if (!targetMode) return;
  const strikeIdx = myHand.findIndex(c => c.subtype === 'strike'); if (strikeIdx === -1) return;
  socket.emit('play_card', { cardIdx: strikeIdx, targetIdx: G.players.findIndex(p => p.id === playerId) });
  targetMode = false; validTargets = []; renderAll();
}

// ============================================================
//  技能交互
// ============================================================
function onSkillClick() {
  if (!myHero || G.waitingFor !== 'play' || G.currentPlayerId !== myId) return;
  switch (myHero.skillId) {
    case 'renDe': skillState = { skill:'renDe', phase:'selectCards', selectedCards:[], cardIdx:-1 }; break;
    case 'wuSheng': skillState = { skill:'wuSheng', phase:'selectCard', selectedCards:[], cardIdx:-1 }; break;
    case 'zhiHeng': skillState = { skill:'zhiHeng', phase:'selectCards', selectedCards:[], cardIdx:-1 }; break;
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
    socket.emit('use_skill', { skillId:'zhiHeng', data:{ cardIndices:[...skillState.selectedCards] } });
    skillState = null; renderAll();
  } else if (skillState.skill === 'renDe') { skillState.phase = 'selectTarget'; renderAll(); }
}

function onSkillTargetClick(playerId) {
  if (!skillState || skillState.phase !== 'selectTarget') return;
  const targetIdx = G.players.findIndex(p => p.id === playerId); if (targetIdx === -1) return;
  if (skillState.skill === 'renDe') {
    socket.emit('use_skill', { skillId:'renDe', data:{ cardIndices:[...skillState.selectedCards], targetIdx } });
    skillState = null; renderAll();
  } else if (skillState.skill === 'wuSheng') {
    socket.emit('use_skill', { skillId:'wuSheng', data:{ cardIdx:skillState.cardIdx, targetIdx } });
    skillState = null; renderAll();
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
  entry.innerHTML = `<span class="chat-name">${name}</span>: ${msg}`;
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
  el.gameoverDetail.innerHTML = humanWin ? '恭喜获胜！' : '很遗憾，下次再战！';
  el.gameoverDetail.innerHTML += '<br><br><b>所有玩家身份：</b><br>';
  for (const p of G.players) {
    const label = ({ lord:'主公', loyalist:'忠臣', rebel:'反贼', traitor:'内奸' })[p.identity] || '?';
    el.gameoverDetail.innerHTML += `${p.name}: ${label}<br>`;
  }
}
