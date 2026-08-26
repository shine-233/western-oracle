/** 梅花易数：数字+出生年月日时 起卦引擎。
 *  方法：先天八卦数（乾一兑二离三震四巽五坎六艮七坤八），
 *  上卦=(生年+生月+生日+心念数) mod 8；下卦=(生年+生月+生日+生时+心念数) mod 8；
 *  动爻=(全部相加) mod 6（0 作 6）。除尽取 8/6 的民间惯例在此一并处理。 */

export interface Trigram {
  num: number // 先天数 1-8
  name: string
  sym: string // ☰☱☲☳☴☵☶☷
  bits: '111' | '110' | '101' | '100' | '011' | '010' | '001' | '000' // 自下而上
  nature: [string, string] // 卦德
  element: [string, string]
}

export const TRIGRAMS: Trigram[] = [
  { num: 1, name: '乾', sym: '☰', bits: '111', nature: ['刚健', 'Heaven'], element: ['金', 'Metal'] },
  { num: 2, name: '兑', sym: '☱', bits: '110', nature: ['喜悦', 'Lake'], element: ['金', 'Metal'] },
  { num: 3, name: '离', sym: '☲', bits: '101', nature: ['光明', 'Fire'], element: ['火', 'Fire'] },
  { num: 4, name: '震', sym: '☳', bits: '100', nature: ['奋动', 'Thunder'], element: ['木', 'Wood'] },
  { num: 5, name: '巽', sym: '☴', bits: '011', nature: ['顺入', 'Wind'], element: ['木', 'Wood'] },
  { num: 6, name: '坎', sym: '☵', bits: '010', nature: ['险陷', 'Water'], element: ['水', 'Water'] },
  { num: 7, name: '艮', sym: '☶', bits: '001', nature: ['静止', 'Mountain'], element: ['土', 'Earth'] },
  { num: 8, name: '坤', sym: '☷', bits: '000', nature: ['柔顺', 'Earth'], element: ['土', 'Earth'] },
]

export function trigramByNum(n: number): Trigram {
  const idx = ((n - 1) % 8 + 8) % 8
  return TRIGRAMS[idx]!
}

/* ---------- 六十四卦：键 = `上卦名|下卦名` ---------- */
interface Hexa {
  zh: string
  en: string
  /** 一句断语 */
  zhWord: string
  enWord: string
}

const H = (zh: string, en: string, zhWord: string, enWord: string): Hexa => ({ zh, en, zhWord, enWord })

