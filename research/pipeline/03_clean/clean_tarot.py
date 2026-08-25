"""03_clean: 清洗 Waite 候选数据集。

清洗规则:
  1. site_id 必须能对上站点 78 张牌（读 src/data/tarot.ts 校验集合）
  2. meaning_up / meaning_rev 非空
  3. 文本规范化（已在 mine 阶段做，此处复查：无连续空格/换行）
  4. 大牌必须 22 张且含 0 号愚者；四花色各 14 张
  5. 去重（site_id 唯一）

输出: data/tarot_waite_v1.json
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / 'data'
SITE_TAROT = ROOT.parent / 'src' / 'data' / 'tarot.ts'


def site_ids_from_ts() -> set[str]:
    """从 src/data/tarot.ts 提取 78 张牌 id：大牌来自 M('id', ...) 字面量，
    小牌由 buildMinor 模板生成（suit × rank），此处按同样规则重建。"""
    src = SITE_TAROT.read_text(encoding='utf-8')
    majors = set(re.findall(r"M\('([a-z0-9-]+)',", src))
    suits = ['wands', 'cups', 'swords', 'pentacles']
    ranks = ['ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'page', 'knight', 'queen', 'king']
    minors = {f'{s}-{r}' for s in suits for r in ranks}
    return majors | minors


def main() -> None:
    cands = json.loads((DATA / 'waite_candidates_v1.json').read_text(encoding='utf-8'))
    site_ids = site_ids_from_ts()

    problems: list[str] = []
    seen: set[str] = set()
    clean = []

    for c in cands:
        sid = c['site_id']
        if sid not in site_ids:
            problems.append(f"{sid}: site_id 不在站点 78 牌集合中")
            continue
        if sid in seen:
            problems.append(f'{sid}: 重复')
            continue
        seen.add(sid)
        if not c['meaning_up'].strip():
            problems.append(f'{sid}: meaning_up 为空')
            continue
        if not c['meaning_rev'].strip():
            problems.append(f'{sid}: meaning_rev 为空')
            continue
        for f in ('meaning_up', 'meaning_rev', 'description'):
            if '  ' in c[f] or '\n' in c[f]:
                problems.append(f'{sid}: {f} 存在未规范化空白')
        clean.append(c)

    # 结构校验
    majors = [c for c in clean if c['arcana'] == 'major']
    if len(majors) != 22:
        problems.append(f'大牌数量 {len(majors)} != 22')
    if 'fool' not in {c['site_id'] for c in majors}:
        problems.append('缺少 0 号愚者')
    suits: dict[str, int] = {}
    for c in clean:
        if c['arcana'] == 'minor':
            suits[c['site_id'].split('-')[0]] = suits.get(c['site_id'].split('-')[0], 0) + 1
    for s, n in suits.items():
        if n != 14:
            problems.append(f'花色 {s} 数量 {n} != 14')

    outp = DATA / 'tarot_waite_v1.json'
    outp.write_text(json.dumps(clean, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'clean {len(clean)}/78 -> {outp}')
    if problems:
        print('PROBLEMS:')
        for p in problems:
            print('  -', p)
        raise SystemExit(1)
    print('no problems.')


if __name__ == '__main__':
    main()
