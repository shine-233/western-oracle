"""03_clean: 清洗三首卢恩诗 → 老弗萨克 24 符文对照数据集 v2。

来源:
  - 盎格鲁-撒克逊卢恩诗 (29节, 8-9世纪) — classics/rune_poem_anglosaxon_raw.txt
  - 挪威卢恩诗 (16节, 约13世纪) — classics/rune_poems_norwegian_icelandic_raw.txt
  - 冰岛卢恩诗 (16节, 约15世纪) — 同上
英译均为 Bruce Dickins (1915, 公版)。

映射规则:
  盎格鲁-撒克逊 29 节中 24 节映射到老弗萨克（Ac/Æsc/Yr/Iar/Ear 为弗萨克独有，排除）
  挪威/冰岛为年轻弗萨克 16 符文，按通行对应映射；Ýr -> Algiz（字形演变）。
  老弗萨克中 8 个符文 (Gebo/Wunjo/Eihwaz/Perthro/Ehwaz/Ingwaz/Othala/Dagaz)
  在年轻弗萨克中被弃用 → 无挪威/冰岛诗节，属预期缺口。

输出: data/rune_poems_v2.json（每符文含 1-3 首诗节）
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CLASSICS = ROOT / 'classics'
DATA = ROOT / 'data'

FUTHARK_ALL = {
    'Fehu', 'Uruz', 'Thurisaz', 'Ansuz', 'Raidho', 'Kenaz', 'Gebo', 'Wunjo',
    'Hagalaz', 'Nauthiz', 'Isa', 'Jera', 'Eihwaz', 'Perthro', 'Algiz', 'Sowilo',
    'Tiwaz', 'Berkano', 'Ehwaz', 'Mannaz', 'Laguz', 'Ingwaz', 'Othala', 'Dagaz',
}

AS_MAP = {
    'FEOH': 'Fehu', 'UR': 'Uruz', 'THORN': 'Thurisaz', 'OS': 'Ansuz',
    'RAD': 'Raidho', 'CEN': 'Kenaz', 'GYFU': 'Gebo', 'WENNE': 'Wunjo',
    'HA EGL': 'Hagalaz', 'NYD': 'Nauthiz', 'IS': 'Isa', 'GER': 'Jera',
    'EOH': 'Eihwaz', 'PEORDH': 'Perthro', 'EOLH': 'Algiz', 'SIGEL': 'Sowilo',
    'TIR': 'Tiwaz', 'BEORC': 'Berkano', 'EH': 'Ehwaz', 'MAN': 'Mannaz',
    'LAGU': 'Laguz', 'ING': 'Ingwaz', 'ETHEL': 'Othala', 'DAEG': 'Dagaz',
    'AC': None, 'AESC': None, 'YR': None, 'IAR': None, 'EAR': None,
}

NO_MAP = {
    'FÉ': 'Fehu', 'ÚR': 'Uruz', 'ÞURS': 'Thurisaz', 'ÓSS': 'Ansuz',
    'REIÐ': 'Raidho', 'KAUN': 'Kenaz', 'HAGALL': 'Hagalaz', 'NAUDHR': 'Nauthiz',
    'ÍS': 'Isa', 'ÁR': 'Jera', 'SÓL': 'Sowilo', 'TÝR': 'Tiwaz',
    'BJARKAN': 'Berkano', 'MAÐR': 'Mannaz', 'LǪGR': 'Laguz', 'ÝR': 'Algiz',
}

IS_MAP = {
    'FÉ': 'Fehu', 'ÚR': 'Uruz', 'ÞURS': 'Thurisaz', 'ÓSS': 'Ansuz',
    'REIÐ': 'Raidho', 'KAUN': 'Kenaz', 'HAGALL': 'Hagalaz', 'NAUD': 'Nauthiz',
    'ÍSS': 'Isa', 'ÁR': 'Jera', 'SÓL': 'Sowilo', 'TÝR': 'Tiwaz',
    'BJARKAN': 'Berkano', 'MAÐR': 'Mannaz', 'LÖGR': 'Laguz', 'ÝR': 'Algiz',
}

STANZA_HEAD = re.compile(r'^\[([^]]+)\]\s*$', re.M)


def parse_blocks(text: str) -> dict[str, dict[str, str]]:
    out: dict[str, dict[str, str]] = {}
    parts = re.split(r'(?=^\[)', text, flags=re.M)
    for part in parts:
        m = STANZA_HEAD.match(part)
        if not m:
            continue
        name = m.group(1).strip()
        oe = re.search(r'^OE: (.+)$', part, re.M)
        no = re.search(r'^NO: (.+)$', part, re.M)
        en = re.search(r'^EN: (.+)$', part, re.M)
        is_ = re.search(r'^IS: (.+)$', part, re.M)
        rec: dict[str, str] = {}
        if oe:
            rec['oe'] = ' '.join(oe.group(1).split())
        if no:
            rec['no'] = ' '.join(no.group(1).split())
        if is_:
            rec['is'] = ' '.join(is_.group(1).split())
        if en:
            rec['en'] = ' '.join(en.group(1).split())
        out[name] = rec
    return out


def main() -> None:
    problems: list[str] = []
    merged: dict[str, dict] = {r: {'rune': r, 'poems': {}} for r in FUTHARK_ALL}

    # 盎格鲁-撒克逊
    as_blocks = parse_blocks((CLASSICS / 'rune_poem_anglosaxon_raw.txt').read_text(encoding='utf-8'))
    as_count = 0
    for name, rec in as_blocks.items():
        target = AS_MAP.get(name)
        if target is None:
            continue
        if 'oe' not in rec or 'en' not in rec:
            problems.append(f'AS/{name}: 缺 OE 或 EN')
            continue
        merged[target]['poems']['anglo_saxon'] = {
            'original': rec['oe'], 'translation': rec['en'],
            'as_name': name,
            'source': 'Anglo-Saxon Rune Poem (8-9c), trans. Bruce Dickins 1915',
        }
        as_count += 1

    # 挪威 + 冰岛（同一文件，按 == 段切分）
    ni_text = (CLASSICS / 'rune_poems_norwegian_icelandic_raw.txt').read_text(encoding='utf-8')
    seg_no = ni_text.split('== THE NORWEGIAN RUNE POEM ==')[1].split('== THE ICELANDIC RUNE POEM ==')[0]
    seg_is = ni_text.split('== THE ICELANDIC RUNE POEM ==')[1]

    no_blocks = parse_blocks(seg_no)
    is_blocks = parse_blocks(seg_is)
    no_count = 0
    for name, rec in no_blocks.items():
        target = NO_MAP.get(name)
        if target is None:
            problems.append(f'NO/{name}: 未映射')
            continue
        if 'no' not in rec or 'en' not in rec:
            problems.append(f'NO/{name}: 缺 NO 或 EN')
            continue
        merged[target]['poems']['norwegian'] = {
            'original': rec['no'], 'translation': rec['en'],
            'no_name': name,
            'source': 'Norwegian Rune Poem (c. 13c), trans. Bruce Dickins 1915',
        }
        no_count += 1
    is_count = 0
    for name, rec in is_blocks.items():
        target = IS_MAP.get(name)
        if target is None:
            problems.append(f'IS/{name}: 未映射')
            continue
        if 'is' not in rec or 'en' not in rec:
            problems.append(f'IS/{name}: 缺 IS 或 EN')
            continue
        merged[target]['poems']['icelandic'] = {
            'original': rec['is'], 'translation': rec['en'],
            'is_name': name,
            'source': 'Icelandic Rune Poem (c. 15c), trans. Bruce Dickins 1915',
        }
        is_count += 1

    records = sorted(merged.values(), key=lambda r: list(FUTHARK_ALL).index(r['rune']))

    # 覆盖率审计
    full = [r['rune'] for r in records if len(r['poems']) == 3]
    oe_only = [r['rune'] for r in records if len(r['poems']) == 1]
    if len(records) != 24:
        problems.append(f'符文总数 {len(records)} != 24')
    if len(full) != 16:
        problems.append(f'三诗齐全的符文 {len(full)} != 16')
    if set(oe_only) != {'Gebo', 'Wunjo', 'Eihwaz', 'Perthro', 'Ehwaz', 'Ingwaz', 'Othala', 'Dagaz'}:
        problems.append(f'仅盎格鲁诗的符文集合异常: {sorted(oe_only)}')
    for r in records:
        for lang, p in r['poems'].items():
            if not p['original'].strip() or not p['translation'].strip():
                problems.append(f"{r['rune']}/{lang}: 空文本")

    outp = DATA / 'rune_poems_v2.json'
    outp.write_text(json.dumps(records, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'AS stanzas used: {as_count}/24 | NO: {no_count}/16 | IS: {is_count}/16')
    print(f'merged 24 runes ({len(full)} full-coverage, {len(oe_only)} OE-only) -> {outp}')
    if problems:
        print('PROBLEMS:')
        for p in problems:
            print('  -', p)
        raise SystemExit(1)
    print('coverage matches expectations, no problems.')


if __name__ == '__main__':
    main()
