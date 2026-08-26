"""02_mine: Lilly《Christian Astrology》(1647) 前部 v1（第三轮扩容）。

输入: classics/lilly_christian_astrology_1647_raw.txt (Internet Archive OCR, 公版)
输出: data/lilly_introduction_v1.json

lilly_signs_v2 / lilly_chapters_v1 之外的前部内容：
  A. preface：题献/致读者/序言（书首 ≈1500–79209；目录页行尾页码滤除）
  B. book1_chapters：Book I「An Introduction to Astrology」前十六章
     （行星本质/黄道一般论/宫位/方位等，≈79209–216380 星座描述章之前）
  17 世纪长音 s OCR 噪声按原貌保留。

校验:
  1. 两区段锚点与文本量达标
  2. B 区含行星章锚词（Saturn/Jupiter 本性描述）
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CLASSICS = ROOT / 'classics'
DATA = ROOT / 'data'

CH1_ANCHOR = 'Cuap. |.'
SIGNS_START = 'leafes'


def clean_passage(s: str) -> str:
    s = re.sub(r"(?m)^\s*\d{1,4}\s*$", ' ', s)
    s = re.sub(r"(?m)^[ \t]*\d{1,3}[ \t]+[A-Z][A-Z\s&\x27\.]{5,55}[ \t]*\d{0,3}[ \t]*$", ' ', s)
    s = re.sub(r"(?m)^[ \t]*[^a-z\n]{3,60}[ \t]*$", ' ', s)
    return re.sub(r'\s+', ' ', s).strip()


def region_paragraphs(seg: str, min_len: int = 120,
                      drop_toc_lines: bool = False) -> list[str]:
    out = []
    for p in re.split(r'\n\s*\n', seg):
        lines = [x.strip() for x in p.splitlines()]
        kept = [x for x in lines if x and not (
            len(x) <= 60 and sum(c.islower() for c in x) == 0)]
        if drop_toc_lines:
            # 目录点引行（'Of the Planets ....... 15'）
            kept = [x for x in kept if not re.search(r'\.{4,}\s*\d{1,3}\s*$', x)]
        para = clean_passage(' '.join(kept))
        if len(para) < min_len:
            continue
        letters = [c for c in para if c.isalpha()]
        if not letters or sum(c.islower() for c in letters) / max(len(letters), 1) < 0.25:
            continue
        if para.count('|') >= 3 or len(letters) / max(len(para), 1) < 0.55:
            continue
        out.append(para)
    return out


def main() -> None:
    text = (CLASSICS / 'lilly_christian_astrology_1647_raw.txt').read_text(encoding='utf-8')
    problems: list[str] = []

    ch1 = text.find(CH1_ANCHOR, 70000)
    signs_start = text.find(SIGNS_START, 200000)
    if not (70000 < ch1 < 95000):
        problems.append(f'Ch I 锚点异常: {ch1}')
    if not (210000 < signs_start < 225000):
        problems.append(f'星座章起点异常: {signs_start}')

    preface = region_paragraphs(text[1500:ch1], drop_toc_lines=True)
    chapters = region_paragraphs(text[ch1:signs_start])

    if sum(map(len, preface)) < 8000:
        problems.append(f'preface 过短: {sum(map(len, preface))}')
    if len(chapters) < 250 or sum(map(len, chapters)) < 80000:
        problems.append(f'book1_chapters 不足: {len(chapters)} 段 {sum(map(len, chapters))} 字符')
    blob = ' '.join(chapters)
    if 'Saturne' not in blob and 'Saturn' not in blob and 'SATURNE' not in blob:
        problems.append('book1 缺少行星章锚词')

    out = {
        'dataset': 'lilly_introduction',
        'version': 'v1',
        'generated': '2026-08-26',
        'source': {
            'work': 'William Lilly, Christian Astrology in Three Books',
            'year': 1647,
            'rights': 'public domain',
            'origin': 'Internet Archive OCR (ca-william-lilly)',
            'note': '17 世纪长音 s 被 OCR 转 f；preface=题献/致读者/序言（目录页行已滤除），'
                    'book1_chapters=Book I 前十六章（星座描述章之前）；'
                    '与 lilly_signs_v2.json、lilly_chapters_v1.json 互补',
        },
        'counts': {
            'preface_paragraphs': len(preface),
            'book1_chapter_paragraphs': len(chapters),
        },
        'regions': {
            'preface': {'paragraphs': preface},
            'book1_chapters': {'paragraphs': chapters},
        },
    }
    total = sum(map(len, preface)) + sum(map(len, chapters))
    outp = DATA / 'lilly_introduction_v1.json'
    outp.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'lilly intro mined: preface={len(preface)}P/{sum(map(len,preface))}ch '
          f'chapters={len(chapters)}P/{sum(map(len,chapters))}ch -> {outp}')
    if problems:
        print('PROBLEMS:')
        for p in problems:
            print('  -', p)
        raise SystemExit(1)


if __name__ == '__main__':
    main()
