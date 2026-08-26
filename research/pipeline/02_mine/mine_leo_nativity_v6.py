"""02_mine: Alan Leo《How to Judge a Nativity》(1928 ed.) v6（Ch II 开头补漏）。

输入: classics/leo_how_to_judge_nativity_1928_raw.txt (Internet Archive OCR, 公版)
输出: data/leo_nativity_v6.json

v5 → v6 补漏（覆盖率证明器发现）:
  ch2_signs_nature：Ch II「The Twelve Signs of the Zodiac」开头
  （黄道定义/地球公转与十二宫的对应论述，≈1.4 万字符，位于
  十二宫总论章结束与四元素星座深义小节之间），此前从未被挖掘。
  其余内容与 v5 一致。

校验: 锚点命中且长度达标。
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CLASSICS = ROOT / 'classics'
DATA = ROOT / 'data'


def main() -> None:
    text = (CLASSICS / 'leo_how_to_judge_nativity_1928_raw.txt').read_text(encoding='utf-8')
    problems: list[str] = []

    # v5 的 twelve_houses 段终点锚点即 Ch II 起点
    ch2_start = text.find('proceed to consider the twelve', 35000) - len(
        'we may ') - 60
    fiery = text.find('THE FIERY SIGNS', 60000)
    # 直接用可靠锚点：zodiac 定义句起点回退
    z = text.find('now proceed to consider the twelve signs of the zodiac', 50000)
    if z > 0:
        ch2_start = max(0, z - 120)
    assert 0 < ch2_start < fiery < 80000, f'Ch II 边界异常 ({ch2_start}, {fiery})'

    def norm(s):
        s = re.sub(r"(?m)^[ \t]*[a-z\x27\.]{0,4}[ \t]*\d{0,3}[ \t]*HOW[ \t]+TO[ \t]+JUDGE"
                   r"[a-zA-Z\s&\x27\(\)\x18\d\.]{0,32}[ \t]*$", ' ', s)
        s = re.sub(r"(?m)^[ \t]*\d{0,3}[ \t]*[A-Z(][A-Z\s&\x27\d\.(]{5,70}[ \t]*$", ' ', s)
        s = re.sub(r"(?m)^[ \t]*\d{1,4}[ \t]*$", ' ', s)
        s = re.sub(r"\b\d{1,3}\s+HOW TO JUDGE(?:\s+A?\s*\(?\s*NATIVITY)?\b[\d\s\.]{0,4}", ' ', s)
        return re.sub(r'[ \t]+', ' ', s)

    seg = norm(text[ch2_start:fiery]).strip()
    if len(seg) < 12000:
        problems.append(f'ch2 段过短: {len(seg)}')
    for kw in ('group of animals', 'Twelve Signs of the Zodiac'):
        if kw.lower() not in seg.lower():
            problems.append(f'ch2 缺锚词 {kw!r}')

    outp_prev = DATA / 'leo_nativity_v5.json'
    v5 = json.loads(outp_prev.read_text(encoding='utf-8'))
    out = dict(v5)
    out.update({
        'version': 'v6',
        'generated': '2026-08-26',
        'source': dict(v5['source'], note='v6 补漏：新增 Ch II 黄道十二星座开篇论述'
                       '（黄道定义/地球公转对应），此前被 v1 终点锚点截断'),
        'expansions': dict(v5['expansions'], **{
            'ch2_zodiac_signs_opening': {'passage': seg},
        }),
    })

    outp = DATA / 'leo_nativity_v6.json'
    outp.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'leo v6 mined: ch2={len(seg)}ch -> {outp}')
    if problems:
        print('PROBLEMS:')
        for p in problems:
            print('  -', p)
        raise SystemExit(1)


if __name__ == '__main__':
    main()
