/**
 * 扩展文案字典：本文件承载「主题 / 水晶球 / 太阳回归」等新模块的双语文案。
 * 刻意与 i18n.ts 分离，避免与其他并行改动互相踩踏；用法与 t() 一致：
 *   tt('key') / tt('key', { n: 3 })
 */
import { locale } from './i18n'

type Pair = [string, string]

const M: Record<string, Pair> = {
  /* ---------- 主题画廊 ---------- */
  'theme.title': ['主题衣橱', 'Theme Wardrobe'],
  'theme.hint': ['换一套配色，整个神谕屋会跟着换壁纸、烛光和按钮。偏好存在本机。', 'Pick a palette — the whole oracle house changes its wallpaper, candlelight and buttons. Saved locally.'],
  'theme.applied': ['已穿上 ✓', 'Worn ✓'],
  'theme.apply': ['试穿', 'Try on'],

  /* ---------- 水晶球 ---------- */
  'crystal.nav': ['水晶球', 'Crystal Ball'],
  'crystal.title': ['水晶球 · 今日一问', 'Crystal Ball · Daily Question'],
  'crystal.hint': ['心里想一个问题，问一次就够了——同一件事一天只答一遍，再问它就装睡。', 'Hold one question in mind. Ask once a day — ask again and it pretends to sleep.'],
  'crystal.placeholder': ['写下你想问的事（可不填）…', 'What do you want to know? (optional)…'],
  'crystal.ask': ['凝视水晶球', 'Gaze into the Orb'],
  'crystal.gazing': ['雾气翻涌中……', 'The mist is churning…'],
  'crystal.againTomorrow': ['明天再来问它吧。', 'Come back tomorrow.'],
  'crystal.lucky': ['宜', 'Good for'],
  'crystal.hour': ['时辰', 'Hour window'],
  'crystal.count': ['今天已经问过 {n} 次', 'Asked {n} time(s) today'],
  'crystal.drag': ['拖拽旋转 · 滚轮推近', 'drag to spin · wheel to zoom'],
  'crystal.hist': ['最近问过的', 'Recent asks'],

  /* ---------- 行星时 ---------- */
  'hours.nav': ['行星时', 'Planet Hours'],
  'hours.title': ['行星时 · 今日择时', 'Planetary Hours'],
  'hours.hint': ['古巴比伦人把白天和黑夜各分成 12 段，七颗星按次序轮值——找对时段做事，比硬熬省力。', 'The ancients split day and night into 12 hours each, seven planets taking turns. Pick your moment; skip the grind.'],
  'hours.loc': ['位置', 'Location'],
  'hours.useGeo': ['用我的定位', 'Use my location'],
  'hours.now': ['现在', 'Now'],
  'hours.sunrise': ['日出 {t}', 'Sunrise {t}'],
  'hours.sunset': ['日落 {t}', 'Sunset {t}'],
  'hours.daySeg': ['日间 12 时', 'Day 12 hours'],
  'hours.nightSeg': ['夜间 12 时', 'Night 12 hours'],
  'hours.rulerIs': ['值守：{p}', 'On duty: {p}'],
  'hours.range': ['{a} – {b}', '{a} – {b}'],
  'hours.goodFor': ['宜', 'Good for'],
  'hours.avoid': ['避', 'Avoid'],
  'hours.polarHint': ['今天太阳不升不落，行星时休息。', 'Polar day/night today — planet hours are off duty.'],
  'hours.pickTitle': ['想做点什么？帮你把对应的时段点亮', 'What are you up to? Let me light up the good hours'],
  'hours.matchHint': ['亮着的 {n} 段都合适，挑一段顺路的。', '{n} glowing hour(s) fit — take whichever is convenient.'],

  /* ---------- 行星时·活动分类 ---------- */
  'cat.deal': ['谈合作 · 签约', 'Deals & signing'],
  'cat.love': ['恋爱 · 和好', 'Love & making up'],
  'cat.study': ['学习 · 考试', 'Study & exams'],
  'cat.fight': ['运动 · 硬仗', 'Workouts & battles'],
  'cat.career': ['汇报 · 露脸', 'Pitch & exposure'],
  'cat.rest': ['休息 · 顾家', 'Rest & family'],
  'cat.tidy': ['断舍离 · 理账', 'Declutter & accounts'],

  /* ---------- 行星时·小知识 ---------- */
  'lore.title': ['行星时是怎么来的', 'Where planet hours come from'],
  'lore.p1': ['七颗古典行星按「迦勒底次序」轮值：土、木、火、日、金、水、月，一段一小时。黎明第一个小时的值守星就是当天的日主——周日归太阳，周一归月亮，往后排。', 'Seven classical planets take turns in Chaldean order — Saturn, Jupiter, Mars, Sun, Venus, Mercury, Moon — one per hour. The ruler of the first hour after sunrise rules the whole day: Sunday belongs to the Sun, Monday to the Moon, and so on.'],
  'lore.p2': ['白天和黑夜各自均分成 12 段，所以夏天的行星时长、冬天的短。它量的是太阳的时间，不是钟表的时间。', 'Daylight and night are each split into 12 parts, so summer hours run long and winter ones short. This is the sun\'s clock, not the wall clock.'],
  'lore.tip': ['用法很简单：先挑要做的事，看环上哪几段亮了，挑顺路的一段去办。不必掐秒。', 'How to use: pick what you need doing, watch which segments glow, and go during one of them. No stopwatch needed.'],

  /* ---------- 太阳回归盘 ---------- */
  'sr.title': ['太阳回归盘 · Solar Return', 'Solar Return Chart'],
  'sr.hint': ['太阳每年都会走回你出生时的位置，那一瞬间起的天象就是你这一年的「年度盘」。', 'Each year the Sun returns to your birth position — the sky at that instant is your chart for the year.'],
  'sr.calc': ['算今年的回归时刻', 'Cast this year\'s return'],
  'sr.moment': ['回归时刻（本地时间）', 'Return moment (local)'],
  'sr.srChart': ['回归盘', 'SR chart'],
  'sr.vsNatal': ['回归 × 本命 主要相位', 'SR × natal key aspects'],
  'sr.ascInHouse': ['回归上升落在你本命第 {n} 宫', 'SR Ascendant falls in your natal house {n}'],
  'sr.done': ['已排好今年回归盘。', 'This year\'s return chart is ready.'],
  'sr.until': ['距离你的年度重启还有', 'Your yearly reboot arrives in'],
  'sr.since': ['本次年度重启已过去', 'Your yearly reboot was'],
}
export function tt(key: string, params?: Record<string, string | number>): string {
  const pair = M[key]
  if (!pair) return key
  let s: string = locale.value === 'zh' ? pair[0] : pair[1]
  if (params) {
    for (const k of Object.keys(params)) s = s.split(`{${k}}`).join(String(params[k]))
  }
  return s
}

