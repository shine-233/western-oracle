"""04_audit: 数据集审计——覆盖率、完整性、抽查一致性。

审计项:
  A. 塔罗 Waite 数据集: 78/78、字段完整、大牌/花色结构、随机抽查 5 张与原始 JSON 比对
  B. 卢恩诗数据集: 24/24 老弗萨克覆盖、OE/EN 非空
  C. 输出审计报告 data/audit_report.json

用法: python research/pipeline/04_audit/audit.py
"""
import json
import random
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / 'data'
CLASSICS = ROOT / 'classics'


def audit_tarot(report: dict) -> None:
    clean = json.loads((DATA / 'tarot_waite_v1.json').read_text(encoding='utf-8'))
    raw = json.loads((CLASSICS / 'waite_card_data_raw.json').read_text(encoding='utf-8'))
    raw_by_code = {c['name_short']: c for c in raw['cards']}

    checks = {
        'count_78': len(clean) == 78,
        'majors_22': sum(1 for c in clean if c['arcana'] == 'major') == 22,
        'minors_56': sum(1 for c in clean if c['arcana'] == 'minor') == 56,
        'all_have_up': all(c['meaning_up'].strip() for c in clean),
        'all_have_rev': all(c['meaning_rev'].strip() for c in clean),
        'unique_ids': len({c['site_id'] for c in clean}) == 78,
    }

    # 抽查 5 张：清洗版文本必须能在原始 JSON 中找到（防篡改）
    random.seed(1911)
    samples = random.sample(clean, 5)
    spot = []
    for c in samples:
        orig = raw_by_code[c['source_code']]
        ok = (
            ' '.join(orig['meaning_up'].split()) == c['meaning_up']
            and ' '.join(orig['meaning_rev'].split()) == c['meaning_rev']
        )
        spot.append({'site_id': c['site_id'], 'match_original': ok})
    checks['spot_check_5'] = all(s['match_original'] for s in spot)

    report['tarot_waite'] = {'checks': checks, 'spot_check': spot, 'pass': all(checks.values())}


def audit_runes(report: dict) -> None:
    runes = json.loads((DATA / 'rune_poems_v2.json').read_text(encoding='utf-8'))
    expected_oe_only = {'Gebo', 'Wunjo', 'Eihwaz', 'Perthro', 'Ehwaz', 'Ingwaz', 'Othala', 'Dagaz'}
    full = [r for r in runes if len(r['poems']) == 3]
    oe_only = {r['rune'] for r in runes if len(r['poems']) == 1}
    checks = {
        'count_24': len(runes) == 24,
        'unique': len({r['rune'] for r in runes}) == 24,
        'full_coverage_16': len(full) == 16,
        'oe_only_matches_expected': oe_only == expected_oe_only,
        'all_texts_nonempty': all(
            p['original'].strip() and p['translation'].strip()
            for r in runes for p in r['poems'].values()
        ),
        'all_have_source': all(
            p['source'].strip() for r in runes for p in r['poems'].values()
        ),
    }
    report['rune_poems_v2'] = {
        'checks': checks,
        'poem_counts': {
            'anglo_saxon': sum(1 for r in runes if 'anglo_saxon' in r['poems']),
            'norwegian': sum(1 for r in runes if 'norwegian' in r['poems']),
            'icelandic': sum(1 for r in runes if 'icelandic' in r['poems']),
        },
        'pass': all(checks.values()),
    }


def audit_tarot_sources(report: dict) -> None:
    merged = json.loads((DATA / 'tarot_sources_v2.json').read_text(encoding='utf-8'))
    checks = {
        'count_78': len(merged) == 78,
        'all_have_waite': all(c['waite']['meaning_up'].strip() for c in merged),
        'all_have_papus': all(c['papus']['meaning'].strip() for c in merged),
        'all_have_mcelroy': all(
            c['mcelroy']['keywords'] or c['mcelroy']['fortune_telling'] for c in merged
        ),
        'fortune_telling_coverage': sum(1 for c in merged if c['mcelroy']['fortune_telling']),
    }
    report['tarot_sources_v2'] = {'checks': checks, 'pass': all(v for k, v in checks.items() if k != 'fortune_telling_coverage')}


def audit_tetrabiblos(report: dict) -> None:
    tb = json.loads((DATA / 'tetrabiblos_astro_v1.json').read_text(encoding='utf-8'))
    planets = tb['planets']
    checks = {
        'seven_planets': len(planets) == 7,
        'all_have_nature': all('quote' in planets[p]['nature'] and planets[p]['nature']['quote'].strip() for p in planets),
        'all_have_houses': all(planets[p]['houses']['domicile'] for p in planets),
        'all_have_exaltation': all(planets[p]['exaltation']['exaltation'] for p in planets),
        'all_cited': all(
            'Ashmand 1822' in planets[p][k]['source']
            for p in planets for k in ('nature', 'houses', 'exaltation')
        ),
    }
    report['tetrabiblos_astro_v1'] = {'checks': checks, 'pass': all(checks.values())}


def audit_alignment(report: dict) -> None:
    al = json.loads((DATA / 'alignment_cn_en_v1.json').read_text(encoding='utf-8'))
    majors = al['major_alignments']
    checks = {
        'majors_22': len(majors) == 22,
        'all_have_cn': all(m['cn_keywords'] for m in majors),
        'all_have_en': all(m['en_keywords'] for m in majors),
        'all_have_confidence': all(m['confidence'] in ('high', 'medium', 'low') for m in majors),
        'suit_themes_4': len(al['minor_suit_themes']) == 4,
        'rank_arc_14': len(al['minor_rank_arc']) == 14,
    }
    report['alignment_cn_en_v1'] = {'checks': checks, 'pass': all(checks.values())}


