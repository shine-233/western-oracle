"""03_clean: 清洗盎格鲁-撒克逊卢恩诗 → 老弗萨克 24 符文对照数据。

规则:
  1. 解析 classics/rune_poem_anglosaxon_raw.txt 的 29 节
  2. 盎格鲁-撒克逊名 -> 老弗萨克符文名映射（Ac/Æsc/Yr/Iar/Ear 为弗萨克独有，排除）
  3. 老弗萨克 24 符文必须全覆盖（Eþel 映射到 Othala）
  4. 每条含 OE 原文 + Dickins 英译 + 来源

输出: data/rune_poem_oe_v1.json
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CLASSICS = ROOT / 'classics'
DATA = ROOT / 'data'

# 盎格鲁-撒克逊诗节名 -> 老弗萨克符文名
AS_TO_FUTHARK = {
    'FEOH': 'Fehu', 'UR': 'Uruz', 'THORN': 'Thurisaz', 'OS': 'Ansuz',
    'RAD': 'Raidho', 'CEN': 'Kenaz', 'GYFU': 'Gebo', 'WENNE': 'Wunjo',
    'HA EGL': 'Hagalaz', 'NYD': 'Nauthiz', 'IS': 'Isa', 'GER': 'Jera',
    'EOH': 'Eihwaz', 'PEORDH': 'Perthro', 'EOLH': 'Algiz', 'SIGEL': 'Sowilo',
    'TIR': 'Tiwaz', 'BEORC': 'Berkano', 'EH': 'Ehwaz', 'MAN': 'Mannaz',
    'LAGU': 'Laguz', 'ING': 'Ingwaz', 'ETHEL': 'Othala', 'DAEG': 'Dagaz',
    # 弗萨克独有（排除）
    'AC': None, 'AESC': None, 'YR': None, 'IAR': None, 'EAR': None,
}

FUTHARK_ALL = {n for n in AS_TO_FUTHARK.values() if n}

STANZA_RE = re.compile(r'^\[([A-Z ?]+)\]\s*$', re.M)
LINE_RE = re.compile(r'^(OE|EN): (.+)$', re.M)


def main() -> None:
    text = (CLASSICS / 'rune_poem_anglosaxon_raw.txt').read_text(encoding='utf-8')

    # 切分小节
    parts = re.split(r'(?=^\[)', text, flags=re.M)
    records = []
    problems: list[str] = []
    for part in parts:
        m = STANZA_RE.match(part)
        if not m:
            continue
        name = m.group(1).strip()
        body = part[m.end():].strip()
        oe_m = re.search(r'^OE: (.+)$', body, re.M)
        en_m = re.search(r'^EN: (.+)$', body, re.M)
        if not oe_m or not en_m:
            problems.append(f'{name}: 缺少 OE/EN 行')
            continue
        futhark = AS_TO_FUTHARK.get(name)
        if futhark is None:
            continue  # 弗萨克独有符文，按规则排除
        records.append({
            'rune': futhark,
            'as_name': name,
            'oe_text': ' '.join(oe_m.group(1).split()),
            'en_text': ' '.join(en_m.group(1).split()),
            'source': 'Anglo-Saxon Rune Poem (8-9c), trans. Bruce Dickins 1915 (public domain)',
        })

    got = {r['rune'] for r in records}
    missing = FUTHARK_ALL - got
    if missing:
        problems.append(f'老弗萨克覆盖缺失: {sorted(missing)}')
    dup = len(records) != len(got)
    if dup:
        problems.append('存在重复符文映射')

    outp = DATA / 'rune_poem_oe_v1.json'
    outp.write_text(json.dumps(records, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'clean {len(records)}/24 -> {outp}')
    if problems:
        print('PROBLEMS:')
        for p in problems:
            print('  -', p)
        raise SystemExit(1)
    print('24/24 Elder Futhark covered, no problems.')


if __name__ == '__main__':
    main()
