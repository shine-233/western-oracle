"""02_mine + 03_clean: Robson《The Fixed Stars and Constellations in Astrology》1923
恒星条目目录 → 结构化数据 v1。

输入: classics/robson_fixed_stars_1923_raw.txt (Internet Archive OCR, 公版)
输出: data/fixed_stars_robson_v1.json

条目格式（OCR 后）:
    10. Aldebaran. a Tauri. Q 8° 40'.
    Legend. / Notes. / Influence. ... 段落
    With Sun. / With Moon. / If culminating. ...

校验:
  1. 条目数 >= 60（原书目录章约百条，OCR 允许少量噪声）
  2. 关键恒星必须命中：Algol/Aldebaran/Regulus/Antares/Arcturus/Spica/Sirius/Pleiades
  3. 所有保留条目必须有 Influence 或 Notes 文本
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CLASSICS = ROOT / 'classics'
DATA = ROOT / 'data'

REQUIRED_STARS = [
    'Algol', 'Aldebaran', 'Regulus', 'Antares', 'Arcturus',
    'Spica', 'Sirius', 'Pleiades',
]

ENTRY_RE = re.compile(r"(?m)^\s*([0-9A-Za-z]{1,3})\.\s+(\S[^\n]{0,60}?)\.\s*$")
SECTION_KEYS = [
    'Legend', 'Notes', 'Influence', 'If rising', 'If culminating',
    'With Sun or Moon', 'With Sun', 'With Moon', 'With Mercury',
    'With Venus', 'With Mars', 'With Jupiter', 'With Saturn',
]
END_ANCHOR = 'MEDIEVAL MAGIC'


def split_entry_tail(tail: str) -> tuple[str, str]:
    """'Algol, p Persei. 8 25 0 3'' -> ('Algol', 'p Persei. 8 25 0 3'')

    首段为星名（可含空格），其后为 Bayer 编号与（OCR 残缺的）黄经位置。
    """
    parts = [p.strip() for p in tail.split('.')]
    name = parts[0].split(',')[0].strip()
    designation = ', '.join(p for p in parts[1:] if p)
    return name, designation


def norm_name(s: str) -> str:
    """OCR 常把星名内部断行/加空格（'Reg ulus'），比对时折叠空白。"""
    return re.sub(r'\s+', '', s).casefold()


def norm(s: str) -> str:
    return re.sub(r'\s+', ' ', s).strip()


# OCR 页眉残留清洗：'124 FIXED STARS AND CONSTELLATIONS' / 行内 'INFLUENCE OF ... 121'
HEADER_LINE_RE = re.compile(
    r"(?m)^[ \t]*\d{0,3}[ \t]*[A-Z][A-Z&\x27\s\d]{5,70}[ \t]*$")
INLINE_HEADER_RE = re.compile(r"(?<=[a-z,;.])\s+[A-Z][A-Z&\x27\s]{7,60}\s\d{1,3}\s")
INLINE_HEADER_NUM_FIRST_RE = re.compile(r"(?<=[a-z,;.])\s+\d{1,3}\s+[A-Z][A-Z&\x27\s]{5,55}(?=\s+[a-z])")


# 已知书名页眉的兜底清除（OCR 页码可被损坏为 'XI'/'xf>4' 等任意噪声）
KNOWN_HEADER_RES = [
    re.compile(r"[A-Za-z>&\./\d\s]{0,18}FIXED STARS AND CONSTELLATIONS\.?[ \t]*"),
    re.compile(r"[A-Za-z>&\./\d\s]{0,18}INFLUENCE OF STARS AND NEBUL[AE/.X\s]{0,8}"),
]


def clean_ocr(s: str) -> str:
    s = HEADER_LINE_RE.sub(' ', s)
    s = INLINE_HEADER_RE.sub(' ', s)
    s = INLINE_HEADER_NUM_FIRST_RE.sub(' ', s)
    for pat in KNOWN_HEADER_RES:
        s = pat.sub(' ', s)
    return norm(s)


def main() -> None:
    text = (CLASSICS / 'robson_fixed_stars_1923_raw.txt').read_text(encoding='utf-8')

    # 只挖恒星目录章：从首个带 Influence 的编号条目起，到 MEDIEVAL MAGIC 章止，
    # 避免把前文星座表/后文魔法印章表的条目混进来。
    end = text.find(END_ANCHOR)
    assert end > 0, f'未找到目录章结束锚点 {END_ANCHOR}'
    matches = [
        m for m in ENTRY_RE.finditer(text, 0, end)
        if m.start() > 130000
    ]
    catalog_start = None
    for i, m in enumerate(matches):
        seg_end = matches[i + 1].start() if i + 1 < len(matches) else end
        if 'Influence' in text[m.end():seg_end]:
            catalog_start = i
            break
    assert catalog_start is not None, '未定位到目录章起点'
    matches = matches[catalog_start:]

    stars = []
    for i, m in enumerate(matches):
        num_s, tail = m.group(1), m.group(2)
        name, designation = split_entry_tail(tail)
        if not re.fullmatch(r"[A-Za-z][A-Za-z'\- ]{2,28}", name):
            continue
        seg_end = matches[i + 1].start() if i + 1 < len(matches) else end
        body = text[m.end():seg_end]

        sections: dict[str, str] = {}
        parts = re.split(r'\s*\b(' + '|'.join(SECTION_KEYS) + r')\b\s*[\.,]?\s*', body)
        for j in range(1, len(parts) - 1, 2):
            key, val = parts[j], clean_ocr(parts[j + 1])
            if val and key not in sections:
                sections[key] = val[:1200]

        if not any(k in sections for k in ('Influence', 'Notes')):
            continue

        nature = []
        infl = sections.get('Influence', '') + ' ' + sections.get('Notes', '')
        nm = re.search(r'nature of ([A-Z][A-Za-z]+)(?:\s+and\s+([A-Z][A-Za-z]+))?', infl)
        if nm:
            nature = [nm.group(1)] + ([nm.group(2)] if nm.group(2) else [])

        stars.append({
            'num': int(num_s) if num_s.isdigit() else None,
            'name': name,
            'name_key': norm_name(name),
            'designation': designation,
            'nature': sorted(set(nature)),
            'influence': sections.get('Influence', ''),
            'notes': sections.get('Notes', '')[:600],
            'with_sun': sections.get('With Sun', '') or sections.get('With Sun or Moon', ''),
            'with_moon': sections.get('With Moon', '') or sections.get('With Sun or Moon', ''),
            'culminating': sections.get('If culminating', '') or sections.get('If rising', ''),
        })

    # 同名去重（OCR 目录重复），保留字段最全的一条
    by_name: dict[str, dict] = {}
    for s in stars:
        k = s['name_key']
        score = sum(bool(s[f]) for f in ('influence', 'with_sun', 'with_moon', 'culminating'))
        if k not in by_name or score > sum(bool(by_name[k][f]) for f in ('influence', 'with_sun', 'with_moon', 'culminating')):
            by_name[k] = s
    stars = sorted(by_name.values(), key=lambda s: s['name'])

    problems: list[str] = []
    if len(stars) < 60:
        problems.append(f'条目数过少: {len(stars)} < 60')
    names_l = {s['name_key'] for s in stars}
    for req in REQUIRED_STARS:
        if norm_name(req) not in names_l:
            problems.append(f'缺少关键恒星 {req}')
    empty = [s['name'] for s in stars if not (s['influence'] or s['notes'])]
    if empty:
        problems.append(f'无任何释义文本: {empty[:5]}')

    out = {
        'dataset': 'fixed_stars_catalog',
        'version': 'v1',
        'generated': '2026-08-25',
        'source': {
            'work': "Vivian E. Robson, The Fixed Stars and Constellations in Astrology",
            'year': 1923,
            'publisher': 'Cecil Palmer, London',
            'rights': 'public domain',
            'origin': 'Internet Archive OCR (in.ernet.dli.2015.128091)',
            'note': '黄经位置列因星座符号被 OCR 破坏未解析，仅存 designation 原文；v2 可与现代星表交叉补齐',
        },
        'count': len(stars),
        'stars': stars,
    }
    outp = DATA / 'fixed_stars_robson_v1.json'
    outp.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'fixed stars mined: {len(stars)} entries -> {outp}')
    if problems:
        print('PROBLEMS:')
        for p in problems:
            print('  -', p)
        raise SystemExit(1)


if __name__ == '__main__':
    main()
