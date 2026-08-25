/** 解梦词典：纯本地梦境元素释义 + 组合解析引擎。文案刻意口语化，避免翻译腔。 */

export type DreamCategory = 'creature' | 'nature' | 'body' | 'action' | 'object' | 'place'

export const DREAM_CATEGORY_CN: Record<DreamCategory, string> = {
  creature: '生灵',
  nature: '天象',
  body: '身体',
  action: '行为',
  object: '物件',
  place: '场所',
}

export interface DreamEntry {
  id: string
  zh: string
  en: string
  category: DreamCategory
  /** 组合解析用的气质标签 */
  vibe: 'growth' | 'warning' | 'love' | 'wealth' | 'change' | 'rest'
  zhMeaning: string
  enMeaning: string
}

export const VIBE_CN: Record<DreamEntry['vibe'], string> = {
  growth: '成长',
  warning: '提醒',
  love: '感情',
  wealth: '钱袋',
  change: '转变',
  rest: '休整',
}

const D = (
  id: string,
  zh: string,
  en: string,
  category: DreamCategory,
  vibe: DreamEntry['vibe'],
  zhMeaning: string,
  enMeaning: string,
): DreamEntry => ({ id, zh, en, category, vibe, zhMeaning, enMeaning })

export const DREAMS: DreamEntry[] = [
  // ---------- 生灵 ----------
  D('snake', '蛇', 'Snake', 'creature', 'change',
    '蛇多半和"变"有关：要蜕皮的是你。最近某个旧习惯正在松手，别急着抓住它。',
    'Snakes signal shedding — an old habit of yours is loosening its grip. Let it.'),
  D('cat', '猫', 'Cat', 'creature', 'rest',
    '梦里的猫在提醒你学它一样过日子：该晒太阳晒太阳，该不理人不理人。',
    'The cat naps, you nap. It is permission to be selective and self-cared.'),
  D('dog', '狗', 'Dog', 'creature', 'love',
    '狗代表你信得着的那几段关系。想想最近是谁陪着你——记得回个消息。',
    'Dogs stand for the relationships you trust. Someone has been there lately; text them back.'),
  D('spider', '蜘蛛', 'Spider', 'creature', 'warning',
    '蜘蛛结网，可能是某件事正在被"织"得太复杂。检查一下有没有越缠越多的烂摊子。',
    'A spider weaves — so is some tangle in your life growing thread by thread? Trim it.'),
  D('fish', '鱼', 'Fish', 'creature', 'wealth',
    '水里的鱼常和钱与机会一起游。梦里抓没抓住不重要，醒着的时候手快一点。',
    'Fish swim with money and chances. Grabbing in the dream is optional; being quick while awake is not.'),
  D('bird', '鸟', 'Bird', 'creature', 'growth',
    '鸟是消息的腿。有封信、有个回复、有句话正在路上，最近留意收件箱。',
    'Birds carry news. A reply, a letter, an offer — something is inbound; keep an eye out.'),
  D('horse', '马', 'Horse', 'creature', 'growth',
    '马是劲头的化身。你这阵子憋着的劲儿需要出口，去跑实际的那一步。',
    'The horse is raw momentum looking for a gate. Take the practical step you keep postponing.'),
  D('bear', '熊', 'Bear', 'creature', 'warning',
    '熊出没，通常是你在护什么东西：面子、边界、或者一个决定。护可以，别护到僵住。',
    'A bear appears when you are guarding something — pride, a boundary, a decision. Guard, do not freeze.'),
  D('butterfly', '蝴蝶', 'Butterfly', 'creature', 'change',
    '蝴蝶不着急，但每一阶段都在变。你正处在毛虫和翅膀之间的那段，正常发育中。',
    'Butterflies change at their own pace. You are somewhere between caterpillar and wings — developing on schedule.'),
  D('rat', '老鼠', 'Rat', 'creature', 'warning',
    '老鼠爱啃边角料。检查一下时间和小钱都从哪个洞溜走的，堵上就好。',
    'Rats nibble at edges. Find the little leak draining your time or money, then patch it.'),

  // ---------- 天象 ----------
  D('rain', '下雨', 'Rain', 'nature', 'rest',
    '雨是天上替你哭的那场。情绪排过毒之后，地会变软，事情反而好办。',
    'Rain cries what you have held in. After it passes, the ground softens and things move easier.'),
  D('storm', '暴风雨', 'Storm', 'nature', 'warning',
    '梦里刮风下雨还打雷，多半是白天攒的压力找了个出口。找个安全的方式放放电。',
    'A storm dreams your daytime pressure loose. Discharge it safely before it picks its own moment.'),
  D('snow', '雪', 'Snow', 'nature', 'rest',
    '雪把一切盖住，世界安静。你需要的就是这种安静，哪怕只有十分钟。',
    'Snow muffles the world. What you need is exactly that quiet, even for ten minutes.'),
  D('sunshine', '出太阳', 'Sunshine', 'nature', 'growth',
    '梦里的太阳很直接：事情在往亮的方向走。趁着光好，把想做的事摆出来晒晒。',
    'Sunshine is blunt good news. Things are brightening; air your plans while it lasts.'),
  D('moon-dream', '月亮', 'Moon', 'nature', 'love',
    '月亮管心事。梦里抬头看月亮，说明有句话你藏得有点久了，挑个人说吧。',
    'The moon keeps secrets — including yours. One has been stored long enough; tell someone.'),
  D('flood', '发大水', 'Flood', 'nature', 'warning',
    '水漫上来，是情绪超容量的画面。不是坏事，是水位计。看看哪件事该开闸泄一泄。',
    'Flooding means feelings over capacity. Not a disaster — a gauge. Find which valve to open.'),
  D('rainbow', '彩虹', 'Rainbow', 'nature', 'growth',
    '彩虹只在雨后营业。你刚熬过的那摊事，正在结算一点点甜头。',
    'Rainbows open after rain. The mess you just waded through is paying out a little sweetness.'),
  D('fog', '起雾', 'Fog', 'nature', 'rest',
    '雾是"看不清就先别选"的提示。有些决定放到雾散再做，成本最低。',
    'Fog advises against choosing what you cannot see yet. Some decisions are cheapest after it lifts.'),
  D('earthquake', '地震', 'Earthquake', 'nature', 'change',
    '地基晃动，往往是某个"一直理所当然"的东西松了。晃完之后重新盖的更结实。',
    'An earthquake shakes what felt permanent. What gets rebuilt afterward tends to hold better.'),

  // ---------- 身体 ----------
  D('teeth-fall', '掉牙', 'Teeth falling', 'body', 'warning',
    '经典压力梦。牙和底气挂钩：是不是有件事让你觉得"咬不下去了"？',
    'The classic stress dream. Teeth tie to confidence — what has been too hard to chew lately?'),
  D('hair-loss', '掉头发', 'Hair falling', 'body', 'warning',
    '头发和精力条有关。梦里掉的其实是白天的消耗，先补觉再说别的。',
    'Hair tracks your energy bar. What falls in the dream drains during the day — sleep first.'),
  D('flying', '飞起来', 'Flying', 'body', 'growth',
    '飞是最诚实的自由指标。最近哪里让你觉得轻？多去那儿。',
    'Flying measures freedom honestly. Notice where life feels lighter lately — go there more.'),
  D('falling', '下坠', 'Falling', 'body', 'warning',
    '踩空的感觉来自失控感，而不是真的会摔。挑一件小事重新拿回控制权。',
    'The drop is about losing grip, not bruising. Reclaim control with one small thing.'),
  D('naked', '没穿衣服', 'Naked in public', 'body', 'warning',
    '全世界的社死名场面。怕暴露的其实不是身体，是某个"还没准备好给人看"的部分。',
    'The classic exposure dream. It is rarely about skin — it is the part of you not ready for viewing.'),
  D('eyes', '眼睛', 'Eyes', 'body', 'growth',
    '梦里盯着什么看，醒着就多看一眼那件事。你的注意力已经在给你指路了。',
    'Whatever you stare at in the dream deserves a second look awake. Attention is already pointing.'),

  // ---------- 行为 ----------
  D('chase', '被追', 'Being chased', 'action', 'warning',
    '追你的从来不是鬼，是拖了很久的那件事。回头请它喝个茶，把它办了。',
    'What chases you is never a monster — it is the postponed thing. Turn around and deal with it.'),
  D('exam', '考试', 'Taking an exam', 'action', 'warning',
    '毕业这么多年还梦见考试，说明心里还有个"怕不合格"。那个标准该更新了。',
    'Years later, exam dreams persist because some inner standard still grades you. Update the rubric.'),
  D('late', '迟到', 'Being late', 'action', 'warning',
    '迟到的梦是日程表在报警：答应太多，装不下。删一条，天塌不了。',
    'Lateness dreams are calendar alarms. You promised more than fits; drop one — the sky stays up.'),
  D('swimming', '游泳', 'Swimming', 'action', 'growth',
    '在水里还能往前，说明情绪再大你也划得动。这份水性，现实里也用得上。',
    'Swimming through water means you can stroke through feelings too. That skill travels.'),
  D('lost-way', '迷路', 'Getting lost', 'action', 'change',
    '迷路说明旧的地图过期了。你不是走错了，是走到了地图没画到的地方。',
    'Being lost means the old map expired. You are not wrong — you are simply off the printed area.'),
  D('argue', '吵架', 'Arguing', 'action', 'love',
    '梦里吵的那场架，对象往往不是那个人，是你没说出口的话。白天补说，语气可以软。',
    'The argument belongs to the unsaid sentence, not the person. Say it by daylight, gently.'),
  D('kiss', '接吻', 'Kissing', 'action', 'love',
    '吻是渴望靠近的快递单。收件人是谁不重要，重要的是你想要更多亲密这件事本身。',
    'A kiss is a delivery note for closeness. The name matters less than the wanting-more-itself.'),
  D('running-late-bus', '追车', 'Chasing a bus', 'action', 'change',
    '追车追的不是车，是一个"以为要错过了"的机会。它通常还有下一班。',
    'You chase the chance you fear missing. There is usually another bus — but walk faster anyway.'),
  D('cooking', '做饭', 'Cooking', 'action', 'rest',
    '梦里掌勺，是把生活重新拿回手里的小仪式。给自己好好做顿饭，真的管用。',
    'Cooking in a dream is a small ritual of taking life back into your own hands. Literally try it.'),
  D('crying', '大哭', 'Crying', 'action', 'rest',
    '梦里哭完特别轻松的话，那是眼泪在替你加班。醒来记得给它记个功。',
    'If the dream-cry feels relieving, those tears worked overtime for you. Credit them kindly.'),

  // ---------- 物件 ----------
  D('phone-broken', '手机坏掉', 'Broken phone', 'object', 'warning',
    '手机是连接的总闸。梦里它罢工，说明你有点被消息绑架了，断联半天试试。',
    'The phone is connection HQ. Its dream meltdown hints you need half a day off the grid.'),
  D('keys', '钥匙', 'Keys', 'object', 'change',
    '找不到的钥匙，是"还差一样东西就能开门"的感觉。差的那样多半不在抽屉里。',
    'Lost keys feel like one missing piece from an open door. That piece is rarely in a drawer.'),
  D('money-lost', '丢钱', 'Losing money', 'object', 'wealth',
    '梦里的钱走了，常常是提醒你算算真实账目：花销、报价、欠款，对一对。',
    'Dream money walks off to remind you: audit the real numbers — spending, quotes, IOUs.'),
  D('mirror', '镜子', 'Mirror', 'object', 'growth',
    '镜子里那位比你诚实。梦里照见什么状态，就是你现在偷偷知道的状态。',
    'The mirror-version of you skips pleasantries. Whatever state it showed is the one you suspect.'),
  D('car-broken', '车坏了', 'Broken-down car', 'object', 'warning',
    '车是你的推进系统。梦里抛锚，检查一下计划里哪个零件早该保养了。',
    'The car is your momentum. When it breaks down in a dream, some part of the plan needs service.'),
  D('gift', '收到礼物', 'Receiving a gift', 'object', 'love',
    '礼盒拆开的瞬间心情如何，就是你对"被喜欢"的真实态度。值得想一想。',
    'How unwrapping felt is how you truly take being liked. Worth a quiet think.'),
  D('book-dream', '书', 'Book', 'object', 'growth',
    '翻开的书页上有答案的影子。你想问的问题，其实已经读过了，回去翻笔记。',
    'The answer shadows something you already read. Go back through your notes.'),
  D('clock', '钟表', 'Clock', 'object', 'warning',
    '梦里盯着钟看，是身体在催："那件事拖够了吗？"deadline 不长牙，但它会突然到。',
    'Staring at clocks means one deadline is tiptoeing closer. It has no teeth — until suddenly it does.'),
  D('food-dream', '吃大餐', 'Feast', 'object', 'rest',
    '梦里吃得香，是胃和心一起喊饿。奖励一下自己，不用等什么日子。',
    'A delicious dream-feast means both stomach and heart are hungry. Reward yourself early.'),

  // ---------- 场所 ----------
  D('old-home', '老房子', 'Childhood home', 'place', 'rest',
    '回到老房子，是心里那个小孩想你了。翻翻旧照片，给现在的自己讲讲那时候的事。',
    'Visiting the old home means your younger self wants company. Flip through photos; retell a story.'),
  D('school', '学校', 'School', 'place', 'growth',
    '学校是"还在学"的象征。你最近在啃的东西，脑子已经给你登记入学了。',
    'School means enrollment: something new is being studied. Your brain already registered you.'),
  D('maze', '迷宫', 'Maze', 'place', 'change',
    '迷宫的好处是每条路都有尽头。选一条走到底，比站在原地猜快得多。',
    'Mazes reward commitment: any path ends somewhere. Walking beats guessing at the entrance.'),
  D('elevator', '电梯', 'Elevator', 'place', 'change',
    '电梯上上下下，对应你最近起落的期待感。到几楼按几楼，少受别人按钮的影响。',
    'Elevators mirror rising and sinking moods. Press your own floor — fewer borrowed stops that way.'),
  D('toilet', '厕所', 'Toilet', 'place', 'rest',
    '著名生理梦，但也有一层：你确实需要个能关门的地方。去找一间，字面意义上的。',
    'Partly biology, partly truth: you need a room with a lock. Find one, literally.'),
  D('water-ocean', '大海', 'Ocean', 'place', 'love',
    '海是情绪的总库存。风平浪静就享受，波涛汹涌就岸上待会儿，都不用硬闯。',
    'The ocean stores all feeling. Sail when calm, sit on the shore when rough — no heroics needed.'),
  D('mountain', '爬山', 'Mountain', 'place', 'growth',
    '山不会为你降低高度，但会记住你爬过的每一步。慢没关系，方向对就行。',
    'The mountain will not shrink for you, but it remembers each step. Slow is fine; upward counts.'),
  D('hotel', '旅馆', 'Hotel', 'place', 'change',
    '旅馆是过渡期的床。眼下这段"住着不算家"的日子，是有退房时间的。',
    'A hotel bed marks a transition. This not-quite-home stretch comes with a checkout date.'),
  D('bridge', '桥', 'Bridge', 'place', 'change',
    '桥是"从这头到那头"的中间态。你已经离开原地，也还没到对面——中间就是这样走的。',
    'A bridge is the middle state: off the old bank, short of the new one. Crossing looks like this.'),
]

/** 按关键词（中英、含别名）搜索梦境条目 */
const ALIAS: Record<string, string[]> = {
  snake: ['🐍', '长虫'],
  teeth: ['牙齿'],
  chase: ['追赶', '逃跑'],
  naked: ['裸奔', '裸体'],
  exam: ['测试'],
  flying: ['飞翔', '飞行'],
  flood: ['水灾'],
  'old-home': ['老家', '童年'],
  'money-lost': ['破财'],
  'phone-broken': ['手机'],
}

function dreamKeywords(d: DreamEntry): string[] {
  return [...(ALIAS[d.id] ?? []), d.zh, d.en.toLowerCase()]
}

export function searchDreams(keyword: string): DreamEntry[] {
  const kw = keyword.trim().toLowerCase()
  if (!kw) return DREAMS
  return DREAMS.filter(
    (d) =>
      d.zh.includes(kw) ||
      d.en.toLowerCase().includes(kw) ||
      dreamKeywords(d).some((k) => k.toLowerCase().includes(kw)),
  )
}
