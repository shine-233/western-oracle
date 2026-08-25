/**
 * 中文-原文语义对齐标注：22 大牌逐张（人工）+ 56 小牌花色×阶位规则模板（Papus 三段论）。
 * 由 research/pipeline 自动生成，请勿手改。
 */
export interface MajorAlignment {
  cnKeywords: string[]
  enKeywords: string[]
  waiteTheme: string
  confidence: 'high' | 'medium' | 'low'
}

export const MAJOR_ALIGNMENT: Record<string, MajorAlignment> = {
  'fool': { cnKeywords: ['开端', '纯真', '冒险'], enKeywords: ['freedom', 'faith', 'innocence', 'beginnings'], waiteTheme: 'Folly, expiation, the body of the new man', confidence: 'high' },
  'magician': { cnKeywords: ['显化', '意志', '资源'], enKeywords: ['capability', 'empowerment', 'activity'], waiteTheme: 'Skill, diplomacy, will, self-confidence', confidence: 'high' },
  'high-priestess': { cnKeywords: ['直觉', '奥秘', '静观'], enKeywords: ['intuition', 'reflection', 'purity', 'secrets'], waiteTheme: 'Secrets, mystery, the future as yet unrevealed', confidence: 'high' },
  'empress': { cnKeywords: ['丰盛', '孕育', '滋养'], enKeywords: ['fertility', 'creativity', 'abundance'], waiteTheme: 'Fertility, fruitfulness, action of days', confidence: 'high' },
  'emperor': { cnKeywords: ['秩序', '权威', '结构'], enKeywords: ['authority', 'structure', 'control', 'regulation'], waiteTheme: 'Stable power, protection, a great person', confidence: 'high' },
  'hierophant': { cnKeywords: ['传统', '导师', '信仰'], enKeywords: ['education', 'tradition', 'conformity', 'guidance'], waiteTheme: 'Marriage alliance, captivity, mercy and goodness', confidence: 'medium' },
  'lovers': { cnKeywords: ['结合', '选择', '价值观'], enKeywords: ['relationship', 'attraction', 'personal beliefs', 'values'], waiteTheme: 'Attraction, passion, the choice between paths', confidence: 'high' },
  'chariot': { cnKeywords: ['胜利', '意志', '前进'], enKeywords: ['victory', 'willpower', 'self-assertion', 'triumph'], waiteTheme: 'Providence, war, triumph, presumption', confidence: 'high' },
  'strength': { cnKeywords: ['勇气', '柔韧', '驯服'], enKeywords: ['strength', 'courage', 'persuasion', 'compassion'], waiteTheme: 'Power, energy, courage, magnanimity', confidence: 'high' },
  'hermit': { cnKeywords: ['内省', '寻找', '独处'], enKeywords: ['soul-searching', 'introspection', 'solitude', 'guidance'], waiteTheme: 'Prudence, circumspection, a pilgrimage', confidence: 'high' },
  'wheel-of-fortune': { cnKeywords: ['转折', '周期', '机运'], enKeywords: ['turning point', 'fate', 'cycles', 'destiny'], waiteTheme: 'Fate, fortune, success and elevation', confidence: 'high' },
  'justice': { cnKeywords: ['公正', '因果', '真相'], enKeywords: ['justice', 'truth', 'cause and effect', 'law'], waiteTheme: 'Equity, rightness, triumph of the right', confidence: 'high' },
  'hanged-man': { cnKeywords: ['悬置', '换位', '臣服'], enKeywords: ['suspension', 'sacrifice', 'letting go', 'new perspective'], waiteTheme: 'Wisdom, trials, surrender to a greater design', confidence: 'high' },
  'death': { cnKeywords: ['终结', '转化', '重生'], enKeywords: ['ending', 'transformation', 'transition', 'release'], waiteTheme: 'End, mortality, destruction of the old', confidence: 'high' },
  'temperance': { cnKeywords: ['调和', '中道', '耐心'], enKeywords: ['moderation', 'balance', 'patience', 'blending'], waiteTheme: 'Economy, moderation, frugality', confidence: 'high' },
  'devil': { cnKeywords: ['束缚', '欲望', '执念'], enKeywords: ['bondage', 'addiction', 'materialism', 'shadow self'], waiteTheme: 'Ravage, violence, extraordinary efforts', confidence: 'medium' },
  'tower': { cnKeywords: ['剧变', '崩塌', '启示'], enKeywords: ['upheaval', 'ruin', 'revelation', 'sudden change'], waiteTheme: 'Misery, distress, ruin, deception', confidence: 'high' },
  'star': { cnKeywords: ['希望', '疗愈', '信念'], enKeywords: ['hope', 'healing', 'faith', 'inspiration'], waiteTheme: 'Loss, theft, privation; another reading: hope and bright prospects', confidence: 'high' },
  'moon': { cnKeywords: ['幻象', '潜意识', '不安'], enKeywords: ['illusion', 'fear', 'anxiety', 'subconscious'], waiteTheme: 'Hidden enemies, danger, darkness, deception', confidence: 'high' },
  'sun': { cnKeywords: ['喜悦', '成功', '活力'], enKeywords: ['success', 'vitality', 'joy', 'clarity'], waiteTheme: 'Material happiness, fortunate marriage', confidence: 'high' },
  'judgement': { cnKeywords: ['觉醒', '召唤', '重生'], enKeywords: ['awakening', 'rebirth', 'inner calling', 'reckoning'], waiteTheme: 'Change of position, renewal, outcome', confidence: 'high' },
  'world': { cnKeywords: ['圆满', '完成', '整合'], enKeywords: ['completion', 'integration', 'accomplishment', 'wholeness'], waiteTheme: 'Assured success, completion, reward', confidence: 'high' },
}

export const MINOR_RANK_ARC: Record<string, { cn: string; en: string }> = {
  'ace': { cn: '开端', en: 'commencement of the suit principle' },
  '2': { cn: '初步阻力', en: 'opposition to the commencement' },
  '3': { cn: '初步达成', en: 'realization of the commencement' },
  '4': { cn: '停滞/阻力', en: 'obstacles' },
  '5': { cn: '冲突/抗争', en: 'victory after struggle' },
  '6': { cn: '转折点', en: 'the opposition prevails / turning point' },
  '7': { cn: '新的优势', en: 'commencement of success' },
  '8': { cn: '部分受挫', en: 'partial opposition' },
  '9': { cn: '接近完成', en: 'realization of success' },
  '10': { cn: '不确定/终局', en: 'undetermined; the following card explains' },
  'page': { cn: '学习者/信使', en: 'child / messenger stage' },
  'knight': { cn: '行动者/青年', en: 'young man / conflict stage' },
  'queen': { cn: '接纳者/内在', en: 'woman / receptive stage' },
  'king': { cn: '掌控者/外显', en: 'man / creative stage' },
}
