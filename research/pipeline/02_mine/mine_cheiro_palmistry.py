"""02_mine + 03_clean: Cheiro《Palmistry for All》(1916) 章节切分挖掘 v1。

输入: classics/cheiro_palmistry_for_all_1916_raw.txt (Project Gutenberg #20480, 公版)
输出: data/cheiro_palmistry_v1.json

章节标题格式（正文）:
    CHAPTER II
    THE LINE OF HEAD OR THE INDICATIONS OF THE MENTALITY

按标题关键词归入结构化 section（主线/副线/星丘/手型），供站点手相模块引用。

校验:
  1. 核心章节齐全：head/life/destiny/heart 四条主线 + jupiter/saturn/venus/moon 四个星丘
  2. 每个 section 文本 >= 400 字符
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CLASSICS = ROOT / 'classics'
DATA = ROOT / 'data'

TITLE_KEYS = [
    (r'LINE OF HEAD', 'line_of_head'),
    (r'LINE OF LIFE', 'line_of_life'),
    (r'LINE OF MARS OR INNER LIFE', 'line_of_mars'),
    (r'LINE OF DESTINY|LINE OF .*FATE', 'line_of_destiny'),
    (r'LINE OF THE SUN|LINE OF SUN', 'line_of_sun'),
    (r'LINE OF HEART', 'line_of_heart'),
    (r'SIGNS RELATING TO MARRIAGE|LINE OF MARRIAGE', 'marriage'),
    (r'LINES DENOTING CHILDREN', 'children'),
    (r'LINE OF HEALTH', 'line_of_health'),
    (r'GIRDLE OF VENUS', 'girdle_of_venus'),
    (r'LINE OF INTUITION', 'line_of_intuition'),
    (r'MOUNT OF MARS', 'mount_mars'),
    (r'MOUNT OF JUPITER', 'mount_jupiter'),
    (r'MOUNT OF SATURN', 'mount_saturn'),
    (r'MOUNT OF THE SUN|MOUNT OF SUN', 'mount_sun'),
    (r'MOUNT OF MERCURY', 'mount_mercury'),
    (r'MOUNT OF THE MOON|MOUNT OF MOON', 'mount_moon'),
    (r'MOUNT OF VENUS', 'mount_venus'),
    (r'SHAPES? OF THE HANDS|SEVEN TYPES', 'hand_types'),
]

CH_RE = re.compile(r'(?m)^\s*CHAPTER\s+([IVXLC]+)\s*$')


def classify(title: str) -> str | None:
    up = title.upper()
    for pat, key in TITLE_KEYS:
        if re.search(pat, up):
            return key
    return None


def main() -> None:
    text = (CLASSICS / 'cheiro_palmistry_for_all_1916_raw.txt').read_text(encoding='utf-8')
    toc_end = text.find('INTRODUCTION', 20000)

    heads = [m for m in CH_RE.finditer(text) if m.start() > toc_end]
    assert len(heads) >= 25, f'章节标题过少: {len(heads)}'

    sections: dict[str, dict] = {}
    for i, m in enumerate(heads):
        end = heads[i + 1].start() if i + 1 < len(heads) else len(text)
        after = text[m.end():end]
        lines = [ln.strip() for ln in after.splitlines() if ln.strip()]
        if not lines:
            continue
        title_lines = [lines[0]]
        # 标题可能折行：后续全大写行并入
        for ln in lines[1:3]:
            if ln.isupper() and len(ln) > 8 and not re.search(r'\d', ln):
                title_lines.append(ln)
            else:
                break
        title = ' '.join(title_lines)
        key = classify(title)
        if not key:
            continue
        body = '\n'.join(lines[len(title_lines):])
        if key in sections:
            sections[key]['text'] += '\n\n' + body
            continue
        sections[key] = {
            'chapter': m.group(1),
            'title': re.sub(r'\s+', ' ', title),
            'text': body,
        }

    problems: list[str] = []
    for req in ('line_of_head', 'line_of_life', 'line_of_destiny', 'line_of_heart',
                'mount_jupiter', 'mount_saturn', 'mount_venus', 'mount_moon'):
        if req not in sections:
            problems.append(f'缺少核心章节 {req}')
        elif len(sections[req]['text']) < 400:
            problems.append(f'{req} 文本过短: {len(sections[req]["text"])}')
    if len(sections) < 14:
        problems.append(f'section 数过少: {len(sections)} < 14')

    out = {
        'dataset': 'palmistry_sections',
        'version': 'v1',
        'generated': '2026-08-25',
        'source': {
            'work': 'Cheiro, Palmistry for All',
            'year': 1916,
            'rights': 'public domain',
            'origin': 'Project Gutenberg eBook #20480',
        },
        'count': len(sections),
        'sections': sections,
    }
    outp = DATA / 'cheiro_palmistry_v1.json'
    outp.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'palmistry mined: {len(sections)} sections -> {outp}')
    if problems:
        print('PROBLEMS:')
        for p in problems:
            print('  -', p)
        raise SystemExit(1)


if __name__ == '__main__':
    main()
