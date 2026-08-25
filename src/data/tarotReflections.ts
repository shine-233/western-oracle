/** 塔罗自省问题库：每张牌配一个"问自己"的问题。大阿卡纳逐张手写；小阿卡纳由数字主题×花色气质组合而成。 */
import { locale } from '../lib/i18n'

export function L(pair: [string, string]): string {
  return locale.value === 'zh' ? pair[0] : pair[1]
}

/* ---------- 大阿卡纳（22 张逐张手写） ---------- */
const MAJOR_QA: Record<string, [string, string]> = {
  fool: ['如果不怕出丑，你明天会做的第一件傻事是什么？', 'If nobody could laugh at you, what glorious leap would you take tomorrow?'],
  magician: ['你手里其实已经有的那件"法器"，是什么？', 'Which tool do you already hold but keep calling a toy?'],
  'high-priestess': ['最近哪件事，你的直觉比证据先给出了答案？', 'Where did your gut answer arrive before the evidence did?'],
  empress: ['上一次好好款待自己，是什么时候？', 'When did you last treat yourself like a guest worth hosting?'],
  emperor: ['你现在最需要立的那条规矩，一句话怎么说？', 'State the one rule you most need — in one sentence.'],
  hierophant: ['哪些"大家都这么干"，其实你早就想改？', 'Which inherited rule are you done following just because everyone does?'],
  lovers: ['这个选择里，让你犹豫的到底是选项，还是怕选错？', 'Is the hesitation about the options — or about being wrong?'],
  chariot: ['想赢的这件事，方向盘和油门分别握在谁手里？', 'In this race, who holds the wheel and who holds the gas?'],
  strength: ['最近一次温柔地赢过对方（而不是吵赢），是怎么做到的？', 'Recall winning gently instead of loudly — how did that happen?'],
  hermit: ['如果你独自待一天不被找到，你最想躲起来想什么？', 'If you vanished for a day, what would you finally sit down to think?'],
  'wheel-of-fortune': ['正在转的这一轮里，哪部分是你能抓住的把手？', 'In the cycle currently turning, where is the handle you can grip?'],
  justice: ['这件事如果换成别人做、你来评，你会怎么判？', 'If someone else did this and you were judge, what would you rule?'],
  'hanged-man': ['有没有一件事，倒过来看反而说得通？', 'What starts making sense when you flip it upside down?'],
  death: ['哪个阶段其实已经结束了，只是你还留着它的钥匙？', 'Which chapter already ended — yet you kept its key?'],
  temperance: ['你生活里哪两种"原料"，兑得比例不对？', 'Which two ingredients of your life are mixed in the wrong ratio?'],
  devil: ['那个明知不好却停不下来的习惯，在替你挡什么？', 'Your guilty loop — what uncomfortable thing does it block for you?'],
  tower: ['如果必须推倒一样东西重建，你第一个想到的是什么？', 'If one thing must be demolished and rebuilt, what came to mind first?'],
  star: ['雨停之后，你想先对谁说晚安？', 'After the rain, whose goodnight would you text first?'],
  moon: ['此刻让你不安的画面里，有多少是事实，多少是滤镜？', 'Of tonight\'s uneasy picture, how much is fact, how much filter?'],
  sun: ['哪件小事让你毫无理由地开心？今天做它了吗？', 'Name one tiny thing that joys you for no reason. Did you do it today?'],
  judgement: ['那封一直没回的"召唤"——消息、电话或念头——还要放多久？', 'That unanswered calling — a text, a call, an itch — how long will it wait?'],
  world: ['这个循环走到哪儿了？给自己发个进度条吧。', 'Where are you on this cycle? Grant yourself a progress bar.'],
}

/* ---------- 小阿卡纳：数字主题 × 花色气质 ---------- */
const NUMBER_THEME: Record<string, { zh: string; en: string }> = {
  ace: { zh: '一粒新的种子落进手里——你要把它种在哪块土里？', en: 'A fresh seed landed in your palm — which soil will you plant it in?' },
  '2': { zh: '两个选择在拔河，你更舍不得弄坏哪一个？', en: 'Two options tug-of-war; which could you least bear to break?' },
  '3': { zh: '多出来的那一方，会给你带来什么新可能？', en: 'The third player just arrived — what new move becomes possible?' },
  '4': { zh: '现在拥有的这些，哪一样是你还没说出口的感谢？', en: 'Of what you hold, which deserves an overdue thank-you?' },
  '5': { zh: '这次失去或冲突，逼你看清了什么本来就该看的？', en: 'What did this loss or clash force you to finally see?' },
  '6': { zh: '谁曾在你需要时递过东西？现在轮到你递给谁？', en: 'Who once handed you something? To whom do you hand it now?' },
  '7': { zh: '快到手的当口，你在等运气还是再推一把？', en: 'So close now — are you waiting on luck or leaning in?' },
  '8': { zh: '重复练习的路上，今天和上周的你有什么不一样？', en: 'On the practice grind — how is today-you different from last-week-you?' },
  '9': { zh: '快要圆满之前，你还在为哪一点不安？', en: 'Almost whole — which sliver still keeps you up?' },
  '10': { zh: '这一局收尾时，你想让谁站在身边一起数成果？', en: 'As this closes, who stands beside you counting the harvest?' },
}

const SUIT_FLAVOR: Record<string, { zh: string; en: string }> = {
  wands: { zh: '（热情与行动的地界）', en: '(the realm of passion and action)' },
  cups: { zh: '（感情与心流的地界）', en: '(the realm of feeling and flow)' },
  swords: { zh: '（头脑与言语的地界）', en: '(the realm of mind and words)' },
  pentacles: { zh: '（现实与身体的地界）', en: '(the realm of body and matter)' },
}

function minorQuestion(suit: string, num: string): [string, string] {
  const theme = NUMBER_THEME[num] ?? NUMBER_THEME['2']!
  const flavor = SUIT_FLAVOR[suit] ?? { zh: '', en: '' }
  return [`${theme.zh}${flavor.zh}`, `${theme.en} ${flavor.en}`]
}

/** 取某张牌的自省问题 */
export function reflectionFor(cardId: string): string {
  if (MAJOR_QA[cardId]) return locale.value === 'zh' ? MAJOR_QA[cardId]![0] : MAJOR_QA[cardId]![1]
  // 小阿卡纳 id 形如 'cups-10' / 'wands-ace'
  const m = cardId.match(/^(wands|cups|swords|pentacles)-(\w+)$/)
  if (!m) return ''
  const q = minorQuestion(m[1]!, m[2]!)
  return locale.value === 'zh' ? q[0] : q[1]
}
