/**
 * 像素牌面工坊：露娜画风的韦特塔罗重绘。
 * - 调色板与体素女巫共用同一族颜色（K 描边 / S 奶油皮肤 / P 女巫紫 / G 星金…）
 * - 每张牌为字符串像素图：一个字符一个色，'.' 为透明；行宽不等时右侧自动补透明
 * - 本文件先收录大阿卡纳精绘样板 5 张；其余牌由组件走程序化占位图案
 */

export const ARCANA_PALETTE: Record<string, string> = {
  K: '#2e2650', // 描边深紫（与露娜同款）
  P: '#6b5bd6', // 女巫帽紫
  D: '#4a3d99', // 袍子暗紫
  S: '#ffdcc5', // 奶油皮肤
  B: '#ff9fce', // 腮红粉
  W: '#fff6ec', // 奶白
  G: '#f5c86e', // 星金
  Y: '#ffe3a8', // 亮金
  L: '#b3a6f7', // 薰衣草
  T: '#7de8c3', // 薄荷
  M: '#8a5a3b', // 木杖棕
  R: '#e05a4e', // 玫瑰红
  C: '#a9c4e8', // 云蓝
  E: '#453a72', // 夜空底
  /* ---------- 小阿卡纳四花色 ---------- */
  F: '#ff9f6e', // 权杖 · 火焰橙
  U: '#7db8ff', // 圣杯 · 水蓝
  I: '#cfd6ff', // 宝剑 · 钢辉白紫
  A: '#d9b24a', // 星币 · 铸金
}

export interface ArcanaArt {
  /** 大阿卡纳编号 0-21 */
  id: number
  rows: string[]
}

/* ---------- 0 愚者：崖边一步，小狗作陪，朝阳初升 ---------- */
const FOOL: ArcanaArt = {
  id: 0,
  rows: [
    '....GGG...............',
    '...GYYYG..............',
    '...GYYYG..........C...',
    '....GG...........CC...',
    '................CCC...',
    '..P...................',
    '.PPD.............L....',
    '.PDSD....K............',
    '.PDSSD...KK...........',
    '..PSSD..KMKK..........',
    '..PSBD..KM............',
    '...SSD.KMM............',
    '...DD..KM.............',
    '..DDD..KM.............',
    '..DKD.KMM.........R...',
    '..D.D.KM.........RRR..',
    '....D.K..........RR...',
    '...WWK...........RR...',
    '..WWWKKK..............',
    '.WW..KWWK.............',
    '.W....KWK.............',
    '.K.....KK.............',
    '..KKK..KK.............',
    '.KKKKK................',
    'KK..KKK...............',
    'K....KK...............',
  ],
}

/* ---------- I 魔术师：高举法杖连天，桌上星币圣杯 ---------- */
const MAGICIAN: ArcanaArt = {
  id: 1,
  rows: [
    '.......Y...Y..........',
    '........Y.Y...........',
    '.........Y............',
    '.........M............',
    '.........M............',
    '....PP..KM............',
    '...PPPDKMM............',
    '...PDSDKMM............',
    '...PDSD.M.............',
    '...PSSD.M.............',
    '...PSBD................',
    '....SSD................',
    '...DDDDD...............',
    '..DDDPDDD..............',
    '..DDDPDDD..............',
    '...DDDDD...............',
    '...DD.DD...............',
    '...DD.DD...............',
    '..KKKKKKKKK............',
    '.KW..GG..TW............',
    '.KW.GGGG.TW............',
    '.KKKKKKKKKK............',
    '.......................',
    '...R.......L...........',
    '..RRR.....LLL..........',
    '...R.......L...........',
  ],
}

