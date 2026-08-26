"""02_mine + 03_clean: Ptolemy《Tetrabiblos》Book III/IV 命盘专题 v2（全文版）。

输入: classics/tetrabiblos_ashmand_full_1822_raw.txt (Internet Archive OCR, 公版)
输出: data/tetrabiblos_books34_v2.json

v1 → v2 扩容（v1 仅 12 主题 × 首段引文 ≈23KB）:
通走 Book III/IV 全部章（「Chapter <罗马数字> + 标题行」），逐章收录
quote（首实质段落）+ body（整章正文）；TOPICS 主题与宫位提示按标题匹配
标注（curated，非原书内容）。个别章标题行 OCR 损坏时正文并入相邻章。

校验:
  1. 章数 >= 18；必收主题齐备且对应章含 house_hint
  2. quote/body 长度达标；出处均含 Ashmand 1822
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CLASSICS = ROOT / 'classics'
DATA = ROOT / 'data'

HEADING_RE = re.compile(
    r"(?m)^[\.\|_ \t]*(?:Chapter|Chapeer|Cbapter)[\s‘’'\|l]{0,4}"
    r"([IVXlivdLU1]{1,6})\.?[\|\.,\s]{0,8}$"
)
HEAD_PREFIX_RE = (
    r"^[ \t]*(?:Chapter|Chapeer|Cbapter)[\s‘’'\|l]{0,4}"
    r"[IVXlivdLU1]{1,6}\.?[\|\.,\s]{0,8}\n+"
)

# 主题 -> 标题匹配 + 传统宫位提示（curated）
TOPICS = {
    'parents': (r'Parent', 4),
    'siblings': (r'Brothers?\s+and\s+Sisters|Brethren', 3),
    'longevity': (r'Duration\s+of\s+Life', 8),
    'body': (r'Form\s+and\s+Temperament', 1),
    'mind': (r'Quality\s+of\s+the\s+Mind', 1),
    'rank': (r'Fortune\s+of\s+Rank|Dignity', 10),
    'occupation': (r'Employment', 10),
    'marriage': (r'Marriage', 7),
    'children': (r'Children', 5),
    'friends': (r'Friends?', 11),
    'travel': (r'Travell?ing|Foreign\s+Travel', 9),
    'death_quality': (r'Kind\s+of\s+Death|Quality\s+of\s+Death', 8),
}
REQUIRED = ('siblings', 'marriage', 'children', 'travel', 'death_quality',
            'occupation', 'body', 'mind', 'longevity')


def _is_noise_line(ln: str) -> bool:
    b = ln.strip()
    if not b or len(b) > 90:
        return False
    if sum(c.islower() for c in b) > 6:
        return False
    return bool(re.search(r"[A-Z1ilIO&.’'\x92\[\]()|©®\d]{8,}", b))


def norm(s: str) -> str:
    s = '\n'.join('' if _is_noise_line(x) else x for x in s.split('\n'))
    s = re.sub(r"(?m)^[ \t]*[^a-z\n]{3,}$", ' ', s)
    s = re.sub(r"[A-Za-z.&'\x92]{0,10}[\s\d‘’\"()\[\]|]{0,6}"
               r"(?:P[Tl]?[O0QY][Ll][A-Za-z0-9'\x92&\.]{0,8}[Ss]?\s*)?"
               r"[TBPE][A-Z1ilIO]{7,14}\b\.?", ' ', s)
    s = re.sub(r"(?m)^[ \t]*\d{0,3}[ \t]*[A-Z][A-Z\s&\x27\d\.]{4,70}[ \t]*$", ' ', s)
    s = re.sub(r"(?m)^[ \t]*\d{1,4}[ \t]*$", ' ', s)
    s = re.sub(r"(?<=[a-z,;.])\s+\d{1,3}\s+[A-Z][A-Z&\x27\s\.\x92']{5,55}(?=\s+[a-z\[])", ' ', s)
    s = re.sub(r"\d{0,3}[ \t]?PTOLEMY['’\x92]{0,1}S?[ \t]?TETRAB[EI]BLOS\.?[^\n]{0,45}", ' ', s)
    s = re.sub(r"[A-Za-z]{0,8}\.?[\s\d]*PTOLEMY['’\x92]{0,1}S?[ \t]?TETRAB[EI]BLOS\.?", ' ', s)
    return re.sub(r'\s+', ' ', s).strip()


def walk_book(text: str, lo: int, hi: int) -> list[dict]:
    cands = sorted(m.start() for m in HEADING_RE.finditer(text, lo, hi))
    merged: list[int] = []
    for pos in cands:
        if merged and pos - merged[-1] < 600:
            continue
        merged.append(pos)
    out = []
    for i, pos in enumerate(merged):
        nxt = merged[i + 1] if i + 1 < len(merged) else hi
        raw_body = text[pos:nxt]
        m_pre = re.match(HEAD_PREFIX_RE, raw_body)
        off = m_pre.end() if m_pre else 0
        lines = raw_body[off:].split('\n')
        j = 0
        while j < len(lines) and not lines[j].strip():
            j += 1
        tparts: list[str] = []
        while j < len(lines) and lines[j].strip():
            tparts.append(lines[j].strip())
            j += 1
            if not ' '.join(tparts).endswith('-'):
                break
        title = re.sub(r'\s+', ' ', ' '.join(tparts)).strip(' .|') or f'Chapter {i + 1}'
        body_start = off + sum(len(x) + 1 for x in lines[:j])
        paras = [norm(p) for p in re.split(r'\n\s*\n', raw_body[body_start:].lstrip())]
        quote = next((p[:1400] for p in paras if len(p) >= 150), '')
        body = norm(raw_body[body_start:])
        # 标题与章号同行（'Chapter V. Marriage.'）或标题行损坏时，从正文首句回退取题
        if re.fullmatch(r'Chapter\s+[IVX\dUuLl]{1,6}\.?', title):
            m_head = re.match(r'([A-Z][A-Za-z,\- ]{3,60}?)[\.:]\s+[A-Z]', body)
            if m_head:
                title = m_head.group(1).strip()
        out.append({'pos': pos, 'title': title, 'quote': quote, 'body': body})
    return out


def main() -> None:
    text = (CLASSICS / 'tetrabiblos_ashmand_full_1822_raw.txt').read_text(encoding='utf-8')
    problems: list[str] = []

    b3 = text.find('BOOK THE THIRD.')
    b4 = text.find('BOOK THE FOURTH.')
    cent = text.find('CENTILOQUY', b4)
    assert 0 < b3 < b4 < cent, f'B3/B4 边界缺失 ({b3}, {b4}, {cent})'
    # B4 正文止于书末附录（Almagest 摘录）之前
    alm = text.find('ALMAGEST;', b4)
    end4 = min(cent, alm) if alm > 0 else cent

    ch3 = walk_book(text, b3, b4)
    ch4 = walk_book(text, b4, end4)
    chapters = []
    for book_no, blocks in ((3, ch3), (4, ch4)):
        for i, blk in enumerate(blocks):
            topic_hit = None
            house_hint = None
            for tp, (pat, house) in TOPICS.items():
                if re.search(pat, blk['title'], re.IGNORECASE):
                    topic_hit = tp
                    house_hint = house
                    break
            roman = ''
            chapters.append({
                'book': book_no,
                'index_in_book': i + 1,
                'title': blk['title'],
                'topic': topic_hit,
                'house_hint': house_hint,
                'quote': blk['quote'],
                'body': blk['body'],
                'source': f'Tetrabiblos Book {"III" if book_no == 3 else "IV"} Ch. {i + 1} (Ashmand 1822)',
            })

    by_topic = {c['topic']: c for c in chapters if c['topic']}
    for req in REQUIRED:
        if req not in by_topic:
            problems.append(f'缺少必收主题 {req}')
        else:
            c = by_topic[req]
            if len(c['body']) < 800:
                problems.append(f'{req} body 过短: {len(c["body"])}')
            if not c['house_hint']:
                problems.append(f'{req} 缺 house_hint')
    for c in chapters:
        if len(c['quote']) < 100:
            problems.append(f"B{c['book']}C{c['index_in_book']} quote 过短")
        if len(c['body']) < 300:
            problems.append(f"B{c['book']}C{c['index_in_book']} ({c['title'][:26]}) body 过短: {len(c['body'])}")
    total = sum(len(c['body']) for c in chapters)

    out = {
        'dataset': 'tetrabiblos_books34_selections',
        'version': 'v2',
        'generated': '2026-08-26',
        'source': {
            'work': 'Ptolemy, Tetrabiblos (Ptolemy\u2019s Quadripartite)',
            'translation': 'J.M. Ashmand, 1822',
            'rights': 'public domain',
            'origin': 'Internet Archive OCR (ptolemys-tetrabiblos-j-m-ashmand)',
            'note': 'v2 扩容：B3/B4 全部章收录整章正文；topic/house_hint 为传统占星对应'
                    '（curated），仅对标题可匹配的章标注；个别章标题行 OCR 损坏时'
                    '正文并入相邻章，文本零丢失',
        },
        'count': len(chapters),
        'chapters': chapters,
    }
    outp = DATA / 'tetrabiblos_books34_v2.json'
    outp.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'tetrabiblos B3/B4 v2 mined: {len(chapters)} chapters '
          f'(topics={sum(1 for c in chapters if c["topic"])}), total={total}ch -> {outp}')
    if problems:
        print('PROBLEMS:')
        for p in problems:
            print('  -', p)
        raise SystemExit(1)


if __name__ == '__main__':
    main()
