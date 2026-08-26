"""02_mine: Alan Leo《How to Judge a Nativity》(1928 ed.) v3（第二轮扩容）。

输入: classics/leo_how_to_judge_nativity_1928_raw.txt (Internet Archive OCR, 公版)
输出: data/leo_nativity_v3.json

v2 → v3 扩容（v2 覆盖 ≈44%，新增区块）:
  A. element_sign_groups：火/水/风/土四类星座深义章（Ch II）
  B. chapters III/V：发光体与行星 / 三大中心（太阳·月亮·上升）
  C. planets_rising_in_signs：十二星座「行星升起」逐座章（结构化价值高）
  D. solar_aspects：太阳相位影响章
  E. apheta_and_anareta：寿命主星与杀手星章
  F. houses_conclusion + uranus_neptune_aspects：宫位章结语与天/海王相位
  G. concluding_chapters：Ch XXI 判断总论 / 月亮布局 / Ch XXII
  另含 v2 全部内容（五星入星座/Centiloquy 百条/逐宫/sun·moon 段）。

校验: 各新区块锚点命中且长度达标；v2 校验全数保留。
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CLASSICS = ROOT / 'classics'
DATA = ROOT / 'data'

SIGNS_CAP = ['ARIES', 'TAURUS', 'GEMINI', 'CANCER', 'LEO', 'VIRGO',
             'LIBRA', 'SCORPIO', 'SAGITTARIUS', 'CAPRICORNUS', 'CAPRICORN',
             'AQUARIUS', 'PISCES']

HOUSES_CHAPTER_END = 'GENERAL REMARKS ON CH'
CENTILOQUY_END = 'Alan Leo’s Astrological Publications'


def norm(s: str) -> str:
    # 小节标题行尾的页码剥除（保留标题文本，如 'THE ASPECTS: GOOD ASPECTS 59'）
    s = re.sub(r"(?m)^[ \t]*([A-Z][A-Z\s&:\.\x27-]{5,60}?)[ \t]+\d{1,4}[ \t]*$", r' \1 ', s)
    s = re.sub(
        r"(?m)^[ \t]*[a-z\x27\.]{0,4}[ \t]*\d{0,3}[ \t]*HOW[ \t]+TO[ \t]+JUDGE"
        r"[a-zA-Z\s&\x27\(\)\x18\d\.]{0,32}[ \t]*$", ' ', s)
    s = re.sub(r"(?m)^[ \t]*\d{0,3}[ \t]*[A-Z(][A-Z\s&\x27\d\.(]{5,70}[ \t]*$", ' ', s)
    s = re.sub(r"(?m)^[ \t]*\d{1,4}[ \t]*$", ' ', s)
    s = re.sub(r"(?<=[a-z,;.])\s+\d{1,3}\s+[A-Z][A-Z&\x27\s]{5,55}(?=\s+[a-z])", ' ', s)
    s = re.sub(r"\b\d{1,3}\s+HOW TO JUDGE(?:\s+A?\s*\(?\s*NATIVITY)?\b[\d\s\.]{0,4}", ' ', s)
    s = re.sub(r"\bHOW TO JUDGE(?:\s+A)?\s+NATIVITY\b[\d\s\.]{0,4}", ' ', s)
    return re.sub(r'[ \t]+', ' ', s)


def roman_expected(n: int) -> str:
    vals = [(100, 'C'), (90, 'XC'), (50, 'L'), (40, 'XL'), (10, 'X'),
            (9, 'IX'), (5, 'V'), (4, 'IV'), (1, 'I')]
    out = ''
    for v, sym in vals:
        while n >= v:
            out += sym
            n -= v
    return out


def parse_centiloquy(seg: str) -> list[dict]:
    lines = seg.split('\n')
    items: list[dict] = []
    cur_num = 0
    cur_parts: list[str] = []

    def flush():
        nonlocal cur_parts
        txt = norm(' '.join(cur_parts)).strip()
        if cur_num and txt:
            items.append({'no': cur_num, 'text': txt})
        cur_parts = []

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
            if tok == roman_expected(cur_num + 1):
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

    def between(a_anchor: str, b_anchor: str, lo: int, hi: int | None = None,
                a_from_lo: bool = True) -> tuple[int, int]:
        a = text.find(a_anchor, lo if a_from_lo else 0)
        b = text.find(b_anchor, a + len(a_anchor)) if a >= 0 else -1
        if hi is not None:
            b = min(b, hi) if b > 0 else hi
        assert a >= 0 and b > a, f'锚点缺失: {a_anchor!r} -> {b_anchor!r}'
        return a, b

    new_blocks: dict[str, dict] = {}

    # ---- A. 四元素星座深义 ----
    elems = {}
    prev_end = None
    for key, anchor in (('fiery', 'THE FIERY SIGNS'), ('watery', 'THE WATERY SIGNS'),
                        ('airy', 'THE AIRY SIGNS'), ('earthy', 'THE EARTHY SIGNS')):
        p = text.find(anchor, 60000)
        if p < 0:
            problems.append(f'{key} 锚点缺失')
            continue
        elems[key] = p
    order = sorted(elems.items(), key=lambda kv: kv[1])
    for i, (key, pos) in enumerate(order):
        nxt = order[i + 1][1] if i + 1 < len(order) else text.find('CHAPTER III', 60000)
        seg = norm(text[pos:nxt]).strip()
        if len(seg) < 3000:
            problems.append(f'{key} signs 段过短: {len(seg)}')
        new_blocks.setdefault('element_sign_groups', {})[key] = {'anchor': anchor, 'passage': seg}

    # ---- B. Ch III / Ch V ----
    a3, _ = between('CHAPTER III', 'CHAPTER IV', 60000)
    _, e4 = between('CHAPTER IV', 'CHAPTER V', a3)
    e5 = text.find('THE SUN IN THE TWELVE SIGNS', 190000)
    ch3 = norm(text[a3:e4]).strip()
    ch5 = norm(text[e4:e5]).strip()
    if len(ch3) < 20000:
        problems.append(f'ch3 过短: {len(ch3)}')
    if len(ch5) < 8000:
        problems.append(f'ch5 过短: {len(ch5)}')
    new_blocks['ch3_luminaries_and_planets'] = {'passage': ch3}
    new_blocks['ch5_three_centres'] = {'passage': ch5}

    # ---- C. 行星升起十二星座章 ----
    rising = {}
    positions = []
    for sg in SIGNS_CAP:
        pat = rf'PLANETS\s+RISING\s+(?:IN\s+)?{sg}\b'
        if sg == 'CAPRICORN':
            pat = r'PLANETS\s+RISING\s+(?:IN\s+)?CAPRICOR[NRI]{1,3}\b'
        cands = [m.start() for m in re.finditer(pat, text)
                 if 290000 < m.start() < 352000]
        if cands:
            positions.append((sg, cands[0]))
    positions.sort(key=lambda x: x[1])
    end_rising = text.find('CHAPTER VII', 340000)
    for i, (sg, pos) in enumerate(positions):
        nxt = positions[i + 1][1] if i + 1 < len(positions) else end_rising
        seg = norm(text[pos:nxt]).strip()
        key = sg.lower()
        if len(seg) < 2500:
            problems.append(f'rising {sg} 段过短: {len(seg)}')
        rising[key] = {'anchor': f'PLANETS RISING {sg}', 'passage': seg}
    if len(rising) != 12:
        problems.append(f'rising 覆盖 {len(rising)}/12')
    new_blocks['planets_rising_in_signs'] = rising

    # ---- D/E. 太阳相位 & Apheta/Anareta ----
    sol_a = text.find('INFLUENCE OF SOLAR ASPECTS', 350000)
    sol_b = text.find('CHAPTER VIII', sol_a)
    seg = norm(text[sol_a:sol_b]).strip()
    if len(seg) < 8000:
        problems.append(f'solar_aspects 过短: {len(seg)}')
    new_blocks['solar_aspects'] = {'anchor': 'INFLUENCE OF SOLAR ASPECTS', 'passage': seg}

    ap_a = text.find('APHETA AND ANARETA', 380000)
    ap_b = text.find('THE Seconp HousE', 400000)
    if ap_b < 0:
        ap_b = text.find('THE SECOND HOUSE', 409000)
    seg = norm(text[ap_a:ap_b]).strip()
    if len(seg) < 6000:
        problems.append(f'apheta 过短: {len(seg)}')
    new_blocks['apheta_and_anareta'] = {'anchor': 'THE APHETA AND ANARETA', 'passage': seg}

    # ---- F. 宫位结语 + 天王/海王相位 ----
    gr = text.find(HOUSES_CHAPTER_END, 590000)
    nep = re.search(r'ASPECTS[:\s\.\x27]{0,3}\s*NEPTUNE', text[gr:text.find('THE FATE OF SATURN', 610000)])
    nep_start = gr + nep.start() if nep else gr
    sat = text.find('THE FATE OF SATURN IN THE TWELVE SIGNS', 610000)
    hc = norm(text[gr:nep_start]).strip()
    un = norm(text[nep_start:sat]).strip()
    if len(hc) < 1500:
        problems.append(f'houses_conclusion 过短: {len(hc)}')
    if len(un) < 12000:
        problems.append(f'uranus_neptune 过短: {len(un)}')
    new_blocks['houses_conclusion'] = {'passage': hc}
    new_blocks['uranus_neptune_aspects'] = {'passage': un}

    # ---- G. 结论章（XXI 起 → Centiloquy 前）----
    c_start = text.find('CHAPTER XXI', 720000)
    disp = text.find('THE DISPOSITION PRODUCED BY', c_start)
    c22 = text.find('CHAPTER XXII', 740000)
    cq = text.find('A CENTILOQUY', 800000)
    concluding = {
        'ch21_judgment': norm(text[c_start:disp]).strip(),
        'moon_disposition': norm(text[disp:c22]).strip(),
        'ch22_onward': norm(text[c22:cq]).strip(),
    }
    for k, v in concluding.items():
        if len(v) < 3000:
            problems.append(f'{k} 过短: {len(v)}')
    new_blocks['concluding_chapters'] = concluding

    outp_prev = DATA / 'leo_nativity_v2.json'
    v2 = json.loads(outp_prev.read_text(encoding='utf-8'))
    aphorisms = parse_centiloquy(text[text.find('A CENTILOQUY', 800000):text.find(CENTILOQUY_END, 800000)])

    out = dict(v2)
    out.update({
        'version': 'v3',
        'generated': '2026-08-26',
        'source': dict(v2['source'], note='v3 扩容：新增四元素星座深义、Ch III/V、'
                       '行星升起十二星座、太阳相位、Apheta/Anareta、宫位结语与天海王相位、结论章'),
        'expansions': new_blocks,
        'centiloquy': {
            'chapter_title': 'A Centiloquy — One Hundred Aphorisms',
            'aphorisms': aphorisms if len(aphorisms) == 100 else v2['centiloquy']['aphorisms'],
        },
    })
    problems_out = []
    if len(aphorisms) != 100:
        problems_out.append(f'centiloquy {len(aphorisms)}/100')

    outp = DATA / 'leo_nativity_v3.json'
    outp.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    total_new = sum(len(x.get('passage', '')) for x in new_blocks.values() if isinstance(x, dict)) \
        + sum(len(s.get('passage', '')) for g in new_blocks.values() if isinstance(g, dict)
              for s in g.values() if isinstance(s, dict))
    print(f"leo v3 mined: expansions={len(new_blocks)} groups, new_chars≈{total_new} -> {outp}")
    if problems or problems_out:
        print('PROBLEMS:')
        for p in problems + problems_out:
            print('  -', p)
        raise SystemExit(1)


if __name__ == '__main__':
    main()
