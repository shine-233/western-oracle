/**
 * 占星语义层语料库：12 星座 / 12 宫位 / 相位含义 / 扩展星体 / 格局。
 * 所有文案本地内置，无 AI 也能给出成体系的解读；
 * 组合函数负责把「行星 × 星座 × 宫位」拼成通顺的人话。
 */

export type Element = 'fire' | 'earth' | 'air' | 'water'
export type Modality = 'cardinal' | 'fixed' | 'mutable'

export interface SignInfo {
  en: string
  cn: string
  glyph: string
  element: Element
  modality: Modality
  ruler: string
  /** 短风格标签 */
  style: string[]
  /** 性格画像（多句） */
  personality: string
  /** 行事方式（用于行星落座造句） */
  expr: string
  love: string
  career: string
  shadow: string
}

export const ELEMENT_CN: Record<Element, string> = { fire: '火', earth: '土', air: '风', water: '水' }
export const MODALITY_CN: Record<Modality, string> = { cardinal: '开创', fixed: '固定', mutable: '变动' }

export const SIGNS: SignInfo[] = [
  {
    en: 'Aries', cn: '白羊座', glyph: '♈', element: 'fire', modality: 'cardinal', ruler: '火星',
    style: ['直接', '先锋', '热血'],
    personality: '黄道第一宫的孩子，天生带着「我先来」的冲劲。你讨厌拐弯抹角，认定的事九头牛都拉不回来，跌倒了拍拍灰继续跑。',
    expr: '想到就做、直球出击，宁可轰轰烈烈错一次，也不磨磨蹭蹭等时机',
    love: '爱得坦荡又热烈，喜欢就表白，吃醋也写在脸上；需要的是并肩闯荡的伙伴，而不是黏在一起的藤蔓。',
    career: '适合开疆拓土的角色：创业、销售、急救、竞技体育——哪里有挑战，哪里就有你的名字。',
    shadow: '急躁和三分钟热度是你要修的功课：学会深呼吸，把「快」升级成「又快又稳」。',
  },
  {
    en: 'Taurus', cn: '金牛座', glyph: '♉', element: 'earth', modality: 'fixed', ruler: '金星',
    style: ['沉稳', '感官', '持久'],
    personality: '你是十二星座里最懂得享受当下的人：一顿好饭、一首好歌、一段稳定的关系，都能让你由内而外地安心。慢，但每一步都踩得极实。',
    expr: '循序渐进、精打细算，一旦决定就坚持到底，用时间和手感积累出别人拿不走的东西',
    love: '爱是通过照顾来表达的：做好吃的、记住纪念日、给足安全感。你也期待同样踏实的回应。',
    career: '金融、美食、艺术收藏、园艺——凡是能把「美」变成「价值」的领域都是你的主场。',
    shadow: '固执与享乐主义是硬币的两面：警惕「再等等」变成停滞，舒适区偶尔也需要通风。',
  },
  {
    en: 'Gemini', cn: '双子座', glyph: '♊', element: 'air', modality: 'mutable', ruler: '水星',
    style: ['机敏', '好奇', '善辩'],
    personality: '脑子里永远开着十个浏览器标签页。你吸收信息的速度快得惊人，是天下的消息中转站，无聊是你最大的天敌。',
    expr: '多方尝试、举一反三，用沟通和写作把零散的灵感串成网',
    love: '要先聊得来才爱得动：精神共鸣是你的春药，一成不变的相处模式会让你窒息。',
    career: '媒体、写作、翻译、编程、带货直播——所有靠「信息差」和「嘴皮子」吃饭的行当你都如鱼得水。',
    shadow: '广度有了，深度欠费是常见剧本：试着把一件事做完，再去做下一件。',
  },
  {
    en: 'Cancer', cn: '巨蟹座', glyph: '♋', element: 'water', modality: 'cardinal', ruler: '月亮',
    style: ['温柔', '护家', '念旧'],
    personality: '披着硬壳的软心肠。你的情绪像潮汐一样有周期，记忆力好到能记住三年前某句伤人的话，也能记住别人随口提过的喜好。',
    expr: '凭直觉行事、以感受为罗盘，先照顾人的情绪再解决问题',
    love: '爱是「我家就是你家」：投喂、嘘寒问暖、把你写进未来的家庭蓝图。但也请留意别把担心控制当成爱。',
    career: '房产、餐饮、母婴、心理咨询、团队 HR——一切需要「让人有归属感」的工作你都天生擅长。',
    shadow: '情绪化内耗与被动攻击是需要练习卸下的壳：有话直说，比缩回壳里生闷气更有用。',
  },
  {
    en: 'Leo', cn: '狮子座', glyph: '♌', element: 'fire', modality: 'fixed', ruler: '太阳',
    style: ['自信', '慷慨', '舞台感'],
    personality: '自带聚光灯出厂设置。你热情、大方、护短，希望自己的努力被看见，也希望身边的人一起发光——独乐乐不如众乐乐。',
    expr: '大大方方展示实力，用感染力带动全场，认定目标就堂堂正正地拿下',
    love: '爱要热烈也要被捧在手心：你愿意为爱人戴上王冠，也想成为对方朋友圈里的骄傲。',
    career: '管理、演艺、品牌、教育、内容创作——需要个人魅力与号召力的舞台都属于你。',
    shadow: '面子和固执是软肋：听不进批评时，提醒自己「王者不需要赢下每一场争论」。',
  },
  {
    en: 'Virgo', cn: '处女座', glyph: '♍', element: 'earth', modality: 'mutable', ruler: '水星',
    style: ['细致', '务实', '优化'],
    personality: '行走的显微镜兼说明书作者。你能在一堆混乱里一眼看到那个错的标点，然后默默把它改好——不邀功，但心里有杆精准的秤。',
    expr: '拆解步骤、反复打磨，用清单和流程把混沌整理成秩序',
    love: '爱在细节里：记住你的药几点吃、行李箱轮子坏了该换了。笨拙的浪漫，扎实的真心。',
    career: '编辑、审计、医疗、数据分析、供应链——一切「细节决定成败」的岗位都是你的主场。',
    shadow: '过度自我批评与焦虑是暗面：允许自己交付「足够好」，而不是等到「完美」。',
  },
  {
    en: 'Libra', cn: '天秤座', glyph: '♎', element: 'air', modality: 'cardinal', ruler: '金星',
    style: ['优雅', '权衡', '社交'],
    personality: '人形外交官兼美学传感器。你能同时看见事情的三面，习惯先把关系理顺再把事办成；丑陋和不公平会让你生理性不适。',
    expr: '先收集各方视角再做判断，用协商和美感把局面调到最舒服的档位',
    love: '关系是你的氧气：一对一的陪伴、体面的仪式感、有来有往的付出。单身时反而不太习惯。',
    career: '法律、公关、设计、HR、调解仲裁——凡是要「摆平各方」又「顺眼好看」的活儿都得靠你。',
    shadow: '选择困难与讨好倾向是必修课：别人的情绪不是你的责任，说「不」也不会让世界塌掉。',
  },
  {
    en: 'Scorpio', cn: '天蝎座', glyph: '♏', element: 'water', modality: 'fixed', ruler: '冥王星',
    style: ['深邃', '专注', '重生'],
    personality: '水面平静、水下有漩涡。你对「真相」和「深度」有执念，要么不全给，要么给全部；信任一旦建立，你就是最忠诚的盟友。',
    expr: '不动声色地摸清全局，认准了就押上全部筹码，在废墟上完成一次次自我重建',
    love: '爱是灵魂级别的合并报表：要绝对的真实与忠诚，也准备好把自己整个交给对方。',
    career: '研究、投资、心理、刑侦、危机公关——越是暗流涌动、越需要洞察力的领域你越强。',
    shadow: '猜疑与记仇会反噬自己：学会放下控制欲，脆弱也是一种力量。',
  },
  {
    en: 'Sagittarius', cn: '射手座', glyph: '♐', element: 'fire', modality: 'mutable', ruler: '木星',
    style: ['自由', '乐观', '远方'],
    personality: '半人马的心脏装着一张世界地图。你相信「读万卷书不如行万里路」，天生会对教条翻白眼，对可能性两眼放光。',
    expr: '边走边学、越挫越勇，用幽默感和大格局把眼前的困境缩小成路标',
    love: '爱要自由呼吸：一起旅行、一起讨论哲学的伴侣最让你着迷；查岗式的亲密会让你跑路。',
    career: '留学教育、外贸旅游、出版传媒、跨国业务——视野越大，你的发挥空间越大。',
    shadow: '口无遮拦与承诺恐惧是箭上的倒刺：自由和责任不是单选题，学会收放才有真自由。',
  },
  {
    en: 'Capricorn', cn: '摩羯座', glyph: '♑', element: 'earth', modality: 'cardinal', ruler: '土星',
    style: ['自律', '野心', '登顶'],
    personality: '山羊型选手：别人抱怨坡陡的时候，你在数还有几个发卡弯。你尊重规则、敬畏时间，愿意为十年后的兑现延迟当下的满足。',
    expr: '目标导向、步步为营，把大野心切成小台阶，一块砖一块砖地砌上去',
    love: '爱是长期责任书：不善甜言蜜语，但会把「未来」两个字落实成房子、计划和风雨里的托底。',
    career: '管理、工程、架构师、公务员、创业操盘手——时间越长，复利越惊人的赛道最适合你。',
    shadow: '工作狂与情感压抑是山腰的雾：记得山顶不是人生的全部，路上的人才是。',
  },
  {
    en: 'Aquarius', cn: '水瓶座', glyph: '♒', element: 'air', modality: 'fixed', ruler: '天王星',
    style: ['独立', '前瞻', '叛逆'],
    personality: '从未来穿越回来的观察者。你看系统的角度总比别人高一层，朋友遍布各个次元；越是「大家都这样」，你越想问「为什么不能不这样」。',
    expr: '跳脱框架思考，用实验精神验证想法，为群体的进步保留一份异见',
    love: '先做朋友再做恋人，精神同频高于一切；你需要的是两个完整的人并肩看世界，而不是互相捆绑。',
    career: '科技、互联网、公益组织、前沿研究、社群运营——越新越未知的领域越有你的一席之地。',
    shadow: '疏离与「理智到冷漠」是冰壳：偶尔允许自己不酷，拥抱一下具体的温度。',
  },
  {
    en: 'Pisces', cn: '双鱼座', glyph: '♓', element: 'water', modality: 'mutable', ruler: '海王星',
    style: ['共情', '梦幻', '灵性'],
    personality: '自带天线接收全宇宙的情绪电波。你的想象力是不限量的，边界感是欠费的；梦里什么都有，包括把现实也过成诗的能力。',
    expr: '跟着直觉和心流走，用艺术、慈悲和白日梦为粗糙的现实加一层柔光',
    love: '爱是灵魂共振：你想被人懂到不用说话，也愿意为爱牺牲——但请留一半温柔给自己。',
    career: '艺术创作、音乐疗愈、慈善、摄影、灵性工作——想象力就是你的生产力。',
    shadow: '逃避现实与自我感动是粉红滤镜后的陷阱：梦想需要落地，边界感是善良的护栏。',
  },
]

