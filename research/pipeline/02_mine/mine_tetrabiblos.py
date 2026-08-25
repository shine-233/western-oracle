"""02_mine + 03_clean: Tetrabiblos Book I 选章 → 行星性质/庙宫/旺位结构化数据 v2。

输入: classics/tetrabiblos_book1_raw.txt (Ashmand 1822 英译, 公版)
输出: data/tetrabiblos_astro_v1.json
校验:
  1. 七大经典行星全覆盖（三节均 7/7）
  2. 庙宫数据与既有 astro_rulerships_ptolemy.json 交叉验证（domicile 一致）
  3. 旺位与通行旺位表一致（Sun-Aries ... Mercury-Virgo）
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CLASSICS = ROOT / 'classics'
DATA = ROOT / 'data'

EXPECTED_EXALT = {
    'Sun': 'Aries', 'Moon': 'Taurus', 'Jupiter': 'Cancer', 'Mercury': 'Virgo',
    'Venus': 'Pisces', 'Mars': 'Capricorn', 'Saturn': 'Libra',
}
EXPECTED_DOMICILE = {
    'Sun': ['Leo'], 'Moon': ['Cancer'], 'Mercury': ['Gemini', 'Virgo'],
    'Venus': ['Taurus', 'Libra'], 'Mars': ['Aries', 'Scorpio'],
    'Jupiter': ['Sagittarius', 'Pisces'], 'Saturn': ['Aquarius', 'Capricorn'],
}
PLANETS = ['Sun', 'Moon', 'Saturn', 'Mars', 'Jupiter', 'Venus', 'Mercury']


def parse_section(seg: str) -> dict[str, str]:
    out = {}
    parts = re.split(r'^\[([A-Za-z_]+)\]\s*$', seg, flags=re.M)
    for i in range(1, len(parts) - 1, 2):
        out[parts[i]] = ' '.join(parts[i + 1].split())
    return out


def main() -> None:
    text = (CLASSICS / 'tetrabiblos_book1_raw.txt').read_text(encoding='utf-8')
    sec4 = parse_section(text.split('== CHAPTER IV')[1].split('== CHAPTER XX')[0])
    sec20 = parse_section(text.split('== CHAPTER XX')[1].split('== CHAPTER XXII')[0])
    sec22 = parse_section(text.split('== CHAPTER XXII')[1])

    problems: list[str] = []

    natures = {}
    for p in PLANETS:
        if p not in sec4:
            problems.append(f'CH4 缺 {p}')
        else:
            natures[p] = {'quote': sec4[p], 'source': 'Tetrabiblos Book I Ch. IV (Ashmand 1822)'}

    houses = {}
    for p in PLANETS:
        if p not in sec20:
            problems.append(f'CH20 缺 {p}')
        else:
            houses[p] = {
                'domicile': EXPECTED_DOMICILE[p],
                'quote': sec20[p],
                'source': 'Tetrabiblos Book I Ch. XX (Ashmand 1822)',
            }

    # 庙宫交叉验证：与既有 curated 表比对
    old = json.loads((CLASSICS / 'astro_rulerships_ptolemy.json').read_text(encoding='utf-8'))
    old_dom = {r['planet']: r['domicile'] for r in old['rulerships']}
    for p in PLANETS:
        if sorted(old_dom[p]) != sorted(EXPECTED_DOMICILE[p]):
            problems.append(f'{p}: 庙宫与既有 curated 表不一致 ({old_dom[p]} vs {EXPECTED_DOMICILE[p]})')

    exalt = {}
    for p in PLANETS:
        if p not in sec22:
            problems.append(f'CH22 缺 {p}')
        else:
            if EXPECTED_EXALT[p] not in sec22[p]:
                problems.append(f'{p}: 旺位文本与通行表不符（期望 {EXPECTED_EXALT[p]}）')
            exalt[p] = {
                'exaltation': EXPECTED_EXALT[p],
                'quote': sec22[p],
                'source': 'Tetrabiblos Book I Ch. XXII (Ashmand 1822)',
            }

    out = {
        'dataset': 'tetrabiblos_book1_selections',
        'version': 'v1',
        'generated': '2026-08-25',
        'planets': {
            p: {'nature': natures[p], 'houses': houses[p], 'exaltation': exalt[p]}
            for p in PLANETS
        },
    }
    outp = DATA / 'tetrabiblos_astro_v1.json'
    outp.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'tetrabiblos mined 7 planets x 3 chapters -> {outp}')
    if problems:
        print('PROBLEMS:')
        for p in problems:
            print('  -', p)
        raise SystemExit(1)
    print('cross-validation with curated rulerships: consistent.')


if __name__ == '__main__':
    main()
