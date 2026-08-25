"""04_audit/fidelity_check.py: 文本保真度抽查——数据集条目必须能在原始文献中找到。

方法：
  对每个 OCR 源数据集，确定性地抽样若干条目（seed 固定），
  把条目文本切成词块（chunk），归一化空白后在原始文献全文中查找。
  页眉清除等清洗会在原文中留下"空洞"，故按块命中率 >= 70% 判定通过，
  且要求至少命中一个块（防止整段张冠李戴）。

覆盖：fixed_stars(v1+v2) / dreams_miller / cheiro_palmistry / sepharial_numbers(v1+v2) /
      leo_nativity(v1+v2) / lilly_signs(v1+v2) / tetrabiblos_books34 + book2 / kunz_birthstones(v1+v2)
（tarot_modern、book_t_decans、zodiac_facts 为结构化来源，已由 audit.py 锚点交叉验证。）

用法: python research/pipeline/04_audit/fidelity_check.py   （不过则退出码 1）
"""
import json
import random
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / 'data'
CLASSICS = ROOT / 'classics'

THRESHOLD = 0.70


def norm(s: str) -> str:
    return re.sub(r'\s+', ' ', s).strip()


def make_chunks(s: str, words_per: int = 10) -> list[str]:
    """小粒度分块：跨清洗空洞的块只损失个别块，不拖垮整条命中率。"""
    words = s.split()
    out = [' '.join(words[i:i + words_per]) for i in range(0, len(words), words_per)]
    return [c for c in out if len(c) >= 25]


def hit_rate(needle_chunks: list[str], haystack: str) -> float:
    if not needle_chunks:
        return 1.0
    hits = sum(1 for c in needle_chunks if c in haystack)
    return hits / len(needle_chunks)


class Fidelity:
    def __init__(self) -> None:
        self.problems: list[str] = []
        self.checked = 0

    def check(self, label: str, text: str, raw_text: str, min_len: int = 60) -> None:
        self.checked += 1
        t = norm(text)
        if len(t) < min_len:
            return
        chunks = make_chunks(t)
        rate = hit_rate(chunks, norm(raw_text))
        # 超短字段（<=2 块）常整体骑在页眉空洞上，命中 >=1 块即可证明忠实
        ok = rate >= THRESHOLD or (len(chunks) <= 2 and rate > 0)
        if not ok:
            self.problems.append(f'{label}: 命中率 {rate:.0%} ({len(chunks)} chunks)')


