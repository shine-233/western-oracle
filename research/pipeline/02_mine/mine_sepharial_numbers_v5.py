"""02_mine + 03_clean: Sepharial《The Kabala of Numbers》v5（短编号条目表）。

输入: classics/sepharial_kabala_of_numbers_raw.txt (Internet Archive OCR, 公版)
输出: data/sepharial_numbers_v5.json

v4 → v5 补漏：v4 的章节段落库把短编号行压平丢失了。本版回原始文本
逐章提取 'N. xxx' 短编号条目：
  - Ch XII 失物方位清单（1-28+ 条）
  - Ch IV 毕达哥拉斯数值含义表（1-40）
  - Ch V 数字 1-10 含义图
  - Ch VI Francis Bacon 卡巴拉演算等
其余与 v4 一致。

校验: 失物清单 >= 15 且含锚词；毕氏表 >= 30；数字含义图 >= 9。
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CLASSICS = ROOT / 'classics'
DATA = ROOT / 'data'

CHAPTERS = [
    ('I', r'THE\s+POWER\s+OF\s+(NIMBERS|NUMBERS)'),
    ('II', r'GEOMETRICAL\s+RELATIONS\s+OF\s+THOUGHT'),
    ('III', r'NUMEROLOGY'),
    ('IV', r'VARIOUS\s+METHODS\s+OF\s+KABALISM'),
    ('V', r'NUMBER,\s*FORM,\s*(CLOUR|COLOUR|COLOR),\s*SOUND'),
    ('VI', r'NAMES,\s*NUMBERS,\s*AND\s+INCIDENTS'),
    ('VII', r'CHANCE\s+EVENTS'),
    ('VIII', r'REDUCTION\s+TO\s+LAW'),
    ('IX', r'NUMBER\s+AND\s+AUTOMATISM'),
    ('X', r'THOUGHT-READING\s+BY\s+NUMBERS'),
    ('XI', r'THE\s+SIGNIFICANCE\s+OF\s+NUMBERS'),
    ('XII', r'OF\s+THINGS\s+LOST'),
    ('XIII', r'THE\s+KABALISM\s+OF\s+CYCLES'),
    ('XIV', r'SUCCESS\s+AND\s+FAILURE'),
    ('XV', r'THE\s+LAW\s+OF\s+VALUES'),
    ('XVI', r"BRUNO['’]?\s?S\s+SYMBOLISM"),
    ('XVII', r'COSMIC\s+ANALOGIES'),
    ('XVIII', r'SOME\s+RECON[DC][I1]?TE\s+PROBLEMS'),
    ('XIX', r'GOD\s+GEOMETRISES'),
]


def main() -> None:
    text = (CLASSICS / 'sepharial_kabala_of_numbers_raw.txt').read_text(encoding='utf-8')
    problems: list[str] = []

    # 章界：CHAPTER 行 + 标题双重锚定
    marks = []
    for roman, pat in CHAPTERS:
        for mm in re.finditer(rf"(?m)^\s*CHAPTER\s+{roman}\s*$", text):
            if re.search(pat, text[mm.end():mm.end() + 150], re.IGNORECASE):
                marks.append((mm.start(), roman))
                break
        else:
            problems.append(f'CH{roman} 锚点缺失')
    marks.sort()

    def norm(s):
        return re.sub(r'\s+', ' ', s).strip()

    item_re = re.compile(r"^\s*(\d{1,2}(?:\s+\d{1,2})?)\s*\.\s+(\S[^\n]{12,})$", re.M)
    items_out: dict[str, list] = {}
    for i, (pos, roman) in enumerate(marks):
        end = marks[i + 1][0] if i + 1 < len(marks) else len(text)
        by_num: dict[int, str] = {}
        for m in item_re.finditer(text[pos:end]):
            n = int(re.sub(r'\s+', '', m.group(1)))
            if not (1 <= n <= 60):
                continue
            txt = norm(m.group(2))
            if len(txt) < 12:
                continue
            if n not in by_num or len(txt) > len(by_num[n]):
                by_num[n] = txt
        items = [{'no': k, 'text': v} for k, v in sorted(by_num.items())]
        if len(items) >= 5:
            items_out[roman.lower()] = items

    lost = items_out.get('xii', [])
    pyth = items_out.get('iii', [])      # 毕氏数值表在 Ch III（数字学章）
    chart = items_out.get('iv', [])      # 数字 1-10 含义图在 Ch IV
    if len(lost) < 15:
        problems.append(f'失物清单仅 {len(lost)} (<15)')
    if pyth:
        iii_blob = ' '.join(i['text'] for i in pyth)
        if 'Death, fatality' not in iii_blob:
            problems.append('毕氏表缺锚词')
    if len(pyth) < 30:
        problems.append(f'毕氏数值表仅 {len(pyth)} (<30)')
    if len(chart) < 9 or 'individuality' not in ' '.join(i['text'] for i in chart[:3]):
        problems.append(f'Ch IV 数字含义图不足: {len(chart)}')

    outp_prev = DATA / 'sepharial_numbers_v4.json'
    v4 = json.loads(outp_prev.read_text(encoding='utf-8'))
    out = dict(v4)
    out.update({
        'version': 'v5',
        'generated': '2026-08-26',
        'source': dict(v4['source'], note='v5 补漏：新增各章短编号条目表'
                       '（Ch XII 失物方位/Ch IV 毕达哥拉斯数值/Ch V 数字含义等），'
                       '自原文行级提取'),
        'numbered_items': items_out,
    })

    outp = DATA / 'sepharial_numbers_v5.json'
    outp.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f"sepharial v5 mined: chapters_with_items={len(items_out)} "
          f"lost={len(lost)} pyth={len(pyth)} chart={len(chart)} -> {outp}")
    if problems:
        print('PROBLEMS:')
        for p in problems:
            print('  -', p)
        raise SystemExit(1)


if __name__ == '__main__':
    main()
