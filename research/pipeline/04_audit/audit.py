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
    runes = json.loads((DATA / 'rune_poem_oe_v1.json').read_text(encoding='utf-8'))
    checks = {
        'count_24': len(runes) == 24,
        'unique': len({r['rune'] for r in runes}) == 24,
        'all_have_oe': all(r['oe_text'].strip() for r in runes),
        'all_have_en': all(r['en_text'].strip() for r in runes),
        'all_have_source': all(r['source'].strip() for r in runes),
    }
    report['rune_poem_oe'] = {'checks': checks, 'pass': all(checks.values())}


def main() -> None:
    report: dict = {'generated': '2026-08-25', 'datasets': {}}
    audit_tarot(report['datasets'])
    audit_runes(report['datasets'])

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