/** 主题名与描述的便捷取法（zh/en） */
export function themeText(
  def: { nameCn: string; nameEn: string; descCn: string; descEn: string },
  kind: 'name' | 'desc',
): string {
  const zh = kind === 'name' ? def.nameCn : def.descCn
  const en = kind === 'name' ? def.nameEn : def.descEn
  return locale.value === 'zh' ? zh : en
}

/* ---------- 水晶球签文池：口语化短句，避免排比腔 ---------- */
export const OMENS: Pair[] = [
  ['答案已经是「等」了，不是不行，是还差点火候。', 'The answer is "wait" — not no, just not done yet.'],
  ['去做那个你拖了两周的小事，转机会从那里来。', 'Do that small thing you\'ve put off for two weeks — the opening hides there.'],
  ['有人在偷偷帮你说话，你还不知道是谁。', 'Someone is quietly speaking up for you. You don\'t know who yet.'],
  ['今天别做决定，去散步，答案会在路上找你。', 'Don\'t decide today. Take a walk; the answer will find you mid-route.'],
  ['钱的事稳住别动，动了就漏。', 'Hands off the money matter — moving it now leaks it.'],
  ['你想的那个人这两天会主动出现，装作不意外。', 'That person you\'re thinking of will show up soon. Act unsurprised.'],
  ['该拒绝的就说拒绝，你的客气正在被人当便宜占。', 'Say no where needed — your politeness is being discounted.'],
  ['身体比塔罗牌诚实，先去睡觉。', 'Your body is more honest than tarot. Sleep first.'],
  ['旧事重提不是坏事，这次把话说完。', 'Revisiting the old topic is fine — finish the sentence this time.'],
  ['有个消息在路上，慢是慢了点，内容不错。', 'News is on the way. Slow, but good content.'],
  ['别看别人的进度条，你的关卡不一样。', 'Stop watching other people\'s progress bars — your level differs.'],
  ['直觉这次是对的，记下来，以后它会更准。', 'Your gut is right this time. Write it down; it gets sharper with practice.'],
  ['卡住的地方缺的不是努力，是一句开口问的话。', 'What\'s stuck doesn\'t need effort — it needs one question asked out loud.'],
  ['小财有，别嫌小。', 'Small money comes in. Don\'t scoff at small.'],
  ['那件你觉得搞砸的事，对方根本没放心上。', 'The thing you think you ruined? They barely noticed.'],
  ['适合收拾屋子。真的，运气的入口有点乱。', 'Tidy your room. Really — luck can\'t find the door.'],
  ['你在等一个道歉，其实你自己也知道等不到，翻篇吧。', 'You\'re waiting for an apology you\'ll never get. Turn the page.'],
  ['今天说的话会被记住，挑好的说。', 'Words said today will be remembered. Choose the kind ones.'],
  ['考试、面试、汇报——穿那件你幸运的衣服，不是迷信，是状态。', 'Exam, interview, pitch — wear your lucky outfit. Not superstition; posture.'],
  ['有人想找你合作，先看合同再看交情。', 'A collaboration offer comes. Read the contract before the friendship.'],
  ['你最近做的梦不是白做的，拿个小本子记下来。', 'Your recent dreams aren\'t nothing. Keep a notebook.'],
  ['放下手里第三件事，前两件就成了。', 'Drop the third thing on your plate; the first two will finish.'],
  ['远方的消息比你想象的近，这周留意邮箱。', 'Distant news is closer than you think. Watch your inbox this week.'],
  ['别在晚上十点后做任何和钱有关的选择。', 'No money decisions after 10 p.m. None.'],
  ['你担心的最坏结果，概率上约等于彩票中大奖，安心。', 'The worst case you fear has lottery-odds likelihood. Relax.'],
  ['今天适合把想说的话发出去，对方正等着。', 'Send the message you\'ve drafted. They\'re waiting.'],
  ['旧物里藏着线索，翻翻抽屉和相册。', 'Clues hide in old things — check drawers and albums.'],
  ['你的对手也在熬夜，但你可以不用熬，赢在效率不在时长。', 'Your rival stays up late too. You don\'t have to — win on efficiency, not hours.'],
  ['想学的那个东西今晚就打开看十分钟，别收藏了就当学会了。', 'Open that thing you want to learn tonight — ten minutes. Stop bookmarking as if it counts.'],
  ['最近总遇到的那只猫/狗/小孩，是提醒你生活还有点甜。', 'That cat/dog/kid keeps crossing your path — a reminder life still has sugar in it.'],
  ['这周把欠人家的那句谢谢说了，运气喜欢有来有回。', 'Say the thank-you you owe this week. Luck likes reciprocity.'],
  ['手机少刷一小时，你会突然想起来自己原来喜欢什么。', 'One hour less scrolling, and you\'ll suddenly remember what you actually enjoy.'],
  ['那扇你觉得关死的门，其实只是没装把手——推推侧面看看。', 'The door you think is locked just has no handle. Try pushing from the side.'],
  ['适合删掉通讯录里那个名字。你懂的。', 'Time to delete that one contact. You know the one.'],
  ['明天穿得比平时正式一点，会有人对你多说一句话。', 'Dress one notch sharper tomorrow; someone will give you an extra sentence.'],
  ['今天绕远路走走，你缺的不是时间是一个新视角。', 'Take the long way today. You don\'t lack time — you lack a new angle.'],
  ['那件「以后再说」的事，就定在后天吧。别再拖第三次。', 'That "later" thing? Schedule it for the day after tomorrow. Third delay breaks the streak.'],
  ['有人会还你一笔小钱或一个小人情，收下，别说不用。', 'Someone repays a small favor. Take it — don\'t wave it off.'],
  ['今晚的月亮适合许一个具体的小愿，越具体越灵。', 'Tonight\'s moon takes one specific small wish. Specificity is the magic.'],
]

