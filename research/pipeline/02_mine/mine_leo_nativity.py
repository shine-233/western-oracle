"""02_mine: Alan Leo《How to Judge a Nativity》(1928 ed.) 关键章节挖掘 v1。

输入: classics/leo_how_to_judge_nativity_1928_raw.txt (Internet Archive OCR, 公版)
输出: data/leo_nativity_v1.json

提取三块（整段收录，逐星座切分留待 v2——正文星座符号被 OCR 损坏）:
  A. twelve_houses：Ch I「The Twelve Houses of the Horoscope」
  B. sun_in_signs：Ch V「The Influence of the Sun in the Twelve Signs」
  C. moon_in_signs：Ch V「The Influence of the Moon in the Twelve Signs」

校验:
  1. 三段均 >= 3000 字符且锚点命中
  2. B/C 段内元素词与关键词抽查（Aries/Taurus 等）
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CLASSICS = ROOT / 'classics'
DATA = ROOT / 'data'


def norm(s: str) -> str:
    # OCR 页眉行（'76 HOW TO JUDGE A NATIVITY'）与独立页码清除（含行内罗马页码变体）
    s = re.sub(r'(?m)^[ \t]*\d{0,3}[ \t]*[A-Z][A-Z\s&\x27\d\.]{5,70}[ \t]*$', ' ', s)
    s = re.sub(r'(?m)^[ \t]*\d{1,4}[ \t]*$', ' ', s)
    s = re.sub(r'(?<=[a-z,;.])\s+\d{1,3}\s+[A-Z][A-Z&\x27\s]{5,55}(?=\s+[a-z])', ' ', s)
    return re.sub(r'[ \t]+', ' ', s)


def main() -> None:
    text = (CLASSICS / 'leo_how_to_judge_nativity_1928_raw.txt').read_text(encoding='utf-8')

    def span(start_kw: str, end_kw: str, from_pos: int = 0) -> tuple[int, int]:
        a = text.find(start_kw, from_pos)
        b = text.find(end_kw, a + len(start_kw)) if a >= 0 else -1
        assert a >= 0 and b > a, f'锚点缺失: {start_kw!r} -> {end_kw!r}'
        return a, b

    h_start, h_end = span('THE TWELVE HOUSES OF THE HOROSCOPE',
                          'proceed to consider the twelve', 35000)
    s_start, s_end = span('THE SUN IN THE TWELVE SIGNS'.replace('SUN', 'SUN'),
                          'INFLUENCE OF THE MOON IN THE TWELVE SIGNS', 190000)
    m_end = text.find('Personal \nAppearance and Character', s_end)
    if m_end < 0:
        m_end = re.search(r'Personal\s+Appearance and Character', text[s_end:s_end + 40000]).start() + s_end
    assert m_end > s_end, '月亮段终点缺失'

    houses = norm(text[h_start:h_end])
    sun_in_signs = norm(text[s_start:s_end])
    moon_in_signs = norm(text[s_end:m_end])

    problems: list[str] = []
    for name, seg in (('twelve_houses', houses), ('sun_in_signs', sun_in_signs),
                      ('moon_in_signs', moon_in_signs)):
        if len(seg) < 3000:
            problems.append(f'{name} 段过短: {len(seg)}')

    # 月亮段星座名多被 OCR 符号损坏，仅要求出现（正文互文提及）；太阳段要求更高
    hits = sum(1 for s in ('Aries', 'Taurus', 'Gemini', 'Libra', 'Pisces')
               if re.search(rf'\b{s}\b', sun_in_signs))
    if hits < 2:
        problems.append(f'sun_in_signs 星座名覆盖不足: {hits}/5')
    if not re.search(r'\b(Gemini|Taurus|Cancer)\b', moon_in_signs):
        problems.append('moon_in_signs 缺少任何星座名锚点')

    out = {
        'dataset': 'leo_nativity_sections',
        'version': 'v1',
        'generated': '2026-08-25',
        'source': {
            'work': 'Alan Leo, How to Judge a Nativity (1928 edition)',
            'author_dates': 'Alan Leo (1860-1917)',
            'rights': 'public domain',
            'origin': 'Internet Archive OCR (howtojudgenativi00leoa)',
            'note': '段落含页眉页码噪声；逐星座切分与清洗留待 v2',
        },
        'sections': {
            'twelve_houses': {'anchor': 'THE TWELVE HOUSES OF THE HOROSCOPE', 'passage': houses},
            'sun_in_signs': {'anchor': 'THE INFLUENCE OF THE SUN IN THE TWELVE SIGNS', 'passage': sun_in_signs},
            'moon_in_signs': {'anchor': 'THE INFLUENCE OF THE MOON IN THE TWELVE SIGNS', 'passage': moon_in_signs},
        },
    }
    outp = DATA / 'leo_nativity_v1.json'
    outp.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'leo mined: houses={len(houses)} sun={len(sun_in_signs)} moon={len(moon_in_signs)} chars -> {outp}')
    if problems:
        print('PROBLEMS:')
        for p in problems:
            print('  -', p)
        raise SystemExit(1)


if __name__ == '__main__':
    main()
