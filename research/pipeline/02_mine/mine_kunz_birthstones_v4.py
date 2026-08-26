"""02_mine: Kunz《The Curious Lore of Precious Stones》(1913) v4（第三轮扩容）。

输入: classics/kunz_curious_lore_precious_stones_1913_raw.txt (Internet Archive OCR, 公版)
输出: data/kunz_birthstones_v4.json

v3 → v4 扩容（书的前半部分，运行页眉定位，五整章段落库）:
  - superstitions：Superstitions and Their Sources（≈19553–53851）
  - talismans_amulets：Talismans and Amulets（≈53851–111247）
  - talismanic_use：Talismanic Use of Precious Stones（≈111247–226387）
  - engraved_carved_gems：Engraved and Carved Gems（≈226387–273956）
  - ominous_luminous_stones：Ominous and Luminous Stones（≈273956–333611）
  v3 全部内容保留。至此除书首题页/版权页外全书覆盖。

校验: 五章锚点存在且边界单调；各章段落量达标。
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CLASSICS = ROOT / 'classics'
DATA = ROOT / 'data'

CHAPTERS = [
    ('superstitions', 'SUPERSTITIONS AND THEIR SOURCES'),
    ('talismans_amulets', 'TALISMANS AND AMULETS'),
    ('talismanic_use', 'TALISMANIC USE OF PRECIOUS STONES'),
    ('engraved_carved_gems', 'ENGRAVED AND CARVED GEMS'),
    ('ominous_luminous_stones', 'OMINOUS AND LUMINOUS STONES'),
]

HEADER_NAMES = [
    'THE CURIOUS LORE OF PRECIOUS STONES',
    'SUPERSTITIONS AND THEIR SOURCES',
    'TALISMANS AND AMULETS',
    'TALISMANIC USE OF PRECIOUS STONES',
    'ENGRAVED AND CARVED GEMS',
    'OMINOUS AND LUMINOUS STONES',
    'CRYSTAL BALLS AND CRYSTAL GAZING',
    'BIRTH-STONES',
    'PLANETARY AND ASTRAL INFLUENCES',
    'SENTIMENTS OF THE MONTHS',
    'RELIGIOUS USES OF PRECIOUS STONES',
    'ON THERAPEUTIC USES OF STONES',
]
HEADER_RES = [
    re.compile(r"(?m)^\s*\d{0,3}\s*(?:" + '|'.join(HEADER_NAMES) + r")\s*\d{0,4}\s*$"),
    re.compile(r"(?m)^\s*\d{1,4}\s*$"),
]


def norm(s: str) -> str:
    return re.sub(r'\s+', ' ', s).strip()


def chapter_passages(text: str, start: int, end: int,
                     min_len: int = 150) -> list[str]:
    body = text[start:end]
    for pat in HEADER_RES:
        body = pat.sub(' ', body)
    out = []
    for p in re.split(r'\n\s*\n', body):
        p = norm(p)
        p = re.sub(r'\?{2,}', '? ', p)
        # 图版铭文残片（全大写拉丁串后接正文小写处，如 '5 EIVSDEM PICTO'）
        p = re.sub(r"\b\d{1,2}\s+[A-Z]{3,}(?:\s+[A-Z]{2,}){0,6}\b(?=\s+[A-Z][a-z])", ' ', p)
        p = re.sub(r"\b[A-Z]{3,}(?:\s+[A-Z]{2,}){1,6}\b(?=\s+[a-z])", ' ', p)
        if len(p) >= min_len and sum(c.isupper() for c in p) / max(len(p), 1) < 0.6:
            out.append(p)
    return out


def main() -> None:
    text = (CLASSICS / 'kunz_curious_lore_precious_stones_1913_raw.txt').read_text(encoding='utf-8')
    problems: list[str] = []

    crystal_start = text.find('CRYSTAL BALLS AND CRYSTAL GAZING')
    positions: list[tuple[str, int]] = []
    for key, anchor in CHAPTERS:
        p = text.find(anchor, 15000)
        if not (15000 < p < crystal_start):
            problems.append(f'{key} 锚点异常: {p}')
            continue
        positions.append((key, p))
    positions.sort(key=lambda x: x[1])

    new_chapters: dict[str, dict] = {}
    for i, (key, pos) in enumerate(positions):
        nxt = positions[i + 1][1] if i + 1 < len(positions) else crystal_start
        pas = chapter_passages(text, pos, nxt)
        total = sum(map(len, pas))
        min_expect = {'superstitions': 20000, 'talismans_amulets': 30000,
                      'talismanic_use': 60000, 'engraved_carved_gems': 25000,
                      'ominous_luminous_stones': 30000}[key]
        if total < min_expect or len(pas) < 25:
            problems.append(f'{key} 段落不足: {len(pas)} 段 {total} 字符 (<{min_expect})')
        title = dict(CHAPTERS)[key].title().replace('And', 'and').replace('Of', 'of')
        new_chapters[key] = {'chapter_title': title, 'passages': pas}

    outp_prev = DATA / 'kunz_birthstones_v3.json'
    v3 = json.loads(outp_prev.read_text(encoding='utf-8'))
    out = dict(v3)
    out.update({
        'version': 'v4',
        'generated': '2026-08-26',
        'source': dict(v3['source'], note='v4 扩容：新增前半部五章（迷信源流/护符护身符/'
                       '护符使用/雕琢宝石/凶吉宝石），至此除题页外全书覆盖'),
        'chapters': {**new_chapters, **v3['chapters']},
    })

    outp = DATA / 'kunz_birthstones_v4.json'
    outp.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    total_new = sum(sum(map(len, c['passages'])) for c in new_chapters.values())
    print(f"kunz v4 mined: +{len(new_chapters)} chapters, new={total_new}ch -> {outp}")
    if problems:
        print('PROBLEMS:')
        for p in problems:
            print('  -', p)
        raise SystemExit(1)


if __name__ == '__main__':
    main()
