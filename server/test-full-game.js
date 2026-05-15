// ============================================================
//  三国杀 — 完整对局测试（不尝试出牌，只处理响应和弃牌）
// ============================================================
const { io } = require('socket.io-client');

const URL = 'http://localhost:3000';

async function run() {
  console.log('\n========================================');
  console.log('  三国杀 — 完整对局自动化测试');
  console.log('========================================\n');

  const socket = io(URL, { transports: ['websocket'], forceNew: true });
  await new Promise((resolve, reject) => {
    socket.on('connect', resolve);
    socket.on('connect_error', reject);
    setTimeout(() => reject(new Error('连接超时')), 5000);
  });
  console.log(`  已连接: ${socket.id}`);

  let publicState = null;
  let actionReceived = null;
  let gameEnded = false;
  let lastActionTime = Date.now();

  socket.on('game_state', (state) => { publicState = state; });
  socket.on('your_info', () => {});
  socket.on('your_cards', () => {});
  socket.on('your_action', (action) => { actionReceived = action; lastActionTime = Date.now(); });
  socket.on('game_over', () => { gameEnded = true; });
  socket.on('action_error', () => {});

  // 创建房间+AI
  socket.emit('create_room', { name: '测试玩家', maxPlayers: 5 });
  await new Promise(r => socket.once('room_joined', r));
  for (let i = 0; i < 4; i++) { socket.emit('add_ai'); await new Promise(r => setTimeout(r, 200)); }

  // 开始游戏
  socket.emit('start_game');
  await new Promise(r => socket.once('game_start', r));
  console.log('  游戏开始\n');

  let loopCount = 0;
  let turnCount = 0;
  let lastTurn = 0;

  while (!gameEnded && loopCount < 2000) {
    loopCount++;

    if (Date.now() - lastActionTime > 30000) {
      console.log(`\n  ⚠ 30秒无动作! 回合${publicState?.turnNum} 阶段${publicState?.phase}`);
      break;
    }

    if (publicState && publicState.turnNum > lastTurn) {
      lastTurn = publicState.turnNum;
      turnCount++;
      if (turnCount % 10 === 0) {
        const alive = publicState.players.filter(p => p.alive).map(p => p.name).join(',');
        console.log(`  [回合${turnCount}] 牌堆:${publicState.deckCount} 存活:[${alive}]`);
      }
    }

    if (actionReceived) {
      const action = actionReceived;
      actionReceived = null;

      if (action.type === 'response') {
        socket.emit('pass_response');
        await new Promise(r => setTimeout(r, 200));
      } else if (action.type === 'discard') {
        const indices = [];
        for (let i = 0; i < action.count; i++) indices.push(i);
        socket.emit('discard', { indices });
        await new Promise(r => setTimeout(r, 200));
      } else if (action.type === 'play') {
        socket.emit('end_play');
        await new Promise(r => setTimeout(r, 200));
      }
      continue;
    }

    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`\n  ${gameEnded ? '✅' : '❌'} 完整对局${gameEnded ? '成功' : '失败'}: ${turnCount}回合, ${loopCount}次循环`);
  if (publicState) {
    console.log(`  最终回合: ${publicState.turnNum}`);
    for (const p of publicState.players) {
      const label = ({ lord:'主公', loyalist:'忠臣', rebel:'反贼', traitor:'内奸' })[p.identity] || '?';
      console.log(`    ${p.name}(${label}) ${p.alive ? '活' : '死'} HP:${p.hp}/${p.maxHp}`);
    }
  }

  socket.disconnect();
  process.exit(gameEnded ? 0 : 1);
}

run().catch(e => { console.error(e); process.exit(1); });
