"""02_mine: Robson 1923 v2 补漏（月宿详表/Ch II 星座感应正文/前奏论文）。

输入: classics/robson_fixed_stars_1923_raw.txt (Internet Archive OCR, 公版)
输出: data/robson_constellations_v2.json

覆盖率证明器发现 v1 的三处遗漏:
  A. lunar_mansions：月宿目录存在两轮排版，v1 按编号去重时保留了简略
     第一轮、丢弃了详细第二轮 → 改为按编号保留文本最长者，并放宽区间
  B. ch2_influence：Ch II「The Influence of the Constellations」正文
     （星座感应理论 + 分点岁差与 Regulus/Rome 论述 ≈2.3 万字符）
  C. preface：Robson 自序（≈2 千字符，归入本文件 front_matter 字段）

校验: 月宿 >= 28 且含 Revati/Ashadha 详细条目锚词；Ch II 锚词命中。
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CLASSICS = ROOT / 'classics'
DATA = ROOT / 'data'

HEADER_LINE_RE = re.compile(
    r"(?m)^[ \t]*\d{0,3}[ \t]*[A-Z][A-Z&\x27\s\d]{5,70}[ \t]*$")


def norm(s: str) -> str:
    s = HEADER_LINE_RE.sub(' ', s)
    s = re.sub(r"(?m)^\s*\d{1,3}\s*$", ' ', s)
    s = re.sub(r"\b\d{1,3}\s+FIXED\s+STARS(?:\s+AND)?(?:\s+CONSTELLATIONS)?\.?[^a-z\n]{0,6}", ' ', s)
    return re.sub(r'\s+', ' ', s).strip()


def parse_numbered_loose(seg: str):
    entry_re = re.compile(r"(?m)^[ \t]*(\d{1,3})[ \t]*\.[ \t]+([A-Z][^\n]{0,75})$")
    ms = [m for m in entry_re.finditer(seg)]
    out = []
    for i, m in enumerate(ms):
        nxt = ms[i + 1].start() if i + 1 < len(ms) else len(seg)
        out.append((int(m.group(1)), m.group(2).strip(), m.start(), m.end(), nxt))
    return out


def clean_name(s: str) -> str:
    return re.sub(r"[^A-Za-z\x27\- ]", '', s).strip()


def passages(seg: str, min_len: int = 100) -> list[str]:
    out = []
    body = seg
    for pat in (HEADER_LINE_RE, re.compile(r"(?m)^\s*\d{1,3}\s*$")):
        body = pat.sub(' ', body)
    for p in re.split(r'\n\s*\n', body):
        p = norm(p)
        if len(p) >= min_len:
            out.append(p)
    return out


def main() -> None:
    text = (CLASSICS / 'robson_fixed_stars_1923_raw.txt').read_text(encoding='utf-8')
    problems: list[str] = []

    lunar_marker = text.find('THE LUNAR MANSIONS')
    star_catalog = text.find('10. Aldebaran', 130000)
    magic = text.find('MEDIEVAL MAGIC')
    assert 0 < lunar_marker < star_catalog < magic, '月宿边界缺失'

    # ---- A. 月宿全量：章内有多套编号清单（简表/印度详表/中国表），
    #         按「编号回退即新清单」分段，收录印度与中国两套详表 ----
    all_entries = parse_numbered_loose(text)
    in_range = [x for x in all_entries
                if lunar_marker <= x[2] <= star_catalog - 15000]
    runs_lists: list[list] = []
    cur_run: list = []
    prev_num = 0
    for e in in_range:
        if e[0] <= prev_num and cur_run:
            runs_lists.append(cur_run)
            cur_run = []
        cur_run.append(e)
        prev_num = e[0]
    if cur_run:
        runs_lists.append(cur_run)

    def finalize(run_entries):
        by_num: dict[int, dict] = {}
        for num, tail, pos, end, nxt in run_entries:
            parts = [p.strip() for p in tail.split('.')]
            name = clean_name(parts[0])
            if not re.fullmatch(r"[A-Za-z][A-Za-z'\- ]{2,30}", name):
                continue
            designation = ', '.join(p for p in parts[1:] if p)
            body = norm(text[end:nxt])
            wm = re.search(r'With Moon here(?: at birth)?,\s*(.*?)(?:$|\.(?=\s+[A-Z]))', body)
            with_moon = wm.group(1).strip(' .') if wm else ''
            meaning = body[:wm.start()].strip(' .') if wm else body[:800]
            rec = {'num': num, 'name': name, 'designation': designation,
                   'meaning': meaning, 'with_moon': with_moon}
            cur = by_num.get(num)
            if cur is None or len(rec['meaning']) > len(cur['meaning']):
                by_num[num] = rec
        return sorted(by_num.values(), key=lambda x: x['num'])

    finalized = [finalize(r) for r in runs_lists]
    hindu_m = next((r for r in finalized
                    if len(r) >= 24 and any('Ashadha' in x['name'] for x in r)), [])
    chinese_m = next((r for r in finalized
                      if len(r) >= 20 and any(x['name'].startswith('Mao') for x in r)), [])
    if len(hindu_m) < 24:
        problems.append(f'印度月宿仅 {len(hindu_m)} (<24)')
    if len(chinese_m) < 20:
        problems.append(f'中国月宿仅 {len(chinese_m)} (<20)')
    hblob = ' '.join(m['meaning'] + m['name'] for m in hindu_m)
    for kw in ('Revati', 'Ashadha'):
        if kw not in hblob:
            problems.append(f'印度月宿缺详条锚词 {kw!r}')

    # ---- B. Ch II 星座感应正文 + 岁差论述 ----
    ch2_start = text.find('CHAPTER II', 20000)
    ch2_end = text.find('CHAPTER III', ch2_start)
    ch2 = passages(text[ch2_start:ch2_end], min_len=60)
    precession = passages(text[299500:magic])
    if sum(map(len, ch2)) < 6000:
        problems.append(f'ch2 过短: {sum(map(len, ch2))}')
    if 'known to the ancients' not in ' '.join(ch2):
        problems.append('ch2 缺开篇锚词')
    if sum(map(len, precession)) < 8000:
        problems.append(f'岁差论述过短: {sum(map(len, precession))}')
    pblob = ' '.join(precession).lower()
    if 'regulus' not in pblob or 'rome' not in pblob:
        problems.append('岁差论述缺 Regulus/Rome 锚词')

    # ---- C. Robson 自序（原书 PREFACE 仅一页余，量小属正常）----
    pref_start = text.find('PREFACE', 300)
    ch1_head = text.find('CHAPTER I', pref_start)
    preface = passages(text[pref_start:ch1_head], min_len=60)
    if sum(map(len, preface)) < 100:
        problems.append(f'preface 过短: {sum(map(len, preface))}')

    total = sum(len(m['meaning']) + len(m['with_moon']) for m in hindu_m + chinese_m) \
        + sum(map(len, ch2)) + sum(map(len, precession)) + sum(map(len, preface))
    out = {
        'dataset': 'robson_constellations_and_mansions',
        'version': 'v2',
        'generated': '2026-08-26',
        'source': {
            'work': "Vivian E. Robson, The Fixed Stars and Constellations in Astrology",
            'year': 1923,
            'publisher': 'Cecil Palmer, London',
            'rights': 'public domain',
            'origin': 'Internet Archive OCR (in.ernet.dli.2015.128091)',
            'note': 'v2 补漏：月宿两轮排版取详细轮（v1 去重误留简略轮）、'
                    '新增 Ch II 星座感应正文、分点岁差与 Regulus/Rome 论述、Robson 自序；'
                    '恒星魔法清单见 robson_medieval_magic_v1',
        },
        'counts': {
            'lunar_mansions_hindu': len(hindu_m),
            'lunar_mansions_chinese': len(chinese_m),
            'ch2_passages': len(ch2),
            'precession_passages': len(precession),
            'preface_passages': len(preface),
        },
        'lunar_mansions_hindu': hindu_m,
        'lunar_mansions_chinese': chinese_m,
        'ch2_influence_of_constellations': {'passages': ch2},
        'precession_and_constellational_ages': {'passages': precession},
        'front_matter': {'passages': preface},
    }
    outp = DATA / 'robson_constellations_v2.json'
    outp.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f"robson constellations v2 mined: hindu={len(hindu_m)} "
          f"chinese={len(chinese_m)} ch2={len(ch2)}P prec={len(precession)}P "
          f"pref={len(preface)}P text={total}ch -> {outp}")
    if problems:
        print('PROBLEMS:')
        for p in problems:
            print('  -', p)
        raise SystemExit(1)


if __name__ == '__main__':
    main()
