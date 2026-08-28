"""01_fetch: 拉取西方占卜公版原始文献。

来源清单:
1. Waite《The Pictorial Key to the Tarot》(1911, 公版) 牌意数据
   - 经 ekelen/tarot-api 从 sacred-texts 版本挖掘的 JSON (CC0/开源)
   - -> classics/waite_card_data_raw.json
2. 《盎格鲁-撒克逊卢恩诗》(8-9世纪, Bruce Dickins 1915 英译, 公版)
   - 来源 Wikisource
   - -> classics/rune_poem_anglosaxon_raw.txt (人工核对誊录)
3. Robson《The Fixed Stars and Constellations in Astrology》(1923, 公版)
   - Internet Archive OCR (in.ernet.dli.2015.128091)
   - -> classics/robson_fixed_stars_1923_raw.txt
4. Lilly《Christian Astrology》(1647, 公版)
   - Internet Archive OCR (ca-william-lilly)
   - -> classics/lilly_christian_astrology_1647_raw.txt
5. Alan Leo《How to Judge a Nativity》(1928 ed., 公版)
   - Internet Archive OCR (howtojudgenativi00leoa)
   - -> classics/leo_how_to_judge_nativity_1928_raw.txt
6. Miller《Ten Thousand Dreams Interpreted》(1901, 公版)
   - Project Gutenberg eBook #926
   - -> classics/miller_ten_thousand_dreams_raw.txt
7. Kunz《The Curious Lore of Precious Stones》(1913, 公版)
   - Internet Archive OCR (curiousloreprec00kunz)
   - -> classics/kunz_curious_lore_precious_stones_1913_raw.txt
8. Cheiro《Palmistry for All》(1916, 公版)
   - Project Gutenberg eBook #20480
   - -> classics/cheiro_palmistry_for_all_1916_raw.txt
9. Sepharial《The Kabala of Numbers》(约1911, 公版)
   - Internet Archive OCR (TheKabalaOfNumbers)
   - -> classics/sepharial_kabala_of_numbers_raw.txt
10. Ptolemy《Tetrabiblos》全书 (Ashmand 1822 英译, 公版)
   - Internet Archive OCR (ptolemys-tetrabiblos-j-m-ashmand)
   - -> classics/tetrabiblos_ashmand_full_1822_raw.txt

注:
- Papus/McElroy/挪威冰岛卢恩诗三份 raw 由 mine_papus_mcelroy.py / clean_runes.py
  的历史会话人工核对录入，暂无自动拉取源（见 research/README.md「复现方式」）。

用法: python research/pipeline/01_fetch/dl_sources.py [--only waite,tarot]
"""
import json
import sys
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CLASSICS = ROOT / 'classics'

TAROT_URL = 'https://raw.githubusercontent.com/ekelen/tarot-api/main/static/card_data.json'
UA = {'User-Agent': 'Mozilla/5.0 (western-oracle research corpus fetch)'}

# SSRF 加固：来源 URL 一律写死且只允许 https + 下列公版文献站点
ALLOWED_HOSTS = {'raw.githubusercontent.com', 'archive.org', 'www.gutenberg.org'}


def open_source(url: str, timeout: int):
    parts = urllib.parse.urlsplit(url)
    if parts.scheme != 'https' or parts.hostname not in ALLOWED_HOSTS:
        raise ValueError(f'non-allowlisted source URL blocked: {url}')
    req = urllib.request.Request(url, headers=UA)
    return urllib.request.urlopen(req, timeout=timeout)

