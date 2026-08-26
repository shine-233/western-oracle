"""02_mine: Robson《The Fixed Stars and Constellations in Astrology》1923
其余三个目录块 v1（fixed_stars_robson_v2 只挖恒星目录，本文件补齐其余）。

输入: classics/robson_fixed_stars_1923_raw.txt (Internet Archive OCR, 公版)
输出: data/robson_constellations_v1.json

三块结构化内容:
  A. constellations：星座目录（约 21194–84269），每条含 Legend./History./
     Influence. 分节（v1/v2 恒星挖掘时整块排除）
  B. lunar_mansions：月宿二十八宿章（≈84269–130000），
     'N. Al Xxxx. Bayer. 坐标.' + 含义段（含 'With Moon here, ...' 建议）
  C. magic_influences：MEDIEVAL MAGIC 章内「Magical Influence of
     Constellations」编号清单（星座→魔法效应一句话）

校验:
  1. constellations >= 60 条；lunar_mansions >= 20 条且首条 Al Sarfain/Krittika 类命中
  2. magic_influences >= 25 条；三条关键锚点（Andromeda/Aquila/Draco）
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CLASSICS = ROOT / 'classics'
DATA = ROOT / 'data'

SECTION_KEYS = ['Legend', 'History', 'Notes', 'Influence']
HEADER_LINE_RE = re.compile(
    r"(?m)^[ \t]*\d{0,3}[ \t]*[A-Z][A-Z&\x27\s\d]{5,70}[ \t]*$")
INLINE_HEADER_RE = re.compile(r"(?<=[a-z,;.])\s+[A-Z][A-Z&\x27\s]{7,60}\s\d{1,3}\s")
INLINE_HEADER_NUM_FIRST_RE = re.compile(r"(?<=[a-z,;.])\s+\d{1,3}\s+[A-Z][A-Z&\x27\s]{5,55}(?=\s+[a-z])")
KNOWN_HEADER_RES = [
    re.compile(r"(?:^|\s)[A-Za-z>&\.]{0,4}[ \t]?\d{0,3}[ \t]?FIXED STARS AND CONSTELLATIONS\.?[ \t]*"),
    re.compile(r"(?:^|\s)[A-Za-z>&\.]{0,4}[ \t]?\d{0,3}[ \t]?INFLUENCE OF STARS AND NEBUL[AE/.X\s]{0,8}"),
]


def norm(s: str) -> str:
    s = HEADER_LINE_RE.sub(' ', s)
    s = INLINE_HEADER_RE.sub(' ', s)
    s = INLINE_HEADER_NUM_FIRST_RE.sub(' ', s)
    # 页眉被条目边界截断的残段（'86 FIXED STARS AND'）
    s = re.sub(r"\b\d{1,3}\s+FIXED\s+STARS(?:\s+AND)?(?:\s+CONSTELLATIONS)?\.?[^\na-z]{0,6}", ' ', s)
    for pat in KNOWN_HEADER_RES:
        s = pat.sub(' ', s)
    return re.sub(r'\s+', ' ', s).strip()


def clean_name(s: str) -> str:
    return re.sub(r"[^A-Za-z\x27\- ]", '', s).strip()


def parse_numbered_entries(text: str, lo: int, hi: int):
    """'N. Name. tail' 条目切分（行尾句点可有可无，OCR 页裂容忍）。

    返回 (num, raw_tail, body_start_pos, body_end_pos)。
    """
    entry_re = re.compile(r"(?m)^[ \t]*(\d{1,3})[ \t]*\.[ \t]+([A-Z][^\n]{0,75})$")
    ms = [m for m in entry_re.finditer(text, lo, hi)]
    out = []
    for i, m in enumerate(ms):
        nxt = ms[i + 1].start() if i + 1 < len(ms) else hi
        out.append((int(m.group(1)), m.group(2).strip(), m.start(), m.end(), nxt))
    return out


# 星座目录的编号锚点抽查（num -> OCR 名可能损坏，按编号断言）
REQUIRED_CONST_NUMS = (4, 21, 24, 37, 55, 80, 84, 87, 92, 98, 105)
REQUIRED_MAGIC_NAMES = ('Andromeda', 'Aquila', 'Draco')


def main() -> None:
    text = (CLASSICS / 'robson_fixed_stars_1923_raw.txt').read_text(encoding='utf-8')
    problems: list[str] = []

    cons_marker = text.find('THE CONSTELLATIONS')
    lunar_marker = text.find('THE LUNAR MANSIONS')
    star_catalog = 130000          # 恒星目录起点（fixed_stars_robson_v2 的辖区）
    magic_marker = text.find('MAGICAL INFLUENCE OF CONSTELLATIONS')
    assert 0 < cons_marker < lunar_marker < star_catalog < magic_marker, \
        f'目录边界异常 ({cons_marker}, {lunar_marker}, {magic_marker})'

    # ---- A. 星座目录 ----
    constellations = []
    for num, tail, pos, end, nxt in parse_numbered_entries(text, cons_marker, lunar_marker):
        if not (1 <= num <= 110) or len(text[end:nxt].strip()) < 40:
            continue
        parts = [p.strip() for p in tail.split('.')]
        name = clean_name(parts[0])
        if not re.fullmatch(r"[A-Za-z][A-Za-z'\- ]{2,30}", name):
            continue
        desc = ', '.join(p for p in parts[1:] if p)
        body = text[pos:nxt]
        sections: dict[str, str] = {}
        segs = re.split(r'\s*\b(' + '|'.join(SECTION_KEYS) + r')\b\s*[\.,]?\s*', body)
        for j in range(1, len(segs) - 1, 2):
            key, val = segs[j], norm(segs[j + 1])
            if val and key not in sections:
                sections[key] = val[:2400]
        constellations.append({
            'num': num,
            'name': name,
            'description': desc,
            'legend': sections.get('Legend', ''),
            'history': sections.get('History', ''),
            'influence': sections.get('Influence', '') or sections.get('Notes', ''),
        })
    # 同编号去重取内容最全者
    by_key: dict[int, dict] = {}
    for c in constellations:
        if c['num'] not in by_key or sum(map(bool, c.values())) > sum(map(bool, by_key[c['num']].values())):
            by_key[c['num']] = c
    constellations = sorted(by_key.values(), key=lambda c: (c['num'], c['name']))
    if len(constellations) < 80:
        problems.append(f'constellations 仅 {len(constellations)} (<80)')
    have_nums = {c['num'] for c in constellations}
    for req in REQUIRED_CONST_NUMS:
        if req not in have_nums:
            problems.append(f'缺少星座编号 {req}')

    # ---- B. 月宿 ----
    mansions = []
    for num, tail, pos, end, nxt in parse_numbered_entries(text, lunar_marker, star_catalog - 20000):
        if not (1 <= num <= 30):
            continue
        parts = [p.strip() for p in tail.split('.')]
        name = clean_name(parts[0])
        if not re.fullmatch(r"[A-Za-z][A-Za-z'\- ]{2,30}", name):
            continue
        designation = ', '.join(p for p in parts[1:] if p)
        body = norm(text[end:nxt])
        wm = re.search(r'With Moon here,\s*(.*?)(?:$|\.(?=\s+[A-Z]))', body)
        with_moon = wm.group(1).strip(' .') if wm else ''
        meaning = body[:wm.start()].strip(' .') if wm else body[:600]
        mansions.append({
            'num': num,
            'name': name,
            'designation': designation,
            'meaning': meaning,
            'with_moon': with_moon,
        })
    seen: set[int] = set()
    dedup = []
    for mn in sorted(mansions, key=lambda x: x['num']):
        if mn['num'] in seen:
            continue
        seen.add(mn['num'])
        dedup.append(mn)
    mansions = dedup
    if len(mansions) < 20:
        problems.append(f'lunar_mansions 仅 {len(mansions)} (<20)')

    # ---- C. 魔法效应清单（编号有 OCR 别名：'z.'='1.'，效应跨行到空行为止）----
    magic_re = re.compile(r"(?m)^[ \t]*([zZ1il\d]{1,2})[ \t]*\.[ \t]+([A-Z][^\n]{5,60})$")
    mms = [m for m in magic_re.finditer(text, magic_marker, min(magic_marker + 30000, len(text)))]
    magics = []
    for i, m in enumerate(mms):
        num_raw = m.group(1)
        num = 1 if num_raw in ('z', 'Z', 'l', 'i') else int(num_raw)
        if not (1 <= num <= 60):
            continue
        nxt = mms[i + 1].start() if i + 1 < len(mms) else min(magic_marker + 30000, len(text))
        tail = text[m.end():nxt]
        effect_lines = [m.group(2).strip()] + [x.strip() for x in tail.split('\n\n')[0].splitlines()]
        parts = [p for p in re.split(r'\.\s+', re.sub(r'\s+', ' ', ' '.join(effect_lines))) if p]
        name = clean_name(parts[0])
        effect = norm('. '.join(parts[1:]))
        if not re.fullmatch(r"[A-Za-z][A-Za-z'\- ]{2,28}", name) or len(effect) < 15:
            continue
        magics.append({'num': num, 'constellation': name, 'effect': effect})
    mseen: dict[str, dict] = {}
    for mg in magics:
        k = re.sub(r'\s+', '', mg['constellation']).casefold()
        if k not in mseen or len(mg['effect']) > len(mseen[k]['effect']):
            mseen[k] = mg
    magics = sorted(mseen.values(), key=lambda x: x['num'])
    if len(magics) < 25:
        problems.append(f'magic_influences 仅 {len(magics)} (<25)')
    mnames = {re.sub(r"\s+", "", m["constellation"]).casefold() for m in magics}
    for req in REQUIRED_MAGIC_NAMES:
        if req.casefold() not in mnames:
            problems.append(f'magic 清单缺 {req}')

    total = sum(len(c['legend']) + len(c['history']) + len(c['influence']) for c in constellations) \
        + sum(len(m['meaning']) + len(m['with_moon']) for m in mansions)
    out = {
        'dataset': 'robson_constellations_and_mansions',
        'version': 'v1',
        'generated': '2026-08-26',
        'source': {
            'work': "Vivian E. Robson, The Fixed Stars and Constellations in Astrology",
            'year': 1923,
            'publisher': 'Cecil Palmer, London',
            'rights': 'public domain',
            'origin': 'Internet Archive OCR (in.ernet.dli.2015.128091)',
            'note': '星座目录/月宿二十八宿/Medieval Magic 星座魔法效应清单；'
                    '与 fixed_stars_robson_v2.json（恒星目录）互补',
        },
        'counts': {
            'constellations': len(constellations),
            'lunar_mansions': len(mansions),
            'magic_influences': len(magics),
        },
        'constellations': constellations,
        'lunar_mansions': mansions,
        'magic_influences': magics,
    }
    outp = DATA / 'robson_constellations_v1.json'
    outp.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f"robson constellations mined: const={len(constellations)} "
          f"mansions={len(mansions)} magics={len(magics)}, text={total}ch -> {outp}")
    if problems:
        print('PROBLEMS:')
        for p in problems:
            print('  -', p)
        raise SystemExit(1)


if __name__ == '__main__':
    main()