/* ---------- X 命运之轮：轮上生灵，云间流转 ---------- */
const WHEEL: ArcanaArt = {
  id: 10,
  rows: [
    '.......................',
    '...CC.....YY.....CC....',
    '..CCCC...YYYY...CCCC...',
    '...CC.....YY.....CC....',
    '.......KKKKKKK.........',
    '.....KKGGGGGGGKK.......',
    '....KGGKKGGGKKGGK......',
    '...KGGK..KGK..KGGK.....',
    '...KGK...KGK...KGK.....',
    '...KGK...KGK...KGK.....',
    '...KGGK..KGK..KGGK.....',
    '....KGGKKGGGKKGGK......',
    '.....KKGGGGGGGKK.......',
    '.......KKKKKKK.........',
    '...T...................',
    '..TTT.......L..........',
    '...T.......LLL.........',
    '............L..........',
  ],
}

/* ---------- XIII 死神：白骨玫瑰，双塔之间日出 ---------- */
const DEATH: ArcanaArt = {
  id: 13,
  rows: [
    '....K..........K.......',
    '...KWKK........KKWK....',
    '...KWWK..YY...KWWK.....',
    '....KK..YYYY...KK......',
    '.......YYYYYY..........',
    '......YYYWWYYY.........',
    '.......W.WW.W..........',
    '....KKKKKKKKKKK........',
    '...KWWWWWWWWWWWK.......',
    '...KWKWKWKWKWKK........',
    '...KWWWWWWWWWWWK.......',
    '....KWWKWWWKWWK........',
    '....KKKKKKKKKKK........',
    '.....KRRK...KRRK.......',
    '....KRRRRK.KRRRRK......',
    '.....KRRK...KRRK.......',
    '......KK.....KK........',
  ],
}

/* ---------- XXI 世界：花环中起舞，四角圣兽守望 ---------- */
const WORLD: ArcanaArt = {
  id: 21,
  rows: [
    '.LL................LL.',
    'LLLL..............LLLL',
    'LL..................LL',
    'L....KKKKKKKKKK....L..',
    '.....K........K........',
    '....K..P.P.P..K........',
    '....K.PPPPPPP.K........',
    '....K.PSDSDPS.K........',
    '....K..PSSBSS.K........',
    '....K..S.S.SS.K........',
    '....K..PSSSS..K........',
    '....K..DSSSD..K........',
    '....K.DD..DD..K........',
    '....KDD....DD.K........',
    '.....K......K..........',
    '....KKKKKKKKKK.........',
    'LL..................LL',
    'LLLL....G..G......LLLL',
    '.LL.....GGGG......LL..',
    '.........GG...........',
  ],
}

/* ---------- II 女祭司：双柱之间，月落脚边 ---------- */
const PRIESTESS: ArcanaArt = {
  id: 2,
  rows: [
    '..K...........K......',
    '.KW.K.......K.WK.....',
    '.K..K..PPP..K..K.....',
    '.K..KK.PDP.KK..K.....',
    '.K..KDPPSDPDK..K.....',
    '.K..KPSSSSSPK..K.....',
    '.K..KPSBSSBPK..K.....',
    '.K..KKSSSSSKK..K.....',
    '.K...KDDDDK....K.....',
    '.K...DDDDDD....K.....',
    '.KKKKKKKKKKKKKKK.....',
    '........GG...........',
    '.....G.GGGG.G........',
    '.......GGGG..........',
    '........GG...........',
  ],
}

/* ---------- III 皇后：王座上的丰饶 ---------- */
const EMPRESS: ArcanaArt = {
  id: 3,
  rows: [
    '....Y.Y.Y.Y.........',
    '....YYYYYYY.........',
    '.....PPPPP..........',
    '....PPSSSPP....R....',
    '....PSSBSSP....RR...',
    '.....PSSSSP.....R...',
    '....PPSSSSPP........',
    '...DDDSSDDD.........',
    '..DDDPSSPDDD........',
    '..DDDDDDDDDD........',
    '..DDDDDDDDDD.M.M....',
    '..DDD.DD.DDD.MMM....',
    '...DG.DG.DG..M.M....',
    '....................',
    '..T.T.T.T.T.T.......',
    '.TTTTTTTTTTTTT......',
  ],
}

