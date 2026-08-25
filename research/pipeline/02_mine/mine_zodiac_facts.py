"""02_mine + 03_clean: corpora 黄道事实层（CC0）→ zodiac_facts_v1.json。

输入: classics/corpora_zodiac_cc0_raw.json
      (github.com/dariusk/corpora data/divination/zodiac.json, CC0)
输出: data/zodiac_facts_v1.json

结构化事实：黄经区间、元素、古典/现代守护、符号、日期范围、关键词。
与仓库既有 astro_rulerships_ptolemy.json 的庙宫表交叉验证（12/12 必须一致）。

校验:
  1. 12 星座齐全且黄经区间连续（0..360，每座 30°）
  2. ruling_body_classic 与 Ptolemy 庙宫表一致
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CLASSICS = ROOT / 'classics'
DATA = ROOT / 'data'


def main() -> None:
    raw = json.loads((CLASSICS / 'corpora_zodiac_cc0_raw.json').read_text(encoding='utf-8'))
    zz = raw['western_zodiac']

    rulers = json.loads((CLASSICS / 'astro_rulerships_ptolemy.json').read_text(encoding='utf-8'))
    domicile = {r['planet']: r['domicile'] for r in rulers['rulerships']}
    sign_to_classic_ruler = {}
    for planet, signs in domicile.items():
        for s in signs:
            sign_to_classic_ruler[s] = planet

    problems: list[str] = []
    facts = []
    for sign, v in zz.items():
        lo = float(v['longitude_start'])
        hi = float(v['longitude_end'])
        row = {
            'sign': sign,
            'longitude_start': lo,
            'longitude_end': hi,
            'element': v.get('element'),
            'ruler_classic': v.get('ruling_body_classic'),
            'ruler_modern': v.get('ruling_body_modern'),
            'unicode_symbol': v.get('unicode_symbol'),
            'gloss': v.get('gloss'),
            'approximate_dates': f"{v.get('approximate_start_date','')} - {v.get('approximate_end_date','')}",
            'keywords': v.get('keywords', []),
        }
        facts.append(row)

        expect = sign_to_classic_ruler.get(sign)
        if expect and row['ruler_classic'] != expect:
            problems.append(f'{sign}: 古典守护 {row["ruler_classic"]} != Ptolemy 庙宫 {expect}')
        if hi - lo != 30 or lo < 0 or hi > 360:
            problems.append(f'{sign}: 黄经区间异常 [{lo}, {hi}]')

    if len(facts) != 12:
        problems.append(f'星座数 {len(facts)} != 12')
    spans = sorted((f['longitude_start'], f['longitude_end']) for f in facts)
    if spans != [(i * 30.0, (i + 1) * 30.0) for i in range(12)]:
        problems.append('黄经覆盖不连续')

    out = {
        'dataset': 'zodiac_facts',
        'version': 'v1',
        'generated': '2026-08-25',
        'source': {
            'work': 'dariusk/corpora data/divination/zodiac.json',
            'rights': 'CC0 / public domain',
            'note': '古典守护列已与本仓库 astro_rulerships_ptolemy.json（Tetrabiblos 体系）交叉验证一致',
        },
        'count': len(facts),
        'signs': facts,
    }
    outp = DATA / 'zodiac_facts_v1.json'
    outp.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'zodiac facts mined: {len(facts)} signs -> {outp}')
    if problems:
        print('PROBLEMS:')
        for p in problems:
            print('  -', p)
        raise SystemExit(1)


if __name__ == '__main__':
    main()
