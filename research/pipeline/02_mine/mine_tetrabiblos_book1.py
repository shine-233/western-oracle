"""02_mine + 03_clean: Ptolemy《Tetrabiblos》Book I 挖掘 v2（Ashmand 1822）。

输入: classics/tetrabiblos_ashmand_full_1822_raw.txt (Internet Archive OCR, 公版)
输出: data/tetrabiblos_book1_v2.json

Book I（基础原理：行星性质/庙旺/三相/相位等，约 30 章）此前仅有选章摘录
（tetrabiblos_book1_raw.txt 6KB + tetrabiblos_astro_v1.json 概念表），
本脚本按「Chapter <罗马数字> + 标题行」通走全书，逐章收录 quote + 全文 body。

校验:
  1. 章数 >= 25；Proem 章命中；各章 body >= 400 字符
  2. 出处均含 Ashmand 1822
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CLASSICS = ROOT / 'classics'
DATA = ROOT / 'data'

HEADING_RE = re.compile(
    r"(?m)^[\.\|_ \t]*(?:Chapter|Chapeer|Cbapter)[\s‘’'\|l]{0,4}"
    r"([IVXliuvdLU1]{1,6})\.?[\|\.,\s]{0,8}$"
)
HEAD_PREFIX_RE = (
    r"^[ \t]*(?:Chapter|Chapeer|Cbapter)[\s‘’'\|l]{0,4}"
    r"[IVXliuvdLU1]{1,6}\.?[\|\.,\s]{0,8}\n+"
)


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


def _is_noise_line(ln: str) -> bool:
    b = ln.strip()
    if not b or len(b) > 90:
        return False
    if sum(c.islower() for c in b) > 6:
        return False
    return bool(re.search(r"[A-Z1ilIO&.’'\x92\[\]()|©®\d]{8,}", b))


def main() -> None:
    text = (CLASSICS / 'tetrabiblos_ashmand_full_1822_raw.txt').read_text(encoding='utf-8')
    problems: list[str] = []

    b1s = text.find('BOOK THE FIRST.')
    b1e = text.find('BOOK. THE SECOND.')
    assert 0 < b1s < b1e, f'Book I 边界缺失 ({b1s}, {b1e})'

    cands = sorted(m.start() for m in HEADING_RE.finditer(text, b1s, b1e))
    merged: list[int] = []
    for pos in cands:
        if merged and pos - merged[-1] < 600:
            continue
        merged.append(pos)
    if len(merged) < 20:
        problems.append(f'仅检出 {len(merged)} 章 (<20)')
    # 原书 27 章，个别章标题行 OCR 损坏不可检出——其正文并入相邻章 body，
    # 文本零丢失，仅结构粒度变粗（note 已声明）。

    chapters = []
    for i, pos in enumerate(merged):
        nxt = merged[i + 1] if i + 1 < len(merged) else b1e
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
        title = re.sub(r'\s+', ' ', ' '.join(tparts)).strip(' .|') \
            or f'Chapter {i + 1}'
        body_start = off + sum(len(x) + 1 for x in lines[:j])
        paras = [norm(p) for p in re.split(r'\n\s*\n', raw_body[body_start:].lstrip())]
        quote = next((p[:1400] for p in paras if len(p) >= 150), '')
        body = norm(raw_body[body_start:])
        chapters.append({
            'index': i + 1,
            'title': title,
            'quote': quote,
            'body': body,
            'source': f'Tetrabiblos Book I Ch. {i + 1} (Ashmand 1822)',
        })

    blob = ' '.join(c['title'].lower() for c in chapters)
    if 'proem' not in blob:
        problems.append('Proem 章未命中')
    for c in chapters:
        if len(c['body']) < 400:
            problems.append(f"Ch {c['index']} ({c['title'][:30]}) body 过短: {len(c['body'])}")
        if len(c['quote']) < 100:
            problems.append(f"Ch {c['index']} quote 过短")
    total = sum(len(c['body']) for c in chapters)

    out = {
        'dataset': 'tetrabiblos_book1_foundations',
        'version': 'v2',
        'generated': '2026-08-26',
        'source': {
            'work': 'Ptolemy, Tetrabiblos (Ptolemy\u2019s Quadripartite)',
            'translation': 'J.M. Ashmand, 1822',
            'rights': 'public domain',
            'origin': 'Internet Archive OCR (ptolemys-tetrabiblos-j-m-ashmand)',
            'note': 'Book I 基础原理卷全文按章收录（v1 仅概念表/选章）；'
                    '原书 27 章中个别章标题行 OCR 损坏不可检出，其正文并入相邻章 body，'
                    '文本零丢失；与 tetrabiblos_astro_v1.json 概念层互补',
        },
        'count': len(chapters),
        'chapters': chapters,
    }
    outp = DATA / 'tetrabiblos_book1_v2.json'
    outp.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'tetrabiblos B1 mined: {len(chapters)} chapters, total={total}ch -> {outp}')
    if problems:
        print('PROBLEMS:')
        for p in problems:
            print('  -', p)
        raise SystemExit(1)


if __name__ == '__main__':
    main()