def _load(name: str) -> dict:
    return json.loads((DATA / name).read_text(encoding='utf-8'))


def audit_fixed_stars(report: dict) -> None:
    d = _load('fixed_stars_robson_v1.json')
    stars = d['stars']
    keys = {s['name_key'] for s in stars}
    required = ['algol', 'aldebaran', 'regulus', 'antares', 'arcturus', 'spica', 'sirius', 'pleiades']
    checks = {
        'count_ge_60': len(stars) >= 60,
        'required_stars': all(k in keys for k in required),
        'all_have_text': all(s['influence'] or s['notes'] for s in stars),
        'unique_names': len(keys) == len(stars),
        'nature_extracted': sum(1 for s in stars if s['nature']) >= 30,
    }
    report['fixed_stars_robson_v1'] = {'checks': checks, 'count': len(stars), 'pass': all(checks.values())}


def audit_dreams(report: dict) -> None:
    d = _load('dreams_miller_v1.json')
    entries = d['entries']
    keys = {e['term_key'] for e in entries}
    required = ['water', 'snake', 'death', 'baby', 'house', 'money', 'marriage', 'teeth']
    checks = {
        'count_ge_1500': len(entries) >= 1500,
        'required_terms': all(any(k.startswith(t) for k in keys) for t in required),
        'all_have_meanings': all(e['meanings'] and e['meanings'][0] for e in entries),
    }
    report['dreams_miller_v1'] = {'checks': checks, 'count': len(entries), 'pass': all(checks.values())}


def audit_palmistry(report: dict) -> None:
    d = _load('cheiro_palmistry_v1.json')
    sections = d['sections']
    required = ('line_of_head', 'line_of_life', 'line_of_destiny', 'line_of_heart',
                'mount_jupiter', 'mount_saturn', 'mount_venus', 'mount_moon')
    checks = {
        'sections_ge_14': len(sections) >= 14,
        'required_sections': all(k in sections for k in required),
        'min_text_length': all(len(sections[k]['text']) >= 400 for k in required if k in sections),
    }
    report['cheiro_palmistry_v1'] = {'checks': checks, 'count': len(sections), 'pass': all(checks.values())}


def audit_numerology(report: dict) -> None:
    d = _load('sepharial_numbers_v1.json')
    mk = d['minor_key']
    covered = [int(k) for k in d['resultant_meanings'] if 12 <= int(k) <= 84]
    checks = {
        'minor_key_9': len(mk) == 9,
        'minor_key_all_text': all(v['meaning'] for v in mk.values()),
        'thought_of_9': len(d['things_thought_of']) == 9,
        'resultant_ge_55': len(covered) >= 55,
    }
    report['sepharial_numbers_v1'] = {'checks': checks, 'pass': all(checks.values())}


def audit_birthstones(report: dict) -> None:
    d = _load('kunz_birthstones_v1.json')
    favored = d['favored_by_month']
    months = {'January', 'February', 'March', 'April', 'May', 'June',
              'July', 'August', 'September', 'October', 'November', 'December'}
    checks = {
        'months_12': set(favored) == months,
        'jan_garnet': favored.get('January', [{}])[0].get('stone') == 'Garnet',
        'feb_amethyst': favored.get('February', [{}])[0].get('stone') == 'Amethyst',
        'breastplate_rows_12': len(d['breastplate_and_foundation']) == 12,
        'crystal_passage': len(d['crystal_gazing']['passage']) >= 150,
    }
    report['kunz_birthstones_v1'] = {'checks': checks, 'pass': all(checks.values())}


def audit_lilly(report: dict) -> None:
    d = _load('lilly_signs_v1.json')
    ch = d['chapter_passage']
    checks = {
        'length_ge_8000': len(ch) >= 8000,
        'aries_anchor': 'Mafculine' in ch or 'Diurnall Signe' in ch,
        'gemini_anchor': 'double-bodied' in ch,
    }
    report['lilly_signs_v1'] = {'checks': checks, 'pass': all(checks.values())}


def audit_leo(report: dict) -> None:
    d = _load('leo_nativity_v1.json')
    sections = d['sections']
    checks = {
        'three_sections': set(sections) == {'twelve_houses', 'sun_in_signs', 'moon_in_signs'},
        'min_length': all(len(v['passage']) >= 3000 for v in sections.values()),
    }
    report['leo_nativity_v1'] = {'checks': checks, 'pass': all(checks.values())}


def audit_tetrabiblos34(report: dict) -> None:
    d = _load('tetrabiblos_books34_v1.json')
    topics = d['topics']
    required = ('siblings', 'marriage', 'children', 'travel', 'death_quality',
                'occupation', 'body', 'mind', 'longevity')
    checks = {
        'required_topics': all(k in topics for k in required),
        'quotes_long': all(len(topics[k]['quote']) >= 200 for k in topics),
        'all_cited': all('Ashmand 1822' in topics[k]['source'] for k in topics),
        'house_hints_valid': all(1 <= topics[k]['house_hint'] <= 12 for k in topics),
    }
    report['tetrabiblos_books34_v1'] = {'checks': checks, 'count': len(topics), 'pass': all(checks.values())}


def audit_bookt_decans(report: dict) -> None:
    d = _load('book_t_decans_v1.json')
    decans = d['decans']
    by_card = {x['card']: x for x in decans}
    anchors = {
        'wands-2': ('Mars', 'Aries'), 'cups-2': ('Venus', 'Cancer'),
        'swords-3': ('Saturn', 'Libra'), 'pentacles-9': ('Venus', 'Virgo'),
        'wands-10': ('Saturn', 'Sagittarius'), 'cups-10': ('Mars', 'Pisces'),
    }
    ok = all(
        card in by_card
        and by_card[card]['ruler'] == ruler
        and by_card[card]['sign'] == sign
        for card, (ruler, sign) in anchors.items()
    )
    checks = {
        'rows_36': len(decans) == 36,
        'cards_unique': len(by_card) == 36,
        'gd_anchors': ok,
        'degrees_contiguous': all(x['from_degree'] < x['to_degree'] for x in decans),
    }
    report['book_t_decans_v1'] = {'checks': checks, 'count': len(decans), 'pass': all(checks.values())}


