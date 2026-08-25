"""02_mine: Alan Leo《How to Judge a Nativity》(1928 ed.) v2（扩容版）。

输入: classics/leo_how_to_judge_nativity_1928_raw.txt (Internet Archive OCR, 公版)
输出: data/leo_nativity_v2.json

v1 → v2 扩容（v1 提取率 5.7%，仅三大段）:
  A. planets_in_signs：新增土/木/火/金/水五星「入十二星座」整章
     （THE FATE OF SATURN / THE INFLUENCE OF JUPITER·MARS·VENUS·MERCURY，
     星座符号被 OCR 损坏无法逐星座切分，按整章收录）
  B. centiloquy：新增「A CENTILOQUY」百条格言，逐条解析（罗马数字 I.–C.
     锚定，OCR 数字噪声 'XXXV1.' 归一后按期望序列匹配）
  C. houses：第二..十二宫逐宫切分（运行页眉行定位；标题行可读时优先）
  D. twelve_houses / sun_in_signs / moon_in_signs 三大段与 v1 相同

校验:
  1. 五星章节锚点严格递增且各段长度达标
  2. centiloquy 恰好 100 条且首条含 squares 锚词
  3. 11 个宫位段齐备且边界单调
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CLASSICS = ROOT / 'classics'
DATA = ROOT / 'data'

PLANETS = {
    'saturn': ('THE FATE OF SATURN IN THE TWELVE SIGNS', 25000),
    'jupiter': ('THE INFLUENCE OF JUPITER IN THE TWELVE SIGNS', 18000),
    'mars': ('THE INFLUENCE OF MARS IN THE TWELVE SIGNS', 15000),
    'venus': ('THE INFLUENCE OF VENUS IN THE TWELVE SIGNS', 8000),
    'mercury': ('THE INFLUENCE OF MERCURY IN THE TWELVE SIGNS', 6000),
}

# 十二宫位章（第二..十二宫）：运行页眉定位 + 可读标题行兜底
HOUSES = [
    ('second', r'THE\s+Sec[oO]np?\s+Hous[Ee]|THE\s+SECOND\s+HOUSE'),
    ('third', r'THE\s+THIRD\s+HOUSE'),
    ('fourth', r'THE\s+FOURTH\s+HOUSE'),
    ('fifth', r'THE\s+FIFTH\s+HOUSE'),
    ('sixth', r'THE\s+SIXTH\s+HOUSE'),
    ('seventh', r'THe\s+SEVENTH\s+House|THE\s+SEVENTH\s+HOUSE'),
    ('eighth', r'THE\s+EIGHTH\s+HOUSE'),
    ('ninth', r'THE\s+NINTH\s+HOUSE'),
    ('tenth', r'THE\s+MID-HEAVEN\s+OR\s+TENTH\s+HOUSE|THE\s+TENTH\s+HOUSE'),
    ('eleventh', r'THE\s+ELEVENTH\s+HOUSE'),
    ('twelfth', r'THE\s+TWELFTH\s*:?\s*HOUSE'),
]
HOUSE_SPAN = (398000, 598000)

CENTILOQUY_START = 'A CENTILOQUY'
CENTILOQUY_END = 'Alan Leo’s Astrological Publications'


def norm(s: str) -> str:
    # 运行页眉 'HOW TO JUDGE A NATIVITY'（含页码前缀/OCR 引号括号噪声、断行残段）
    s = re.sub(
        r"(?m)^[ \t]*[a-z\x27\.]{0,4}[ \t]*\d{0,3}[ \t]*HOW[ \t]+TO[ \t]+JUDGE"
        r"[a-zA-Z\s&\x27\(\)\x18\d\.]{0,32}[ \t]*$", ' ', s)
    # 其余全大写页眉行（'THE SECOND HOUSE 153' 等）与独立页码
    s = re.sub(r"(?m)^[ \t]*\d{0,3}[ \t]*[A-Z(][A-Z\s&\x27\d\.(]{5,70}[ \t]*$", ' ', s)
    s = re.sub(r"(?m)^[ \t]*\d{1,4}[ \t]*$", ' ', s)
    s = re.sub(r"(?<=[a-z,;.])\s+\d{1,3}\s+[A-Z][A-Z&\x27\s]{5,55}(?=\s+[a-z])", ' ', s)
    # 压平后的行内页眉残段（跨行断裂形态）
    s = re.sub(r"\b\d{1,3}\s+HOW TO JUDGE(?:\s+A?\s*\(?\s*NATIVITY)?\b[\d\s\.]{0,4}", ' ', s)
    s = re.sub(r"\bHOW TO JUDGE(?:\s+A)?\s+NATIVITY\b[\d\s\.]{0,4}", ' ', s)
    return re.sub(r'[ \t]+', ' ', s)


# 宫位章结束标记（其后为下一章 GENERAL REMARKS）
HOUSES_CHAPTER_END = 'GENERAL REMARKS ON CH'


def roman_expected(n: int) -> str:
    vals = [(100, 'C'), (90, 'XC'), (50, 'L'), (40, 'XL'), (10, 'X'),
            (9, 'IX'), (5, 'V'), (4, 'IV'), (1, 'I')]
    out = ''
    for v, sym in vals:
        while n >= v:
            out += sym
            n -= v
    return out


def parse_centiloquy(seg: str, problems: list[str]) -> list[dict]:
    """百条格言：行首罗马数字锚定，按期望序列 I..C 匹配（容忍 OCR 噪声）。"""
    lines = seg.split('\n')
    items: list[dict] = []
    cur_num = 0
    cur_parts: list[str] = []

    def flush():
        nonlocal cur_parts
        txt = norm(' '.join(cur_parts))
        if cur_num and txt:
            items.append({'no': cur_num, 'text': txt})
        cur_parts = []

    # OCR 常把罗马 I 写成数字 1（如 'XXXV1.'），字符类放宽到含数字后归一
    token_re = re.compile(r'^\s*([IVXLCivxlc1\d\s]{1,8})\s*[\.,]\s*(.*)$')
    header_line = re.compile(
        r'^[ \t]*[a-z\x27\.]{0,4}[ \t]*\d{0,3}[ \t]*(?:HOW[ \t]+TO[ \t]+JUDGE'
        r'|[A-Z(][A-Z\s&\x27\d\.(]{5,60})[a-zA-Z\s&\x27\(\)\x18\d\.]{0,32}[ \t]*$'
        r'|^[ \t]*\d{1,4}[ \t]*$')
    for ln in lines:
        if header_line.match(ln):
            continue
        m = token_re.match(ln)
        ok = False
        if m and re.search(r'[IVXLCivxlc]', m.group(1)):
            tok = m.group(1).replace(' ', '').replace('1', 'I').replace('l', 'I').upper()
            nxt = roman_expected(cur_num + 1)
            # OCR 尾部噪声（如 'LXXI.' 后多一个句点已由正则排除）
            if tok == nxt:
                flush()
                cur_num += 1
                if m.group(2):
                    cur_parts.append(m.group(2))
                ok = True
        if not ok and cur_num:
            cur_parts.append(ln)
    flush()
    return items


def main() -> None:
    text = (CLASSICS / 'leo_how_to_judge_nativity_1928_raw.txt').read_text(encoding='utf-8')
    problems: list[str] = []

    # ---- A. 五星入十二星座章 ----
    planets_out: dict[str, dict] = {}
    positions: list[tuple[str, int]] = []
    for key, (anchor, min_len) in PLANETS.items():
        pos = text.find(anchor, 600000)
        if pos < 0:
            problems.append(f'{key} 章锚点缺失')
            continue
        positions.append((key, pos))
    end_mercury = text.find('CHAPTER XXI', 717000)
    if not (717000 < end_mercury < 745000):
        problems.append(f'mercury 终点锚点异常: {end_mercury}')
    positions.sort(key=lambda x: x[1])
    for i, (key, pos) in enumerate(positions):
        nxt = positions[i + 1][1] if i + 1 < len(positions) else end_mercury
        seg = norm(text[pos:nxt]).strip()
        if len(seg) < PLANETS[key][1]:
            problems.append(f'{key} 章过短: {len(seg)} < {PLANETS[key][1]}')
        planets_out[key] = {'anchor': PLANETS[key][0], 'passage': seg}
    if len(planets_out) != 5:
        problems.append(f'行星章覆盖 {len(planets_out)}/5')

    # ---- B. Centiloquy 百条格言 ----
    cq_first = text.find(CENTILOQUY_START, 800000)
    cq_end = text.find(CENTILOQUY_END, cq_first)
    if not (800000 < cq_first < 835000):
        problems.append(f'centiloquy 起点异常: {cq_first}')
    if not (cq_first < cq_end < len(text)):
        problems.append(f'centiloquy 终点缺失: {cq_end}')
    aphorisms = parse_centiloquy(text[cq_first:cq_end], problems)
    if len(aphorisms) != 100:
        missing = [roman_expected(n) for n in range(1, 101)
                   if n not in {a['no'] for a in aphorisms}]
        problems.append(f'centiloquy 仅 {len(aphorisms)}/100, 缺: {missing[:10]}')
    if aphorisms and 'squares' not in aphorisms[0]['text']:
        problems.append('centiloquy 首条不含 squares 锚词')
    cq_total = sum(len(a['text']) for a in aphorisms)
    if cq_total < 7000:
        problems.append(f'centiloquy 总量过小: {cq_total}')

    # ---- C. 宫位章逐宫切分 ----
    houses_out: dict[str, dict] = {}
    hpos: list[tuple[str, int]] = []
    for key, pat in HOUSES:
        ps = [m.start() for m in re.finditer(pat, text)
              if HOUSE_SPAN[0] < m.start() < HOUSE_SPAN[1]]
        if not ps:
            problems.append(f'{key} house 页眉未命中')
            continue
        hpos.append((key, min(ps)))
    hpos.sort(key=lambda x: x[1])
    if len(hpos) != 11:
        problems.append(f'宫位段 {len(hpos)}/11')
    for i, (key, pos) in enumerate(hpos):
        nxt = hpos[i + 1][1] if i + 1 < len(hpos) else HOUSE_SPAN[1]
        seg = norm(text[pos:nxt]).strip()
        # 宫位章末尾的下一章标题溢出截断
        gr = seg.find(HOUSES_CHAPTER_END)
        if gr > 200:
            seg = norm(seg[:gr]).strip()
        if len(seg) < 1200:
            problems.append(f'{key} house 段过短: {len(seg)}')
        houses_out[key] = {'passage': seg}
    ordered = [k for k, _ in hpos]
    if ordered != [k for k, _ in HOUSES]:
        problems.append(f'宫位顺序异常: {ordered}')

    # ---- D. v1 三大段保持 ----
    def span(start_kw: str, end_kw: str, from_pos: int) -> tuple[int, int]:
        a = text.find(start_kw, from_pos)
        b = text.find(end_kw, a + len(start_kw)) if a >= 0 else -1
        assert a >= 0 and b > a, f'锚点缺失: {start_kw!r}'
        return a, b

    h_start, h_end = span('THE TWELVE HOUSES OF THE HOROSCOPE',
                          'proceed to consider the twelve', 35000)
    s_start, s_end = span('THE SUN IN THE TWELVE SIGNS',
                          'INFLUENCE OF THE MOON IN THE TWELVE SIGNS', 190000)
    m_end = text.find('Personal \nAppearance and Character', s_end)
    if m_end < 0:
        m_end = re.search(r'Personal\s+Appearance and Character',
                          text[s_end:s_end + 40000]).start() + s_end
    twelve_houses = norm(text[h_start:h_end]).strip()
    sun_in_signs = norm(text[s_start:s_end]).strip()
    moon_in_signs = norm(text[s_end:m_end]).strip()
    for name, seg_v in (('twelve_houses', twelve_houses), ('sun_in_signs', sun_in_signs),
                        ('moon_in_signs', moon_in_signs)):
        if len(seg_v) < 3000:
            problems.append(f'{name} 段过短: {len(seg_v)}')

    out = {
        'dataset': 'leo_nativity_sections',
        'version': 'v2',
        'generated': '2026-08-26',
        'source': {
            'work': 'Alan Leo, How to Judge a Nativity (1928 edition)',
            'author_dates': 'Alan Leo (1860-1917)',
            'rights': 'public domain',
            'origin': 'Internet Archive OCR (howtojudgenativi00leoa)',
            'note': 'v2 扩容：新增五星入星座五章、Centiloquy 百条格言（逐条）、'
                    '第二..十二宫逐宫切分；行星入星座章因符号损坏不逐星座切分',
        },
        'sections': {
            'twelve_houses': {'anchor': 'THE TWELVE HOUSES OF THE HOROSCOPE', 'passage': twelve_houses},
            'sun_in_signs': {'anchor': 'THE INFLUENCE OF THE SUN IN THE TWELVE SIGNS', 'passage': sun_in_signs},
            'moon_in_signs': {'anchor': 'THE INFLUENCE OF THE MOON IN THE TWELVE SIGNS', 'passage': moon_in_signs},
        },
        'planets_in_signs': planets_out,
        'houses': houses_out,
        'centiloquy': {
            'chapter_title': 'A Centiloquy — One Hundred Aphorisms',
            'aphorisms': aphorisms,
        },
    }
    outp = DATA / 'leo_nativity_v2.json'
    outp.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f"leo v2 mined: planets={len(planets_out)} houses={len(houses_out)} "
          f"aphorisms={len(aphorisms)} sections=3 -> {outp}")
    if problems:
        print('PROBLEMS:')
        for p in problems:
            print('  -', p)
        raise SystemExit(1)


if __name__ == '__main__':
    main()
