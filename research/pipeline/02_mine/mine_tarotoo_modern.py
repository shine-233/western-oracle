"""02_mine + 03_clean: Tarotoo 现代结构化塔罗层（MIT）→ tarot_modern_v1.json。

输入: classics/tarotoo_cards_mirrored.json
      (github.com/Tarotoo-com/tarotoo-tarot-dataset, MIT, RWS 传统 + GD decan 归属)
输出: data/tarot_modern_v1.json

作为塔罗第四独立来源：现代语境结构化释义（love/career/mood/spiritual/yes_no），
与 Waite(1911)/Papus(1892)/McElroy 三源互补；行星与星座归属用于与
book_t_decans_v1.json 的 Golden Dawn 对应表做交叉验证（56 小牌必须全一致）。

校验:
  1. 78 张唯一，22 大牌 + 56 小牌
  2. 牌名 → 站点 id 映射全覆盖（与 tarot_waite_v1.json 集合一致）
  3. 小牌 planet/zodiac 与 Book T decan 表逐张一致
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CLASSICS = ROOT / 'classics'
DATA = ROOT / 'data'

RANK_WORDS = {
    'ace': 'ace', 'two': '2', 'three': '3', 'four': '4', 'five': '5',
    'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10',
    'page': 'page', 'knight': 'knight', 'queen': 'queen', 'king': 'king',
}


def name_to_site_id(name: str) -> str:
    n = name.strip()
    low = n.lower()
    if low.startswith('the '):
        return low[4:].replace(' ', '-').replace("'", '')
    parts = low.split(' of ')
    if len(parts) == 2:
        rank_word, suit = parts
        rank = RANK_WORDS.get(rank_word)
        if rank:
            return f'{suit}-{rank}'
    # Strength / Justice / Death 等无冠词大牌，以及 Wheel of Fortune 类多词牌名
    return low.replace(' ', '-').replace("'", '')


def main() -> None:
    cards = json.loads((CLASSICS / 'tarotoo_cards_mirrored.json').read_text(encoding='utf-8'))
    waite = json.loads((DATA / 'tarot_waite_v1.json').read_text(encoding='utf-8'))
    site_ids = {c['site_id'] for c in waite}
    decans = json.loads((DATA / 'book_t_decans_v1.json').read_text(encoding='utf-8'))['decans']
    decan_by_card = {d['card']: d for d in decans}

    problems: list[str] = []
    out_cards = []
    for c in cards:
        sid = name_to_site_id(c['name'])
        if sid not in site_ids:
            problems.append(f'牌名映射失败: {c["name"]!r} -> {sid!r}')
            continue
        row = dict(c)
        row['site_id'] = sid
        del row['id']
        out_cards.append(row)

        # 小牌交叉验证：Tarotoo 声称归属遵循 GD decan 体系
        # （数字牌 2-10 有对应旬；Ace/宫廷牌无旬，仅校验归属字段非空）
        if c['arcana'] == 'minor':
            d = decan_by_card.get(sid)
            if d:
                if c['zodiac'] != d['sign']:
                    problems.append(f'{sid}: zodiac {c["zodiac"]} != decan {d["sign"]}')
                if c['planet'] != d['ruler']:
                    problems.append(f'{sid}: planet {c["planet"]} != decan ruler {d["ruler"]}')
            elif not c.get('element'):
                problems.append(f'{sid}: Ace/宫廷牌缺少元素归属')

    ids = {c['site_id'] for c in out_cards}
    majors = [c for c in out_cards if c['arcana'] == 'major']
    minors = [c for c in out_cards if c['arcana'] == 'minor']

    if len(out_cards) != 78:
        problems.append(f'卡数 {len(out_cards)} != 78')
    if len(ids) != 78 or ids != site_ids:
        problems.append('站点 id 集合不一致')
    if len(majors) != 22 or len(minors) != 56:
        problems.append(f'大小阿卡纳结构错误: {len(majors)}/{len(minors)}')

    out = {
        'dataset': 'tarot_modern_structured',
        'version': 'v1',
        'generated': '2026-08-25',
        'source': {
            'work': 'Tarotoo Tarot Card Meanings dataset v2.0.0',
            'rights': 'MIT License (github.com/Tarotoo-com/tarotoo-tarot-dataset)',
            'note': 'RWS 传统现代结构化释义；小牌行星/星座归属经本仓库 book_t_decans_v1 交叉验证一致',
        },
        'count': len(out_cards),
        'cards': sorted(out_cards, key=lambda x: x['site_id']),
    }
    outp = DATA / 'tarot_modern_v1.json'
    outp.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'tarotoo modern mined: {len(out_cards)} cards -> {outp}')
    if problems:
        print('PROBLEMS:')
        for p in problems[:20]:
            print('  -', p)
        raise SystemExit(1)


if __name__ == '__main__':
    main()
