"""03_clean: 合并三个独立塔罗牌意来源 → 每张牌多源对照数据集 v2。

来源:
  1. waite   — Waite《The Pictorial Key to the Tarot》1911 (research/data/tarot_waite_v1.json)
  2. papus   — Papus《The Tarot of the Bohemians》1892 (data/papus_candidates_v1.json)
  3. mcelroy — Mark McElroy《A Guide to Tarot Meanings》(作者声明公版, dariusk/corpora)
               (data/mcelroy_candidates_v1.json)

清洗规则:
  1. 三来源 site_id 集合必须都是 78 且一致
  2. 每张牌必须有 waite（主来源）+ papus + mcelroy
  3. mcelroy 数组字段非空校验（keywords/fortune_telling 至少其一）

输出: data/tarot_sources_v2.json
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / 'data'


def main() -> None:
    waite = {c['site_id']: c for c in json.loads((DATA / 'tarot_waite_v1.json').read_text(encoding='utf-8'))}
    papus = {c['site_id']: c for c in json.loads((DATA / 'papus_candidates_v1.json').read_text(encoding='utf-8'))}
    mcelroy = {c['site_id']: c for c in json.loads((DATA / 'mcelroy_candidates_v1.json').read_text(encoding='utf-8'))}

    problems: list[str] = []
    for name, src in [('waite', waite), ('papus', papus), ('mcelroy', mcelroy)]:
        if len(src) != 78:
            problems.append(f'{name}: {len(src)} != 78')

    ids = set(waite) & set(papus) & set(mcelroy)
    if len(ids) != 78:
        only_w = set(waite) - ids
        only_p = set(papus) - ids
        only_m = set(mcelroy) - ids
        if only_w:
            problems.append(f'仅 waite 有: {sorted(only_w)}')
        if only_p:
            problems.append(f'仅 papus 有: {sorted(only_p)}')
        if only_m:
            problems.append(f'仅 mcelroy 有: {sorted(only_m)}')

    merged = []
    for sid in sorted(ids):
        m = mcelroy[sid]
        if not m['keywords'] and not m['fortune_telling']:
            problems.append(f'{sid}: mcelroy keywords/fortune_telling 均为空')
        merged.append({
            'site_id': sid,
            'arcana': waite[sid]['arcana'],
            'waite': {
                'name': waite[sid]['name'],
                'meaning_up': waite[sid]['meaning_up'],
                'meaning_rev': waite[sid]['meaning_rev'],
                'description': waite[sid]['description'],
            },
            'papus': {'meaning': papus[sid]['meaning']},
            'mcelroy': {
                'keywords': m['keywords'],
                'fortune_telling': m['fortune_telling'],
                'light': m['light'],
                'shadow': m['shadow'],
            },
        })

    outp = DATA / 'tarot_sources_v2.json'
    outp.write_text(json.dumps(merged, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'merged {len(merged)}/78 three-source records -> {outp}')
    if problems:
        print('PROBLEMS:')
        for p in problems:
            print('  -', p)
        raise SystemExit(1)
    print('no problems.')


if __name__ == '__main__':
    main()
