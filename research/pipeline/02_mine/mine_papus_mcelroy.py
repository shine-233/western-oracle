"""02_mine: 挖掘 Papus《Tarot of the Bohemians》(1892) 占卜释义 + McElroy 公版释义集。

Papus 文本规则:
  小阿卡纳: SUIT 分节；宫廷牌全名 + 数字牌 ACE/TWO/.../TEN（归属当前花色）
  大阿卡纳: "N. The Name signifies MEANING."

McElroy (dariusk/corpora, 作者声明公版):
  {name, rank(1-10|page/knight/queen/king), suit(major|wands|cups|swords|coins),
   keywords[], fortune_telling[], meanings{light[],shadow[]}}

输出: data/papus_candidates_v1.json + data/mcelroy_candidates_v1.json
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CLASSICS = ROOT / 'classics'
DATA = ROOT / 'data'

SUIT_MAP = {'SCEPTRES': 'wands', 'CUPS': 'cups', 'SWORDS': 'swords', 'PENTACLES': 'pentacles'}
COURT_MAP = {'KING': 'king', 'QUEEN': 'queen', 'KNIGHT': 'knight', 'KNAVE': 'page'}
NUM_MAP = {
    'ACE': 'ace', 'TWO': '2', 'THREE': '3', 'FOUR': '4', 'FIVE': '5',
    'SIX': '6', 'SEVEN': '7', 'EIGHT': '8', 'NINE': '9', 'TEN': '10',
}
MAJOR_MAP = {
    1: 'magician', 2: 'high-priestess', 3: 'empress', 4: 'emperor', 5: 'hierophant',
    6: 'lovers', 7: 'chariot', 8: 'justice', 9: 'hermit', 10: 'wheel-of-fortune',
    11: 'strength', 12: 'hanged-man', 13: 'death', 14: 'temperance', 15: 'devil',
    16: 'tower', 17: 'star', 18: 'moon', 19: 'sun', 20: 'judgement', 21: 'fool', 22: 'world',
}
MCELROY_NAME_MAP = {
    'The Fool': 'fool', 'The Magician': 'magician', 'The Papess/High Priestess': 'high-priestess',
    'The Empress': 'empress', 'The Emperor': 'emperor', 'The Pope/Hierophant': 'hierophant',
    'The Lovers': 'lovers', 'The Chariot': 'chariot', 'Justice': 'justice', 'The Hermit': 'hermit',
    'The Wheel of Fortune': 'wheel-of-fortune', 'The Wheel': 'wheel-of-fortune', 'Strength': 'strength', 'The Hanged Man': 'hanged-man',
    'Death': 'death', 'Temperance': 'temperance', 'The Devil': 'devil', 'The Tower': 'tower',
    'The Star': 'star', 'The Moon': 'moon', 'The Sun': 'sun', 'The Last Judgement': 'judgement', 'Judgement': 'judgement',
    'The World': 'world',
}


def norm(t: str) -> str:
    return ' '.join(t.split())


def mine_papus() -> None:
    text = (CLASSICS / 'papus_tob_divinatory_raw.txt').read_text(encoding='utf-8')
    out: list[dict] = []

    # --- 小阿卡纳 ---
    minor_seg = text.split('== SECOND LESSON: MINOR ARCANA ==')[1].split('== THIRD LESSON: MAJOR ARCANA ==')[0]
    suit_segs = re.split(r'^SUIT: (\w+)[^\n]*$', minor_seg, flags=re.M)
    # suit_segs: [前导, SUIT1, 内容1, SUIT2, 内容2, ...]
    for i in range(1, len(suit_segs) - 1, 2):
        suit = SUIT_MAP[suit_segs[i]]
        body = suit_segs[i + 1]
        current_rank: str | None = None
        for line in body.splitlines():
            line = line.strip()
            if not line:
                continue
            m = re.match(r'^(KING|QUEEN|KNIGHT|KNAVE) OF (\w+)\.\s*(.+)$', line, re.I)
            if m:
                current_rank = COURT_MAP[m.group(1).upper()]
                out.append({'site_id': f'{suit}-{current_rank}', 'meaning': norm(m.group(3))})
                continue
            m = re.match(r'^(ACE) OF (\w+)\.\s*(.+)$', line, re.I)
            if m:
                current_rank = 'ace'
                out.append({'site_id': f'{SUIT_MAP[m.group(2).upper()]}-ace', 'meaning': norm(m.group(3))})
                continue
            m = re.match(r'^(TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN)\.\s*(.+)$', line, re.I)
            if m:
                current_rank = NUM_MAP[m.group(1).upper()]
                out.append({'site_id': f'{suit}-{current_rank}', 'meaning': norm(m.group(2))})
                continue
            if current_rank and out:
                out[-1]['meaning'] = norm(out[-1]['meaning'] + ' ' + line)

    # --- 大阿卡纳 ---
    major_seg = text.split('== THIRD LESSON: MAJOR ARCANA ==')[1]
    for line in major_seg.splitlines():
        m = re.match(r'^(\d+)\.\s*(.+?)\s+signifies\s+(.+)$', line.strip(), re.I)
        if m:
            num = int(m.group(1))
            sid = MAJOR_MAP[num]
            out.append({'site_id': sid, 'meaning': norm(m.group(2).rstrip('.'))})

    ids = [o['site_id'] for o in out]
    problems = []
    if len(set(ids)) != 78:
        dup = {x for x in ids if ids.count(x) > 1}
        missing = ({f'{s}-{r}' for s in SUIT_MAP.values() for r in list(NUM_MAP.values()) + list(COURT_MAP.values())}
                   | set(MAJOR_MAP.values())) - set(ids)
        if dup:
            problems.append(f'重复: {sorted(dup)}')
        if missing:
            problems.append(f'缺失: {sorted(missing)}')

    outp = DATA / 'papuus_placeholder.json'
    outp = DATA / 'papus_candidates_v1.json'
    outp.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'papus mined {len(out)}/78 -> {outp}')
    if problems:
        for p in problems:
            print('  -', p)
        raise SystemExit(1)


def mine_mcelroy() -> None:
    raw = json.loads((CLASSICS / 'mcelroy_tarot_raw.json').read_text(encoding='utf-8'))
    out = []
    problems = []
    for c in raw['tarot_interpretations']:
        suit = c['suit']
        rank = c['rank']
        if suit == 'major':
            sid = MCELROY_NAME_MAP.get(c['name'])
            if sid is None:
                problems.append(f"未知大牌名: {c['name']}")
                continue
        else:
            suit = 'pentacles' if suit == 'coins' else suit
            rank_s = 'ace' if rank == 1 else str(rank)
            sid = f'{suit}-{rank_s}'
        out.append({
            'site_id': sid,
            'name': c['name'],
            'keywords': c.get('keywords', []),
            'fortune_telling': c.get('fortune_telling', []),
            'light': c.get('meanings', {}).get('light', []),
            'shadow': c.get('meanings', {}).get('shadow', []),
        })
    ids = [o['site_id'] for o in out]
    if len(set(ids)) != 78:
        problems.append(f'去重后 {len(set(ids))} != 78')

    outp = DATA / 'mcelroy_candidates_v1.json'
    outp.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'mcelroy mined {len(out)}/78 -> {outp}')
    if problems:
        for p in problems:
            print('  -', p)
        raise SystemExit(1)


if __name__ == '__main__':
    mine_papus()
    mine_mcelroy()
