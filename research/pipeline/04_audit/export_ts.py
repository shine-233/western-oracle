"""04_audit/export_ts: 把清洗后的数据集导出为站点可用的 TS 模块。

生成:
  src/data/waiteMeanings.ts   — 78 张牌的 Waite 原版牌意（英文）
  src/data/runePoemOE.ts      — 24 符文的古英语卢恩诗对照

站点消费位置:
  - 塔罗详情弹窗显示 "Waite 原文牌意"
  - 符文页显示古英语卢恩诗原文
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


if __name__ == '__main__':
    export_tarot()
    export_runes()
    export_sources()
    export_tetrabiblos()
    export_alignment()