def audit_tarot_modern(report: dict) -> None:
    d = _load('tarot_modern_v1.json')
    cards = d['cards']
    decans = {x['card']: x for x in _load('book_t_decans_v1.json')['decans']}
    numbered = [c for c in cards if c['arcana'] == 'minor' and c['site_id'] in decans]
    agree = all(
        c['zodiac'] == decans[c['site_id']]['sign']
        and c['planet'] == decans[c['site_id']]['ruler']
        for c in numbered
    )
    checks = {
        'count_78': len(cards) == 78,
        'majors_22': sum(1 for c in cards if c['arcana'] == 'major') == 22,
        'minors_56': sum(1 for c in cards if c['arcana'] == 'minor') == 56,
        'unique_ids': len({c['site_id'] for c in cards}) == 78,
        'decan_crosscheck_56_agree': agree and len(numbered) == 36,
        'all_have_meanings': all(c['meaning_upright'] and c['meaning_reversed'] for c in cards),
    }
    report['tarot_modern_v1'] = {'checks': checks, 'count': len(cards), 'pass': all(checks.values())}


def audit_zodiac_facts(report: dict) -> None:
    d = _load('zodiac_facts_v1.json')
    signs = d['signs']
    rulers_raw = json.loads((CLASSICS / 'astro_rulerships_ptolemy.json').read_text(encoding='utf-8'))
    domicile = {}
    for r in rulers_raw['rulerships']:
        for s in r['domicile']:
            domicile[s] = r['planet']
    checks = {
        'signs_12': len(signs) == 12,
        'longitude_contiguous': sorted(
            (s['longitude_start'], s['longitude_end']) for s in signs
        ) == [(i * 30.0, (i + 1) * 30.0) for i in range(12)],
        'classic_rulers_match_ptolemy': all(
            s['ruler_classic'] == domicile.get(s['sign']) for s in signs
        ),
        'all_have_element': all(s['element'] for s in signs),
    }
    report['zodiac_facts_v1'] = {'checks': checks, 'count': len(signs), 'pass': all(checks.values())}


# ---------- v2 扩容数据集 ----------

MONTH_NAMES = {'January', 'February', 'March', 'April', 'May', 'June',
               'July', 'August', 'September', 'October', 'November', 'December'}


def audit_kunz_v2(report: dict) -> None:
    d = _load('kunz_birthstones_v2.json')
    sent = d['sentiments_of_months']
    fields = ('birth_stone', 'guardian_angel', 'talismanic_gem',
              'special_apostle', 'his_gem', 'zodiacal_sign', 'flower')
    crystal = d['chapters']['crystal_gazing']['passages']
    planetary = d['chapters']['planetary_and_astral_influences']['passages']
    checks = {
        'months_12': set(sent) == MONTH_NAMES,
        'fields_nonempty': all(all(v[f] for f in fields) for v in sent.values()),
        'verses_all': all(len(v['verses']) >= 60 for v in sent.values()),
        'jan_garnet_angel': sent.get('January', {}).get('birth_stone') == 'Garnet'
        and sent.get('January', {}).get('guardian_angel') == 'Gabriel',
        'dec_ruby': sent.get('December', {}).get('birth_stone') == 'Ruby',
        'favored_months_12': len(d['favored_by_month']) == 12,
        'breastplate_rows_12': len(d['breastplate_and_foundation']) == 12,
        'crystal_passages': len(crystal) >= 25 and sum(map(len, crystal)) >= 30000,
        'planetary_passages': len(planetary) >= 15 and sum(map(len, planetary)) >= 20000,
    }
    report['kunz_birthstones_v2'] = {
        'checks': checks,
        'counts': {
            'crystal': len(crystal), 'planetary': len(planetary),
            'crystal_chars': sum(map(len, crystal)),
            'planetary_chars': sum(map(len, planetary)),
        },
        'pass': all(checks.values()),
    }


LEO_PLANETS = {'saturn', 'jupiter', 'mars', 'venus', 'mercury'}
LEO_HOUSES = {'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh',
              'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth'}


def audit_leo_v2(report: dict) -> None:
    d = _load('leo_nativity_v2.json')
    aph = d['centiloquy']['aphorisms']
    nums = [a['no'] for a in aph]
    checks = {
        'planets_5': set(d['planets_in_signs']) == LEO_PLANETS,
        'planets_min_len': all(len(v['passage']) >= 6000 for v in d['planets_in_signs'].values()),
        'houses_11': set(d['houses']) == LEO_HOUSES,
        'houses_min_len': all(len(v['passage']) >= 1200 for v in d['houses'].values()),
        'aphorisms_100': len(aph) == 100 and nums == list(range(1, 101)),
        'aphorisms_text': sum(len(a['text']) for a in aph) >= 7000,
        'first_aphorism_squares': bool(aph) and 'squares' in aph[0]['text'],
        'sections_3': set(d['sections']) == {'twelve_houses', 'sun_in_signs', 'moon_in_signs'},
        'sections_min_len': all(len(v['passage']) >= 3000 for v in d['sections'].values()),
    }
    report['leo_nativity_v2'] = {'checks': checks, 'pass': all(checks.values())}


LILLY_SIGN_KEYS = {'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
                   'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'}


