"""02_mine + 03_clean: Ptolemy《Tetrabiblos》Book II 挖掘 v2（Ashmand 1822）。

输入: classics/tetrabiblos_ashmand_full_1822_raw.txt (Internet Archive OCR, 公版)
输出: data/tetrabiblos_book2_v2.json

Book II（政治/气象占星）此前完全未挖掘。按「Chapter <罗马数字> + 标题行」定位，
OCR 标题损坏处（Ch XI/XIII 无章号行）以标题特征串补锚，逐章收录：
  - quote：章首段（与 books34 v1 同风格）
  - body：整章正文（清 PTOLEMY 页眉/页码）

校验:
  1. 章数 >= 12（原书 14 章，OCR 允许个别标题损坏漏检）
  2. 必收锚点章齐备：General Division / Eclipses 预测法 / New Moon of the Year /
     particular Natures of the Signs / Signification of Meteors
  3. 各章 body >= 600 字符且出处含 Ashmand 1822
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CLASSICS = ROOT / 'classics'
DATA = ROOT / 'data'

HEADING_RE = re.compile(
    r"(?m)^[\.\|_ \t]*(?:Chapter|Chapeer|Cbapter)[\s‘’'\|l]{0,4}"
    r"([IVXlivd]{1,5})\.?[\|\.,\s]{0,8}$"
)
HEAD_PREFIX_RE = (
    r"^[ \t]*(?:Chapter|Chapeer|Cbapter)[\s‘’'\|l]{0,4}"
    r"[IVXlivd]{1,5}\.?[\|\.,\s]{0,8}\n+"
)
# OCR 吃掉章号行的两章，以标题特征串补锚
SPECIAL_TITLES = [
    ('The New Moon of the Year', 'The New Moon of the Year'),
    ('The Mode of Consideration for particular Constitutions',
     'Mode of Consideration for particular Constitutions'),
]
MUST_HAVE = ['General Division', 'particular Prediction in Eclipses',
             'New Moon of the Year', 'particular Natures of the Signs',
             'Signification of Meteors']


def norm_roman(s: str) -> str:
    return s.replace('l', 'I').replace('L', 'I')


def _is_noise_line(ln: str) -> bool:
    """页眉残行判定：短行、含 ≥8 位全大写/数字噪声串、小写字母 ≤6。"""
    b = ln.strip()
    if not b or len(b) > 90:
        return False
    if sum(c.islower() for c in b) > 6:
        return False
    return bool(re.search(r"[A-Z1ilIO&.’'\x92\[\]()|©®\d]{8,}", b))


def norm(s: str) -> str:
    # 页眉残行整行清除（'60 PTOLEMY'S TETRABIBLOS; [ Book II.' 等腐蚀形态）
    s = '\n'.join('' if _is_noise_line(x) else x for x in s.split('\n'))
    # 无小写字母的行 = 全大写页眉/装饰残行，整行清除
    s = re.sub(r"(?m)^[ \t]*[^a-z\n]{3,}$", ' ', s)
    # 腐蚀的书名页眉词（PTOLEMY'S TETRABIBLOS 及其 OCR 变体）：
    # 长全大写含数字噪声 token（≥8 位）连同前缀一并清除
    s = re.sub(r"[A-Za-z.&'\x92]{0,10}[\s\d‘’\"()\[\]|]{0,6}"
               r"(?:P[Tl]?[O0QY][Ll][A-Za-z0-9'\x92&\.]{0,8}[Ss]?\s*)?"
               r"[TBPE][A-Z1ilIO]{7,14}\b\.?", ' ', s)
    # OCR 页眉行（'120 PTOLEMY'S TETRABEBLOS.'）与行内页眉清除
    s = re.sub(r"(?m)^[ \t]*\d{0,3}[ \t]*[A-Z][A-Z\s&\x27\d\.]{4,70}[ \t]*$", ' ', s)
    s = re.sub(r"(?m)^[ \t]*\d{1,4}[ \t]*$", ' ', s)
    s = re.sub(r"(?<=[a-z,;.])\s+\d{1,3}\s+[A-Z][A-Z&\x27\s\.\x92']{5,55}(?=\s+[a-z\[])", ' ', s)
    s = re.sub(r"\d{0,3}[ \t]?PTOLEMY['’\x92]{0,1}S?[ \t]?TETRAB[EI]BLOS\.?[^\n]{0,45}", ' ', s)
    s = re.sub(r"[A-Za-z]{0,8}\.?[\s\d]*PTOLEMY['’\x92]{0,1}S?[ \t]?TETRAB[EI]BLOS\.?", ' ', s)
    return re.sub(r'\s+', ' ', s).strip()


def main() -> None:
    text = (CLASSICS / 'tetrabiblos_ashmand_full_1822_raw.txt').read_text(encoding='utf-8')
    problems: list[str] = []

    b2s = text.find('BOOK. THE SECOND.')
    b2e = text.find('BOOK THE THIRD.')
    assert 0 < b2s < b2e, f'Book II 边界缺失 ({b2s}, {b2e})'

    # ---- 章标题候选 ----
    cands: list[tuple[int, str]] = []
    for m in HEADING_RE.finditer(text, b2s, b2e):
        roman = norm_roman(m.group(1))
        title_line = text[m.end():text.find('\n', m.end()) + 200]
        cands.append((m.start(), f'Chapter {roman}.'))
    for label, anchor in SPECIAL_TITLES:
        pos = text.find(anchor, b2s, b2e)
        if pos > 0:
            cands.append((pos, label))
        else:
            problems.append(f'补锚章缺失: {label!r}')
    cands.sort()
    # 近邻去重（< 600 字符视为同一章的重复命中）
    merged: list[tuple[int, str]] = []
    for pos, label in cands:
        if merged and pos - merged[-1][0] < 600:
            continue
        merged.append((pos, label))
    if len(merged) < 12:
        problems.append(f'仅检出 {len(merged)} 章 (<12)')

    # ---- 逐章切分 ----
    chapters = []
    for i, (pos, label) in enumerate(merged):
        nxt = merged[i + 1][0] if i + 1 < len(merged) else b2e
        raw_body = text[pos:nxt]
        # 标题：章头行（可缺）后首个非空行；仅当行尾连字符换行时并入下一行
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
        title = norm(' '.join(tparts)).strip(' .|') or label
        body_start = off + sum(len(x) + 1 for x in lines[:j])
        # quote 取正文第一个实质段落（标题换行残留的碎片段跳过）
        paras = [norm(p) for p in re.split(r'\n\s*\n', raw_body[body_start:].lstrip())]
        quote = next((p[:1400] for p in paras if len(p) >= 150), '')
        body = norm(raw_body[body_start:])
        idx = i + 1
        chapters.append({
            'index': idx,
            'heading': label,
            'title': title,
            'quote': quote,
            'body': body,
            'source': f'Tetrabiblos Book II Ch. {idx} (Ashmand 1822)',
        })

    for mh in MUST_HAVE:
        if not any(mh.lower() in c['title'].lower() or mh.lower() in c['body'][:400].lower()
                   for c in chapters):
            problems.append(f'必收章未命中: {mh!r}')
    for c in chapters:
        if len(c['body']) < 600:
            problems.append(f"Ch {c['index']} body 过短: {len(c['body'])}")
        if len(c['quote']) < 100:
            problems.append(f"Ch {c['index']} quote 过短: {len(c['quote'])}")
    total = sum(len(c['body']) for c in chapters)

    out = {
        'dataset': 'tetrabiblos_book2_mundane',
        'version': 'v2',
        'generated': '2026-08-26',
        'source': {
            'work': 'Ptolemy, Tetrabiblos (Ptolemy\u2019s Quadripartite)',
            'translation': 'J.M. Ashmand, 1822',
            'rights': 'public domain',
            'origin': 'Internet Archive OCR (ptolemys-tetrabiblos-j-m-ashmand)',
            'note': 'Book II 政治气象占星（年度太阳新月至陨星），v2 新增；'
                    'heading 为检测到的章号行原文，OCR 缺号章以标题特征串补锚',
        },
        'count': len(chapters),
        'chapters': chapters,
    }
    outp = DATA / 'tetrabiblos_book2_v2.json'
    outp.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f"tetrabiblos B2 mined: {len(chapters)} chapters, total={total}ch -> {outp}")
    for c in chapters:
        print(f"  Ch {c['index']:>2} [{c['heading']:>12}] {c['title'][:60]}")
    if problems:
        print('PROBLEMS:')
        for p in problems:
            print('  -', p)
        raise SystemExit(1)


if __name__ == '__main__':
    main()
