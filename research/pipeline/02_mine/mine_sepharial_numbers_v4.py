"""02_mine + 03_clean: Sepharial《The Kabala of Numbers》v4（补 INTRODUCTION）。

输入: classics/sepharial_kabala_of_numbers_raw.txt (Internet Archive OCR, 公版)
输出: data/sepharial_numbers_v4.json

v3 → v4 补漏:
  - introduction：书首 INTRODUCTION（数字科学的古代起源/对应论学说，
    ≈3 千字符）——v3 章界从 CHAPTER I 起跳，遗漏了它
  其余与 v3 一致（19 章段落库 + Ch I/XI 表格）。

校验: introduction 锚点与文本量达标；v3 校验全数保留。
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CLASSICS = ROOT / 'classics'
DATA = ROOT / 'data'


def main() -> None:
    text = (CLASSICS / 'sepharial_kabala_of_numbers_raw.txt').read_text(encoding='utf-8')
    problems: list[str] = []

    # 半书名页（'KABALA OF NUMBERS'）在目录之后、正文 INTRODUCTION 之前
    cont_start = text.find('CONTENTS', 0)
    k_half = text.find('KABALA OF NUMBERS', 500)
    intro_h = text.find('INTRODUCTION', k_half if k_half > 0 else 2000)
    ch1 = text.find('CHAPTER I', intro_h if intro_h > 0 else 4000)
    if not (0 <= cont_start < k_half < intro_h < ch1):
        problems.append(f'INTRODUCTION 锚点异常: cont={cont_start} half={k_half} '
                        f'intro={intro_h} ch1={ch1}')

    def norm(s):
        return re.sub(r'\s+', ' ', s).strip()

    intro_passages = []
    for p in re.split(r'\n\s*\n', text[intro_h:ch1]):
        p = norm(p)
        letters = [c for c in p if c.isalpha()]
        if len(p) >= 80 and letters \
                and sum(c.islower() for c in letters) / max(len(letters), 1) > 0.3:
            intro_passages.append(p)
    if sum(map(len, intro_passages)) < 2000:
        problems.append(f'introduction 过短: {sum(map(len, intro_passages))}')
    blob = norm(' '.join(intro_passages))
    for kw in ('God geometrises', 'Swedenborg'):
        if kw not in blob:
            problems.append(f'introduction 缺锚词 {kw!r}')

    outp_prev = DATA / 'sepharial_numbers_v3.json'
    v3 = json.loads(outp_prev.read_text(encoding='utf-8'))
    out = dict(v3)
    out.update({
        'version': 'v4',
        'generated': '2026-08-26',
        'source': dict(v3['source'], note='v4 补漏：新增书首 INTRODUCTION'
                       '（数字科学与对应论学说）；其余与 v3 一致'),
        'introduction': {'passages': intro_passages},
    })

    outp = DATA / 'sepharial_numbers_v4.json'
    outp.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f"sepharial v4 mined: intro={len(intro_passages)}P/{sum(map(len, intro_passages))}ch -> {outp}")
    if problems:
        print('PROBLEMS:')
        for p in problems:
            print('  -', p)
        raise SystemExit(1)


if __name__ == '__main__':
    main()