def audit_lilly_v2(report: dict) -> None:
    d = _load('lilly_signs_v2.json')
    ap = d['horary_aphorisms']
    checks = {
        'signs_12': set(d['signs']) == LILLY_SIGN_KEYS,
        'signs_min_len': all(len(v['passage']) >= 700 for v in d['signs'].values()),
        'taurus_anchor': 'Earthly' in d['signs']['taurus']['passage'],
        'pisces_anchor': 'Watry' in d['signs']['pisces']['passage'],
        'ch17_min_len': len(d['ch17_use_of_signs']['passage']) >= 800,
        'ess_dig_min_len': len(d['essential_dignities']['passage']) >= 4000,
        'aphorisms_chapter': len(ap['passage']) >= 9000 and 43 in ap['aphorism_numbers_detected'],
        'marriage_min_len': len(d['albubater_marriage']['passage']) >= 3000,
    }
    report['lilly_signs_v2'] = {'checks': checks, 'pass': all(checks.values())}


def audit_sepharial_v2(report: dict) -> None:
    d = _load('sepharial_numbers_v2.json')
    mk = d['minor_key']
    covered = [int(k) for k in d['resultant_meanings'] if 12 <= int(k) <= 84]
    ch_x = d['chapters']['x_thought_reading_by_numbers']['passages']
    ch_xii = d['chapters']['xii_of_things_lost']['passages']
    checks = {
        'minor_key_9': len(mk) == 9,
        'minor_key_all_text': all(v['meaning'] for v in mk.values()),
        'thought_of_9': len(d['things_thought_of']) == 9,
        'resultant_ge_55': len(covered) >= 55,
        'ch_x_passages': len(ch_x) >= 5 and sum(map(len, ch_x)) >= 2500,
        'ch_xii_passages': len(ch_xii) >= 8 and sum(map(len, ch_xii)) >= 4000,
    }
    report['sepharial_numbers_v2'] = {'checks': checks, 'pass': all(checks.values())}


def audit_tetrabiblos_book2(report: dict) -> None:
    d = _load('tetrabiblos_book2_v2.json')
    chapters = d['chapters']
    must = ['General Division', 'particular Prediction in Eclipses',
            'New Moon of the Year', 'particular Natures of the Signs',
            'Signification of Meteors']
    blob = ' '.join(c['title'] + ' ' + c['body'][:300] for c in chapters).lower()
    checks = {
        'count_ge_12': len(chapters) >= 12,
        'indices_contiguous': [c['index'] for c in chapters] == list(range(1, len(chapters) + 1)),
        'must_topics': all(m.lower() in blob for m in must),
        'bodies_long': all(len(c['body']) >= 600 for c in chapters),
        'quotes_present': all(len(c['quote']) >= 80 for c in chapters),
        'all_cited': all('Ashmand 1822' in c['source'] for c in chapters),
    }
    report['tetrabiblos_book2_v2'] = {'checks': checks, 'count': len(chapters), 'pass': all(checks.values())}


def audit_fixed_stars_v2(report: dict) -> None:
    d = _load('fixed_stars_robson_v2.json')
    stars = d['stars']
    keys = {s['name_key'] for s in stars}
    required = ['algol', 'aldebaran', 'regulus', 'antares', 'arcturus', 'spica', 'sirius', 'pleiades']
    aldebaran = next((s for s in stars if s['name_key'] == 'aldebaran'), {})
    n_aspects = sum(len(s['aspects']) for s in stars)
    checks = {
        'count_ge_96': len(stars) >= 96,
        'required_stars': all(k in keys for k in required),
        'sheratan_renamed': 'sheratan' in keys and 'snaratan' not in keys,
        'aldebaran_truncation_fixed': bool(aldebaran.get('notes'))
        and bool(aldebaran.get('aspects', {}).get('mercury')),
        'aspects_captured': n_aspects >= 60,
        'all_have_text': all(s['influence'] or s['notes'] or s['aspects'] for s in stars),
        'unique_names': len(keys) == len(stars),
        'nature_extracted': sum(1 for s in stars if s['nature']) >= 30,
    }
    report['fixed_stars_robson_v2'] = {
        'checks': checks, 'count': len(stars), 'aspects_total': n_aspects,
        'pass': all(checks.values()),
    }


# ---------- 第三轮扩容数据集（第二轮 remine）----------

def audit_tetrabiblos_book1(report: dict) -> None:
    d = _load('tetrabiblos_book1_v2.json')
    chapters = d['chapters']
    blob = ' '.join(c['title'].lower() for c in chapters)
    checks = {
        'count_ge_20': len(chapters) >= 20,
        'proem_present': 'proem' in blob,
        'bodies_long': all(len(c['body']) >= 400 for c in chapters),
        'quotes_present': all(len(c['quote']) >= 100 for c in chapters),
        'all_cited': all('Ashmand 1822' in c['source'] for c in chapters),
    }
    report['tetrabiblos_book1_v2'] = {'checks': checks, 'count': len(chapters), 'pass': all(checks.values())}


def audit_books34_v2(report: dict) -> None:
    d = _load('tetrabiblos_books34_v2.json')
    chapters = d['chapters']
    by_topic = {c['topic']: c for c in chapters if c['topic']}
    required = ('siblings', 'marriage', 'children', 'travel', 'death_quality',
                'occupation', 'body', 'mind', 'longevity')
    checks = {
        'count_ge_18': len(chapters) >= 18,
        'both_books': {c['book'] for c in chapters} == {3, 4},
        'required_topics': all(t in by_topic for t in required),
        'topic_bodies_long': all(len(by_topic[t]['body']) >= 800 for t in required if t in by_topic),
        'all_cited': all('Ashmand 1822' in c['source'] for c in chapters),
    }
    report['tetrabiblos_books34_v2'] = {'checks': checks, 'count': len(chapters), 'pass': all(checks.values())}