/* ---------------- 12 宫位 ---------------- */

export interface HouseInfo {
  num: number
  en: string
  cn: string
  /** 别名，如 1 宫=上升宫 */
  alias?: string
  keywords: string[]
  /** 议题主题段 */
  theme: string
  /** 一句话点题（造句用） */
  gist: string
}

export const HOUSES: HouseInfo[] = [
  { num: 1, en: 'Self', cn: '命宫', alias: '上升宫', keywords: ['自我', '外貌', '出发'], gist: '「我是谁、我如何出场」的人生门面',
    theme: '上升所在之处，是你推开门走进世界的样子：气质、第一印象、以及「遇到事情时的本能反应」。任何行星落进这里，都会直接写在你的脸上和气场里。' },
  { num: 2, en: 'Resources', cn: '财帛宫', keywords: ['金钱', '价值', '安全感'], gist: '「我拥有什么、靠什么安身立命」的资源库',
    theme: '这里是你的钱包与价值感：赚钱方式、消费习惯、以及「我值多少钱」的内心估价系统。行星落此，会把它的能量接到现实层面的收获上。' },
  { num: 3, en: 'Communication', cn: '兄弟宫', keywords: ['沟通', '学习', '近处'], gist: '「我如何说话、如何学习」的信息网络',
    theme: '短途旅行、兄弟姐妹、同学邻里、社交媒体——这是你和身边环境交换信息的那张网。行星落此，会明显影响你的表达欲和学习方式。' },
  { num: 4, en: 'Home', cn: '田宅宫', alias: '天底', keywords: ['家庭', '根源', '归属'], gist: '「我从哪里来、什么让我踏实」的根',
    theme: '人生的地基：原生家庭、童年记忆、私宅与内心最柔软的角落。行星落此，其能量会在「家」这个舞台上反复上演。' },
  { num: 5, en: 'Creativity', cn: '子女宫', keywords: ['恋爱', '创造', '玩乐'], gist: '「我心动什么、为何发光」游乐场',
    theme: '恋爱、创作、游戏、孩子——一切让你眼里有光的「玩」。行星落此的人，往往需要在生命中留一块纯粹的快乐自留地。' },
  { num: 6, en: 'Service', cn: '奴仆宫', keywords: ['工作', '健康', '日常'], gist: '「我如何度过每个普通的一天」',
    theme: '日常工作流程、生活习惯、身体保养。它决定了你人生的底色质量——毕竟生活是由无数个星期二组成的。行星落此，会塑造你的日常节律。' },
  { num: 7, en: 'Partner', cn: '婚姻宫', alias: '下降宫', keywords: ['伴侣', '合作', '镜子'], gist: '「谁会站在我对面/身边」的一对一关系',
    theme: '配偶、合伙人、公开的对手——所有签过「关系合同」的人。行星落此，会描述你吸引什么样的人，以及在亲密关系里的课题。' },
  { num: 8, en: 'Transformation', cn: '疾厄宫', keywords: ['深度', '共享', '转化'], gist: '「我与他人深度纠缠」的炼金炉',
    theme: '亲密与信任的深层水域：共同财产、性与灵魂、生死的议题。行星落此，会经历「破碎后重建」的深刻剧情，也拥有洞悉人心的天赋。' },
  { num: 9, en: 'Philosophy', cn: '迁移宫', keywords: ['远行', '信仰', '高等教育'], gist: '「世界那么大、意义是什么」瞭望塔',
    theme: '长途旅行、留学深造、宗教哲学、出版传播——你与「更广阔世界」的连接方式。行星落此，会驱使你不断向外寻找答案。' },
  { num: 10, en: 'Career', cn: '官禄宫', alias: '天顶', keywords: ['事业', '声望', '成就'], gist: '「我想成为什么样的人」社会名片',
    theme: '事业方向、社会形象、公开的名声。天顶是人生的高峰线，行星落此，往往在相应领域有被看见的成就欲与机会。' },
  { num: 11, en: 'Community', cn: '福德宫', keywords: ['朋友', '团体', '愿景'], gist: '「我和同路人一起走向哪」的未来场',
    theme: '朋友圈、社群组织、长远理想。一个人走得快，一群人走得远——行星落此，会通过「群体」实现它的价值。' },
  { num: 12, en: 'Subconscious', cn: '玄秘宫', keywords: ['潜意识', '独处', '慈悲'], gist: '「藏在水面的部分」隐秘后花园',
    theme: '潜意识、梦境、秘密与灵性。行星落在此处的能量常常「暗中运行」：要么默默消耗，要么在独处与助人中转化为深厚的智慧。' },
]

