"""02_mine + 03_clean: Kunz《The Curious Lore of Precious Stones》(1913) 水晶语料 v2（扩容版）。

输入: classics/kunz_curious_lore_precious_stones_1913_raw.txt (Internet Archive OCR, 公版)
输出: data/kunz_birthstones_v2.json

v1 → v2 扩容（v1 提取率 0.7%，raw 773K 字符仅取 5.6K）:
  A. favored_tally + breastplate：与 v1 相同（Ch IX 票数表/胸甲十二石）
  B. sentiments_of_months：新增「SENTIMENTS OF THE MONTHS」十二月表
     （诞生石/守护天使/护符宝石/主保使徒/对应宝石/黄道宫/花）+ 每月双诗
     ——表值逐项回查原文核对（防篡改），诗文从原文解析
  C. crystal_gazing：单段 → 全章段落库（页眉行定位 ≈333611–430772）
  D. planetary_and_astral_influences：新增全章段落库（≈638488–689018）

校验:
  1. 三章锚点存在且边界单调；sentiments 表 12/12 且每个值在原文月块内命中
  2. verses 24 首且长度合理；crystal 段落 >= 25 段 / >=30000 字符；
     planetary 段落 >= 15 段 / >=20000 字符
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CLASSICS = ROOT / 'classics'
DATA = ROOT / 'data'

MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December']

# 「Sentiments of the Months」原书表值（Ch IX，p.326-331）。
# 顺序: birth_stone / guardian_angel / talismanic_gem / special_apostle /
#       his_gem / zodiacal_sign / flower
# OCR 页眉噪声大，标签行不可靠，故以「固定表值 + 原文逐项命中」方式收录
# （与 v1 对票数表中间月份的防篡改核对待遇一致）。
SENTIMENTS = {
    'January':   ('Garnet', 'Gabriel', 'Onyx', 'Simon Peter', 'Jasper',
                  'Aquarius', 'Snowdrop'),
    'February':  ('Amethyst', 'Barchiel', 'Jasper', 'Andrew', 'Carbuncle',
                  'Pisces', 'Primrose'),
    'March':     ('Jasper, bloodstone', 'Malchediel', 'Ruby', 'James and John',
                  'Emerald', 'Aries', 'Ipomea, violet'),
    'April':     ('Diamond, sapphire', 'Ashmodei', 'Topaz', 'Philip',
                  'Carnelian', 'Taurus', 'Daisy'),
    'May':       ('Emerald', 'Amriel', 'Carbuncle', 'Bartholomew',
                  'Chrysolite', 'Gemini', 'Hawthorn'),
    'June':      ('Agate', 'Muriel', 'Emerald', 'Thomas', 'Beryl',
                  'Cancer', 'Honeysuckle'),
    'July':      ('Turquoise', 'Verchiel', 'Sapphire', 'Matthew', 'Topaz',
                  'Leo', 'Water-lily'),
    'August':    ('Carnelian', 'Hamatiel', 'Diamond', 'James, the son of Alpheus',
                  'Sardonyx', 'Virgo', 'Poppy'),
    'September': ('Chrysolite', 'Tsuriel', 'Jacinth', 'Lebbeus Thaddeus',
                  'Chrysoprase', 'Libra', 'Morning-glory'),
    'October':   ('Beryl', 'Bariel', 'Agate', 'Simon (Zelotes)', 'Jacinth',
                  'Scorpio', 'Hops'),
    'November':  ('Topaz', 'Adnachiel', 'Amethyst', 'Matthias', 'Amethyst',
                  'Sagittarius', 'Chrysanthemum'),
    'December':  ('Ruby', 'Humiel', 'Beryl', 'Paul', 'Sapphire',
                  'Capricornus', 'Holly'),
}
FIELD_NAMES = ('birth_stone', 'guardian_angel', 'talismanic_gem',
               'special_apostle', 'his_gem', 'zodiacal_sign', 'flower')

# 个别表值的 OCR 原貌替身（核对时使用；证据见 raw 月块）
VALUE_RAW_ALTS = {
    ('October', 'special_apostle'): r'Simon[\s\.,]{0,3}\(Zelotes',
    ('October', 'zodiacal_sign'): r'S[ce]orpio',
}

# 本页已知 OCR 错拼归一（证据见 raw 原文）
STONE_OCR_FIXES = {
    'Chaleedony': 'Chalcedony',
    'Pear': 'Pearl',
    'Eat\u2019s-eye': "Cat's-eye",
    "Eat's-eye": "Cat's-eye",
}
RAW_SPELLING = {
    'Pearl': r"pear\]?",
    "Cat's-eye": r"eat[\u2019']s-eye",
    'Chalcedony': r"chal[ce]edony",
}

# 章节页眉（清除用）
HEADER_RES = [
    re.compile(r"(?m)^\s*\d{0,3}\s*(?:THE CURIOUS LORE OF PRECIOUS STONES|"
               r"CRYSTAL BALLS AND CRYSTAL GAZING|BIRTH-STONES|"
               r"PLANETARY AND ASTRAL INFLUENCES|SENTIMENTS OF THE MONTHS|"
               r"ON THERAPEUTIC USES OF STONES)\s*\d{0,4}\s*$"),
    re.compile(r"(?m)^\s*\d{1,4}\s*$"),
]


def norm(s: str) -> str:
    return re.sub(r'\s+', ' ', s).strip()


def clean_block(s: str) -> str:
    for pat in HEADER_RES:
        s = pat.sub(' ', s)
    return s


def chapter_passages(text: str, start: int, end: int,
                     min_len: int = 180) -> list[str]:
    """章节体按空行切段，清除页眉/页码行，保留实质段落。"""
    body = clean_block(text[start:end])
    out = []
    for p in re.split(r'\n\s*\n', body):
        p = norm(p)
        if len(p) >= min_len and sum(c.isupper() for c in p) / max(len(p), 1) < 0.5:
            out.append(p)
    return out


def val_pat(v: str) -> str:
    """表值 → 宽松正则（OCR 在词间插入点号/逗号/多余空白仍可命中）。"""
    tokens = re.findall(r"[A-Za-z\x27\-\(\)]+", v)
    parts = []
    for tk in tokens:
        esc = re.escape(tk).replace(r'\(', r'\(\s*').replace(r'\)', r'[\s\.,]{0,2}\)')
        parts.append(esc)
    return r'[\s\.,]{0,3}'.join(parts) + r'[\s\.,]{0,3}'


def parse_tally(seg: str) -> dict[str, list[dict]]:
    pair_re = re.compile(r'([A-Za-z\x27\u2019\-]+)[,.\]]?\s+(\d+)')
    out: dict[str, list[dict]] = {}
    cur = None
    for ln in seg.splitlines():
        ln = ln.strip()
        m = re.match(r'^([A-Z][a-z]+)\D{0,20}(.*)$', ln)
        pairs = [
            (STONE_OCR_FIXES.get(s.capitalize(), s.capitalize()), int(c))
            for s, c in pair_re.findall(ln)
        ]
        if m and m.group(1) in MONTHS:
            cur = m.group(1)
            out[cur] = [{'stone': s, 'count': c} for s, c in pairs]
        elif cur and pairs:
            out[cur].extend({'stone': s, 'count': c} for s, c in pairs)
    return out


def main() -> None:
    text = (CLASSICS / 'kunz_curious_lore_precious_stones_1913_raw.txt').read_text(encoding='utf-8')
    problems: list[str] = []

    # ---- 章节锚点 ----
    cg_start = text.find('CRYSTAL BALLS AND CRYSTAL GAZING')
    cg_end_anchor = text.find('RELIGIOUS USES OF PRECIOUS STONES', 400000)
    sent_start = text.find('SENTIMENTS OF THE MONTHS')
    pl_start = text.find('PLANETARY AND ASTRAL INFLUENCES', 600000)
    pl_end_anchor = text.find('ON THERAPEUTIC USES OF STONES', 660000)
    for label, pos, lo, hi in (
        ('crystal 起点', cg_start, 300000, 360000),
        ('crystal 终点', cg_end_anchor, 400000, 460000),
        ('sentiments 起点', sent_start, 610000, 625000),
        ('planetary 起点', pl_start, 630000, 645000),
        ('planetary 终点', pl_end_anchor, 680000, 700000),
    ):
        if not (lo < pos < hi):
            problems.append(f'{label} 锚点异常: {pos}')

    # ---- A. favored tally + breastplate（同 v1）----
    ch9 = text.find('BIRTH-STONES', 100000)
    ch10 = pl_start
    seg = text[ch9:ch10]
    tally_pos = seg.find('most favored')
    tally_seg = seg[tally_pos:seg.find('With the exception', tally_pos)]
    raw_tally = parse_tally(tally_seg)
    favored: dict[str, list[dict]] = {}
    mi = 0
    for k, v in raw_tally.items():
        while mi < len(MONTHS) and MONTHS[mi] != k and not k.startswith(MONTHS[mi][:4]):
            mi += 1
        if mi < len(MONTHS):
            favored[MONTHS[mi]] = v
        mi += 1
    expected_middle = {
        'March': [('Jasper', 5), ('Bloodstone', 4)],
        'April': [('Sapphire', 7), ('Diamond', 2)],
        'May': [('Agate', 5), ('Emerald', 4), ('Chalcedony', 1), ('Carnelian', 1)],
        'June': [('Emerald', 4), ('Agate', 4), ('Turquoise', 1), ('Pearl', 1), ("Cat's-eye", 1)],
        'July': [('Onyx', 5), ('Sardonyx', 1)],
        'August': [('Carnelian', 5), ('Sardonyx', 3), ('Moonstone', 1)],
    }
    flat = re.sub(r'\s+', ' ', tally_seg)
    for mth, pairs in expected_middle.items():
        ok = all(
            re.search(rf"{RAW_SPELLING.get(s, re.escape(s))}\s*,?\s*{c}\b", flat, re.IGNORECASE)
            for s, c in pairs
        )
        if ok:
            favored[mth] = [{'stone': s.capitalize(), 'count': c} for s, c in pairs]
        else:
            problems.append(f'{mth} 表值未能在原文核对')
    if len(favored) != 12:
        problems.append(f'favored 覆盖 {len(favored)}/12')

    bp_pos = seg.find('Breastplate. Foundation Stones.')
    bp_rows: list[dict] = []
    if bp_pos > 0:
        bp_seg = seg[bp_pos:seg.find('While the arrangement differs', bp_pos)]
        roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
        rows = re.split(r'(?m)^\s*(' + '|'.join(roman) + r')\s+', bp_seg, flags=re.IGNORECASE)
        for i in range(1, len(rows) - 1, 2):
            stones = [norm(s).strip(' .') for s in rows[i + 1].split('\n') if norm(s)]
            bp_rows.append({
                'no': rows[i],
                'authorized_version': stones[0] if stones else '',
                'later_correction': stones[1] if len(stones) > 1 else '',
                'foundation_stone': stones[2] if len(stones) > 2 else '',
            })
    if len(bp_rows) != 12:
        problems.append(f'breastplate 行数 {len(bp_rows)} != 12')

    # ---- B. sentiments of months ----
    sentiments_out: dict[str, dict] = {}
    sent_body = text[sent_start:text.find('A HINDU LIST OF GEMS', sent_start)]
    month_pos = []
    for i, mo in enumerate(MONTHS):
        ms = [m.start() for m in re.finditer(rf'(?m)^\s*{mo.upper()}\s*$', sent_body)]
        if not ms:
            problems.append(f'{mo} 月块缺失')
            continue
        month_pos.append((i, mo, ms[0]))
    for idx, (i, mo, pos) in enumerate(month_pos):
        end = month_pos[idx + 1][2] if idx + 1 < len(month_pos) else len(sent_body)
        block = sent_body[pos:end]
        vals = SENTIMENTS[mo]
        entry: dict[str, str] = {}
        for name, v in zip(FIELD_NAMES, vals):
            pat = VALUE_RAW_ALTS.get((mo, name)) or val_pat(v)
            if not re.search(pat, block, re.IGNORECASE):
                problems.append(f'{mo}.{name} 表值未在原文命中: {v!r}')
            entry[name] = v
        # 诗文：花名行之后的剩余文本（清页眉后按行保留）
        flower_m = list(re.finditer(val_pat(vals[-1]), block))
        tail = block[flower_m[-1].end():] if flower_m else ''
        tail_lines = [norm(x) for x in clean_block(tail).splitlines()]
        verse = ' / '.join(x for x in tail_lines if len(x) > 12)
        verse = verse.replace(' / ', '\n')
        if len(verse) < 60:
            problems.append(f'{mo} 诗文过短: {len(verse)}')
        entry['verses'] = verse
        sentiments_out[mo] = entry
    if len(sentiments_out) != 12:
        problems.append(f'sentiments 覆盖 {len(sentiments_out)}/12')
    # 抽查锚句（每月首诗首词可读性抽查）
    spot = {
        'January': 'No gems save garnets',
        'June': 'Who comes with summer',
        'December': 'If cold December give you birth',
    }
    for mo, frag in spot.items():
        if frag not in sentiments_out.get(mo, {}).get('verses', ''):
            problems.append(f'{mo} 诗文锚句缺失: {frag!r}')

    # ---- C/D. crystal gazing 与 planetary 章段落库 ----
    crystal = chapter_passages(text, cg_start, cg_end_anchor)
    planetary = chapter_passages(text, pl_start, pl_end_anchor)
    if len(crystal) < 25 or sum(map(len, crystal)) < 30000:
        problems.append(f'crystal 段落库不足: {len(crystal)} 段 {sum(map(len, crystal))} 字符')
    if len(planetary) < 15 or sum(map(len, planetary)) < 20000:
        problems.append(f'planetary 段落库不足: {len(planetary)} 段 {sum(map(len, planetary))} 字符')

    out = {
        'dataset': 'birthstones_and_crystal_lore',
        'version': 'v2',
        'generated': '2026-08-26',
        'source': {
            'work': 'George Frederick Kunz, The Curious Lore of Precious Stones',
            'year': 1913,
            'publisher': 'J.B. Lippincott Company',
            'rights': 'public domain',
            'origin': 'Internet Archive OCR (curiousloreprec00kunz)',
            'note': 'v2 扩容：新增 Sentiments of the Months 十二月表+双诗、'
                    'Crystal Gazing 与 Planetary Astral Influences 两整章段落库',
        },
        'favored_by_month': favored,
        'breastplate_and_foundation': bp_rows,
        'sentiments_of_months': sentiments_out,
        'chapters': {
            'crystal_gazing': {
                'chapter_title': 'On Crystal Balls and Crystal Gazing (Ch VI)',
                'passages': crystal,
            },
            'planetary_and_astral_influences': {
                'chapter_title': 'Planetary and Astral Influences (Ch X)',
                'passages': planetary,
            },
        },
    }
    outp = DATA / 'kunz_birthstones_v2.json'
    outp.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    total = sum(len(p) for p in crystal) + sum(len(p) for p in planetary)
    print(f"kunz v2 mined: months={len(sentiments_out)} verses={sum(1 for m in sentiments_out.values() if m['verses'])} "
          f"crystal={len(crystal)} planetary={len(planetary)} chapters_total={total}ch -> {outp}")
    if problems:
        print('PROBLEMS:')
        for p in problems:
            print('  -', p)
        raise SystemExit(1)


if __name__ == '__main__':
    main()