/* ---------- 行星时活动宜忌 ---------- */
export const PLANET_GOOD: Record<string, Pair[]> = {
  Saturn: [
    ['还债、理账', 'Paying debts, bookkeeping'],
    ['定规矩、立边界', 'Setting rules and boundaries'],
    ['清理旧物、告别过去', 'Decluttering, letting go'],
    ['做长期计划', 'Long-term planning'],
  ],
  Jupiter: [
    ['签约、谈合作', 'Signing, partnerships'],
    ['学习、考证、请教前辈', 'Studying, asking a mentor'],
    ['理财规划', 'Financial planning'],
    ['出门远行、订机票', 'Travel booking'],
  ],
  Mars: [
    ['运动、比赛、硬仗', 'Workouts, contests, hard pushes'],
    ['断舍离下狠手', 'Ruthless decluttering'],
    ['修理东西', 'Fixing and repairing'],
    ['当面把话说明白', 'Saying hard things face to face'],
  ],
  Sun: [
    ['汇报、演讲、露脸', 'Presentations, showing up'],
    ['见长辈或上级', 'Meeting seniors or bosses'],
    ['拍形象照、更新简介', 'Photos, updating profiles'],
    ['给自己定个奖赏', 'Rewarding yourself'],
  ],
  Venus: [
    ['约会、表白、和好', 'Dates, confessions, making up'],
    ['打扮、买衣服、护肤', 'Grooming, shopping'],
    ['看展、听音乐', 'Art shows, music'],
    ['下厨做道好菜', 'Cooking something lovely'],
  ],
  Mercury: [
    ['写方案、回邮件', 'Writing, replying to emails'],
    ['谈判、面试、考试', 'Negotiations, interviews, exams'],
    ['短途出行、取快递', 'Short trips, errands'],
    ['整理文件和桌面', 'Organizing files and desks'],
  ],
  Moon: [
    ['做饭、收拾屋子', 'Cooking, tidying home'],
    ['陪家人、照顾情绪', 'Family time, self-care'],
    ['睡觉补觉', 'Catching up on sleep'],
    ['泡个热水澡', 'A long hot bath'],
  ],
}