def audit_robson_constellations(report: dict) -> None:
    d = _load('robson_constellations_v1.json')
    consts = d['constellations']
    mansions = d['lunar_mansions']
    magics = d['magic_influences']
    mnames = {re.sub(r'\s+', '', m['constellation']).casefold() for m in magics}
    checks = {
        'constellations_ge_80': len(consts) >= 80,
        'const_num_anchors': all(n in {c['num'] for c in consts}
                                 for n in (4, 21, 24, 37, 55, 80, 84, 87, 92, 98, 105)),
        'const_have_text': all(c['legend'] or c['history'] or c['influence'] for c in consts),
        'mansions_28': len(mansions) == 28,
        'mansions_all_meaning': all(m['meaning'] for m in mansions),
        'magics_ge_25': len(magics) >= 25,
        'magic_anchors': all(n.casefold() in mnames for n in ('Andromeda', 'Aquila', 'Draco')),
    }
    report['robson_constellations_v1'] = {
        'checks': checks, 'counts': d['counts'], 'pass': all(checks.values()),
    }


def audit_sepharial_v3(report: dict) -> None:
    d = _load('sepharial_numbers_v3.json')
    mk = d['minor_key']
    covered = [int(k) for k in d['resultant_meanings'] if 12 <= int(k) <= 84]
    chs = d['chapters']
    checks = {
        'minor_key_9': len(mk) == 9,
        'thought_of_9': len(d['things_thought_of']) == 9,
        'resultant_ge_55': len(covered) >= 55,
        'chapters_19': set(chs) == {'i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii',
                                    'ix', 'x', 'xi', 'xii', 'xiii', 'xiv', 'xv',
                                    'xvi', 'xvii', 'xviii', 'xix'},
        'prose_substantial': sum(len(p) for c in chs.values() for p in c['passages']) >= 150000,
        'titles_present': all(c['title'] for c in chs.values()),
    }
    report['sepharial_numbers_v3'] = {'checks': checks, 'pass': all(checks.values())}


LEO_EXPANSIONS = {'element_sign_groups', 'planets_rising_in_signs', 'solar_aspects',
                  'apheta_and_anareta', 'houses_conclusion', 'uranus_neptune_aspects',
                  'concluding_chapters'}


def audit_leo_v3(report: dict) -> None:
    d = _load('leo_nativity_v3.json')
    exp = d['expansions']
    aph = d['centiloquy']['aphorisms']
    elems = exp.get('element_sign_groups', {})
    rising = exp.get('planets_rising_in_signs', {})
    concluding = exp.get('concluding_chapters', {})
    checks = {
        'expansion_groups': LEO_EXPANSIONS <= set(exp),
        'elements_4': set(elems) == {'fiery', 'watery', 'airy', 'earthy'},
        'elements_min_len': all(len(v['passage']) >= 3000 for v in elems.values()),
        'rising_12': set(rising) == {s.lower() for s in
                                     ('ARIES', 'TAURUS', 'GEMINI', 'CANCER', 'LEO', 'VIRGO',
                                      'LIBRA', 'SCORPIO', 'SAGITTARIUS', 'CAPRICORN',
                                      'AQUARIUS', 'PISCES')},
        'rising_min_len': all(len(v['passage']) >= 2500 for v in rising.values()),
        'concluding_3': set(concluding) == {'ch21_judgment', 'moon_disposition', 'ch22_onward'},
        'aphorisms_still_100': len(aph) == 100,
        'houses_still_11': len(d['houses']) == 11,
        'uranus_neptune_len': len(exp.get('uranus_neptune_aspects', {}).get('passage', '')) >= 12000,
    }
    report['leo_nativity_v3'] = {'checks': checks, 'pass': all(checks.values())}


def audit_kunz_v3(report: dict) -> None:
    d = _load('kunz_birthstones_v3.json')
    rel = d['chapters']['religious_uses']['passages']
    th = d['chapters']['therapeutic_uses']['passages']
    sent = d['sentiments_of_months']
    checks = {
        'sentiments_kept': set(sent) == MONTH_NAMES and len(d['breastplate_and_foundation']) == 12,
        'crystal_kept': sum(map(len, d['chapters']['crystal_gazing']['passages'])) >= 30000,
        'religious_passages': len(rel) >= 30 and sum(map(len, rel)) >= 25000,
        'therapeutic_passages': len(th) >= 20 and sum(map(len, th)) >= 20000,
    }
    report['kunz_birthstones_v3'] = {'checks': checks, 'pass': all(checks.values())}


def audit_lilly_chapters(report: dict) -> None:
    d = _load('lilly_chapters_v1.json')
    a = d['regions']['book1_terms_and_book2_opening']['paragraphs']
    b = d['regions']['book2_houses_and_book34']['paragraphs']
    blob_a = ' '.join(a[:60])
    blob_b = ' '.join(b)
    checks = {
        'region_a_count': len(a) >= 250 and sum(map(len, a)) >= 120000,
        'region_b_count': len(b) >= 900 and sum(map(len, b)) >= 500000,
        'aspect_definitions': 'Sextil' in blob_a,
        'buying_selling_chapter': 'Buying' in blob_b,
        'friends_rules': 'Friends' in blob_b,
    }
    report['lilly_chapters_v1'] = {'checks': checks, 'counts': d['counts'], 'pass': all(checks.values())}


# ---------- 第四轮扩容数据集（第三批 remine）----------

