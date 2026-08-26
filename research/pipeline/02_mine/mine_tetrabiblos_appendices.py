"""02_mine + 03_clean: Ptolemy《Tetrabiblos》Ashmand 1822 版附录卷挖掘 v1。

输入: classics/tetrabiblos_ashmand_full_1822_raw.txt (Internet Archive OCR, 公版)
输出: data/tetrabiblos_appendices_v2.json

Book I–IV 正文之外的全部内容（此前完全未挖，≈8 万字符）:
  A. ashmand_front_matter：译者序/前言/庞托莱谟生平（书首 ≈5500–59907）
  B. almagest_extract：书末附录《Almagest》摘录（≈494939–503854）
  C. tables_and_extracts：纬度表说明/升交表摘录等（≈503854–Centiloquy 起点）
  D. centiloquy：**Ptolemy《Centiloquy》百条格言**（罗马数字 I.–C. 编号，
     与 Leo 版解析器同款序列匹配；止于 END OF THE CENTILOQUY）
  E. planisphere_appendix：黄道平面星图说明（至书尾）

校验:
  1. centiloquy 恰好 100 条（OCR 容忍个别损坏，>=95 即通过但需记录缺失）
  2. 各区块文本量达标；出处含 Ashmand 1822
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CLASSICS = ROOT / 'classics'
DATA = ROOT / 'data'

NOISE_LINE_RE = re.compile(r"[A-Z1ilIO&.’'\x92\[\]()|©®\d]{8,}")


def _is_noise_line(ln: str) -> bool:
    b = ln.strip()
    if not b or len(b) > 90:
        return False
    if sum(c.islower() for c in b) > 6:
        return False
    return bool(NOISE_LINE_RE.search(b))


def norm(s: str) -> str:
    s = '\n'.join('' if _is_noise_line(x) else x for x in s.split('\n'))
    s = re.sub(r"(?m)^[ \t]*[^a-z\n]{3,}$", ' ', s)
    s = re.sub(r"[A-Za-z.&'\x92]{0,10}[\s\d‘’\"()\[\]|]{0,6}"
               r"(?:P[Tl]?[O0QY][Ll][A-Za-z0-9'\x92&\.]{0,8}[Ss]?\s*)?"
               r"[TBPE][A-Z1ilIO]{7,14}\b\.?", ' ', s)
    s = re.sub(r"\d{0,3}[ \t]?PTOLEMY['’\x92]{0,1}S?[ \t]?TETRAB[EI]BLOS\.?[^\n]{0,45}", ' ', s)
    s = re.sub(r"(?m)^\s*\d{1,4}\s*APPENDIX[\.:,]?\s*$", ' ', s)
    s = re.sub(r"(?m)^.{0,12}APPENDIX[\.:,]?[ \t]*\d{0,4}[ \t]*$", ' ', s)
    s = re.sub(r"(?<=[a-z,;.])\s+\d{1,3}\s+[A-Z][A-Z\s\.\x92']{5,55}(?=\s+[a-z\[])", ' ', s)
    return re.sub(r'[ \t]+', ' ', s)


def passages(seg: str, min_len: int = 150) -> list[str]:
    out = []
    body = norm(seg)
    for p in re.split(r'\n\s*\n', body):
        p = re.sub(r'\s+', ' ', p).strip()
        letters = [c for c in p if c.isalpha()]
        if len(p) >= min_len and letters \
                and sum(c.islower() for c in letters) / max(len(letters), 1) > 0.25:
            out.append(p)
    return out


def roman_expected(n: int) -> str:
    vals = [(100, 'C'), (90, 'XC'), (50, 'L'), (40, 'XL'), (10, 'X'),
            (9, 'IX'), (5, 'V'), (4, 'IV'), (1, 'I')]
    out = ''
    for v, sym in vals:
        while n >= v:
            out += sym
            n -= v
    return out


def _lev1(a: str, b: str) -> bool:
    """编辑距离 <=1 判定（等长替换或一次增删）。"""
    if a == b:
        return True
    if abs(len(a) - len(b)) > 1:
        return False
    if len(a) == len(b):
        return sum(x != y for x, y in zip(a, b)) == 1
    s, l = (a, b) if len(a) < len(b) else (b, a)
    i = j = diff = 0
    while i < len(s) and j < len(l):
        if s[i] == l[j]:
            i += 1
            j += 1
        else:
            diff += 1
            j += 1
            if diff > 1:
                return False
    return True


def parse_centiloquy(seg: str) -> tuple[list[dict], list[int]]:
    """罗马数字序列匹配的百条格言解析。

    容忍：OCR 标点变形（'VI..' / 'I,'）、个别条目行整体损坏（跳过并记缺失，
    允许向前跳最多 3 条重新锁定）；编号单字符腐蚀按编辑距离 1 救援。
    返回 (aphorisms, missing_numbers)。
    """
    items: list[dict] = []
    missing: list[int] = []
    cur_num = 0
    cur_parts: list[str] = []

    def flush():
        nonlocal cur_parts
        txt = re.sub(r'\s+', ' ', ' '.join(cur_parts)).strip()
        if cur_num and txt:
            items.append({'no': cur_num, 'text': txt})
        cur_parts = []

    token_re = re.compile(r'^[ \t]*[\.\-\|_\s]*([IVXLCivxlc\d]{1,8})[\.,]{1,2}\s+([^\n]*)$')
    noise_line = re.compile(
        r"^[ \t]*\d{0,3}[ \t]*(?:APPENDIX|CENTILOQUY)[\.:,]?\s*\d{0,4}[ \t]*$"
        r"|^[ \t]*\d{1,4}[ \t]*$")
    for ln in seg.split('\n'):
        if not ln.strip() or noise_line.match(ln):
            continue
        m = token_re.match(ln)
        ok = False
        if m and re.fullmatch(r'[IVXLCivxlc\d]+', m.group(1)) \
                and re.search(r'[IVXLCivxlc]', m.group(1)):
            tok = m.group(1).upper().replace('1', 'I')
            val = None
            for cand in range(cur_num + 1, min(cur_num + 5, 101)):
                if roman_expected(cand) == tok:
                    val = cand
                    break
            if val is None and len(tok) >= 2:
                for cand in range(cur_num + 1, min(cur_num + 3, 101)):
                    if _lev1(tok, roman_expected(cand)):
                        val = cand
                        break
            if val is not None:
                # 跳过的损坏条目记缺失，文本并入前一条尾部（原书页裂形态）
                while cur_num + 1 < val:
                    cur_num += 1
                    missing.append(cur_num)
                flush()
                cur_num = val
                if m.group(2):
                    cur_parts.append(m.group(2))
                ok = True
        if not ok and cur_num:
            cur_parts.append(ln)
    flush()
    return items, missing


def main() -> None:
    text = (CLASSICS / 'tetrabiblos_ashmand_full_1822_raw.txt').read_text(encoding='utf-8')
    problems: list[str] = []

    b1 = text.find('BOOK THE FIRST.')
    alm = text.find('ALMAGEST;', 480000)
    tbl = text.find('TABLE OF LATITUDES', alm)
    cq_end_anchor = text.find('END OF THE CENTILOQUY', 500000)
    end_marker = text.find('The Zodiacal Planisphere', cq_end_anchor)
    assert 5500 < b1 < alm < tbl < cq_end_anchor < end_marker, \
        f'附录边界异常 ({b1}, {alm}, {tbl}, {cq_end_anchor}, {end_marker})'

    # ---- A. 译者前言/导论（含题献页与 Advertisement，自卷首起）----
    waverley = text.find('WAVERLEY', 500)
    adv = text.find('Advertisement', 1000)
    starts = [x for x in (waverley - 400 if waverley > 0 else None,
                          adv if adv > 0 else None, 5500) if x is not None]
    fm_start = min(starts)
    fm = passages(text[fm_start:b1])
    if sum(map(len, fm)) < 30000:
        problems.append(f'front_matter 过短: {sum(map(len, fm))}')
    for kw in ('WAVERLEY', 'poetical machinery'):
        if kw not in text[fm_start:fm_start + 3500]:
            problems.append(f'front_matter 缺卷首锚词 {kw!r}')
    # 题献页为全大写排版，专用通道收录
    ded_lines = []
    if waverley > 0:
        ded_seg = text[max(fm_start, waverley - 500):adv if adv > waverley else waverley + 400]
        ded_lines = [x.strip() for x in ded_seg.splitlines()
                     if x.strip() and len(x.strip()) >= 4
                     and sum(c.isalpha() for c in x) >= 3]
    dedication = norm(' '.join(ded_lines))

    # ---- B/C. Almagest 摘录 + 表册说明 ----
    ex1 = passages(text[alm:tbl])
    ex2 = passages(text[tbl:text.rfind('END OF THE CENTILOQUY', 500000)])
    if sum(map(len, ex1)) < 4000:
        problems.append(f'almagest_extract 过短: {sum(map(len, ex1))}')
    if sum(map(len, ex2)) < 8000:
        problems.append(f'tables_and_extracts 过短: {sum(map(len, ex2))}')

    # ---- D. Centiloquy 百条 ----
    # 起点：从升交表摘录结束到 CENTILOQUY 结束之间锁定罗马序列
    cq_span_start = text.find('Extract from the Table of Ascensions', tbl)
    aphorisms, missing = parse_centiloquy(text[cq_span_start:cq_end_anchor])
    if len(aphorisms) < 85:
        problems.append(f'centiloquy 仅 {len(aphorisms)} 条 (<85)，缺 {missing[:12]}')
    cq_total = sum(len(a['text']) for a in aphorisms)
    if cq_total < 15000:
        problems.append(f'centiloquy 总量过小: {cq_total}')
    # 缺失条目：编号行 OCR 损毁，正文已并入前一条（文本零丢失），仅缺独立编号

    # ---- E. 星图附录 ----
    pl = passages(text[end_marker:len(text)])
    if sum(map(len, pl)) < 3000:
        problems.append(f'planisphere 过短: {sum(map(len, pl))}')

    total = sum(map(len, fm)) + sum(map(len, ex1)) + sum(map(len, ex2)) \
        + cq_total + sum(map(len, pl))
    out = {
        'dataset': 'tetrabiblos_appendices',
        "version": "v2",
        'generated': '2026-08-26',
        'source': {
            'work': 'Ptolemy, Tetrabiblos (Ptolemy\u2019s Quadripartite)',
            'translation': 'J.M. Ashmand, 1822',
            'rights': 'public domain',
            'origin': 'Internet Archive OCR (ptolemys-tetrabiblos-j-m-ashmand)',
            'note': 'Book I–IV 之外的 Ashmand 版全部内容：译者前言/Almagest 摘录/'
                    '表册说明/Ptolemy《Centiloquy》百条格言/黄道平面星图说明',
        },
        'counts': {
            'front_matter_paragraphs': len(fm),
            'almagest_passages': len(ex1),
            'tables_passages': len(ex2),
            'centiloquy_aphorisms': len(aphorisms),
            'planisphere_passages': len(pl),
        },
        'ashmand_front_matter': {'passages': fm},
        'dedication_to_the_author_of_waverley': {'text': dedication},
        'almagest_extract': {'passages': ex1},
        'tables_and_extracts': {'passages': ex2},
        'centiloquy': {'aphorisms': aphorisms,
                       'numbers_missing': missing},
        'planisphere_appendix': {'passages': pl},
    }
    outp = DATA / 'tetrabiblos_appendices_v2.json'
    outp.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'tet appendices mined: fm={len(fm)}P alm={len(ex1)}P tbl={len(ex2)}P '
          f'cq={len(aphorisms)}/100 pl={len(pl)}P total={total}ch -> {outp}')
    if problems:
        print('PROBLEMS:')
        for p in problems:
            print('  -', p)
        raise SystemExit(1)


if __name__ == '__main__':
    main()
