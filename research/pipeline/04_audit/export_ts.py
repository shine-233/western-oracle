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


if __name__ == '__main__':
    export_tarot()
    export_runes()
