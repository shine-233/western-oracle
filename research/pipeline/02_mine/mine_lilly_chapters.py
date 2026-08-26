"""02_mine: Lilly《Christian Astrology》(1647) 章节库 v1（第三轮扩容）。

输入: classics/lilly_christian_astrology_1647_raw.txt (Internet Archive OCR, 公版)
输出: data/lilly_chapters_v2.json

lilly_signs_v2 只挖星座章/尊贵章/格言章（raw 的 ≈3%）。本书其余部分：
  A. book1_terms_and_book2_opening：Ch XIX 行星术语/相位词汇起，至问卦格言章前
     （含 Ch XX-XXXIII 各类判断规则与 Book II 开篇）
  B. book2_houses_and_book34：婚姻占断之后的全部正文——Book II 逐宫问事章
     （买卖/朋友/旅行/诉讼…）、Book III/IV 本命盘判断
两区域按段落收录（≥150 字符且小写占比 >25%，滤除图版网格噪声行），
17 世纪长音 s OCR 噪声按原貌保留。

校验:
  1. 两区域段落数与总量达标（A >= 250 段 / B >= 900 段）
  2. 锚点抽查：A 区含 Sextil/Quadrate 相位定义；B 区含 Buying and Selling 章
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CLASSICS = ROOT / 'classics'
DATA = ROOT / 'data'

A_START = 'Of feverall Termes, Afpecis'
A_END = 'QUESTION.'
B_START_ANCHOR = 'Of Marriage, whether it hall take effeét or no'
MARK_RE = re.compile(
    r"(?im)^[^\na-z]{0,8}\s*(?:Cr\s*ap|CHAP|Cuap|Cnap)[\s\.,:|]*(?:[XVLIC\d][\s\.,XVLIC\d]{0,10})?$")


def clean_passage(s: str) -> str:
    s = re.sub(r"(?m)^\s*\d{1,4}\s*$", ' ', s)
    s = re.sub(r"(?m)^[ \t]*\d{1,3}[ \t]+[A-Z][A-Z\s&\x27\.]{5,55}[ \t]*\d{0,3}[ \t]*$", ' ', s)
    s = re.sub(r"(?m)^[ \t]*[^a-z\n]{3,60}[ \t]*$", ' ', s)
    # 行内页眉残片（'7 ONO KAUK' / '2 ELS OF' 类断裂运行页眉）
    s = re.sub(r"\b\d{1,2}\s+[A-Z][A-Z&'\s]{2,18}(?=\s+[A-Z][a-z])", ' ', s)
    # 图版混排残片：数字 + 全大写串 + 逗号/句点收尾（如 '7 ONO KAUK,'）
    s = re.sub(r"\b\d{1,2}\s+[A-Z][A-Z&\.\?\s']{4,24}[\.,]", ' ', s)
    return re.sub(r'\s+', ' ', s).strip()


def region_paragraphs(seg: str, min_len: int = 120) -> list[str]:
    """行级清洗：仅丢弃网格/噪声行（数字标点密度高的短行、无小写短行），
    保留混排段落中的散文部分。"""
    out = []

    def is_grid_line(x: str) -> bool:
        s = x.strip()
        if not s:
            return True
        if sum(c.islower() for c in s) == 0 and len(s) <= 60:
            return True
        dense = sum(not c.isalpha() for c in s) / max(len(s), 1)
        return dense > 0.45 and len(s) < 90

    for p in re.split(r'\n\s*\n', seg):
        kept = [x.strip() for x in p.splitlines() if not is_grid_line(x)]
        para = clean_passage(' '.join(kept))
        if len(para) < min_len:
            continue
        letters = [c for c in para if c.isalpha()]
        if not letters or sum(c.islower() for c in letters) / max(len(letters), 1) < 0.25:
            continue
        # 纯网格段（几乎无散文）整体弃收；混排段保留。
        # 含 >=3 个竖线的段落为星盘表格网格残骸，整体弃收
        if len(letters) / max(len(para), 1) < 0.40 or para.count('|') >= 3:
            continue
        # 与 qa_scan 同款的页眉模式残留段（图版混排残骸）整体弃收
        if re.search(r'\b\d{1,3}\s+[A-Z][A-Z\s]{6,40}\d{0,3}\b', para):
            continue
        out.append(para)
    return out


def main() -> None:
    text = (CLASSICS / 'lilly_christian_astrology_1647_raw.txt').read_text(encoding='utf-8')
    problems: list[str] = []

    a_start = text.find(A_START, 240000)
    a_end = text.find(A_END, 630000) if a_start > 0 else -1
    b_anchor_pos = text.find('iwMDUs', 640000)
    b_start = text.find(B_START_ANCHOR[:30], 645000) if b_anchor_pos > 0 else -1
    if b_start < 0:
        b_start = b_anchor_pos if b_anchor_pos > 0 else 658700
    if not (240000 < a_start < 250000 and 630000 < a_end < 642000):
        problems.append(f'A 区边界异常: {a_start}-{a_end}')
    if not (645000 < b_start < 665000):
        problems.append(f'B 区起点异常: {b_start}')

    region_a = region_paragraphs(text[a_start:a_end])
    region_b = region_paragraphs(text[b_start:len(text)])
    if len(region_a) < 250 or sum(map(len, region_a)) < 100000:
        problems.append(f'A 区不足: {len(region_a)} 段 {sum(map(len, region_a))} 字符')
    if len(region_b) < 1100 or sum(map(len, region_b)) < 600000:
        problems.append(f'B 区不足: {len(region_b)} 段 {sum(map(len, region_b))} 字符')

    blob_a = ' '.join(region_a[:60])
    if 'Sextil afpect' not in blob_a and 'Sextil' not in blob_a:
        problems.append('A 区缺少相位定义锚点')
    blob_b = ' '.join(region_b)
    if 'Buying' not in blob_b:
        problems.append('B 区缺少买卖章锚点')

    # 章标记清单（导航元数据）
    markers = [{'pos': m.start(), 'marker': m.group(0).strip()}
               for m in MARK_RE.finditer(text[a_start:a_end])]

    out = {
        'dataset': 'lilly_chapter_library',
        "version": "v2",
        'generated': '2026-08-26',
        'source': {
            'work': 'William Lilly, Christian Astrology in Three Books',
            'year': 1647,
            'rights': 'public domain',
            'origin': 'Internet Archive OCR (ca-william-lilly)',
            'note': '17 世纪长音 s 被 OCR 转 f；区域 A=Ch XIX 术语/相位至格言章前，'
                    '区域 B=Book II 逐宫问事章与 Book III/IV 本命盘判断。'
                    'OCR 页裂严重不做章节切分，按段落收录（图版网格噪声已滤除）；'
                    '与 lilly_signs_v2.json 互补',
        },
        'counts': {
            'region_a_paragraphs': len(region_a),
            'region_b_paragraphs': len(region_b),
            'chapter_markers_detected': len(markers),
        },
        'regions': {
            'book1_terms_and_book2_opening': {'paragraphs': region_a},
            'book2_houses_and_book34': {'paragraphs': region_b},
        },
        'chapter_markers': markers,
    }
    total = sum(map(len, region_a)) + sum(map(len, region_b))
    outp = DATA / 'lilly_chapters_v2.json'
    outp.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'lilly chapters mined: A={len(region_a)}P/{sum(map(len, region_a))}ch '
          f'B={len(region_b)}P/{sum(map(len, region_b))}ch, markers={len(markers)} -> {outp}')
    if problems:
        print('PROBLEMS:')
        for p in problems:
            print('  -', p)
        raise SystemExit(1)


if __name__ == '__main__':
    main()
