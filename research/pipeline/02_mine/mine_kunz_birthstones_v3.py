"""02_mine: Kunz《The Curious Lore of Precious Stones》(1913) v3（第二轮扩容）。

输入: classics/kunz_curious_lore_precious_stones_1913_raw.txt (Internet Archive OCR, 公版)
输出: data/kunz_birthstones_v3.json

v2 → v3 扩容（运行页眉定位，新增两整章段落库）:
  - religious_uses：Religious Uses of Precious Stones 章（≈430772–585465）
  - therapeutic_uses：On Therapeutic Uses of Stones 章至书尾（≈689018–773332）
  另含 v2 全部内容（sentiments 十二月表/水晶/行星感应章节库）。
  说明：两章内含大量图版说明文字（原书图注），按原貌保留在段落库中。

校验:
  1. 两章锚点存在且边界单调；段落库总量达标
  2. v2 全部校验保留
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CLASSICS = ROOT / 'classics'
DATA = ROOT / 'data'

HEADER_RES = [
    re.compile(r"(?m)^\s*\d{0,3}\s*(?:THE CURIOUS LORE OF PRECIOUS STONES|"
               r"CRYSTAL BALLS AND CRYSTAL GAZING|BIRTH-STONES|"
               r"PLANETARY AND ASTRAL INFLUENCES|SENTIMENTS OF THE MONTHS|"
               r"RELIGIOUS USES OF PRECIOUS STONES|ON THERAPEUTIC USES OF STONES)\s*\d{0,4}\s*$"),
    re.compile(r"(?m)^\s*\d{1,4}\s*$"),
]


def norm(s: str) -> str:
    return re.sub(r'\s+', ' ', s).strip()


def clean_block(s: str) -> str:
    for pat in HEADER_RES:
        s = pat.sub(' ', s)
    return s


def chapter_passages(text: str, start: int, end: int,
                     min_len: int = 150) -> list[str]:
    body = clean_block(text[start:end])
    out = []
    for p in re.split(r'\n\s*\n', body):
        p = norm(p)
        # OCR 问号连跑（图注/脚注损坏形态）
        p = re.sub(r'\?{2,}', '? ', p)
        if len(p) >= min_len and sum(c.isupper() for c in p) / max(len(p), 1) < 0.6:
            out.append(p)
    return out


def main() -> None:
    text = (CLASSICS / 'kunz_curious_lore_precious_stones_1913_raw.txt').read_text(encoding='utf-8')
    problems: list[str] = []

    rel_start = text.find('RELIGIOUS USES OF PRECIOUS STONES', 420000)
    rel_end = text.find('BIRTH-STONES', 500000)
    th_start = text.find('ON THERAPEUTIC USES OF STONES', 660000)
    for label, pos, lo, hi in (('religious 起点', rel_start, 420000, 450000),
                               ('religious 终点', rel_end, 560000, 600000),
                               ('therapeutic 起点', th_start, 680000, 700000)):
        if not (lo < pos < hi):
            problems.append(f'{label} 锚点异常: {pos}')

    religious = chapter_passages(text, rel_start, rel_end)
    therapeutic = chapter_passages(text, th_start, len(text))
    if len(religious) < 30 or sum(map(len, religious)) < 25000:
        problems.append(f'religious 段落库不足: {len(religious)} 段 {sum(map(len, religious))} 字符')
    if len(therapeutic) < 20 or sum(map(len, therapeutic)) < 20000:
        problems.append(f'therapeutic 段落库不足: {len(therapeutic)} 段 {sum(map(len, therapeutic))} 字符')

    outp_prev = DATA / 'kunz_birthstones_v2.json'
    v2 = json.loads(outp_prev.read_text(encoding='utf-8'))
    out = dict(v2)
    out.update({
        'version': 'v3',
        'generated': '2026-08-26',
        'source': dict(v2['source'], note='v3 扩容：新增 Religious Uses / Therapeutic Uses '
                       '两整章段落库（含原书图版图注，按原貌保留）'),
        'chapters': dict(v2['chapters'], **{
            'religious_uses': {
                'chapter_title': 'Religious Uses of Precious Stones (Ch VII)',
                'passages': religious,
            },
            'therapeutic_uses': {
                'chapter_title': 'On the Therapeutic Uses of Stones (Ch XI)',
                'passages': therapeutic,
            },
        }),
    })

    outp = DATA / 'kunz_birthstones_v3.json'
    outp.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f"kunz v3 mined: religious={len(religious)}P/{sum(map(len, religious))}ch "
          f"therapeutic={len(therapeutic)}P/{sum(map(len, therapeutic))}ch -> {outp}")
    if problems:
        print('PROBLEMS:')
        for p in problems:
            print('  -', p)
        raise SystemExit(1)


if __name__ == '__main__':
    main()
