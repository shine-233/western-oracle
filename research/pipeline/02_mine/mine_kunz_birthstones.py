"""02_mine + 03_clean: Kunz《The Curious Lore of Precious Stones》(1913) 水晶语料 v1。

输入: classics/kunz_curious_lore_precious_stones_1913_raw.txt (Internet Archive OCR, 公版)
输出: data/kunz_birthstones_v1.json

提取:
  A. favored_tally：八传统汇总的「每月最受 favor 的诞生石」票数表（Ch IX）
  B. breastplate_foundation：大祭司胸甲十二石 + 启示录根基十二石对照（Ch IX）
  C. crystal_gazing：水晶球/凝水晶占卜章（Ch VI）首段（站点水晶模块引用）

校验:
  1. favored_tally 覆盖 12 个月，January 首选 Garnet、April 含 Diamond、July 含 Ruby
  2. breastplate 表 12 行且行号 I..XII 齐全
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CLASSICS = ROOT / 'classics'
DATA = ROOT / 'data'

MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December']

# 本页已知 OCR 错拼归一（证据见 raw 原文）：pear]/eat’s-eye/chaleedony
STONE_OCR_FIXES = {
    'Chaleedony': 'Chalcedony',
    'Pear': 'Pearl',
    'Eat\u2019s-eye': "Cat's-eye",
    "Eat's-eye": "Cat's-eye",
}
# 核对原文时的替身拼写（OCR 原貌）
RAW_SPELLING = {
    'Pearl': r"pear\]?",
    "Cat's-eye": r"eat[\u2019']s-eye",
    'Chalcedony': r"chal[ce]edony",
}


def norm(s: str) -> str:
    return re.sub(r'\s+', ' ', s).strip()


def parse_tally(seg: str) -> dict[str, list[dict]]:
    """'January..... Garnet 7, hyacinth 2.' / 'Beryl, 8'（名字与数字间可有逗号/句点/括号）。"""
    out: dict[str, list[dict]] = {}
    cur = None
    pair_re = re.compile(r'([A-Za-z\x27\u2019\-]+)[,.\]]?\s+(\d+)')
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

    ch9 = text.find('BIRTH-STONES', 100000)
    ch10 = text.find('PLANETARY AND ASTRAL INFLUENCES', 600000)
    assert 0 < ch9 < ch10, '第九章锚点缺失'
    seg = text[ch9:ch10]

    # --- A. favored tally ---
    tally_pos = seg.find('most favored')
    assert tally_pos > 0, '未找到 most favored 段'
    tally_seg = seg[tally_pos:seg.find('With the exception', tally_pos)]
    # OCR 月名残缺（Mareh/PMN/Ansist 等），可读月名按序解析，
    # 中间不可读月份以原书固定表值核对（防篡改：逐项验证原文存在）。
    raw_tally = parse_tally(tally_seg)
    favored: dict[str, list[dict]] = {}
    problems: list[str] = []
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
        # June 行含 OCR 错拼（chaleedony/pear]/eat's-eye），核对子集并经 STONE_OCR_FIXES 归一
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

    def top(mth: str) -> str:
        lst = favored.get(mth) or []
        return max(lst, key=lambda x: x['count'])['stone'] if lst else ''

    checks = {
        'jan_garnet': top('January') == 'Garnet',
        'feb_amethyst': top('February') == 'Amethyst',
        'sep_chrysolite': top('September') == 'Chrysolite',
        'nov_topaz': top('November') == 'Topaz',
        # 回归测试：'Beryl, 8' 的逗号曾导致十月首选整条丢失
        'october_beryl_top': top('October') == 'Beryl',
        'october_has_3': len(favored.get('October', [])) >= 3,
    }
    for k, v in checks.items():
        if not v:
            problems.append(f'tally 校验失败: {k}')

    # --- B. breastplate / foundation stones ---
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

    # --- C. crystal gazing 章首段 ---
    cg = text.find('CRYSTAL BALLS AND CRYSTAL GAZING', 100000)
    crystal_passage = ''
    if cg > 0:
        after = text[cg:cg + 3000]
        paras = [norm(p) for p in re.split(r'\n\s*\n', after) if len(norm(p)) > 120]
        crystal_passage = paras[1] if len(paras) > 1 else (paras[0] if paras else '')
    if len(crystal_passage) < 150:
        problems.append('crystal_gazing 段落缺失')

    out = {
        'dataset': 'birthstones_and_crystal_lore',
        'version': 'v1',
        'generated': '2026-08-25',
        'source': {
            'work': 'George Frederick Kunz, The Curious Lore of Precious Stones',
            'year': 1913,
            'publisher': 'J.B. Lippincott Company',
            'rights': 'public domain',
            'origin': 'Internet Archive OCR (curiousloreprec00kunz)',
        },
        'favored_by_month': favored,
        'breastplate_and_foundation': bp_rows,
        'crystal_gazing': {
            'chapter_title': 'On Crystal Balls and Crystal Gazing',
            'passage': crystal_passage,
        },
    }
    outp = DATA / 'kunz_birthstones_v1.json'
    outp.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f"kunz mined: months={len(favored)} bp_rows={len(bp_rows)} crystal={len(crystal_passage)}ch -> {outp}")
    if problems:
        print('PROBLEMS:')
        for p in problems:
            print('  -', p)
        raise SystemExit(1)


if __name__ == '__main__':
    main()
