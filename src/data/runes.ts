import { randInt } from '../lib/random'

export interface Rune {
  /** Unicode 卢文字符 */
  glyph: string
  name: string
  nameCn: string
  translit: string
  /** 正位含义 */
  upright: string
  /** 倒转（merkstave）含义，部分符文无倒转 */
  reversed: string | null
  keywords: string[]
}

/** 古弗萨克（Elder Futhark）24 符文，按传统八度（aett）排列 */
export const RUNES: Rune[] = [
  // 第一埃特 —— 弗蕾亚：创造与俗世
  { glyph: 'ᚠ', name: 'Fehu', nameCn: '菲胡', translit: 'F', keywords: ['财富', '流动'], upright: '丰饶与流动的资源，努力开始产生回报。', reversed: '财务流失或错失时机，检视你的付出与所得是否对等。' },
  { glyph: 'ᚢ', name: 'Uruz', nameCn: '乌鲁兹', translit: 'U', keywords: ['力量', '野性'], upright: '原始的生命力与健康，把握机遇需要野性的勇气。', reversed: '力量误用或健康透支，蛮力解决不了的事请交给时间。' },
  { glyph: 'ᚦ', name: 'Thurisaz', nameCn: '苏里萨兹', translit: 'TH', keywords: ['荆棘', '考验'], upright: '防御性的力量与必要的冲突，巨人是成长的磨刀石。', reversed: '冲动招祸或被人设障，退一步避开锋芒。' },
  { glyph: 'ᚨ', name: 'Ansuz', nameCn: '安苏兹', translit: 'A', keywords: ['神谕', '讯息'], upright: '来自长者或更高智慧的讯息，留意递到你耳边的忠告。', reversed: '被误导或沟通失灵，别把花言巧语当真言。' },
  { glyph: 'ᚱ', name: 'Raidho', nameCn: '莱多', translit: 'R', keywords: ['旅程', '节律'], upright: '一场有意义的旅程启程，路上的节奏比速度重要。', reversed: '行程受阻或与人失谐，重新约定彼此的步调。' },
  { glyph: 'ᚲ', name: 'Kenaz', nameCn: '肯纳兹', translit: 'K', keywords: ['火炬', '洞见'], upright: '黑暗中的火把照亮真相，技术与灵感正在成形。', reversed: '灵感熄灭或知识浅尝辄止，添一把柴再坚持一下。' },
  { glyph: 'ᚷ', name: 'Gebo', nameCn: '盖博', translit: 'G', keywords: ['馈赠', '交换'], upright: '平等的给予与接受，一份礼物或伙伴关系正在到来。此符文正反同义。', reversed: null },
  { glyph: 'ᚹ', name: 'Wunjo', nameCn: '温乔', translit: 'W', keywords: ['喜悦', '和谐'], upright: '努力换来的欢愉与归属感，此刻值得享受。', reversed: '喜悦蒙尘或众乐难成，先修复内心的失调。' },

  // 第二埃特 —— 海姆达尔：考验与转化
  { glyph: 'ᚻ', name: 'Hagalaz', nameCn: '哈加拉兹', translit: 'H', keywords: ['冰雹', '考验'], upright: '突如其来的风雪打乱计划，但它也在为新的秩序清场。此符文正反同义。', reversed: null },
  { glyph: 'ᚾ', name: 'Nauthiz', nameCn: '诺迪兹', translit: 'N', keywords: ['匮乏', '必需'], upright: '需求是最好的老师，限制逼出真正的韧性。此符文正反同义。', reversed: null },
  { glyph: 'ᛁ', name: 'Isa', nameCn: '伊萨', translit: 'I', keywords: ['冰封', '静止'], upright: '一切暂时冻结，静观不是停滞而是蓄能。此符文正反同义。', reversed: null },
  { glyph: 'ᛃ', name: 'Jera', nameCn: '耶拉', translit: 'J', keywords: ['收成', '循环'], upright: '种瓜得瓜的季节到了，耐心耕耘者将获回报。此符文正反同义。', reversed: null },
  { glyph: 'ᛇ', name: 'Eihwaz', nameCn: '艾瓦兹', translit: 'EI/Z', keywords: ['紫杉', '坚韧'], upright: '生死之树般的韧性与守护，穿越低谷你会更结实。此符文正反同义。', reversed: null },
  { glyph: 'ᛈ', name: 'Perthro', nameCn: '佩斯罗', translit: 'P', keywords: ['命运', '未知'], upright: '命运骰盅正在摇响，未知的惊喜藏在下一掷。', reversed: '沉迷赌博式侥幸或秘密压身，有些牌不宜再翻。' },
  { glyph: 'ᛉ', name: 'Algiz', nameCn: '阿尔吉兹', translit: 'Z', keywords: ['守护', '连接'], upright: '麋鹿角般的天穹护佑你，直觉敏锐、贵人相扶。', reversed: '防护薄弱易受影响，收回伸太远的触角。' },
  { glyph: 'ᛊ', name: 'Sowilo', nameCn: '索维洛', translit: 'S', keywords: ['太阳', '胜利'], upright: '烈日当空的成功与清明，目标近在眼前。此符文正反同义。', reversed: null },

  // 第三埃特 —— 提尔：神性与人间
  { glyph: 'ᛏ', name: 'Tiwaz', nameCn: '提瓦兹', translit: 'T', keywords: ['正义', '勇气'], upright: '战神的胜利之箭，为正当之事挺身而出必有所得。', reversed: '信念动摇或方法失当，赢要赢得堂堂正正。' },
  { glyph: 'ᛒ', name: 'Berkano', nameCn: '贝尔卡诺', translit: 'B', keywords: ['萌芽', '孕育'], upright: '桦树抽新芽，新计划、新生命或新关系温柔萌发。', reversed: '成长受抑或操之过急，给嫩芽遮一阵风。' },
  { glyph: 'ᛖ', name: 'Ehwaz', nameCn: '艾瓦兹', translit: 'E', keywords: ['骏马', '信任'], upright: '人马一体的默契协作，可靠的伙伴让路变宽。', reversed: '信任裂痕或节奏不合，先修关系再赶路。' },
  { glyph: 'ᛗ', name: 'Mannaz', nameCn: '曼纳兹', translit: 'M', keywords: ['人性', '自我'], upright: '照见自我的明镜，以谦逊与智慧经营人际。', reversed: '自我膨胀或盲从他人，回到你自己的坐标。' },
  { glyph: 'ᛚ', name: 'Laguz', nameCn: '拉古兹', translit: 'L', keywords: ['流水', '直觉'], upright: '顺流而下的直觉之旅，跟随感受去往该去的地方。', reversed: '逆流硬游或情绪搁浅，允许自己随波片刻。' },
  { glyph: 'ᛜ', name: 'Ingwaz', nameCn: '英格瓦兹', translit: 'NG', keywords: ['种子', '完成'], upright: '一颗种子安静地成熟，阶段性的圆满近在咫尺。此符文正反同义。', reversed: null },
  { glyph: 'ᛞ', name: 'Dagaz', nameCn: '达加兹', translit: 'D', keywords: ['破晓', '顿悟'], upright: '黎明破晓的顿悟时刻，豁然开朗就在今天。此符文正反同义。', reversed: null },
  { glyph: 'ᛟ', name: 'Othala', nameCn: '奥瑟拉', translit: 'O', keywords: ['家园', '传承'], upright: '祖传的土地与根脉，从来处汲取前行的力量。', reversed: '传统成包袱或根基动摇，取舍传承是你的功课。' },
]

export function drawRunes(count: number, allowReversed: boolean): Array<{ rune: Rune; reversed: boolean }> {
  const pool = [...RUNES]
  const out: Array<{ rune: Rune; reversed: boolean }> = []
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = randInt(pool.length)
    const rune = pool.splice(idx, 1)[0]!
    out.push({ rune, reversed: allowReversed && Math.random() < 0.5 })
  }
  return out
}