/** 表结构：HEX[上卦][下卦]，按传统象读法命名 */
export const HEX: Record<string, Record<string, Hexa>> = {
  乾: {
    乾: H('乾为天', 'Qian / Heaven', '天行刚健，事在必行，宜守正而进。', 'Momentum is heaven-sent — advance, but stay true.'),
    兑: H('泽天夬', 'Guai / Breakthrough', '决而去之，当断则断，迟则有变。', 'Decide now and cleanly; hesitation invites leaks.'),
    离: H('火天大有', 'Dayou / Great Holdings', '盛大丰有，众望所归，记得分润他人。', 'Abundance peaks — share it and it lasts.'),
    震: H('雷天大壮', 'Dazhuang / Great Vigour', '声势正盛，戒骄戒躁，力用在实处。', 'Full vigour — spend force on substance, not noise.'),
    巽: H('风天小畜', 'Xiaochu / Small Taming', '力量小聚，暂且蓄养，不宜强推。', 'Gather small, bide a while — pushing waits.'),
    坎: H('水天需', 'Xu / Waiting', '云聚待雨，时机未熟，饮食宴乐候之。', 'Rain has not fallen yet. Wait well, feast lightly.'),
    艮: H('山天大畜', 'Daxu / Great Taming', '厚积薄发，止而后动，动则大成。', 'Stored strength moves mountains — one patient push left.'),
    坤: H('地天泰', 'Tai / Peace', '上下交通，安泰亨通，好景须惜。', 'Heaven and earth commune — harmony at its best; cherish it.'),
  },
  坤: {
    乾: H('天地否', 'Pi / Standstill', '闭塞不通，静守为上，物极必反。', 'Stuck doors everywhere — stillness now, reversal soon.'),
    坤: H('坤为地', 'Kun / Earth', '厚德载物，以柔行事，顺势承载。', 'Carry much by yielding much — earth wins slowly.'),
    兑: H('泽地萃', 'Cui / Gathering', '人聚物聚，趁热成事，防乐极生疑。', 'Crowds and resources gather — act warm, verify twice.'),
    离: H('火地晋', 'Jin / Progress', '日出地上，晋升向明，稳步可见。', 'Sunrise over fields — steady visible progress.'),
    震: H('雷地豫', 'Yu / Delight', '顺而有备则乐，乐而不淫方久。', 'Joy favours the prepared; keep delight on a leash.'),
    巽: H('风地观', 'Guan / Contemplation', '登高望远，多看少动，观人亦自观。', 'Climb and observe — watch others, watch yourself.'),
    坎: H('水地比', 'Bi / Alliance', '亲比相扶，择善而从，孤行不利。', 'Stick close to the good ones — going solo falters.'),
    艮: H('山地剥', 'Bo / Splitting Apart', '剥落之时，旧的不去新的不来，护住根本。', 'Things flake away — protect the root, let go of leaves.'),
  },
  兑: {
    乾: H('天泽履', 'Lü / Treading', '如履虎尾，谨慎前行，礼让则吉。', 'Treading behind a tiger — courtesy keeps you whole.'),
    坤: H('地泽临', 'Lin / Approach', '大势将至，居高临下，宽厚待人。', 'Your moment approaches — arrive generous.'),
    兑: H('兑为泽', 'Dui / Lake', '两泽相连，言说喜悦，慎口舌之快。', 'Two lakes mirror joy — watch the witty tongue.'),
    离: H('火泽睽', 'Kui / Opposition', '同床异梦，小事可谐，大事缓议。', 'Small things agree, big things glare — postpone the big.'),
    震: H('雷泽归妹', 'Guimei / Marrying', '情急事急，名不正则后患，宜正其位。', 'Hasty unions tangle later — set titles straight first.'),
    巽: H('风泽中孚', 'Zhongfu / Inner Truth', '诚信相感，中心愿遂，笃实最灵。', 'Sincerity carries the day — keep it plain and true.'),
    坎: H('水泽节', 'Jie / Limitation', '节而有度，开支立约皆宜，过度则苦。', 'Set limits kindly — overspend either wallet or will.'),
    艮: H('山泽损', 'Sun / Decrease', '损己利人，先舍后得，减法即进法。', 'Give something up — decrease here is gain next.'),
  },
  离: {
    乾: H('天火同人', 'Tongren / Fellowship', '志同道合，公开共事，忌私心小圈。', 'Kindred spirits unite — keep the circle open.'),
    坤: H('地火明夷', 'Mingyi / Darkening Light', '光入地中，藏锋守拙，暗中有路。', 'Dim your light deliberately — the dark path still leads.'),
    兑: H('泽火革', 'Ge / Revolution', '旧历已尽，革故鼎新，众人信服再动手。', 'Change season is here — move once minds agree.'),
    离: H('离为火', 'Li / Fire', '附丽光明，重明相继，稳燃不燥。', 'Burn bright but attached — steady flame beats wildfire.'),
    震: H('雷火丰', 'Feng / Abundance', '丰盛之极，明动相资，盛时思危。', 'Peak abundance — think of shade at noon.'),
    巽: H('风火家人', 'Jiaren / Family', '各正其位，内外有别，家齐事成。', 'Put each in their place — order at home orders the work.'),
    坎: H('水火既济', 'Jiji / After Completion', '已成之局，谨守如初，满则溢。', 'Done — but done things leak; keep the seals tight.'),
    艮: H('山火贲', 'Bi / Grace', '文饰有度，质胜于文，小妆即可出门。', 'A little polish goes far; substance outdresses style.'),
  },
  震: {
    乾: H('天雷无妄', 'Wuwang / Innocence', '守正无妄，自然得福，一念贪求便折。', 'No ulterior moves — pure intent collects luck.'),
    坤: H('地雷复', 'Fu / Return', '一阳来复，迷途知返，七日而来。', 'The turn comes back — return trips are blessed.'),
    兑: H('泽雷随', 'Sui / Following', '随时而动，择善而从，跟对人最要紧。', 'Follow the right one at the right hour — that is the whole trick.'),
    离: H('火雷噬嗑', 'Shihe / Biting Through', '中间有梗，咬而合之，断案宜明。', 'Something sticks in the middle — bite through, fairly.'),
    震: H('震为雷', 'Zhen / Thunder', '惊雷一动，惧者得福，闻声而修。', 'Thunder scares the wise into readiness — fortune follows.'),
    巽: H('风雷益', 'Yi / Increase', '损上益下，迁善改过，进益无量。', 'Give downward, mend upward — increase compounds.'),
    坎: H('水雷屯', 'Zhun / Difficulty', '草创之难，盘桓立足，莫求速展。', 'Start-up thickets — plant your feet, skip the sprint.'),
    艮: H('山雷颐', 'Yi / Nourishment', '慎言节食，自求口实，养身亦养德。', 'Watch mouth and meals both — nourish on your own terms.'),
  },
  巽: {
    乾: H('天风姤', 'Gou / Encounter', '不期而遇，勿取非分，见微知远。', 'Chance meeting — admire, don\'t grab; small signs speak loud.'),
    坤: H('地风升', 'Sheng / Ascending', '积小成高，柔步上行，见大人吉。', 'Step by step upward — call on mentors en route.'),
    兑: H('泽风大过', 'Daguo / Great Excess', '栋桡之象，非常之事，量力而行。', 'The beam bends — extraordinary loads need honest limits.'),
    离: H('火风鼎', 'Ding / Cauldron', '鼎新调和，养贤成味，换锅正好炖汤。', 'Fresh cauldron, fresh stew — retool and nourish.'),
    震: H('雷风恒', 'Heng / Duration', '持之久远，不改其守，恒则通。', 'Lasting comes from not switching tracks mid-run.'),
    巽: H('巽为风', 'Xun / Wind', '随风入微，谦逊行事，反复申命。', 'Wind enters everywhere — repeat instructions gently.'),
    坎: H('水风井', 'Jing / The Well', '井养不穷，常修常汲，迁邑不改泉。', 'The town moves, the well stays — maintain your source.'),
    艮: H('山风蛊', 'Gu / Decay', '器久生蛊，整饬更新，乱后可治。', 'Old vessels breed worms — renovate boldly, order follows.'),
  },
  坎: {
    乾: H('天水讼', 'Song / Conflict', '争讼宜解不宜深，中吉终凶，和为贵。', 'Litigation drains — settle midway; winning suits lose sleep.'),
    坤: H('地水师', 'Shi / The Army', '行伍有序，师出有名，纪律即胜算。', 'March with cause and discipline — order wins wars.'),
    兑: H('泽水困', 'Kun / Confinement', '泽无水困，言不信则困，少说多做。', 'The lake ran dry — talk less, grind quietly through.'),
    离: H('火水未济', 'Weiji / Before Completion', '事将成未成，狐涉水濡尾，慎终为要。', 'Almost across the river — wet-tailed foxes hurry last steps.'),
    震: H('雷水解', 'Xie / Deliverance', '雷雨作解，百结顿开，速则无功缓则成。', 'Storm breaks the knot — release works better than force.'),
    巽: H('风水涣', 'Huan / Dispersion', '风行水上，涣然冰释，聚人心为要。', 'Ice melts on wind — regroup hearts after scatter.'),
    坎: H('坎为水', 'Kan / Abyss', '重险叠陷，守信维心，行险而不失其信。', 'Double rapids — hold faith mid-current, learn the channel.'),
    艮: H('山水蒙', 'Meng / Youth', '蒙昧初开，虚心求教，匪我求童蒙。', 'Beginner\'s mist — ask sincerely and teachers appear.'),
  },
  艮: {
    乾: H('天山遁', 'Dun / Retreat', '远小人遁亨，退一步海阔，善退者勇。', 'Withdraw gracefully — the good retreat outflanks the stubborn.'),
    坤: H('地山谦', 'Qian / Modesty', '谦尊而光，裒多益寡，低调者得。', 'Modesty gains what pride loses — stay low, rise far.'),
    兑: H('泽山咸', 'Xian / Influence', '二气感应，以诚相感，莫以机心。', 'True resonance runs on honesty — schemes kill the signal.'),
    离: H('火山旅', 'Lü / Sojourning', '旅居在外，小心谨严，客处不宜久。', 'Traveling light among strangers — tidy, humble, temporary.'),
    震: H('雷山小过', 'Xiaoguo / Small Exceeds', '小事可过，大事守正，飞鸟宜下不宜上。', 'Overdo the small courtesies; fly low on the big calls.'),
    巽: H('风山渐', 'Jian / Gradual Progress', '鸿渐于陆，循序渐进，婚嫁亦宜徐。', 'Wild geese advance by stages — slow courtship, sure landing.'),
    坎: H('水山蹇', 'Jian / Obstruction', '前有险阻，反身修德，遇蹇则止图。', 'Road blocked ahead — turn inward, fix yourself, redraw route.'),
    艮: H('艮为山', 'Gen / Mountain', '止于当止，时止则止，动静不失其时。', 'Stop exactly where stopping is right — timing is the art.'),
  },
}

