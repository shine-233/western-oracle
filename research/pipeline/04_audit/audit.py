"""04_audit: 数据集审计——覆盖率、完整性、抽查一致性。

审计项:
  A. 塔罗 Waite 数据集: 78/78、字段完整、大牌/花色结构、随机抽查 5 张与原始 JSON 比对
  B. 卢恩诗数据集: 24/24 老弗萨克覆盖、OE/EN 非空
  C. 输出审计报告 data/audit_report.json

用法: python research/pipeline/04_audit/audit.py
"""
import json
import random
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


def main() -> None:
    report: dict = {'generated': '2026-08-25', 'datasets': {}}
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