/* ---------- IV 皇帝：山石般的威严 ---------- */
const EMPEROR: ArcanaArt = {
  id: 4,
  rows: [
    '..G.G.......G.G.....',
    '..GGG..PPP..GGG.....',
    '...K..PPDPP..K......',
    '...KK.PSSPP.KK......',
    '...KM.PSBSP.MK......',
    '...K..PSSSP..K......',
    '......PSDSP.........',
    '.....DDDDDDD........',
    '....DDDDDDDDD.......',
    '....DDDDDDDDD.......',
    '....DDD.D.DDD.......',
    '...KKKKKKKKKKK......',
    '..CC.....CC.........',
    '.CCCC...CCCC........',
    'CC..C..C..CC........',
  ],
}

/* ---------- V 教皇：三重冠与钥匙 ---------- */
const HIEROPHANT: ArcanaArt = {
  id: 5,
  rows: [
    '...YYYYY............',
    '....YYY.............',
    '...YYYYY............',
    '..PPPPPPP...........',
    '..PPSSSPP.G.G.......',
    '..PPSBSPP..K........',
    '..PPSSSPP.GGG.......',
    '..PPPPPPP...........',
    '.PPPSSSPPP..........',
    '.PPDDDDDPP..........',
    '.PPDDDDDPP..........',
    '.PPDDDDDPP..........',
    '..PPPPPPP...........',
    '..WW...WW...........',
    '.KKW...WKK..........',
    '.S.S...S.S..........',
  ],
}

/* ---------- VI 恋人：天使之下 ---------- */
const LOVERS: ArcanaArt = {
  id: 6,
  rows: [
    '.........L.L.L......',
    '........LLLLLLL.....',
    '.........LLLLL......',
    '....G.......G.......',
    '...GGG.....GGG......',
    '..PPSSP...PPSSP.....',
    '..PSBSP...PSBSP.....',
    '...PSSP...PSSSP.....',
    '...DDDD...WWDW......',
    '..DDDDDD.WWWWWD.....',
    '..DD..DD.WW.WWD.....',
    '....................',
    '..RR.....RR.........',
    '.RRRR...RRRR........',
    '..RR.....RR.........',
  ],
}

/* ---------- VII 战车：星幕下的凯旋 ---------- */
const CHARIOT: ArcanaArt = {
  id: 7,
  rows: [
    '.L.L.L.L.L.L.L......',
    '.LLLLLLLLLLLLL......',
    '.....PSSP...........',
    '.KK.PSSBSP.KK.......',
    '...KPDSSDPK.........',
    '.KKKDDDDDKKK........',
    '.KDDDDDDDDDK........',
    '.KKKKKKKKKKK........',
    '..G.......G.........',
    '..GG.....GG.........',
    '.GGG.....GGG........',
    '.KGK.....KGK........',
    '..K.......K.........',
    '....................',
    '..M.....M...........',
    '..MM...MM...........',
  ],
}

/* ---------- VIII 力量：驯狮者 ---------- */
const STRENGTH: ArcanaArt = {
  id: 8,
  rows: [
    '.......Y.Y..........',
    '........Y...........',
    '.....PPPPPP.........',
    '....PPSSSSPP........',
    '....PSBSSBSP........',
    '.....PSSSSP.........',
    '....WWSSSSWW........',
    '...W..DDDD..W.......',
    '..WW.DDDDDD.WW......',
    '.W...DDDDDD...W.....',
    '.W..GGDDDDGG..W.....',
    '.WG.GGDDDDGG.GW.....',
    '..WGGGGGGGGGGW......',
    '...GG.GG.GG.G.......',
    '....W.WW.WW.........',
  ],
}

