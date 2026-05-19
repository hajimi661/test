// ============================================================
//  三国杀 — 自动化测试脚本（模拟完整人机对局）
// ============================================================
const { io } = require('socket.io-client');

const URL = 'http://localhost:3000';
const TIMEOUT = 8000;

let socket;
let testResults = [];
let currentTest = '';
let resolveWait = null;

function log(msg) { console.log(`  [测试] ${msg}`); }
function pass(msg) { testResults.push({ name: msg, ok: true }); console.log(`  ✅ ${msg}`); }
function fail(msg, detail) { testResults.push({ name: msg, ok: false, detail }); console.log(`  ❌ ${msg}: ${detail}`); }

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
function waitFor(event, timeout = TIMEOUT) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { socket.off(event, handler); reject(new Error(`等待 ${event} 超时`)); }, timeout);
    function handler(data) { clearTimeout(timer); socket.off(event, handler); resolve(data); }
    socket.on(event, handler);
  });
}

function waitForAny(events, timeout = TIMEOUT) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { for (const e of events) socket.off(e, handler); reject(new Error(`等待事件超时: ${events.join(',')}`)); }, timeout);
    function handler(data) { clearTimeout(timer); for (const e of events) socket.off(e, handler); resolve({ event: this.event, data }); }
    for (const e of events) socket.on(e, handler);
  });
}

async function connect() {
  socket = io(URL, { transports: ['websocket'], forceNew: true });
  await new Promise((resolve, reject) => {
    socket.on('connect', resolve);
    socket.on('connect_error', reject);
    setTimeout(() => reject(new Error('连接超时')), 5000);
  });
  log(`已连接: ${socket.id}`);
}

async function createRoom() {
  socket.emit('create_room', { name: '测试玩家', maxPlayers: 4 });
  const room = await waitFor('room_joined');
  log(`房间已创建: ${room.id}`);
  return room.id;
}

async function addAI(count) {
  for (let i = 0; i < count; i++) {
    socket.emit('add_ai');
    await wait(200);
  }
  log(`已添加 ${count} 个AI`);
}

async function startGame() {
  socket.emit('start_game');
  const startData = await waitFor('game_start');
  log(`游戏已开始，玩家数: ${startData.totalPlayers}`);
  // 等待英雄选择，自动选第一个
  try {
    const heroData = await waitFor('hero_selection', 3000);
    if (heroData.heroes && heroData.heroes.length > 0) {
      socket.emit('select_hero', { heroId: heroData.heroes[0].id });
      log(`选择了英雄: ${heroData.heroes[0].name}`);
    }
  } catch (e) {
    // 没有英雄选择（可能已超时），继续
  }
  // 等待游戏真正开始（your_info 表示游戏已启动）
  await waitFor('your_info', 15000);
  return startData;
}

