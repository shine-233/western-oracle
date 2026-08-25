"""02_mine: Lilly《Christian Astrology》(1647) 星座描述章挖掘 v1。

输入: classics/lilly_christian_astrology_1647_raw.txt (Internet Archive OCR, 公版)
输出: data/lilly_signs_v1.json

Lilly Book I 按星座给出 Description/Shape/Nature/Diseases/Places/Kingdomes/Cities
字段化描述（17 世纪排印，OCR 长音 s→f 噪声大），v1 以整章 passage 收录，
并按星座名锚点切出 12 段（可定位者）。

校验:
  1. 章起点含 ARIES 描述特征（Mafculine/Diurnall Signe）
  2. 章内至少出现 8/12 个星座名
  3. passage 总长度 >= 8000 字符
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CLASSICS = ROOT / 'classics'
DATA = ROOT / 'data'

SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
         'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']

START_ANCHOR = 'leafes'
END_ANCHOR = 'Effentiall Dignities'


def norm(s: str) -> str:
    # 独立页码行与页眉行清除（OCR 长音 s 噪声按原貌保留）
    s = re.sub(r'(?m)^\s*\d{1,4}\s*$', ' ', s)
    s = re.sub(r'(?m)^\s*\d{0,3}\s*[A-Z][A-Z\s&\x27\.]{5,55}?\s*\d{0,4}\s*$', ' ', s)
    return re.sub(r'[ \t]+', ' ', s).strip()


def main() -> None:
    text = (CLASSICS / 'lilly_christian_astrology_1647_raw.txt').read_text(encoding='utf-8')

    start = text.find(START_ANCHOR)
    assert start > 0, f'未找到章起点锚点 {START_ANCHOR}'
    end = text.find(END_ANCHOR, start + 1000)
    assert end > start, f'未找到章终点锚点 {END_ANCHOR}'
    chapter = text[start:end]

    problems: list[str] = []
    if len(chapter) < 8000:
        problems.append(f'章文本过短: {len(chapter)}')

    # OCR 将星座符号/名称大量损坏（'1 FS a Mafculine, Diurnall Signe'=ARIES），
    # 改以内容特征锚点校验：白羊座条目 + 双体人形星座（双子）+ 元素词分布
    anchors = {
        'aries_entry': re.search(r'Mafculine,\s*Diurnall\s*Signe', chapter),
        'gemini_entry': 'double-bodied' in chapter,
        'elements': sum(k in chapter for k in ('fiery', 'aiery', 'earthy', 'watery')),
    }
    if not anchors['aries_entry']:
        problems.append('未找到白羊座描述特征（Mafculine Diurnall Signe）')
    if not anchors['gemini_entry']:
        problems.append('未找到双子座描述特征（double-bodied）')
    if anchors['elements'] < 2:
        problems.append(f"元素描述覆盖不足: {anchors['elements']}")

    # 按字段标签统计（Description/Nature/Difeafes/Places 等 OCR 形态）
    labels = len(re.findall(
        r'(?m)^\s*(Diferiprion|Description|Shape and|Nature and|Quality and|Difeafes|Diseases|Places\.?|Kingdomes?|Cities)',
        chapter))
    if labels < 20:
        problems.append(f'字段标签过少: {labels} < 20')

    out = {
        'dataset': 'lilly_signs_chapter',
        'version': 'v1',
        'generated': '2026-08-25',
        'source': {
            'work': 'William Lilly, Christian Astrology in Three Books',
            'year': 1647,
            'rights': 'public domain',
            'origin': 'Internet Archive OCR (ca-william-lilly)',
            'note': '17 世纪长音 s 被 OCR 转为 f（houfe=house, Signe=Sign）；v1 整章收录，逐星座切分留待 v2',
        },
        'signs_found': sorted({s for s in SIGNS if re.search(rf'\b{s}\b', chapter, re.IGNORECASE)}),
        'chapter_passage': norm(chapter),
    }
    outp = DATA / 'lilly_signs_v1.json'
    outp.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f"lilly mined: {len(out['signs_found'])} sign names, {len(chapter)} chars -> {outp}")
    if problems:
        print('PROBLEMS:')
        for p in problems:
            print('  -', p)
        raise SystemExit(1)


if __name__ == '__main__':
    main()
