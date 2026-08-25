"""02_mine + 03_clean: Robson《The Fixed Stars and Constellations in Astrology》1923
恒星条目目录 → 结构化数据 v2（截断修复版）。

输入: classics/robson_fixed_stars_1923_raw.txt (Internet Archive OCR, 公版)
输出: data/fixed_stars_robson_v2.json

v1 → v2 修复:
  A. 漏星：星名内噪声字符（如 '59. Has*.'）导致 v1 整条丢弃 → 名称净化后收录
  B. 截断：Aldebaran 类条目的「Influence.」节头被 OCR 吃掉，正文直接跟在
     Notes 后 → 不再依赖 Influence 节存在；notes 截断上限放宽
  C. 新增 aspects：With Mercury/Venus/Mars/Jupiter/Saturn/Uranus/Neptune/
     Fortuna 各行星小节全部收录（v1 仅存 Sun/Moon/culminating，大量内容被丢弃）
  D. 已知 OCR 星名损坏归一（SnARATAN→Sheratan，上下文锚点断言）

校验:
  1. 条目数 >= 96；目录区编号条目除名称不可净化的以外全覆盖
  2. 关键八星命中；Aldebaran 必须有 notes + aspects.mercury（证明截断修复）
  3. 所有保留条目有 influence 或 notes 或任一 aspect 文本
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
# 已知 OCR 星名损坏 → 通行名（附上下文证据锚点）
NAME_FIXES = {
    'snaratan': ('Sheratan', 'Sharatain'),
}

ENTRY_RE = re.compile(r"(?m)^\s*([0-9A-Za-z]{1,3})\.\s+(\S[^\n]{0,60}?)\.\s*$")
SECTION_KEYS = [
    'Legend', 'Notes', 'Influence', 'If rising', 'If culminating',
    'With Sun or Moon', 'With Sun', 'With Moon', 'With Mercury',
    'With Venus', 'With Mars', 'With Jupiter', 'With Saturn',
    'With Uranus', 'With Neptune', 'With Fortuna',
]
ASPECT_MAP = {
    'With Mercury': 'mercury', 'With Venus': 'venus', 'With Mars': 'mars',
    'With Jupiter': 'jupiter', 'With Saturn': 'saturn',
    'With Uranus': 'uranus', 'With Neptune': 'neptune',
    'With Fortuna': 'fortuna',
}
END_ANCHOR = 'MEDIEVAL MAGIC'
CATALOG_FROM = 130000


def split_entry_tail(tail: str) -> tuple[str, str]:
    parts = [p.strip() for p in tail.split('.')]
    name = parts[0].split(',')[0].strip()
    designation = ', '.join(p for p in parts[1:] if p)
    return name, designation


def clean_name(s: str) -> str:
    """星名净化：去内部噪声符号（OCR 上标 *、† 等），保留字母/空格/'/-。"""
    return re.sub(r"[^A-Za-z\x27\- ]", '', s).strip()


def norm_name(s: str) -> str:
    return re.sub(r'\s+', '', s).casefold()


def norm(s: str) -> str:
    return re.sub(r'\s+', ' ', s).strip()


HEADER_LINE_RE = re.compile(
    r"(?m)^[ \t]*\d{0,3}[ \t]*[A-Z][A-Z&\x27\s\d]{5,70}[ \t]*$")