export const PLANET_AVOID: Record<string, Pair> = {
  Saturn: ['办喜酒、开派对', 'Weddings and parties'],
  Jupiter: ['抠细节、精打细算', 'Nitpicking details'],
  Mars: ['谈和解、签长约', 'Peace talks, long contracts'],
  Sun: ['低调躲事（藏不住）', 'Laying low (it won\'t work)'],
  Venus: ['催债、撕破脸', 'Debt collecting, confrontations'],
  Mercury: ['拍板重大决定（信息易变）', 'Final decisions (info shifts)'],
  Moon: ['做长远承诺', 'Long-term commitments'],
}

/** 吉时推荐：活动 → 值守星 */
export const ACTIVITY_PLANETS: Record<string, string[]> = {
  deal: ['Jupiter', 'Mercury'],
  love: ['Venus'],
  study: ['Mercury', 'Jupiter'],
  fight: ['Mars'],
  career: ['Sun'],
  rest: ['Moon'],
  tidy: ['Saturn'],
}

export const CRYSTAL_GOODFOR: Pair[] = [
  ['开口提要求', 'Asking for things'],
  ['整理与断舍离', 'Decluttering'],
  ['把话说开', 'Clearing the air'],
  ['签短期约定', 'Short-term commitments'],
  ['独处充电', 'Solo recharge'],
  ['请客吃饭', 'Treating someone to a meal'],
  ['早点睡觉', 'Early bedtime'],
  ['动手做手工', 'Making things by hand'],
  ['给旧友发消息', 'Messaging an old friend'],
  ['把钱放定存', 'Parking money safely'],
  ['翻出相册看一晚', 'An evening with old photos'],
  ['把计划写下来再睡', 'Writing plans before bed'],
  ['去菜市场逛一圈', 'Wandering a market'],
  ['认真吃一顿早饭', 'A proper breakfast'],
  ['删掉一个坏习惯的入口', 'Deleting one bad habit trigger'],
  ['给自己买束花', 'Buying yourself flowers'],
]

/* ---------- 水晶球内部用：按日期+问题稳定取签 ---------- */
export function hashSeed(s: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  return h >>> 0
}
