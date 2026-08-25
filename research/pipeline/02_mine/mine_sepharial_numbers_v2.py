"""02_mine + 03_clean: Sepharial《The Kabala of Numbers》数字释义挖掘 v2（扩容版）。

输入: classics/sepharial_kabala_of_numbers_raw.txt (Internet Archive OCR, 公版)
输出: data/sepharial_numbers_v2.json

v1 → v2 扩容（v1 提取率 4.0%，仅 Ch I + XI 的表）:
  A. Chapter I   Minor Key：数字 1-9 含义 + 对应行星（同 v1）
  B. Chapter XI  THINGS THOUGHT OF / 合成数释义 12..84（同 v1）
  C. Chapter X   THOUGHT-READING BY NUMBERS：新增整章段落库
  D. Chapter XII OF THINGS LOST：新增整章段落库

校验:
  1. minor_key 9/9 且均有文本；planets 与通行表一致
  2. things_thought_of 9/9；resultant 区间 >= 55 条且含起始条目 10
  3. Ch X / XII 段落库非空且总量达标；章锚点齐全
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


def norm(s: str) -> str:
    return re.sub(r'\s+', ' ', s).strip()


def parse_numbered(seg: str, max_num: int = 99) -> dict[str, str]:
    """按行首 'N.' 切分编号条目。"""
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
    """章节体按空行切段，清页眉/页码，保留实质段落。"""
    out = []
    body = re.sub(r'(?m)^\s*\d{1,3}\s*$', ' ', seg)
    for p in re.split(r'\n\s*\n', body):
        p = norm(p)
        if len(p) >= min_len:
            out.append(p)
    return out


def main() -> None:
    text = (CLASSICS / 'sepharial_kabala_of_numbers_raw.txt').read_text(encoding='utf-8')
    problems: list[str] = []

    def chapter_span(label: str, next_label: str) -> tuple[int, int]:
        m1 = re.search(rf'(?m)^\s*CHAPTER\s+{label}\s*$', text)
        m2 = re.search(rf'(?m)^\s*CHAPTER\s+{next_label}\s*$', text)
        assert m1 and m2, f'章节锚点缺失: {label}'
        return m1.start(), m2.start()

    ch1_start, ch1_end = chapter_span('I', 'II')
    ch10_start, ch10_end = chapter_span('X', 'XI')
    ch11_start, ch11_end = chapter_span('XI', 'XII')
    ch12_start, ch12_end = chapter_span('XII', 'XIII')

    ch1 = text[ch1_start:ch1_end]
    ch11 = text[ch11_start:ch11_end]

    # --- A. Minor Key ---
    mk_pos = ch1.find('Minor Key')
    mk_seg = ch1[mk_pos:]
    mk_items = parse_numbered(mk_seg.split('In this scheme')[0], max_num=9)
    minor_key = {}
    for n, txt in mk_items.items():
        txt = re.sub(r'^Denotes\s+', '', txt)
        minor_key[n] = {'meaning': txt}

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

    # --- B/C. Chapter XI ---
    tt_pos = ch11.find('THINGS THOUGHT OF')
    assert tt_pos > 0, '未找到 THINGS THOUGHT OF'
    tt_seg = ch11[tt_pos:]
    all_items = parse_numbered(tt_seg, max_num=84)
    if '1' not in all_items:
        m1 = re.search(r'(?m)^\s*l\.\s*(.+)$', tt_seg)
        if m1:
            all_items['1'] = norm(m1.group(1))[:500]
    things_thought_of = {k: v for k, v in all_items.items() if k.isdigit() and int(k) <= 9}
    resultant = {
        k: v for k, v in all_items.items()
        if k.isdigit() and int(k) >= 10
    }

    # --- D. Chapter X / XII 段落库 ---
    ch_x = chapter_passages(text[ch10_start:ch10_end])
    ch_xii = chapter_passages(text[ch12_start:ch12_end])
    if sum(map(len, ch_x)) < 2500 or len(ch_x) < 5:
        problems.append(f'Ch X 段落库不足: {len(ch_x)} 段 {sum(map(len, ch_x))} 字符')
    if sum(map(len, ch_xii)) < 4000 or len(ch_xii) < 8:
        problems.append(f'Ch XII 段落库不足: {len(ch_xii)} 段 {sum(map(len, ch_xii))} 字符')
    if 'THOUGHT-READING BY NUMBERS' not in text[ch10_start:ch10_start + 300]:
        problems.append('Ch X 标题不在章首')
    if 'OF THINGS LOST' not in text[ch12_start:ch12_start + 300]:
        problems.append('Ch XII 标题不在章首')

    if len(minor_key) != 9:
        problems.append(f'minor_key 覆盖 {len(minor_key)}/9')
    empty_mk = [n for n, v in minor_key.items() if not v['meaning']]
    if empty_mk:
        problems.append(f'minor_key 空条目: {empty_mk}')
    no_planet = [n for n, v in minor_key.items()
                 if EXPECTED_PLANETS[n].casefold() not in v.get('planet', '').casefold()]
    if no_planet:
        problems.append(f'行星与通行表不符: {no_planet}（期望 {EXPECTED_PLANETS}）')
    if len(things_thought_of) != 9:
        problems.append(f'things_thought_of 覆盖 {len(things_thought_of)}/9')
    covered = [int(k) for k in resultant if 12 <= int(k) <= 84]
    if len(covered) < 55:
        problems.append(f'resultant 区间覆盖仅 {len(covered)} 条 (<55)')
    if '10' not in resultant:
        problems.append('resultant 缺少起始条目 10')

    out = {
        'dataset': 'numerology_kabala',
        'version': 'v2',
        'generated': '2026-08-26',
        'source': {
            'work': 'Sepharial, The Kabala of Numbers',
            'year': 1911,
            'rights': 'public domain',
            'origin': 'Internet Archive OCR (TheKabalaOfNumbers)',
            'note': 'v2 扩容：新增 Ch X「以数读心」与 Ch XII「论失物」整章段落库',
        },
        'minor_key': minor_key,
        'things_thought_of': things_thought_of,
        'resultant_meanings': resultant,
        'chapters': {
            'x_thought_reading_by_numbers': {'passages': ch_x},
            'xii_of_things_lost': {'passages': ch_xii},
        },
    }
    outp = DATA / 'sepharial_numbers_v2.json'
    outp.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'sepharial v2 mined: minor_key={len(minor_key)} thought={len(things_thought_of)} '
          f'resultant={len(resultant)} chX={len(ch_x)}P chXII={len(ch_xii)}P -> {outp}')
    if problems:
        print('PROBLEMS:')
        for p in problems:
            print('  -', p)
        raise SystemExit(1)


if __name__ == '__main__':
    main()