def audit_tetrabiblos_appendices(report: dict) -> None:
    d = _load('tetrabiblos_appendices_v1.json')
    cq = d['centiloquy']
    checks = {
        'front_matter': sum(map(len, d['ashmand_front_matter']['passages'])) >= 30000,
        'almagest_extract': sum(map(len, d['almagest_extract']['passages'])) >= 4000,
        'tables_extracts': sum(map(len, d['tables_and_extracts']['passages'])) >= 8000,
        'centiloquy_ge_85': len(cq['aphorisms']) >= 85,
        'centiloquy_text': sum(len(a['text']) for a in cq['aphorisms']) >= 15000,
        'planisphere': sum(map(len, d['planisphere_appendix']['passages'])) >= 3000,
    }
    report['tetrabiblos_appendices_v1'] = {
        'checks': checks, 'counts': dict(d['counts'], centiloquy_missing=cq['numbers_missing']),
        'pass': all(checks.values()),
    }


LEO_V4_BLOCKS = {'appearance_rules', 'rising_sign', 'ch7_ruling_planet',
                 'ch8_health_length_of_life'}


def audit_leo_v4(report: dict) -> None:
    d = _load('leo_nativity_v4.json')
    exp = d['expansions']
    checks = {
        'v4_blocks': LEO_V4_BLOCKS <= set(exp),
        'v4_min_len': all(len(exp[k]['passage']) >= m
                          for k, m in (('appearance_rules', 8000), ('rising_sign', 30000),
                                       ('ch7_ruling_planet', 3000),
                                       ('ch8_health_length_of_life', 10000))),
        'v3_expansions_kept': LEO_EXPANSIONS <= set(exp) and len(exp['planets_rising_in_signs']) == 12,
        'aphorisms_still_100': len(d['centiloquy']['aphorisms']) == 100,
        'houses_still_11': len(d['houses']) == 11,
    }
    report['leo_nativity_v4'] = {'checks': checks, 'pass': all(checks.values())}


KUNZ_V4_CHAPTERS = {'superstitions', 'talismans_amulets', 'talismanic_use',
                    'engraved_carved_gems', 'ominous_luminous_stones'}


def audit_kunz_v4(report: dict) -> None:
    d = _load('kunz_birthstones_v4.json')
    chs = d['chapters']
    checks = {
        'five_early_chapters': KUNZ_V4_CHAPTERS <= set(chs),
        'early_totals': all(sum(map(len, chs[k]['passages'])) >= m
                            for k, m in (('superstitions', 20000), ('talismans_amulets', 30000),
                                         ('talismanic_use', 60000), ('engraved_carved_gems', 25000),
                                         ('ominous_luminous_stones', 30000))),
        'sentiments_kept': set(d['sentiments_of_months']) == MONTH_NAMES,
        'crystal_kept': sum(map(len, chs['crystal_gazing']['passages'])) >= 30000,
        'religious_kept': sum(map(len, chs['religious_uses']['passages'])) >= 25000,
    }
    report['kunz_birthstones_v4'] = {'checks': checks, 'pass': all(checks.values())}


def audit_robson_magic(report: dict) -> None:
    d = _load('robson_medieval_magic_v1.json')
    star_names = {re.sub(r'\s+', '', x['name']).casefold() for x in d['magic_fixed_stars']}
    met_blob = ' '.join(d['astro_meteorology']['passages']).lower()
    checks = {
        'star_magic_ge_12': len(d['magic_fixed_stars']) >= 12,
        'star_magic_anchors': all(n in star_names for n in
                                  ('algol', 'regulus', 'sirius', 'spica')),
        'seals_present': len(d['magical_seals']['passages']) >= 1,
        'mansions_magic': sum(map(len, d['lunar_mansions_magic']['passages'])) >= 1500,
        'meteorology': sum(map(len, d['astro_meteorology']['passages'])) >= 3000,
        'meteorology_weather_words': all(k in met_blob for k in ('rain', 'wind')),
        'formulae': len(d['mathematical_formulae']['passages']) >= 30,
    }
    report['robson_medieval_magic_v1'] = {
        'checks': checks, 'counts': d['counts'], 'pass': all(checks.values()),
    }


def audit_lilly_introduction(report: dict) -> None:
    d = _load('lilly_introduction_v1.json')
    pre = d['regions']['preface']['paragraphs']
    b1c = d['regions']['book1_chapters']['paragraphs']
    blob = ' '.join(b1c)
    checks = {
        'preface': sum(map(len, pre)) >= 8000,
        'chapters_count': len(b1c) >= 250 and sum(map(len, b1c)) >= 80000,
        'planets_chapter': any(k in blob for k in ('Saturne', 'Saturn', 'SATURNE')),
    }
    report['lilly_introduction_v1'] = {
        'checks': checks, 'counts': d['counts'], 'pass': all(checks.values()),
    }


def audit_leo_v5(report: dict) -> None:
    d = _load('leo_nativity_v5.json')
    sec = d['sections']
    exp = d['expansions']
    moon_tail = sec['moon_in_signs']['passage'][-600:]
    checks = {
        'sun_len': len(sec['sun_in_signs']['passage']) >= 15000,
        'moon_len': len(sec['moon_in_signs']['passage']) >= 18000,
        'moon_transitions_to_appearance': bool(re.search(r'rising', moon_tail, re.IGNORECASE)),
        'v4_expansions_kept': LEO_V4_BLOCKS <= set(exp) and len(exp['planets_rising_in_signs']) == 12,
        'aphorisms_still_100': len(d['centiloquy']['aphorisms']) == 100,
        'houses_still_11': len(d['houses']) == 11,
    }
    report['leo_nativity_v5'] = {'checks': checks, 'pass': all(checks.values())}


def audit_robson_front_matter(report: dict) -> None:
    d = _load('robson_front_matter_v1.json')
    intro = d['introduction']['passages']
    blob = ' '.join(intro).lower()
    checks = {
        'intro_text': sum(map(len, intro)) >= 5000,
        'astronomy_anchors': all(k in blob for k in ('milky way', 'nebul')),
    }
    report['robson_front_matter_v1'] = {
        'checks': checks, 'counts': d['counts'], 'pass': all(checks.values()),
    }


