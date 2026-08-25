"""curated + validate: Golden Dawn《Book T》十度分金（Decans）对应表 v1。

输出: data/book_t_decans_v1.json

方法（同 astro_rulerships_ptolemy.json 的 curated 先例）：
  - 十度守护按 Chaldean 行星序（Saturn-Jupiter-Mars-Sun-Venus-Mercury-Moon）
    自白羊第一旬起循环，程序化生成，杜绝手抄错位；
  - 每旬的塔罗小牌（同元素星座三元组）与《Book T》"Lord of ..." 称号人工对照录入；
  - 内置锚点校验：与通行 Golden Dawn 对应表抽查一致（2W=Mars/Aries、3S=Saturn/Libra、
    9P=Venus/Virgo、10S=Sun/Gemini 等）。

校验不过则 exit 1。
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / 'data'

CHALDEAN = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon']
SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
         'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']

# Book T：每花色占其元素三元组（自基本宫起，按黄道序回绕），牌阶 2-10 顺次对应三星座的 d1-d3
SUIT_TRIPLETS = [
    ('wands', 'fire', ['Aries', 'Leo', 'Sagittarius']),
    ('cups', 'water', ['Cancer', 'Scorpio', 'Pisces']),
    ('swords', 'air', ['Libra', 'Aquarius', 'Gemini']),
    ('pentacles', 'earth', ['Capricorn', 'Taurus', 'Virgo']),
]

# Book T "Lord of ..." 称号（card -> title）
TITLES = {
    'wands-2': 'Dominion', 'wands-3': 'Established Strength', 'wands-4': 'Perfected Work',
    'wands-5': 'Strife', 'wands-6': 'Victory', 'wands-7': 'Valour',
    'wands-8': 'Swiftness', 'wands-9': 'Great Strength', 'wands-10': 'Oppression',
    'cups-2': 'Love', 'cups-3': 'Abundance', 'cups-4': 'Luxury',
    'cups-5': 'Disappointment', 'cups-6': 'Pleasure', 'cups-7': 'Illusionary Success',
    'cups-8': 'Indolence', 'cups-9': 'Material Happiness', 'cups-10': 'Perpetual Success',
    'swords-2': 'Peace Restored', 'swords-3': 'Sorrow', 'swords-4': 'Rest from Strife',
    'swords-5': 'Defeat', 'swords-6': 'Earned Success', 'swords-7': 'Unstable Effort',
    'swords-8': 'Shortened Force', 'swords-9': 'Despair and Cruelty', 'swords-10': 'Ruin',
    'pentacles-2': 'Harmonious Change', 'pentacles-3': 'Material Works', 'pentacles-4': 'Earthly Power',
    'pentacles-5': 'Material Trouble', 'pentacles-6': 'Material Success', 'pentacles-7': 'Success Unfulfilled',
    'pentacles-8': 'Prudence', 'pentacles-9': 'Material Gain', 'pentacles-10': 'Wealth',
}


def main() -> None:
    decans = []
    for si, sign in enumerate(SIGNS):
        for d in range(3):
            g = si * 3 + d  # 全局旬序号 0..35（纯黄道序，与花色无关）
            ruler = CHALDEAN[(g + 2) % 7]  # g0=Aries d1=Mars（Chaldean[2]）
            for suit, element, triplet in SUIT_TRIPLETS:
                if sign in triplet:
                    rank = triplet.index(sign) * 3 + d + 2
                    card = f'{suit}-{rank}'
                    break
            else:
                raise AssertionError(f'{sign} 未归属任何三元组')
            decans.append({
                'sign': sign,
                'decan': d + 1,
                'from_degree': d * 10,
                'to_degree': (d + 1) * 10,
                'ruler': ruler,
                'card': card,
                'element': element,
                'gd_title': f"Lord of {TITLES[card]}",
            })

    problems: list[str] = []
    # 结构校验
    if len(decans) != 36:
        problems.append(f'行数 {len(decans)} != 36')
    if len({x['card'] for x in decans}) != 36:
        problems.append('牌卡不唯一')
    for sign in SIGNS:
        rows = [x for x in decans if x['sign'] == sign]
        if [r['from_degree'] for r in rows] != [0, 10, 20]:
            problems.append(f'{sign} 度数区间不连续')

    # 锚点抽查：与通行 Golden Dawn 对应表比对（防序列错位）
    anchors = {
        ('Aries', 1): ('Mars', 'wands-2'),
        ('Taurus', 1): ('Mercury', 'pentacles-5'),
        ('Gemini', 3): ('Sun', 'swords-10'),
        ('Cancer', 1): ('Venus', 'cups-2'),
        ('Leo', 3): ('Mars', 'wands-7'),
        ('Virgo', 2): ('Venus', 'pentacles-9'),
        ('Libra', 2): ('Saturn', 'swords-3'),
        ('Scorpio', 3): ('Venus', 'cups-7'),
        ('Sagittarius', 3): ('Saturn', 'wands-10'),
        ('Capricorn', 1): ('Jupiter', 'pentacles-2'),
        ('Pisces', 3): ('Mars', 'cups-10'),
    }
    by_key = {(x['sign'], x['decan']): x for x in decans}
    for key, (ruler, card) in anchors.items():
        row = by_key.get(key)
        if not row or row['ruler'] != ruler or row['card'] != card:
            got = (row['ruler'], row['card']) if row else None
            problems.append(f'锚点不符 {key}: 期望 ({ruler},{card}) 实得 {got}')

    out = {
        'dataset': 'golden_dawn_decans',
        'version': 'v1',
        'generated': '2026-08-25',
        'source': {
            'work': 'Golden Dawn, Book T \u2013 The Tarot (c. 1892 manuscript)',
            'rights': 'public domain (original manuscript)',
            'method': '十度守护由 Chaldean 序列程序化生成；称号与牌卡对应人工对照录入',
            'note': 'roadmap 中「Golden Dawn Book T 占星对应」项落地；站点塔罗/占星可交叉引用',
        },
        'count': len(decans),
        'decans': decans,
    }
    outp = DATA / 'book_t_decans_v1.json'
    outp.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'book t decans: {len(decans)} rows -> {outp}')
    if problems:
        print('PROBLEMS:')
        for p in problems:
            print('  -', p)
        raise SystemExit(1)


if __name__ == '__main__':
    main()