/* ---------------- 行星（含扩展星体） ---------------- */

export type PlanetKind = 'luminary' | 'personal' | 'social' | 'generational' | 'point'

export interface PlanetInfo {
  cn: string
  glyph: string
  kind: PlanetKind
  /** 角色一句话 */
  role: string
  /** 掌管领域（造句用） */
  focus: string
  /** 详细解读 */
  detail: string
}

const KIND_CN: Record<PlanetKind, string> = {
  luminary: '光体',
  personal: '个人行星',
  social: '社会行星',
  generational: '时代行星',
  point: '虚点',
}

export const PLANETS: Record<string, PlanetInfo> = {
  Sun: { cn: '太阳', glyph: '☉', kind: 'luminary', role: '生命的主旋律', focus: '自我认同与生命力',
    detail: '太阳回答「我是谁」：你的核心意志、尊严感与创造力所在。它所在的星座是你性格的底色，宫位则是你人生的主要舞台。太阳状态好的人，自带一种「我在正确位置上」的笃定。' },
  Moon: { cn: '月亮', glyph: '☽', kind: 'luminary', role: '内心的潮汐', focus: '情绪需求与安全感',
    detail: '月亮回答「什么让我安心」：本能反应、情绪习惯、以及你最私密的需求。它描述你疲惫时会躲回什么样的壳里，也是你和「家」之间的那根线。照顾好自己的月亮，是一切运势的基础。' },
  Mercury: { cn: '水星', glyph: '☿', kind: 'personal', role: '思维的翻译官', focus: '思维、学习与沟通',
    detail: '水星决定你如何接收和处理信息：说话风格、学习方法、幽默感的类型。它离太阳从不超过 28°，所以它更多回答的不是「是否聪明」，而是「聪明长什么样」。' },
  Venus: { cn: '金星', glyph: '♀', kind: 'personal', role: '爱与美的传感器', focus: '爱情、审美与价值观',
    detail: '金星管两件事：你如何去爱（表达爱、需要什么样的爱），以及你觉得什么美（审美与品味）。它也是「价值观行星」——你愿意为什么花钱、花时间，它说了算。' },
  Mars: { cn: '火星', glyph: '♂', kind: 'personal', role: '行动力的引擎', focus: '行动、欲望与竞争',
    detail: '火星是你踩油门的方式：如何争取想要的东西、如何发怒、如何在竞争中出手。火星能量通畅的人未必好斗，但一定「想要就会去拿」。' },
  Jupiter: { cn: '木星', glyph: '♃', kind: 'social', role: '幸运的扩音器', focus: '机遇、信念与扩张',
    detail: '木星指向你人生中「容易得到眷顾」的领域，也是你的信念系统。它扩张所触的一切：好运与自信，也可能膨胀成过度乐观。跟着木星的箭头走，机会最多。' },
  Saturn: { cn: '土星', glyph: '♄', kind: 'social', role: '严厉的人生导师', focus: '课题、纪律与成就',
    detail: '土星标记你人生中最严格的考场，但也是最能出真本事的地方。它在哪个领域给你设限，就在哪个领域等你修炼成专家。29 岁前后的土星回归，是每个人成年礼的大考。' },
  Uranus: { cn: '天王星', glyph: '♅', kind: 'generational', role: '觉醒的闪电', focus: '变革、独立与创新',
    detail: '天王星在哪里，你的生活就哪里容易「说翻就翻」：它用突发与意外逼你跳出轨道，也赐予那个领域与众不同的天才。它是个人主义的天上来源。' },
  Neptune: { cn: '海王星', glyph: '♆', kind: 'generational', role: '梦境的海洋', focus: '梦想、灵感与消融',
    detail: '海王星是你的想象力与灵性之源：艺术、慈悲、玄学都归它管。但它也制造迷雾——那个领域你最容易美化、逃避或迷失，需要清醒的锚。' },
  Pluto: { cn: '冥王星', glyph: '♇', kind: 'generational', role: '重生的深渊', focus: '深层转化与力量',
    detail: '冥王星标记你经历「死而后生」的领域：彻底推翻旧我、获得洞穿本质的力量。它带来的剧情浓烈，但熬过去的人都会长出钻石般的内核。' },
  Chiron: { cn: '凯龙', glyph: '⚷', kind: 'point', role: '受伤的疗愈师', focus: '创伤与疗愈天赋',
    detail: '凯龙的公式是「在哪里受伤，就在哪里成为医生」。它标记反复出现的隐痛，也正是你最终能治愈他人之处。直面它的疼，就会拿到它的礼物。' },
  Lilith: { cn: '黑月莉莉丝', glyph: '⚸', kind: 'point', role: '原始欲望的暗月', focus: '压抑的渴望与阴影',
    detail: '莉莉丝是被驯化之前的野性自我：那个领域的欲望你不屑说出口，却总在暗处涌动。承认并安放她，她会从破坏力变成魅力与力量。' },
  NorthNode: { cn: '北交点', glyph: '☊', kind: 'point', role: '灵魂的成长箭头', focus: '今生的进化方向',
    detail: '北交点是陌生的、需要踮脚够的方向，起初会不舒服，但越走越开阔——那是灵魂给自己定的成长路线。' },
  SouthNode: { cn: '南交点', glyph: '☋', kind: 'point', role: '熟悉的旧剧本', focus: '天赋惯性舒适区',
    detail: '南交点是你带来就会的天赋，也是躺平就能待着的舒适区。它没有好坏，只是提醒：别把整个人生活成南交点的重复播放。' },
  Ceres: { cn: '谷神星', glyph: '⚳', kind: 'point', role: '滋养的模式', focus: '养育与自我照顾',
    detail: '谷神星描述你如何滋养自己和他人：喂饱一个人的方式有一万种，你有属于你的那一种。' },
  Pallas: { cn: '智神星', glyph: '⚴', kind: 'point', role: '策略的智慧', focus: '模式识别与谋略',
    detail: '智神星是你的军师功能：看穿格局、制定策略、把创意织成蓝图的能力都在这里。' },
  Juno: { cn: '婚神星', glyph: '⚵', kind: 'point', role: '契约的需求', focus: '承诺关系的条件',
    detail: '婚神星说出你在长期承诺里真正需要的条款——比金星更深一层，关于「过日子」的匹配度。' },
  Vesta: { cn: '灶神星', glyph: '⚶', kind: 'point', role: '奉献的圣火', focus: '专注与守护',
    detail: '灶神星标记你愿意守护和投入的祭坛：在那里你能进入心流，也需警惕过度燃尽。' },
}

