"""02_mine: Kunz《The Curious Lore of Precious Stones》(1913) v5（Ch IX 全文补漏）。

输入: classics/kunz_curious_lore_precious_stones_1913_raw.txt (Internet Archive OCR, 公版)
输出: data/kunz_birthstones_v5.json

v4 → v5 补漏（覆盖率证明器发现 Ch IX 正文散文与三张表从未被挖掘）:
  - birth_stones_chapter：Ch IX「Birth-Stones」整章段落库
    （诞生石历史/约瑟夫斯引文/各传统源流论述，≈4.5 万字符）
  - hindu_month_gems：印度月份宝石列表段
  - us_state_stones：美国各州宝石产地表段
  - virtue_gem_lists：FAITH/HOPE/CHARITY 等美德宝石对应表段
  v4 全部内容保留。

校验: 各区块锚点命中（Josephus/Napoleon、Hindu、UNITED STATES、FAITH）。
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CLASSICS = ROOT / 'classics'
DATA = ROOT / 'data'

HEADER_NAMES = [
    'THE CURIOUS LORE OF PRECIOUS STONES',
    'BIRTH-STONES', 'PLANETARY AND ASTRAL INFLUENCES',
    'SENTIMENTS OF THE MONTHS',
]
HEADER_RES = [
    re.compile(r"(?m)^\s*\d{0,3}\s*(?:" + '|'.join(HEADER_NAMES) + r")\s*\d{0,4}\s*$"),
    re.compile(r"(?m)^\s*\d{1,4}\s*$"),
]


def norm(s: str) -> str:
    return re.sub(r'\s+', ' ', s).strip()


def passages(text: str, start: int, end: int, min_len: int = 100) -> list[str]:
    body = text[start:end]
    for pat in HEADER_RES:
        body = pat.sub(' ', body)
    out = []
    for p in re.split(r'\n\s*\n', body):
        p = norm(p)
        p = re.sub(r'\?{2,}', '? ', p)
        if len(p) >= min_len and sum(c.isupper() for c in p) / max(len(p), 1) < 0.7:
            out.append(p)
    return out


def main() -> None:
    text = (CLASSICS / 'kunz_curious_lore_precious_stones_1913_raw.txt').read_text(encoding='utf-8')
    problems: list[str] = []

    # Ch IX 正文区间（sentiments 表起点之前的部分 + 表后至章尾）
    ch9_start = text.find('BIRTH-STONES', 100000)
    sent_start = text.find('SENTIMENTS OF THE MONTHS')
    pl_end_anchor = text.find('ON THERAPEUTIC USES OF STONES', 660000)
    assert 0 < ch9_start < sent_start < pl_end_anchor, 'Ch IX 边界缺失'

    prose_a = passages(text, ch9_start, sent_start)
    prose_b = passages(text, text.find('A HINDU LIST OF GEMS', sent_start), pl_end_anchor)

    birth_stones = {'passages': prose_a + prose_b}
    if sum(map(len, birth_stones['passages'])) < 35000:
        problems.append(f'Ch IX 正文不足: {sum(map(len, birth_stones["passages"]))}')
    blob = ' '.join(birth_stones['passages'])
    for kw in ('Josephus', 'Napoleon'):
        if kw not in blob:
            problems.append(f'Ch IX 缺锚词 {kw!r}')

    # 三张特色表（原文段落原样保留）
    # 三张特色表：参考清单，原样整段收录（不做大小写/长度过滤）
    def raw_passage(a: int, b: int) -> str:
        body = text[a:b]
        for pat in HEADER_RES:
            body = pat.sub(' ', body)
        body = re.sub(r"(?m)^\s*\d{1,3}\s+CURIOUS LORE OF PRECIOUS STONES\s*\d{0,4}\s*$",
                      ' ', body)
        return norm(body).strip()

    hindu_start = text.find('A HINDU LIST OF GEMS', sent_start)
    tagore_end = text.find('Surindro Mohun Tagore', hindu_start) + 200
    hindu = [raw_passage(hindu_start, tagore_end)]
    us_pos = text.find('UNITED STATES STONES', 660000)
    us = [raw_passage(us_pos, us_pos + 3400)]
    virtue_pos = text.find('FAITH', 673000)
    virtue = [raw_passage(virtue_pos - 100, virtue_pos + 2600)]
    if sum(map(len, hindu)) < 300:
        problems.append('hindu 列表过短')
    if sum(map(len, us)) < 800 or 'California' not in ' '.join(us):
        problems.append('US states 表过短')
    if sum(map(len, virtue)) < 400 or 'CHARITY' not in ' '.join(virtue):
        problems.append('virtue 表过短')

    outp_prev = DATA / 'kunz_birthstones_v4.json'
    v4 = json.loads(outp_prev.read_text(encoding='utf-8'))
    out = dict(v4)
    out.update({
        'version': 'v5',
        'generated': '2026-08-26',
        'source': dict(v4['source'], note='v5 补漏：新增 Ch IX 整章正文段落库'
                       '（诞生石史/约瑟夫斯引文）、印度月宝石表、美国各州宝石表、美德宝石对应表'),
        'chapters': dict(v4['chapters'], **{
            'birth_stones_chapter_prose': {
                'chapter_title': 'Birth-Stones (Ch IX) full prose',
                'passages': birth_stones['passages'],
            },
            'tables': {
                'hindu_month_gems': hindu,
                'us_state_stones': us,
                'virtue_gem_lists': virtue,
            },
        }),
    })

    outp = DATA / 'kunz_birthstones_v5.json'
    outp.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f"kunz v5 mined: ch9={len(birth_stones['passages'])}P "
          f"hindu={len(hindu)} us={len(us)} virtue={len(virtue)} -> {outp}")
    if problems:
        print('PROBLEMS:')
        for p in problems:
            print('  -', p)
        raise SystemExit(1)


if __name__ == '__main__':
    main()
