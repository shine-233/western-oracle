"""02_mine: Robson《The Fixed Stars and Constellations in Astrology》1923
卷首天文学导论 v1（第四轮补漏）。

输入: classics/robson_fixed_stars_1923_raw.txt (Internet Archive OCR, 公版)
输出: data/robson_front_matter_v1.json

卷首 Ch I「The Fixed Stars」天文学导论（恒星距离/银河结构/星云/
星等与命名法/希腊字母表，≈12000–21194）——其余章节已由
fixed_stars_robson_v2 / robson_constellations_v1 / robson_medieval_magic_v1 收录。

校验: 段落量达标且含 Milky Way / Nebulae 锚词。
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CLASSICS = ROOT / 'classics'
DATA = ROOT / 'data'


def norm(s: str) -> str:
    s = re.sub(r"(?m)^[ \t]*\d{0,3}[ \t]*[A-Z][A-Z&\x27\s\d]{5,70}[ \t]*$", ' ', s)
    s = re.sub(r"(?m)^\s*\d{1,3}\s*$", ' ', s)
    return re.sub(r'\s+', ' ', s).strip()


def passages(seg: str, min_len: int = 100) -> list[str]:
    out = []
    for p in re.split(r'\n\s*\n', seg):
        p = norm(p)
        letters = [c for c in p if c.isalpha()]
        if len(p) >= min_len and letters \
                and sum(c.islower() for c in letters) / max(len(letters), 1) > 0.25:
            out.append(p)
    return out


def main() -> None:
    text = (CLASSICS / 'robson_fixed_stars_1923_raw.txt').read_text(encoding='utf-8')
    problems: list[str] = []

    start = text.find('THE FIXED STARS IN ASTRONOMY', 3000)
    ch2 = text.find('CHAPTER II', start if start > 0 else 15000)
    assert 3000 < start < ch2 < 25000, f'卷首边界异常 ({start}, {ch2})'

    intro = passages(text[start:ch2])
    blob = ' '.join(intro).lower()
    if sum(map(len, intro)) < 5000:
        problems.append(f'intro 过短: {sum(map(len, intro))}')
    for kw in ('milky way', 'nebul'):
        if kw not in blob:
            problems.append(f'intro 缺锚词 {kw!r}')

    out = {
        'dataset': 'robson_front_matter',
        'version': 'v1',
        'generated': '2026-08-26',
        'source': {
            'work': "Vivian E. Robson, The Fixed Stars and Constellations in Astrology",
            'year': 1923,
            'publisher': 'Cecil Palmer, London',
            'rights': 'public domain',
            'origin': 'Internet Archive OCR (in.ernet.dli.2015.128091)',
            'note': 'Ch I 天文学导论（恒星距离/银河/星云/星等命名/希腊字母表）；'
                    'Ch II 起见 fixed_stars_robson_v2 / robson_constellations_v1 / '
                    'robson_medieval_magic_v1',
        },
        'counts': {'intro_passages': len(intro)},
        'introduction': {'passages': intro},
    }
    outp = DATA / 'robson_front_matter_v1.json'
    outp.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'robson front matter mined: {len(intro)}P/{sum(map(len, intro))}ch -> {outp}')
    if problems:
        print('PROBLEMS:')
        for p in problems:
            print('  -', p)
        raise SystemExit(1)


if __name__ == '__main__':
    main()
