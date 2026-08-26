/**
 * 轻量双语方案：零依赖、响应式、localStorage 持久化。
 * 字典为 [zh, en] 元组；t() 按 locale 取值，支持 {name} 插值；
 * 未登记的 key 原样返回（便于渐进迁移）。
 */
import { computed, ref } from 'vue'

export type Locale = 'zh' | 'en'
const STORE_KEY = 'wo-locale'

function initialLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORE_KEY)
    if (saved === 'zh' || saved === 'en') return saved
    return navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en'
  } catch {
    return 'zh'
  }
}

export const locale = ref<Locale>(initialLocale())

export function setLocale(l: Locale): void {
  locale.value = l
  try {
    localStorage.setItem(STORE_KEY, l)
  } catch {
    /* noop */
  }
}

export function toggleLocale(): Locale {
  const next: Locale = locale.value === 'zh' ? 'en' : 'zh'
  setLocale(next)
  return next
}

/** [zh, en] */
type Pair = readonly [string, string]

const messages: Record<string, Pair> = {
  /* ---------- 全局 ---------- */
  'app.brand': ['神谕', 'ORACLE'],
  'nav.tarot': ['塔罗', 'Tarot'],
  'nav.astrology': ['占星', 'Chart'],
  'nav.synastry': ['合盘', 'Synastry'],
  'nav.transits': ['行运', 'Transits'],
  'nav.numerology': ['灵数', 'Numbers'],
  'nav.runes': ['符文', 'Runes'],
  'nav.library': ['牌库', 'Deck'],
  'nav.arcade': ['占卜坊', 'Arcade'],
  'nav.dreams': ['解梦', 'Dreams'],
  'nav.palmistry': ['手相', 'Palm'],
  'nav.musicbox': ['八音盒', 'Music Box'],
  'nav.pendulum': ['灵摆', 'Pendulum'],
  'nav.orrery': ['天象仪', 'Orrery'],
  'nav.moonbreath': ['呼吸房', 'Breath'],
  'nav.biorhythm': ['节律', 'Biorhythm'],
  'nav.journey': ['愚人之旅', 'Fool\'s Journey'],
  'nav.meihua': ['梅花易数', 'Plum Blossom'],
  'nav.history': ['历史', 'Grimoire'],
  'nav.settings': ['设置', 'Settings'],
  'navg.divine': ['占卜', 'Divination'],
  'navg.oracle': ['神谕', 'Oracles'],
  'navg.sky': ['星象台', 'Sky Lab'],
  'navg.play': ['神秘园', 'Playground'],
  'navg.east': ['东厢', 'Eastern Wing'],
  'nav.crystal': ['水晶球', 'Crystal Ball'],
  'nav.hours': ['行星时刻', 'Planet Hours'],
  'nav.gesture': ['手势占卜', 'Gesture'],
  'app.soundOff': ['关闭音效', 'Mute'],
  'app.top': ['回到顶部', 'Back to top'],
  'app.soundOn': ['开启音效', 'Unmute'],
  'footer.l1': ['✦ 所有计算均在你的浏览器本地完成，不上传任何数据 ✦', '✦ Everything runs locally in your browser. No data leaves your device. ✦'],
  'footer.l2': ['本站内容用于文化与娱乐目的，请理性看待占卜结果。牌面为 1909 年公版 Rider-Waite-Smith 插图。', 'For cultural & entertainment purposes only. Artwork: public-domain 1909 Rider-Waite-Smith deck.'],

  /* ---------- 公共 ---------- */
  'c.close': ['✕ 关闭', '✕ Close'],
  'c.upright': ['正位', 'Upright'],
  'c.reversed': ['逆位', 'Reversed'],
  'c.inverted': ['倒转', 'Inverted'],
  'c.keywords': ['关键词', 'Keywords'],
  'c.localTag': ['本地规则', 'local rules'],
  'c.houseShort': ['第{n}宫', 'House {n}'],

  /* ---------- 首页 ---------- */
  'home.hero': ['星辰不语，自有答案', 'The stars say nothing — yet they answer'],
  'home.greeting.night': ['夜深了，星星都醒着', 'Deep night — even the stars are awake'],
  'home.greeting.morning': ['早。天空刚开门。', 'Morning. The sky just opened.'],
  'home.greeting.noon': ['午安，抽张牌歇一会儿', 'Afternoon — take a card break'],
  'home.greeting.afternoon': ['下午三点半，运气开始派件。', 'Half past three — luck starts delivering.'],
  'home.greeting.evening': ['晚上好，月亮上班了', 'Good evening — the Moon is on shift'],
  'home.intro': [
    '{greet}{name}！一座纯浏览器端的西方占卜小站：无需注册、没有后端、数据不出本机。右下角的小巫女露娜知道很多星星的秘密，记得去戳戳她。',
    "{greet}{name}! A browser-only oracle den: no sign-up, no backend, no data leaving your device. Luna the pixel witch knows the stars' secrets — go poke her.",
  ],
  'home.dc.card': ["DAILY CARD · 每日一牌", "DAILY CARD"],
  'home.dc.rune': ["DAILY RUNE · 每日符文", "DAILY RUNE"],
  'home.dc.moon': ["MOON PHASE · 今日月相", "MOON PHASE"],
  'home.dc.says': ["ORACLE SAYS · 露娜说", "ORACLE SAYS"],
  'home.luna.full': ['满月之夜，愿望加倍灵！', 'Full moon tonight — wishes come double!'],
  'home.luna.new': ['新月许愿，正是时候～', 'New moon — perfect wishing hour~'],
  'home.luna.default': ['今天也要闪闪发光哦', 'Shine bright today too'],
  'home.luna.go': ['去抽一张牌 →', 'Draw a card →'],
  'home.voxel.title': ['露娜的 3D 小屋', "Luna's Voxel Cabin"],
  'home.voxel.desc': ['她从 2D 像素画被拉伸成了体素！拖拽她转圈圈，滚轮拉近看脸红。', 'Extruded from her 2D sprite into voxels! Drag to spin her, scroll to zoom in until she blushes.'],
  'home.ai.title': ['关于 AI 解读', 'About AI readings'],
  'home.ai.pre': [
    '每个模块都内置',
    'Every module ships with a ',
  ],
  'home.ai.mid': ['本地规则解读引擎', 'local rules engine'],
  'home.ai.post': [
    '——不填密钥也能拿到像模像样的完整解读。想要更贴你情况的说法，可以在',
    ' — full readings that hold up on their own. Want something more personal? Drop any OpenAI-compatible API key into ',
  ],
  'home.ai.post2': [
    ' 中填入任意 OpenAI 兼容接口的 API Key：支持流式打字机输出、思考光球与多轮追问。密钥仅保存在你的浏览器 localStorage 中，请求直接从你的设备发往你指定的服务商。',
    ': streaming typewriter output, thinking orb and follow-up chat included. Keys live only in your localStorage; requests go straight from your device to your provider.',
  ],
  'mod.tarot.desc': ['洗牌 → 扇形摊开 → 凭直觉手动选牌的完整仪式感，78 张韦特公版插图，四大牌阵。', 'Full ritual: shuffle → arc spread → pick cards by instinct. 78 RWS cards, four spreads.'],
  'mod.astrology.desc': ['18 个星体点位的本命盘：星盘轮、宫位、相位、格局检测、星座×宫位百科全解。', '18-point natal chart: wheel, houses, aspects, pattern detection & full sign/house library.'],
  'mod.synastry.desc': ['双人比较盘 + 本地缘分引擎：缘分指数、星体对主题解读、相处建议，不开 AI 也看得懂。', 'Bi-wheel + local chemistry engine: soulmate index, planet-pair themes, advice — reads fine without AI.'],
  'mod.transits.desc': ['此刻天空 × 你的本命盘，本地行运引擎标出今日主线剧情与压力测试区。', 'Live sky × your chart; the transit engine flags today\'s headline acts and pressure zones.'],
  'mod.numerology.desc': ['生命路径、表达数等五组核心数字，外加今日流年流月流日。', 'Five core numbers (life path, expression…) plus personal year / month / day.'],
  'mod.runes.desc': ['古弗萨克 24 符文抽取，维京人的智慧之石，正逆位皆可。', 'Draw from the 24 Elder Futhark stones of Viking wisdom, upright or reversed.'],
  'mod.library.desc': ['78 张牌全图鉴：大阿卡纳与四花色浏览、搜索、正逆位详解一键直达。', 'All 78 cards: browse by arcana/suit, search, tap for upright & reversed meanings.'],
  'mod.arcade.desc': ['四件口袋占卜玩具：3D 骰子、命运转盘、神签、记忆圣殿翻牌，专治选择困难。', 'Four pocket oracles: 3D dice, fortune wheel, omikuji slips and the Memory Sanctum.'],
  'mod.dreams.desc': ['解梦词典：搜一搜昨晚的怪梦，或挑三个元素拼一份专属解读。', 'Dream dictionary: search last night\'s weirdness or blend three elements.'],
  'mod.palmistry.desc': ['把左手当星空图：掌纹是星座连线，掌丘是星域，点亮就有得聊。', 'Your palm as a star chart: lines are constellations, mounts are nebulae.'],
  'mod.musicbox.desc': ['北斗七星八音盒：点星演奏，或让作曲骰子写一首十六步小曲。', 'The Big Dipper as a music box: play the stars or roll a 16-step tune.'],
  'mod.pendulum.desc': ['按住蓄力、松手发问的灵摆：前后为是，左右为否，画圈再等等。', 'Charge the pendulum, release, and read the swing: yes, no, or not yet.'],
  'mod.orrery.desc': ['真实天文历算驱动的太阳系轨道仪：加速时间，点行星看今日星座。', 'A real-ephemeris solar system: fast-forward time, tap planets for today\'s signs.'],
  'mod.moonbreath.desc': ['跟着今夜月相做 4-4-6 呼吸：星环随呼吸胀缩，三轮点亮满天小星星。', 'Breathe 4-4-6 with tonight\'s moon: the ring swells and shrinks; stars light per round.'],
  'mod.biorhythm.desc': ['体力/情绪/智力三条节律波：拖动时间轴，找你的高峰日和临界日。', 'Body/mood/mind waves over 23/28/33 days: scrub the timeline for peaks and critical days.'],
  'mod.journey.desc': ["22 张大牌的三幕滚动叙事：滚动即前进，愚人之路走到哪算哪。", "A three-act scroll saga of the 22 Majors — scroll to walk the Fool's road."],
  'mod.meihua.desc': ['梅花易数：心中浮现一个数，配上出生年月日时，六爻逐条起卦给你看。', 'Plum Blossom numerology: one surfaced number plus your birth time, six lines cast live.'],
  'mod.history.desc': ['每一次占卜都被记进魔法书，随时回看、生成星空分享图。', 'Every reading logged in your grimoire — revisit anytime, export starry share cards.'],
  'mod.crystal.desc': ['体素水晶球：拖拽旋转、滚轮推近，凝视到雾气炸开就是答案。', 'A voxel orb: drag to spin, wheel to zoom — gaze until the mist bursts with your answer.'],
  'mod.gesture.desc': ['摄像头手势抽牌：张掌蓄力、食指瞄准、握拳抓牌；无摄像头自动切鼠标模式。', 'Camera-free-will drawing: palm to charge, point to aim, fist to seize; falls back to mouse.'],
  'mod.hours.desc': ['行星时刻钟：按传统行星时规则标出今天每个小时的守护星与宜忌。', 'Planetary hours clock: each hour\'s ruling planet and what it favors, the classical way.'],

  /* ---------- 首页 · 人气榜 ---------- */
  'home.hall.title': ['人气榜', 'Hall of Fame'],
  'home.hall.sub': ['按占卜爱好者的关注度排序——不知道从哪开始？就从这里挑。', 'Ranked by divination-fan interest — start here if you feel lost.'],
  'home.hall.rank': ['人气 No.{n}', 'Popularity No.{n}'],
  'home.hall.enter': ['进入圣殿 →', 'Enter →'],
  'home.card.hot': ['热门', 'HOT'],
  'home.group.core': ['核心占卜', 'Core Oracle'],
  'home.group.core.sub': ['问大事，来这里', 'For the big questions'],
  'home.group.soul': ['身体神谕', 'Body & Soul'],
  'home.group.soul.sub': ['身体会说话，梦也是', 'Your body speaks; so do dreams'],
  'home.group.sky': ['星象台', 'Sky Lab'],
  'home.group.sky.sub': ['头顶的实时星空', 'The live sky overhead'],
  'home.group.play': ['神秘乐园', 'Mystic Playground'],
  'home.group.play.sub': ['玩着玩着就有了答案', 'Answers through play'],
  'home.group.east': ['东厢 · 东方术数', 'Eastern Wing'],
  'home.group.east.sub': ['来自东方的古老占法，供对比把玩', 'Ancient eastern arts, kept for comparison'],

  /* ---------- 塔罗 ---------- */
  'tarot.title': ['塔罗占卜', 'Tarot'],
  'tarot.hint': ['深呼吸，在心里默想你的问题：洗牌、摊开、然后凭直觉抽出属于你的牌。牌面为 1909 年公版 Rider-Waite-Smith 插图。', 'Breathe, hold your question in mind: shuffle, spread, then draw by instinct. Artwork: 1909 Rider-Waite-Smith.'],
  'tarot.spread': ['选择牌阵', 'Choose a spread'],
  'tarot.q': ['你的问题（可选，用于 AI 解读）', 'Your question (optional, feeds the AI)'],
  'tarot.q.ph': ['例如：我该不该换一份工作？', 'e.g. Should I change jobs?'],
  'tarot.allowRev': ['启用逆位', 'Allow reversals'],
  'tarot.start': ['✧ 开始洗牌仪式 · 抽 {n} 张 ✧', '✧ Begin ritual · draw {n} cards ✧'],
  'tarot.shuffling': ['正在洗牌… 在心里默念你的问题 ✧', 'Shuffling… whisper your question ✧'],
  'tarot.fanTip': ['从扇形牌堆中凭直觉点选 {total} 张', 'Pick {total} cards from the arc — trust your gut'],
  'tarot.fanDone': ['已选 {n} 张', '{n} picked'],
  'tarot.reset': ['← 重新设定', '← Reset'],
  'tarot.flipAll': ['翻开全部', 'Reveal all'],
  'tarot.again': ['↻ 再占一次', '↻ Draw again'],
  'tarot.newQ': ['换个问题', 'New question'],
  'tarot.reading': ['牌面解读', 'Card Reading'],
  'tarot.share': ['✦ 生成分享图', '✦ Share Image'],
  'tarot.flipHint': ['点击翻开 ✧', 'Tap to flip ✧'],
  'tarot.modalTip': ['小提示：再点一下可以收起弹窗～', 'Psst — click anywhere to close~'],
  'tarot.reflect': ['问自己', 'Ask yourself'],
  'ai.tarot.title': ['AI 综合解读', 'AI Reading'],
  'ai.tarot.intro': ['填好 Key 后，AI 会把这几张牌串成一个故事讲给你听，还能接着追问。', 'Add a key and AI will weave your cards into one story — keep asking if you like.'],

  /* ---------- 占星 ---------- */
  'astro.title': ['西洋占星 · 本命盘', 'Astrology · Natal Chart'],
  'astro.hint': ['输入出生年月日、时间（尽量精确到分钟，影响上升星座）与出生地坐标，全部计算在你的浏览器内完成。', 'Enter birth date, time (to the minute — it moves your Ascendant) and place. All math runs in your browser.'],
  'bf.date': ['出生日期', 'Birth date'],
  'bf.time': ['出生时间', 'Birth time'],
  'bf.tz': ['时区', 'Time zone'],
  'bf.city': ['出生城市（快捷选择）', 'Birth city (quick pick)'],
  'bf.manual': ['—— 手动输入经纬度 ——', '—— Enter coordinates manually ——'],
  'bf.lat': ['北纬（°）', 'Latitude N (°)'],
  'bf.lng': ['东经（°）', 'Longitude E (°)'],
  'astro.submit': ['绘制本命盘', 'Draw my chart'],
  'bf.submit': ['绘制星盘', 'Draw chart'],
  'synastry.aSubmit': ['录入 A 方星盘', 'Set person A'],
  'synastry.bSubmit': ['录入 B 方星盘', 'Set person B'],
  'transits.submit': ['生成我的行运盘', 'Cast my transits'],
  'err.date': ['请填写完整的出生日期与时间。', 'Please fill in a complete birth date & time.'],
  'err.coord': ['经纬度必须是有效数字。', 'Coordinates must be valid numbers.'],
  'err.calc': ['计算失败：{msg}', 'Calculation failed: {msg}'],
  'astro.facts': ['命盘要点', 'Chart Highlights'],
  'astro.asc': ['上升', 'Asc'],
  'astro.mc': ['天顶', 'MC'],
  'astro.ascDesc': [' —— 你给世界的第一印象', ' — the first impression you give the world'],
  'astro.mcDesc': [' —— 事业与社会形象的方向', ' — career & public-image compass'],
  'astro.elements': ['元素分布', 'Elements'],
  'astro.modalities': ['三大模式', 'Modalities'],
  'astro.planets': ['行星落座', 'Placements'],
  'astro.planetsTip': ['（点击行星看详解）', '(tap a planet for details)'],
  'astro.aspects': ['主要相位', 'Major Aspects'],
  'astro.aspectsTip': ['点击看含义', 'tap for meaning'],
  'astro.zodiac': ['十二星座 × 十二宫位', '12 Signs × 12 Houses'],
  'astro.zodiacTip': ['点击查看完整档案', 'tap for the full dossier'],
  'astro.quick': ['本命盘速读', 'Quick Reading'],
  'astro.patterns': ['星盘格局', 'Patterns'],
  'ai.astro.title': ['AI 命盘解读', 'AI Chart Reading'],
  'ai.astro.intro': ['让 AI 拿着你的星盘当面向你解释：为什么这颗星落在这宫，对你意味着什么。', 'Let AI walk your chart with you: why this planet landed in this house, and what it means for you.'],

  /* ---------- 合盘 ---------- */
  'syn.title': ['合盘 · Synastry', 'Synastry'],
  'syn.hint': ['两盘对照：外环是 A 方，内环是 B 方；虚线是两人星体之间的交叉相位，越紧的缘分越「吵」（也越深）。', 'Two wheels: outer = A, inner = B. Dashed lines are cross-aspects — the tighter, the louder (and deeper).'],
  'syn.personA': ['✦ A 方（默认读取本机档案）', '✦ Person A (loads saved profile)'],
  'syn.personB': ['✧ B 方', '✧ Person B'],
  'syn.overview': ['双方速览', 'At a Glance'],
  'syn.score': ['缘分指数', 'Chemistry Index'],
  'syn.sideA': ['A 方', 'A'],
  'syn.sideB': ['B 方', 'B'],
  'syn.local': ['本地缘分解读', 'Local Chemistry Reading'],
  'syn.localTag': ['无需 AI · 共 {n} 条交叉相位', 'no AI · {n} cross-aspects'],
  'syn.none': ['没有紧密交叉相位——你们是细水长流型（或者八竿子打不着，试试 AI 解读）。', 'No tight cross-aspects — slow-burn souls (or strangers; ask the AI).'],
  'ai.syn.title': ['AI 缘分解读', 'AI Chemistry Reading'],
  'ai.syn.intro': ['把两张盘都交给 AI，让它说说你们俩到底哪里合拍、哪里容易拌嘴。', 'Hand both charts to AI and hear it out: where you click, where you clash.'],

  /* ---------- 行运 ---------- */
  'tr.title': ['行运 · Transits', 'Transits'],
  'tr.hint': ['天上的星星此刻正跑到的位置，与你本命盘产生的共振。外环是你的本命盘，内环是此刻的天空。', 'Where the planets are right now, resonating with your natal chart. Outer ring: you. Inner ring: the living sky.'],
  'tr.sunNow': ['太阳此刻', 'Sun now'],
  'tr.moonNow': ['月亮此刻', 'Moon now'],
  'tr.phase': ['今日月相', 'Moon phase'],
  'tr.refreshed': ['刷新于', 'Refreshed'],
  'tr.refresh': ['刷新天象', 'Refresh sky'],
  'tr.headline': ['⭐ 今日主线剧情', '⭐ Today\'s Headline'],
  'tr.sky': ['此刻的天空', 'The Sky Right Now'],
  'tr.natalTitle': ['你的本命格局', 'Your Natal Signature'],
  'tr.list': ['正在发生的行运相位', 'Live Transit Aspects'],
  'tr.listTag': ['{n} 条 · 按紧密排序', '{n} · tightest first'],
  'tr.none': ['此刻没有紧密行运相位——享受平静的一天吧！', 'No tight transits right now — enjoy the calm!'],
  'ai.tr.title': ['AI 行运解读', 'AI Transit Reading'],
  'ai.tr.intro': ['让 AI 看看今天的星象压在你盘上哪个位置，提醒你该冲刺还是该躲一躲。', 'AI checks where today\'s sky presses on your chart — push hard or lay low.'],

  /* ---------- 灵数 ---------- */
  'num.title': ['生命灵数', 'Numerology'],
  'num.hint': ['毕达哥拉斯体系：数字是宇宙的语言。输入生日即可开始；填写英文或拼音名可解锁姓名相关数字。', 'Pythagoras\' system: numbers are the universe\'s language. Enter a birthday; add a Latin-alphabet name to unlock name numbers.'],
  'num.name': ['英文 / 拼音全名（可选）', 'Full name in Latin letters (optional)'],
  'num.namePh': ['例如：Zhang San', 'e.g. Zhang San'],
  'num.submit': ['计算灵数', 'Calculate'],
  'num.lifePath': ['生命路径数', 'Life Path'],
  'num.today': ['今日流日', 'Personal Day'],
  'num.year': ['流年', 'Year'],
  'num.month': ['流月', 'Month'],
  'num.day': ['流日', 'Day'],
  'num.nameHint': ['提示：表达数、灵魂愿望数与人格数需要英文字母参与计算。', 'Note: Expression, Soul Urge & Personality need a Latin-alphabet name.'],
  'row.lifePath.t': ['生命路径数', 'Life Path Number'],
  'row.lifePath.d': ['由完整生日得出，是你此生的主课题与人生方向。', 'From your full birthday — life\'s main lesson and direction.'],
  'row.birthday.t': ['生日数', 'Birthday Number'],
  'row.birthday.d': ['出生当天的数字，代表你与生俱来的天赋礼物。', 'The day you were born — your innate gift.'],
  'row.expression.t': ['表达数', 'Expression Number'],
  'row.expression.d': ['由姓名全拼得出，呈现你向外展现的才能与做事风格（需英文/拼音名）。', 'From your full name — talents and working style shown outward.'],
  'row.soulUrge.t': ['灵魂愿望数', 'Soul Urge Number'],
  'row.soulUrge.d': ['姓名中的元音所藏，是你内心深处真正的渴望。', 'Hidden in your vowels — what your soul truly craves.'],
  'row.personality.t': ['人格数', 'Personality Number'],
  'row.personality.d': ['姓名中的辅音所显，是他人眼中你的印象与气场。', 'Carried by consonants — the impression others receive.'],
  'ai.num.title': ['AI 灵数解读', 'AI Numbers Reading'],
  'ai.num.intro': ['把你的几个数字一起交给 AI，让它讲讲这组组合的性格故事。', 'Give your number set to AI and let it tell the story of that combo.'],

  /* ---------- 符文 ---------- */
  'rune.title': ['卢恩符文占卜', 'Rune Casting'],
  'rune.hint': ['古弗萨克（Elder Futhark）是北欧最古老的符文体系。静心默想问题，再从智慧之袋中抽取符文石。', 'The Elder Futhark is Scandinavia\'s oldest runic alphabet. Still your mind, then draw stones from the pouch of wisdom.'],
  'rune.count': ['抽取数量', 'How many stones'],
  'rune.one': ['单颗 —— 直指核心', 'One — straight to the core'],
  'rune.three': ['三颗 —— 境况 · 挑战 · 指引', 'Three — situation · challenge · guidance'],
  'rune.draw': ['探入符文袋 · 抽 {n} 颗', 'Reach into the pouch · draw {n}'],
  'rune.revealAll': ['全部翻开', 'Reveal all'],
  'rune.tap': ['点一下揭晓', 'Tap to reveal'],
  'rune.local': ['符文解读', 'Stone Reading'],
  'ai.rune.title': ['AI 符文解读', 'AI Rune Reading'],
  'ai.rune.intro': ['让 AI 替石头开口：这几枚符文放到你的问题里，到底在说什么。', 'Let AI speak for the stones: what these runes mean inside your question.'],

  /* ---------- 牌库 ---------- */
  'lib.title': ['塔罗牌图书馆', 'Card Library'],
  'lib.hint': ['78 张韦特塔罗全图鉴（1909 公版 RWS 插图 · 像素化重绘）。点击任意一张牌查看正逆位详解。', 'The full 78-card RWS gallery (public-domain 1909 art, pixel-remastered). Tap any card for upright & reversed meanings.'],
  'lib.f.all': ['全部', 'All'],
  'lib.f.major': ['大阿卡纳', 'Major Arcana'],
  'lib.f.wands': ['权杖', 'Wands'],
  'lib.f.cups': ['圣杯', 'Cups'],
  'lib.f.swords': ['宝剑', 'Swords'],
  'lib.f.pentacles': ['星币', 'Pentacles'],
  'lib.searchPh': ['🔍 搜索牌名 / 关键词…', '🔍 Search names / keywords…'],
  'lib.count': ['共 {n} 张', '{n} cards'],

  /* ---------- 历史 ---------- */
  'his.title': ['占卜历史 · Grimoire', 'Divination Grimoire'],
  'his.hint': ['每一次抽牌、排盘都被悄悄记在这本魔法书里（仅保存在你的浏览器本机，最多 200 条）。', 'Every draw & chart is quietly logged here (browser-local, max 200 entries).'],
  'his.all': ['全部', 'All'],
  'his.empty': ['这里还空空如也——去抽一张牌、排一张盘，历史就会开始生长。', 'Blank pages await — cast something and watch the grimoire grow.'],
  'his.share': ['✦ 生成分享图', '✦ Share Image'],
  'his.delete': ['删除', 'Delete'],
  'his.clear': ['清空全部历史', 'Clear all history'],
  'his.confirm': ['确定清空全部占卜历史？此操作不可撤销。', 'Clear the entire grimoire? This cannot be undone.'],
  'type.tarot': ['塔罗', 'Tarot'],
  'type.astrology': ['占星', 'Chart'],
  'type.synastry': ['合盘', 'Synastry'],
  'type.transit': ['行运', 'Transit'],
  'type.numerology': ['灵数', 'Numbers'],
  'type.rune': ['符文', 'Rune'],
  'type.dream': ['解梦', 'Dream'],
  'type.pendulum': ['灵摆', 'Pendulum'],
  'type.meihua': ['梅花易数', 'Plum Blossom'],
  'type.palmistry': ['手相', 'Palm'],
  'type.crystal': ['水晶球', 'Crystal'],
  'type.arcade': ['神签抽签', 'Oracle Lots'],
  'type.moonbreath': ['月相呼吸', 'Moon Breath'],
  'type.biorhythm': ['节律三重奏', 'Biorhythm'],
  'type.gesture': ['手势占卜', 'Gesture'],
  'type.journey': ['命运之旅', 'Journey'],

  /* ---------- 设置 ---------- */
  'set.title': ['设置 · 神谕控制台', 'Settings · Oracle Console'],
  'set.hint': [
    '解读默认走内置的本地规则，不联网也照样能用。想要更懂你的说法？填一个 OpenAI 兼容接口就行（OpenAI、DeepSeek、Moonshot、本地 Ollama 都可以）。密钥只待在你浏览器的 localStorage 里，请求也从你的设备直发服务商——本站连经手都省了。',
    'Readings work fully offline via built-in local rules. For personalised AI readings, plug in any OpenAI-compatible endpoint (OpenAI, DeepSeek, Moonshot, local Ollama…). Your key never leaves localStorage; requests go device-to-provider directly.',
  ],
  'set.base': ['接口地址（Base URL）', 'Base URL'],
  'set.key': ['API Key', 'API Key'],
  'set.model': ['模型名称', 'Model'],
  'set.basePh': ['https://api.openai.com/v1', 'https://api.openai.com/v1'],
  'set.keyPh': ['sk-...', 'sk-...'],
  'set.modelPh': ['gpt-4o-mini / deepseek-chat / qwen-plus ...', 'gpt-4o-mini / deepseek-chat / qwen-plus ...'],
  'set.save': ['保存配置', 'Save'],
  'set.test': ['测试连接', 'Test connection'],
  'set.testing': ['测试中…', 'Testing…'],
  'set.saved': ['已保存 ✓', 'Saved ✓'],
  'set.testOk': ['连接成功，模型回复：{r}', 'Connected. Model replied: {r}'],
  'set.testFail': ['连接失败：请检查地址、密钥、模型名，或浏览器到该接口的网络/CORS。', 'Connection failed: check URL, key, model name, or CORS/network from your browser.'],
  'set.cors': ['提示：浏览器直连第三方 API 需要对方允许跨域（CORS）。若测试失败但配置无误，通常是该服务商不支持浏览器端调用。', 'Heads-up: browser-direct APIs require CORS. If config is right but the test fails, the provider likely blocks browsers.'],
  'set.prefs': ['偏好设置', 'Preferences'],
  'set.sound': ['8-bit 音效', '8-bit Sound FX'],
  'set.soundOnSmall': ['已开启：翻牌、洗牌、AI 打字机都有声音', 'On: flips, shuffles and typewriter ticks all chirp'],
  'set.lowpower': ['低配模式（3D 降档）', 'Low-power mode (3D)'],
  'set.lowpowerSmall': ['星尘减半、关闭辉光，刷新后生效；低端设备默认开启。', 'Halves stardust, disables bloom — applies after refresh. Auto-on for low-end devices.'],
  'set.soundOffSmall': ['已静音', 'Muted'],
  'set.hist': ['占卜历史', 'Divination history'],
  'set.histSmall': ['本机共 {n} 条记录，点击清空', '{n} entries stored locally — click to clear'],
  'set.histConfirm': ['确定清空全部占卜历史？', 'Clear all divination history?'],
  'set.privacy': ['隐私说明', 'Privacy'],
  'set.privacyBody': ['除「你主动配置并使用的 AI 接口」外，本站不发起任何网络请求：没有统计、没有埋点、没有账号系统。你的出生信息与占卜历史仅存在于本机。', 'Apart from the AI endpoint you configure yourself, this site makes zero network requests: no analytics, no tracking, no accounts. Birth data and readings stay on your machine.'],

  /* ---------- AiChat ---------- */
  'chat.defaultTitle': ['AI 解读', 'AI Reading'],
  'chat.disabled': ['在「设置」中配置任意 OpenAI 兼容接口的 API Key 即可启用 AI 解读。上方的本地解读无需配置、始终可用。', 'Add any OpenAI-compatible API key in Settings to enable AI readings. The local readings above work with zero setup.'],
  'chat.stop': ['停止', 'Stop'],
  'chat.retry': ['重新解读', 'Retry'],
  'chat.begin': ['✧ 开始 AI 解读 ✧', '✧ Start AI reading ✧'],
  'chat.beginHint': ['基于本次占卜数据生成个性化解读，可继续追问。', 'Generates a personal reading from this session — follow-ups welcome.'],
  'chat.askPh': ['追问一句，比如「那我这周该注意什么？」', 'Ask a follow-up, e.g. “What should I watch for this week?”'],
  'chat.send': ['送出 ➤', 'Send ➤'],
  'chat.busy': ['解读中…', 'Reading…'],
  'chat.error': ['AI 连接失败：请到「设置」检查接口地址与密钥，或稍后重试。本地解读不受影响。', 'AI connection failed: check Settings for URL & key, or retry later. Local readings are unaffected.'],

  /* ---------- 体素露娜 ---------- */
  'voxel.hint': ['✧ 拖拽旋转 · 点她有惊喜 · 滚轮缩放 ✧', '✧ Drag to spin · poke her · scroll to zoom ✧'],
  'mood.jump': ['✧ 耶！', '✧ Yay!'],
  'mood.spin': ['↻ 转圈圈～', '↻ Wheee~'],
  'mood.wink': ['😉 嘿~', '😉 Hey~'],
  'mood.shy': ['😳 被、被发现了…', '😳 Y-you noticed…'],

  /* ---------- 神谕宠物园 ---------- */
  'pet.hint': ['✧ 点我一下试试 · 可以拖拽哦 ✧', '✧ poke me · drag to spin ✧'],
  'pet.nextTip': ['换一句', 'Next tip'],
  'pet.title.cat': ['见习塔罗师 · 墨墨', 'Apprentice · Momo'],
  'pet.cat.jump': ['牌要洗匀才有准头——看我的手法！', 'Even shuffling needs flair — watch this!'],
  'pet.cat.spin': ['兜帽转起来了，猫耳朵还在飞！', 'Spinning! My hood ears are still flying!'],
  'pet.cat.wink': ['这张牌我偷偷看过一眼…就一眼。', 'I peeked at one card… just one, promise.'],
  'pet.cat.shy': ['（把脸埋进兜帽里）猫耳不是装饰…是真的。', '(hides in hood) The cat ears are real, okay?!'],
  'pet.cat.cheer': ['牌阵齐了！接下来交给星星。', 'Spread complete! Leave the rest to the stars.'],
  'pet.cat.tip1': ['墨墨说：一个问题洗一次牌，问题越多牌越乱。', 'Momo: one question per shuffle — more questions just tangle the deck.'],
  'pet.cat.tip2': ['墨墨说：逆位像照片的倒影，细节藏在平时不看的那一侧。', 'Momo: reversals are reflections — details hide where you rarely look.'],
  'pet.cat.bond': ['（兜帽下的猫耳抖了抖）……好啦好啦，这张牌偷偷给你看正面。', '(hood ears flick) …Fine, fine. This one card, I\'ll peek at it for you.'],
  'pet.owl.bond': ['教授摘下单片镜：这份星图复印件，拿去，别外传。', 'Prof. removes the monocle: here — a copy of my star chart. Keep it quiet.'],
  'pet.title.owl': ['星象教授 · 阿斯特拉', 'Prof. Astraea'],
  'pet.owl.jump': ['黄经算到小数点后两位，完美落地。', 'Longitudes to two decimals — flawless landing.'],
  'pet.owl.spin': ['转一圈等于走过十二宫，很划算。', 'One spin equals all twelve houses. Quite efficient.'],
  'pet.owl.wink': ['单片镜后面眨眼，也算观测记录的一种。', 'A wink behind the monocle still counts as an observation.'],
  'pet.owl.shy': ['（帽子上的星星集体暗了一下）', '(every star on my hat dimmed at once)'],
  'pet.owl.cheer': ['本命盘绘制完毕，全体起立鼓掌！', 'Chart complete! A standing ovation, please!'],
  'pet.owl.tip1': ['阿斯特拉说：上升是递出去的名片，太阳才是你本人。', 'Astraea: your rising is the card you hand out; the Sun is who keeps it.'],
  'pet.owl.tip2': ['阿斯特拉说：刑相位吵得凶，但成长最快的也是它。', 'Astraea: squares argue loudest — and grow you fastest.'],
  'pet.title.numi': ['数字魔法使 · Numi', 'Numeria · Numi'],
  'pet.numi.jump': ['蹦！1+1=快乐的2！', 'Boing! 1+1=happy 2!'],
  'pet.numi.spin': ['数字在头顶转成漩涡啦～', 'Numbers are swirling over my head~'],
  'pet.numi.wink': ['偷偷告诉你：今天是幸运数7哦…大概。', 'Psst: today\'s lucky number is 7… probably.'],
  'pet.numi.shy': ['（把自己卷成一个0）', '(rolls itself into a 0)'],
  'pet.numi.cheer': ['约减完成！答案闪闪发光！', 'Reduction complete! The answer sparkles!'],
  'pet.numi.tip1': ['Numi说：生命路径数是课程表，不是判决书。', 'Numi: your life path is a syllabus, not a verdict.'],
  'pet.numi.tip2': ['Numi说：11、22、33 是主数，能量加倍，作业也加倍。', 'Numi: master numbers 11/22/33 double the power AND the homework.'],
  'pet.numi.bond': ["（帽尖的星星连闪三下）你是我今天最喜欢的整数。", "(the hat-star blinks thrice) You are my favourite integer today."],
  'pet.title.golem': ['符文萨满 · Runa', 'Rune Shaman · Runa'],
  'pet.golem.jump': ['（斗篷一鼓，人已离地三寸。）', '(cloak billows; three inches off the ground.)'],
  'pet.golem.spin': ['法杖划出的圈，是最老的结界。', 'The staff draws circles older than walls.'],
  'pet.golem.wink': ['胸口符文亮了一下——今天宜提问。', 'My rune glowed: a good day for asking.'],
  'pet.golem.shy': ['（缩进石斗篷，只剩苔藓露在外面。）', '(retracts into the cloak; only moss shows.)'],
  'pet.golem.cheer': ['符文落定，刻进石头的答案不会跑。', 'Runes settled. Answers carved in stone do not run away.'],
  'pet.golem.tip1': ['Runa说：抽符文前先深呼吸三次，石头听得见急躁。', 'Runa: breathe three times first — stones hear impatience.'],
  'pet.golem.tip2': ['Runa说：倒转的符文不凶，它只是从背面跟你说话。', 'Runa: reversed runes are not angry — they speak from another side.'],
  'pet.golem.bond': ["（法杖轻点你肩）符文说，你被记进石头里了。", "(staff taps your shoulder) The runes carved you into stone."],
  'pet.title.twins': ['小爱神 · Cupie', 'Cupid · Cupie'],
  'pet.twins.jump': ['翅膀扑棱两下就能飞——好吧，是跳。', 'Two wing-flaps and I fly! …fine, it was a hop.'],
  'pet.twins.spin': ['转出来的粉红圈圈，是心形的哦。', 'My pink swirl is heart-shaped, see?'],
  'pet.twins.wink': ['左边wink，右边也跟着wink。', 'One wink left, one wink right — fair is fair.'],
  'pet.twins.shy': ['（光环滑下来，正好盖住脸。）', '(the halo slips down, hiding the blush.)'],
  'pet.twins.cheer': ['缘分指数出炉！掌声在哪里！', 'Compatibility score ready! Applause, please!'],
  'pet.twins.tip1': ['Cupie说：合盘不是打分，是画你们的合作地图。', 'Cupie: synastry is not scoring — it maps how you two cooperate.'],
  'pet.twins.tip2': ['Cupie说：金火再来电，日常还得靠月亮合拍。', 'Cupie: Venus-Mars sparks fly, but the Moon pays the rent.'],
  'pet.twins.bond': ["两颗心同时跳快一拍——听到了吗？", "Both hearts skipped a beat — hear that?"],
  'pet.title.comet': ['彗星骑手 · Comet', 'Sky Rider · Comet'],
  'pet.comet.jump': ['帚柄一压，跃过半个天顶！', 'Pressed the broom down — cleared half the sky!'],
  'pet.comet.spin': ['空中转体三周半，彗尾保持造型。', 'Triple spin mid-air; the tail held its pose.'],
  'pet.comet.wink': ['行运过境，眨眼即是信号。', 'A transit passes — every blink is a signal.'],
  'pet.comet.shy': ['（把扫帚横过来挡住脸。）', '(tilts the broom sideways as a shield.)'],
  'pet.comet.cheer': ['今日天象已更新！出发！', 'Today\'s sky updated! Let\'s go!'],
  'pet.comet.tip1': ['Comet说：行运是天气，本命盘是气候；出门看天，安家看气候。', 'Comet: transits are weather, charts are climate — dress daily, build wisely.'],
  'pet.comet.tip2': ['Comet说：水逆不可怕，可怕的是把锅全甩给水星。', 'Comet: Mercury retrograde is fine — blaming Mercury for everything is not.'],
  'pet.comet.bond': ["（彗尾扫过你手心）尾巴借你摸一下，仅此一次。", "(comet-tail brushes your palm) You may touch the tail. Once."],
  'pet.title.mist': ['雾语占卜师 · Mist', 'Mist Speaker · Mist'],
  'pet.mist.jump': ['（抱紧水晶球跳起）球里的星星都在晃！', '(hugs the orb mid-hop) The stars inside are wobbling!'],
  'pet.mist.spin': ['转圈时雾会散开一秒——别眨眼。', 'The mist clears for one second when I spin. Don\'t blink.'],
  'pet.mist.wink': ['（隔着水晶球对你眨眼）双筒望远镜效果。', '(winks through the orb) Free telescopic effect.'],
  'pet.mist.shy': ['（把脸埋到球后面）球说今天不营业……我说了不算。', '(hides behind the orb) The orb says closed today… I just relay.'],
  'pet.mist.cheer': ['雾散了！答案比想象中清晰！', 'The fog lifted! The answer is clearer than feared!'],
  'pet.mist.tip1': ['Mist说：问题越模糊，雾就越浓；先把自己问明白。', 'Mist: the vaguer the question, the thicker the fog — ask yourself first.'],
  'pet.mist.tip2': ['Mist说：水晶球不生产答案，它只是让答案提前到货。', 'Mist: the orb doesn\'t make answers; it just delivers them early.'],
  'pet.mist.bond': ['雾雾把水晶球举到你面前——里面映着你的脸：「这是今天最亮的星。」', 'Mist holds the orb up to you — your face glows inside: "Brightest star today."'],

  /* ---------- 今日星历 ---------- */
  'alm.title': ['今日星历', 'Daily Almanac'],
  'alm.ruler': ['星期守护星', 'Weekday Ruler'],
  'alm.do': ['宜', 'Do'],
  'alm.dont': ['忌', 'Avoid'],
  'alm.color': ['幸运色', 'Lucky color'],
  'alm.number': ['幸运数', 'Number'],
  'alm.streak': ['连续占卜 {n} 天', '{n}-day streak'],

  /* ---------- 是/否 快问 ---------- */
  'tarot.yn.title': ['是 / 否 快问', 'Yes / No Quick Read'],
  'tarot.yn.hint': ['心里默念一个是非题，抽一张，牌会给你倾向和建议。', 'Hold a yes-or-no question, draw one card for its lean and advice.'],
  'tarot.yn.draw': ['抽一张看答案', 'Draw the answer'],
  'tarot.yn.again': ['换个问题再抽', 'Ask again'],
  'tarot.yn.yes': ['偏向「是」', 'Leans YES'],
  'tarot.yn.no': ['偏向「否」', 'Leans NO'],

  /* ---------- 卢恩：今日一符 ---------- */
  'rune.daily.title': ['今日一符', 'Rune of the Day'],

  /* ---------- 古典文献折叠彩蛋 ---------- */
  'src.tarot.summary': ['📜 古典文献 · 点开深读', '📜 Classical sources — tap to dive in'],
  'src.astro.summary': ['📜 Ptolemy《Tetrabiblos》Book I · 研究数据', '📜 Ptolemy, Tetrabiblos Book I · research data'],
  'src.rune.summary': ['📜 卢恩诗原文 · Bruce Dickins 1915（公版）', '📜 Original rune poems — Bruce Dickins 1915 (public domain)'],

  /* ---------- 行运：下一段月相倒计时 ---------- */
  'tr.nextPhase': ['下一月相', 'Next moon'],
  'tr.inDays': ['约 {d} 天后', 'in ~{d} days'],

  /* ---------- 灵数：数字约减链 ---------- */
  'num.chain': ['生命路径 · 数字约减链', 'Life Path · digit reduction'],
  'num.chainHint': ['把生日所有数字一路相加，直到剩下一位（或主数）。点一下重播。', 'Sum every birth digit down to a single one (or a master). Click to replay.'],

  /* ---------- 月相 ---------- */
  'moon.0.name': ['新月', 'New Moon'],
  'moon.0.desc': ['适合播种愿望、开启新计划的日子。', 'Plant wishes; start new plans.'],
  'moon.1.name': ['蛾眉月', 'Waxing Crescent'],
  'moon.1.desc': ['行动力萌芽，迈出第一步吧。', 'Momentum sprouts — take step one.'],
  'moon.2.name': ['上弦月', 'First Quarter'],
  'moon.2.desc': ['遇到阻力的考验期，坚持就是胜利。', 'Friction tests you — persist and win.'],
  'moon.3.name': ['盈凸月', 'Waxing Gibbous'],
  'moon.3.desc': ['成果渐渐丰满，调整细节冲刺。', 'Fruit fattens — polish details, then sprint.'],
  'moon.4.name': ['满月', 'Full Moon'],
  'moon.4.desc': ['能量顶点，适合庆祝、感恩与释放。', 'Peak energy: celebrate, thank, release.'],
  'moon.5.name': ['亏凸月', 'Waning Gibbous'],
  'moon.5.desc': ['开始做减法，把收获消化成智慧。', 'Subtract; digest harvest into wisdom.'],
  'moon.6.name': ['下弦月', 'Last Quarter'],
  'moon.6.desc': ['断舍离的好时机，放下不再需要的。', 'Declutter season — let go of the excess.'],
  'moon.7.name': ['残月', 'Waning Crescent'],
  'moon.7.desc': ['静养休整，为新周期积蓄力量。', 'Rest and recharge for the next cycle.'],
}

export type Params = Record<string, string | number>

/** 翻译：按当前语言取字典元组，支持 {param} 插值；未知 key 原样返回 */
export function t(key: string, params?: Params): string {
  const pair = messages[key]
  let out = pair ? pair[locale.value === 'zh' ? 0 : 1] : key
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      out = out.split(`{${k}}`).join(String(v))
    }
  }
  return out
}

export function useI18n() {
  return {
    t,
    locale,
    isZh: computed(() => locale.value === 'zh'),
    setLocale,
    toggleLocale,
  }
}