/** 星盘上实际参与计算的点位（10 大行 + 凯龙/莉莉丝/南北交 + 四小行星） */
export const CHART_POINT_KEYS = [
  'Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn',
  'Uranus', 'Neptune', 'Pluto', 'Chiron', 'Lilith', 'NorthNode', 'SouthNode',
  'Ceres', 'Pallas', 'Juno', 'Vesta',
] as const

export function planetCn(name: string): string {
  return PLANETS[name]?.cn ?? name
}
export function planetGlyph(name: string): string {
  return PLANETS[name]?.glyph ?? '✦'
}
export function planetKind(name: string): PlanetKind {
  return PLANETS[name]?.kind ?? 'personal'
}
export function kindLabel(name: string): string {
  return KIND_CN[planetKind(name)] ?? ''
}

/* ---------------- 相位含义 ---------------- */

export interface AspectMeaning {
  cn: string
  symbol: string
  angle: number
  nature: 'harmonious' | 'dynamic' | 'neutral'
  /** 一句话本质 */
  essence: string
  /** 相处/运用建议 */
  advice: string
}

export const ASPECTS: Record<string, AspectMeaning> = {
  conjunction: { cn: '合相', symbol: '☌', angle: 0, nature: 'neutral',
    essence: '两股能量熔成一团，密不可分——好则强强联手，乱则难解难分。',
    advice: '合相的行星像绑在一起的两匹马：认清谁是主导，才能拉同一辆车。' },
  sextile: { cn: '六合', symbol: '⚹', angle: 60, nature: 'harmonious',
    essence: '友好相邻的机会相位：能量顺畅，但要你主动伸手去接。',
    advice: '六合是敲门砖——它不会主动发生，你一行动它就兑现。' },
  square: { cn: '刑相', symbol: '□', angle: 90, nature: 'dynamic',
    essence: '90° 的摩擦与角力：反复出现的冲突，恰恰是成长最快的引擎。',
    advice: '别急着消灭张力。刑相的礼物藏在第三次、第四次跨过同一道坎之后。' },
  trine: { cn: '拱相', symbol: '△', angle: 120, nature: 'harmonious',
    essence: '天生的顺风局：能量流动毫不费力，是天赋所在，也容易被视作理所当然。',
    advice: '拱相的才华要刻意使用才会增值——顺风船也需要自己划桨。' },
  opposition: { cn: '冲相', symbol: '☍', angle: 180, nature: 'dynamic',
    essence: '轴线的两端互相拉扯：像跷跷板，考验的是平衡与整合的智慧。',
    advice: '冲相不是二选一，而是轮流坐庄：先各自站好两端，再找中间那条线。' },
  semisextile: { cn: '半六合', symbol: '⚺', angle: 30, nature: 'harmonious',
    essence: '轻微的调节需求：相邻星座的微妙磨合，小刺但不致命。',
    advice: '像鞋里的小石子——倒掉就好，别忽略积累的小不适。' },
  semisquare: { cn: '半刑', symbol: '∠', angle: 45, nature: 'dynamic',
    essence: '隐隐的烦躁与刺激：小事堆积起来的紧张感。',
    advice: '定期清理情绪碎屑，别让小刺攒成大钉。' },
  sesquiquadrate: { cn: '倍半刑', symbol: '⚼', angle: 135, nature: 'dynamic',
    essence: '爆发式的火气：平时没事，攒够了突然炸毛。',
    advice: '给压力预留泄压阀，运动和倾诉都算。' },
  quincunx: { cn: '梅花相', symbol: '⚻', angle: 150, nature: 'dynamic',
    essence: '永不对频的两个频道：既不冲突也不合作，需要持续微调的「盲区相位」。',
    advice: '接受它们永远不会自动融合，手动切换、分场景使用即可。' },
  quintile: { cn: '五分相', symbol: 'Q', angle: 72, nature: 'harmonious',
    essence: '隐藏的创造天赋：一种独特的、带个人印记的才能。',
    advice: '把它用于创造性输出，而不是只当作怪癖。' },
  biquintile: { cn: '倍五分相', symbol: 'bQ', angle: 144, nature: 'harmonious',
    essence: '精炼的巧思：把不搭边的元素嫁接出火花的才能。',
    advice: '跨界组合是你的超能力，大胆混搭。' },
}

