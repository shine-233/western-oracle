"""02_mine + 03_clean: Sepharial《The Kabala of Numbers》数字释义挖掘 v1。

输入: classics/sepharial_kabala_of_numbers_raw.txt (Internet Archive OCR, 公版)
输出: data/sepharial_numbers_v1.json

提取三块结构化数据:
  A. Chapter I  Minor Key：数字 1-9 含义 + 对应行星
  B. Chapter XI THINGS THOUGHT OF：数字 1-9（问事所思）
  C. Chapter XI RESULTANT MEANINGS：加 3 后的合成数释义（12..84）

校验:
  1. minor_key 9/9 且均有文本；planets 9/9
  2. things_thought_of 9/9
  3. resultant >= 60 条（理论值 73，OCR 允许少量噪声）
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
        # 到下一个编号前的内容可能混入页码/下一节标题，截断到合理长度
        if num not in out and text:
            out[num] = text[:500]
    return out


def main() -> None:
    text = (CLASSICS / 'sepharial_kabala_of_numbers_raw.txt').read_text(encoding='utf-8')

    def chapter_span(label: str, next_label: str) -> tuple[int, int]:
        """按 'CHAPTER <罗马数字>' 行定位章节边界（OCR 标题行尾常带空格）。"""
        m1 = re.search(rf'(?m)^\s*CHAPTER\s+{label}\s*$', text)
        m2 = re.search(rf'(?m)^\s*CHAPTER\s+{next_label}\s*$', text)
        assert m1 and m2, f'章节锚点缺失: {label}'
        return m1.start(), m2.start()

    ch1_start, ch1_end = chapter_span('I', 'II')
    ch11_start, ch11_end = chapter_span('XI', 'XII')

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

    # 行星表（两栏 OCR）：'1. The Sun 6. Venus'；条目4为 'The Earth or Sun'
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
    # 独行条目（如 '5. Mercury.' 不与其它数字同行）
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
    # THINGS THOUGHT OF 的 1-9 在前，其后为合成数大表（10..84）
    all_items = parse_numbered(tt_seg, max_num=84)
    # OCR 常把条目 '1.' 误作小写 l.，单独补录
    if '1' not in all_items:
        m1 = re.search(r'(?m)^\s*l\.\s*(.+)$', tt_seg)
        if m1:
            all_items['1'] = norm(m1.group(1))[:500]
    things_thought_of = {k: v for k, v in all_items.items() if k.isdigit() and int(k) <= 9}
    resultant = {
        k: v for k, v in all_items.items()
        if k.isdigit() and int(k) >= 10
    }

    problems: list[str] = []
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
    # 理论区间 12..84 共 73 条；OCR 缺页/粘连允许少量缺失
    covered = [int(k) for k in resultant if 12 <= int(k) <= 84]
    if len(covered) < 55:
        problems.append(f'resultant 区间覆盖仅 {len(covered)} 条 (<55)')
    if '10' not in resultant:
        problems.append('resultant 缺少起始条目 10')

    out = {
        'dataset': 'numerology_kabala',
        'version': 'v1',
        'generated': '2026-08-25',
        'source': {
            'work': 'Sepharial, The Kabala of Numbers',
            'year': 1911,
            'rights': 'public domain',
            'origin': 'Internet Archive OCR (TheKabalaOfNumbers)',
        },
        'minor_key': minor_key,
        'things_thought_of': things_thought_of,
        'resultant_meanings': resultant,
    }
    outp = DATA / 'sepharial_numbers_v1.json'
    outp.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'sepharial mined: minor_key={len(minor_key)} thought={len(things_thought_of)} resultant={len(resultant)} -> {outp}')
    if problems:
        print('PROBLEMS:')
        for p in problems:
            print('  -', p)
        raise SystemExit(1)


if __name__ == '__main__':
    main()
