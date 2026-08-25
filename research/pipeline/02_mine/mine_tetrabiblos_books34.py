"""02_mine + 03_clean: Ptolemy《Tetrabiblos》Book III/IV 命盘专题章挖掘 v1（Ashmand 1822）。

输入: classics/tetrabiblos_ashmand_full_1822_raw.txt (Internet Archive OCR, 公版)
输出: data/tetrabiblos_books34_v1.json

按「Chapter <罗马数字>. + 标题行」定位命盘专题各章，每主题截取首段引文，
并标注传统上对应的宫位（house_hint，curated 映射）。

校验:
  1. 必收主题齐全：siblings/marriage/children/travel/death_quality/occupation/body/mind/longevity
  2. 引文均 >= 200 字符且含书籍章节出处
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CLASSICS = ROOT / 'classics'
DATA = ROOT / 'data'

# 主题 -> (标题关键词, 传统宫位提示)
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

BOOK3 = text_pos = None

HEADING_RE = re.compile(
    r'(?m)^[\.\s]*(Chapter)\s*([IVXlL]{1,6})\.?\s*\n+\s*([^\n]{2,60})\s*$'
)


def norm_roman(s: str) -> str:
    return s.replace('l', 'I').replace('L', 'I').strip()


def norm(s: str) -> str:
    # OCR 页眉行（'120 PTOLEMY'S TETRABEBLOS.'）与行内页眉清除
    s = re.sub(r'(?m)^[ \t]*\d{0,3}[ \t]*[A-Z][A-Z\s&\x27\d\.]{4,70}[ \t]*$', ' ', s)
    s = re.sub(r'(?m)^[ \t]*\d{1,4}[ \t]*$', ' ', s)
    s = re.sub(r"(?<=[a-z,;.])\s+\d{1,3}\s+[A-Z][A-Z&\x27\s\.\x92']{5,55}(?=\s+[a-z\[])", ' ', s)
    # 已知书名页眉兜底（OCR 拼写 TETRABEBLOS/TETRABIBLOS 均有，含所有格 'S）
    s = re.sub(r"\d{0,3}[ \t]?PTOLEMY['’\x92]{0,1}S?[ \t]?TETRAB[EI]BLOS\.?[^\n]{0,45}", ' ', s)
    s = re.sub(r"[A-Za-z]{0,8}\.?[\s\d]*PTOLEMY['’\x92]{0,1}S?[ \t]?TETRAB[EI]BLOS\.?", ' ', s)
    return re.sub(r'\s+', ' ', s).strip()


def main() -> None:
    text = (CLASSICS / 'tetrabiblos_ashmand_full_1822_raw.txt').read_text(encoding='utf-8')
    b3 = text.find('BOOK THE THIRD.')
    b4 = text.find('BOOK THE FOURTH.')
    end_marker = text.find('CENTILOQUY', b4 if b4 > 0 else 400000)
    assert 0 < b3 < b4, f'Book III/IV 锚点缺失 ({b3}, {b4})'
    end4 = end_marker if end_marker > 0 else len(text)

    found: dict[str, dict] = {}
    for m in HEADING_RE.finditer(text):
        pos = m.start()
        if not (b3 <= pos <= end4):
            continue
        roman = norm_roman(m.group(2))
        title = norm(m.group(3)).rstrip('. :|')
        body_start = m.end()
        # 引文到下一章标题或 1200 字符
        nxt = HEADING_RE.search(text, body_start + 10)
        body_end = min(body_start + 1400, nxt.start() if nxt else len(text))
        quote = norm(text[body_start:body_end])
        for topic, (pat, house) in TOPICS.items():
            if topic in found:
                continue
            if re.search(pat, title, re.IGNORECASE):
                found[topic] = {
                    'book': 3 if pos < b4 else 4,
                    'chapter': roman,
                    'title': title,
                    'house_hint': house,
                    'quote': quote,
                    'source': f"Tetrabiblos Book {'III' if pos < b4 else 'IV'} Ch. {roman} (Ashmand 1822)",
                }
                break

    problems: list[str] = []
    for req in ('siblings', 'marriage', 'children', 'travel', 'death_quality',
                'occupation', 'body', 'mind', 'longevity'):
        if req not in found:
            problems.append(f'缺少必收主题 {req}')
        elif len(found[req]['quote']) < 200:
            problems.append(f'{req} 引文过短: {len(found[req]["quote"])}')

    out = {
        'dataset': 'tetrabiblos_books34_selections',
        'version': 'v1',
        'generated': '2026-08-25',
        'source': {
            'work': 'Ptolemy, Tetrabiblos (Ptolemy\u2019s Quadripartite)',
            'translation': 'J.M. Ashmand, 1822',
            'rights': 'public domain',
            'origin': 'Internet Archive OCR (ptolemys-tetrabiblos-j-m-ashmand)',
            'note': 'house_hint 为传统占星对应（curated），非原书内容；与 tetrabiblos_astro_v1.json (Book I) 互补',
        },
        'topics': found,
    }
    outp = DATA / 'tetrabiblos_books34_v1.json'
    outp.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f"tetrabiblos B3/B4 mined: {len(found)} topics ({sorted(found)}) -> {outp}")
    if problems:
        print('PROBLEMS:')
        for p in problems:
            print('  -', p)
        raise SystemExit(1)


if __name__ == '__main__':
    main()
