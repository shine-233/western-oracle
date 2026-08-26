/** 星座/宫位英文档案包：供 signFullText / houseFullText 按 locale 分流。 */

export interface SignProfileEn {
  personality: string
  love: string
  career: string
  shadow: string
}

export const SIGN_EN: Record<string, SignProfileEn> = {
  Aries: {
    personality: 'First child of the zodiac, born with a "me first" charge. You hate beating around bushes; once decided, nine oxen cannot drag you back — you dust off and keep running.',
    love: 'You love openly and loudly — confessing fast, wearing jealousy on your sleeve. You want a partner-in-adventure, not a vine.',
    career: 'Frontier roles suit you: startups, sales, emergency work, competitive sport — wherever the challenge is loudest.',
    shadow: 'Impatience and three-minute passions are the curriculum: learn to breathe, upgrade "fast" into "fast AND steady".',
  },
  Taurus: {
    personality: 'The zodiac\'s finest connoisseur of the present: a good meal, a good song, a stable bond — comfort you can feel in your bones. Slow, but every step lands solid.',
    love: 'Love is expressed through care: good food, remembered anniversaries, safety delivered daily. You expect the same steadiness back.',
    career: 'Builders of lasting value: finance, craft, hospitality, land — anything where patience compounds.',
    shadow: 'Stubbornness and over-comfort can fossilize into a rut. Practice letting one small thing change each month.',
  },
  Gemini: {
    personality: 'The zodiac\'s live wire: two minds, endless tabs open. You learn everything twice as fast and get bored half as slow.',
    love: 'Love begins as conversation. You need a partner who can play verbal ping-pong and never stop being curious about you.',
    career: 'Words, networks, trade, teaching — anywhere information flows, you are the switchboard.',
    shadow: 'Scattered focus and shallow dives. Finish one thing completely before opening tab number eleven.',
  },
  Cancer: {
    personality: 'Carrying your home on your back like a shell: memory, family and feelings are your architecture. Soft inside, armored exactly where it counts.',
    love: 'You love by nurturing — feeding, remembering, protecting. Trust builds slowly and runs deeper than most.',
    career: 'Caretaker instincts made professional: hospitality, therapy, HR, real estate — places people call safe.',
    shadow: 'Mood tides and indirect hints. Say the need out loud instead of testing whether they guess.',
  },
  Leo: {
    personality: 'Born with internal stage lighting. Generous, dramatic, loyal to a fault — you would rather burn bright than flicker safe.',
    love: 'Grand romantic gestures are your native tongue. You need applause, but you give devotion tenfold.',
    career: 'Leading from the front: creative direction, performance, management, anyroom with an audience.',
    shadow: 'Pride turns applause into oxygen. Learn that quiet rooms are not always rejection.',
  },
  Virgo: {
    personality: 'The zodiac\'s editor: you see the flaw before the beauty, then fix it so quietly nobody noticed either. Standards are your love language and your cage.',
    love: 'Love shown through acts of service — remembering your allergy, fixing your resume. Praise feels awkward; notice the effort instead.',
    career: 'Precision professions: analysis, medicine, editing, quality anything — chaos fears you.',
    shadow: 'Perfectionism becomes self-punishment. Done at 90% beats perfect never.',
  },
  Libra: {
    personality: 'Walking aesthetics and diplomacy. You weigh every side before speaking — not indecision, but genuine fairness operating in real time.',
    love: 'Partnership is your native habitat; you love the we as much as the me. Just remember which opinions are originally yours.',
    career: 'Law, design, negotiation, curation — anywhere balance and beauty close deals.',
    shadow: 'Conflict-avoidance postpones the inevitable. One honest "no" saves ten resentful maybes.',
  },
  Scorpio: {
    personality: 'Still water with depth charges. You experience everything at maximum intensity and reveal minimum surface — until someone earns the vault key.',
    love: 'All-or-nothing intimacy: soul-merge or nothing. Loyalty absolute; betrayal never forgotten, rarely forgiven.',
    career: 'Crisis, research, psychology, investigation — you walk toward what others flee.',
    shadow: 'Control as armor and suspicion as radar. Vulnerability is the actual superpower you keep declining.',
  },
  Sagittarius: {
    personality: 'The zodiac\'s arrow aimed at meaning: philosophy, horizons, the next border. Restless feet, honest mouth, allergic to cages.',
    love: 'Freedom-loving fire — you need a travel companion, not a leash. Honesty even when it stings.',
    career: 'Teaching, publishing, travel, international anything — wisdom needs mileage.',
    shadow: 'Blunt words and wandering commitments. Anchor somewhere long enough to go deep once.',
  },
  Capricorn: {
    personality: 'Mountain-goat patience with a CEO\'s calendar. You trade shortcuts for summits — and you always collect on the climb.',
    love: 'Love proven by reliability: showing up, building slowly, planning futures. Romance arrives practical and lands permanent.',
    career: 'Architecture of empires: management, engineering, finance — authority earned step by step.',
    shadow: 'Work-worth conflation. You were valuable before the first promotion, too.',
  },
  Aquarius: {
    personality: 'The zodiac\'s futurist: three steps ahead, half a step sideways. Systems thinker, humanitarian, professionally unbothered by "normal".',
    love: 'Friendship-first romance — space to breathe, ideas to share, zero clinginess tolerated.',
    career: 'Technology, activism, science, network-building — the future hires you early.',
    shadow: 'Detachment disguised as objectivity. Feelings are data too; download them sometimes.',
  },
  Pisces: {
    personality: 'The zodiac\'s dream ocean: empathy without borders, imagination without brakes. You absorb rooms — gorgeous gift, leaky bucket.',
    love: 'Soul-merge romance — boundaries blur on purpose. Just keep one foot on the shore of reality.',
    career: 'Arts, healing, music, spirituality — imagination is your infrastructure.',
    shadow: 'Escapism when reality bites. Structure is not the enemy of magic; it is the frame that holds it.',
  },
}

