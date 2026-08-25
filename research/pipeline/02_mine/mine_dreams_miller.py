"""02_mine + 03_clean: Miller《Ten Thousand Dreams Interpreted》(1901) 词条挖掘 v1。

输入: classics/miller_ten_thousand_dreams_raw.txt (Project Gutenberg #926, 公版)
输出: data/dreams_miller_v1.json

条目格式（PG 版）:
    _Abbot_.[3]
    To dream that you are an abbot, warns you ...
    （段落若干，直到下一个 _词条_. 标题）

校验:
  1. 词条数 >= 1500（原书约一万条释义、两千余词条）
  2. 高频核心词必须命中（casefold 匹配）：water/snake/death/baby/house/money/marriage/teeth
  3. 所有保留词条至少有一段非空解读
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CLASSICS = ROOT / 'classics'
DATA = ROOT / 'data'

REQUIRED_TERMS = ['water', 'snake', 'death', 'baby', 'house', 'money', 'marriage', 'teeth']

HEADING_RE = re.compile(r'(?m)^_([^_\r\n]{1,80}?)_\.\s*(?:\[\d+\])?\s*$')
FOOTNOTE_RE = re.compile(r'(?m)^\[\d+\]\s.*$')


def norm_key(s: str) -> str:
    return re.sub(r'[^a-z]', '', s.casefold())


PG_ILLEGIBLE_RE = re.compile(r'\b(\w*)\{[^}]*\}(\w*)\{([^}]*?)\?\?[^}]*\}')
LEFTOVER_ILLEGIBLE_RE = re.compile(r'\{[^}]*\?\?[^}]*\}')


def fix_pg_illegible(s: str) -> str:
    """PG 转录标记：en{??}y{envy??} → envy；word{xx??} → word。"""
    s = PG_ILLEGIBLE_RE.sub(lambda m: m.group(3).replace('?', '') or (m.group(1) + m.group(2)), s)
    s = LEFTOVER_ILLEGIBLE_RE.sub('', s)
    return s


def main() -> None:
    text = (CLASSICS / 'miller_ten_thousand_dreams_raw.txt').read_text(encoding='utf-8')

    # 正文从索引之后开始，跳过目录（目录行形如 "Abandon. . . . 41"）
    idx_end = text.find('INDEX')
    idx_start = text.find('Abandon', 60000)
    assert idx_start > 0, '未定位到词典正文起点'
    body_start = idx_start

    matches = [
        m for m in HEADING_RE.finditer(text)
        if m.start() >= body_start and (idx_end < 0 or m.start() < idx_end)
    ]

    entries = []
    for i, m in enumerate(matches):
        term = re.sub(r'\s+', ' ', m.group(1)).strip(' .,;:')
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        raw = text[m.end():end]
        raw = FOOTNOTE_RE.sub('', raw)
        paras = [re.sub(r'\s+', ' ', p).strip() for p in re.split(r'\n\s*\n', raw)]
        paras = [fix_pg_illegible(p) for p in paras]
        paras = [p for p in paras if len(p) > 20]
        if not paras:
            continue
        entries.append({
            'term': term,
            'term_key': norm_key(term),
            'meanings': paras,
        })

    problems: list[str] = []
    if len(entries) < 1500:
        problems.append(f'词条数过少: {len(entries)} < 1500')
    keys = {e['term_key'] for e in entries}
    # 词形容忍：原书部分词条用复数（Snakes/Serpents），按前缀匹配
    missing = [t for t in REQUIRED_TERMS if not any(k.startswith(t) for k in keys)]
    if missing:
        problems.append(f'缺少核心词条: {missing}')
    dup = len(entries) - len(keys)
    if dup > 60:
        problems.append(f'重复词条过多: {dup}')

    out = {
        'dataset': 'dream_dictionary',
        'version': 'v1',
        'generated': '2026-08-25',
        'source': {
            'work': 'Gustavus Hindman Miller, Ten Thousand Dreams Interpreted, or, What\'s in a Dream',
            'year': 1901,
            'rights': 'public domain',
            'origin': 'Project Gutenberg eBook #926',
        },
        'count': len(entries),
        'entries': entries,
    }
    outp = DATA / 'dreams_miller_v1.json'
    outp.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'dreams mined: {len(entries)} terms -> {outp}')
    if problems:
        print('PROBLEMS:')
        for p in problems:
            print('  -', p)
        raise SystemExit(1)


if __name__ == '__main__':
    main()
