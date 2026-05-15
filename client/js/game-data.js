// ============================================================
//  三国杀 — 数据定义（标准版全武将）
// ============================================================

// ----- 身份 -----
const IDENTITY = {
  LORD: 'lord',
  LOYALIST: 'loyalist',
  REBEL: 'rebel',
  TRAITOR: 'traitor',
};

const IDENTITY_LABEL = {
  [IDENTITY.LORD]: '主公',
  [IDENTITY.LOYALIST]: '忠臣',
  [IDENTITY.REBEL]: '反贼',
  [IDENTITY.TRAITOR]: '内奸',
};

// ----- 阶段 -----
const PHASE = {
  READY: 'ready',
  JUDGMENT: 'judgment',
  DRAW: 'draw',
  PLAY: 'play',
  DISCARD: 'discard',
  END: 'end',
};

const PHASE_LABEL = {
  [PHASE.READY]: '准备阶段',
  [PHASE.JUDGMENT]: '判定阶段',
  [PHASE.DRAW]: '摸牌阶段',
  [PHASE.PLAY]: '出牌阶段',
  [PHASE.DISCARD]: '弃牌阶段',
  [PHASE.END]: '结束阶段',
};

const PHASE_ORDER = [PHASE.READY, PHASE.JUDGMENT, PHASE.DRAW, PHASE.PLAY, PHASE.DISCARD, PHASE.END];

// ----- 花色 -----
const SUIT = { SPADE: 0, HEART: 1, CLUB: 2, DIAMOND: 3 };
const SUIT_SYMBOL = ['♠', '♥', '♣', '♦'];
const SUIT_COLOR = ['#222', '#c0392b', '#222', '#c0392b'];
const SUIT_NAME = ['黑桃', '红桃', '梅花', '方块'];

// ----- 卡牌类型 -----
const CARD_TYPE = { BASIC: 'basic', EQUIP: 'equip', TRICK: 'trick' };
const EQUIP_SLOT = { WEAPON: 'weapon', ARMOR: 'armor', DEF_HORSE: 'defHorse', ATK_HORSE: 'atkHorse' };

// ----- 卡牌数据库（标准版）-----
const CARD_TEMPLATES = {
  // === 基本牌 ===
  strike: [
    [0, 7], [0, 8], [0, 8], [0, 9], [0, 9], [0, 10], [0, 10],
    [2, 2], [2, 3], [2, 4], [2, 5], [2, 6], [2, 7], [2, 7],
    [2, 8], [2, 8], [2, 9], [2, 9], [2, 10], [2, 10], [2, 'J'], [2, 'J'],
    [1, 10], [1, 10],
    [3, 6], [3, 7], [3, 8], [3, 9], [3, 10], [3, 'K'],
  ],
  dodge: [
    [1, 2], [1, 2],
    [3, 2], [3, 3], [3, 4], [3, 5], [3, 6], [3, 7],
    [3, 8], [3, 9], [3, 10], [3, 'J'], [3, 'J'],
    [3, 'Q'], [3, 'K'],
  ],
  peach: [
    [1, 3], [1, 4], [1, 6], [1, 7], [1, 8], [1, 9], [1, 'Q'],
    [3, 'Q'],
  ],
  wine: [
    [0, 3], [0, 9], [2, 3], [2, 9], [3, 9],
  ],

  // === 装备牌 ===
  zhangba: [[2, 'Q']],
  guanShiFu: [[0, 5]],
  qingLong: [[0, 6]],
  zhuGeLianNu: [[0, 1]],
  hanBingJian: [[2, 2]],
  ciXiongShuangJian: [[0, 2]],
  fangTianHuaJi: [[1, 'K']],
  qingGangJian: [[1, 3]],

  baGuaZhen: [[0, 'K'], [2, 'K']],
  renWangDun: [[2, 'J']],

  jueYing: [[2, 5]],
  zhuaHuangFeiDian: [[1, 5]],
  diLu: [[1, 'K']],

  chiTu: [[3, 5]],
  ziXing: [[3, 'K']],
  daYuan: [[3, 3]],

  // === 锦囊牌 ===
  wuZhongShengYou: [[1, 7], [1, 8], [1, 9], [1, 'J']],
  guoHeChaiQiao: [[0, 3], [0, 4], [1, 'Q'], [1, 'K']],
  shunShouQianYang: [[0, 3], [0, 4], [0, 'J']],
  jueDou: [[0, 'A'], [2, 'A']],
  nanManRuQin: [[0, 7], [2, 7]],
  wanJianQiFa: [[1, 'A']],
  wuXieKeJi: [[0, 'J'], [0, 'Q'], [2, 'Q'], [2, 'K']],
  jieDaoShaRen: [[2, 'J']],
  taoYuanJieYi: [[1, 'A']],
  huoGong: [[2, 'J'], [2, 'Q']],
  tieSuoLianHuan: [[2, 10], [2, 'J'], [0, 'J'], [0, 'Q']],

  leBuSiShu: [[2, 6], [2, 'J'], [1, 6]],
  shanDian: [[0, 'A'], [1, 'A']],
  bingLiangCunDuan: [[0, 10]],
};

