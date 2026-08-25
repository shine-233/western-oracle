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
  'nav.history': ['历史', 'Grimoire'],
  'nav.settings': ['设置', 'Settings'],
  'app.soundOff': ['关闭音效', 'Mute'],
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
  'home.greeting.morning': ['早上好，今天的天空很新鲜', 'Good morning — fresh skies today'],
  'home.greeting.noon': ['午安，适合抽张牌歇一歇', 'Good afternoon — time for a card break'],
  'home.greeting.afternoon': ['下午好，宇宙正在派送好运', 'Good afternoon — fortune is in delivery'],
  'home.greeting.evening': ['晚上好，月亮上班啦', 'Good evening — the Moon is on shift'],
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
    '——不配置任何密钥也能获得成体系的完整解读。若想要更个性化的 AI 解读，可在',
    ' — complete readings with zero configuration. For personalised AI readings, drop any OpenAI-compatible API key into ',
  ],
  'home.ai.post2': [
    ' 中填入任意 OpenAI 兼容接口的 API Key：支持流式打字机输出、思考光球与多轮追问。密钥仅保存在你的浏览器 localStorage 中，请求直接从你的设备发往你指定的服务商。',
    ': streaming typewriter output, thinking orb and follow-up chat included. Keys live only in your localStorage; requests go straight from your device to your provider.',
  ],
  'mod.tarot.desc': ['洗牌 → 扇形摊开 → 凭直觉手动选牌的完整仪式感，78 张韦特公版插图，四大牌阵。', 'Full ritual: shuffle → arc spread → pick cards by instinct. 78 RWS cards, four spreads.'],
  'mod.astrology.desc': ['18 个星体点位的本命盘：星盘轮、宫位、相位、格局检测、星座×宫位百科全解。', '18-point natal chart: wheel, houses, aspects, pattern detection & full sign/house library.'],
  'mod.synastry.desc': ['双人比较盘 + 本地缘分引擎：缘分指数、星体对主题解读、相处建议，无需 AI 也能看。', 'Bi-wheel + local chemistry engine: soulmate index, planet-pair themes, advice — AI optional.'],
  'mod.transits.desc': ['此刻天空 × 你的本命盘，本地行运引擎标出今日主线剧情与压力测试区。', 'Live sky × your chart; the transit engine flags today\'s headline acts and pressure zones.'],
  'mod.numerology.desc': ['生命路径、表达数等五组核心数字，外加今日流年流月流日。', 'Five core numbers (life path, expression…) plus personal year / month / day.'],
  'mod.runes.desc': ['古弗萨克 24 符文抽取，维京人的智慧之石，正逆位皆可。', 'Draw from the 24 Elder Futhark stones of Viking wisdom, upright or reversed.'],
  'mod.library.desc': ['78 张牌全图鉴：大阿卡纳与四花色浏览、搜索、正逆位详解一键直达。', 'All 78 cards: browse by arcana/suit, search, tap for upright & reversed meanings.'],
  'mod.history.desc': ['每一次占卜都被记进魔法书，随时回看、生成星空分享图。', 'Every reading logged in your grimoire — revisit anytime, export starry share cards.'],

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
  'ai.tarot.title': ['AI 综合解读', 'AI Reading'],
  'ai.tarot.intro': ['配置 API Key 后，AI 会结合你的牌面给出个性化解读，还能继续追问。', 'Add an API key and AI will weave a personal reading from your cards — follow-ups welcome.'],

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
  'ai.astro.intro': ['配置 API Key 后可获得 AI 综合命盘解读，支持追问。', 'Add an API key for an AI synthesis of your chart — follow-ups welcome.'],

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
  'ai.syn.intro': ['配置 API Key 后，AI 会基于双方星盘与本地引擎结论给出更个性化的解读。', 'Add an API key and AI will deepen the engine\'s verdict with a personal touch.'],

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
  'ai.tr.intro': ['配置 API Key 后，AI 会结合本地引擎结论给出更个性化的行运建议。', 'Add an API key and AI will turn the engine\'s notes into personal guidance.'],

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
  'ai.num.intro': ['配置 API Key 后，AI 会结合你的灵数组合给出个性化解读，支持追问。', 'Add an API key for an AI take on your number matrix — follow-ups welcome.'],

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
  'ai.rune.intro': ['配置 API Key 后，AI 会结合符文含义给出个性化解读，支持追问。', 'Add an API key and AI will speak from the stones — follow-ups welcome.'],

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

  /* ---------- 设置 ---------- */
  'set.title': ['设置 · 神谕控制台', 'Settings · Oracle Console'],
  'set.hint': [
    '本站默认使用内置的本地规则文案进行解读。若想获得更个性化的 AI 解读，可配置任意 OpenAI 兼容接口（OpenAI、DeepSeek、Moonshot、本地 Ollama 等）。密钥只保存在你浏览器的 localStorage 中，请求从你的设备直接发往你填写的服务商，本站不经手任何数据。',
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

  /* ---------- 今日星历 ---------- */
  'alm.title': ['今日星历', 'Daily Almanac'],
  'alm.ruler': ['星期守护星', 'Weekday Ruler'],
  'alm.do': ['宜', 'Do'],
  'alm.dont': ['忌', 'Avoid'],
  'alm.color': ['幸运色', 'Lucky color'],
  'alm.number': ['幸运数', 'Number'],

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
