"""02_mine: Robson《The Fixed Stars and Constellations in Astrology》1923
Medieval Magic 章与星陨气象学 v1（第三轮扩容）。

输入: classics/robson_fixed_stars_1923_raw.txt (Internet Archive OCR, 公版)
输出: data/robson_medieval_magic_v1.json

robson_constellations_v1 只收了魔法章的星座效应清单；本文件补齐该章其余：
  A. magic_fixed_stars：Magical Influences of Fixed Stars 编号清单
  B. seals：The Magical Seals of the Fixed Stars 说明文字
  C. mansions_magic：Magical Influence of Arabic Lunar Mansions 清单/说明
  D. astro_meteorology：Chapter VIII「The Fixed Stars in Astro-Meteorology」
     （恒星天象气象效应，占星天气预测核心内容）
  E. formulae：书末数学公式组

校验: 各区块锚点存在且文本量达标；astro_meteorology 含 weather 类锚词。
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
    s = re.sub(r"\b\d{1,3}\s+FIXED\s+STARS(?:\s+AND)?(?:\s+CONSTELLATIONS)?\.?[^\na-z]{0,6}", ' ', s)
    return re.sub(r'\s+', ' ', s).strip()


def passages(seg: str, min_len: int = 120) -> list[str]:
    out = []
    for p in re.split(r'\n\s*\n', seg):
        p = norm(p)
        if len(p) >= min_len:
            out.append(p)
    return out


def parse_star_magic(seg: str) -> list[dict]:
    """恒星魔法条目：'N. Name.' + Rules(石/草) + Image(形象与效应) 三段式。"""
    starts = [m for m in re.finditer(r"(?m)^([ \t]*\d{1,3}[ \t]*\.[ \t]+[A-Za-z][^\n]{1,40})$", seg)]
    out = []
    for i, m in enumerate(starts):
        nxt = starts[i + 1].start() if i + 1 < len(starts) else len(seg)
        head = m.group(1).strip()
        num_m = re.match(r'(\d{1,3})\s*\.\s*(.+?)\s*\.?\s*$', head)
        if not num_m:
            continue
        name = num_m.group(2)
        if not re.fullmatch(r"[A-Za-z][A-Za-z'\- ]{1,38}", name):
            continue
        body = seg[m.end():nxt]
        # 图版页/页眉噪声截断
        for marker in ('STARS IN MEDIAEVAL MAGIC', 'THE MAGICAL SEALS',
                       'FIXED STARS AND CONSTELLATIONS', 'MEDIAEVAL MAGIC'):
            idx = body.find(marker)
            if idx > 0:
                body = body[:idx]
        rules_m = re.search(r'Rules[\.:]\s*(.*?)(?=Image[\.:]|$)', body, re.S)
        image_m = re.search(r'(?:Image|Iinage|linage)[\.:]\s*(.*)$', body, re.S)
        rules = norm(rules_m.group(1)).strip(' .') if rules_m else ''
        image = norm(image_m.group(1)).strip() if image_m else ''
        if not (rules or image):
            continue
        out.append({'num': int(num_m.group(1)), 'name': name,
                    'rules': rules[:300], 'image_effect': image[:900]})
    return out


# 已知 OCR 星名损坏 → 通行名；印章图版页含正确拼写可作上下文证据
MAGIC_NAME_FIXES = {
    'amebaran': ('Aldebaran', 'ALDEBARA'),
    'alcol': ('Algol', 'Algol'),
    'algorah': ('Algorab', 'Algorab'),
    'akcturus': ('Arcturus', 'Arcturus'),
    'capeixa': ('Capella', 'Capella'),
}


def main() -> None:
    text = (CLASSICS / 'robson_fixed_stars_1923_raw.txt').read_text(encoding='utf-8')
    problems: list[str] = []

    mm = text.find('MEDIEVAL MAGIC')
    a_const = text.find('MAGICAL INFLUENCE OF CONSTELLATIONS', mm)
    a_stars = text.find('MAGICAL INFLUENCES OF FIXED STARS', mm)
    a_seals = text.find('THE MAGICAL SEALS OF THE FIXED STARS', mm)
    a_mans = text.find('MAGICAL INFLUENCE OF ARABIC LUNAR', mm)
    ch8 = text.find('CHAPTER VIII', mm + 10000)
    met_title = text.find('THE FIXED STARS IN ASTRO-METEOROLOGY', mm)
    form = text.find('MATHEMATICAL FORMULAE', met_title if met_title > 0 else mm)
    assert all(x > 0 for x in (mm, a_const, a_stars, a_seals, a_mans, ch8, met_title, form)), \
        '魔法章锚点缺失'
    end = len(text)

    # 星座魔法清单被印章图版页从中间打断，实际延伸至月宿魔法章前
    star_magic = parse_star_magic(text[a_stars:a_mans])
    seen: dict[str, dict] = {}
    for x in star_magic:
        k = re.sub(r'\s+', '', x['name']).casefold()
        fix = MAGIC_NAME_FIXES.get(k)
        if fix and fix[1] in text[a_stars:a_seals + 1500]:
            x['name'] = fix[0]
            k = re.sub(r'\s+', '', fix[0]).casefold()
        if k not in seen or len(x['image_effect']) > len(seen[k]['image_effect']):
            seen[k] = x
    star_magic = sorted(seen.values(), key=lambda x: x['num'])

    seals = passages(text[a_seals:a_stars + 1400], min_len=60)
    mansions_magic = passages(text[a_mans:ch8])
    meteorology = passages(text[met_title:form], min_len=100)
    formulae = passages(text[form:end], min_len=100)

    if len(star_magic) < 12:
        problems.append(f'magic_fixed_stars 仅 {len(star_magic)} (<12)')
    fixed_names = {re.sub(r"\s+", "", x["name"]).casefold() for x in star_magic}
    if not {'aldebaran', 'algol', 'arcturus'} <= fixed_names:
        problems.append(f'星名归一失败: {sorted(fixed_names)[:8]}')
    # 印章节正文极少（主体为图版），仅保留说明文字，不作量断言
    if sum(map(len, mansions_magic)) < 1500:
        problems.append(f'mansions_magic 过短: {sum(map(len, mansions_magic))}')
    if sum(map(len, meteorology)) < 3000:
        problems.append(f'astro_meteorology 过短: {sum(map(len, meteorology))}')
    blob = ' '.join(meteorology).lower()
    for kw in ('rain', 'wind'):
        if kw not in blob:
            problems.append(f'meteorology 缺锚词 {kw!r}')
    total = sum(len(x['rules']) + len(x['image_effect']) for x in star_magic) \
        + sum(map(len, seals)) + sum(map(len, mansions_magic)) \
        + sum(map(len, meteorology)) + sum(map(len, formulae))

    out = {
        'dataset': 'robson_medieval_magic_and_meteorology',
        'version': 'v1',
        'generated': '2026-08-26',
        'source': {
            'work': "Vivian E. Robson, The Fixed Stars and Constellations in Astrology",
            'year': 1923,
            'publisher': 'Cecil Palmer, London',
            'rights': 'public domain',
            'origin': 'Internet Archive OCR (in.ernet.dli.2015.128091)',
            'note': 'Medieval Magic 章（恒星魔法效应/魔法印记/月宿魔法）与 '
                    'Astro-Meteorology 章（恒星气象效应）、数学公式组；'
                    '星座效应清单见 robson_constellations_v1.json',
        },
        'counts': {
            'magic_fixed_stars': len(star_magic),
            'seals_passages': len(seals),
            'mansions_magic_passages': len(mansions_magic),
            'meteorology_passages': len(meteorology),
            'formulae_passages': len(formulae),
        },
        'magic_fixed_stars': star_magic,
        'magical_seals': {'passages': seals},
        'lunar_mansions_magic': {'passages': mansions_magic},
        'astro_meteorology': {'passages': meteorology},
        'mathematical_formulae': {'passages': formulae},
    }
    outp = DATA / 'robson_medieval_magic_v1.json'
    outp.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f"robson magic mined: stars={len(star_magic)} seals={len(seals)}P "
          f"mans={len(mansions_magic)}P meteor={len(meteorology)}P form={len(formulae)}P "
          f"text={total}ch -> {outp}")
    if problems:
        print('PROBLEMS:')
        for p in problems:
            print('  -', p)
        raise SystemExit(1)


if __name__ == '__main__':
    main()
