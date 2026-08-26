"""02_mine: Kunz《The Curious Lore of Precious Stones》(1913) 卷首内容 v1。

输入: classics/kunz_curious_lore_precious_stones_1913_raw.txt (Internet Archive OCR, 公版)
输出: data/kunz_front_matter_v1.json

书首区（题页/版权页之后、Ch I 之前）:
  - dedication：献给 J. Pierpont Morgan 的题献页
  - preface：Kunz 序言全文（≈5 千字符，含致谢名单与资料来源说明）
  - contents_and_illustrations：目录 + 彩色图版/双色调图版/正文插图清单
    （章节结构元数据；图注条目按原貌保留）
第一章正文起点（'Superstitions and Their Sources' 章标题）由
kunz_birthstones_v4 辖区开始，本文件不重复收录。

校验: 题献/序言锚点存在且文本量达标。
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CLASSICS = ROOT / 'classics'
DATA = ROOT / 'data'


def norm(s: str) -> str:
    return re.sub(r'[ \t]+', ' ', s)


def passages(seg: str, min_len: int = 60, strip_toc_pages: bool = False) -> list[str]:
    out = []
    for p in re.split(r'\n\s*\n', seg):
        lines = [x.strip() for x in p.splitlines() if x.strip()]
        # 剔除纯碎片行（单字符/扫描噪声竖排残迹）
        kept = [x for x in lines if len(x) >= 4 and sum(c.isalpha() for c in x) >= 3]
        if strip_toc_pages:
            # 目录/图版清单条目的页码（行首或行中独立数字 token）
            kept = [re.sub(r'\b\d{1,3}\b', '', x) for x in kept]
        para = norm(' '.join(kept)).strip()
        letters = [c for c in para if c.isalpha()]
        if len(para) >= min_len and letters \
                and sum(c.islower() for c in letters) / max(len(letters), 1) > 0.25:
            out.append(para)
    return out


def main() -> None:
    text = (CLASSICS / 'kunz_curious_lore_precious_stones_1913_raw.txt').read_text(encoding='utf-8')
    problems: list[str] = []

    ded = text.find('WITH HEARTFELT APPRECIATION', 500)
    pref = text.find('Preface', ded if ded > 0 else 1000)
    cont = text.find('Contents', pref if pref > 0 else 2000)
    ch1 = text.find('SUPERSTITIONS AND THEIR SOURCES', 15000)
    for label, pos in (('dedication', ded), ('preface', pref), ('contents', cont)):
        if pos <= 0:
            problems.append(f'{label} 锚点缺失')
    if not (0 < ded < pref < cont < ch1):
        problems.append(f'卷首锚点顺序异常: {ded},{pref},{cont},{ch1}')

    # 题献页为全大写排版，不走小写占比过滤
    ded_lines = [x.strip() for x in text[ded:pref].splitlines() if x.strip()]
    ded_lines = [x for x in ded_lines if len(x) >= 4 and sum(c.isalpha() for c in x) >= 3]
    dedication = {'passages': [norm(' '.join(ded_lines))] if ded_lines else []}
    preface = {'passages': passages(text[pref:cont])}
    contents = {'passages': passages(text[cont:ch1], min_len=40, strip_toc_pages=True)}

    if sum(map(len, dedication['passages'])) < 300:
        problems.append('dedication 过短')
    if sum(map(len, preface['passages'])) < 4000:
        problems.append(f'preface 过短: {sum(map(len, preface["passages"]))}')
    blob = ' '.join(preface['passages'])
    for kw in ('Morgan', 'Natal Stones'):
        if kw not in blob:
            problems.append(f'preface 缺锚词 {kw!r}')

    out = {
        'dataset': 'kunz_front_matter',
        'version': 'v1',
        'generated': '2026-08-26',
        'source': {
            'work': 'George Frederick Kunz, The Curious Lore of Precious Stones',
            'year': 1913,
            'publisher': 'J.B. Lippincott Company',
            'rights': 'public domain',
            'origin': 'Internet Archive OCR (curiousloreprec00kunz)',
            'note': '卷首前置内容：Morgan 题献页/Kunz 序言（含致谢与资料来源）/'
                    '目录与插图总清单；正文章节见 kunz_birthstones_v2–v4',
        },
        'dedication': dedication,
        'preface': preface,
        'contents_and_illustrations': contents,
    }
    total = sum(map(len, dedication['passages'])) + sum(map(len, preface['passages'])) \
        + sum(map(len, contents['passages']))
    outp = DATA / 'kunz_front_matter_v1.json'
    outp.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f"kunz front matter mined: ded={len(dedication['passages'])}P "
          f"pref={len(preface['passages'])}P contents={len(contents['passages'])}P "
          f"total={total}ch -> {outp}")
    if problems:
        print('PROBLEMS:')
        for p in problems:
            print('  -', p)
        raise SystemExit(1)


if __name__ == '__main__':
    main()
