// ============================================================
//  三国杀 — 服务端游戏引擎（标准版完整规则）
// ============================================================

// ---------- 常量 ----------
const IDENTITY = { LORD: 'lord', LOYALIST: 'loyalist', REBEL: 'rebel', TRAITOR: 'traitor' };
const IDENTITY_LABEL = { [IDENTITY.LORD]: '主公', [IDENTITY.LOYALIST]: '忠臣', [IDENTITY.REBEL]: '反贼', [IDENTITY.TRAITOR]: '内奸' };

const PHASE = { READY: 'ready', JUDGMENT: 'judgment', DRAW: 'draw', PLAY: 'play', DISCARD: 'discard', END: 'end' };
const PHASE_LABEL = {
  [PHASE.READY]: '准备阶段', [PHASE.JUDGMENT]: '判定阶段', [PHASE.DRAW]: '摸牌阶段',
  [PHASE.PLAY]: '出牌阶段', [PHASE.DISCARD]: '弃牌阶段', [PHASE.END]: '结束阶段',
};
const PHASE_ORDER = [PHASE.READY, PHASE.JUDGMENT, PHASE.DRAW, PHASE.PLAY, PHASE.DISCARD, PHASE.END];

const SUIT = { SPADE: 0, HEART: 1, CLUB: 2, DIAMOND: 3 };
const SUIT_SYMBOL = ['♠', '♥', '♣', '♦'];
const SUIT_NAME = ['黑桃', '红桃', '梅花', '方块'];
const CARD_TYPE = { BASIC: 'basic', EQUIP: 'equip', TRICK: 'trick' };
const EQUIP_SLOT = { WEAPON: 'weapon', ARMOR: 'armor', DEF_HORSE: 'defHorse', ATK_HORSE: 'atkHorse' };

// 武器范围
const WEAPON_RANGE = { zhuGeLianNu: 1, hanBingJian: 2, ciXiongShuangJian: 2, qingGangJian: 2, zhangba: 3, guanShiFu: 3, qingLong: 3, fangTianHuaJi: 4 };

