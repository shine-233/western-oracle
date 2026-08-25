"""02_mine: 把 Waite 原始 JSON 挖掘为候选数据集（含站点 id 映射）。

sacred-texts 编码规则:
  ar00-ar21  大阿卡纳 (0愚者-21世界)
  {wa|cu|sw|pe}{02-10}   小牌数字牌
  {wa|cu|sw|pe}{ac,ki,kn,pa,qu}  A/王/骑士/侍从/王后

站点 id 规则 (src/data/tarot.ts):
  大牌: fool, magician, high-priestess, ..., world
  小牌: {wands|cups|swords|pentacles}-{ace|2..10|page|knight|queen|king}

输出: data/waite_candidates_v1.json
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CLASSICS = ROOT / 'classics'
DATA = ROOT / 'data'

MAJOR_MAP = {
    'ar00': 'fool', 'ar01': 'magician', 'ar02': 'high-priestess', 'ar03': 'empress',
    'ar04': 'emperor', 'ar05': 'hierophant', 'ar06': 'lovers', 'ar07': 'chariot',
    'ar08': 'strength', 'ar09': 'hermit', 'ar10': 'wheel-of-fortune', 'ar11': 'justice',
    'ar12': 'hanged-man', 'ar13': 'death', 'ar14': 'temperance', 'ar15': 'devil',
    'ar16': 'tower', 'ar17': 'star', 'ar18': 'moon', 'ar19': 'sun',
    'ar20': 'judgement', 'ar21': 'world',
}
SUIT_MAP = {'wa': 'wands', 'cu': 'cups', 'sw': 'swords', 'pe': 'pentacles'}
RANK_MAP = {'ac': 'ace', 'ki': 'king', 'kn': 'knight', 'pa': 'page', 'qu': 'queen'}


def code_to_site_id(code: str) -> str:
    if code in MAJOR_MAP:
        return MAJOR_MAP[code]
    m = code[:2]
    r = code[2:]
    rank = RANK_MAP.get(r, str(int(r)) if r.isdigit() else r)  # 02 -> 2
    return f'{SUIT_MAP[m]}-{rank}'


def normalize(text: str) -> str:
    return ' '.join(text.split())


def main() -> None:
    raw = json.loads((CLASSICS / 'waite_card_data_raw.json').read_text(encoding='utf-8'))
    out = []
    for c in raw['cards']:
        code = c['name_short']
        rec = {
            'site_id': code_to_site_id(code),
            'source_code': code,
            'name': c['name'],
            'arcana': 'major' if code.startswith('ar') else 'minor',
            'meaning_up': normalize(c.get('meaning_up', '')),
            'meaning_rev': normalize(c.get('meaning_rev', '')),
            'description': normalize(c.get('desc', '')),
        }
        out.append(rec)
    DATA.mkdir(parents=True, exist_ok=True)
    outp = DATA / 'waite_candidates_v1.json'
    outp.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'mined {len(out)} candidates -> {outp}')


if __name__ == '__main__':
    main()