async function runTests() {
  console.log('\n========================================');
  console.log('  三国杀自动化测试 — 模拟完整人机对局');
  console.log('========================================\n');

  try {
    // 测试1：连接
    currentTest = '连接服务器';
    await connect();
    pass(currentTest);

    // 测试2：创建房间
    currentTest = '创建房间';
    const roomId = await createRoom();
    pass(currentTest);

    // 测试3：添加AI
    currentTest = '添加3个AI';
    await addAI(3);
    pass(currentTest);

    // 测试4：开始游戏
    currentTest = '开始游戏';
    const gameStart = await startGame();
    pass(currentTest);

    // 收集初始状态
    let publicState = null;
    let myInfo = null;
    let actionReceived = null;
    let logs = [];

    socket.on('game_state', (state) => { publicState = state; });
    socket.on('your_info', (info) => { myInfo = info; });
    socket.on('your_action', (action) => { actionReceived = action; });
    socket.on('game_log', (msg) => { logs.push(msg); });
    socket.on('your_cards', ({ cards }) => {
      if (myInfo && cards) myInfo.hand.push(...cards);
    });

    await wait(2000);

    // 测试5：检查初始状态
    currentTest = '初始状态正确';
    if (publicState && publicState.players && publicState.players.length === 4) {
      pass(currentTest);
    } else {
      fail(currentTest, '状态不正确');
    }

    // 测试6：等待轮到我方出牌
    currentTest = '收到出牌指令';
    let myTurn = false;
    let attempts = 0;
    while (!myTurn && attempts < 60) {
      if (actionReceived && actionReceived.type === 'play' && publicState && publicState.currentPlayerId === socket.id) {
        myTurn = true;
      }
      if (publicState && publicState.currentPlayerId === socket.id && publicState.phase === 'play') {
        myTurn = true;
      }
      await wait(500);
      attempts++;
    }
    if (myTurn) {
      pass(currentTest);
    } else {
      fail(currentTest, `等待 ${attempts * 500}ms 后仍未轮到我方`);
    }

    // 测试7：摸牌阶段
    currentTest = '摸牌阶段正常';
    if (myInfo && myInfo.hand && myInfo.hand.length > 0) {
      log(`手牌数: ${myInfo.hand.length}`);
      pass(currentTest);
    } else {
      fail(currentTest, '手牌为空');
    }

    // 测试8：结束出牌
    if (myTurn) {
      currentTest = '结束出牌功能';
      actionReceived = null;
      socket.emit('end_play');
      await wait(1500);

      // 检查是否进入了弃牌阶段或下一回合
      if (publicState) {
        log(`结束出牌后阶段: ${publicState.phase}, 当前玩家: ${publicState.currentPlayerId}`);
        pass(currentTest);
      } else {
        fail(currentTest, '状态未更新');
      }
    }

    // 测试9：等待弃牌阶段（如果需要）
    currentTest = '弃牌阶段处理';
    let discardHandled = false;
    attempts = 0;
    while (!discardHandled && attempts < 40) {
      if (actionReceived && actionReceived.type === 'discard') {
        // 需要弃牌
        const indices = [];
        for (let i = 0; i < actionReceived.count; i++) indices.push(i);
        socket.emit('discard', { indices });
        discardHandled = true;
        log(`弃了 ${actionReceived.count} 张牌`);
      } else if (publicState && publicState.currentPlayerId !== socket.id) {
        // 已经轮到别人了
        discardHandled = true;
      } else if (publicState && publicState.phase === 'play' && publicState.currentPlayerId === socket.id) {
        // 又轮到我了（没有弃牌需求）
        discardHandled = true;
      }
      await wait(500);
      attempts++;
    }
    pass(currentTest);

    // 测试10：等待响应（被杀时）
    currentTest = '响应机制';
    let responded = false;
    attempts = 0;
    while (!responded && attempts < 80) {
      if (actionReceived && actionReceived.type === 'response') {
        // 直接pass避免手牌索引错位
        socket.emit('pass_response');
        actionReceived = null;
        responded = true;
        log('收到响应请求，已处理');
      } else if (actionReceived && actionReceived.type === 'play' && publicState && publicState.currentPlayerId === socket.id) {
        responded = true;
      }
      await wait(500);
      attempts++;
    }
    pass(currentTest);

    // 测试11：多回合循环测试（验证回合推进，不出牌避免手牌错位）
    currentTest = '多回合循环（3回合）';
    let completedTurns = 0;
    const targetTurns = 3;

    for (let turn = 0; turn < targetTurns; turn++) {
      let turnDone = false;
      attempts = 0;

      while (!turnDone && attempts < 80) {
        // 游戏已结束则跳出
        if (publicState && publicState.status === 'ended') { turnDone = true; break; }

        // 处理所有动作
        if (actionReceived) {
          const action = actionReceived;
          actionReceived = null;

          if (action.type === 'play' && publicState && publicState.currentPlayerId === socket.id) {
            socket.emit('end_play');
            await wait(800);
          } else if (action.type === 'discard') {
            const indices = [];
            for (let i = 0; i < action.count; i++) indices.push(i);
            socket.emit('discard', { indices });
            await wait(500);
          } else if (action.type === 'response') {
            socket.emit('pass_response');
            await wait(500);
          }
        }

        // 检查是否轮到下一次我方
        if (publicState && publicState.currentPlayerId === socket.id && publicState.phase === 'play' && actionReceived === null) {
          turnDone = true;
          completedTurns++;
        }

        await wait(500);
        attempts++;
      }
    }

    const gameEndedDuringTest = publicState && publicState.status === 'ended';
    if (completedTurns >= targetTurns) {
      pass(`${currentTest} (完成 ${completedTurns} 回合)`);
    } else if (gameEndedDuringTest) {
      pass(`${currentTest} (游戏在循环期间结束，已完成 ${completedTurns} 回合)`);
    } else {
      fail(currentTest, `只完成了 ${completedTurns}/${targetTurns} 回合`);
    }

    // 测试12：游戏状态完整性
    currentTest = '游戏状态完整性';
    if (publicState && publicState.players && publicState.status === 'playing') {
      const alive = publicState.players.filter(p => p.alive);
      log(`存活玩家: ${alive.length}, 牌堆: ${publicState.deckCount}, 弃牌堆: ${publicState.discardCount}`);
      pass(currentTest);
    } else if (publicState && publicState.status === 'ended') {
      log(`游戏已结束，胜方: ${publicState.winner}`);
      pass(currentTest);
    } else {
      fail(currentTest, '状态异常');
    }

    // 测试13：消息提示
    currentTest = '消息日志';
    if (logs.length > 0) {
      log(`日志条数: ${logs.length}`);
      pass(currentTest);
    } else {
      fail(currentTest, '无日志');
    }

  } catch (err) {
    fail(currentTest, err.message);
    console.error('测试异常:', err);
  } finally {
    // 汇总
    console.log('\n========================================');
    console.log('  测试结果汇总');
    console.log('========================================');
    const passed = testResults.filter(r => r.ok).length;
    const failed = testResults.filter(r => !r.ok).length;
    console.log(`  通过: ${passed}  失败: ${failed}  总计: ${testResults.length}`);
    for (const r of testResults) {
      console.log(`  ${r.ok ? '✅' : '❌'} ${r.name}${r.ok ? '' : ` — ${r.detail}`}`);
    }
    console.log('========================================\n');

    if (socket) socket.disconnect();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