# (文件名, URL, 最小字节数, 内容锚点之一)
SOURCES = [
    ('robson_fixed_stars_1923_raw.txt',
     'https://archive.org/download/in.ernet.dli.2015.128091/2015.128091.The-Fixed-Stars-And-Constellations-In-Astrology_djvu.txt',
     100_000, 'ROBSON'),
    ('lilly_christian_astrology_1647_raw.txt',
     'https://archive.org/download/ca-william-lilly/CA_William_Lilly__djvu.txt',
     500_000, 'houfe'),
    ('leo_how_to_judge_nativity_1928_raw.txt',
     'https://archive.org/download/howtojudgenativi00leoa/howtojudgenativi00leoa_djvu.txt',
     300_000, 'horoscope'),
    ('miller_ten_thousand_dreams_raw.txt',
     'https://www.gutenberg.org/cache/epub/926/pg926.txt',
     400_000, 'dream'),
    ('kunz_curious_lore_precious_stones_1913_raw.txt',
     'https://archive.org/download/curiousloreprec00kunz/curiousloreprec00kunz_djvu.txt',
     300_000, 'stones'),
    ('cheiro_palmistry_for_all_1916_raw.txt',
     'https://www.gutenberg.org/cache/epub/20480/pg20480.txt',
     150_000, 'palmistry'),
    ('sepharial_kabala_of_numbers_raw.txt',
     'https://archive.org/download/TheKabalaOfNumbers/Sepharial-the-Kabala-of-Numbers_djvu.txt',
     120_000, 'numbers'),
    ('tetrabiblos_ashmand_full_1822_raw.txt',
     'https://archive.org/download/ptolemys-tetrabiblos-j-m-ashmand/Ptolemys%20Tetrabiblos%20-%20J%20M%20Ashmand_djvu.txt',
     250_000, 'Tetrabiblos'),
    ('tarotoo_cards_mirrored.json',
     'https://raw.githubusercontent.com/Tarotoo-com/tarotoo-tarot-dataset/main/data/cards.json',
     100_000, 'The Fool'),
    ('corpora_zodiac_cc0_raw.json',
     'https://raw.githubusercontent.com/dariusk/corpora/master/data/divination/zodiac.json',
     5_000, 'western_zodiac'),
]

MANUAL_FILES = {
    'rune_poem_anglosaxon_raw.txt': 5_000,
    'rune_poems_norwegian_icelandic_raw.txt': 4_000,
    'papus_tob_divinatory_raw.txt': 3_000,
}


def dl_tarot() -> None:
    out = CLASSICS / 'waite_card_data_raw.json'
    if out.exists() and out.stat().st_size >= 50_000:
        print(f'SKIP {out.name} (exists, {out.stat().st_size} bytes)')
        return
    print(f'fetching {TAROT_URL}')
    with open_source(TAROT_URL, timeout=60) as r:
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


def fetch(name: str, url: str, min_bytes: int, anchor: str) -> None:
    out = CLASSICS / name
    if out.exists() and out.stat().st_size >= min_bytes:
        print(f'SKIP {name} (exists, {out.stat().st_size} bytes)')
        return
    print(f'fetching {url}')
    with open_source(url, timeout=300) as r:
        content = r.read()
    assert len(content) >= min_bytes, f'{name}: {len(content)} bytes < {min_bytes}'
    text = content.decode('utf-8', errors='replace')
    assert anchor.casefold() in text[:200_000].casefold(), f'{name}: anchor {anchor!r} missing'
    out.write_text(text, encoding='utf-8')
    print(f'  saved {out} ({out.stat().st_size} bytes)')


def main(argv: list[str]) -> None:
    only = None
    if len(argv) > 1 and argv[1] == '--only':
        only = set(argv[2].split(','))

    if only is None or 'waite' in only or 'tarot' in only:
        dl_tarot()
    check_rune_poem()

    for item in SOURCES:
        name = item[0].split('.')[0] if False else item[0]
        key = name.replace('_raw.txt', '')
        if only is not None and key not in only:
            continue
        fetch(*item)

    # 人工誊录文件存在性校验
    for fname, min_bytes in MANUAL_FILES.items():
        p = CLASSICS / fname
        assert p.exists() and p.stat().st_size >= min_bytes, f'missing manual file {fname}'
        print(f'  manual file OK: {fname}')

    print('01_fetch done.')


if __name__ == '__main__':
    main(sys.argv)
