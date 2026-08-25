/** 手相阅览室：掌纹与掌丘的互动释义。文案口语化，自包含双语。 */
import { locale } from '../lib/i18n'

export function L(pair: [string, string]): string {
  return locale.value === 'zh' ? pair[0] : pair[1]
}

export interface PalmFeature {
  id: string
  kind: 'line' | 'mount'
  nameZh: string
  nameEn: string
  glyph: string
  /** 一句话本质 */
  zhEssence: string
  enEssence: string
  /** 展开细读 */
  zhDetail: string
  enDetail: string
  /** 自查小贴士 */
  zhTip: string
  enTip: string
}

const P = (
  id: string,
  kind: PalmFeature['kind'],
  nameZh: string,
  nameEn: string,
  glyph: string,
  zhEssence: string,
  enEssence: string,
  zhDetail: string,
  enDetail: string,
  zhTip: string,
  enTip: string,
): PalmFeature => ({ id, kind, nameZh, nameEn, glyph, zhEssence, enEssence, zhDetail, enDetail, zhTip, enTip })

export const PALM_FEATURES: PalmFeature[] = [
  P('heart', 'line', '感情线', 'Heart line', '♥',
    '掌心最上端的那条，管的是你怎么去爱、怎么表达在乎。',
    'The top line across the palm — how you love and how you show it.',
    '线长而清晰的人，把感情看得认真，不太玩暧昧；末端分叉的，心里常常同时住着理性和小任性。它管的不只是爱情，还有你对朋友、家人的那套表达系统。',
    'A long clear heart line marks someone who takes feelings seriously and skips the games. A forked end means reason and whim share an office upstairs — it governs friendships and family too, not just romance.',
    '如果最近总觉得"他怎么就不懂我"，看看是不是你自己的表达也换了频道。',
    'If lately nobody "gets you", check whether your own broadcast switched channels first.'),
  P('head', 'line', '智慧线', 'Head line', '☁',
    '中间那条横穿的，代表思考方式：你是直觉派还是推演派。',
    'The middle crosser — how you think: gut-first or proof-first.',
    '线又直又长的人做决定靠逻辑清单；微微弯向手腕的，想象力常年在营业。两条起点和生命线连在一起的，做事前爱纠结一阵，但一旦出发就很稳。',
    'A straight long head line decides by checklist; one curving toward the wrist keeps imagination on payroll. When it starts joined to the life line, you overthink before launch — then fly steady.',
    '纠结的时候给自己设个五分钟闹钟，到点就选，选完不回头。',
    'When stuck, set a five-minute timer: pick when it rings, then no take-backs.'),
  P('life', 'line', '生命线', 'Life line', '🌿',
    '绕着拇指根部的那条大弧线，说的是生命力与节奏，不是寿命。',
    'The big arc around the thumb base — vitality and rhythm, not lifespan.',
    '弧线宽阔的人恢复力惊人，摔一觉又能爬起来跑；线条浅的也别慌，那只是提醒你把作息当回事。它更像是你的"电量曲线"，而不是判决书。',
    'A wide arc bounces back from anything after one good sleep; a faint one simply nags you about bedtime. Read it as your battery curve, never a verdict.',
    '连续熬夜之后看看这条线——它不能预测什么，但你能。',
    'Glance at it after an all-nighter. It predicts nothing, but you know the truth.'),
  P('fate', 'line', '命运线', 'Fate line', '⇅',
    '从掌心往中指方向走的那条竖线，关于方向感：你觉得自己在往哪走。',
    'The vertical line toward the middle finger — your sense of direction.',
    '这条线的神奇之处在于它会"变"：换工作、搬家、人生转向的时候，它的走向和深浅都会跟着调整。有断口不是坏事，每个断口都对应一次你自己做的选择。',
    'Its magic is that it changes: new job, new city, new direction — the line redraws itself. Breaks are not flaws; every break maps a choice you made.',
    '如果你觉得迷茫，先动手做点小事，方向感是走出来的，不是想出来的。',
    'Feeling lost? Do something small. Direction comes from walking, not staring.'),
  P('sun', 'line', '太阳线', 'Sun line', '☀',
    '无名指下面那条短短的竖纹，传统上管名声和才华被看见的程度。',
    'The short vertical line under the ring finger — talent getting noticed.',
    '没有它不代表没才华，只代表你的高光还在路上或者你低调得过分。有它的人，做喜欢的事时自带聚光灯，别人容易记住你。',
    'No line does not mean no talent — maybe your spotlight is still shipping, or you hide too well. With one, doing what you love tends to get you remembered.',
    '把你做得最顺手的那件事公开分享一次，太阳线喜欢这种仪式。',
    'Share the thing you make effortlessly. Sun lines love that ritual.'),
  P('marriage', 'line', '婚姻线', 'Marriage line', '⚭',
    '小指根部下方的几条短横纹，关于亲密关系里你的样子。',
    'The short horizontal creases under the pinky — how you show up in intimacy.',
    '纹路深而平的，在感情里要的是安稳；稍微上翘的，永远需要一点新鲜空气。它们反映的是你对亲密的态度，而不是"会有几次婚姻"这种算命数字。',
    'Deep level creases want steadiness; gently rising ones need occasional fresh air. They describe your attitude to closeness — not a headcount of marriages.',
    '与其数纹路，不如想想上一段关系里你最舒服的瞬间是什么样的。',
    'Skip counting lines. Recall instead the moment you felt safest with someone.'),
  P('venus', 'mount', '金星丘', 'Mount of Venus', '🫀',
    '拇指根部的肉垫，掌管热情、审美和"活得带劲"的能力。',
    'The padded base under the thumb — passion, taste, appetite for life.',
    '饱满的金星丘常见于爱吃、爱美、爱热闹的人，冷了会蔫，暖了能发电。它软硬适中说明你有热情也懂得收，一按一个坑就要注意别把自己掏空。',
    'Plump here usually belongs to people who love food, beauty and company — powered by warmth. Firm-but-soft is ideal; if life flattens you lately, refill before pouring more.',
    '本周给自己安排一件纯粹因为开心才做的事，给金星丘充个值。',
    'Book one purely-for-fun thing this week. Top up the mount.'),
  P('jupiter', 'mount', '木星丘', 'Mount of Jupiter', '⚡',
    '食指根部下方，和 ambition、掌控欲、吃不吃得下责任有关。',
    'Below the index finger — ambition, ownership, appetite for responsibility.',
    '这里发达的人喜欢"说了算"，但好的那种：愿意扛事也愿意拍板。偏低也不用慌，只是你更适合当军师而不是旗手。',
    'A full mount loves being in charge the healthy way: taking the hit and making the call. A quieter one simply prefers strategist to flag-bearer.',
    '下次开会试着第一个发言，木星丘吃这一套。',
    'Speak first in the next meeting. Jupiters feed on that.'),
  P('saturn', 'mount', '土星丘', 'Mount of Saturn', '🏔',
    '中指根部下方，管定力、耐心和跟自己较劲的程度。',
    'Under the middle finger — grit, patience, and how hard you push yourself.',
    '这里的起伏和"自律"强相关：饱满的人说到做到，连自己都不放过；平坦的人在松弛感方面天赋异禀，需要外部节奏带着走。',
    'This rise tracks self-discipline: full means promises kept even to yourself; flat means born-relaxed, best carried by external rhythm.',
    '给自己立一个小到不可能失败的约定，土星丘最吃循序渐进。',
    'Make yourself one tiny unbreakable promise. Saturn respects gradual.'),
  P('apollo', 'mount', '太阳丘', 'Mount of Apollo', '🎨',
    '无名指根部下方，关于创造力、表现欲和"被看见"的欲望。',
    'Under the ring finger — creativity, expression, wanting to be seen.',
    '发达的太阳丘藏不住表达欲：做饭要摆盘、发朋友圈要修图、说话自带画面感。它是掌丘里的艺术家公寓，住得越满，越需要出口。',
    'A full Apollo cannot hide expression: plating matters, captions get edited, stories come with cinematography. The fuller the artist apartment, the more it needs a door.',
    '把一个私藏的小作品发出来，哪怕只有七个人看到。',
    'Publish one private little work — even for an audience of seven.'),
  P('mercury', 'mount', '水星丘', 'Mount of Mercury', '💬',
    '小指根部下方，管沟通、机敏和做买卖的天分。',
    'Under the pinky — communication, wit, the trader\'s instinct.',
    '这块饱满的人聊天自带润滑剂，谈判桌上能把气氛和价格一起谈好。欠发达的话也不亏，只是你更喜欢文字而不是嘴皮子。',
    'Full here lubricates every chat and closes deals with the mood intact. Quieter versions simply prefer writing to talking.',
    '今天主动开启一次你平时不会开始的对话，算给水星丘做操。',
    'Start one conversation you normally would not. Call it Mercury exercise.'),
]

/** 掌纹路径（viewBox 坐标），供 SVG 描边动画与热点使用 */
export const LINE_PATHS: Record<string, string> = {
  heart: 'M 98 186 C 128 166, 176 168, 208 188',
  head: 'M 100 212 C 136 224, 174 216, 206 196',
  life: 'M 106 192 C 92 228, 102 262, 134 276',
  fate: 'M 152 272 C 149 240, 154 210, 149 184',
  sun: 'M 180 268 C 177 246, 181 226, 177 206',
  marriage: 'M 196 174 L 218 164',
}