/* ---------- IX 隐者：提灯独行 ---------- */
const HERMIT: ArcanaArt = {
  id: 9,
  rows: [
    '..............YY....',
    '.............YWWY...',
    '..............YY....',
    '.....PP.............',
    '....PPPP............',
    '...PPDDPP...........',
    '...PDSSDP...KM......',
    '...PDSSDP...KM......',
    '...PPBBPP...KM......',
    '....PPPP....KM......',
    '...DDDDDD...KM......',
    '..DDDDDDDD..KM......',
    '..DDDDDDDD..KM......',
    '..DDD..DDD..KM......',
    '..KKK..KKK..KKK.....',
    '.CC.....C...........',
  ],
}

/* ---------- XI 正义：剑与天平 ---------- */
const JUSTICE: ArcanaArt = {
  id: 11,
  rows: [
    '.K.............K....',
    'KWKK..........KKWK..',
    'KW..K........K..WK..',
    '.KKKKKKKKKKKKKKK....',
    '......PPPPP.........',
    '.....PPSSSPP........',
    '.....PPSBSP.........',
    '.....PPSSSPP........',
    '.....PPPPPPP........',
    '..G..PDDDDP..G......',
    '.GGG.PDDDDP.GGG.....',
    '.KKK.DD..DD.KKK.....',
    '......KK.KK.........',
    '......M..M..........',
    '......MMMMMM........',
    '........M...........',
    '........M...........',
  ],
}

/* ---------- XII 倒吊人：光晕中的倒影 ---------- */
const HANGED: ArcanaArt = {
  id: 12,
  rows: [
    '.KKKKKKKKKKKKKKK....',
    '......K.....K.......',
    '......K..Y..K.......',
    '......KY.Y.K........',
    '......K..Y..K.......',
    '.....PPSSPP.........',
    '.....PSBSSP.........',
    '.....PSSSSP.........',
    '....PPDDPP..........',
    '...DDDDDDDD.........',
    '...DD.DD.DD.........',
    '...DD.KK.DD.........',
    '....D.KK.D..........',
    '....DDDDDD..........',
    '....KK..KK..........',
    '...CC....CCC........',
  ],
}

/* ---------- XIV 节制：双杯之间的水流 ---------- */
const TEMPERANCE: ArcanaArt = {
  id: 14,
  rows: [
    '....Y...............',
    '...YYY..............',
    '....Y...............',
    '..PPPP..............',
    '.PPSSPP.............',
    '.PPSBSP.....T.......',
    '.PPSSPP....TTT......',
    '..PPPP.....TTT......',
    '.PPPPPP....TTT......',
    '.PDDDDP....TTT......',
    '..PPPP.....TTT......',
    '.KKKKKK....TTT......',
    '.KWWWWK....TTT......',
    '.KKKKKKKKKKKKK......',
    '....T....T..........',
  ],
}

/* ---------- XV 恶魔：锁链比想象中松 ---------- */
const DEVIL: ArcanaArt = {
  id: 15,
  rows: [
    '.K...............K..',
    '..K.....Y.Y.....K...',
    '.KK...YYYYYYY..KK...',
    '..KK..PPPPPPP.KK....',
    '...KKPSSSSSSPKK.....',
    '....KPBSSSSBPK......',
    '....KPSSKSSSPK......',
    '...PPDDDDDDPP.......',
    '..PPDDDDDDDPPP......',
    '..PD.DDDDD.DP.......',
    '..KK.KKKKK.KK.......',
    '..SS.....SS.........',
    '..SK.....KS.........',
    '.SS.......SS........',
    '..KK.......KK.......',
  ],
}

/* ---------- XVI 高塔：闪电劈开旧冠冕 ---------- */
const TOWER: ArcanaArt = {
  id: 16,
  rows: [
    '....Y........Y......',
    '.YYYYYYYYYYYYYYY....',
    '....Y...GGGG..Y.....',
    '....Y..GGGGGG.......',
    '.......KGGGGK.......',
    '.......KKKKKK.......',
    '......KDDDDDDK......',
    '......KDDDDDDK......',
    '......KDDKKDDK......',
    '......KDDKKDDK......',
    '.....KKDDDDDDKK.....',
    '....Y..KKKKKK..Y....',
    '...YYY.RR.RR.YYY....',
    '....Y.RRR.RRR.Y.....',
    '......RR...RR.......',
    '.......R...R........',
  ],
}