INLINE_HEADER_RE = re.compile(r"(?<=[a-z,;.])\s+[A-Z][A-Z&\x27\s]{7,60}\s\d{1,3}\s")
INLINE_HEADER_NUM_FIRST_RE = re.compile(r"(?<=[a-z,;.])\s+\d{1,3}\s+[A-Z][A-Z&\x27\s]{5,55}(?=\s+[a-z])")
KNOWN_HEADER_RES = [
    re.compile(r"(?:^|\s)[A-Za-z>&\.]{0,4}[ \t]?\d{0,3}[ \t]?FIXED STARS AND CONSTELLATIONS\.?[ \t]*"),
    re.compile(r"(?:^|\s)[A-Za-z>&\.]{0,4}[ \t]?\d{0,3}[ \t]?INFLUENCE OF STARS AND NEBUL[AE/.X\s]{0,8}"),
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
    problems: list[str] = []

    end = text.find(END_ANCHOR)
    assert end > 0, f'未找到目录章结束锚点 {END_ANCHOR}'
    matches = [m for m in ENTRY_RE.finditer(text, 0, end) if m.start() > CATALOG_FROM]

    # 目录章起点：首个带 Influence 分节的条目
    catalog_start = None
    for i, m in enumerate(matches):
        seg_end = matches[i + 1].start() if i + 1 < len(matches) else end
        if 'Influence' in text[m.end():seg_end]:
            catalog_start = i
            break
    assert catalog_start is not None, '未定位到目录章起点'
    matches = matches[catalog_start:]

    # 剔除正文噪声假匹配（如句中 'Hom. From A 1 Sharatain...' 行）：
    # 编号非数字且名称不可净化的候选不作为条目边界。
    def plausible(m) -> bool:
        num_s, tail = m.group(1), m.group(2)
        if num_s.isdigit():
            return True
        name_raw = split_entry_tail(tail)[0]
        # 正文噪声（如 'Hom. From A 1 Sharatain...'）名称里混有数字/介词开头
        if any(ch.isdigit() for ch in name_raw):
            return False
        name = clean_name(name_raw)
        return bool(re.fullmatch(r"[A-Za-z][A-Za-z'\- ]{2,28}", name))

    matches = [m for m in matches if plausible(m)]

    stars = []
    covered_nums: set[int] = set()
    skipped_nums: list[int] = []
    for i, m in enumerate(matches):
        num_s, tail = m.group(1), m.group(2)
        name_raw, designation = split_entry_tail(tail)
        name = clean_name(name_raw)
        if not re.fullmatch(r"[A-Za-z][A-Za-z'\- ]{2,28}", name):
            if num_s.isdigit():
                skipped_nums.append(int(num_s))
            continue
        seg_end = matches[i + 1].start() if i + 1 < len(matches) else end
        body = text[m.end():seg_end]

        sections: dict[str, str] = {}
        parts = re.split(r'\s*\b(' + '|'.join(SECTION_KEYS) + r')\b\s*[\.,]?\s*', body)
        for j in range(1, len(parts) - 1, 2):
            key, val = parts[j], clean_ocr(parts[j + 1])
            if val and key not in sections:
                sections[key] = val[:1600]
        if num_s.isdigit():
            covered_nums.add(int(num_s))

        nature = []
        infl = sections.get('Influence', '') + ' ' + sections.get('Notes', '')
        nm = re.search(r'nature of ([A-Z][A-Za-z]+)(?:\s+and\s+([A-Z][A-Za-z]+))?', infl)
        if nm:
            nature = [nm.group(1)] + ([nm.group(2)] if nm.group(2) else [])

        aspects = {ASPECT_MAP[k]: v for k, v in sections.items() if k in ASPECT_MAP}
        # 已知 OCR 星名归一（以条目正文上下文为证）
        fix = NAME_FIXES.get(norm_name(name))
        if fix:
            fixed, ctx = fix
            if ctx in body:
                name = fixed
        stars.append({
            'num': int(num_s) if num_s.isdigit() else None,
            'name': name,
            'name_key': norm_name(name),
            'designation': designation,
            'nature': sorted(set(nature)),
            'influence': sections.get('Influence', ''),
            'notes': sections.get('Notes', '')[:900],
            'with_sun': sections.get('With Sun', '') or sections.get('With Sun or Moon', ''),
            'with_moon': sections.get('With Moon', '') or sections.get('With Sun or Moon', ''),
            'culminating': sections.get('If culminating', '') or sections.get('If rising', ''),
            'aspects': dict(sorted(aspects.items())),
        })

    # 同名去重（OCR 目录重复），保留字段最全的一条
    def score(s: dict) -> int:
        return sum(bool(s[f]) for f in
                   ('influence', 'with_sun', 'with_moon', 'culminating')) \
            + len(s['aspects'])
    by_name: dict[str, dict] = {}
    for s in stars:
        k = s['name_key']
        if k not in by_name or score(s) > score(by_name[k]):
            by_name[k] = s
    stars = sorted(by_name.values(), key=lambda s: s['name'])

    if len(stars) < 96:
        problems.append(f'条目数过少: {len(stars)} < 96')
    if skipped_nums:
        problems.append(f'编号条目因名称无法净化而跳过: {skipped_nums}')
    names_l = {s['name_key'] for s in stars}
    for req in REQUIRED_STARS:
        if norm_name(req) not in names_l:
            problems.append(f'缺少关键恒星 {req}')
    empty = [s['name'] for s in stars
             if not (s['influence'] or s['notes'] or s['aspects'])]
    if empty:
        problems.append(f'无任何释义文本: {empty[:5]}')
    aldebaran = next((s for s in stars if s['name_key'] == 'aldebaran'), None)
    if not aldebaran or not aldebaran['notes'] or not aldebaran['aspects'].get('mercury'):
        problems.append('Aldebaran 截断未修复（缺 notes 或 aspects.mercury）')
    if 'sheratan' not in names_l:
        problems.append('Sheratan 归一失败')
    n_aspects = sum(len(s['aspects']) for s in stars)
    if n_aspects < 60:
        problems.append(f'aspects 小节总量异常: {n_aspects} (<60)')

    out = {
        'dataset': 'fixed_stars_catalog',
        'version': 'v2',
        'generated': '2026-08-26',
        'source': {
            'work': "Vivian E. Robson, The Fixed Stars and Constellations in Astrology",
            'year': 1923,
            'publisher': 'Cecil Palmer, London',
            'rights': 'public domain',
            'origin': 'Internet Archive OCR (in.ernet.dli.2015.128091)',
            'note': 'v2 修复：漏星（星名噪声净化）、Aldebaran 类 Influence 头丢失截断、'
                    '新增 With Mercury..Fortuna 各行星小节（aspects）',
        },
        'count': len(stars),
        'stars': stars,
    }
    outp = DATA / 'fixed_stars_robson_v2.json'
    outp.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'fixed stars v2 mined: {len(stars)} entries, aspects={n_aspects} -> {outp}')
    if problems:
        print('PROBLEMS:')
        for p in problems:
            print('  -', p)
        raise SystemExit(1)


if __name__ == '__main__':
    main()