/* ---------------- 格局（Pattern）中文名 ---------------- */

export const PATTERNS_CN: Record<string, { cn: string; desc: string }> = {
  'T-Square': { cn: '三刑会冲（T 三角）', desc: '两颗行星对冲、第三颗分别与之相刑，构成 T 形。压力集中在顶点行星：那里既是你最大的摩擦源，也是最能出成就的杠杆支点。' },
  'Grand Trine': { cn: '大三角', desc: '三颗行星两两互拱，形成等边三角形。天赋如泉涌且自成闭环——唯一的风险是太顺遂而懒得启用。给它找一个值得的目标。' },
  'Grand Cross': { cn: '大十字', desc: '四颗行星两两相冲、彼此相刑，形成十字。人生像同时在四个方向用力，早年辛苦，但一旦学会四轮驱动，承载力无人能及。' },
  Yod: { cn: '上帝之指（Yod）', desc: '两颗行星六合、第三颗与它们双双成 150°。像一只指向顶点的手指：一种「总被无形之手推向特殊使命」的人生剧本，顶点行星即答案。' },
  Kite: { cn: '风筝', desc: '大三角再加一颗对冲顶点的行星，形似风筝。比大三角多了动力与方向感——那颗对冲的行星是把天赋放飞的线。' },
  'Mystic Rectangle': { cn: '神秘矩形', desc: '两组对冲、两组拱、两组六合围成的矩形。张力与天赋并存且相互抵消一部分，外表平稳内里暗涌，擅长在矛盾中搭建桥梁。' },
  Stellium: { cn: '星群（Stellium）', desc: '三颗以上行星挤在同一片天空。能量高度聚焦：相关领域既是你的执念，也是最可能大成的战场。' },
}

