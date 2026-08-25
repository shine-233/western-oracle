/**
 * 神谕学徒人物档案：六位小小学徒与露娜的关系网。
 * 与 mascots.ts 的形象一一对应；这里负责"人心态"——性格、来历、口头禅、
 * 彼此之间的关系，以及对占卜结果的真实情绪反应。
 * 文案自包含双语，不依赖 i18n 词条。
 */

export type MoodKey = 'great' | 'good' | 'meh' | 'oops'

export interface ApprenticeProfile {
  id: string
  /** 与 mascots.ts 的 id 对应 */
  glyph: string
  color: string
  nameZh: string
  nameEn: string
  /** 在小屋里的头衔 */
  roleZh: string
  roleEn: string
  /** 性格一句话 */
  traitZh: string
  traitEn: string
  /** 来历小传 */
  storyZh: string
  storyEn: string
  /** 口头禅 */
  catchZh: string
  catchEn: string
  /** 关系网：对露娜和其他学徒的悄悄话 */
  bonds: Array<{ who: string; zh: string; en: string }>
  /** 对占卜结果的情绪反应 */
  moods: Record<MoodKey, { zh: string; en: string }>
}

export const APPRENTICES: ApprenticeProfile[] = [
  {
    id: 'cat',
    glyph: '🐱',
    color: '#ff9fce',
    nameZh: '墨墨',
    nameEn: 'Momo',
    roleZh: '塔罗学徒 · 露娜的大师兄',
    roleEn: 'Tarot Apprentice · Eldest of Luna\'s students',
    traitZh: '嘴上嫌弃你摸牌慢，爪子却把牌洗得最整齐。',
    traitEn: 'Complains you shuffle too slow — yet keeps the deck neatest of all.',
    storyZh:
      '原本是牌盒里的一团影子，被露娜用一张月亮牌接了出来。从此睡在牌桌第三条腿旁边，自称"守牌人"。据说他洗牌时牌从不出错，出错的都是命运。',
    storyEn:
      'Once a shadow inside the card box, until Luna pulled him out with a Moon card. Now he sleeps by the table\'s third leg and calls himself Keeper of the Deck. They say when Momo shuffles, the cards never err — only fate does.',
    catchZh: '急什么，牌又不会跑——跑的是答案。',
    catchEn: 'No rush; cards don\'t run away. Answers do.',
    bonds: [
      { who: '露娜', zh: '师父递给我月亮牌那天，我就决定赖着她了。', en: 'The day Luna handed me that Moon card, I decided to stick around.' },
      { who: '星教授', zh: '他算星星，我算人心，各管各的。', en: 'He charts stars, I read hearts. We keep to our lanes.' },
      { who: 'Twinies', zh: '两只鸟吵起来比洗牌还响。', en: 'Those two chirp louder than a riffle shuffle.' },
    ],
    moods: {
      great: { zh: '（尾巴竖成旗杆）这把牌面，闭着眼都能念好！', en: '(tail up like a flagpole) A spread even I could read blindfolded!' },
      good: { zh: '（踩了踩牌角）嗯，顺的，放心走。', en: '(steps on a card corner) Smooth. Walk on.' },
      meh: { zh: '（假装睡觉）牌意要自己悟，本喵只管洗。', en: '(pretends to sleep) Meanings are yours to find. I only shuffle.' },
      oops: { zh: '（耳朵抖了一下）……这张逆位，不是牌的问题，是你的问题。', en: '(ear twitches) …That reversal isn\'t the card\'s fault.' },
    },
  },
  {
    id: 'owl',
    glyph: '🦉',
    color: '#a9c4e8',
    nameZh: '星教授',
    nameEn: 'Prof. Star',
    roleZh: '占星导师 · 小屋唯一戴眼镜的',
    roleEn: 'Astrology Tutor · Only one here with glasses',
    traitZh: '说话爱带黄经度数，但会为学生的进步偷偷鼓掌。',
    traitEn: 'Quotes ecliptic longitudes in casual chat — secretly applauds every student.',
    storyZh:
      '曾在天文台的圆顶上住了三十年，把黄道十二宫背成了摇篮曲。露娜三顾茅庐请他下山，条件是每晚多讲一个星座故事。他的羽毛笔记被全屋传阅，虽然没人看得懂那些符号。',
    storyEn:
      'Spent thirty years in an observatory dome, humming the zodiac as lullabies. Luna asked him down thrice; his price was one constellation story per night. His feather-penned notes circulate the cabin — nobody can read the symbols.',
    catchZh: '记住，行星不决定事，只描述天气。',
    catchEn: 'Remember: planets decide nothing. They only describe weather.',
    bonds: [
      { who: '露娜', zh: '她的直觉能补我所有公式。教学相长。', en: 'Her intuition patches every formula I lack. We teach each other.' },
      { who: 'Numi', zh: '数字精灵算得快，但我算得……更讲究。', en: 'Numi computes faster. Mine are just… more refined.' },
      { who: 'Runi', zh: '石头人从不迟到。我欣赏这种轨道稳定性。', en: 'The golem is never late. I admire such orbital stability.' },
    ],
    moods: {
      great: { zh: '（推眼镜）木星拱太阳，教科书式的运气！', en: '(adjusts glasses) Jupiter trine Sun — textbook fortune!' },
      good: { zh: '（点头三次）相位温和，稳步上行。', en: '(three nods) Soft aspects. Steady climb.' },
      meh: { zh: '（整理羽毛）水星逆行而已，天没塌。', en: '(preens feathers) Mercury retrograde, merely. The sky holds.' },
      oops: { zh: '（沉默两秒）土星的功课来了。抄下来，要考的。', en: '(two seconds of silence) Saturn\'s homework arrived. Take notes; it will be tested.' },
    },
  },
  {
    id: 'numi',
    glyph: '✳️',
    color: '#7de8c3',
    nameZh: 'Numi',
    nameEn: 'Numi',
    roleZh: '灵数精灵 · 全屋最小的那位',
    roleEn: 'Number Sprite · The littlest in the cabin',
    traitZh: '会把任何东西加到个位数，包括开心。',
    traitEn: 'Will reduce anything to a single digit — including happiness.',
    storyZh:
      '从一个被撕掉的日历里出生，身上还沾着两个月的数字。毕达哥拉斯路过时教了她约减，她回赠了一个拥抱，把老先生的胡子都数清楚了：恰好 9 缕。现在她住在算盘第 13 档上。',
    storyEn:
      'Born from a torn-off calendar, still dusted with two months of digits. Pythagoras taught her reduction; she repaid him with a hug and counted his beard: exactly 9 strands. She now lives on the 13th bead of an abacus.',
    catchZh: '万事皆可约减！除了快乐，快乐要加倍！',
    catchEn: 'Everything reduces! Except joy — joy multiplies!',
    bonds: [
      { who: '露娜', zh: '师父说我跳来跳去像 7，我最喜欢 7！', en: 'Master says I bounce like a 7. Seven is my favorite!' },
      { who: '墨墨', zh: '猫尾巴摇的次数也能约减！昨天是 4！', en: 'Tail wags reduce too! Yesterday was a 4!' },
      { who: '彗星', zh: '它 76 年回家一次，我用 7+6=13→4 记住它的！', en: 'It comes home every 76 years. I remember it as 7+6=13→4!' },
    ],
    moods: {
      great: { zh: '（转圈圈）你的生日数字在发光！全是亮色！', en: '(spins) Your birth digits are glowing! All bright ones!' },
      good: { zh: '（拍手）流日数字很乖哦，今天适合推进一点点。', en: '(claps) Today\'s personal day is well-behaved. Push a little.' },
      meh: { zh: '（歪头）这个数……再约一次试试？', en: '(tilts head) This number… shall we reduce it once more?' },
      oops: { zh: '（把自己卷成 0）别怕别怕，0 也是新的开始！', en: '(rolls into a 0) Don\'t worry! Zero is also a fresh start!' },
    },
  },
  {
    id: 'golem',
    glyph: '🗿',
    color: '#8f8ac2',
    nameZh: 'Runi',
    nameEn: 'Runi',
    roleZh: '符文石人 · 小屋的地基先生',
    roleEn: 'Rune Golem · The cabin\'s foundation block',
    traitZh: '一天只说三句话，每句都刻得很深。',
    traitEn: 'Speaks three sentences a day. Each carved deep.',
    storyZh:
      '维京人刻坏最后一枚符文时掉落的石屑，在地上躺了一千年，被苔藓教会了耐心。露娜把他搬回小屋当花盆，第二年春天，肩上的苔藓开出了符文形状的花。他从此拒绝再当花盆。',
    storyEn:
      'Stone chips from a Viking\'s spoiled rune, lying under moss for a thousand years — moss taught him patience. Luna brought him home as a flowerpot; next spring his shoulder-moss bloomed into rune-shaped flowers. He refused to be a flowerpot ever since.',
    catchZh: '石头记得的事，比风说的多。',
    catchEn: 'Stones remember more than wind tells.',
    bonds: [
      { who: '露娜', zh: '她把我放在门口。最好的位置，挡风，也看家。', en: 'She placed me by the door. Best spot: blocks wind, watches home.' },
      { who: '星教授', zh: '他讲星星。我想想……星星也是天上的石头。亲近。', en: 'He talks stars. Hmm… stars are stones too. Kindred.' },
      { who: 'Twinies', zh: '它们在我肩上筑过巢。可以。', en: 'They nested on my shoulder once. Acceptable.' },
    ],
    moods: {
      great: { zh: '（符纹微微发烫）好运刻进骨头了。存着。', en: '(runes glow warm) Fortune etched into bone. Stored.' },
      good: { zh: '（缓慢点头）路是平的。走。', en: '(slow nod) Road is flat. Walk.' },
      meh: { zh: '（纹丝不动）雾天。等。石头最擅长等。', en: '(motionless) Foggy day. Wait. Stones wait best.' },
      oops: { zh: '（肩上落了一片苔藓）旧的东西掉了，才放得下新的。', en: '(moss flakes off) Old things fall so new things fit.' },
    },
  },
  {
    id: 'twins',
    glyph: '🐦🐦',
    color: '#f0b6d8',
    nameZh: 'Twinies',
    nameEn: 'Twinies',
    roleZh: '合盘双鸟 · 一心同体的两只',
    roleEn: 'Synastry Twins · Two bodies, one heart',
    traitZh: '永远同时开口，然后为一半的缘分吵架。',
    traitEn: 'Always speak at once — then argue over half the chemistry.',
    storyZh:
      '同一颗蛋里孵出来的两只，破壳那天正好是金星合月。一只负责唱高音（你的盘），一只负责唱低音（ta 的盘），和声就是缘分指数。偶尔也会互相啄毛，那是它们讨论"这段关系谁先低头"的方式。',
    storyEn:
      'Two hatchlings from one egg, cracked open under Venus conjunct Moon. One sings treble (your chart), one sings bass (theirs); their harmony is the chemistry score. Sometimes they preen-fight — that\'s just how they debate "who apologizes first."',
    catchZh: '两个人呀——呸，我们说的是你们的两个人！',
    catchEn: 'We two— ahem, we mean you two!',
    bonds: [
      { who: '露娜', zh: '师父能听懂我们同时说话。全世界只有她。', en: 'Master understands us speaking simultaneously. Only her.' },
      { who: '墨墨', zh: '他假装嫌我们吵，但洗牌时会跟着我们打拍子！', en: 'He pretends we\'re noisy — but shuffles in rhythm with our song!' },
      { who: 'Numi', zh: '她把我们俩算成了 2，说 2 是"关系之数"！', en: 'She reduced us both into a 2 — "the number of relationships"!' },
    ],
    moods: {
      great: { zh: '（齐声）金星牵手火星啦！这首歌我们唱高八度！', en: '(unison) Venus holds Mars\' hand! We\'re singing this an octave up!' },
      good: { zh: '（轮流叫）不错不错，你一句我一句，有来有回。', en: '(alternating chirps) Not bad — call and response, nicely balanced.' },
      meh: { zh: '（各站一边）月亮相位有点害羞。给它一点时间。', en: '(perched apart) The lunar aspect is shy. Give it time.' },
      oops: { zh: '（互相靠拢）刑相不是分手歌，是练习合唱的难度段落。', en: '(huddle together) A square isn\'t a breakup song — it\'s the hard chorus. Practice.' },
    },
  },
  {
    id: 'comet',
    glyph: '☄️',
    color: '#ffd76e',
    nameZh: '小彗星',
    nameEn: 'Comet',
    roleZh: '行运信使 · 总在路上',
    roleEn: 'Transit Courier · Always en route',
    traitZh: '每次回来都带外面的新闻，以及一身要扫的星光。',
    traitEn: 'Returns with outside news — and a tail full of stardust to sweep.',
    storyZh:
      '76 年绕一圈的正式编制，但总抄近路，所以经常提前到岗。露娜第一次见它是把它当流星许了个愿，愿望是"想要会送信的朋友"，于是它就留下了，顺便把许愿的流程讲了一遍：其实它只是路过。',
    storyEn:
      'Official period: 76 years per orbit — but it cuts corners, hence always early. Luna first mistook it for a shooting star and wished for "a friend who delivers letters." So it stayed, and gently explained how wishing actually works: it had merely been passing by.',
    catchZh: '刚从外环系统回来，带信了吗？带了。谁的？天知道。',
    catchEn: 'Just back from the outer system. Mail? Yes. For whom? Sky knows.',
    bonds: [
      { who: '露娜', zh: '她是第一个对我许愿的人类……巫师。就多停了一圈。', en: 'She\'s the first witch who wished on me. So I lingered an extra lap.' },
      { who: 'Runi', zh: '石头朋友不用回信，我喜欢。', en: 'A stone friend never expects replies. I like that.' },
      { who: '星教授', zh: '他帮我核过轨道。误差只有一撮星尘。', en: 'He verified my orbit. Margin of error: one pinch of stardust.' },
    ],
    moods: {
      great: { zh: '（拖长尾巴掠过）今日天象五星连珠级！我把好消息捎来了！', en: '(long tail sweep) Five-planet alignment today! Delivered your good news personally!' },
      good: { zh: '（平稳滑行）顺风。不多不少，刚好推你一把。', en: '(glides smoothly) Tailwind. Just enough for one gentle push.' },
      meh: { zh: '（减速）今天天上没什么大事。小事就够了。', en: '(slows) Nothing big in today\'s sky. Small things suffice.' },
      oops: { zh: '（尾巴暗了一下）流星雨也有间歇期。蹲一会儿，再起飞。', en: '(tail dims) Even meteor showers pause. Crouch a bit, then lift off again.' },
    },
  },
]