// ----- 武将（标准版25人）-----
const HEROES = {
  liubei: { id: 'liubei', name: '刘备', hp: 4, skillId: 'renDe', skillName: '仁德', skillDesc: '出牌阶段可将手牌交给其他玩家，每阶段限一次；若给出不少于2张，回复1点体力', skillType: 'active' },
  guanyu: { id: 'guanyu', name: '关羽', hp: 4, skillId: 'wuSheng', skillName: '武圣', skillDesc: '你可以将一张红色牌当【杀】使用或打出', skillType: 'convert' },
  zhangfei: { id: 'zhangfei', name: '张飞', hp: 4, skillId: 'paoXiao', skillName: '咆哮', skillDesc: '锁定技，你使用【杀】无次数限制', skillType: 'passive' },
  zhaoyun: { id: 'zhaoyun', name: '赵云', hp: 4, skillId: 'longDan', skillName: '龙胆', skillDesc: '你可以将【杀】当【闪】、【闪】当【杀】使用或打出', skillType: 'convert' },
  zhugeliang: { id: 'zhugeliang', name: '诸葛亮', hp: 3, skillId: 'guanXing', skillName: '观星', skillDesc: '准备阶段，你可以观看牌堆顶X张牌并排列（X=min(存活数,5)）', skillType: 'active' },
  huangyueying: { id: 'huangyueying', name: '黄月英', hp: 3, skillId: 'jiZhi', skillName: '集智', skillDesc: '每当你使用非延时锦囊牌时，你可以摸一张牌', skillType: 'trigger' },
  machao: { id: 'machao', name: '马超', hp: 4, skillId: 'maShu', skillName: '马术', skillDesc: '锁定技，你计算与其他角色的距离-1', skillType: 'passive' },
  huangzhong: { id: 'huangzhong', name: '黄忠', hp: 4, skillId: 'lieGong', skillName: '烈弓', skillDesc: '你使用的【杀】被【闪】抵消时，可以弃置目标一张牌', skillType: 'trigger' },
  caocao: { id: 'caocao', name: '曹操', hp: 4, skillId: 'jianXiong', skillName: '奸雄', skillDesc: '每当你受到伤害后，你可以获得造成伤害的牌', skillType: 'trigger' },
  simayi: { id: 'simayi', name: '司马懿', hp: 3, skillId: 'fanKui', skillName: '反馈', skillDesc: '每当你受到伤害后，你可以获得伤害来源的一张手牌', skillType: 'trigger' },
  xiahoudun: { id: 'xiahoudun', name: '夏侯惇', hp: 4, skillId: 'gangLie', skillName: '刚烈', skillDesc: '每当你受到伤害后，你可以判定：不为红桃则伤害来源弃2牌或受1伤害', skillType: 'trigger' },
  zhangliao: { id: 'zhangliao', name: '张辽', hp: 4, skillId: 'tuXi', skillName: '突袭', skillDesc: '摸牌阶段，你可以放弃摸牌，获得至多两名其他角色各一张手牌', skillType: 'active' },
  xuchu: { id: 'xuchu', name: '许褚', hp: 4, skillId: 'luoYi', skillName: '裸衣', skillDesc: '摸牌阶段，你可以少摸一张牌，若如此做你使用【杀】或【决斗】伤害+1', skillType: 'active' },
  guojia: { id: 'guojia', name: '郭嘉', hp: 3, skillId: 'yiJi', skillName: '遗计', skillDesc: '每当你受到1点伤害后，你可以摸两张牌，然后将两张手牌交给任意角色', skillType: 'trigger' },
  zhenji: { id: 'zhenji', name: '甄姬', hp: 3, skillId: 'qingGuo', skillName: '倾国', skillDesc: '你可以将一张黑色手牌当【闪】使用或打出', skillType: 'convert' },
  sunquan: { id: 'sunquan', name: '孙权', hp: 4, skillId: 'zhiHeng', skillName: '制衡', skillDesc: '出牌阶段可弃置任意数量的牌，摸等量的牌，每阶段限一次', skillType: 'active' },
  ganning: { id: 'ganning', name: '甘宁', hp: 4, skillId: 'qiXi', skillName: '奇袭', skillDesc: '你可以将一张黑色牌当【过河拆桥】使用', skillType: 'convert' },
  lvmeng: { id: 'lvmeng', name: '吕蒙', hp: 4, skillId: 'keJi', skillName: '克己', skillDesc: '若你出牌阶段未使用或打出【杀】，可以跳过弃牌阶段', skillType: 'passive' },
  huanggai: { id: 'huanggai', name: '黄盖', hp: 4, skillId: 'kuRou', skillName: '苦肉', skillDesc: '出牌阶段，你可以失去1点体力，然后摸两张牌', skillType: 'active' },
  zhouyu: { id: 'zhouyu', name: '周瑜', hp: 3, skillId: 'fanJian', skillName: '反间', skillDesc: '出牌阶段，你可以令一名其他角色选择花色，展示你一张手牌，若不同则该角色受1伤害，该角色获得此牌', skillType: 'active' },
  daqiao: { id: 'daqiao', name: '大乔', hp: 3, skillId: 'guoSe', skillName: '国色', skillDesc: '你可以将一张方块牌当【乐不思蜀】使用', skillType: 'convert' },
  luxun: { id: 'luxun', name: '陆逊', hp: 3, skillId: 'qianXun', skillName: '谦逊', skillDesc: '锁定技，你不能成为【乐不思蜀】和【顺手牵羊】的目标', skillType: 'passive' },
  sunshangxiang: { id: 'sunshangxiang', name: '孙尚香', hp: 3, skillId: 'jieYin', skillName: '结姻', skillDesc: '出牌阶段，你可以弃两张手牌，选择一名已受伤男性角色，各回复1体力', skillType: 'active' },
  huatuo: { id: 'huatuo', name: '华佗', hp: 3, skillId: 'jiJiu', skillName: '急救', skillDesc: '你的回合外，你可以将一张红色牌当【桃】使用', skillType: 'convert' },
  lvbu: { id: 'lvbu', name: '吕布', hp: 4, skillId: 'wuShuang', skillName: '无双', skillDesc: '锁定技，你使用的【杀】需两张【闪】抵消；与你【决斗】的角色每次需出两张【杀】', skillType: 'passive' },
  diaochan: { id: 'diaochan', name: '貂蝉', hp: 3, skillId: 'liJian', skillName: '离间', skillDesc: '出牌阶段，你可以弃一张牌，令一名男性角色对另一名男性角色使用【杀】，每阶段限一次', skillType: 'active' },
};