/* ---------------- 组合文案生成 ---------------- */

/** 「行星落星座」组合解读 */
export function planetInSignText(planetKey: string, signIndex: number): string {
  const p = PLANETS[planetKey]
  const s = SIGNS[signIndex % 12]
  if (!p || !s) return ''
  const head = `你的${p.cn}（${p.role}）落在了${s.cn}`
  const mid = `${p.focus}这回事，在你身上是「${s.style.join(' · ')}」风格的——${s.expr}。`
  return `${head}。\n${mid}\n换句话说：${p.detail.split('。')[0]}，只是这一切都被染上了${s.cn}特有的滤镜。`
}

/** 「行星落宫位」组合解读 */
export function planetInHouseText(planetKey: string, house: number): string {
  const p = PLANETS[planetKey]
  const h = HOUSES[(house || 1) - 1]
  if (!p || !h) return ''
  return `${p.cn}进驻第 ${h.num} 宫（${h.cn}${h.alias ? ' · ' + h.alias : ''}）——这里管的是${h.gist}。\n${h.theme}\n于是，${p.focus}成了你在${h.keywords.join('、')}这些议题上的主要戏份：${p.role}将在人生的这个剧场频繁登场。`
}

/** 星座完整档案（弹窗/展开用） */
export function signFullText(signIndex: number): string {
  const s = SIGNS[signIndex % 12]
  if (!s) return ''
  return [
    `【${s.cn} ${s.glyph}】${ELEMENT_CN[s.element]}象 · ${MODALITY_CN[s.modality]}星座 · 守护星：${s.ruler}`,
    s.personality,
    `♥ 恋爱模式：${s.love}`,
    `✦ 事业天赋：${s.career}`,
    `☾ 阴影课题：${s.shadow}`,
  ].join('\n')
}

/** 宫位完整解读文本 */
export function houseFullText(house: number): string {
  const h = HOUSES[(house || 1) - 1]
  if (!h) return ''
  return `【第 ${h.num} 宫 · ${h.cn}${h.alias ? '（' + h.alias + '）' : ''}】关键词：${h.keywords.join(' / ')}\n${h.theme}`
}

/** 相位含义文本 */
export function aspectText(type: string): string {
  const a = ASPECTS[type]
  if (!a) return ''
  return `【${a.cn} ${a.symbol} ${a.angle}°】${a.essence}\n✧ ${a.advice}`
}