def main() -> None:
    rng = random.Random(1901)
    f = Fidelity()

    def load_raw(name: str) -> str:
        return (CLASSICS / name).read_text(encoding='utf-8')

    # --- fixed stars ---
    raw = load_raw('robson_fixed_stars_1923_raw.txt')
    d = json.loads((DATA / 'fixed_stars_robson_v1.json').read_text(encoding='utf-8'))
    for s in rng.sample(d['stars'], 18):
        for field in ('influence', 'notes', 'with_sun', 'culminating'):
            if s[field]:
                f.check(f"fixed_stars[{s['name']}].{field}", s[field], raw)

    # --- dreams ---
    raw = load_raw('miller_ten_thousand_dreams_raw.txt')
    d = json.loads((DATA / 'dreams_miller_v1.json').read_text(encoding='utf-8'))
    for e in rng.sample(d['entries'], 45):
        for m in e['meanings'][:2]:
            f.check(f"dreams[{e['term']}]", m, raw, min_len=50)

    # --- palmistry ---
    raw = load_raw('cheiro_palmistry_for_all_1916_raw.txt')
    d = json.loads((DATA / 'cheiro_palmistry_v1.json').read_text(encoding='utf-8'))
    for key, sec in d['sections'].items():
        seg = sec['text'][400:1400] if len(sec['text']) > 1400 else sec['text']
        f.check(f'palmistry[{key}]', seg, raw)

    # --- sepharial ---
    raw = load_raw('sepharial_kabala_of_numbers_raw.txt')
    d = json.loads((DATA / 'sepharial_numbers_v1.json').read_text(encoding='utf-8'))
    res_keys = sorted(d['resultant_meanings'], key=int)
    for k in rng.sample(res_keys, min(16, len(res_keys))):
        f.check(f'sepharial[resultant {k}]', d['resultant_meanings'][k], raw, min_len=40)
    for k, v in list(d['things_thought_of'].items())[:9]:
        f.check(f'sepharial[thought {k}]', v, raw, min_len=30)

    # --- leo / lilly ---
    raw = load_raw('leo_how_to_judge_nativity_1928_raw.txt')
    d = json.loads((DATA / 'leo_nativity_v1.json').read_text(encoding='utf-8'))
    for key, sec in d['sections'].items():
        mid = sec['passage'][len(sec['passage']) // 3:]
        f.check(f'leo[{key}]', mid[:2500], raw)

    raw = load_raw('lilly_christian_astrology_1647_raw.txt')
    d = json.loads((DATA / 'lilly_signs_v1.json').read_text(encoding='utf-8'))
    ch = d['chapter_passage']
    for i in range(0, len(ch) - 600, 900):
        f.check(f'lilly[chunk@{i}]', ch[i:i + 450], raw)

    # --- tetrabiblos b34 ---
    raw = load_raw('tetrabiblos_ashmand_full_1822_raw.txt')
    d = json.loads((DATA / 'tetrabiblos_books34_v1.json').read_text(encoding='utf-8'))
    for topic, v in d['topics'].items():
        f.check(f'tetrabiblos34[{topic}]', v['quote'], raw, min_len=100)

    # --- kunz（票数表逐月核对原文存在 "Stone N" 形式，含已知 OCR 拼写替身）---
    raw = load_raw('kunz_curious_lore_precious_stones_1913_raw.txt')
    d = json.loads((DATA / 'kunz_birthstones_v1.json').read_text(encoding='utf-8'))
    flat = norm(raw)
    RAW_SPELLING = {
        'Pearl': r"pear\]?",
        "Cat's-eye": r"eat[\u2019']s-eye",
        'Chalcedony': r"chal[ce]edony",
    }
    for month, stones in d['favored_by_month'].items():
        for x in stones[:3]:
            pat = RAW_SPELLING.get(x['stone'], re.escape(x['stone']))
            if not re.search(rf"{pat}\s*,?\s*{x['count']}\b", flat, re.IGNORECASE):
                f.problems.append(f"kunz[{month}]: '{x['stone']} {x['count']}' 未在原文命中")

    # --- kunz v2（章节段落库 + 月度诗文）---
    d = json.loads((DATA / 'kunz_birthstones_v2.json').read_text(encoding='utf-8'))
    for ch_key in ('crystal_gazing', 'planetary_and_astral_influences'):
        pas = d['chapters'][ch_key]['passages']
        for p in rng.sample(pas, min(6, len(pas))):
            f.check(f'kunz_v2[{ch_key}]', p, raw)
    for month, entry in sorted(d['sentiments_of_months'].items()):
        f.check(f'kunz_v2[verse {month}]', entry['verses'], raw, min_len=60)

    # --- leo v2（行星章/宫位段/Centiloquy 条目）---
    raw = load_raw('leo_how_to_judge_nativity_1928_raw.txt')
    d = json.loads((DATA / 'leo_nativity_v2.json').read_text(encoding='utf-8'))
    for key, sec in d['planets_in_signs'].items():
        mid = sec['passage'][len(sec['passage']) // 3:]
        f.check(f'leo_v2[{key}]', mid[:2500], raw)
    for key, h in list(d['houses'].items())[:11]:
        mid = h['passage'][len(h['passage']) // 4:][:1800]
        f.check(f'leo_v2[house {key}]', mid, raw)
    for a in rng.sample(d['centiloquy']['aphorisms'], 12):
        f.check(f"leo_v2[aph {a['no']}]", a['text'], raw, min_len=40)

    # --- lilly v2（星座段/Essential Dignities/格言章/婚姻章）---
    raw = load_raw('lilly_christian_astrology_1647_raw.txt')
    d = json.loads((DATA / 'lilly_signs_v2.json').read_text(encoding='utf-8'))
    for key, sgn in d['signs'].items():
        mid = sgn['passage'][len(sgn['passage']) // 3:][:1500]
        f.check(f'lilly_v2[{key}]', mid, raw)
    f.check('lilly_v2[ess_dig]', d['essential_dignities']['passage'][500:2500], raw)
    f.check('lilly_v2[aphorisms]', d['horary_aphorisms']['passage'][3000:5500], raw)
    f.check('lilly_v2[marriage]', d['albubater_marriage']['passage'][1000:3200], raw)

    # --- sepharial v2（Ch X/XII 段落）---
    raw = load_raw('sepharial_kabala_of_numbers_raw.txt')
    d = json.loads((DATA / 'sepharial_numbers_v2.json').read_text(encoding='utf-8'))
    for ch_key in ('x_thought_reading_by_numbers', 'xii_of_things_lost'):
        for p in rng.sample(d['chapters'][ch_key]['passages'],
                            min(3, len(d['chapters'][ch_key]['passages']))):
            f.check(f'sepharial_v2[{ch_key}]', p, raw)

    # --- tetrabiblos Book II（quote + body 中段）---
    raw = load_raw('tetrabiblos_ashmand_full_1822_raw.txt')
    d = json.loads((DATA / 'tetrabiblos_book2_v2.json').read_text(encoding='utf-8'))
    for c in rng.sample(d['chapters'], min(6, len(d['chapters']))):
        f.check(f"tet_b2[{c['index']}].quote", c['quote'], raw, min_len=120)
        body_mid = c['body'][len(c['body']) // 2:]
        f.check(f"tet_b2[{c['index']}].body", body_mid[:2000], raw)

    # --- robson v2（influence/notes/aspects 抽样）---
    raw = load_raw('robson_fixed_stars_1923_raw.txt')
    d = json.loads((DATA / 'fixed_stars_robson_v2.json').read_text(encoding='utf-8'))
    for s in rng.sample(d['stars'], 18):
        for field in ('influence', 'notes', 'with_sun', 'culminating'):
            if s[field]:
                f.check(f"fixed_stars_v2[{s['name']}].{field}", s[field], raw)
        for ak, av in list(s['aspects'].items())[:2]:
            f.check(f"fixed_stars_v2[{s['name']}].aspects.{ak}", av, raw)

    print(f'fidelity checked: {f.checked} samples')
    if f.problems:
        print(f'PROBLEMS ({len(f.problems)}):')
        for p in f.problems:
            print('  -', p)
        raise SystemExit(1)
    print('FIDELITY PASS')


if __name__ == '__main__':
    main()