const CARD_NAME = {
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

// 标准版25武将
const HEROES = {
  liubei: { id: 'liubei', name: '刘备', hp: 4, gender: 'male', skillId: 'renDe', skillName: '仁德', skillDesc: '出牌阶段限一次，可将任意数量手牌交给其他角色；若以此法给出不少于两张，回复1点体力', skillType: 'active' },
  guanyu: { id: 'guanyu', name: '关羽', hp: 4, gender: 'male', skillId: 'wuSheng', skillName: '武圣', skillDesc: '你可以将一张红色牌当【杀】使用或打出', skillType: 'convert' },
  zhangfei: { id: 'zhangfei', name: '张飞', hp: 4, gender: 'male', skillId: 'paoXiao', skillName: '咆哮', skillDesc: '锁定技，你使用【杀】无次数限制', skillType: 'passive' },
  zhaoyun: { id: 'zhaoyun', name: '赵云', hp: 4, gender: 'male', skillId: 'longDan', skillName: '龙胆', skillDesc: '你可以将【杀】当【闪】、【闪】当【杀】使用或打出', skillType: 'convert' },
  zhugeliang: { id: 'zhugeliang', name: '诸葛亮', hp: 3, gender: 'male', skillId: 'guanXing', skillName: '观星', skillDesc: '准备阶段，你可以观看牌堆顶X张牌并排列（X=min(存活数,5)）', skillType: 'active' },
  huangyueying: { id: 'huangyueying', name: '黄月英', hp: 3, gender: 'female', skillId: 'jiZhi', skillName: '集智', skillDesc: '每当你使用非延时锦囊牌时，你可以摸一张牌', skillType: 'trigger' },
  machao: { id: 'machao', name: '马超', hp: 4, gender: 'male', skillId: 'maShu', skillName: '马术', skillDesc: '锁定技，你计算与其他角色的距离-1', skillType: 'passive' },
  huangzhong: { id: 'huangzhong', name: '黄忠', hp: 4, gender: 'male', skillId: 'lieGong', skillName: '烈弓', skillDesc: '你使用的【杀】被【闪】抵消时，可以弃置目标一张牌', skillType: 'trigger' },
  caocao: { id: 'caocao', name: '曹操', hp: 4, gender: 'male', skillId: 'jianXiong', skillName: '奸雄', skillDesc: '每当你受到伤害后，你可以获得造成伤害的牌', skillType: 'trigger' },
  simayi: { id: 'simayi', name: '司马懿', hp: 3, gender: 'male', skillId: 'fanKui', skillName: '反馈', skillDesc: '每当你受到伤害后，你可以获得伤害来源的一张手牌', skillType: 'trigger' },
  xiahoudun: { id: 'xiahoudun', name: '夏侯惇', hp: 4, gender: 'male', skillId: 'gangLie', skillName: '刚烈', skillDesc: '每当你受到伤害后，你可以判定：不为红桃则伤害来源弃2牌或受1伤害', skillType: 'trigger' },
  zhangliao: { id: 'zhangliao', name: '张辽', hp: 4, gender: 'male', skillId: 'tuXi', skillName: '突袭', skillDesc: '摸牌阶段，你可以放弃摸牌，获得至多两名其他角色各一张手牌', skillType: 'active' },
  xuchu: { id: 'xuchu', name: '许褚', hp: 4, gender: 'male', skillId: 'luoYi', skillName: '裸衣', skillDesc: '摸牌阶段，你可以少摸一张牌，若如此做你使用【杀】或【决斗】伤害+1', skillType: 'active' },
  guojia: { id: 'guojia', name: '郭嘉', hp: 3, gender: 'male', skillId: 'yiJi', skillName: '遗计', skillDesc: '每当你受到1点伤害后，你可以摸两张牌，然后将两张手牌交给任意角色', skillType: 'trigger' },
  zhenji: { id: 'zhenji', name: '甄姬', hp: 3, gender: 'female', skillId: 'qingGuo', skillName: '倾国', skillDesc: '你可以将一张黑色手牌当【闪】使用或打出', skillType: 'convert' },
  sunquan: { id: 'sunquan', name: '孙权', hp: 4, gender: 'male', skillId: 'zhiHeng', skillName: '制衡', skillDesc: '出牌阶段可弃置任意数量的牌，摸等量的牌，每阶段限一次', skillType: 'active' },
  ganning: { id: 'ganning', name: '甘宁', hp: 4, gender: 'male', skillId: 'qiXi', skillName: '奇袭', skillDesc: '你可以将一张黑色牌当【过河拆桥】使用', skillType: 'convert' },
  lvmeng: { id: 'lvmeng', name: '吕蒙', hp: 4, gender: 'male', skillId: 'keJi', skillName: '克己', skillDesc: '若你出牌阶段未使用或打出【杀】，可以跳过弃牌阶段', skillType: 'passive' },
  huanggai: { id: 'huanggai', name: '黄盖', hp: 4, gender: 'male', skillId: 'kuRou', skillName: '苦肉', skillDesc: '出牌阶段，你可以失去1点体力，然后摸两张牌', skillType: 'active' },
  zhouyu: { id: 'zhouyu', name: '周瑜', hp: 3, gender: 'male', skillId: 'fanJian', skillName: '反间', skillDesc: '出牌阶段，你可以令一名其他角色选择花色，展示你一张手牌，若不同则该角色受1伤害，该角色获得此牌', skillType: 'active' },
  daqiao: { id: 'daqiao', name: '大乔', hp: 3, gender: 'female', skillId: 'guoSe', skillName: '国色', skillDesc: '你可以将一张方块牌当【乐不思蜀】使用', skillType: 'convert' },
  luxun: { id: 'luxun', name: '陆逊', hp: 3, gender: 'male', skillId: 'qianXun', skillName: '谦逊', skillDesc: '锁定技，你不能成为【乐不思蜀】和【顺手牵羊】的目标', skillType: 'passive' },
  sunshangxiang: { id: 'sunshangxiang', name: '孙尚香', hp: 3, gender: 'female', skillId: 'jieYin', skillName: '结姻', skillDesc: '出牌阶段，你可以弃两张手牌，选择一名已受伤男性角色，各回复1体力', skillType: 'active' },
  huatuo: { id: 'huatuo', name: '华佗', hp: 3, gender: 'male', skillId: 'jiJiu', skillName: '急救', skillDesc: '你的回合外，你可以将一张红色牌当【桃】使用', skillType: 'convert' },
  lvbu: { id: 'lvbu', name: '吕布', hp: 4, gender: 'male', skillId: 'wuShuang', skillName: '无双', skillDesc: '锁定技，你使用的【杀】需两张【闪】抵消；与你【决斗】的角色每次需出两张【杀】', skillType: 'passive' },
  diaochan: { id: 'diaochan', name: '貂蝉', hp: 3, gender: 'female', skillId: 'liJian', skillName: '离间', skillDesc: '出牌阶段，你可以弃一张牌，令一名男性角色对另一名男性角色使用【杀】，每阶段限一次', skillType: 'active' },

  // ===== 新增武将 =====
  // 群雄
  yuji: { id: 'yuji', name: '于吉', hp: 3, gender: 'male', skillId: 'guHuo', skillName: '蛊惑', skillDesc: '每名角色的回合限一次，你可以将一张手牌面朝下使用并声明为基本牌或普通锦囊牌，质疑者翻开判定：若不同则质疑者受1伤害', skillType: 'active' },
  // 华佗已有定义，不重复
  pangde: { id: 'pangde', name: '庞德', hp: 4, gender: 'male', skillId: 'mengJin', skillName: '猛进', skillDesc: '当你使用的【杀】被【闪】抵消时，你可以弃置目标的一张牌', skillType: 'trigger' },
  yanliangwenchou: { id: 'yanliangwenchou', name: '颜良文丑', hp: 4, gender: 'male', skillId: 'shuangXiong', skillName: '双雄', skillDesc: '摸牌阶段，你可以放弃摸牌，改为判定：本回合你可以将与判定结果颜色不同的一张手牌当【决斗】使用', skillType: 'active' },
  menghuo: { id: 'menghuo', name: '孟获', hp: 4, gender: 'male', skillId: 'huoShou', skillName: '祸首', skillDesc: '锁定技，【南蛮入侵】对你无效；当其他角色使用【南蛮入侵】指定目标后，你是此牌造成的伤害的来源', skillType: 'passive' },
  zhurong: { id: 'zhurong', name: '祝融', hp: 4, gender: 'female', skillId: 'juXiang', skillName: '巨象', skillDesc: '锁定技，【南蛮入侵】对你无效；当其他角色使用的【南蛮入侵】结算结束后，你获得之', skillType: 'passive' },
  zuoci: { id: 'zuoci', name: '左慈', hp: 3, gender: 'male', skillId: 'huaShen', skillName: '化身', skillDesc: '准备阶段，你可以观看牌堆顶的两张牌并获得其中一张，然后将另一张放回牌堆顶', skillType: 'active' },
  yuanhao: { id: 'yuanhao', name: '袁绍', hp: 4, gender: 'male', skillId: 'luanJi', skillName: '乱击', skillDesc: '出牌阶段，你可以将两张相同花色的手牌当【万箭齐发】使用', skillType: 'convert' },
  dongzhuo: { id: 'dongzhuo', name: '董卓', hp: 8, gender: 'male', skillId: 'jiuChi', skillName: '酒池', skillDesc: '你可以将一张黑色手牌当【酒】使用', skillType: 'convert' },
  jiaxu: { id: 'jiaxu', name: '贾诩', hp: 3, gender: 'male', skillId: 'wanSha', skillName: '完杀', skillDesc: '锁定技，在你的回合，除你以外的角色只有处于濒死状态时才能使用【桃】', skillType: 'passive' },
  caizhaoji: { id: 'caizhaoji', name: '蔡文姬', hp: 3, gender: 'female', skillId: 'beiGe', skillName: '悲歌', skillDesc: '当一名角色受到【杀】造成的伤害后，你可以弃一张牌，令其判定：红桃回复1体力，方块摸2张，梅花伤害来源弃2张，黑桃伤害来源翻面', skillType: 'trigger' },

  // 魏国
  caoren: { id: 'caoren', name: '曹仁', hp: 4, gender: 'male', skillId: 'juShou', skillName: '据守', skillDesc: '结束阶段，你可以摸三张牌，然后翻面', skillType: 'active' },
  xiayuanyuan: { id: 'xiayuanyuan', name: '夏侯渊', hp: 4, gender: 'male', skillId: 'shenSu', skillName: '神速', skillDesc: '你可以跳过判定阶段和摸牌阶段，然后对一名其他角色使用一张【杀】', skillType: 'active' },
  dianwei: { id: 'dianwei', name: '典韦', hp: 4, gender: 'male', skillId: 'qiangXi', skillName: '强袭', skillDesc: '出牌阶段限一次，你可以失去1点体力或弃一张武器牌，对攻击范围内的一名角色造成1点伤害', skillType: 'active' },
  xuhuang: { id: 'xuhuang', name: '徐晃', hp: 4, gender: 'male', skillId: 'duanLiang', skillName: '断粮', skillDesc: '出牌阶段，你可以将一张黑色基本牌或黑色装备牌当【兵粮寸断】使用', skillType: 'convert' },
  caopi: { id: 'caopi', name: '曹丕', hp: 3, gender: 'male', skillId: 'xingShang', skillName: '行殇', skillDesc: '当其他角色死亡时，你可以获得其所有牌', skillType: 'trigger' },
  caochong: { id: 'caochong', name: '曹冲', hp: 3, gender: 'male', skillId: 'chengXiang', skillName: '称象', skillDesc: '当你受到伤害后，你可以亮出牌堆顶的四张牌，然后获得其中点数之和不大于13的牌', skillType: 'trigger' },
  guohuai: { id: 'guohuai', name: '郭淮', hp: 4, gender: 'male', skillId: 'jingCe', skillName: '精策', skillDesc: '出牌阶段结束时，若你本回合使用的牌数量大于等于你当前体力值，你可以摸两张牌', skillType: 'trigger' },
  manchong: { id: 'manchong', name: '满宠', hp: 3, gender: 'male', skillId: 'yuCe', skillName: '御策', skillDesc: '当你受到伤害后，你可以展示一张手牌，若此牌与造成伤害的牌类型不同，则你回复1点体力', skillType: 'trigger' },
  wangyi: { id: 'wangyi', name: '王异', hp: 3, gender: 'female', skillId: 'zhenLie', skillName: '贞烈', skillDesc: '当你受到伤害后，你可以判定：若结果为红色，你回复1点体力并摸一张牌', skillType: 'trigger' },
  caozhi: { id: 'caozhi', name: '曹植', hp: 3, gender: 'male', skillId: 'luoYing', skillName: '落英', skillDesc: '当其他角色的牌因判定或弃置而置入弃牌堆时，你可以获得其中的梅花牌', skillType: 'trigger' },

  // 蜀国
  weiyan: { id: 'weiyan', name: '魏延', hp: 4, gender: 'male', skillId: 'kuangGu', skillName: '狂骨', skillDesc: '当你对距离1以内的角色造成1点伤害后，你可以回复1点体力', skillType: 'trigger' },
  pangtong: { id: 'pangtong', name: '庞统', hp: 3, gender: 'male', skillId: 'lianHuan', skillName: '连环', skillDesc: '出牌阶段，你可以将一张梅花手牌当【铁索连环】使用', skillType: 'convert' },
  wolong: { id: 'wolong', name: '卧龙诸葛亮', hp: 3, gender: 'male', skillId: 'huoJi', skillName: '火计', skillDesc: '出牌阶段，你可以将一张红色手牌当【火攻】使用', skillType: 'convert' },
  taishici: { id: 'taishici', name: '太史慈', hp: 4, gender: 'male', skillId: 'tianYi', skillName: '天义', skillDesc: '出牌阶段限一次，你可以与一名角色拼点：若你赢，本回合你可以多使用一张【杀】且使用【杀】无距离限制', skillType: 'active' },
  jiangwei: { id: 'jiangwei', name: '姜维', hp: 4, gender: 'male', skillId: 'tiaoXin', skillName: '挑衅', skillDesc: '出牌阶段限一次，你可以令攻击范围内包含你的一名角色对你使用【杀】，否则你弃置其一张牌', skillType: 'active' },
  liushan: { id: 'liushan', name: '刘禅', hp: 3, gender: 'male', skillId: 'fangQuan', skillName: '放权', skillDesc: '你可以跳过出牌阶段，然后在此回合结束时令一名其他角色进行一个额外回合', skillType: 'active' },
  // 魏延已有定义，奇谋为限定技简化为狂骨

  // 吴国
  sunjian: { id: 'sunjian', name: '孙坚', hp: 4, gender: 'male', skillId: 'yingHun', skillName: '英魂', skillDesc: '准备阶段，若你已受伤，你可以令一名其他角色摸X张牌然后弃一张牌（X为你已损失的体力值）', skillType: 'active' },
  lusu: { id: 'lusu', name: '鲁肃', hp: 3, gender: 'male', skillId: 'haoShi', skillName: '好施', skillDesc: '摸牌阶段，你可以额外摸两张牌，然后若你的手牌数大于5，你将一半的手牌交给手牌最少的一名其他角色', skillType: 'active' },
  sunce: { id: 'sunce', name: '孙策', hp: 4, gender: 'male', skillId: 'jiAng', skillName: '激昂', skillDesc: '当你使用【决斗】或红色【杀】指定目标后，或成为【决斗】或红色【杀】的目标后，你可以摸一张牌', skillType: 'trigger' },
  zhangzhaozhanghong: { id: 'zhangzhaozhanghong', name: '张昭张纮', hp: 3, gender: 'male', skillId: 'zhiJian', skillName: '直谏', skillDesc: '出牌阶段，你可以将一张手牌交给其他角色，然后你摸一张牌', skillType: 'active' },
  chengong: { id: 'chengong', name: '陈宫', hp: 3, gender: 'male', skillId: 'mingCe', skillName: '明策', skillDesc: '出牌阶段限一次，你可以将一张装备牌或【杀】交给其他角色，然后该角色选择一项：对你指定的一名角色使用【杀】，或摸一张牌', skillType: 'active' },
  bulianshi: { id: 'bulianshi', name: '步练师', hp: 3, gender: 'female', skillId: 'anXu', skillName: '安恤', skillDesc: '出牌阶段限一次，你可以令手牌数不同的一名其他角色获得另一名其他角色的一张手牌，然后若这两名角色手牌数相等，你摸一张牌', skillType: 'active' },
  xunyou: { id: 'xunyou', name: '荀攸', hp: 3, gender: 'male', skillId: 'qiCe', skillName: '奇策', skillDesc: '出牌阶段限一次，你可以将所有手牌当任意一张普通锦囊牌使用', skillType: 'active' },
  handang: { id: 'handang', name: '韩当', hp: 4, gender: 'male', skillId: 'gongQing', skillName: '弓骑', skillDesc: '你可以将一张装备牌当【闪】使用或打出', skillType: 'convert' },

  // 界武将（标准版加强）
  jliubei: { id: 'jliubei', name: '界刘备', hp: 4, gender: 'male', skillId: 'renDe', skillName: '仁德', skillDesc: '出牌阶段，你可以将任意数量手牌交给其他角色；若以此法给出不少于两张，回复1点体力', skillType: 'active' },
  jguanyu: { id: 'jguanyu', name: '界关羽', hp: 4, gender: 'male', skillId: 'yiJue', skillName: '义绝', skillDesc: '出牌阶段限一次，你可以弃一张牌并令一名角色展示一张手牌：若为黑色，本回合其不能使用或打出手牌且防具无效；若为红色，你获得之', skillType: 'active' },
  jzhangfei: { id: 'jzhangfei', name: '界张飞', hp: 4, gender: 'male', skillId: 'paoXiao', skillName: '咆哮', skillDesc: '锁定技，你使用【杀】无次数限制', skillType: 'passive' },
  jzhaoyun: { id: 'jzhaoyun', name: '界赵云', hp: 4, gender: 'male', skillId: 'longDan', skillName: '龙胆', skillDesc: '你可以将【杀】当【闪】、【闪】当【杀】使用或打出', skillType: 'convert' },
  jmachao: { id: 'jmachao', name: '界马超', hp: 4, gender: 'male', skillId: 'maShu', skillName: '马术', skillDesc: '锁定技，你计算与其他角色的距离-1', skillType: 'passive' },
  jsimayi: { id: 'jsimayi', name: '界司马懿', hp: 3, gender: 'male', skillId: 'fanKui', skillName: '反馈', skillDesc: '当你受到伤害后，你可以获得伤害来源的一张手牌', skillType: 'trigger' },
  jzhangliao: { id: 'jzhangliao', name: '界张辽', hp: 4, gender: 'male', skillId: 'tuXi', skillName: '突袭', skillDesc: '摸牌阶段，你可以放弃摸牌，获得至多两名其他角色各一张手牌', skillType: 'active' },
  jganning: { id: 'jganning', name: '界甘宁', hp: 4, gender: 'male', skillId: 'qiXi', skillName: '奇袭', skillDesc: '你可以将一张黑色牌当【过河拆桥】使用', skillType: 'convert' },
  jxiahoudun: { id: 'jxiahoudun', name: '界夏侯惇', hp: 4, gender: 'male', skillId: 'gangLie', skillName: '刚烈', skillDesc: '当你受到伤害后，你可以判定：不为红桃则伤害来源弃2牌或受1伤害', skillType: 'trigger' },
  jxuchu: { id: 'jxuchu', name: '界许褚', hp: 4, gender: 'male', skillId: 'luoYi', skillName: '裸衣', skillDesc: '摸牌阶段，你可以少摸一张牌，若如此做你使用【杀】或【决斗】伤害+1', skillType: 'active' },

  // 其他
  xunyu: { id: 'xunyu', name: '荀彧', hp: 3, gender: 'male', skillId: 'quHu', skillName: '驱虎', skillDesc: '出牌阶段限一次，你可以与体力值大于你的一名角色拼点：若你赢，你令该角色对其攻击范围内的一名角色造成1点伤害', skillType: 'active' },
  liufeng: { id: 'liufeng', name: '刘封', hp: 4, gender: 'male', skillId: 'xianSi', skillName: '陷嗣', skillDesc: '出牌阶段限一次，你可以将场上的一张牌置于你的武将牌上作为"逆"；若"逆"的数量大于2，你受到1点伤害', skillType: 'active' },
  zhanghe: { id: 'zhanghe', name: '张郃', hp: 4, gender: 'male', skillId: 'qiaoBian', skillName: '巧变', skillDesc: '你可以弃一张牌并跳过一个阶段（准备、判定、摸牌、出牌、弃牌）', skillType: 'active' },
  dengai: { id: 'dengai', name: '邓艾', hp: 4, gender: 'male', skillId: 'tunTian', skillName: '屯田', skillDesc: '当你于回合外失去牌后，你可以判定：若为非红桃，将此牌置于你的武将牌上作为"田"', skillType: 'trigger' },
};

const CARD_TEMPLATES = {
  strike: [[0,7],[0,8],[0,8],[0,9],[0,9],[0,10],[0,10],[2,2],[2,3],[2,4],[2,5],[2,6],[2,7],[2,7],[2,8],[2,8],[2,9],[2,9],[2,10],[2,10],[2,'J'],[2,'J'],[1,10],[1,10],[3,6],[3,7],[3,8],[3,9],[3,10],[3,'K']],
  dodge: [[1,2],[1,2],[3,2],[3,3],[3,4],[3,5],[3,6],[3,7],[3,8],[3,9],[3,10],[3,'J'],[3,'J'],[3,'Q'],[3,'K']],
  peach: [[1,3],[1,4],[1,6],[1,7],[1,8],[1,9],[1,'Q'],[3,'Q']],
  wine: [[0,3],[0,9],[2,3],[2,9],[3,9]],
  zhangba: [[2,'Q']], guanShiFu: [[0,5]], qingLong: [[0,6]], zhuGeLianNu: [[0,'A']],
  hanBingJian: [[2,2]], ciXiongShuangJian: [[0,2]], fangTianHuaJi: [[1,'K']], qingGangJian: [[0,6]],
  baGuaZhen: [[0,'K'],[2,'K']], renWangDun: [[2,'J']],
  jueYing: [[2,5]], zhuaHuangFeiDian: [[1,5]], diLu: [[1,5]],
  chiTu: [[3,5]], ziXing: [[3,'K']], daYuan: [[3,3]],
  wuZhongShengYou: [[1,7],[1,8],[1,9],[1,'J']],
  guoHeChaiQiao: [[0,3],[0,4],[1,'Q'],[1,'K']],
  shunShouQianYang: [[0,3],[0,4],[0,'J']],
  jueDou: [[0,'A'],[2,'A']],
  nanManRuQin: [[0,7],[2,7]],
  wanJianQiFa: [[1,'A']],
  wuXieKeJi: [[0,'J'],[0,'Q'],[2,'Q'],[2,'K']],
  jieDaoShaRen: [[2,'J']],
  taoYuanJieYi: [[1,'A']],
  huoGong: [[2,'J'],[2,'Q']],
  tieSuoLianHuan: [[2,10],[2,'J'],[0,'J'],[0,'Q']],
  leBuSiShu: [[2,6],[2,'J'],[1,6]],
  shanDian: [[0,'A'],[1,'A']],
  bingLiangCunDuan: [[0,10]],
};

function createCardDB() {
  const db = []; let uid = 0;
  const typeMap = {
    strike:'basic',dodge:'basic',peach:'basic',wine:'basic',
    zhangba:'equip',guanShiFu:'equip',qingLong:'equip',zhuGeLianNu:'equip',hanBingJian:'equip',ciXiongShuangJian:'equip',fangTianHuaJi:'equip',qingGangJian:'equip',
    baGuaZhen:'equip',renWangDun:'equip',jueYing:'equip',zhuaHuangFeiDian:'equip',diLu:'equip',chiTu:'equip',ziXing:'equip',daYuan:'equip',
  };
  const slotMap = {
    zhangba:'weapon',guanShiFu:'weapon',qingLong:'weapon',zhuGeLianNu:'weapon',hanBingJian:'weapon',ciXiongShuangJian:'weapon',fangTianHuaJi:'weapon',qingGangJian:'weapon',
    baGuaZhen:'armor',renWangDun:'armor',jueYing:'defHorse',zhuaHuangFeiDian:'defHorse',diLu:'defHorse',chiTu:'atkHorse',ziXing:'atkHorse',daYuan:'atkHorse',
  };
  for (const [subtype, templates] of Object.entries(CARD_TEMPLATES)) {
    for (const [suit, num] of templates) {
      const card = { uid: uid++, name: CARD_NAME[subtype], type: typeMap[subtype] || 'trick', subtype, suit, num: String(num) };
      if (slotMap[subtype]) card.equipSlot = slotMap[subtype];
      if (WEAPON_RANGE[subtype]) card.range = WEAPON_RANGE[subtype];
      db.push(card);
    }
  }
  return db;
}

// ---------- Deck ----------
class Deck {
  constructor() { this.cards = []; this.discards = []; }
  init() { this.cards = createCardDB(); this.discards = []; this.shuffle(3); }
  shuffle(times) {
    times = times || 1;
    for (let t = 0; t < times; t++) {
      for (let i = this.cards.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]]; }
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
  recycle() { if (this.discards.length === 0) return; this.cards.push(...this.discards); this.discards = []; this.shuffle(2); }
  discard(...cards) { this.discards.push(...cards); }
  get totalRemaining() { return this.cards.length; }
  get totalDiscarded() { return this.discards.length; }
}

// ---------- Player ----------
class Player {
  constructor(id, name) {
    this.id = id; this.name = name; this.identity = null;
    this.hp = 4; this.maxHp = 4;
    this.hand = []; this.equipment = {}; this.judgments = [];
    this.alive = true; this.hasUsedStrike = false; this.wineBuff = false;
    this.identityRevealed = false; this.hero = null; this.skillsUsed = {};
    this.isHuman = true; this.hasUsedStrikeThisTurn = false;
    this.luoYiBuff = false; this.keJiUsedStrike = false;
    this.chained = false; // 铁索连环状态
    this.skipPlayPhase = false; this.skipDrawPhase = false;
  }
  setIdentity(id) { this.identity = id; }
  resetTurnState() {
    this.hasUsedStrike = false; this.wineBuff = false; this.skillsUsed = {};
    this.hasUsedStrikeThisTurn = false; this.luoYiBuff = false; this.keJiUsedStrike = false;
    this.hasUsedWine = false; // 酒每回合限用一次
    this.skipPlayPhase = false; this.skipDrawPhase = false;
  }
  addCards(cards) { this.hand.push(...cards); }
  removeCard(index) { if (index < 0 || index >= this.hand.length) return null; return this.hand.splice(index, 1)[0]; }
  findCard(subtype) { return this.hand.findIndex(c => c.subtype === subtype); }
  get handLimit() { return Math.max(this.hp, 0); }
  get isLord() { return this.identity === IDENTITY.LORD; }
  get isLoyalist() { return this.identity === IDENTITY.LOYALIST; }
  get isRebel() { return this.identity === IDENTITY.REBEL; }
  get isTraitor() { return this.identity === IDENTITY.TRAITOR; }
  isAllyOf(other) { if (!this.identity || !other.identity) return false; return this.identity === other.identity; }
  isEnemyOf(other) { if (!this.identity || !other.identity) return false; return this.identity !== other.identity; }
  get weaponRange() { return this.equipment.weapon ? (WEAPON_RANGE[this.equipment.weapon.subtype] || 1) : 1; }
  get attackRangeBonus() { return this.equipment.atkHorse ? 1 : 0; }
  get defenseRangeBonus() { return this.equipment.defHorse ? 1 : 0; }
  hasArmor() { return !!this.equipment.armor; }
  armorType() { return this.equipment.armor ? this.equipment.armor.subtype : null; }
  hasTargetRestriction(subtype) {
    if (subtype === 'leBuSiShu' || subtype === 'shunShouQianYang') {
      return this.hero && this.hero.skillId === 'qianXun';
    }
    return false;
  }
}

// ---------- 身份分配 ----------
function getIdentityDistribution(n) {
  const m = { 2:[0,1,0], 3:[0,2,0], 4:[0,3,0], 5:[1,2,1], 6:[1,3,1], 7:[2,3,1], 8:[2,4,1], 9:[3,4,1], 10:[3,5,1] };
  const [loy, reb, tra] = m[n] || [0, n-1, 0];
  const ids = [IDENTITY.LORD];
  for (let i = 0; i < loy; i++) ids.push(IDENTITY.LOYALIST);
  for (let i = 0; i < reb; i++) ids.push(IDENTITY.REBEL);
  for (let i = 0; i < tra; i++) ids.push(IDENTITY.TRAITOR);
  for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
  return ids;
}

// ---------- GameEngine ----------
class SanguoshaGame {
  constructor(playerIds, playerNames) {
    this.deck = new Deck(); this.players = []; this.currentIdx = 0;
    this.phase = null; this.turnNum = 0; this.status = 'playing'; this.winner = null;
    this.logs = []; this.waitingFor = null; this.waitingPlayerId = null;
    this.pendingResponse = null; this.discardNeeded = 0; this._listeners = {};
    this._busy = false; this._currentIgnoreArmor = false; this._currentStrikeCard = null; this._lastDamageCard = null; this._onDeathResolved = null; this._saveChainTimer = null;
    for (let i = 0; i < playerIds.length; i++) {
      this.players.push(new Player(playerIds[i], playerNames[i] || `玩家${i + 1}`));
    }
  }

  on(event, fn) { if (!this._listeners[event]) this._listeners[event] = []; this._listeners[event].push(fn); }
  _emit(event, data) { if (this._listeners[event]) this._listeners[event].forEach(fn => fn(data)); }

  // ----- 初始化 -----
  start() {
    this.deck.init(); this.assignIdentities(); this.assignHeroes();
    for (const p of this.players) {
      const count = p.isLord ? 5 : 4;
      const drawn = this.deck.draw(count);
      // 确保每人至少有1张基本牌（杀/闪/桃）
      const hasBasic = drawn.some(c => c.type === 'basic');
      if (!hasBasic && drawn.length > 0) {
        // 从牌堆找一张基本牌替换最后一张
        const basicIdx = this.deck.cards.findIndex(c => c.type === 'basic');
        if (basicIdx !== -1) {
          const basicCard = this.deck.cards.splice(basicIdx, 1)[0];
          const replaced = drawn.pop();
          this.deck.cards.push(replaced);
          drawn.push(basicCard);
        }
      }
      p.addCards(drawn);
      p.maxHp = p.hero ? p.hero.hp : 4;
      p.hp = p.isLord ? p.maxHp + 1 : p.maxHp;
      if (p.isLord) p.maxHp = p.hp;
      p.identityRevealed = false;
    }
    this.log('游戏开始！');
    this.currentIdx = 0;
    this.startTurn();
  }

  assignIdentities() {
    const ids = getIdentityDistribution(this.players.length);
    for (let i = 0; i < this.players.length; i++) this.players[i].setIdentity(ids[i]);
  }

  assignHeroes() {
    const pool = Object.keys(HEROES);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const used = new Set();
    for (let i = 0; i < this.players.length; i++) {
      if (this.players[i].hero) {
        used.add(this.players[i].hero.id);
      }
    }
    let j = 0;
    for (let i = 0; i < this.players.length; i++) {
      if (!this.players[i].hero) {
        while (j < shuffled.length && used.has(shuffled[j])) j++;
        if (j < shuffled.length) {
          this.players[i].hero = HEROES[shuffled[j]];
          used.add(shuffled[j]);
          j++;
        } else {
          // 不够用时从头找未使用的
          for (const k of Object.keys(HEROES)) {
            if (!used.has(k)) { this.players[i].hero = HEROES[k]; used.add(k); break; }
          }
        }
      }
    }
  }

  get cur() { return this.players[this.currentIdx]; }

  // ----- 公共/私有状态 -----
  getPublicState(viewerId) {
    const viewerIdx = viewerId ? this.players.findIndex(p => p.id === viewerId) : -1;
    return {
      players: this.players.map((p, i) => ({
        id: p.id, name: p.name, heroName: p.hero ? p.hero.name : '',
        heroId: p.hero ? p.hero.id : '', skillName: p.hero ? p.hero.skillName : '', skillDesc: p.hero ? p.hero.skillDesc : '',
        hp: p.hp, maxHp: p.maxHp, alive: p.alive,
        cardCount: p.alive ? p.hand.length : 0,
        identity: p.identityRevealed ? p.identity : null,
        identityRevealed: p.identityRevealed,
        equipment: this._getEquipmentSummary(p),
        judgments: p.judgments.map(c => ({ name: c.name, subtype: c.subtype, suit: c.suit, num: c.num })),
        distance: (viewerIdx >= 0 && i !== viewerIdx && p.alive) ? this.calcDistance(viewerIdx, i) : null,
      })),
      currentPlayerId: this.cur ? this.cur.id : null,
      phase: this.phase, phaseLabel: this.phase ? PHASE_LABEL[this.phase] : '等待中',
      turnNum: this.turnNum, deckCount: this.deck.totalRemaining,
      discardCount: this.deck.totalDiscarded,
      discardPile: this.deck.discards.slice(-20).map(c => ({ name: c.name, subtype: c.subtype, suit: c.suit, num: c.num })),
      logs: this.logs.slice(-30),
      winner: this.winner, status: this.status,
    };
  }

  _getEquipmentSummary(p) {
    const eq = {};
    for (const [slot, card] of Object.entries(p.equipment)) {
      eq[slot] = { name: card.name, subtype: card.subtype, suit: card.suit, num: card.num };
    }
    return eq;
  }

  getStateForPlayer(playerId) {
    const p = this.players.find(x => x.id === playerId);
    if (!p) return null;
    return {
      hand: p.hand, identity: p.identity, identityLabel: IDENTITY_LABEL[p.identity],
      hero: p.hero, heroSkill: p.hero ? { name: p.hero.skillName, desc: p.hero.skillDesc || '', used: p.skillsUsed[p.hero.skillId] } : null,
      hasUsedStrike: p.hasUsedStrike, wineBuff: p.wineBuff,
    };
  }

  // ----- 距离计算（最短路径）-----
  calcDistance(fromIdx, toIdx) {
    const n = this.players.length;
    // 顺时针距离
    let cw = 0;
    for (let i = 1; i < n; i++) {
      const idx = (fromIdx + i) % n;
      if (this.players[idx].alive) { cw++; if (idx === toIdx) break; }
    }
    // 逆时针距离
    let ccw = 0;
    for (let i = 1; i < n; i++) {
      const idx = (fromIdx - i + n) % n;
      if (this.players[idx].alive) { ccw++; if (idx === toIdx) break; }
    }
    let dist = Math.min(cw, ccw);
    // 马术：计算距离-1
    const from = this.players[fromIdx];
    if (from.hero && from.hero.skillId === 'maShu') dist -= 1;
    // 攻击方-1马 + 防御方+1马，最后取最小值1
    dist = Math.max(1, dist - from.attackRangeBonus + this.players[toIdx].defenseRangeBonus);
    return dist;
  }

  canReach(srcIdx, targetIdx) {
    const src = this.players[srcIdx];
    const dist = this.calcDistance(srcIdx, targetIdx);
    return dist <= src.weaponRange;
  }

  // ----- 回合流转 -----
  startTurn() {
    this.currentIdx = this.nextAliveFrom(this.currentIdx);
    if (this.currentIdx === -1) return;
    this.turnNum++;
    const p = this.cur;
    p.resetTurnState();
    // 强制清除上一回合残留的响应状态
    this.waitingFor = null;
    this.pendingResponse = null;
    this._onDeathResolved = null;
    this.phase = PHASE.READY;
    this._emit('stateChanged');
    this.log(`--- 第 ${this.turnNum} 回合 · ${p.name} 的回合 ---`);
    this._emit('turnStart', { playerId: p.id, playerName: p.name, turnNum: this.turnNum });
    this.runPhase();
  }

  nextAliveFrom(from) {
    for (let i = 0; i < this.players.length; i++) {
      const idx = (from + 1 + i) % this.players.length;
      if (this.players[idx].alive) return idx;
    }
    return -1;
  }

  runPhase() {
    if (this.status !== 'playing') return;
    switch (this.phase) {
      case PHASE.READY: this.runReady(); return;
      case PHASE.JUDGMENT: this.runJudgment(); return;
      case PHASE.DRAW: this.runDraw(); return;
      case PHASE.PLAY: this.runPlay(); return;
      case PHASE.DISCARD: this.runDiscard(); return;
      case PHASE.END: this.runEnd(); return;
    }
  }

  nextPhase() {
    const idx = PHASE_ORDER.indexOf(this.phase);
    if (idx < PHASE_ORDER.length - 1) { this.phase = PHASE_ORDER[idx + 1]; this._emit('stateChanged'); this.runPhase(); }
  }

  // 准备阶段
  runReady() {
    const p = this.cur;
    // 诸葛亮观星：准备阶段观看牌堆顶X张牌并排列
    if (p.hero && p.hero.skillId === 'guanXing' && !p.skillsUsed.guanXing) {
      const aliveCount = this.players.filter(t => t.alive).length;
      const x = Math.min(aliveCount, 5);
      if (this.deck.cards.length >= x && x > 0) {
        if (p.isHuman) {
          // 人类玩家：发送观星选择界面
          const viewed = this.deck.draw(x);
          this._guanXingCards = viewed;
          this.waitingFor = 'guanXing';
          this.waitingPlayerId = p.id;
          this._emit('stateChanged');
          this._emit('awaitGuanXing', {
            playerId: p.id,
            cards: viewed.map(c => ({ name: c.name, subtype: c.subtype, suit: c.suit, num: c.num })),
            count: x,
          });
          return; // 等待玩家选择，不进入下一阶段
        } else {
          // AI：好牌放顶，差牌放底
          const viewed = this.deck.draw(x);
          const priority = { peach: 10, strike: 8, dodge: 7, wine: 6, wuZhongShengYou: 5, jueDou: 4, nanManRuQin: 3, wanJianQiFa: 3 };
          viewed.sort((a, b) => (priority[b.subtype] || 0) - (priority[a.subtype] || 0));
          // 前半放顶，后半放底
          const topCount = Math.ceil(viewed.length / 2);
          const topCards = viewed.slice(0, topCount);
          const bottomCards = viewed.slice(topCount);
          // 顶：后放的在最上面
          for (let i = topCards.length - 1; i >= 0; i--) {
            this.deck.cards.push(topCards[i]);
          }
          // 底：先放的在最下面
          this.deck.cards.unshift(...bottomCards);
          p.skillsUsed.guanXing = true;
          this.log(`${p.name} 发动【观星】，观看了${x}张牌，${topCards.length}张放顶，${bottomCards.length}张放底`);
          this._emit('stateChanged');
        }
      }
    }
    this.nextPhase();
  }

  // 判定阶段
  runJudgment() {
    const p = this.cur;
    if (p.judgments.length === 0) { this.nextPhase(); return; }
    this._resolveNextJudgment();
  }

  _resolveNextJudgment() {
    const p = this.cur;
    if (p.judgments.length === 0) { this.nextPhase(); return; }

    const judgment = p.judgments.shift();
    const result = this.deck.draw(1)[0];
    this.log(`${p.name} 判定【${judgment.name}】：${result.name}(${SUIT_SYMBOL[result.suit]}${result.num})`);
    this.deck.discard(result);
    this.deck.discard(judgment); // 判定牌结算后弃置
    this._emit('stateChanged');

    // 乐不思蜀：判定非红桃则跳过出牌阶段（设标志，继续处理剩余判定）
    if (judgment.subtype === 'leBuSiShu') {
      if (result.suit !== SUIT.HEART) {
        this.log(`${p.name} 判定失败，跳过出牌阶段`);
        p.skipPlayPhase = true;
      } else {
        this.log(`${p.name} 判定成功，不受影响`);
      }
    }
    // 兵粮寸断：判定非梅花则跳过摸牌阶段（设标志，继续处理剩余判定）
    else if (judgment.subtype === 'bingLiangCunDuan') {
      if (result.suit !== SUIT.CLUB) {
        this.log(`${p.name} 判定失败，跳过摸牌阶段`);
        p.skipDrawPhase = true;
      } else {
        this.log(`${p.name} 判定成功，不受影响`);
      }
    }
    // 闪电：判定黑桃2-9则受3点雷电伤害，否则传给下家
    else if (judgment.subtype === 'shanDian') {
      if (result.suit === SUIT.SPADE && parseInt(result.num) >= 2 && parseInt(result.num) <= 9) {
        this.log(`${p.name} 被闪电击中！受到3点雷电伤害`);
        this.dealDamage(this.currentIdx, this.currentIdx, 3, 'thunder');
        // 闪电击中后如果死亡，不再继续判定
        if (!p.alive) return;
      } else {
        // 闪电传递：找下一个没有闪电的存活玩家
        let nextIdx = this.nextAliveFrom(this.currentIdx);
        const startIdx = nextIdx;
        while (nextIdx !== -1 && nextIdx !== this.currentIdx) {
          if (!this.players[nextIdx].judgments.some(c => c.subtype === 'shanDian')) {
            this.players[nextIdx].judgments.push(judgment);
            this.log(`闪电传递给 ${this.players[nextIdx].name}`);
            break;
          }
          nextIdx = this.nextAliveFrom(nextIdx);
          if (nextIdx === startIdx) break; // 所有人都有闪电，弃置
        }
      }
    }

    // 继续判定下一张
    this.delayed(() => this._resolveNextJudgment());
  }

  // 摸牌阶段
  runDraw() {
    const p = this.cur;
    // 兵粮寸断判定失败：跳过摸牌阶段
    if (p.skipDrawPhase) {
      p.skipDrawPhase = false;
      this.log(`${p.name} 跳过摸牌阶段`);
      this.nextPhase();
      return;
    }
    // 张辽突袭：摸牌阶段可放弃摸牌，获得至多两名其他角色各一张手牌
    if (p.hero && p.hero.skillId === 'tuXi' && !p.skillsUsed.tuXi) {
      const targets = this.players.filter(t => t.alive && t.id !== p.id && t.hand.length > 0);
      if (targets.length > 0) {
        // AI自动发动：优先偷手牌多的敌人，但也可偷任意角色
        const enemies = targets.filter(t => p.isEnemyOf(t));
        const pool = enemies.length > 0 ? enemies : targets;
        const stealTargets = pool.sort((a, b) => b.hand.length - a.hand.length).slice(0, 2);
        if (stealTargets.length > 0) {
          p.skillsUsed.tuXi = true;
          for (const t of stealTargets) {
            const randIdx = Math.floor(Math.random() * t.hand.length);
            const stolen = t.removeCard(randIdx);
            p.hand.push(stolen);
            this.log(`${p.name} 发动【突袭】，获得了 ${t.name} 的一张牌`);
          }
          this._emit('stateChanged');
          this.nextPhase();
          return;
        }
      }
    }
    // 许褚裸衣：可选择是否发动
    if (p.hero && p.hero.skillId === 'luoYi' && !p.skillsUsed.luoYi) {
      this.waitingFor = 'drawChoice';
      this.waitingPlayerId = p.id;
      this._emit('stateChanged');
      this._emit('awaitDrawChoice', { playerId: p.id, skillId: 'luoYi', label: '是否发动【裸衣】？（少摸1张，本回合杀/决斗伤害+1）' });
      return;
    }
    this._doNormalDraw();
  }

  _doNormalDraw() {
    const p = this.cur;
    const drawn = this.deck.draw(2);
    p.addCards(drawn);
    this.log(`${p.name} 摸了2张牌`);
    this._emit('drawCards', { playerId: p.id, count: 2, cards: drawn });
    this._emit('stateChanged');
    this.nextPhase();
  }

  playerDrawChoice(playerId, useSkill) {
    if (this.waitingFor !== 'drawChoice' || this.waitingPlayerId !== playerId) return { ok: false };
    this.waitingFor = null; this.waitingPlayerId = null;
    const p = this.cur;
    if (useSkill && p.hero && p.hero.skillId === 'luoYi') {
      p.luoYiBuff = true;
      p.skillsUsed.luoYi = true;
      const drawn = this.deck.draw(1);
      p.addCards(drawn);
      this.log(`${p.name} 发动【裸衣】，少摸1张牌，本回合使用【杀】或【决斗】伤害+1`);
      this._emit('drawCards', { playerId: p.id, count: 1, cards: drawn });
      this._emit('stateChanged');
      this.nextPhase();
    } else {
      this._doNormalDraw();
    }
    return { ok: true };
  }

  playerGuanXing(playerId, topIndices) {
    if (this.waitingFor !== 'guanXing' || this.waitingPlayerId !== playerId) return { ok: false, msg: '不在观星阶段' };
    this.waitingFor = null; this.waitingPlayerId = null;
    const p = this.cur;
    const viewed = this._guanXingCards;
    if (!viewed) return { ok: false, msg: '无观星牌' };
    this._guanXingCards = null;
    // topIndices: 放在牌堆顶的牌的索引（按顺序），其余放牌堆底
    const topSet = new Set(topIndices);
    const topCards = topIndices.map(i => viewed[i]).filter(c => c);
    const bottomCards = viewed.filter((_, i) => !topSet.has(i));
    // 顶：后放的在最上面
    for (let i = topCards.length - 1; i >= 0; i--) {
      this.deck.cards.push(topCards[i]);
    }
    // 底：先放的在最下面
    this.deck.cards.unshift(...bottomCards);
    p.skillsUsed.guanXing = true;
    this.log(`${p.name} 发动【观星】，${topCards.length}张放牌堆顶，${bottomCards.length}张放牌堆底`);
    this._emit('stateChanged');
    this.nextPhase();
    return { ok: true };
  }

  // 出牌阶段
  runPlay() {
    // 乐不思蜀判定失败：跳过出牌阶段
    if (this.cur.skipPlayPhase) {
      this.cur.skipPlayPhase = false;
      this.log(`${this.cur.name} 跳过出牌阶段`);
      this.nextPhase();
      return;
    }
    this._emit('stateChanged');
    this.waitingFor = 'play';
    this.waitingPlayerId = this.cur.id;
    this.log(`[调试] runPlay: waitingFor=${this.waitingFor}, curId=${this.cur.id}`);
    this._emit('awaitPlay', { playerId: this.cur.id });
  }

  // 弃牌阶段
  runDiscard() {
    const p = this.cur;
    // 吕蒙克己：未使用杀可跳过弃牌
    if (p.hero && p.hero.skillId === 'keJi' && !p.keJiUsedStrike) {
      this.log(`${p.name} 【克己】跳过弃牌阶段`);
      this.nextPhase();
      return;
    }
    const limit = p.handLimit;
    if (p.hand.length > limit) {
      const need = p.hand.length - limit;
      this.discardNeeded = need;
      this.waitingFor = 'discard';
      this.waitingPlayerId = p.id;
      this.log(`${p.name} 需要弃 ${need} 张牌`);
      this._emit('stateChanged');
      this._emit('awaitDiscard', { playerId: p.id, count: need });
    } else { this.nextPhase(); }
  }

  // 结束阶段
  runEnd() {
    this.log(`${this.cur.name} 结束回合`);
    this._emit('stateChanged');
    this._emit('turnEnd', { playerId: this.cur.id });
    this.delayed(() => this.startTurn());
  }

  // ----- 玩家动作 -----
  playerPlayCard(playerId, cardIdx, targetIdx) {
    if (this.waitingFor !== 'play' || this.cur.id !== playerId || !this.cur.alive) {
      return { ok: false, msg: '不是你的出牌阶段' };
    }
    const p = this.cur;
    if (cardIdx < 0 || cardIdx >= p.hand.length) {
      this.log(`[调试] ${playerId} 无效手牌索引: cardIdx=${cardIdx}, handLen=${p.hand.length}`);
      return { ok: false, msg: '无效手牌' };
    }
    const card = p.hand[cardIdx];
    this.log(`[调试] ${playerId} 出牌: cardIdx=${cardIdx}, card=${card.name}(${card.subtype}), hand=[${p.hand.map(c => c.name).join(',')}]`);

    // 1. 基本牌（按 subtype 精确匹配）
    if (card.subtype === 'strike') return this.useStrike(cardIdx, targetIdx);
    if (card.subtype === 'peach') return this.usePeach(cardIdx);
    if (card.subtype === 'wine') return this.useWine(cardIdx);
    if (card.subtype === 'dodge') return { ok: false, msg: '【闪】不能主动使用' };

    // 2. 装备牌（equipSlot 字段 或 type==='equip' 双重判断）
    const VALID_SLOTS = ['weapon', 'armor', 'defHorse', 'atkHorse'];
    if ((card.equipSlot && VALID_SLOTS.includes(card.equipSlot)) || card.type === 'equip') {
      return this.useEquipment(cardIdx);
    }

    // 3. 锦囊牌（所有非基本非装备的牌都是锦囊）
    return this.useTrick(cardIdx, targetIdx);
  }

  playerEndPlay(playerId) {
    if (this.waitingFor !== 'play' || this.waitingPlayerId !== playerId || !this.cur.alive) return { ok: false };
    this.waitingFor = null; this.waitingPlayerId = null;
    this.phase = PHASE.DISCARD;
    this._emit('stateChanged');
    this.runPhase();
    return { ok: true };
  }

  playerDiscard(playerId, indices) {
    if (this.waitingFor !== 'discard' || this.waitingPlayerId !== playerId || !this.cur.alive) return { ok: false };
    if (indices.length !== this.discardNeeded) return { ok: false, msg: `需要弃 ${this.discardNeeded} 张` };
    const p = this.cur;
    const sorted = [...indices].sort((a, b) => b - a);
    for (const idx of sorted) { const card = p.removeCard(idx); if (card) this.deck.discard(card); }
    this.log(`${p.name} 弃置了 ${indices.length} 张牌`);
    this.waitingFor = null; this.waitingPlayerId = null;
    this.nextPhase();
    return { ok: true };
  }

  playerRespond(playerId, cardIdx) {
    if (this.waitingFor !== 'response' || !this.pendingResponse || this.pendingResponse.playerId !== playerId)
      return { ok: false, msg: '不在响应阶段' };
    const p = this.players.find(x => x.id === playerId);
    if (!p || !p.alive) return { ok: false, msg: '玩家无效' };
    if (cardIdx < 0 || cardIdx >= p.hand.length) return { ok: false, msg: '索引越界' };
    const card = p.hand[cardIdx];

    // 检查牌类型（支持转换技能）
    const needed = this.pendingResponse.type;
    let valid = card.subtype === needed;

    // 龙胆：杀当闪
    if (!valid && needed === 'dodge' && card.subtype === 'strike' && p.hero && p.hero.skillId === 'longDan') valid = true;
    // 龙胆：闪当杀
    if (!valid && needed === 'strike' && card.subtype === 'dodge' && p.hero && p.hero.skillId === 'longDan') valid = true;
    // 倾国：黑色手牌当闪
    if (!valid && needed === 'dodge' && (card.suit === SUIT.SPADE || card.suit === SUIT.CLUB) && p.hero && p.hero.skillId === 'qingGuo') valid = true;
    // 急救：回合外红色牌当桃
    if (!valid && needed === 'peach' && (card.suit === SUIT.HEART || card.suit === SUIT.DIAMOND) && p.hero && p.hero.skillId === 'jiJiu' && this.cur.id !== playerId) valid = true;
    // 武圣：红色牌当杀
    if (!valid && needed === 'strike' && (card.suit === SUIT.HEART || card.suit === SUIT.DIAMOND) && p.hero && p.hero.skillId === 'wuSheng') valid = true;

    if (!valid) return { ok: false, msg: `牌类型不匹配:需要${needed},实际${card.subtype}` };

    p.removeCard(cardIdx); this.deck.discard(card);
    this.waitingFor = null;
    const cb = this.pendingResponse.onUse;
    this.pendingResponse = null;
    this._emit('stateChanged');
    if (cb) cb();
    return { ok: true };
  }

  playerPassResponse(playerId) {
    if (this.waitingFor !== 'response' || !this.pendingResponse || this.pendingResponse.playerId !== playerId)
      return { ok: false };
    this.waitingFor = null;
    const cb = this.pendingResponse.onPass;
    this.pendingResponse = null;
    this._emit('stateChanged');
    if (cb) cb();
    return { ok: true };
  }

  // ----- 装备系统 -----
  useEquipment(cardIdx) {
    const p = this.cur;
    const card = p.hand[cardIdx];
    // 确定装备槽位：优先用 equipSlot，否则从 WEAPON_RANGE 等推断
    let slot = card.equipSlot;
    if (!slot) {
      if (WEAPON_RANGE[card.subtype]) slot = 'weapon';
      else if (['baGuaZhen', 'renWangDun'].includes(card.subtype)) slot = 'armor';
      else if (['jueYing', 'zhuaHuangFeiDian', 'diLu'].includes(card.subtype)) slot = 'defHorse';
      else if (['chiTu', 'ziXing', 'daYuan'].includes(card.subtype)) slot = 'atkHorse';
    }
    if (!slot) return { ok: false, msg: '不是装备牌' };
    const old = p.equipment[slot];
    p.removeCard(cardIdx);
    p.equipment[slot] = card;
    if (old) {
      this.deck.discard(old);
      this.log(`${p.name} 更换装备：卸下【${old.name}】，装备【${card.name}】`);
    } else {
      this.log(`${p.name} 装备了【${card.name}】`);
    }
    this._emit('stateChanged');
    return { ok: true };
  }

  // ----- 杀 -----
  useStrike(cardIdx, targetIdx) {
    const src = this.cur;
    // 张飞咆哮 / 诸葛连弩：无次数限制
    const isPaoXiao = src.hero && src.hero.skillId === 'paoXiao';
    const isLianNu = src.equipment.weapon && src.equipment.weapon.subtype === 'zhuGeLianNu';
    if (src.hasUsedStrike && !isPaoXiao && !isLianNu) return { ok: false, msg: '本回合已出过杀' };
    if (!this.players[targetIdx] || !this.players[targetIdx].alive || targetIdx === this.currentIdx)
      return { ok: false, msg: '无效目标' };
    if (!this.canReach(this.currentIdx, targetIdx)) return { ok: false, msg: '目标不在攻击范围内' };

    const card = src.hand[cardIdx];
    let isStrike = card.subtype === 'strike';
    if (!isStrike && src.hero && src.hero.skillId === 'wuSheng' && (card.suit === SUIT.HEART || card.suit === SUIT.DIAMOND)) isStrike = true;
    if (!isStrike && src.hero && src.hero.skillId === 'longDan' && card.subtype === 'dodge') isStrike = true;
    // 丈八蛇矛：两张手牌当杀
    let zhangbaSecondCard = null;
    if (!isStrike && src.equipment.weapon && src.equipment.weapon.subtype === 'zhangba' && src.hand.length >= 2) {
      isStrike = true;
      // 自动选择第二张牌（排除当前牌）
      const secondIdx = src.hand.findIndex((c, i) => i !== cardIdx);
      if (secondIdx !== -1) {
        zhangbaSecondCard = src.hand[secondIdx];
        // 先移除较大索引，再移除较小索引，避免索引偏移
        if (secondIdx > cardIdx) {
          src.removeCard(secondIdx);
          src.removeCard(cardIdx);
        } else {
          src.removeCard(cardIdx);
          src.removeCard(secondIdx);
        }
        this.deck.discard(card);
        this.deck.discard(zhangbaSecondCard);
        src.hasUsedStrike = true; src.keJiUsedStrike = true;
        // 继续走后面的伤害计算流程...
        const damage = (src.wineBuff ? 2 : 1) + (src.luoYiBuff ? 1 : 0);
        src.wineBuff = false; src.luoYiBuff = false;
        const target = this.players[targetIdx];
        const weaponType = src.equipment.weapon ? src.equipment.weapon.subtype : null;
        const ignoreArmor = weaponType === 'qingGangJian';
        const needsTwoDodges = src.hero && src.hero.skillId === 'wuShuang';
        this.log(`${src.name} 发动【丈八蛇矛】，将两张手牌当【杀】对 ${target.name} 使用`);
        this._currentIgnoreArmor = ignoreArmor;
        this._emit('stateChanged');
        this.requestResponse(targetIdx, 'dodge',
          () => this.dealDamage(this.currentIdx, targetIdx, damage, 'normal', ignoreArmor),
          () => {
            if (needsTwoDodges) {
              const hasMoreDodge = this._hasDodgeCard(target);
              if (hasMoreDodge) {
                this.requestResponse(targetIdx, 'dodge',
                  () => this.dealDamage(this.currentIdx, targetIdx, damage, 'normal', ignoreArmor),
                  () => { this.log(`${target.name} 使用了两张【闪】抵消了【杀】`); }
                );
              } else {
                this.dealDamage(this.currentIdx, targetIdx, damage, 'normal', ignoreArmor);
              }
            } else {
              this.log(`${target.name} 使用了【闪】`);
            }
          }
        );
        return { ok: true };
      }
    }
    if (!isStrike) return { ok: false, msg: '不是杀' };

    src.removeCard(cardIdx); this.deck.discard(card);
    src.hasUsedStrike = true; src.keJiUsedStrike = true;
    const damage = (src.wineBuff ? 2 : 1) + (src.luoYiBuff ? 1 : 0);
    src.wineBuff = false; src.luoYiBuff = false;

    const target = this.players[targetIdx];
    const weaponType = src.equipment.weapon ? src.equipment.weapon.subtype : null;
    const ignoreArmor = weaponType === 'qingGangJian';
    const needsTwoDodges = src.hero && src.hero.skillId === 'wuShuang';

    this.log(`${src.name} 对 ${target.name} 使用了【杀】`);
    this._currentIgnoreArmor = ignoreArmor;
    this._lastDamageCard = card;
    this._emit('stateChanged');

    // 仁王盾：黑色杀对装备仁王盾的角色直接无效（在请求闪之前检查）
    if (!ignoreArmor && target.hasArmor() && target.armorType() === 'renWangDun') {
      if (card.suit === SUIT.SPADE || card.suit === SUIT.CLUB) {
        this.log(`${target.name} 【仁王盾】黑色【杀】无效`);
        this._restorePlayState();
        return { ok: true };
      }
    }

    // 寒冰剑：命中时可防止伤害，改为弃置目标两张牌
    if (weaponType === 'hanBingJian') {
      this._currentStrikeCard = card;
      this.requestResponse(targetIdx, 'dodge',
        () => {
          // 杀命中，寒冰剑效果：防止伤害，弃置目标两张牌
          for (let i = 0; i < 2; i++) {
            if (target.hand.length > 0) { const ri = Math.floor(Math.random() * target.hand.length); const c = target.removeCard(ri); this.deck.discard(c); }
          }
          this.log(`${src.name} 【寒冰剑】防止伤害，弃置了 ${target.name} 的两张牌`);
          this._restorePlayState();
        },
        () => { this.log(`${target.name} 使用了【闪】`); this._restorePlayState(); }
      );
      return { ok: true };
    }

    this._currentStrikeCard = card;
    this.requestResponse(targetIdx, 'dodge',
      () => {
        // 杀命中
        // 雌雄双股剑：对异性角色使用杀时，目标需弃一张手牌或使用者摸一张牌
        if (weaponType === 'ciXiongShuangJian' && src.hero && target.hero) {
          const srcGender = src.hero.gender;
          const targetGender = target.hero.gender;
          if (srcGender && targetGender && srcGender !== targetGender && target.hand.length > 0) {
            const ri = Math.floor(Math.random() * target.hand.length); const c = target.removeCard(ri); this.deck.discard(c);
            this.log(`${src.name} 【雌雄双股剑】弃置了 ${target.name} 的一张牌`);
          }
        }
        this.dealDamage(this.currentIdx, targetIdx, damage, 'normal', ignoreArmor);
      },
      () => {
        // 目标出闪
        if (needsTwoDodges) {
          const hasMoreDodge = this._hasDodgeCard(target);
          if (hasMoreDodge) {
            this.requestResponse(targetIdx, 'dodge',
              () => { this.dealDamage(this.currentIdx, targetIdx, damage, 'normal', ignoreArmor); },
              () => { this.log(`${target.name} 使用了两张【闪】抵消了【杀】`); }
            );
          } else {
            this.dealDamage(this.currentIdx, targetIdx, damage, 'normal', ignoreArmor);
          }
        } else {
          this.log(`${target.name} 使用了【闪】`);
          // 青龙偃月刀：被闪后可再出杀
          if (weaponType === 'qingLong') {
            const hasMoreStrike = src.hand.some(c => c.subtype === 'strike');
            if (hasMoreStrike) {
              const nextStrikeIdx = src.hand.findIndex(c => c.subtype === 'strike');
              if (nextStrikeIdx !== -1) {
                const c = src.removeCard(nextStrikeIdx); this.deck.discard(c);
                this.log(`${src.name} 【青龙偃月刀】追加了一张【杀】`);
                this.requestResponse(targetIdx, 'dodge',
                  () => { this.dealDamage(this.currentIdx, targetIdx, damage, 'normal', ignoreArmor); },
                  () => { this.log(`${target.name} 使用了【闪】`); }
                );
                return;
              }
            }
          }
          // 烈弓：杀被闪时弃置目标一张牌
          if (src.hero && src.hero.skillId === 'lieGong' && target.hand.length > 0) {
            if (target.hand.length > 0) {
              const randIdx = Math.floor(Math.random() * target.hand.length);
              const stolen = target.removeCard(randIdx);
              this.deck.discard(stolen);
              this.log(`${src.name} 【烈弓】弃置了 ${target.name} 的一张牌`);
            }
          }
        }
      }
    );
    return { ok: true };
  }

  // ----- 桃 -----
  usePeach(cardIdx) {
    const p = this.cur;
    if (p.hp >= p.maxHp) return { ok: false, msg: '体力已满' };
    const card = p.removeCard(cardIdx);
    this.deck.discard(card);
    p.hp = Math.min(p.hp + 1, p.maxHp);
    this.log(`${p.name} 使用了【桃】，回复1点体力`);
    this._emit('stateChanged');
    return { ok: true };
  }

  // ----- 酒 -----
  useWine(cardIdx) {
    const p = this.cur;
    if (p.hasUsedWine) return { ok: false, msg: '本回合已使用过酒' };
    const card = p.removeCard(cardIdx);
    this.deck.discard(card);
    p.wineBuff = true; p.hasUsedWine = true;
    if (p.hp <= 0) { p.hp = Math.min(p.hp + 1, p.maxHp); this.log(`${p.name} 使用了【酒】自救`); }
    else { this.log(`${p.name} 使用了【酒】`); }
    this._emit('stateChanged');
    return { ok: true };
  }

  // ----- 锦囊牌 -----
  useTrick(cardIdx, targetIdx) {
    const p = this.cur;
    const card = p.hand[cardIdx];
    switch (card.subtype) {
      case 'wuZhongShengYou': return this.useWuZhong(cardIdx);
      case 'guoHeChaiQiao': return this.useGuoHe(cardIdx, targetIdx);
      case 'shunShouQianYang': return this.useShunShou(cardIdx, targetIdx);
      case 'leBuSiShu': return this.useLeBu(cardIdx, targetIdx);
      case 'taoYuanJieYi': return this.useTaoYuan(cardIdx);
      case 'nanManRuQin': return this.useNanMan(cardIdx);
      case 'wanJianQiFa': return this.useWanJian(cardIdx);
      case 'jueDou': return this.useJueDou(cardIdx, targetIdx);
      case 'wuXieKeJi': return { ok: false, msg: '无懈可击需在锦囊生效时使用' };
      case 'huoGong': return this.useHuoGong(cardIdx, targetIdx);
      case 'tieSuoLianHuan': return this.useTieSuo(cardIdx, targetIdx);
      case 'jieDaoShaRen': return this.useJieDao(cardIdx, targetIdx);
      case 'shanDian': return this.useShanDian(cardIdx, targetIdx);
      case 'bingLiangCunDuan': return this.useBingLiang(cardIdx, targetIdx);
      default: return { ok: false, msg: `锦囊【${card.name}】暂未实现` };
    }
  }

  useWuZhong(cardIdx) {
    const p = this.cur;
    const card = p.removeCard(cardIdx);
    this.deck.discard(card);
    if (this._checkWuXie(p, '无中生有')) return { ok: true };
    const drawn = this.deck.draw(2);
    p.addCards(drawn);
    this.log(`${p.name} 使用了【无中生有】，摸了2张牌`);
    // 黄月英集智
    this._triggerJiZhi(p);
    this._emit('stateChanged');
    return { ok: true };
  }

  useGuoHe(cardIdx, targetIdx) {
    const target = this.players[targetIdx];
    if (!target || !target.alive || targetIdx === this.currentIdx) return { ok: false, msg: '无效目标' };
    const p = this.cur;
    const card = p.removeCard(cardIdx);
    this.deck.discard(card);
    if (this._checkWuXie(p, '过河拆桥')) return { ok: true };
    // 陆逊谦逊检查
    if (target.hasTargetRestriction('guoHeChaiQiao')) {
      this.log(`${target.name} 【谦逊】不能成为过河拆桥的目标`);
      this._emit('stateChanged');
      return { ok: true };
    }
    // 弃置目标一张牌（手牌或装备随机）
    const allCards = [...target.hand];
    if (target.equipment.weapon) allCards.push(target.equipment.weapon);
    if (target.equipment.armor) allCards.push(target.equipment.armor);
    if (target.equipment.defHorse) allCards.push(target.equipment.defHorse);
    if (target.equipment.atkHorse) allCards.push(target.equipment.atkHorse);
    if (allCards.length > 0) {
      const randIdx = Math.floor(Math.random() * allCards.length);
      const chosen = allCards[randIdx];
      // 从手牌移除
      const handIdx = target.hand.indexOf(chosen);
      if (handIdx !== -1) { target.removeCard(handIdx); }
      // 从装备移除
      else {
        for (const slot of Object.keys(target.equipment)) {
          if (target.equipment[slot] === chosen) { delete target.equipment[slot]; break; }
        }
      }
      this.deck.discard(chosen);
      this.log(`${p.name} 对 ${target.name} 使用了【过河拆桥】，弃置了一张牌`);
    }
    this._triggerJiZhi(p);
    this._emit('stateChanged');
    return { ok: true };
  }

  useShunShou(cardIdx, targetIdx) {
    const target = this.players[targetIdx];
    if (!target || !target.alive || targetIdx === this.currentIdx) return { ok: false, msg: '无效目标' };
    // 距离检查：顺手牵羊距离为1
    if (this.calcDistance(this.currentIdx, targetIdx) > 1) return { ok: false, msg: '目标不在距离1以内' };
    const p = this.cur;
    if (target.hasTargetRestriction('shunShouQianYang')) {
      this.log(`${target.name} 【谦逊】不能成为顺手牵羊的目标`);
      return { ok: false, msg: '目标不可选' };
    }
    const card = p.removeCard(cardIdx);
    this.deck.discard(card);
    if (this._checkWuXie(p, '顺手牵羊')) return { ok: true };
    const allCards = [...target.hand];
    for (const slot of Object.keys(target.equipment)) { if (target.equipment[slot]) allCards.push(target.equipment[slot]); }
    if (allCards.length > 0) {
      const randIdx = Math.floor(Math.random() * allCards.length);
      const chosen = allCards[randIdx];
      const handIdx = target.hand.indexOf(chosen);
      if (handIdx !== -1) { target.removeCard(handIdx); }
      else { for (const slot of Object.keys(target.equipment)) { if (target.equipment[slot] === chosen) { delete target.equipment[slot]; break; } } }
      p.hand.push(chosen);
      this.log(`${p.name} 对 ${target.name} 使用了【顺手牵羊】，获得了一张【${chosen.name}】`);
    }
    this._triggerJiZhi(p);
    this._emit('stateChanged');
    return { ok: true };
  }

  useLeBu(cardIdx, targetIdx) {
    const target = this.players[targetIdx];
    if (!target || !target.alive || targetIdx === this.currentIdx) return { ok: false, msg: '无效目标' };
    if (target.hasTargetRestriction('leBuSiShu')) return { ok: false, msg: '谦逊：不能成为乐不思蜀的目标' };
    // 同名延时锦囊不能重复
    if (target.judgments.some(c => c.subtype === 'leBuSiShu')) return { ok: false, msg: '该角色判定区已有【乐不思蜀】' };
    const p = this.cur;
    const card = p.hand[cardIdx];
    if (card.subtype !== 'leBuSiShu') {
      if (!(p.hero && p.hero.skillId === 'guoSe' && card.suit === SUIT.DIAMOND)) return { ok: false, msg: '不是乐不思蜀' };
    }
    p.removeCard(cardIdx);
    target.judgments.push(card);
    this.log(`${p.name} 对 ${target.name} 使用了【乐不思蜀】`);
    this._emit('stateChanged');
    return { ok: true };
  }

  useTaoYuan(cardIdx) {
    const p = this.cur;
    const card = p.removeCard(cardIdx);
    this.deck.discard(card);
    this.log(`${p.name} 使用了【桃园结义】`);
    this._triggerJiZhi(p);
    this._emit('stateChanged');
    // 逐目标结算，每个目标检查无懈可击
    const targets = this.players.filter(t => t.alive && t.hp < t.maxHp).map(t => this.players.indexOf(t));
    this._resolveTaoYuan(targets, 0);
    return { ok: true };
  }

  _resolveTaoYuan(targetIndices, index) {
    if (index >= targetIndices.length) {
      if (this.waitingFor === null && this.status === 'playing') {
        this.waitingFor = 'play'; this.waitingPlayerId = this.cur.id; this._emit('stateChanged');
      }
      return;
    }
    const targetIdx = targetIndices[index];
    const target = this.players[targetIdx];
    if (!target || !target.alive) { this._resolveTaoYuan(targetIndices, index + 1); return; }
    if (this._checkWuXie(this.cur, '桃园结义')) {
      this.log(`${target.name} 的桃园结义被【无懈可击】抵消`);
      this.delayed(() => this._resolveTaoYuan(targetIndices, index + 1));
      return;
    }
    target.hp = Math.min(target.hp + 1, target.maxHp);
    this.log(`${target.name} 回复1点体力`);
    this._emit('stateChanged');
    this.delayed(() => this._resolveTaoYuan(targetIndices, index + 1));
  }

  // 南蛮入侵：所有其他角色需出【杀】，否则受1伤害
  useNanMan(cardIdx) {
    const p = this.cur;
    const card = p.removeCard(cardIdx);
    this.deck.discard(card);
    this.log(`${p.name} 使用了【南蛮入侵】`);
    this._triggerJiZhi(p);
    this._emit('stateChanged');
    const targets = this.players.filter(t => t.alive && t.id !== p.id).map(t => this.players.indexOf(t));
    this._resolveTrickChain(targets, 0, 'strike', 1, '南蛮入侵');
    return { ok: true };
  }

  useWanJian(cardIdx) {
    const p = this.cur;
    const card = p.removeCard(cardIdx);
    this.deck.discard(card);
    this.log(`${p.name} 使用了【万箭齐发】`);
    this._triggerJiZhi(p);
    this._emit('stateChanged');
    const targets = this.players.filter(t => t.alive && t.id !== p.id).map(t => this.players.indexOf(t));
    this._resolveTrickChain(targets, 0, 'dodge', 1, '万箭齐发');
    return { ok: true };
  }

  // 锦囊连锁结算：依次询问每个目标，每个目标单独检查无懈可击
  _resolveTrickChain(targetIndices, index, responseType, damage, trickName) {
    if (index >= targetIndices.length) {
      // 所有目标处理完毕，恢复出牌等待
      if (this.waitingFor === null && this.status === 'playing') {
        this.waitingFor = 'play';
        this.waitingPlayerId = this.cur.id;
        this._emit('stateChanged');
      }
      return;
    }
    const targetIdx = targetIndices[index];
    const target = this.players[targetIdx];
    if (!target || !target.alive) { this._resolveTrickChain(targetIndices, index + 1, responseType, damage, trickName); return; }

    // 每个目标单独检查无懈可击
    if (trickName && this._checkWuXie(this.cur, trickName)) {
      this.log(`${target.name} 的${trickName}被【无懈可击】抵消`);
      this.delayed(() => this._resolveTrickChain(targetIndices, index + 1, responseType, damage, trickName));
      return;
    }

    const savedWaitingPlayerId = this.waitingPlayerId;
    const hasCard = target.hand.some(c => {
      if (c.subtype === responseType) return true;
      if (responseType === 'dodge' && c.subtype === 'strike' && target.hero && target.hero.skillId === 'longDan') return true;
      if (responseType === 'strike' && c.subtype === 'dodge' && target.hero && target.hero.skillId === 'longDan') return true;
      if (responseType === 'dodge' && (c.suit === SUIT.SPADE || c.suit === SUIT.CLUB) && target.hero && target.hero.skillId === 'qingGuo') return true;
      return false;
    });

    // 继续处理下一个目标的回调（伤害结算后再继续）
    const continueChain = () => {
      this._resolveTrickChain(targetIndices, index + 1, responseType, damage, trickName);
    };
    // 造成伤害后，如果有死亡求桃，等求桃结束再继续
    const dealAndContinue = () => {
      const target = this.players[targetIdx];
      if (!target || !target.alive) { continueChain(); return; }
      // 设置死亡后回调，用于在求桃链结束后继续锦囊链
      this._onDeathResolved = continueChain;
      this.dealDamage(this.currentIdx, targetIdx, damage);
      // 如果没有触发死亡（hp>0），直接继续
      if (target.hp > 0) {
        this._onDeathResolved = null;
        continueChain();
      }
    };

    if (hasCard) {
      const label = responseType === 'strike' ? '杀' : '闪';
      this.waitingFor = 'response';
      this.pendingResponse = {
        playerId: target.id, type: responseType,
        onUse: () => {
          this.log(`${target.name} 使用了【${label}】`);
          continueChain();
        },
        onPass: () => {
          dealAndContinue();
        },
      };
      this._emit('stateChanged');
      this._emit('awaitResponse', { playerId: target.id, type: responseType, label: `请使用【${label}】` });
    } else {
      this.delayed(() => dealAndContinue());
    }
  }

  // 决斗：双方交替出【杀】，无法出者受1伤害
  useJueDou(cardIdx, targetIdx) {
    const target = this.players[targetIdx];
    if (!target || !target.alive || targetIdx === this.currentIdx) return { ok: false, msg: '无效目标' };
    const p = this.cur;
    const card = p.removeCard(cardIdx);
    this.deck.discard(card);
    // 裸衣buff：决斗伤害+1
    const jueDouDamage = 1 + (p.luoYiBuff ? 1 : 0);
    p.luoYiBuff = false; p.wineBuff = false;
    this.log(`${p.name} 对 ${target.name} 使用了【决斗】`);
    this._triggerJiZhi(p);
    this._emit('stateChanged');
    if (this._checkWuXie(p, '决斗')) return { ok: true };
    // 目标先出杀
    this._resolveJueDou(targetIdx, this.currentIdx, jueDouDamage);
    return { ok: true };
  }

  _resolveJueDou(defenderIdx, attackerIdx, damage) {
    damage = damage || 1;
    const defender = this.players[defenderIdx];
    const attacker = this.players[attackerIdx];
    if (!defender || !defender.alive) { this._restorePlayState(); return; }
    if (!attacker || !attacker.alive) { this._restorePlayState(); return; }

    // 无双检查：与吕布决斗的角色每次需出两张杀
    const attackerHasWuShuang = attacker.hero && attacker.hero.skillId === 'wuShuang';
    const defenderHasWuShuang = defender.hero && defender.hero.skillId === 'wuShuang';
    // 当前defender需要出杀，检查对手是否有无双
    const needsTwoStrikes = attackerHasWuShuang;

    const hasStrike = defender.hand.some(c => {
      if (c.subtype === 'strike') return true;
      if (c.suit === SUIT.HEART || c.suit === SUIT.DIAMOND) {
        if (defender.hero && defender.hero.skillId === 'wuSheng') return true;
      }
      if (c.subtype === 'dodge' && defender.hero && defender.hero.skillId === 'longDan') return true;
      return false;
    });

    if (hasStrike) {
      this.waitingFor = 'response';
      this.pendingResponse = {
        playerId: defender.id, type: 'strike',
        onUse: () => {
          this.log(`${defender.name} 出了【杀】`);
          if (needsTwoStrikes) {
            // 无双：需要再出一张杀
            const hasMoreStrike = defender.hand.some(c => {
              if (c.subtype === 'strike') return true;
              if (c.suit === SUIT.HEART || c.suit === SUIT.DIAMOND) {
                if (defender.hero && defender.hero.skillId === 'wuSheng') return true;
              }
              if (c.subtype === 'dodge' && defender.hero && defender.hero.skillId === 'longDan') return true;
              return false;
            });
            if (hasMoreStrike) {
              this.waitingFor = 'response';
              this.pendingResponse = {
                playerId: defender.id, type: 'strike',
                onUse: () => { this.log(`${defender.name} 出了第二张【杀】`); this._resolveJueDou(attackerIdx, defenderIdx, damage); },
                onPass: () => { this.dealDamage(attackerIdx, defenderIdx, damage); this._restorePlayState(); },
              };
              this._emit('stateChanged');
              this._emit('awaitResponse', { playerId: defender.id, type: 'strike', label: '【无双】需再出一张【杀】' });
            } else {
              this.dealDamage(attackerIdx, defenderIdx, damage);
              this._restorePlayState();
            }
          } else {
            this._resolveJueDou(attackerIdx, defenderIdx, damage);
          }
        },
        onPass: () => { this.dealDamage(attackerIdx, defenderIdx, damage); this._restorePlayState(); },
      };
      this._emit('stateChanged');
      const label = needsTwoStrikes ? '决斗中，【无双】需出两张【杀】，请出第一张' : '决斗中，请出【杀】';
      this._emit('awaitResponse', { playerId: defender.id, type: 'strike', label });
    } else {
      this.delayed(() => { this.dealDamage(attackerIdx, defenderIdx, damage); this._restorePlayState(); });
    }
  }

  _restorePlayState() {
    this._busy = false;
    // 如果有死亡后回调（锦囊链等待中），先执行
    if (this._onDeathResolved) {
      const cb = this._onDeathResolved;
      this._onDeathResolved = null;
      cb();
      return;
    }
    // 当前玩家已死亡，跳过出牌阶段
    if (!this.cur.alive) {
      this.nextPhase();
      return;
    }
    // 只在出牌阶段且当前没有等待状态时恢复
    if (this.waitingFor === null && this.status === 'playing' && this.phase === 'play') {
      this.waitingFor = 'play';
      this.waitingPlayerId = this.cur.id;
      this._emit('stateChanged');
      this._emit('awaitPlay', { playerId: this.cur.id });
    }
  }

  // 火攻：目标展示一张手牌，你弃一张同花色牌，目标受1火焰伤害
  useHuoGong(cardIdx, targetIdx) {
    const target = this.players[targetIdx];
    if (!target || !target.alive || targetIdx === this.currentIdx) return { ok: false, msg: '无效目标' };
    const p = this.cur;
    const card = p.removeCard(cardIdx);
    this.deck.discard(card);
    if (this._checkWuXie(p, '火攻')) return { ok: true };
    if (target.hand.length === 0) { this.log(`${target.name} 没有手牌，火攻无效`); this._emit('stateChanged'); return { ok: true }; }
    // 随机展示一张手牌
    const shown = target.hand[Math.floor(Math.random() * target.hand.length)];
    this.log(`${target.name} 展示了【${shown.name}】(${SUIT_SYMBOL[shown.suit]})`);
    // 弃一张同花色牌
    const discardIdx = p.hand.findIndex(c => c.suit === shown.suit && c.uid !== card.uid);
    if (discardIdx !== -1) {
      const disc = p.removeCard(discardIdx);
      this.deck.discard(disc);
      this.dealDamage(this.currentIdx, targetIdx, 1, 'fire');
      this.log(`${p.name} 弃置了一张${SUIT_NAME[shown.suit]}牌，${target.name} 受到1点火焰伤害`);
    } else {
      this.log(`${p.name} 没有同花色牌，火攻无效`);
    }
    this._triggerJiZhi(p);
    this._emit('stateChanged');
    return { ok: true };
  }

  // 铁索连环：选择1-2名角色横置/重置
  useTieSuo(cardIdx, targetIdx) {
    const p = this.cur;
    const card = p.removeCard(cardIdx);
    this.deck.discard(card);
    if (targetIdx !== undefined && targetIdx !== null) {
      const target = this.players[targetIdx];
      if (target && target.alive) {
        target.chained = !target.chained;
        this.log(`${target.name} ${target.chained ? '被连环' : '解除连环'}`);
      }
    }
    this._triggerJiZhi(p);
    this._emit('stateChanged');
    return { ok: true };
  }

  // 借刀杀人：对有武器的其他角色使用，令其对攻击范围内的一名角色出【杀】，否则将武器交给你
  useJieDao(cardIdx, targetIdx) {
    // targetIdx = 有武器的角色
    const armed = this.players[targetIdx];
    if (!armed || !armed.alive || targetIdx === this.currentIdx) return { ok: false, msg: '无效目标' };
    if (!armed.equipment.weapon) return { ok: false, msg: '该角色没有武器' };
    const p = this.cur;
    const card = p.removeCard(cardIdx);
    this.deck.discard(card);
    this.log(`${p.name} 对 ${armed.name} 使用了【借刀杀人】`);
    this._triggerJiZhi(p);
    this._emit('stateChanged');
    if (this._checkWuXie(p, '借刀杀人')) return { ok: true };

    // 找armed攻击范围内的目标（排除armed自己和使用者）
    const armedIdx = targetIdx;
    const validAttackTargets = this.players
      .map((t, i) => ({ player: t, idx: i }))
      .filter(t => t.player.alive && t.idx !== armedIdx && t.idx !== this.currentIdx && this.canReach(armedIdx, t.idx));

    if (validAttackTargets.length === 0) {
      // 没有合法攻击目标，直接交武器
      this.log(`${armed.name} 没有合法攻击目标，将武器交给 ${p.name}`);
      const wpn = armed.equipment.weapon;
      delete armed.equipment.weapon;
      p.hand.push(wpn);
      this._emit('stateChanged');
      return { ok: true };
    }

    // AI自动选择攻击目标（优先敌人，最低HP）
    const armedPlayer = armed;
    let bestTarget = validAttackTargets[0];
    for (const t of validAttackTargets) {
      if (armedPlayer.isEnemyOf(t.player) && (!armedPlayer.isEnemyOf(bestTarget.player) || t.player.hp < bestTarget.player.hp)) {
        bestTarget = t;
      }
    }
    const attackTargetIdx = bestTarget.idx;
    const attackTarget = this.players[attackTargetIdx];

    const strikeIdx = armed.findCard('strike');
    if (strikeIdx !== -1) {
      const strikeCard = armed.removeCard(strikeIdx);
      this.deck.discard(strikeCard);
      this.log(`${armed.name} 对 ${attackTarget.name} 使用了【杀】`);
      this.requestResponse(attackTargetIdx, 'dodge',
        () => this.dealDamage(armedIdx, attackTargetIdx, 1),
        () => this.log(`${attackTarget.name} 使用了【闪】`)
      );
    } else {
      this.log(`${armed.name} 没有【杀】，将武器交给 ${p.name}`);
      const wpn = armed.equipment.weapon;
      delete armed.equipment.weapon;
      p.hand.push(wpn);
      this._emit('stateChanged');
    }
    return { ok: true };
  }

  // 闪电：延时锦囊，判定黑桃2-9受3雷电伤害，可对自己使用
  useShanDian(cardIdx, targetIdx) {
    const target = this.players[targetIdx];
    if (!target || !target.alive) return { ok: false, msg: '无效目标' };
    if (target.judgments.some(c => c.subtype === 'shanDian')) return { ok: false, msg: '该角色判定区已有【闪电】' };
    const p = this.cur;
    const card = p.removeCard(cardIdx);
    target.judgments.push(card);
    this.log(`${p.name} 对 ${target.name} 使用了【闪电】`);
    this._emit('stateChanged');
    return { ok: true };
  }

  // 兵粮寸断：延时锦囊，判定非梅花跳过摸牌
  useBingLiang(cardIdx, targetIdx) {
    const target = this.players[targetIdx];
    if (!target || !target.alive || targetIdx === this.currentIdx) return { ok: false, msg: '无效目标' };
    if (this.calcDistance(this.currentIdx, targetIdx) > 1) return { ok: false, msg: '目标不在距离1以内' };
    if (target.judgments.some(c => c.subtype === 'bingLiangCunDuan')) return { ok: false, msg: '该角色判定区已有【兵粮寸断】' };
    const p = this.cur;
    const card = p.removeCard(cardIdx);
    target.judgments.push(card);
    this.log(`${p.name} 对 ${target.name} 使用了【兵粮寸断】`);
    this._emit('stateChanged');
    return { ok: true };
  }

  // 无懈可击检查：支持连锁（无懈可击可以反制无懈可击）
  _checkWuXie(caster, trickName, isCounterWuXie) {
    // 按顺序检查每个玩家是否有无懈可击
    for (let i = 0; i < this.players.length; i++) {
      const idx = (this.players.indexOf(caster) + 1 + i) % this.players.length;
      const p = this.players[idx];
      if (!p.alive) continue;
      const wuXieIdx = p.findCard('wuXieKeJi');
      if (wuXieIdx !== -1) {
        // AI 决策：敌人的锦囊/无懈可击都要反制
        const shouldUse = p.isEnemyOf(caster);
        if (shouldUse) {
          const card = p.removeCard(wuXieIdx);
          this.deck.discard(card);
          this.log(`${p.name} 使用了【无懈可击】`);
          this._emit('stateChanged');
          // 检查是否有人反制这张无懈可击
          const countered = this._checkWuXie(p, '无懈可击', true);
          if (countered) {
            // 无懈可击被反制，原锦囊继续生效
            return false;
          }
          return true;
        }
      }
    }
    return false;
  }

  // 检查玩家是否有可用的闪（包括转换技能）
  _hasDodgeCard(p) {
    return p.hand.some(c => {
      if (c.subtype === 'dodge') return true;
      if (c.subtype === 'strike' && p.hero && p.hero.skillId === 'longDan') return true;
      if ((c.suit === SUIT.SPADE || c.suit === SUIT.CLUB) && p.hero && p.hero.skillId === 'qingGuo') return true;
      return false;
    });
  }

  // 黄月英集智
  _triggerJiZhi(p) {
    if (p.hero && p.hero.skillId === 'jiZhi') {
      const drawn = this.deck.draw(1);
      p.addCards(drawn);
      this.log(`${p.name} 【集智】摸了1张牌`);
    }
  }

  // ----- 技能系统 -----
  useSkill(playerId, skillId, data) {
    const p = this.players.find(x => x.id === playerId);
    if (!p || !p.alive) return { ok: false, msg: '无效玩家' };
    if (this.waitingFor !== 'play' || this.waitingPlayerId !== playerId) return { ok: false, msg: '不是出牌阶段' };
    switch (skillId) {
      case 'renDe': return this.useRenDe(playerId, data);
      case 'wuSheng': return this.useWuSheng(playerId, data);
      case 'zhiHeng': return this.useZhiHeng(playerId, data);
      case 'longDan': return this.useLongDanStrike(playerId, data);
      case 'qiXi': return this.useQiXi(playerId, data);
      case 'kuRou': return this.useKuRou(playerId);
      case 'luoYi': return this.useLuoYi(playerId);
      case 'fanJian': return this.useFanJian(playerId, data);
      case 'guoSe': return this.useGuoSe(playerId, data);
      case 'jieYin': return this.useJieYin(playerId, data);
      case 'liJian': return this.useLiJian(playerId, data);
      case 'qiangXi': return this.useQiangXi(playerId, data);
      case 'juShou': return this.useJuShou(playerId);
      case 'shenSu': return this.useShenSu(playerId, data);
      case 'tianYi': return this.useTianYi(playerId, data);
      case 'tiaoXin': return this.useTiaoXin(playerId, data);
      case 'fangQuan': return this.useFangQuan(playerId, data);
      case 'quHu': return this.useQuHu(playerId, data);
      case 'luanJi': return this.useLuanJi(playerId, data);
      case 'huoJi': return this.useHuoJi(playerId, data);
      case 'lianHuan': return this.useLianHuan(playerId, data);
      case 'duanLiang': return this.useDuanLiang(playerId, data);
      case 'jiuChi': return this.useJiuChi(playerId, data);
      case 'yingHun': return this.useYingHun(playerId, data);
      case 'zhiJian': return this.useZhiJian(playerId, data);
      case 'mingCe': return this.useMingCe(playerId, data);
      case 'qiCe': return this.useQiCe(playerId);
      default: return { ok: false, msg: '未知技能' };
    }
  }

  useRenDe(playerId, data) {
    const p = this.players.find(x => x.id === playerId);
    if (!p.hero || p.hero.skillId !== 'renDe') return { ok: false };
    if (p.skillsUsed.renDe) return { ok: false, msg: '仁德每阶段限一次' };
    const { cardIndices, targetIdx } = data;
    if (!cardIndices || cardIndices.length === 0) return { ok: false, msg: '未选择牌' };
    const target = this.players[targetIdx];
    if (!target || !target.alive || targetIdx === this.players.indexOf(p)) return { ok: false, msg: '无效目标' };
    const sorted = [...cardIndices].sort((a, b) => b - a);
    const cards = [];
    for (const idx of sorted) { const card = p.removeCard(idx); if (card) cards.push(card); }
    target.addCards(cards);
    p.skillsUsed.renDe = true;
    // 给出不少于2张则回复体力
    if (cards.length >= 2 && p.hp < p.maxHp) {
      p.hp = Math.min(p.hp + 1, p.maxHp);
      this.log(`${p.name} 发动【仁德】，将 ${cards.length} 张牌交给 ${target.name}，回复1点体力`);
    } else {
      this.log(`${p.name} 发动【仁德】，将 ${cards.length} 张牌交给 ${target.name}`);
    }
    this._emit('stateChanged');
    return { ok: true };
  }

  useWuSheng(playerId, data) {
    const p = this.players.find(x => x.id === playerId);
    if (!p.hero || p.hero.skillId !== 'wuSheng') return { ok: false };
    if (p.hasUsedStrike) return { ok: false, msg: '已出过杀' };
    const { cardIdx, targetIdx } = data;
    if (cardIdx < 0 || cardIdx >= p.hand.length) return { ok: false };
    const card = p.hand[cardIdx];
    if (card.suit !== SUIT.HEART && card.suit !== SUIT.DIAMOND) return { ok: false, msg: '不是红色牌' };
    if (!this.players[targetIdx] || !this.players[targetIdx].alive || targetIdx === this.players.indexOf(p)) return { ok: false, msg: '无效目标' };
    if (!this.canReach(this.players.indexOf(p), targetIdx)) return { ok: false, msg: '目标不在攻击范围内' };
    p.removeCard(cardIdx); this.deck.discard(card);
    p.hasUsedStrike = true; p.keJiUsedStrike = true;
    const damage = (p.wineBuff ? 2 : 1) + (p.luoYiBuff ? 1 : 0);
    p.wineBuff = false; p.luoYiBuff = false;
    this.log(`${p.name} 发动【武圣】，将【${card.name}】当【杀】使用`);
    this._emit('stateChanged');
    this.requestResponse(targetIdx, 'dodge',
      () => this.dealDamage(this.players.indexOf(p), targetIdx, damage),
      () => this.log(`${this.players[targetIdx].name} 使用了【闪】`)
    );
    return { ok: true };
  }

  useLongDanStrike(playerId, data) {
    const p = this.players.find(x => x.id === playerId);
    if (!p.hero || p.hero.skillId !== 'longDan') return { ok: false };
    if (p.hasUsedStrike) return { ok: false, msg: '已出过杀' };
    const { cardIdx, targetIdx } = data;
    if (cardIdx < 0 || cardIdx >= p.hand.length) return { ok: false };
    const card = p.hand[cardIdx];
    if (card.subtype !== 'dodge') return { ok: false, msg: '不是闪' };
    if (!this.players[targetIdx] || !this.players[targetIdx].alive || targetIdx === this.players.indexOf(p)) return { ok: false, msg: '无效目标' };
    if (!this.canReach(this.players.indexOf(p), targetIdx)) return { ok: false, msg: '目标不在攻击范围内' };
    p.removeCard(cardIdx); this.deck.discard(card);
    p.hasUsedStrike = true; p.keJiUsedStrike = true;
    const damage = (p.wineBuff ? 2 : 1) + (p.luoYiBuff ? 1 : 0);
    p.wineBuff = false; p.luoYiBuff = false;
    this.log(`${p.name} 发动【龙胆】，将【闪】当【杀】使用`);
    this._emit('stateChanged');
    this.requestResponse(targetIdx, 'dodge',
      () => this.dealDamage(this.players.indexOf(p), targetIdx, damage),
      () => this.log(`${this.players[targetIdx].name} 使用了【闪】`)
    );
    return { ok: true };
  }

  useZhiHeng(playerId, data) {
    const p = this.players.find(x => x.id === playerId);
    if (!p.hero || p.hero.skillId !== 'zhiHeng') return { ok: false };
    if (p.skillsUsed.zhiHeng) return { ok: false, msg: '制衡每阶段限一次' };
    const { cardIndices } = data;
    if (!cardIndices || cardIndices.length === 0) return { ok: false, msg: '未选择牌' };
    const sorted = [...cardIndices].sort((a, b) => b - a);
    for (const idx of sorted) { const card = p.removeCard(idx); if (card) this.deck.discard(card); }
    const drawn = this.deck.draw(cardIndices.length);
    p.addCards(drawn);
    p.skillsUsed.zhiHeng = true;
    this.log(`${p.name} 发动【制衡】，弃 ${cardIndices.length} 张牌摸 ${drawn.length} 张`);
    this._emit('stateChanged');
    return { ok: true };
  }

  useQiXi(playerId, data) {
    const p = this.players.find(x => x.id === playerId);
    if (!p.hero || p.hero.skillId !== 'qiXi') return { ok: false };
    const { cardIdx, targetIdx } = data;
    if (cardIdx < 0 || cardIdx >= p.hand.length) return { ok: false };
    const card = p.hand[cardIdx];
    if (card.suit !== SUIT.SPADE && card.suit !== SUIT.CLUB) return { ok: false, msg: '不是黑色牌' };
    const target = this.players[targetIdx];
    if (!target || !target.alive || targetIdx === this.players.indexOf(p)) return { ok: false, msg: '无效目标' };
    p.removeCard(cardIdx); this.deck.discard(card);
    // 过河拆桥效果
    const allCards = [...target.hand];
    for (const slot of Object.keys(target.equipment)) { if (target.equipment[slot]) allCards.push(target.equipment[slot]); }
    if (allCards.length > 0) {
      const randIdx = Math.floor(Math.random() * allCards.length);
      const chosen = allCards[randIdx];
      const handIdx = target.hand.indexOf(chosen);
      if (handIdx !== -1) { target.removeCard(handIdx); }
      else { for (const slot of Object.keys(target.equipment)) { if (target.equipment[slot] === chosen) { delete target.equipment[slot]; break; } } }
      this.deck.discard(chosen);
    }
    this.log(`${p.name} 发动【奇袭】，将一张黑色牌当【过河拆桥】对 ${target.name} 使用`);
    this._emit('stateChanged');
    return { ok: true };
  }

  useKuRou(playerId) {
    const p = this.players.find(x => x.id === playerId);
    if (!p.hero || p.hero.skillId !== 'kuRou') return { ok: false };
    // 官方规则：苦肉无次数限制
    p.hp -= 1;
    this.log(`${p.name} 发动【苦肉】，失去1点体力 (HP:${p.hp}/${p.maxHp})`);
    const drawn = this.deck.draw(2);
    p.addCards(drawn);
    this.log(`${p.name} 摸了2张牌`);
    this._emit('stateChanged');
    if (p.hp <= 0) this.checkDeath(this.players.indexOf(p), this.players.indexOf(p));
    return { ok: true };
  }

  useLuoYi(playerId) {
    // 裸衣现在在摸牌阶段自动触发
    return { ok: false, msg: '裸衣在摸牌阶段自动发动' };
  }

  useFanJian(playerId, data) {
    const p = this.players.find(x => x.id === playerId);
    if (!p.hero || p.hero.skillId !== 'fanJian') return { ok: false };
    if (p.skillsUsed.fanJian) return { ok: false, msg: '反间每阶段限一次' };
    if (p.hand.length === 0) return { ok: false, msg: '没有手牌' };
    const { targetIdx } = data;
    const target = this.players[targetIdx];
    if (!target || !target.alive || targetIdx === this.players.indexOf(p)) return { ok: false, msg: '无效目标' };
    p.skillsUsed.fanJian = true;
    // 随机展示一张手牌
    const cardIdx = Math.floor(Math.random() * p.hand.length);
    const shownCard = p.removeCard(cardIdx);
    // 目标选择花色（AI随机选，人类通过客户端选择）
    const guessedSuit = data.guessedSuit !== undefined ? data.guessedSuit : Math.floor(Math.random() * 4);
    // 目标获得此牌
    target.hand.push(shownCard);
    if (shownCard.suit !== guessedSuit) {
      this.dealDamage(this.players.indexOf(p), targetIdx, 1);
      this.log(`${p.name} 发动【反间】，${target.name} 猜${SUIT_NAME[guessedSuit]}，实际是${SUIT_NAME[shownCard.suit]}，受到1点伤害`);
    } else {
      this.log(`${p.name} 发动【反间】，${target.name} 猜${SUIT_NAME[guessedSuit]}，猜对了`);
    }
    this._emit('stateChanged');
    return { ok: true };
  }

  useGuoSe(playerId, data) {
    const p = this.players.find(x => x.id === playerId);
    if (!p.hero || p.hero.skillId !== 'guoSe') return { ok: false };
    const { cardIdx, targetIdx } = data;
    if (cardIdx < 0 || cardIdx >= p.hand.length) return { ok: false };
    const card = p.hand[cardIdx];
    if (card.suit !== SUIT.DIAMOND) return { ok: false, msg: '不是方块牌' };
    const target = this.players[targetIdx];
    if (!target || !target.alive || targetIdx === this.players.indexOf(p)) return { ok: false, msg: '无效目标' };
    if (target.hasTargetRestriction('leBuSiShu')) return { ok: false, msg: '谦逊：不能成为乐不思蜀的目标' };
    if (target.judgments.some(c => c.subtype === 'leBuSiShu')) return { ok: false, msg: '该角色判定区已有【乐不思蜀】' };
    p.removeCard(cardIdx);
    target.judgments.push(card);
    this.log(`${p.name} 发动【国色】，将一张方块牌当【乐不思蜀】对 ${target.name} 使用`);
    this._emit('stateChanged');
    return { ok: true };
  }

  useJieYin(playerId, data) {
    const p = this.players.find(x => x.id === playerId);
    if (!p.hero || p.hero.skillId !== 'jieYin') return { ok: false };
    if (p.skillsUsed.jieYin) return { ok: false, msg: '结姻每阶段限一次' };
    if (p.hand.length < 2) return { ok: false, msg: '手牌不足' };
    const { cardIndices, targetIdx } = data;
    if (!cardIndices || cardIndices.length !== 2) return { ok: false, msg: '需弃两张牌' };
    const target = this.players[targetIdx];
    if (!target || !target.alive || target.hp >= target.maxHp) return { ok: false, msg: '目标未受伤' };
    // 结姻要求目标为男性角色
    if (!target.hero || target.hero.gender !== 'male') return { ok: false, msg: '目标不是男性角色' }
    const sorted = [...cardIndices].sort((a, b) => b - a);
    for (const idx of sorted) { const card = p.removeCard(idx); if (card) this.deck.discard(card); }
    p.hp = Math.min(p.hp + 1, p.maxHp);
    target.hp = Math.min(target.hp + 1, target.maxHp);
    p.skillsUsed.jieYin = true;
    this.log(`${p.name} 发动【结姻】，与 ${target.name} 各回复1点体力`);
    this._emit('stateChanged');
    return { ok: true };
  }

  useLiJian(playerId, data) {
    const p = this.players.find(x => x.id === playerId);
    if (!p.hero || p.hero.skillId !== 'liJian') return { ok: false };
    if (p.skillsUsed.liJian) return { ok: false, msg: '离间每阶段限一次' };
    if (p.hand.length === 0) return { ok: false, msg: '没有手牌' };
    const { cardIdx, fromIdx, toIdx } = data;
    const from = this.players[fromIdx];
    const to = this.players[toIdx];
    if (!from || !from.alive || !to || !to.alive) return { ok: false, msg: '无效目标' };
    if (fromIdx === toIdx) return { ok: false, msg: '不能选择同一人' };
    // 离间要求两名目标均为男性角色
    if (!from.hero || from.hero.gender !== 'male') return { ok: false, msg: `${from.name} 不是男性角色` };
    if (!to.hero || to.hero.gender !== 'male') return { ok: false, msg: `${to.name} 不是男性角色` };
    const card = p.removeCard(cardIdx !== undefined ? cardIdx : 0);
    if (card) this.deck.discard(card);
    p.skillsUsed.liJian = true;
    this.log(`${p.name} 发动【离间】，令 ${from.name} 对 ${to.name} 使用【杀】`);
    // 令from对to使用杀
    const strikeIdx = from.findCard('strike');
    if (strikeIdx !== -1) {
      const strikeCard = from.removeCard(strikeIdx);
      this.deck.discard(strikeCard);
      this.log(`${from.name} 对 ${to.name} 使用了【杀】`);
      this.requestResponse(toIdx, 'dodge',
        () => this.dealDamage(fromIdx, toIdx, 1),
        () => this.log(`${to.name} 使用了【闪】`)
      );
    } else {
      this.log(`${from.name} 没有【杀】，受到${p.name}造成的1点伤害`);
      this.dealDamage(this.players.indexOf(p), fromIdx, 1);
    }
    this._emit('stateChanged');
    return { ok: true };
  }

  // ===== 新增武将技能 =====

  // 强袭：失去1体力或弃武器，对攻击范围内角色造成1伤害
  useQiangXi(playerId, data) {
    const p = this.players.find(x => x.id === playerId);
    if (!p.hero || p.hero.skillId !== 'qiangXi') return { ok: false };
    if (p.skillsUsed.qiangXi) return { ok: false, msg: '强袭每阶段限一次' };
    const { targetIdx, useWeapon } = data;
    const target = this.players[targetIdx];
    if (!target || !target.alive || targetIdx === this.players.indexOf(p)) return { ok: false, msg: '无效目标' };
    const srcIdx = this.players.indexOf(p);
    if (!this.canReach(srcIdx, targetIdx)) return { ok: false, msg: '目标不在攻击范围内' };
    if (useWeapon) {
      if (!p.equipment.weapon) return { ok: false, msg: '没有武器' };
      const wpn = p.equipment.weapon;
      delete p.equipment.weapon;
      this.deck.discard(wpn);
    } else {
      p.hp -= 1;
      this.log(`${p.name} 失去1点体力 (HP:${p.hp}/${p.maxHp})`);
    }
    p.skillsUsed.qiangXi = true;
    this.dealDamage(srcIdx, targetIdx, 1);
    this.log(`${p.name} 发动【强袭】，对 ${target.name} 造成1点伤害`);
    this._emit('stateChanged');
    if (p.hp <= 0) this.checkDeath(srcIdx, srcIdx);
    return { ok: true };
  }

  // 据守：摸3张牌，翻面
  useJuShou(playerId) {
    const p = this.players.find(x => x.id === playerId);
    if (!p.hero || p.hero.skillId !== 'juShou') return { ok: false };
    if (p.skillsUsed.juShou) return { ok: false, msg: '据守每阶段限一次' };
    p.skillsUsed.juShou = true;
    const drawn = this.deck.draw(3);
    p.addCards(drawn);
    this.log(`${p.name} 发动【据守】，摸3张牌`);
    this._emit('stateChanged');
    return { ok: true };
  }

  // 神速：跳过判定和摸牌，对一名角色出杀
  useShenSu(playerId, data) {
    const p = this.players.find(x => x.id === playerId);
    if (!p.hero || p.hero.skillId !== 'shenSu') return { ok: false };
    const { targetIdx } = data;
    const target = this.players[targetIdx];
    if (!target || !target.alive || targetIdx === this.players.indexOf(p)) return { ok: false, msg: '无效目标' };
    const srcIdx = this.players.indexOf(p);
    if (!this.canReach(srcIdx, targetIdx)) return { ok: false, msg: '目标不在攻击范围内' };
    // 跳过判定和摸牌阶段
    this.phase = PHASE.PLAY;
    this._emit('stateChanged');
    // 对目标出杀
    const strikeIdx = p.findCard('strike');
    if (strikeIdx === -1) return { ok: false, msg: '没有杀' };
    const strikeCard = p.removeCard(strikeIdx);
    this.deck.discard(strikeCard);
    p.hasUsedStrike = true;
    this.log(`${p.name} 发动【神速】，对 ${target.name} 使用【杀】`);
    this._emit('stateChanged');
    this.requestResponse(targetIdx, 'dodge',
      () => this.dealDamage(srcIdx, targetIdx, 1),
      () => this.log(`${target.name} 使用了【闪】`)
    );
    return { ok: true };
  }

  // 天义：拼点，赢了多出杀且无距离限制
  useTianYi(playerId, data) {
    const p = this.players.find(x => x.id === playerId);
    if (!p.hero || p.hero.skillId !== 'tianYi') return { ok: false };
    if (p.skillsUsed.tianYi) return { ok: false, msg: '天义每阶段限一次' };
    const { targetIdx } = data;
    const target = this.players[targetIdx];
    if (!target || !target.alive || targetIdx === this.players.indexOf(p)) return { ok: false, msg: '无效目标' };
    if (p.hand.length === 0 || target.hand.length === 0) return { ok: false, msg: '手牌不足' };
    // 拼点
    const myCard = p.hand[Math.floor(Math.random() * p.hand.length)];
    const theirCard = target.hand[Math.floor(Math.random() * target.hand.length)];
    this.log(`${p.name} 与 ${target.name} 拼点：${myCard.num} vs ${theirCard.num}`);
    const myVal = this._cardPoint(myCard);
    const theirVal = this._cardPoint(theirCard);
    p.skillsUsed.tianYi = true;
    if (myVal > theirVal) {
      p.tianYiBuff = true;
      this.log(`${p.name} 拼点赢了，本回合可多出杀且无距离限制`);
    } else {
      this.log(`${p.name} 拼点输了`);
    }
    this._emit('stateChanged');
    return { ok: true };
  }

  _cardPoint(card) {
    const n = card.num;
    if (n === 'A') return 1;
    if (n === 'J') return 11;
    if (n === 'Q') return 12;
    if (n === 'K') return 13;
    return parseInt(n) || 0;
  }

  // 挑衅：令攻击范围内的角色对你出杀，否则弃其一张牌
  useTiaoXin(playerId, data) {
    const p = this.players.find(x => x.id === playerId);
    if (!p.hero || p.hero.skillId !== 'tiaoXin') return { ok: false };
    if (p.skillsUsed.tiaoXin) return { ok: false, msg: '挑衅每阶段限一次' };
    const { targetIdx } = data;
    const target = this.players[targetIdx];
    if (!target || !target.alive || targetIdx === this.players.indexOf(p)) return { ok: false, msg: '无效目标' };
    const targetPlayerIdx = this.players.indexOf(p);
    if (!this.canReach(targetIdx, targetPlayerIdx)) return { ok: false, msg: '目标攻击范围内不包含你' };
    p.skillsUsed.tiaoXin = true;
    this.log(`${p.name} 发动【挑衅】，令 ${target.name} 对其使用【杀】`);
    const strikeIdx = target.findCard('strike');
    if (strikeIdx !== -1) {
      const card = target.removeCard(strikeIdx);
      this.deck.discard(card);
      this.log(`${target.name} 对 ${p.name} 使用了【杀】`);
      this.requestResponse(targetPlayerIdx, 'dodge',
        () => this.dealDamage(targetIdx, targetPlayerIdx, 1),
        () => this.log(`${p.name} 使用了【闪】`)
      );
    } else {
      if (target.hand.length > 0) {
        const ri = Math.floor(Math.random() * target.hand.length);
        const c = target.removeCard(ri);
        this.deck.discard(c);
        this.log(`${target.name} 没有【杀】，${p.name} 弃置了其一张牌`);
      }
    }
    this._emit('stateChanged');
    return { ok: true };
  }

  // 放权：跳过出牌阶段，回合结束时令其他角色额外回合
  useFangQuan(playerId, data) {
    const p = this.players.find(x => x.id === playerId);
    if (!p.hero || p.hero.skillId !== 'fangQuan') return { ok: false };
    if (p.skillsUsed.fangQuan) return { ok: false, msg: '放权每阶段限一次' };
    const { targetIdx } = data;
    const target = this.players[targetIdx];
    if (!target || !target.alive || targetIdx === this.players.indexOf(p)) return { ok: false, msg: '无效目标' };
    p.skillsUsed.fangQuan = true;
    this._fangQuanTarget = targetIdx;
    this.log(`${p.name} 发动【放权】，跳过出牌阶段`);
    this.phase = PHASE.DISCARD;
    this._emit('stateChanged');
    this.runPhase();
    return { ok: true };
  }

  // 驱虎：拼点，赢了令目标对其他人造成伤害
  useQuHu(playerId, data) {
    const p = this.players.find(x => x.id === playerId);
    if (!p.hero || p.hero.skillId !== 'quHu') return { ok: false };
    if (p.skillsUsed.quHu) return { ok: false, msg: '驱虎每阶段限一次' };
    const { targetIdx, damageTargetIdx } = data;
    const target = this.players[targetIdx];
    const damageTarget = this.players[damageTargetIdx];
    if (!target || !target.alive || target.hp <= p.hp) return { ok: false, msg: '目标体力值须大于你' };
    if (!damageTarget || !damageTarget.alive) return { ok: false, msg: '伤害目标无效' };
    if (p.hand.length === 0 || target.hand.length === 0) return { ok: false, msg: '手牌不足' };
    const myCard = p.hand[Math.floor(Math.random() * p.hand.length)];
    const theirCard = target.hand[Math.floor(Math.random() * target.hand.length)];
    this.log(`${p.name} 与 ${target.name} 拼点：${myCard.num} vs ${theirCard.num}`);
    const myVal = this._cardPoint(myCard);
    const theirVal = this._cardPoint(theirCard);
    p.skillsUsed.quHu = true;
    if (myVal > theirVal) {
      this.dealDamage(targetIdx, damageTargetIdx, 1);
      this.log(`${p.name} 【驱虎】成功，${target.name} 对 ${damageTarget.name} 造成1点伤害`);
    } else {
      this.dealDamage(targetIdx, this.players.indexOf(p), 1);
      this.log(`${p.name} 【驱虎】失败，${target.name} 对 ${p.name} 造成1点伤害`);
    }
    this._emit('stateChanged');
    return { ok: true };
  }

  // 乱击：两张同花色手牌当万箭齐发
  useLuanJi(playerId, data) {
    const p = this.players.find(x => x.id === playerId);
    if (!p.hero || p.hero.skillId !== 'luanJi') return { ok: false };
    const { cardIdx1, cardIdx2 } = data;
    if (cardIdx1 < 0 || cardIdx2 < 0 || cardIdx1 >= p.hand.length || cardIdx2 >= p.hand.length) return { ok: false, msg: '无效手牌' };
    if (cardIdx1 === cardIdx2) return { ok: false, msg: '不能选择同一张牌' };
    const c1 = p.hand[cardIdx1];
    const c2 = p.hand[cardIdx2];
    if (c1.suit !== c2.suit) return { ok: false, msg: '花色不同' };
    const idx1 = Math.max(cardIdx1, cardIdx2);
    const idx2 = Math.min(cardIdx1, cardIdx2);
    p.removeCard(idx1); p.removeCard(idx2);
    this.deck.discard(c1); this.deck.discard(c2);
    this.log(`${p.name} 发动【乱击】，将两张${SUIT_NAME[c1.suit]}牌当【万箭齐发】使用`);
    this._emit('stateChanged');
    if (this._checkWuXie(p, '万箭齐发')) return { ok: true };
    const targets = this.players.filter(t => t.alive && t.id !== p.id).map(t => this.players.indexOf(t));
    this._resolveTrickChain(targets, 0, 'dodge', 1, '万箭齐发');
    return { ok: true };
  }

  // 火计：红色手牌当火攻
  useHuoJi(playerId, data) {
    const p = this.players.find(x => x.id === playerId);
    if (!p.hero || p.hero.skillId !== 'huoJi') return { ok: false };
    const { cardIdx, targetIdx } = data;
    if (cardIdx < 0 || cardIdx >= p.hand.length) return { ok: false };
    const card = p.hand[cardIdx];
    if (card.suit !== SUIT.HEART && card.suit !== SUIT.DIAMOND) return { ok: false, msg: '不是红色牌' };
    const target = this.players[targetIdx];
    if (!target || !target.alive || targetIdx === this.players.indexOf(p)) return { ok: false, msg: '无效目标' };
    if (target.hand.length === 0) return { ok: false, msg: '目标没有手牌' };
    p.removeCard(cardIdx); this.deck.discard(card);
    this.log(`${p.name} 发动【火计】，将一张红色牌当【火攻】对 ${target.name} 使用`);
    this._emit('stateChanged');
    if (this._checkWuXie(p, '火攻')) return { ok: true };
    // 目标展示一张手牌
    const shown = target.hand[Math.floor(Math.random() * target.hand.length)];
    this.log(`${target.name} 展示了【${shown.name}】(${SUIT_SYMBOL[shown.suit]})`);
    // 弃同花色牌
    const discardIdx = p.hand.findIndex(c => c.suit === shown.suit);
    if (discardIdx !== -1) {
      const disc = p.removeCard(discardIdx);
      this.deck.discard(disc);
      this.dealDamage(this.players.indexOf(p), targetIdx, 1, 'fire');
      this.log(`${p.name} 弃置了一张${SUIT_NAME[shown.suit]}牌，${target.name} 受到1点火焰伤害`);
    } else {
      this.log(`${p.name} 没有同花色牌，火攻无效`);
    }
    this._triggerJiZhi(p);
    this._emit('stateChanged');
    return { ok: true };
  }

  // 连环：梅花手牌当铁索连环
  useLianHuan(playerId, data) {
    const p = this.players.find(x => x.id === playerId);
    if (!p.hero || p.hero.skillId !== 'lianHuan') return { ok: false };
    const { cardIdx, targetIdx } = data;
    if (cardIdx < 0 || cardIdx >= p.hand.length) return { ok: false };
    const card = p.hand[cardIdx];
    if (card.suit !== SUIT.CLUB) return { ok: false, msg: '不是梅花牌' };
    const target = this.players[targetIdx];
    if (!target || !target.alive) return { ok: false, msg: '无效目标' };
    p.removeCard(cardIdx); this.deck.discard(card);
    target.chained = !target.chained;
    this.log(`${p.name} 发动【连环】，将一张梅花牌当【铁索连环】对 ${target.name} 使用，${target.chained ? '横置' : '重置'}`);
    this._triggerJiZhi(p);
    this._emit('stateChanged');
    return { ok: true };
  }

  // 断粮：黑色基本/装备牌当兵粮寸断
  useDuanLiang(playerId, data) {
    const p = this.players.find(x => x.id === playerId);
    if (!p.hero || p.hero.skillId !== 'duanLiang') return { ok: false };
    const { cardIdx, targetIdx } = data;
    if (cardIdx < 0 || cardIdx >= p.hand.length) return { ok: false };
    const card = p.hand[cardIdx];
    if (card.suit !== SUIT.SPADE && card.suit !== SUIT.CLUB) return { ok: false, msg: '不是黑色牌' };
    const target = this.players[targetIdx];
    if (!target || !target.alive || targetIdx === this.players.indexOf(p)) return { ok: false, msg: '无效目标' };
    if (this.calcDistance(this.players.indexOf(p), targetIdx) > 1) return { ok: false, msg: '目标不在距离1以内' };
    if (target.judgments.some(c => c.subtype === 'bingLiangCunDuan')) return { ok: false, msg: '目标已有兵粮寸断' };
    p.removeCard(cardIdx);
    target.judgments.push(card);
    this.log(`${p.name} 发动【断粮】，将一张黑色牌当【兵粮寸断】对 ${target.name} 使用`);
    this._emit('stateChanged');
    return { ok: true };
  }

  // 酒池：黑色手牌当酒
  useJiuChi(playerId, data) {
    const p = this.players.find(x => x.id === playerId);
    if (!p.hero || p.hero.skillId !== 'jiuChi') return { ok: false };
    const { cardIdx } = data;
    if (cardIdx < 0 || cardIdx >= p.hand.length) return { ok: false };
    const card = p.hand[cardIdx];
    if (card.suit !== SUIT.SPADE && card.suit !== SUIT.CLUB) return { ok: false, msg: '不是黑色牌' };
    p.removeCard(cardIdx); this.deck.discard(card);
    p.wineBuff = true;
    this.log(`${p.name} 发动【酒池】，将一张黑色牌当【酒】使用`);
    this._emit('stateChanged');
    return { ok: true };
  }

  // 英魂：准备阶段，令其他角色摸X弃1
  useYingHun(playerId, data) {
    const p = this.players.find(x => x.id === playerId);
    if (!p.hero || p.hero.skillId !== 'yingHun') return { ok: false };
    if (p.hp >= p.maxHp) return { ok: false, msg: '未受伤' };
    const { targetIdx } = data;
    const target = this.players[targetIdx];
    if (!target || !target.alive || targetIdx === this.players.indexOf(p)) return { ok: false, msg: '无效目标' };
    const x = p.maxHp - p.hp;
    const drawn = this.deck.draw(x);
    target.addCards(drawn);
    this.log(`${p.name} 发动【英魂】，令 ${target.name} 摸${x}张牌`);
    // 弃1张
    if (target.hand.length > 0) {
      const ri = Math.floor(Math.random() * target.hand.length);
      const c = target.removeCard(ri);
      this.deck.discard(c);
      this.log(`${target.name} 弃置了一张牌`);
    }
    this._emit('stateChanged');
    return { ok: true };
  }

  // 直谏：给其他角色一张装备牌，自己摸一张
  useZhiJian(playerId, data) {
    const p = this.players.find(x => x.id === playerId);
    if (!p.hero || p.hero.skillId !== 'zhiJian') return { ok: false };
    const { cardIdx, targetIdx } = data;
    if (cardIdx < 0 || cardIdx >= p.hand.length) return { ok: false };
    const card = p.hand[cardIdx];
    if (card.type !== 'equip') return { ok: false, msg: '不是装备牌' };
    const target = this.players[targetIdx];
    if (!target || !target.alive || targetIdx === this.players.indexOf(p)) return { ok: false, msg: '无效目标' };
    p.removeCard(cardIdx);
    target.hand.push(card);
    const drawn = this.deck.draw(1);
    p.addCards(drawn);
    this.log(`${p.name} 发动【直谏】，将一张装备牌交给 ${target.name}，自己摸1张`);
    this._emit('stateChanged');
    return { ok: true };
  }

  // 明策：给其他角色一张装备或杀，该角色选择出杀或摸牌
  useMingCe(playerId, data) {
    const p = this.players.find(x => x.id === playerId);
    if (!p.hero || p.hero.skillId !== 'mingCe') return { ok: false };
    if (p.skillsUsed.mingCe) return { ok: false, msg: '明策每阶段限一次' };
    const { cardIdx, targetIdx } = data;
    if (cardIdx < 0 || cardIdx >= p.hand.length) return { ok: false };
    const card = p.hand[cardIdx];
    if (card.type !== 'equip' && card.subtype !== 'strike') return { ok: false, msg: '不是装备牌或杀' };
    const target = this.players[targetIdx];
    if (!target || !target.alive || targetIdx === this.players.indexOf(p)) return { ok: false, msg: '无效目标' };
    p.removeCard(cardIdx); target.hand.push(card);
    p.skillsUsed.mingCe = true;
    this.log(`${p.name} 发动【明策】，将一张牌交给 ${target.name}`);
    // AI选择摸牌
    const drawn = this.deck.draw(1);
    target.addCards(drawn);
    this.log(`${target.name} 摸了1张牌`);
    this._emit('stateChanged');
    return { ok: true };
  }

  // 奇策：所有手牌当任意锦囊牌（简化：当无中生有）
  useQiCe(playerId) {
    const p = this.players.find(x => x.id === playerId);
    if (!p.hero || p.hero.skillId !== 'qiCe') return { ok: false };
    if (p.skillsUsed.qiCe) return { ok: false, msg: '奇策每阶段限一次' };
    if (p.hand.length === 0) return { ok: false, msg: '没有手牌' };
    const count = p.hand.length;
    while (p.hand.length > 0) { const c = p.removeCard(0); this.deck.discard(c); }
    p.skillsUsed.qiCe = true;
    const drawn = this.deck.draw(count + 1);
    p.addCards(drawn);
    this.log(`${p.name} 发动【奇策】，将${count}张手牌当锦囊牌使用，摸${count + 1}张`);
    this._emit('stateChanged');
    return { ok: true };
  }

  // 弓骑：装备牌当闪
  // (在playerRespond中通过convert技能处理)

  // ----- 响应请求 -----
  requestResponse(playerIdx, type, onFail, onUse) {
    const p = this.players[playerIdx];
    if (!p || !p.alive) { onFail(); return; }
    const savedWaitingPlayerId = this.waitingPlayerId;

    // 八卦阵：需要出闪时，先判定（红桃或方块视为打出闪）
    if (type === 'dodge' && p.hasArmor() && p.armorType() === 'baGuaZhen') {
      // 检查攻击者是否有青釭剑（需要从调用上下文获取，此处通过检查当前战斗状态）
      const ignoreArmor = this._currentIgnoreArmor || false;
      if (!ignoreArmor) {
        const judge = this.deck.draw(1)[0];
        this.log(`${p.name} 【八卦阵】判定：${SUIT_SYMBOL[judge.suit]}${judge.num}`);
        this.deck.discard(judge);
        this._emit('stateChanged');
        if (judge.suit === SUIT.HEART || judge.suit === SUIT.DIAMOND) {
          this.log(`${p.name} 【八卦阵】判定成功，视为打出【闪】`);
          this.delayed(() => {
            if (onUse) onUse();
            if (this.waitingFor === null && this.status === 'playing' && this.phase === 'play') {
              this.waitingFor = 'play'; this.waitingPlayerId = savedWaitingPlayerId;
              this._emit('stateChanged'); this._emit('awaitPlay', { playerId: savedWaitingPlayerId });
            }
          });
          return;
        }
        this.log(`${p.name} 【八卦阵】判定失败`);
      }
    }

    // 检查是否有可用牌（包括转换技能）
    const hasCard = p.hand.some(c => {
      if (c.subtype === type) return true;
      // 龙胆
      if (type === 'dodge' && c.subtype === 'strike' && p.hero && p.hero.skillId === 'longDan') return true;
      if (type === 'strike' && c.subtype === 'dodge' && p.hero && p.hero.skillId === 'longDan') return true;
      // 倾国
      if (type === 'dodge' && (c.suit === SUIT.SPADE || c.suit === SUIT.CLUB) && p.hero && p.hero.skillId === 'qingGuo') return true;
      // 急救
      if (type === 'peach' && (c.suit === SUIT.HEART || c.suit === SUIT.DIAMOND) && p.hero && p.hero.skillId === 'jiJiu' && this.cur.id !== playerIdx) return true;
      // 武圣
      if (type === 'strike' && (c.suit === SUIT.HEART || c.suit === SUIT.DIAMOND) && p.hero && p.hero.skillId === 'wuSheng') return true;
      return false;
    });

    if (hasCard) {
      const label = type === 'dodge' ? '闪' : type === 'peach' ? '桃' : type;
      this.waitingFor = 'response';
      this.pendingResponse = {
        playerId: p.id, type,
        onUse: () => { if (onUse) onUse(); if (this.waitingFor === null && this.status === 'playing' && this.phase === 'play') { this.waitingFor = 'play'; this.waitingPlayerId = savedWaitingPlayerId; this._emit('stateChanged'); this._emit('awaitPlay', { playerId: savedWaitingPlayerId }); } },
        onPass: () => { onFail(); if (this.waitingFor === null && this.status === 'playing' && this.phase === 'play') { this.waitingFor = 'play'; this.waitingPlayerId = savedWaitingPlayerId; this._emit('stateChanged'); this._emit('awaitPlay', { playerId: savedWaitingPlayerId }); } },
      };
      this._emit('stateChanged');
      this._emit('awaitResponse', { playerId: p.id, type, label });
    } else {
      this.delayed(() => { onFail(); if (this.waitingFor === null && this.status === 'playing' && this.phase === 'play') { this.waitingFor = 'play'; this.waitingPlayerId = savedWaitingPlayerId; this._emit('stateChanged'); this._emit('awaitPlay', { playerId: savedWaitingPlayerId }); } });
    }
  }

  // ----- 伤害/死亡 -----
  dealDamage(srcIdx, targetIdx, amount, type, ignoreArmor) {
    const target = this.players[targetIdx];
    if (!target || !target.alive) return;
    const src = this.players[srcIdx];

    target.hp -= amount;
    this.log(`${target.name} 受到 ${amount} 点伤害 (HP:${target.hp}/${target.maxHp})`);

    // 受伤后触发技能
    if (srcIdx !== targetIdx) {
      // 奸雄：获得造成伤害的牌
      if (target.hero && target.hero.skillId === 'jianXiong') {
        if (this._lastDamageCard) {
          // 从弃牌堆中找到并移除这张牌
          const idx = this.deck.discards.indexOf(this._lastDamageCard);
          if (idx !== -1) this.deck.discards.splice(idx, 1);
          target.hand.push(this._lastDamageCard);
          this.log(`${target.name} 【奸雄】获得了造成伤害的【${this._lastDamageCard.name}】`);
        }
      }
      // 反馈：获得伤害来源一张手牌
      if (target.hero && target.hero.skillId === 'fanKui' && src.hand.length > 0) {
        const randIdx = Math.floor(Math.random() * src.hand.length);
        const stolen = src.removeCard(randIdx);
        target.hand.push(stolen);
        this.log(`${target.name} 【反馈】获得了 ${src.name} 的一张牌`);
      }
      // 遗计：每受1点伤害摸两张牌，然后将两张手牌交给任意角色
      if (target.hero && target.hero.skillId === 'yiJi') {
        for (let i = 0; i < amount; i++) {
          const drawn = this.deck.draw(2);
          target.addCards(drawn);
          this.log(`${target.name} 【遗计】摸了2张牌`);
          // 将两张手牌交给手牌最少的其他玩家（任意角色）
          if (target.hand.length >= 2) {
            const others = this.players.filter(p => p.alive && p.id !== target.id);
            if (others.length > 0) {
              const recipient = others.reduce((a, b) => a.hand.length <= b.hand.length ? a : b);
              const cards = [target.removeCard(target.hand.length - 1), target.removeCard(target.hand.length - 1)];
              recipient.addCards(cards.filter(c => c));
              this.log(`${target.name} 【遗计】将2张牌交给了 ${recipient.name}`);
            }
          }
        }
      }
      // 刚烈：受到伤害后判定，不为红桃则伤害来源弃2牌或受1伤害
      if (target.hero && target.hero.skillId === 'gangLie' && src && src.alive) {
        const judge = this.deck.draw(1)[0];
        this.log(`${target.name} 【刚烈】判定：${SUIT_SYMBOL[judge.suit]}${judge.num}`);
        this.deck.discard(judge);
        this._emit('stateChanged');
        if (judge.suit !== SUIT.HEART) {
          // AI决策：弃2牌（如果有足够的牌）
          if (src.hand.length >= 2) {
            for (let i = 0; i < 2; i++) {
              const randIdx = Math.floor(Math.random() * src.hand.length);
              const c = src.removeCard(randIdx);
              this.deck.discard(c);
            }
            this.log(`${src.name} 弃置了2张牌`);
          } else {
            // 不足2张，受到1伤害
            this.dealDamage(targetIdx, srcIdx, 1);
            this.log(`${src.name} 受到【刚烈】的1点伤害`);
          }
        } else {
          this.log(`${target.name} 【刚烈】判定为红桃，不发动`);
        }
      }
      // 狂骨：对距离1以内角色造成伤害后回复1体力
      if (src.hero && src.hero.skillId === 'kuangGu') {
        const dist = this.calcDistance(srcIdx, targetIdx);
        if (dist <= 1 && src.hp < src.maxHp) {
          src.hp = Math.min(src.hp + 1, src.maxHp);
          this.log(`${src.name} 【狂骨】回复1点体力 (HP:${src.hp}/${src.maxHp})`);
        }
      }
      // 称象：受到伤害后亮出4张牌，获得点数和<=13的牌
      if (target.hero && target.hero.skillId === 'chengXiang') {
        const viewed = this.deck.draw(4);
        const kept = [];
        let sum = 0;
        for (const c of viewed) {
          const val = this._cardPoint(c);
          if (sum + val <= 13) { kept.push(c); sum += val; }
          else this.deck.discard(c);
        }
        target.addCards(kept);
        this.log(`${target.name} 【称象】亮出4张牌，获得${kept.length}张（点数和${sum}）`);
      }
      // 贞烈：受到伤害后判定，红色回复1体力+摸1张
      if (target.hero && target.hero.skillId === 'zhenLie') {
        const judge = this.deck.draw(1)[0];
        this.log(`${target.name} 【贞烈】判定：${SUIT_SYMBOL[judge.suit]}${judge.num}`);
        this.deck.discard(judge);
        if (judge.suit === SUIT.HEART || judge.suit === SUIT.DIAMOND) {
          target.hp = Math.min(target.hp + 1, target.maxHp);
          const drawn = this.deck.draw(1);
          target.addCards(drawn);
          this.log(`${target.name} 【贞烈】判定成功，回复1体力并摸1张`);
        }
      }
      // 御策：展示手牌，与伤害牌类型不同则回复1体力
      if (target.hero && target.hero.skillId === 'yuCe' && target.hand.length > 0) {
        const shown = target.hand[0];
        const dmgType = this._lastDamageCard ? this._lastDamageCard.type : 'basic';
        if (shown.type !== dmgType) {
          target.hp = Math.min(target.hp + 1, target.maxHp);
          this.log(`${target.name} 【御策】展示${shown.name}，类型不同，回复1体力`);
        }
      }
      // 悲歌：其他角色受到杀的伤害后，弃一张牌判定
      if (this._lastDamageCard && this._lastDamageCard.subtype === 'strike') {
        for (const saver of this.players) {
          if (saver.alive && saver.id !== target.id && saver.hero && saver.hero.skillId === 'beiGe' && saver.hand.length > 0) {
            const discIdx = Math.floor(Math.random() * saver.hand.length);
            const disc = saver.removeCard(discIdx);
            this.deck.discard(disc);
            const judge = this.deck.draw(1)[0];
            this.log(`${saver.name} 【悲歌】判定：${SUIT_SYMBOL[judge.suit]}${judge.num}`);
            this.deck.discard(judge);
            if (judge.suit === SUIT.HEART) {
              target.hp = Math.min(target.hp + 1, target.maxHp);
              this.log(`${target.name} 回复1体力`);
            } else if (judge.suit === SUIT.DIAMOND) {
              const drawn = this.deck.draw(2);
              target.addCards(drawn);
              this.log(`${target.name} 摸2张牌`);
            } else if (judge.suit === SUIT.CLUB) {
              if (src && src.alive && src.hand.length >= 2) {
                for (let i = 0; i < 2; i++) { const ri = Math.floor(Math.random() * src.hand.length); const c = src.removeCard(ri); this.deck.discard(c); }
                this.log(`${src.name} 弃置2张牌`);
              }
            } else if (judge.suit === SUIT.SPADE) {
              // 伤害来源翻面（简化：跳过下回合）
              if (src && src.alive) { src.skipNextTurn = true; this.log(`${src.name} 翻面（跳过下回合）`); }
            }
            break; // 只触发一次
          }
        }
      }
    }

    // 精策：出牌阶段结束时，若使用牌数>=体力值，摸2张
    // (在runEnd中处理)

    // 行殇：其他角色死亡时获得其所有牌
    // (在killPlayer中处理)

    // 铁索连环传导：属性伤害传导给其他连环角色，传导后所有连环角色解除连环
    if (target.chained && type !== 'normal') {
      const chainedPlayers = this.players.filter(p => p !== target && p.alive && p.chained);
      // 先解除所有连环状态（包括自己）
      target.chained = false;
      for (const p of chainedPlayers) {
        p.chained = false;
        this.log(`${p.name} 受到铁索连环传导伤害`);
        this.dealDamage(srcIdx, this.players.indexOf(p), amount, type);
      }
    }

    this._emit('stateChanged');
    if (target.hp <= 0) this.checkDeath(srcIdx, targetIdx);
  }

  checkDeath(srcIdx, targetIdx) {
    const p = this.players[targetIdx];
    if (p.hp > 0) return;
    // 自救：循环使用桃/酒直到HP>0或无牌可出
    while (p.hp <= 0) {
      const peachIdx = p.findCard('peach');
      if (peachIdx !== -1) {
        const card = p.removeCard(peachIdx); this.deck.discard(card);
        p.hp = Math.min(p.hp + 1, p.maxHp);
        this.log(`${p.name} 使用【桃】自救`);
        this._emit('stateChanged');
        if (p.hp > 0) return;
        continue;
      }
      // 酒自救：仅当没有桃时才用酒
      const wineIdx = p.findCard('wine');
      if (wineIdx !== -1) {
        const card = p.removeCard(wineIdx); this.deck.discard(card);
        p.hp = Math.min(p.hp + 1, p.maxHp);
        this.log(`${p.name} 使用【酒】自救`);
        this._emit('stateChanged');
        if (p.hp > 0) return;
        continue;
      }
      break; // 无桃无酒，退出循环
    }
    if (p.hp > 0) return;
    // 求救链
    this.requestSaveFromOthers(targetIdx, () => this.killPlayer(srcIdx, targetIdx));
  }

  requestSaveFromOthers(dyingIdx, onFail) {
    const dying = this.players[dyingIdx];
    const askOrder = [];
    for (let i = 0; i < this.players.length; i++) { const idx = (dyingIdx + 1 + i) % this.players.length; if (idx !== dyingIdx && this.players[idx].alive) askOrder.push(idx); }

    // 安全超时：10秒后如果仍然卡住，强制执行onFail
    this._saveChainTimer = setTimeout(() => {
      if (this.waitingFor === 'response' && dying.hp <= 0) {
        this.waitingFor = null; this.pendingResponse = null;
        this.log(`[超时] 求桃超时，${dying.name} 阵亡`);
        onFail();
        this._restorePlayState();
      }
    }, 10000);

    this._askNextSaver(dyingIdx, askOrder, 0, () => {
      clearTimeout(this._saveChainTimer);
      onFail();
    });
  }

  _askNextSaver(dyingIdx, askOrder, askIndex, onFail) {
    const dying = this.players[dyingIdx];
    if (dying.hp > 0) { clearTimeout(this._saveChainTimer); this._restorePlayState(); return; }

    // 找到下一个可以救的人
    while (askIndex < askOrder.length) {
      const saverIdx = askOrder[askIndex];
      const saver = this.players[saverIdx];
      if (!saver.alive) { askIndex++; continue; }

      // 检查是否有桃或急救
      const hasPeach = saver.findCard('peach') !== -1;
      const hasJiJiu = saver.hero && saver.hero.skillId === 'jiJiu'
        && saver.hand.some(c => (c.suit === SUIT.HEART || c.suit === SUIT.DIAMOND) && c.subtype !== 'peach');
      if (!hasPeach && !hasJiJiu) { askIndex++; continue; }

      if (saver.isHuman) {
        // 人类玩家：发送响应请求，让玩家自己决定
        // 注意：playerRespond 已经负责移除牌，onUse 不再移除
        this.waitingFor = 'response';
        this.pendingResponse = {
          playerId: saver.id, type: 'peach',
          onUse: () => {
            // playerRespond 已移除牌，此处只处理效果
            dying.hp = Math.min(dying.hp + 1, dying.maxHp);
            this.log(`${saver.name} 使用【桃】救了 ${dying.name}`);
            this._emit('stateChanged');
            if (dying.hp > 0) { this._restorePlayState(); return; }
            // 继续问下一个人
            this._askNextSaver(dyingIdx, askOrder, askIndex + 1, onFail);
          },
          onPass: () => {
            // 跳过，问下一个人
            this._askNextSaver(dyingIdx, askOrder, askIndex + 1, onFail);
          },
        };
        this._emit('stateChanged');
        this._emit('awaitResponse', { playerId: saver.id, type: 'peach', label: `${dying.name} 濒死，是否使用【桃】拯救？` });
        return; // 等待人类响应
      } else {
        // AI 决策：同阵营才救
        if (saver.isAllyOf(dying)) {
          const peachIdx = saver.findCard('peach');
          const jiJiuIdx = saver.hero && saver.hero.skillId === 'jiJiu'
            ? saver.hand.findIndex(c => (c.suit === SUIT.HEART || c.suit === SUIT.DIAMOND) && c.subtype !== 'peach')
            : -1;
          const cardIdx = peachIdx !== -1 ? peachIdx : jiJiuIdx;
          if (cardIdx === -1) { askIndex++; continue; }
          const card = saver.removeCard(cardIdx);
          this.deck.discard(card);
          dying.hp = Math.min(dying.hp + 1, dying.maxHp);
          this.log(`${saver.name} 使用【桃】救了 ${dying.name}`);
          this._emit('stateChanged');
          if (dying.hp > 0) { this._restorePlayState(); return; }
          // 继续问下一个人（不从头开始）
          this._askNextSaver(dyingIdx, askOrder, askIndex + 1, onFail);
          return;
        } else {
          askIndex++;
          continue;
        }
      }
    }

    // 没人能救了，死亡
    if (dying.hp > 0) { this._restorePlayState(); return; }
    onFail();
    this._restorePlayState();
  }

  killPlayer(srcIdx, targetIdx) {
    const target = this.players[targetIdx];
    if (!target.alive) return;
    const src = this.players[srcIdx];
    target.identityRevealed = true; target.alive = false;
    // 行殇：曹丕获得死亡角色所有牌
    for (const p of this.players) {
      if (p.alive && p.hero && p.hero.skillId === 'xingShang' && p.id !== target.id) {
        p.addCards([...target.hand]);
        for (const slot of Object.keys(target.equipment)) { if (target.equipment[slot]) p.hand.push(target.equipment[slot]); }
        this.log(`${p.name} 【行殇】获得了 ${target.name} 的所有牌`);
        target.hand = []; target.equipment = {}; break;
      }
    }
    for (const card of target.hand) this.deck.discard(card);
    target.hand = [];
    for (const slot of Object.keys(target.equipment)) { if (target.equipment[slot]) this.deck.discard(target.equipment[slot]); }
    target.equipment = {};
    for (const card of target.judgments) this.deck.discard(card); // 判定区牌也弃置
    target.judgments = [];
    this.log(`⚔ ${target.name} (${IDENTITY_LABEL[target.identity]}) 阵亡！`);
    this._emit('stateChanged');
    this._emit('playerDied', { playerId: target.id, identity: target.identity, identityLabel: IDENTITY_LABEL[target.identity] });
    // 击杀奖惩
    if (target.isRebel) { const reward = this.deck.draw(3); src.addCards(reward); this.log(`${src.name} 击杀反贼，摸3张牌`); this._emit('stateChanged'); }
    else if (target.isLoyalist && src.isLord) {
      // 主公误杀忠臣：弃置所有牌（手牌+装备）
      for (const card of src.hand) this.deck.discard(card);
      src.hand = [];
      for (const slot of Object.keys(src.equipment)) { if (src.equipment[slot]) this.deck.discard(src.equipment[slot]); src.equipment[slot] = null; }
      this.log(`${src.name} 误杀忠臣，弃置所有牌`);
      this._emit('stateChanged');
    }
    this.checkWinCondition(srcIdx, targetIdx);
  }

  // ----- 胜利判定 -----
  checkWinCondition(srcIdx, targetIdx) {
    const alive = this.players.filter(p => p.alive);
    const lordAlive = alive.some(p => p.isLord);
    const rebelsAlive = alive.some(p => p.isRebel);
    const traitorsAlive = alive.some(p => p.isTraitor);
    const loyalistsAlive = alive.some(p => p.isLoyalist);

    // 主公死亡
    if (!lordAlive) {
      // 内奸杀主公（仅剩内奸）→ 内奸胜
      if (srcIdx !== undefined && this.players[srcIdx] && this.players[srcIdx].isTraitor && alive.length <= 1) {
        this.endGame(IDENTITY.TRAITOR);
        return;
      }
      // 其他情况 → 反贼胜
      this.endGame(IDENTITY.REBEL);
      return;
    }
    // 所有反贼和内奸死亡 → 主公/忠臣胜
    if (!rebelsAlive && !traitorsAlive) { this.endGame(IDENTITY.LORD); return; }
    // 仅剩主公+内奸 → 游戏继续，不自动结束
  }

  endGame(winnerId) {
    this.status = 'ended'; this.winner = winnerId;
    for (const p of this.players) p.identityRevealed = true;
    this._emit('stateChanged');
    this._emit('gameOver', { winnerId });
  }

  log(msg) { this.logs.push(msg); this._emit('log', msg); }
  delayed(fn) { setTimeout(() => { if (this.status === 'playing') fn(); }, 100); }
}

if (typeof module !== 'undefined') module.exports = { SanguoshaGame, IDENTITY, IDENTITY_LABEL, HEROES, PHASE_LABEL, SUIT, WEAPON_RANGE };
