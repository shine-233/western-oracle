"""01_fetch: 拉取西方占卜公版原始文献。

来源清单:
1. Waite《The Pictorial Key to the Tarot》(1911, 公版) 牌意数据
   - 经 ekelen/tarot-api 从 sacred-texts 版本挖掘的 JSON (CC0/开源)
   - -> classics/waite_card_data_raw.json
2. 《盎格鲁-撒克逊卢恩诗》(8-9世纪, Bruce Dickins 1915 英译, 公版)
   - 来源 Wikisource
   - -> classics/rune_poem_anglosaxon_raw.txt (人工核对誊录)

用法: python research/pipeline/01_fetch/dl_sources.py
"""
import json
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CLASSICS = ROOT / 'classics'

TAROT_URL = 'https://raw.githubusercontent.com/ekelen/tarot-api/main/static/card_data.json'


def dl_tarot() -> None:
    out = CLASSICS / 'waite_card_data_raw.json'
    print(f'fetching {TAROT_URL}')
    with urllib.request.urlopen(TAROT_URL, timeout=60) as r:
        data = json.loads(r.read().decode('utf-8'))
    cards = data.get('cards', [])
    assert len(cards) == 78, f'expect 78 cards, got {len(cards)}'
    out.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'  saved {out} ({out.stat().st_size} bytes), 78 cards OK')


def check_rune_poem() -> None:
    """卢恩诗为人工核对誊录（见文件头来源），此处校验完整性。"""
    p = CLASSICS / 'rune_poem_anglosaxon_raw.txt'
    text = p.read_text(encoding='utf-8')
    stanzas = [ln for ln in text.splitlines() if ln.startswith('[')]
    assert len(stanzas) == 29, f'expect 29 stanzas, got {len(stanzas)}'
    print(f'  {p.name}: 29 stanzas OK')


if __name__ == '__main__':
    dl_tarot()
    check_rune_poem()
    print('01_fetch done.')
