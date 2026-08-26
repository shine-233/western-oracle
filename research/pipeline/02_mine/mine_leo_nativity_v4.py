"""02_mine: Alan Leo《How to Judge a Nativity》(1928 ed.) v4（第三轮扩容）。

输入: classics/leo_how_to_judge_nativity_1928_raw.txt (Internet Archive OCR, 公版)
输出: data/leo_nativity_v4.json

v3 → v4 扩容（覆盖率审计发现的外观/上升区块）:
  A. appearance_rules：上升星座所示外貌 + 描绘外貌的规则两节
  B. rising_sign：THE RISING SIGN 章（至行星升起十二座前）
  C. ch7_ruling_planet：CHAPTER VII「The Ruling Planet」章头
     （至太阳相位小节；v3 的 solar_aspects 为其小节）
  D. ch8_health_apheta：CHAPTER VIII「Health / Length of Life」章头
     （至 Apheta 小节；v3 的 apheta_and_anareta 为其小节）
  v3 全部内容保留。

校验: 四区块锚点命中且长度达标。
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CLASSICS = ROOT / 'classics'
DATA = ROOT / 'data'


def norm(s: str) -> str:
    import re
    s = re.sub(
        r"(?m)^[ \t]*[a-z\x27\.]{0,4}[ \t]*\d{0,3}[ \t]*HOW[ \t]+TO[ \t]+JUDGE"
        r"[a-zA-Z\s&\x27\(\)\x18\d\.]{0,32}[ \t]*$", ' ', s)
    s = re.sub(r"(?m)^[ \t]*\d{0,3}[ \t]*[A-Z(][A-Z\s&\x27\d\.(]{5,70}[ \t]*$", ' ', s)
    s = re.sub(r"(?m)^[ \t]*\d{1,4}[ \t]*$", ' ', s)
    s = re.sub(r"(?<=[a-z,;.])\s+\d{1,3}\s+[A-Z][A-Z&\x27\s]{5,55}(?=\s+[a-z])", ' ', s)
    s = re.sub(r"\b\d{1,3}\s+HOW TO JUDGE(?:\s+A?\s*\(?\s*NATIVITY)?\b[\d\s\.]{0,4}", ' ', s)
    s = re.sub(r"\bHOW TO JUDGE(?:\s+A)?\s+NATIVITY\b[\d\s\.]{0,4}", ' ', s)
    return re.sub(r'[ \t]+', ' ', s)


def main() -> None:
    import re
    text = (CLASSICS / 'leo_how_to_judge_nativity_1928_raw.txt').read_text(encoding='utf-8')
    problems: list[str] = []

    def find1(kw: str, lo: int) -> int:
        p = text.find(kw, lo)
        if p < 0:
            problems.append(f'锚点缺失: {kw!r} @{lo}')
        return p

    app_a = find1('APPEARANCE AS DENOTED', 220000)
    ris = find1('THE RISING SIGN', app_a if app_a > 0 else 240000)
    pr = find1('PLANETS RISING', 290000)
    ch7 = find1('CHAPTER VII', 340000)
    solar = find1('INFLUENCE OF SOLAR ASPECTS', 350000)
    ch8 = find1('CHAPTER VIII', 365000)
    aph = find1('APHETA AND ANARETA', 380000)

    blocks = {}
    specs = [
        ('appearance_rules', text[app_a:ris], 8000),
        ('rising_sign', text[ris:pr], 30000),
        ('ch7_ruling_planet', text[ch7:solar], 3000),
        ('ch8_health_length_of_life', text[ch8:aph], 10000),
    ]
    for key, raw_seg, min_len in specs:
        seg = norm(raw_seg).strip()
        if len(seg) < min_len:
            problems.append(f'{key} 过短: {len(seg)} < {min_len}')
        blocks[key] = {'passage': seg}

    outp_prev = DATA / 'leo_nativity_v3.json'
    v3 = json.loads(outp_prev.read_text(encoding='utf-8'))
    out = dict(v3)
    out.update({
        'version': 'v4',
        'generated': '2026-08-26',
        'source': dict(v3['source'], note='v4 扩容：新增外貌规则/上升星座/'
                       'Ch VII 守护星/Ch VIII 健康·寿限章头'),
        'expansions': dict(v3['expansions'], **blocks),
    })

    outp = DATA / 'leo_nativity_v4.json'
    outp.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    total_new = sum(len(b['passage']) for b in blocks.values())
    print(f'leo v4 mined: +{len(blocks)} blocks, new={total_new}ch -> {outp}')
    if problems:
        print('PROBLEMS:')
        for p in problems:
            print('  -', p)
        raise SystemExit(1)


if __name__ == '__main__':
    main()