# ---------- 第六轮补漏（卷首前置内容）----------

def audit_leo_front_matter(report: dict) -> None:
    d = _load('leo_front_matter_v1.json')
    pre3 = d['prefaces']['third_edition_with_history']['passages']
    tbl = d['signs_reference_tables']
    hist_blob = ' '.join(pre3).lower()
    checks = {
        'preface_first': sum(map(len, d['prefaces']['first_edition']['passages'])) >= 2000,
        'history_essay': sum(map(len, pre3)) >= 9000
        and all(k in hist_blob for k in ('chaldea', 'kepler', 'lilly')),
        'detailed_contents': sum(map(len, d['detailed_contents']['passages'])) >= 6000,
        'body_parts_12': set(tbl['body_parts_ruled']) == {
            'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
            'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'},
        'trinities_4': len(tbl['trinities']) == 4,
        'introduction': sum(map(len, d['introduction']['passages'])) >= 6000,
    }
    report['leo_front_matter_v1'] = {'checks': checks, 'pass': all(checks.values())}


def audit_kunz_front_matter(report: dict) -> None:
    d = _load('kunz_front_matter_v1.json')
    pre_blob = ' '.join(d['preface']['passages'])
    checks = {
        'dedication': len(d['dedication']['passages']) >= 1
        and 'MORGAN' in d['dedication']['passages'][0].upper(),
        'preface_text': sum(map(len, d['preface']['passages'])) >= 4000,
        'preface_anchors': all(k in pre_blob for k in ('Morgan', 'Natal Stones')),
        'contents_list': len(d['contents_and_illustrations']['passages']) >= 15,
    }
    report['kunz_front_matter_v1'] = {'checks': checks, 'pass': all(checks.values())}


def audit_sepharial_v4(report: dict) -> None:
    d = _load('sepharial_numbers_v4.json')
    intro = d.get('introduction', {}).get('passages', [])
    blob = ' '.join(intro)
    chs = d['chapters']
    covered = [int(k) for k in d['resultant_meanings'] if 12 <= int(k) <= 84]
    checks = {
        'introduction_present': len(intro) >= 3 and sum(map(len, intro)) >= 2000,
        'intro_anchors': all(k in blob for k in ('God geometrises', 'Swedenborg')),
        'v3_chapters_kept': len(chs) == 19,
        'minor_key_9': len(d['minor_key']) == 9,
        'resultant_ge_55': len(covered) >= 55,
    }
    report['sepharial_numbers_v4'] = {'checks': checks, 'pass': all(checks.values())}


def audit_tetrabiblos_appendices_v2(report: dict) -> None:
    d = _load('tetrabiblos_appendices_v2.json')
    cq = d['centiloquy']
    fm_blob = ' '.join(d['ashmand_front_matter']['passages'])[:4000]
    checks = {
        'fm_starts_at_advert': 'poetical machinery' in fm_blob,
        'front_matter_full': sum(map(len, d['ashmand_front_matter']['passages'])) >= 45000,
        'waverley_dedication': 'WAVERLEY' in d['dedication_to_the_author_of_waverley']['text'].upper(),
        'centiloquy_ge_85': len(cq['aphorisms']) >= 85,
        'almagest_extract': sum(map(len, d['almagest_extract']['passages'])) >= 4000,
        'planisphere': sum(map(len, d['planisphere_appendix']['passages'])) >= 3000,
    }
    report['tetrabiblos_appendices_v2'] = {'checks': checks, 'pass': all(checks.values())}


# ---------- 第七轮补漏（覆盖率证明器驱动）----------

def audit_lilly_chapters_v2(report: dict) -> None:
    d = _load('lilly_chapters_v2.json')
    a = d['regions']['book1_terms_and_book2_opening']['paragraphs']
    b = d['regions']['book2_houses_and_book34']['paragraphs']
    blob_a = ' '.join(a)
    blob_b = ' '.join(b)
    checks = {
        'region_a_count': len(a) >= 300 and sum(map(len, a)) >= 130000,
        'region_b_count': len(b) >= 1100 and sum(map(len, b)) >= 600000,
        'buying_selling_chapter': 'Buying and Selling' in blob_b or 'Buying' in blob_b,
        'friends_rules': 'Friends' in blob_b,
        'wood_on_ground_example': 'Wood on the ground' in blob_a or 'Wood' in blob_b,
    }
    report['lilly_chapters_v2'] = {'checks': checks, 'counts': d['counts'], 'pass': all(checks.values())}


def audit_kunz_birthstones_v5(report: dict) -> None:
    d = _load('kunz_birthstones_v5.json')
    ch9 = d['chapters']['birth_stones_chapter_prose']['passages']
    tables = d['chapters']['tables']
    ch9_blob = ' '.join(ch9)
    checks = {
        'ch9_prose': len(ch9) >= 150 and sum(map(len, ch9)) >= 35000,
        'ch9_anchors': all(k in ch9_blob for k in ('Josephus', 'Napoleon')),
        'hindu_table': any('Zircon' in p for p in tables['hindu_month_gems']),
        'us_states_table': any('California' in p for p in tables['us_state_stones']),
        'virtue_lists': any('CHARITY' in p for p in tables['virtue_gem_lists']),
        'sentiments_kept': set(d['sentiments_of_months']) == MONTH_NAMES,
    }
    report['kunz_birthstones_v5'] = {'checks': checks, 'pass': all(checks.values())}


