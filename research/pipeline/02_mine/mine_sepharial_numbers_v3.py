"""02_mine + 03_clean: Sepharial《The Kabala of Numbers》v3（全书章库版）。

输入: classics/sepharial_kabala_of_numbers_raw.txt (Internet Archive OCR, 公版)
输出: data/sepharial_numbers_v3.json

v2 → v3 扩容（v2 覆盖 ≈56%：Ch I/XI 表格 + X/XII 段落）:
通走全部 19 章，每章收录 title + passages 段落库；
Ch I/XI 的表格数据仍按 v1/v2 结构单独解析（minor_key 等）。

校验:
  1. 19/19 章齐备且标题锚点命中
  2. minor_key 9/9、things_thought_of 9/9、resultant >= 55（与 v1/v2 同标准）
  3. 各章段落总量达标
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CLASSICS = ROOT / 'classics'
DATA = ROOT / 'data'

EXPECTED_PLANETS = {
    '1': 'Sun', '2': 'Moon', '3': 'Jupiter', '4': 'Earth', '5': 'Mercury',
    '6': 'Venus', '7': 'Moon', '8': 'Saturn', '9': 'Mars',
}

CHAPTERS = [
    ('I', 'THE POWER OF NUMBERS'),
    ('II', 'GEOMETRICAL RELATIONS OF THOUGHT'),
    ('III', 'NUMEROLOGY'),
    ('IV', 'VARIOUS METHODS OF KABALISM'),
    ('V', 'NUMBER, FORM, COLOUR, SOUND'),
    ('VI', 'NAMES, NUMBERS, AND INCIDENTS'),
    ('VII', 'CHANCE EVENTS'),
    ('VIII', 'REDUCTION TO LAW'),
    ('IX', 'NUMBER AND AUTOMATISM'),
    ('X', 'THOUGHT-READING BY NUMBERS'),
    ('XI', 'THE SIGNIFICANCE OF NUMBERS'),
    ('XII', 'OF THINGS LOST'),
    ('XIII', 'THE KABALISM OF CYCLES'),
    ('XIV', 'SUCCESS AND FAILURE'),
    ('XV', 'THE LAW OF VALUES'),
    ('XVI', 'BRUNO’S SYMBOLISM'),
    ('XVII', 'COSMIC ANALOGIES'),
    ('XVIII', 'SOME RECONCITE PROBLEMS'),
    ('XIX', 'GOD GEOMETRISES'),
]
# XVI/XVIII 标题 OCR 有变体，宽松匹配
TITLE_PAT = {r: re.escape(ti).replace(r'\’', '[’\x27]') for r, ti in CHAPTERS}
TITLE_PAT['XVI'] = r'BRUNO[\x27’]*S\s+SYMBOLISM'
TITLE_PAT['XVIII'] = r'SOME\s+RECO[NM][DC][I1]?TE\s+PROBLEMS'


def norm(s: str) -> str:
    return re.sub(r'\s+', ' ', s).strip()


def parse_numbered(seg: str, max_num: int = 99) -> dict[str, str]:
    parts = re.split(r'(?m)^\s*(\d{1,2})\.\s+', seg)
    out: dict[str, str] = {}
    for i in range(1, len(parts) - 1, 2):
        num = parts[i]
        if not num.isdigit() or int(num) > max_num:
            continue
        text = norm(parts[i + 1])
        if num not in out and text:
            out[num] = text[:500]
    return out


def chapter_passages(seg: str, min_len: int = 120) -> list[str]:
    out = []
    body = re.sub(r'(?m)^\s*\d{1,3}\s*$', ' ', seg)
    for p in re.split(r'\n\s*\n', body):
        p = norm(p)
        if len(p) >= min_len:
            out.append(p)
    return out


def slug(roman: str) -> str:
    return roman.lower().replace(' ', '')


def main() -> None:
    text = (CLASSICS / 'sepharial_kabala_of_numbers_raw.txt').read_text(encoding='utf-8')
    problems: list[str] = []

    # ---- 章界：CHAPTER <罗马> 行 + 标题行双重锚定 ----
    spans: dict[str, tuple[int, int]] = {}
    marks: list[tuple[int, str]] = []
    for roman, title in CHAPTERS:
        m = None
        for mm in re.finditer(rf"(?m)^\s*CHAPTER\s+{roman}\s*$", text):
            after = norm(text[mm.end():mm.end() + 120])
            if re.search(TITLE_PAT[roman], after, re.IGNORECASE):
                m = mm
                break
        if not m:
            problems.append(f'CH{roman} 锚点缺失 ({title})')
            continue
        marks.append((m.start(), roman))
    marks.sort()
    for i, (pos, roman) in enumerate(marks):
        end = marks[i + 1][0] if i + 1 < len(marks) else len(text)
        # 去掉书尾出版广告（末章之后）
        if i + 1 == len(marks):
            ad = text.find('THE SCIENCE OF NUMBERS', pos)
            tail_ad = text.find('Index', pos)
            for cut in (ad, tail_ad):
                if cut > pos:
                    end = min(end, cut)
        spans[roman] = (pos, end)
    if len(spans) != 19:
        problems.append(f'章覆盖 {len(spans)}/19')

    chapters_out: dict[str, dict] = {}
    for roman, title in CHAPTERS:
        if roman not in spans:
            continue
        a, b = spans[roman]
        seg = text[a:b]
        paras = chapter_passages(seg)
        chapters_out[slug(roman)] = {
            'roman': roman,
            'title': next((t for t in (title,) if t), ''),
            'passages': paras,
        }
        if sum(map(len, paras)) < 1500 and roman not in ('XI',):
            problems.append(f'CH{roman} 段落过少: {sum(map(len, paras))} 字符')

    # ---- Ch I Minor Key / Ch XI 表格（同 v1/v2 标准）----
    ch1 = text[spans['I'][0]:spans['I'][1]]
    ch11 = text[spans['XI'][0]:spans['XI'][1]]
    mk_pos = ch1.find('Minor Key')
    mk_items = parse_numbered(ch1[mk_pos:].split('In this scheme')[0], max_num=9)
    minor_key = {}
    for n, txt in mk_items.items():
        minor_key[n] = {'meaning': re.sub(r'^Denotes\s+', '', txt)}
    planets_seg = ch1[mk_pos:][ch1[mk_pos:].find('In this scheme'):]
    planet_pairs = re.findall(
        r'(\d)\.\s+(?:The\s+)?(Sun|Moon|Jupiter|Earth|Mercury|Venus|Saturn|Mars)'
        r'(?:\s+or\s+(?:Sun|Moon|Earth))?(?:\s*\((?:New|Full)\))?\s+(\d)\.\s+'
        r'(?:The\s+)?(Sun|Moon|Jupiter|Earth|Mercury|Venus|Saturn|Mars)',
        planets_seg,
    )
    for a, pa, b, pb in planet_pairs:
        if a in minor_key:
            minor_key[a]['planet'] = pa
        if b in minor_key:
            minor_key[b]['planet'] = pb
    for m_single in re.finditer(
        r'(?m)^\s*(\d)\.\s+(?:The\s+)?(Sun|Moon|Jupiter|Earth|Mercury|Venus|Saturn|Mars)(?:\s+or\s+\w+)?[\.\s]*$',
        planets_seg,
    ):
        n = m_single.group(1)
        if n in minor_key and 'planet' not in minor_key[n]:
            minor_key[n]['planet'] = m_single.group(2)

    tt_pos = ch11.find('THINGS THOUGHT OF')
    assert tt_pos > 0, '未找到 THINGS THOUGHT OF'
    all_items = parse_numbered(ch11[tt_pos:], max_num=84)
    if '1' not in all_items:
        m1 = re.search(r'(?m)^\s*l\.\s*(.+)$', ch11[tt_pos:])
        if m1:
            all_items['1'] = norm(m1.group(1))[:500]
    things_thought_of = {k: v for k, v in all_items.items() if k.isdigit() and int(k) <= 9}
    resultant = {k: v for k, v in all_items.items() if k.isdigit() and int(k) >= 10}

    if len(minor_key) != 9:
        problems.append(f'minor_key {len(minor_key)}/9')
    no_planet = [n for n, v in minor_key.items()
                 if EXPECTED_PLANETS[n].casefold() not in v.get('planet', '').casefold()]
    if no_planet:
        problems.append(f'行星不符: {no_planet}')
    if len(things_thought_of) != 9:
        problems.append(f'things_thought_of {len(things_thought_of)}/9')
    covered = [int(k) for k in resultant if 12 <= int(k) <= 84]
    if len(covered) < 55:
        problems.append(f'resultant 仅 {len(covered)} (<55)')

    total = sum(len(p) for c in chapters_out.values() for p in c['passages'])
    out = {
        'dataset': 'numerology_kabala',
        'version': 'v3',
        'generated': '2026-08-26',
        'source': {
            'work': 'Sepharial, The Kabala of Numbers',
            'year': 1911,
            'rights': 'public domain',
            'origin': 'Internet Archive OCR (TheKabalaOfNumbers)',
            'note': 'v3 扩容：全部 19 章逐章段落库；Ch I/XI 的结构化表保持独立字段',
        },
        'minor_key': minor_key,
        'things_thought_of': things_thought_of,
        'resultant_meanings': resultant,
        'chapters': chapters_out,
    }
    outp = DATA / 'sepharial_numbers_v3.json'
    outp.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'sepharial v3 mined: chapters={len(chapters_out)} '
          f'minor={len(minor_key)} resultant={len(resultant)} prose={total}ch -> {outp}')
    if problems:
        print('PROBLEMS:')
        for p in problems:
            print('  -', p)
        raise SystemExit(1)


if __name__ == '__main__':
    main()