export interface HouseThemeEn {
  keywords: string[]
  theme: string
}

export const HOUSE_EN: Record<number, HouseThemeEn> = {
  1: { keywords: ['self', 'appearance', 'beginnings'], theme: 'House of Self — the front door of your chart: how you arrive, how you look, the first note you play.' },
  2: { keywords: ['money', 'values', 'security'], theme: 'House of Resources — what you own, what you earn, and the worth you refuse to discount.' },
  3: { keywords: ['communication', 'learning', 'siblings'], theme: 'House of Signals — conversations, commutes, cousins; the neighborhood network of your mind.' },
  4: { keywords: ['home', 'roots', 'family'], theme: 'House of Roots — the foundation under everything: family, memory, and the floor you stand on.' },
  5: { keywords: ['romance', 'creativity', 'play'], theme: 'House of Play — romance, art, and the inner child demanding stage time.' },
  6: { keywords: ['work', 'health', 'routine'], theme: 'House of Craft — daily work, body maintenance, and the small systems that carry big lives.' },
  7: { keywords: ['partnership', 'mirror', 'commitment'], theme: 'House of the Other — one-on-one bonds; the person standing across from you, holding up a mirror.' },
  8: { keywords: ['depth', 'shared resources', 'transformation'], theme: 'House of Depths — merged finances, raw psychology, and transformations that cannot be undone.' },
  9: { keywords: ['philosophy', 'travel', 'higher learning'], theme: 'House of Horizons — far travel, big questions, and the university of meaning.' },
  10: { keywords: ['career', 'reputation', 'ambition'], theme: 'House of the Summit — public standing, career peak, and what strangers assume about you.' },
  11: { keywords: ['friends', 'community', 'visions'], theme: 'House of Allies — friendships, communities, and the future you are drafting together.' },
  12: { keywords: ['subconscious', 'solitude', 'compassion'], theme: 'House of the Hidden — dreams, solitude, and everything working for you behind the curtain.' },
}

/** 英文版星座全档；缺数据返回 null（调用方回退中文） */
export function signFullTextEn(signIndex: number): string | null {
  const idx = ((signIndex % 12) + 12) % 12
  const names = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']
  const name = names[idx]!
  const p = SIGN_EN[name]
  if (!p) return null
  return [
    `【${name}】`,
    p.personality,
    `♥ Love style: ${p.love}`,
    `✦ Career gifts: ${p.career}`,
    `☾ Shadow work: ${p.shadow}`,
  ].join('\n')
}

/** 英文版宫位解读；缺数据返回 null */
export function houseFullTextEn(house: number): string | null {
  const h = HOUSE_EN[(house || 1) - 0]
  if (!h && !HOUSE_EN[house]) return null
  const hit = HOUSE_EN[house]
  if (!hit) return null
  return `【House ${house}】Keywords: ${hit.keywords.join(' / ')}\n${hit.theme}`
}