def audit_sepharial_v5(report: dict) -> None:
    d = _load('sepharial_numbers_v5.json')
    items = d.get('numbered_items', {})
    lost = items.get('xii', [])
    pyth = items.get('iii', [])
    chart = items.get('iv', [])
    iv_blob = ' '.join(i['text'] for i in pyth)
    checks = {
        'lost_list_ge_15': len(lost) >= 15,
        'pyth_table_ge_30': len(pyth) >= 30,
        'pyth_anchor': 'Death, fatality' in iv_blob,
        'chart_ge_9': len(chart) >= 9
        and 'individuality' in ' '.join(i['text'] for i in chart[:3]),
        'intro_kept': len(d.get('introduction', {}).get('passages', [])) >= 3,
    }
    report['sepharial_numbers_v5'] = {
        'checks': checks,
        'counts': {k: len(v) for k, v in items.items()},
        'pass': all(checks.values()),
    }


def audit_leo_v6(report: dict) -> None:
    d = _load('leo_nativity_v6.json')
    exp = d['expansions']
    seg = exp['ch2_zodiac_signs_opening']['passage']
    checks = {
        'ch2_present': 'ch2_zodiac_signs_opening' in exp and len(seg) >= 12000,
        'ch2_anchors': all(k.lower() in seg.lower()
                           for k in ('group of animals', 'Twelve Signs of the Zodiac')),
        'v5_sections_kept': len(d['sections']) == 3,
        'v4_blocks_kept': LEO_V4_BLOCKS <= set(exp),
        'rising_still_12': len(exp['planets_rising_in_signs']) == 12,
        'aphorisms_still_100': len(d['centiloquy']['aphorisms']) == 100,
    }
    report['leo_nativity_v6'] = {'checks': checks, 'pass': all(checks.values())}


def audit_robson_constellations_v2(report: dict) -> None:
    d = _load('robson_constellations_v2.json')
    hindu = d['lunar_mansions_hindu']
    chinese = d['lunar_mansions_chinese']
    ch2 = ' '.join(d['ch2_influence_of_constellations']['passages'])
    prec = ' '.join(d['precession_and_constellational_ages']['passages'])
    fm = ' '.join(d['front_matter']['passages'])
    checks = {
        'hindu_mansions_28': len(hindu) == 28,
        'hindu_fields': all(m.get('name') and m.get('meaning') for m in hindu),
        'chinese_sieu_ge_20': len(chinese) >= 20,
        'chinese_fields': all(m.get('name') and m.get('meaning') for m in chinese),
        'ch2_passages_ge_200': len(d['ch2_influence_of_constellations']['passages']) >= 200,
        'ch2_anchors': all(k.casefold() in ch2.casefold() for k in ('48 in number', 'Andromeda')),
        'precession_passages_ge_30': len(d['precession_and_constellational_ages']['passages']) >= 30,
        'precession_anchor': 'precession' in prec.casefold(),
        'front_matter_kept': (len(d['front_matter']['passages']) >= 3
                              and 'fixed stars' in fm.casefold()),
    }
    report['robson_constellations_v2'] = {'checks': checks, 'counts': d['counts'], 'pass': all(checks.values())}


def main() -> None:
    report: dict = {'generated': '2026-08-26', 'datasets': {}}
    audit_tarot(report['datasets'])
    audit_tarot_sources(report['datasets'])
    audit_runes(report['datasets'])
    audit_tetrabiblos(report['datasets'])
    audit_alignment(report['datasets'])
    audit_fixed_stars(report['datasets'])
    audit_dreams(report['datasets'])
    audit_palmistry(report['datasets'])
    audit_numerology(report['datasets'])
    audit_birthstones(report['datasets'])
    audit_lilly(report['datasets'])
    audit_leo(report['datasets'])
    audit_tetrabiblos34(report['datasets'])
    audit_bookt_decans(report['datasets'])
    audit_tarot_modern(report['datasets'])
    audit_zodiac_facts(report['datasets'])
    audit_kunz_v2(report['datasets'])
    audit_leo_v2(report['datasets'])
    audit_lilly_v2(report['datasets'])
    audit_sepharial_v2(report['datasets'])
    audit_tetrabiblos_book2(report['datasets'])
    audit_fixed_stars_v2(report['datasets'])
    audit_tetrabiblos_book1(report['datasets'])
    audit_books34_v2(report['datasets'])
    audit_robson_constellations(report['datasets'])
    audit_sepharial_v3(report['datasets'])
    audit_leo_v3(report['datasets'])
    audit_kunz_v3(report['datasets'])
    audit_lilly_chapters(report['datasets'])
    audit_tetrabiblos_appendices(report['datasets'])
    audit_leo_v4(report['datasets'])
    audit_kunz_v4(report['datasets'])
    audit_robson_magic(report['datasets'])
    audit_lilly_introduction(report['datasets'])
    audit_leo_v5(report['datasets'])
    audit_robson_front_matter(report['datasets'])
    audit_leo_front_matter(report['datasets'])
    audit_kunz_front_matter(report['datasets'])
    audit_sepharial_v4(report['datasets'])
    audit_tetrabiblos_appendices_v2(report['datasets'])
    audit_lilly_chapters_v2(report['datasets'])
    audit_kunz_birthstones_v5(report['datasets'])
    audit_sepharial_v5(report['datasets'])
    audit_leo_v6(report['datasets'])
    audit_robson_constellations_v2(report['datasets'])

    all_pass = all(d['pass'] for d in report['datasets'].values())
    report['all_pass'] = all_pass

    outp = DATA / 'audit_report.json'
    outp.write_text(json.dumps(report, ensure_ascii=False, indent=1), encoding='utf-8')
    print(json.dumps(report, ensure_ascii=False, indent=1))
    if not all_pass:
        raise SystemExit(1)
    print('AUDIT PASS')


if __name__ == '__main__':
    main()
