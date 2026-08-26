"""02_mine: Alan Leo《How to Judge a Nativity》(1928 ed.) 卷首内容 v1（第五轮补漏）。

输入: classics/leo_how_to_judge_nativity_1928_raw.txt (Internet Archive OCR, 公版)
输出: data/leo_front_matter_v1.json

书首区（≈1000–35495，此前误判为扫描噪声，实为全书前置内容）:
  A. prefaces：第一版序言 + 第三版序言（含「The History of Astrology」
     占星史专论，从埃及/迦勒底到 Kepler/Lilly 的 astrologer 名录）
  B. detailed_contents：全书详细目录（含各章节与小节标题）
  C. signs_reference_tables：黄道星座参照表——北方/南方对照、要素/性质/
     极性标注、四重三重序（Intellectual/Maternal/Reproductive/Serving）、
     十二星座所辖身体部位表（结构化，锚点断言）
  D. introduction：INTRODUCTION 哲学导论（≈8 千字符）

校验: 各节锚点存在；signs 表 12/12 身体部位齐全；文本量达标。
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CLASSICS = ROOT / 'classics'
DATA = ROOT / 'data'

BODY_PARTS = {
    'Aries': 'Head', 'Taurus': 'Neck and Throat', 'Gemini': 'Arms and Lungs',
    'Cancer': 'Stomach', 'Leo': 'Heart', 'Virgo': 'Bowels',
    'Libra': 'Loins and Kidneys', 'Scorpio': 'Generative System',
    'Sagittarius': 'Thighs', 'Capricorn': 'Knees',
    'Aquarius': 'Legs and Ankles', 'Pisces': 'Feet',
}
TRINITIES = {
    'intellectual': ['Aries', 'Taurus', 'Gemini'],
    'maternal': ['Cancer', 'Leo', 'Virgo'],
    'reproductive': ['Libra', 'Scorpio', 'Sagittarius'],
    'serving': ['Capricorn', 'Aquarius', 'Pisces'],
}


def norm(s: str) -> str:
    s = re.sub(r"(?m)^[ \t]*\d{1,4}[ \t]*$", ' ', s)
    return re.sub(r'[ \t]+', ' ', s)


def passages(seg: str, min_len: int = 120, strip_toc_pages: bool = False) -> list[str]:
    out = []
    for p in re.split(r'\n\s*\n', seg):
        lines = [x.strip() for x in p.splitlines() if x.strip()]
        kept = [x for x in lines
                if not (len(x) <= 40 and sum(c.islower() for c in x) <= 1)]
        if strip_toc_pages:
            # 目录条目的页码（行首或行中独立数字 token）
            kept = [re.sub(r'\b\d{1,3}\b', '', x) for x in kept]
        para = norm(' '.join(kept)).strip()
        letters = [c for c in para if c.isalpha()]
        if len(para) >= min_len and letters \
                and sum(c.islower() for c in letters) / max(len(letters), 1) > 0.3:
            out.append(para)
    return out


def main() -> None:
    text = (CLASSICS / 'leo_how_to_judge_nativity_1928_raw.txt').read_text(encoding='utf-8')
    problems: list[str] = []

    pre1 = text.find('PREFACE', 500)
    pre3 = text.find('PREFACE TO THE THIRD EDITION', pre1)
    hist = text.find('THE HISTORY OF ASTROLOGY', pre3)
    toc = text.find('DETAILED TABLE OF CONTENTS', hist)
    tbl = text.find('THE SIGNS OF THE ZODIAC', toc)
    intro = re.search(r'INTRODUCTION\s+A\s*LITTLE', text[tbl + 20:40000])
    intro = tbl + 20 + intro.start() if intro else -1
    chap1 = text.find('THE TWELVE HOUSES OF THE HOROSCOPE', 34000)
    for label, pos in (('preface1', pre1), ('preface3', pre3), ('history', hist),
                       ('toc', toc), ('signs_table', tbl), ('introduction', intro),
                       ('chap1', chap1)):
        if pos <= 0:
            problems.append(f'{label} 锚点缺失')
    if not (500 < pre1 < pre3 < hist < toc < tbl < intro < chap1):
        problems.append(f'卷首锚点顺序异常: {pre1},{pre3},{hist},{toc},{tbl},{intro},{chap1}')

    # ---- A. 两篇序言（第三版序言内嵌历史专论）----
    prefaces = {
        'first_edition': {'passages': passages(text[pre1:pre3])},
        'third_edition_with_history': {'passages': passages(text[pre3:toc])},
    }
    if sum(map(len, prefaces['first_edition']['passages'])) < 2000:
        problems.append('第一版序言过短')
    if sum(map(len, prefaces['third_edition_with_history']['passages'])) < 9000:
        problems.append('第三版序言/历史专论过短')
    hist_blob = ' '.join(prefaces['third_edition_with_history']['passages']).lower()
    for kw in ('chaldea', 'kepler', 'lilly'):
        if kw not in hist_blob:
            problems.append(f'历史专论缺锚词 {kw!r}')

    # ---- B. 详细目录 ----
    toc_passages = passages(text[toc:tbl], min_len=80, strip_toc_pages=True)
    if sum(map(len, toc_passages)) < 6000:
        problems.append(f'目录过短: {sum(map(len, toc_passages))}')

    # ---- C. 星座参照表（结构化）----
    tbl_seg = text[tbl:intro]
    body_parts_out = {}
    for sign, part in BODY_PARTS.items():
        pat = sign + r'[^\n]{0,40}' + part.replace(' AND ', r'\s+and\s+').replace(' AND LUNGS', r'\s*and\s*Lungs')
        if re.search(pat, tbl_seg, re.IGNORECASE):
            body_parts_out[sign] = part
        else:
            problems.append(f'身体部位表缺 {sign}')
    trinities_ok = all(
        all(s.lower() in tbl_seg.lower() for s in signs)
        for signs in TRINITIES.values()
    )
    if not trinities_ok:
        problems.append('三重序标注未命中')

    # ---- D. 导论 ----
    introduction = passages(text[intro:chap1])
    if sum(map(len, introduction)) < 6000:
        problems.append(f'introduction 过短: {sum(map(len, introduction))}')

    total = sum(sum(map(len, s['passages'])) for s in prefaces.values()) \
        + sum(map(len, toc_passages)) + sum(map(len, introduction))
    out = {
        'dataset': 'leo_front_matter',
        'version': 'v1',
        'generated': '2026-08-26',
        'source': {
            'work': 'Alan Leo, How to Judge a Nativity (1928 edition)',
            'author_dates': 'Alan Leo (1860-1917)',
            'rights': 'public domain',
            'origin': 'Internet Archive OCR (howtojudgenativi00leoa)',
            'note': '书首前置内容：两版序言（含占星史专论）/详细目录/星座参照表/哲学导论；'
                    '与 leo_nativity_v2–v5 正文数据集互补',
        },
        'prefaces': prefaces,
        'detailed_contents': {'passages': toc_passages},
        'signs_reference_tables': {
            'body_parts_ruled': body_parts_out,
            'trinities': TRINITIES,
        },
        'introduction': {'passages': introduction},
    }
    outp = DATA / 'leo_front_matter_v1.json'
    outp.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f"leo front matter mined: pre1={len(prefaces['first_edition']['passages'])}P "
          f"pre3+hist={len(prefaces['third_edition_with_history']['passages'])}P "
          f"toc={len(toc_passages)}P intro={len(introduction)}P "
          f"body_parts={len(body_parts_out)}/12 total={total}ch -> {outp}")
    if problems:
        print('PROBLEMS:')
        for p in problems:
            print('  -', p)
        raise SystemExit(1)


if __name__ == '__main__':
    main()
