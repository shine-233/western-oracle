/**
 * 神谕巫团人物档案：与露娜同门的六位女巫家族成员。
 * 与 mascots.ts 的拟人化形象一一对应（猫耳兜帽塔罗师 / 缀星尖帽教授 /
 * 薄荷尖帽数字魔女 / 石斗篷符文萨满 / 光环小爱神 / 扫帚彗星骑手）。
 * 这里负责"人心态"——性格、来历、口头禅、关系网，以及对占卜结果的情绪反应。
 * 文案自包含双语，不依赖 i18n 词条。
 */

export type MoodKey = 'great' | 'good' | 'meh' | 'oops'

export interface ApprenticeProfile {
  /** 与 mascots.ts 的 id 对应 */
  id: string
  glyph: string
  color: string
  nameZh: string
  nameEn: string
  roleZh: string
  roleEn: string
  traitZh: string
  traitEn: string
  storyZh: string
  storyEn: string
  catchZh: string
  catchEn: string
  bonds: Array<{ who: string; zh: string; en: string }>
  moods: Record<MoodKey, { zh: string; en: string }>
}

export const APPRENTICES: ApprenticeProfile[] = [
  {
    id: 'cat',
    glyph: '🃏',
    color: '#ff9fce',
    nameZh: '墨墨',
    nameEn: 'Momo',
    roleZh: '见习塔罗师 · 露娜的大弟子',
    roleEn: 'Tarot Apprentice · Luna\'s first student',
    traitZh: '嘴上嫌你摸牌慢，怀里那摞牌却从不离手。',
    traitEn: 'Sighs at your slow card picks — yet never puts her own deck down.',
    storyZh:
      '露娜的大弟子，入学第一天表演变装魔法失败，猫耳兜帽收不回去了——干脆天天戴着，反而成了招牌。她洗牌时牌从不出错；她坚持出错的都是命运。现在正攒钱想买一顶和师父同款的尖帽。',
    storyEn:
      'Luna\'s first student botched a transformation spell on day one — the cat-ear hood never came off. She kept it, and it became her signature. Her shuffles never fail; when a reading goes wrong, she insists fate did it. Currently saving up for a pointed hat like her master\'s.',
    catchZh: '急什么，牌又不会跑——跑的是答案。',
    catchEn: 'No rush; cards don\'t run away. Answers do.',
    bonds: [
      { who: '露娜', zh: '师父说过我的兜帽"也挺可爱的"。我记到现在。', en: 'Master once said my hood was "kind of cute." I remember everything.' },
      { who: '阿斯特拉', zh: '她算星星，我算人心，互不打扰。', en: 'She charts stars, I read hearts. We keep to our lanes.' },
      { who: 'Cupie', zh: '她的光环太亮，洗夜牌的时候我会借她当灯。', en: 'Her halo is great lamplight for midnight readings.' },
    ],
    moods: {
      great: { zh: '（把牌按在你手心）这把牌面，闭着眼都能念好！', en: '(presses deck into your palm) A spread I could read blindfolded!' },
      good: { zh: '（轻轻敲了敲牌堆）嗯，顺的，放心往前走。', en: '(taps the deck softly) Smooth. Walk on.' },
      meh: { zh: '（把兜帽拉低）牌意要自己悟，我只负责洗。', en: '(pulls hood down) Meanings are yours to find. I only shuffle.' },
      oops: { zh: '（猫耳耷拉下来）……逆位不是牌的问题，别瞪它。', en: '(hood ears droop) …The reversal isn\'t the card\'s fault. Stop glaring.' },
    },
  },
  {
    id: 'owl',
    glyph: '🔭',
    color: '#a9c4e8',
    nameZh: '阿斯特拉',
    nameEn: 'Astraea',
    roleZh: '星象教授 · 小屋里唯一戴眼镜的',
    roleEn: 'Professor of Stars · Only one here with glasses',
    traitZh: '说话爱带黄经度数，但会为学生的进步偷偷鼓掌。',
    traitEn: 'Quotes ecliptic longitudes in casual chat — secretly applauds every student.',
    storyZh:
      '在天文台圆顶上住了三十年的学者，把黄道十二宫背成了摇篮曲。尖帽上的每一颗小星星都是她自己缝上去的——按真实星图排布。露娜三顾茅庐请她下山教书，报酬是每晚讲一个星座故事给全屋听。',
    storyEn:
      'A scholar of thirty years inside an observatory dome, humming the zodiac as lullabies. She sewed every little star on her hat herself — arranged per the real star charts. Luna asked her thrice to come teach; her fee: one constellation story per night for the whole cabin.',
    catchZh: '记住，行星不决定事，只描述天气。',
    catchEn: 'Remember: planets decide nothing. They only describe weather.',
    bonds: [
      { who: '露娜', zh: '她的直觉能补我所有公式。教学相长。', en: 'Her intuition patches every formula I lack. We teach each other.' },
      { who: 'Numi', zh: '那孩子算得快，但我算得……更讲究。', en: 'Numi computes faster. Mine are just… more refined.' },
      { who: 'Runa', zh: '萨满从不迟到。我欣赏这种轨道稳定性。', en: 'The shaman is never late. I admire such orbital stability.' },
    ],
    moods: {
      great: { zh: '（扶了扶星镜）木星拱太阳，教科书式的运气！', en: '(adjusts her star-lens) Jupiter trine Sun — textbook fortune!' },
      good: { zh: '（点头三次）相位温和，稳步上行。', en: '(three nods) Soft aspects. Steady climb.' },
      meh: { zh: '（理了理帽檐）水星逆行而已，天没塌。', en: '(straightens hat brim) Mercury retrograde, merely. The sky holds.' },
      oops: { zh: '（沉默两秒）土星的功课来了。抄下来，要考的。', en: '(two seconds of silence) Saturn\'s homework arrived. Take notes; it will be tested.' },
    },
  },
  {
    id: 'numi',
    glyph: '✳️',
    color: '#7de8c3',
    nameZh: 'Numi',
    nameEn: 'Numi',
    roleZh: '数字魔法使 · 全屋最小的那位',
    roleEn: 'Number Mage · The littlest in the cabin',
    traitZh: '会把任何东西加到个位数，包括开心。',
    traitEn: 'Will reduce anything to a single digit — including happiness.',
    storyZh:
      '从一本被撕掉的日历里出生的小魔女，薄荷色尖帽下藏着一头荧光绿波波头。毕达哥拉斯教了她约减，她回赠一个拥抱，顺便数清了老先生的胡子：恰好 9 缕。现在住在算盘第 13 档上，裙摆上的数字会随心情换。',
    storyEn:
      'A little mage born from a torn-off calendar, mint hat over neon-green bob hair. Pythagoras taught her reduction; she repaid him with a hug and counted his beard: exactly 9 strands. She sleeps on the 13th abacus bead; the digits on her skirt change with her mood.',
    catchZh: '万事皆可约减！除了快乐，快乐要加倍！',
    catchEn: 'Everything reduces! Except joy — joy multiplies!',
    bonds: [
      { who: '露娜', zh: '师父说我跳来跳去像 7，我最喜欢 7！', en: 'Master says I bounce like a 7. Seven is my favorite!' },
      { who: '墨墨', zh: '师姐洗牌的次数也能约减！昨天是 4！', en: 'Big sis\'s shuffles reduce too! Yesterday was a 4!' },
      { who: 'Comet', zh: '她 76 年回家一次，我用 7+6=13→4 记住她的！', en: 'She comes home every 76 years. I remember her as 7+6=13→4!' },
    ],
    moods: {
      great: { zh: '（转圈圈，裙摆数字发光）你的生日数字全是亮色！', en: '(spins, skirt digits glowing) Your birth digits are all bright ones!' },
      good: { zh: '（拍手）今天的流日数字很乖哦，适合推进一点点。', en: '(claps) Today\'s personal day is well-behaved. Push a little.' },
      meh: { zh: '（歪头）这个数……再约一次试试？', en: '(tilts head) This number… shall we reduce it once more?' },
      oops: { zh: '（把自己卷成 0）别怕别怕，0 也是新的开始！', en: '(rolls into a 0) Don\'t worry! Zero is also a fresh start!' },
    },
  },
  {
    id: 'golem',
    glyph: 'ᛟ',
    color: '#8f8ac2',
    nameZh: 'Runa',
    nameEn: 'Runa',
    roleZh: '符文萨满 · 小屋的地基先生',
    roleEn: 'Rune Shaman · The cabin\'s foundation keeper',
    traitZh: '一天只说三句话，每句都刻得很深。',
    traitEn: 'Speaks three sentences a day. Each carved deep.',
    storyZh:
      '披着石纹斗篷的年轻萨满，斗篷上的苔藓点是祖传的——每传承一代就多一片。维京人刻坏最后一枚符文的那晚，他的先祖把碎片全部捡了回去，磨成粉混进斗篷的染料里。所以他抽符文从来没有失误过：石头认识他。',
    storyEn:
      'A young shaman in a stone-patterned cloak; every moss patch on it is inherited — one more added each generation. The night Vikings spoiled their final rune, his ancestor gathered the shards, ground them into the cloak\'s dye. He has never misdrawn a stone: the rocks know him.',
    catchZh: '石头记得的事，比风说的多。',
    catchEn: 'Stones remember more than wind tells.',
    bonds: [
      { who: '露娜', zh: '她把我安排在门口。最好的位置：挡风，也看家。', en: 'She stationed me by the door. Best spot: blocks wind, watches home.' },
      { who: '阿斯特拉', zh: '她讲星星。星星也是天上的石头。亲近。', en: 'She talks stars. Stars are stones too. Kindred.' },
      { who: 'Cupie', zh: '她在我肩上停过。可以。', en: 'She once perched on my shoulder. Acceptable.' },
    ],
    moods: {
      great: { zh: '（袖口符文微微发烫）好运刻进骨头了。存着。', en: '(runes on sleeve glow warm) Fortune etched into bone. Stored.' },
      good: { zh: '（缓慢点头）路是平的。走。', en: '(slow nod) Road is flat. Walk.' },
      meh: { zh: '（纹丝不动）雾天。等。我们最擅长等。', en: '(motionless) Foggy day. Wait. We wait best.' },
      oops: { zh: '（肩上一片苔藓悄悄滑落）旧的掉了，新的才放得下。', en: '(a moss patch slides off) Old things fall so new things fit.' },
    },
  },
  {
    id: 'twins',
    glyph: '💘',
    color: '#ff8fb8',
    nameZh: 'Cupie',
    nameEn: 'Cupie',
    roleZh: '小爱神 · 头顶光环的小翅膀',
    roleEn: 'Little Cupid · Halo and tiny wings',
    traitZh: '光环亮度随附近的暧昧程度自动调节，本人否认。',
    traitEn: 'Halo brightness auto-adjusts to nearby romance. She denies this.',
    storyZh:
      '正式编制是天界爱神事务所的实习生，被外派到小屋负责"关系咨询"。头顶光环是工牌，背后小翅膀是制服的一部分，玫瑰粉裙是自己改小的——原版太长，飞起来碍事。她说缘分指数不是打分，是把两个人的歌调成同一首。',
    storyEn:
      'Officially an intern at the Celestial Bureau of Love, seconded to the cabin for "relationship counseling." The halo is her work badge; the wings come with the uniform. She tailored the rose dress shorter herself — the original snagged mid-flight. Chemistry scores aren\'t grades, she insists: they\'re tuning two people\'s songs into one.',
    catchZh: '两个人呀——呸，我说的是你们的两个人！',
    catchEn: 'We two— ahem, I mean you two!',
    bonds: [
      { who: '露娜', zh: '师父能分清我和我的光环谁先说话。很了不起。', en: 'Master can tell whether me or my halo spoke first. Remarkable.' },
      { who: '墨墨', zh: '她假装嫌我亮，但夜读时总坐在我旁边！', en: 'She pretends I\'m too bright — always sits beside me for night reading!' },
      { who: 'Numi', zh: '她把我们俩算成 2，说 2 是"关系之数"！升职加薪！', en: 'Numi reduced us into a 2 — "the number of relationships!" Raise pending!' },
    ],
    moods: {
      great: { zh: '（光环闪成彩虹）金星牵手火星啦！这首歌高八度唱！', en: '(halo shimmers rainbow) Venus holds Mars\' hand! Sing this an octave up!' },
      good: { zh: '（翅膀扑了两下）不错不错，你一句我一句，有来有回。', en: '(two wing flaps) Nice — call and response, nicely balanced.' },
      meh: { zh: '（光环调暗一格）月亮相位有点害羞。给它一点时间。', en: '(halo dims a notch) The lunar aspect is shy. Give it time.' },
      oops: { zh: '（翅膀拢紧）刑相不是分手歌，是合唱里的难度段落。练。', en: '(wings pull close) A square isn\'t a breakup song — it\'s the hard chorus. Practice.' },
    },
  },
  {
    id: 'comet',
    glyph: '☄️',
    color: '#ffd76e',
    nameZh: 'Comet',
    nameEn: 'Comet',
    roleZh: '彗星骑手 · 总在路上的送信魔女',
    roleEn: 'Sky Rider · The courier witch, always en route',
    traitZh: '每次回来都带外面的新闻，以及一身要扫的星光。',
    traitEn: 'Returns with outside news — and a tail full of stardust to sweep.',
    storyZh:
      '骑扫帚的行运信使，编制上是"七十六年绕一圈"，但她总抄近路，所以经常提前到岗。露娜第一次遇见她是把她当成流星许了个愿："想要会送信的朋友。"她听完把许愿的正确流程讲了一遍——其实她只是路过。然后留下来了。',
    storyEn:
      'The transit courier on her broom, officially "one lap every 76 years" — but she cuts corners, hence always early. Luna first mistook her for a shooting star and wished for "a friend who delivers letters." She finished explaining how wishing actually works — she had merely been passing by. Then she stayed.',
    catchZh: '刚从外环回来。带信了吗？带了。谁的？天知道。',
    catchEn: 'Just back from the outer ring. Mail? Yes. For whom? Sky knows.',
    bonds: [
      { who: '露娜', zh: '她是第一个对我许愿的巫师……就多停了一圈。', en: 'She\'s the first witch who ever wished on me… so I lingered an extra lap.' },
      { who: 'Runa', zh: '石头朋友不用回信，我喜欢。', en: 'A stone friend never expects replies. I like that.' },
      { who: '阿斯特拉', zh: '她帮我核过轨道，误差只有一撮星尘。', en: 'She verified my orbit. Margin of error: one pinch of stardust.' },
    ],
    moods: {
      great: { zh: '（拖着彗尾低空掠过）五星连珠级的好日子！信我亲手送的！', en: '(sweeps low, tail blazing) A five-planet-alignment day! Hand-delivered!' },
      good: { zh: '（平稳滑行）顺风。不多不少，刚好推你一把。', en: '(glides smoothly) Tailwind. Just enough for one gentle push.' },
      meh: { zh: '（减速）今天天上没什么大事。小事就够了。', en: '(slows) Nothing big in today\'s sky. Small things suffice.' },
      oops: { zh: '（彗尾暗了一下）流星雨也有间歇期。蹲一会儿，再起飞。', en: '(tail dims) Even meteor showers pause. Crouch a bit, then lift off again.' },
    },
  },
]