export interface MeihuaCast {
  upper: Trigram
  lower: Trigram
  /** 动爻 1-6（自下而上） */
  moving: number
  hexa: Hexa
  /** 推演过程（供透明展示） */
  steps: Array<{ label: [string, string]; formula: string }>
}

export interface MeihuaInput {
  /** 心中浮现的数字 */
  picked: number
  /** 出生年月日 + 24小时制小时 */
  year: number
  month: number
  day: number
  hour: number
}

const mod8 = (n: number): number => ((n - 1) % 8 + 8) % 8 + 1
const mod6 = (n: number): number => ((n - 1) % 6 + 6) % 6 + 1

export function castMeihua(input: MeihuaInput): MeihuaCast {
  const { picked, year, month, day, hour } = input
  const base = Math.abs(year) + month + day
  const upperNum = mod8(base + picked)
  const lowerNum = mod8(base + hour + picked)
  const total = base + hour + picked
  const moving = mod6(total)

  const upper = trigramByNum(upperNum)
  const lower = trigramByNum(lowerNum)
  const hexa =
    HEX[upper.name]?.[lower.name] ??
    H('未知之卦', 'Unknown', '卦象罕见，静心再问一次。', 'A rare pattern — breathe and ask once more.')

  return {
    upper,
    lower,
    moving,
    hexa,
    steps: [
      { label: ['上卦', 'Upper'], formula: `(年${year} + 月${month} + 日${day} + 心念数${picked}) mod 8 = ${upperNum} → ${upper.name}${upper.sym}` },
      { label: ['下卦', 'Lower'], formula: `(年月日 ${base} + 时${hour} + 心念数${picked}) mod 8 = ${lowerNum} → ${lower.name}${lower.sym}` },
      { label: ['动爻', 'Moving line'], formula: `(总和 ${total}) mod 6 = 第 ${moving} 爻动` },
    ],
  }
}
