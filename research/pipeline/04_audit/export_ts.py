"""04_audit/export_ts: 把清洗后的数据集导出为站点可用的 TS 模块。

生成:
  src/data/waiteMeanings.ts        — 78 张牌的 Waite 原版牌意（英文）
  src/data/runePoems.ts            — 24 符文的卢恩诗对照
  src/data/tarotSources.ts         — 塔罗三源对照（Waite/Papus/McElroy）
  src/data/tetrabiblosPlanets.ts   — Tetrabiblos 行星性质/庙宫/旺位
  src/data/alignment.ts            — 中文-原文语义对齐
  src/data/fixedStars.ts           — Robson 固定恒星目录（96星）
  src/data/tarotModern.ts          — Tarotoo 现代结构化塔罗层（78张）
  src/data/bookTDecans.ts          — Golden Dawn 三十六旬对应（36）
  src/data/dreamsMiller.ts         — Miller 解梦词典（2250词条，建议懒加载）
  src/data/palmistrySections.ts    — Cheiro 手相章节库（18节）
  src/data/sepharialNumbers.ts     — Sepharial 数字学释义
  src/data/kunzBirthstones.ts      — Kunz 诞生石/水晶民俗
  src/data/zodiacFacts.ts          — 黄道事实层（12星座）
  src/data/tetrabiblosBooks34.ts   — Tetrabiblos B3/B4 命盘专题引文
  src/data/classicalPassages.ts    — Lilly/Leo 星座宫位源头段落

站点消费位置:
  - 塔罗详情弹窗显示 "Waite 原文牌意"
  - 符文页显示古英语卢恩诗原文
  - 塔罗详情弹窗显示现代语境四域解读 + GD 十度分金归属
  - 解梦页 Miller 扩展词典（动态 import 懒加载）
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / 'data'
SRC_DATA = ROOT.parent / 'src' / 'data'


def ts_str(s: str) -> str:
    return s.replace('\\', '\\\\').replace("'", "\\'")


def export_tarot() -> None:
    clean = json.loads((DATA / 'tarot_waite_v1.json').read_text(encoding='utf-8'))
    lines = [
        '/**',
        ' * Waite《The Pictorial Key to the Tarot》(1911, 公版) 原版牌意。',
        ' * 由 research/pipeline 自动生成，请勿手改；数据来源与清洗过程见 research/README.md。',
        ' */',
        'export interface WaiteMeaning {',
        "  up: string",
        "  rev: string",
        "  desc: string",
        '}',
        '',
        'export const WAITE_MEANINGS: Record<string, WaiteMeaning> = {',
    ]
    for c in clean:
        lines.append(
            f"  '{c['site_id']}': {{ up: '{ts_str(c['meaning_up'])}', rev: '{ts_str(c['meaning_rev'])}', desc: '{ts_str(c['description'])}' }},"
        )
    lines.append('}')
    outp = SRC_DATA / 'waiteMeanings.ts'
    outp.write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print(f'exported {len(clean)} -> {outp}')


def export_runes() -> None:
    runes = json.loads((DATA / 'rune_poems_v2.json').read_text(encoding='utf-8'))
    lines = [
        '/**',
        ' * 三首卢恩诗对照（盎格鲁-撒克逊 8-9c / 挪威 c.13c / 冰岛 c.15c），',
        ' * 英译 Bruce Dickins 1915（公版）。由 research/pipeline 自动生成，请勿手改。',
        ' */',
        "export type PoemLang = 'anglo_saxon' | 'norwegian' | 'icelandic'",
        '',
        'export interface RunePoemEntry {',
        "  original: string",
        "  translation: string",
        "  source: string",
        '}',
        '',
        'export interface RunePoems {',
        "  rune: string",
        "  poems: Partial<Record<PoemLang, RunePoemEntry>>",
        '}',
        '',
        'export const RUNE_POEMS: RunePoems[] = [',
    ]
    for r in runes:
        poems = []
        for lang, p in r['poems'].items():
            poems.append(
                f"    {lang}: {{ original: '{ts_str(p['original'])}', translation: '{ts_str(p['translation'])}', source: '{ts_str(p['source'])}' }},"
            )
        lines.append(f"  {{ rune: '{r['rune']}', poems: {{")
        lines.extend(poems)
        lines.append('  }},')
    lines.append(']')
    outp = SRC_DATA / 'runePoems.ts'
    outp.write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print(f'exported {len(runes)} -> {outp}')


def export_sources() -> None:
    merged = json.loads((DATA / 'tarot_sources_v2.json').read_text(encoding='utf-8'))
    lines = [
        '/**',
        ' * 塔罗三源对照数据集：',
        ' * 1. Waite《The Pictorial Key to the Tarot》1911（公版）',
        ' * 2. Papus《The Tarot of the Bohemians》1892（公版，A.P. Morton 英译）',
        ' * 3. Mark McElroy《A Guide to Tarot Meanings》（作者声明公版，dariusk/corpora）',
        ' * 由 research/pipeline 自动生成，请勿手改。',
        ' */',
        'export interface TarotSourceEntry {',
        "  papus: string",
        "  keywords: string[]",
        "  fortuneTelling: string[]",
        '}',
        '',
        'export const TAROT_SOURCES: Record<string, TarotSourceEntry> = {',
    ]
    for c in merged:
        kw = ', '.join(f"'{ts_str(k)}'" for k in c['mcelroy']['keywords'])
        ft = ', '.join(f"'{ts_str(f)}'" for f in c['mcelroy']['fortune_telling'])
        lines.append(
            f"  '{c['site_id']}': {{ papus: '{ts_str(c['papus']['meaning'])}', keywords: [{kw}], fortuneTelling: [{ft}] }},"
        )
    lines.append('}')
    outp = SRC_DATA / 'tarotSources.ts'
    outp.write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print(f'exported {len(merged)} -> {outp}')


def export_tetrabiblos() -> None:
    tb = json.loads((DATA / 'tetrabiblos_astro_v1.json').read_text(encoding='utf-8'))
    lines = [
        '/**',
        ' * Ptolemy《Tetrabiblos》Book I 选章（Ashmand 1822 英译，公版）：',
        ' * 行星性质（Ch.IV）/ 庙宫（Ch.XX）/ 旺位（Ch.XXII），含原文引句与出处。',
        ' * 由 research/pipeline 自动生成，请勿手改。',
        ' */',
        'export interface TetrabiblosEntry {',
        "  natureQuote: string",
        "  domicile: string[]",
        "  housesQuote: string",
        "  exaltation: string",
        "  exaltationQuote: string",
        '}',
        '',
        'export const TETRABIBLOS_PLANETS: Record<string, TetrabiblosEntry> = {',
    ]
    for p, v in tb['planets'].items():
        lines.append(
            f"  '{p}': {{ natureQuote: '{ts_str(v['nature']['quote'])}', domicile: {json.dumps(v['houses']['domicile'])}, "
            f"housesQuote: '{ts_str(v['houses']['quote'])}', exaltation: '{v['exaltation']['exaltation']}', "
            f"exaltationQuote: '{ts_str(v['exaltation']['quote'])}' }},"
        )
    lines.append('}')
    outp = SRC_DATA / 'tetrabiblosPlanets.ts'
    outp.write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print(f'exported {len(tb["planets"])} -> {outp}')


def export_alignment() -> None:
    al = json.loads((DATA / 'alignment_cn_en_v1.json').read_text(encoding='utf-8'))
    lines = [
        '/**',
        ' * 中文-原文语义对齐标注：22 大牌逐张（人工）+ 56 小牌花色×阶位规则模板（Papus 三段论）。',
        ' * 由 research/pipeline 自动生成，请勿手改。',
        ' */',
        'export interface MajorAlignment {',
        "  cnKeywords: string[]",
        "  enKeywords: string[]",
        "  waiteTheme: string",
        "  confidence: 'high' | 'medium' | 'low'",
        '}',
        '',
        'export const MAJOR_ALIGNMENT: Record<string, MajorAlignment> = {',
    ]
    for m in al['major_alignments']:
        cn = ', '.join(f"'{ts_str(k)}'" for k in m['cn_keywords'])
        en = ', '.join(f"'{ts_str(k)}'" for k in m['en_keywords'])
        lines.append(
            f"  '{m['site_id']}': {{ cnKeywords: [{cn}], enKeywords: [{en}], waiteTheme: '{ts_str(m['waite_theme'])}', confidence: '{m['confidence']}' }},"
        )
    lines.append('}')
    lines.append('')
    lines.append('export const MINOR_RANK_ARC: Record<string, { cn: string; en: string }> = {')
    for rank, v in al['minor_rank_arc'].items():
        lines.append(f"  '{rank}': {{ cn: '{ts_str(v['cn'])}', en: '{ts_str(v['en'])}' }},")
    lines.append('}')
    outp = SRC_DATA / 'alignment.ts'
    outp.write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print(f"exported {len(al['major_alignments'])} majors + {len(al['minor_rank_arc'])} rank templates -> {outp}")


def export_fixed_stars() -> None:
    d = json.loads((DATA / 'fixed_stars_robson_v1.json').read_text(encoding='utf-8'))
    lines = [
        '/**',
        ' * Vivian E. Robson《The Fixed Stars and Constellations in Astrology》(1923, 公版)',
        ' * 恒星目录：行星性质与分场景释义。由 research/pipeline 自动生成，请勿手改。',
        ' */',
        'export interface FixedStarEntry {',
        "  name: string",
        "  designation: string",
        "  nature: string[]",
        "  influence: string",
        "  withSun: string",
        "  withMoon: string",
        "  culminating: string",
        '}',
        '',
        'export const FIXED_STARS: Record<string, FixedStarEntry> = {',
    ]
    for s in d['stars']:
        nature = ', '.join(f"'{ts_str(n)}'" for n in s['nature'])
        lines.append(
            f"  '{ts_str(s['name_key'])}': {{ name: '{ts_str(s['name'])}', designation: '{ts_str(s['designation'])}', "
            f"nature: [{nature}], influence: '{ts_str(s['influence'])}', withSun: '{ts_str(s['with_sun'])}', "
            f"withMoon: '{ts_str(s['with_moon'])}', culminating: '{ts_str(s['culminating'])}' }},"
        )
    lines.append('}')
    outp = SRC_DATA / 'fixedStars.ts'
    outp.write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print(f"exported {d['count']} -> {outp}")


def export_tarot_modern() -> None:
    d = json.loads((DATA / 'tarot_modern_v1.json').read_text(encoding='utf-8'))
    lines = [
        '/**',
        ' * Tarotoo 现代结构化塔罗层（MIT, github.com/Tarotoo-com/tarotoo-tarot-dataset）：',
        ' * 恋爱/事业/情绪/灵性四域正逆位解读 + 是非占卜 + 行星星座归属。',
        ' * 小牌归属经本仓库 Book T decan 表交叉验证一致。自动生成，请勿手改。',
        ' */',
        'export interface TarotModernEntry {',
        "  element: string | null",
        "  planet: string | null",
        "  zodiac: string | null",
        "  yesNo: string | null",
        "  yesNoReversed: string | null",
        "  keywordsUpright: string[]",
        "  keywordsReversed: string[]",
        "  meaningUpright: string",
        "  meaningReversed: string",
        "  love: string",
        "  loveReversed: string",
        "  career: string",
        "  careerReversed: string",
        "  mood: string",
        "  moodReversed: string",
        "  spiritual: string",
        "  spiritualReversed: string",
        '}',
        '',
        'export const TAROT_MODERN: Record<string, TarotModernEntry> = {',
    ]
    for c in d['cards']:
        ku = ', '.join(f"'{ts_str(k)}'" for k in c['keywords_upright'])
        kr = ', '.join(f"'{ts_str(k)}'" for k in c['keywords_reversed'])
        suit = f"'{ts_str(c['suit'])}'" if c['suit'] else 'null'
        lines.append(
            f"  '{c['site_id']}': {{ element: '{ts_str(c['element'] or '')}', planet: '{ts_str(c['planet'] or '')}', "
            f"zodiac: {json.dumps(c['zodiac'], ensure_ascii=False)}, yesNo: '{ts_str(c['yes_no'] or '')}', "
            f"yesNoReversed: '{ts_str(c['yes_no_reversed'] or '')}', keywordsUpright: [{ku}], keywordsReversed: [{kr}], "
            f"meaningUpright: '{ts_str(c['meaning_upright'])}', meaningReversed: '{ts_str(c['meaning_reversed'])}', "
            f"love: '{ts_str(c['love'])}', loveReversed: '{ts_str(c['love_reversed'])}', career: '{ts_str(c['career'])}', "
            f"careerReversed: '{ts_str(c['career_reversed'])}', mood: '{ts_str(c['mood'])}', moodReversed: '{ts_str(c['mood_reversed'])}', "
            f"spiritual: '{ts_str(c['spiritual'])}', spiritualReversed: '{ts_str(c['spiritual_reversed'])}' }},"
        )
    lines.append('}')
    outp = SRC_DATA / 'tarotModern.ts'
    outp.write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print(f"exported {d['count']} -> {outp}")


def export_bookt_decans() -> None:
    d = json.loads((DATA / 'book_t_decans_v1.json').read_text(encoding='utf-8'))
    lines = [
        '/**',
        ' * Golden Dawn《Book T – The Tarot》(约1892, 公版) 三十六旬对应表：',
        ' * 星座十度区间 × Chaldean 守护 × 塔罗小牌 × GD 称号。',
        ' * 由 research/pipeline 程序化生成（Chaldean 序列 + 锚点校验），请勿手改。',
        ' */',
        'export interface DecanInfo {',
        "  sign: string",
        "  decan: number",
        "  fromDegree: number",
        "  toDegree: number",
        "  ruler: string",
        "  gdTitle: string",
        '}',
        '',
        'export const BOOK_T_DECANS: Record<string, DecanInfo> = {',
    ]
    for x in d['decans']:
        lines.append(
            f"  '{x['card']}': {{ sign: '{x['sign']}', decan: {x['decan']}, fromDegree: {x['from_degree']}, "
            f"toDegree: {x['to_degree']}, ruler: '{x['ruler']}', gdTitle: '{ts_str(x['gd_title'])}' }},"
        )
    lines.append('}')
    outp = SRC_DATA / 'bookTDecans.ts'
    outp.write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print(f"exported {d['count']} -> {outp}")


def export_dreams_miller() -> None:
    d = json.loads((DATA / 'dreams_miller_v1.json').read_text(encoding='utf-8'))
    lines = [
        '/**',
        ' * Gustavus Hindman Miller《Ten Thousand Dreams Interpreted》(1901, 公版, PG #926)。',
        ' * 2250 词条解梦词典。文件较大，站点侧请使用动态 import() 懒加载。',
        ' * 由 research/pipeline 自动生成，请勿手改。',
        ' */',
        'export interface MillerDreamEntry {',
        "  term: string",
        "  meanings: string[]",
        '}',
        '',
        'export const MILLER_DREAMS: MillerDreamEntry[] = [',
    ]
    for e in d['entries']:
        meanings = ', '.join(f"'{ts_str(m)}'" for m in e['meanings'])
        lines.append(f"  {{ term: '{ts_str(e['term'])}', meanings: [{meanings}] }},")
    lines.append(']')
    outp = SRC_DATA / 'dreamsMiller.ts'
    outp.write_text('\n'.join(lines) + '\n', encoding='utf-8')
    size = outp.stat().st_size
    print(f"exported {d['count']} -> {outp} ({size} bytes; lazy-load recommended)")


def export_palmistry_sections() -> None:
    d = json.loads((DATA / 'cheiro_palmistry_v1.json').read_text(encoding='utf-8'))
    lines = [
        '/**',
        ' * Cheiro《Palmistry for All》(1916, 公版, PG #20480) 手相章节库：',
        ' * 主线/副线/星丘/手型结构化原文。由 research/pipeline 自动生成，请勿手改。',
        ' */',
        'export interface PalmistrySection {',
        "  chapter: string",
        "  title: string",
        "  text: string",
        '}',
        '',
        'export const CHEIRO_SECTIONS: Record<string, PalmistrySection> = {',
    ]
    for key, v in d['sections'].items():
        text = ts_str(v['text'].replace('\n', ' '))
        lines.append(f"  '{key}': {{ chapter: '{v['chapter']}', title: '{ts_str(v['title'])}', text: '{text}' }},")
    lines.append('}')
    outp = SRC_DATA / 'palmistrySections.ts'
    outp.write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print(f"exported {len(d['sections'])} -> {outp}")


def export_sepharial_numbers() -> None:
    d = json.loads((DATA / 'sepharial_numbers_v1.json').read_text(encoding='utf-8'))
    lines = [
        '/**',
        ' * Sepharial《The Kabala of Numbers》(约1911, 公版)：',
        ' * Minor Key 数字 1-9 含义与对应行星、问事所思、合成数释义表。',
        ' * 由 research/pipeline 自动生成，请勿手改。',
        ' */',
        'export interface NumberMeaning {',
        "  meaning: string",
        "  planet?: string",
        '}',
        '',
        'export const KABALA_MINOR_KEY: Record<string, NumberMeaning> = {',
    ]
    for n, v in sorted(d['minor_key'].items(), key=lambda kv: int(kv[0])):
        planet = f", planet: '{ts_str(v['planet'])}'" if v.get('planet') else ''
        lines.append(f"  '{n}': {{ meaning: '{ts_str(v['meaning'])}'{planet} }},")
    lines.append('}')
    lines.append('')
    lines.append('export const KABALA_THINGS_THOUGHT: Record<string, string> = {')
    for n, txt in sorted(d['things_thought_of'].items(), key=lambda kv: int(kv[0])):
        lines.append(f"  '{n}': '{ts_str(txt)}',")
    lines.append('}')
    lines.append('')
    lines.append('export const KABALA_RESULTANTS: Record<string, string> = {')
    for n, txt in sorted(d['resultant_meanings'].items(), key=lambda kv: int(kv[0])):
        lines.append(f"  '{n}': '{ts_str(txt)}',")
    lines.append('}')
    outp = SRC_DATA / 'sepharialNumbers.ts'
    outp.write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print(f"exported minor_key={len(d['minor_key'])} thought={len(d['things_thought_of'])} resultants={len(d['resultant_meanings'])} -> {outp}")


def export_kunz_birthstones() -> None:
    d = json.loads((DATA / 'kunz_birthstones_v1.json').read_text(encoding='utf-8'))
    lines = [
        '/**',
        ' * George F. Kunz《The Curious Lore of Precious Stones》(1913, 公版)：',
        ' * 十二诞生石票数表（八传统汇总）+ 大祭司胸甲十二石对照 + 水晶凝视章引文。',
        ' * 由 research/pipeline 自动生成，请勿手改。',
        ' */',
        'export interface BirthstoneMonth {',
        "  stone: string",
        "  lists: number",
        '}',
        '',
        'export const BIRTHSTONES_BY_MONTH: Record<string, BirthstoneMonth[]> = {',
    ]
    for month, stones in d['favored_by_month'].items():
        items = ', '.join(f"{{ stone: '{ts_str(x['stone'])}', lists: {x['count']} }}" for x in stones)
        lines.append(f"  '{month}': [{items}],")
    lines.append('}')
    lines.append('')
    lines.append('export const BREASTPLATE_STONES: Array<{ no: string; authorizedVersion: string; laterCorrection: string; foundationStone: string }> = [')
    for r in d['breastplate_and_foundation']:
        lines.append(
            f"  {{ no: '{r['no']}', authorizedVersion: '{ts_str(r['authorized_version'])}', "
            f"laterCorrection: '{ts_str(r['later_correction'])}', foundationStone: '{ts_str(r['foundation_stone'])}' }},"
        )
    lines.append(']')
    lines.append('')
    lines.append(f"export const CRYSTAL_GAZING_PASSAGE = '{ts_str(d['crystal_gazing']['passage'])}'")
    outp = SRC_DATA / 'kunzBirthstones.ts'
    outp.write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print(f"exported months={len(d['favored_by_month'])} breastplate={len(d['breastplate_and_foundation'])} -> {outp}")


def export_zodiac_facts() -> None:
    d = json.loads((DATA / 'zodiac_facts_v1.json').read_text(encoding='utf-8'))
    lines = [
        '/**',
        ' * 黄道事实层（dariusk/corpora zodiac.json, CC0）：',
        ' * 黄经区间/元素/古典与现代守护/符号/日期/关键词。',
        ' * 古典守护列已与本仓库 Tetrabiblos 庙宫表交叉验证一致。自动生成，请勿手改。',
        ' */',
        'export interface ZodiacFact {',
        "  sign: string",
        "  longitudeStart: number",
        "  longitudeEnd: number",
        "  element: string",
        "  rulerClassic: string",
        "  rulerModern: string",
        "  unicodeSymbol: string",
        "  gloss: string",
        "  approximateDates: string",
        "  keywords: string[]",
        '}',
        '',
        'export const ZODIAC_FACTS: Record<string, ZodiacFact> = {',
    ]
    for s in d['signs']:
        kw = ', '.join(f"'{ts_str(k)}'" for k in s['keywords'])
        lines.append(
            f"  '{s['sign']}': {{ sign: '{s['sign']}', longitudeStart: {s['longitude_start']}, longitudeEnd: {s['longitude_end']}, "
            f"element: '{s['element']}', rulerClassic: '{s['ruler_classic']}', rulerModern: '{ts_str(s['ruler_modern'])}', "
            f"unicodeSymbol: '{s['unicode_symbol']}', gloss: '{ts_str(s['gloss'])}', approximateDates: '{ts_str(s['approximate_dates'])}', "
            f"keywords: [{kw}] }},"
        )
    lines.append('}')
    outp = SRC_DATA / 'zodiacFacts.ts'
    outp.write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print(f"exported {len(d['signs'])} -> {outp}")


def export_tetrabiblos_books34() -> None:
    d = json.loads((DATA / 'tetrabiblos_books34_v1.json').read_text(encoding='utf-8'))
    lines = [
        '/**',
        ' * Ptolemy《Tetrabiblos》Book III/IV 命盘专题章选段（Ashmand 1822 英译，公版）：',
        ' * 兄弟/婚姻/子女/旅行/死亡品质/职业等主题引文与传统宫位对应。',
        ' * houseHint 为传统占星对应（curated）。自动生成，请勿手改。',
        ' */',
        'export interface TetrabiblosTopic {',
        "  book: number",
        "  chapter: string",
        "  title: string",
        "  houseHint: number",
        "  quote: string",
        "  source: string",
        '}',
        '',
        'export const TETRABIBLOS_TOPICS: Record<string, TetrabiblosTopic> = {',
    ]
    for topic, v in sorted(d['topics'].items()):
        lines.append(
            f"  '{topic}': {{ book: {v['book']}, chapter: '{v['chapter']}', title: '{ts_str(v['title'])}', "
            f"houseHint: {v['house_hint']}, quote: '{ts_str(v['quote'])}', source: '{ts_str(v['source'])}' }},"
        )
    lines.append('}')
    outp = SRC_DATA / 'tetrabiblosBooks34.ts'
    outp.write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print(f"exported {len(d['topics'])} topics -> {outp}")


def export_classical_passages() -> None:
    leo = json.loads((DATA / 'leo_nativity_v1.json').read_text(encoding='utf-8'))
    lilly = json.loads((DATA / 'lilly_signs_v1.json').read_text(encoding='utf-8'))
    lines = [
        '/**',
        ' * 星座/宫位语义层的公版源头文献段落：',
        ' * Alan Leo《How to Judge a Nativity》(1928 ed.) 十二宫/日座/月座章节；',
        ' * William Lilly《Christian Astrology》(1647) 星座描述章。',
        ' * OCR 长音 s 噪声按原貌保留。自动生成，请勿手改。',
        ' */',
        'export interface ClassicalPassage {',
        "  anchor: string",
        "  passage: string",
        '}',
        '',
        'export const LEO_NATIVITY_SECTIONS: Record<string, ClassicalPassage> = {',
    ]
    for key, v in leo['sections'].items():
        passage = ts_str(v['passage'].replace('\n', ' '))
        lines.append(f"  '{key}': {{ anchor: '{ts_str(v['anchor'])}', passage: '{passage}' }},")
    lines.append('}')
    lines.append('')
    lilly_ch = ts_str(lilly['chapter_passage'].replace('\n', ' '))
    lines.append(f'export const LILLY_SIGNS_CHAPTER = \'{lilly_ch}\'')
    outp = SRC_DATA / 'classicalPassages.ts'
    outp.write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print(f"exported leo sections={len(leo['sections'])} lilly chapter ({len(lilly_ch)} chars) -> {outp}")


if __name__ == '__main__':
    export_tarot()
    export_runes()
    export_sources()
    export_tetrabiblos()
    export_alignment()
    export_fixed_stars()
    export_tarot_modern()
    export_bookt_decans()
    export_dreams_miller()
    export_palmistry_sections()
    export_sepharial_numbers()
    export_kunz_birthstones()
    export_zodiac_facts()
    export_tetrabiblos_books34()
    export_classical_passages()