// 技能触发时机
const SKILL_TRIGGER = {
  ON_DAMAGE_TAKEN: 'onDamageTaken',
  ON_CARD_USED: 'onCardUsed',
  ON_PLAY_PHASE: 'onPlayPhase',
  ON_DRAW_PHASE: 'onDrawPhase',
  ON_TURN_START: 'onTurnStart',
  OUT_OF_TURN: 'outOfTurn',
};

function createCardDB() {
  const db = [];
  let uid = 0;
  const nameMap = {
    strike: '杀', dodge: '闪', peach: '桃', wine: '酒',
    zhangba: '丈八蛇矛', guanShiFu: '贯石斧', qingLong: '青龙偃月刀',
    zhuGeLianNu: '诸葛连弩', hanBingJian: '寒冰剑', ciXiongShuangJian: '雌雄双股剑',
    fangTianHuaJi: '方天画戟', qingGangJian: '青釭剑',
    baGuaZhen: '八卦阵', renWangDun: '仁王盾',
    jueYing: '绝影', zhuaHuangFeiDian: '爪黄飞电', diLu: '的卢',
    chiTu: '赤兔', ziXing: '紫骍', daYuan: '大宛',
    wuZhongShengYou: '无中生有', guoHeChaiQiao: '过河拆桥', shunShouQianYang: '顺手牵羊',
    jueDou: '决斗', nanManRuQin: '南蛮入侵', wanJianQiFa: '万箭齐发',
    wuXieKeJi: '无懈可击', jieDaoShaRen: '借刀杀人', taoYuanJieYi: '桃园结义',
    huoGong: '火攻', tieSuoLianHuan: '铁索连环',
    leBuSiShu: '乐不思蜀', shanDian: '闪电', bingLiangCunDuan: '兵粮寸断',
  };
  const typeMap = {
    strike: CARD_TYPE.BASIC, dodge: CARD_TYPE.BASIC, peach: CARD_TYPE.BASIC, wine: CARD_TYPE.BASIC,
    zhangba: CARD_TYPE.EQUIP, guanShiFu: CARD_TYPE.EQUIP, qingLong: CARD_TYPE.EQUIP,
    zhuGeLianNu: CARD_TYPE.EQUIP, hanBingJian: CARD_TYPE.EQUIP, ciXiongShuangJian: CARD_TYPE.EQUIP,
    fangTianHuaJi: CARD_TYPE.EQUIP, qingGangJian: CARD_TYPE.EQUIP,
    baGuaZhen: CARD_TYPE.EQUIP, renWangDun: CARD_TYPE.EQUIP,
    jueYing: CARD_TYPE.EQUIP, zhuaHuangFeiDian: CARD_TYPE.EQUIP, diLu: CARD_TYPE.EQUIP,
    chiTu: CARD_TYPE.EQUIP, ziXing: CARD_TYPE.EQUIP, daYuan: CARD_TYPE.EQUIP,
  };
  const slotMap = {
    zhangba: EQUIP_SLOT.WEAPON, guanShiFu: EQUIP_SLOT.WEAPON, qingLong: EQUIP_SLOT.WEAPON,
    zhuGeLianNu: EQUIP_SLOT.WEAPON, hanBingJian: EQUIP_SLOT.WEAPON, ciXiongShuangJian: EQUIP_SLOT.WEAPON,
    fangTianHuaJi: EQUIP_SLOT.WEAPON, qingGangJian: EQUIP_SLOT.WEAPON,
    baGuaZhen: EQUIP_SLOT.ARMOR, renWangDun: EQUIP_SLOT.ARMOR,
    jueYing: EQUIP_SLOT.DEF_HORSE, zhuaHuangFeiDian: EQUIP_SLOT.DEF_HORSE, diLu: EQUIP_SLOT.DEF_HORSE,
    chiTu: EQUIP_SLOT.ATK_HORSE, ziXing: EQUIP_SLOT.ATK_HORSE, daYuan: EQUIP_SLOT.ATK_HORSE,
  };
  const rangeMap = {
    zhangba: 3, guanShiFu: 3, qingLong: 3, zhuGeLianNu: 1, hanBingJian: 2,
    ciXiongShuangJian: 2, fangTianHuaJi: 4, qingGangJian: 2,
  };
  for (const [subtype, templates] of Object.entries(CARD_TEMPLATES)) {
    for (const [suit, num] of templates) {
      const card = {
        uid: uid++,
        name: nameMap[subtype],
        type: typeMap[subtype] || CARD_TYPE.TRICK,
        subtype,
        suit,
        num: String(num),
      };
      if (slotMap[subtype]) card.equipSlot = slotMap[subtype];
      if (rangeMap[subtype]) card.range = rangeMap[subtype];
      db.push(card);
    }
  }
  return db;
}
