// ============================================================
//  三国杀 — 卡死诊断测试（带详细日志）
// ============================================================
const { io } = require('socket.io-client');

const URL = 'http://localhost:3000';

async function run() {
  console.log('\n=== 卡死诊断测试 ===\n');

  const socket = io(URL, { transports: ['websocket'], forceNew: true });
  await new Promise((resolve, reject) => {
    socket.on('connect', resolve);
    socket.on('connect_error', reject);
    setTimeout(() => reject(new Error('连接超时')), 5000);
  });
  console.log(`已连接: ${socket.id}`);

  let publicState = null;
  let myInfo = null;
  let actionReceived = null;
  let lastActionTime = Date.now();
  let turnLog = [];
  let gameEnded = false;

  socket.on('game_state', (state) => {
    const prev = publicState;
    publicState = state;
    if (!prev || prev.turnNum !== state.turnNum || prev.phase !== state.phase || prev.currentPlayerId !== state.currentPlayerId) {
      const who = state.players.find(p => p.id === state.currentPlayerId);
      const isMe = state.currentPlayerId === socket.id;
      const entry = `回合${state.turnNum} ${state.phase} ${who?.name || '?'}${isMe ? '(我)' : ''}`;
      turnLog.push(entry);
      console.log(`  [状态] ${entry} 牌堆:${state.deckCount}`);
    }
  });

  socket.on('your_info', (info) => {
    myInfo = info;
    console.log(`  [信息] 手牌${info.hand.length}张 身份:${info.identityLabel} 英雄:${info.hero?.name}`);
  });

  socket.on('your_cards', ({ cards }) => {
    if (myInfo && cards) {
      myInfo.hand.push(...cards);
      console.log(`  [摸牌] +${cards.length}张, 手牌${myInfo.hand.length}张`);
    }
  });

  socket.on('your_action', (action) => {
    actionReceived = action;
    lastActionTime = Date.now();
    console.log(`  [动作] ${action.type}${action.respondType ? '(' + action.respondType + ')' : ''} count:${action.count || '-'}`);
  });

  socket.on('game_log', (msg) => {
    console.log(`  [日志] ${msg}`);
  });

  socket.on('game_over', ({ winnerId }) => {
    gameEnded = true;
    console.log(`  [结束] 胜方: ${winnerId}`);
  });

  socket.on('action_error', ({ msg }) => {
    console.log(`  [错误] ${msg}`);
  });

  // 创建房间+AI
  socket.emit('create_room', { name: '诊断玩家', maxPlayers: 4 });
  await new Promise(r => socket.once('room_joined', r));
  for (let i = 0; i < 3; i++) { socket.emit('add_ai'); await new Promise(r => setTimeout(r, 200)); }

  // 开始游戏
  socket.emit('start_game');
  await new Promise(r => socket.once('game_start', r));
  console.log('\n--- 游戏开始 ---\n');

  // 主循环
  let loopCount = 0;
  const MAX_LOOPS = 1000;
  let noActionCount = 0;

  while (!gameEnded && loopCount < MAX_LOOPS) {
    loopCount++;

    // 检测卡死：超过15秒没有动作
    if (Date.now() - lastActionTime > 15000) {
      console.log('\n  ⚠ 检测到卡死!');
      console.log(`  当前状态: 回合${publicState?.turnNum} 阶段${publicState?.phase}`);
      console.log(`  当前玩家: ${publicState?.currentPlayerId === socket.id ? '我' : 'AI'}`);
      console.log(`  actionReceived: ${JSON.stringify(actionReceived)}`);
      console.log(`  waitingFor(客户端): 未公开`);
      break;
    }

    if (actionReceived === null) {
      noActionCount++;
      if (noActionCount % 30 === 0) {
        console.log(`  [等待] ${noActionCount}次无动作, 回合${publicState?.turnNum} 阶段${publicState?.phase}`);
      }
    } else {
      noActionCount = 0;
    }

    // 处理响应（最高优先级）- 直接pass避免手牌索引错位
    if (actionReceived && actionReceived.type === 'response') {
      actionReceived = null;
      socket.emit('pass_response');
      await new Promise(r => setTimeout(r, 300));
      continue;
    }

    // 处理弃牌
    if (actionReceived && actionReceived.type === 'discard') {
      const count = actionReceived.count;
      actionReceived = null;
      const handLen = myInfo?.hand?.length || 0;
      const indices = [];
      for (let i = 0; i < Math.min(count, handLen); i++) indices.push(i);
      socket.emit('discard', { indices });
      console.log(`  >>> 弃牌: ${indices.length}张`);
      await new Promise(r => setTimeout(r, 400));
      continue;
    }

    // 处理出牌
    if (actionReceived && actionReceived.type === 'play') {
      actionReceived = null;
      lastActionTime = Date.now();

      if (myInfo && myInfo.hand && myInfo.hand.length > 0 && publicState) {
        const me = publicState.players.find(p => p.id === socket.id);
        if (me && me.hp < me.maxHp) {
          const idx = myInfo.hand.findIndex(c => c.subtype === 'peach');
          if (idx !== -1) {
            socket.emit('play_card', { cardIdx: idx });
            myInfo.hand.splice(idx, 1);
            console.log(`  >>> 出牌: 桃`);
            await new Promise(r => setTimeout(r, 300));
          }
        }

        if (myInfo.hand.length > 0) {
          const strikeIdx = myInfo.hand.findIndex(c => c.subtype === 'strike');
          if (strikeIdx !== -1 && publicState) {
            const targets = publicState.players.filter(p => p.alive && p.id !== socket.id);
            if (targets.length > 0) {
              const tIdx = publicState.players.findIndex(p => p.id === targets[0].id);
              socket.emit('play_card', { cardIdx: strikeIdx, targetIdx: tIdx });
              myInfo.hand.splice(strikeIdx, 1);
              console.log(`  >>> 出牌: 杀 -> ${targets[0].name}`);
              await new Promise(r => setTimeout(r, 300));
            }
          }
        }
      }

      socket.emit('end_play');
      console.log(`  >>> 结束出牌`);
      await new Promise(r => setTimeout(r, 500));
      continue;
    }

    await new Promise(r => setTimeout(r, 200));
  }

  // 输出回合日志
  console.log('\n--- 回合日志 ---');
  for (const entry of turnLog) console.log(`  ${entry}`);

  if (publicState) {
    console.log('\n--- 最终状态 ---');
    for (const p of publicState.players) {
      const label = ({ lord:'主公', loyalist:'忠臣', rebel:'反贼', traitor:'内奸' })[p.identity] || '?';
      console.log(`  ${p.name}(${label}) ${p.alive?'活':'死'} HP:${p.hp}/${p.maxHp} 牌:${p.cardCount}`);
    }
  }

  socket.disconnect();
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