/* ---------- XVII 星星：倒水与希望 ---------- */
const STAR: ArcanaArt = {
  id: 17,
  rows: [
    '.........Y..........',
    '....G....Y....G.....',
    '....GG..YYY..GG.....',
    '.....YYYYYYYYYY.....',
    '....GG..YYY..GG.....',
    '....G....Y....G.....',
    '.........Y..........',
    '....PP......l.......',
    '...PPSSP............',
    '...PSBSPP...........',
    '...PSSSSP...........',
    '..PPDDPPP..T........',
    '..DDDDDD..TTT.......',
    '..DD..DD.TTT........',
    '.KKKKKKKKKKKKK......',
    '.T..T...T..T........',
  ],
}

/* ---------- XVIII 月亮：小径两端 ---------- */
const MOONCARD: ArcanaArt = {
  id: 18,
  rows: [
    '....YYYYYYYY........',
    '...YWWYYYYWWY.......',
    '...YYYYYYYYYY.......',
    '....YY.YY.YY........',
    '.....Y..Y..Y........',
    '..K............K....',
    '.KWK..........KWK...',
    '.KKK..........KKK...',
    '....................',
    '..WW..........WW....',
    '..WWW........WWW....',
    '...WW....K...WW.....',
    '....KK..KK..KK......',
    '.....KKKKKKKK.......',
    '......KK..KK........',
    '.......K..K.........',
  ],
}

/* ---------- XIX 太阳：向日葵与小骑士 ---------- */
const SUN: ArcanaArt = {
  id: 19,
  rows: [
    '......YYYYYY........',
    '...YYYYYYYYYYYY.....',
    '..YYYYYWWYYYYYYY....',
    '..YYYYW..WYYYYYY....',
    '..YYYYYWWYYYYYYY....',
    '...YYYYYYYYYYYY.....',
    '......YYYYYY........',
    '..G.............G...',
    '.GGG....PP....GGG...',
    'GGGGG..PSSP..GGGGG..',
    '.GGG...PSBSP..GGG...',
    '..G....PSSSP...G....',
    '.......WWDW.........',
    '......WWWWW.........',
    '......WW.WW.........',
    '.T.T.T....T.T.T.....',
  ],
}

/* ---------- XX 审判：号角唤醒 ---------- */
const JUDGEMENT: ArcanaArt = {
  id: 20,
  rows: [
    '......LLLLLL........',
    '.....LLLLLLLL.......',
    '....LLL.MM.LLL......',
    '.....LL.MMMM.LL.....',
    '......LL.MM.........',
    '.......L.MM.........',
    '.........MM.........',
    '....G...MM...G......',
    '...GGG.PSSP.GGG.....',
    '....G..PSSSP..G.....',
    '.......DDDDD........',
    '....DDDDDDDDDD......',
    '...DDD.DDDD.DDD.....',
    '...DD...DD...DD.....',
    '..KKK..KKK...KKK....',
    '.CC.CC.CC..CC.CC....',
  ],
}

/** 已收录的精绘牌 */
export const ARCANA_ARTS: ArcanaArt[] = [FOOL, MAGICIAN, PRIESTESS, EMPRESS, EMPEROR, HIEROPHANT, LOVERS, CHARIOT, STRENGTH, HERMIT, WHEEL, JUSTICE, HANGED, DEATH, TEMPERANCE, DEVIL, TOWER, STAR, MOONCARD, SUN, JUDGEMENT, WORLD]

export function getArcanaArt(id: number): ArcanaArt | null {
  return ARCANA_ARTS.find((a) => a.id === id) ?? null
}
