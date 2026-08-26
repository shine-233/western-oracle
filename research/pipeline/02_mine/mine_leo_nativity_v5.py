"""02_mine: Alan Leo《How to Judge a Nativity》(1928 ed.) v5（锚点稳健化）。

输入: classics/leo_how_to_judge_nativity_1928_raw.txt (Internet Archive OCR, 公版)
输出: data/leo_nativity_v5.json

v4 → v5 变更:
  moon_in_signs 终点从 v1 的脆弱短语锚点（'Personal Appearance and
  Character'，依赖 40000 字符回退窗口命中）改为外貌章标题行
  （'APPEARANCE AS DENOTED BY THE RISING SIGN'），语义明确、不随
  OCR 断行漂移；同时 norm() 增加小节标题页码剥除，恢复少量被整行
  清除的小节标题文本。内容区间与 v4 相同，无新增区块。

校验:
  1. moon/sun 段长度达标；moon 段尾部为与外貌章的过渡句
  2. 其余全部区块与 v4 一致
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CLASSICS = ROOT / 'classics'
DATA = ROOT / 'data'


def norm(s: str) -> str:
    s = re.sub(
        r"(?m)^[ \t]*[a-z\x27\.]{0,4}[ \t]*\d{0,3}[ \t]*HOW[ \t]+TO[ \t]+JUDGE"
        r"[a-zA-Z\s&\x27\(\)\x18\d\.]{0,32}[ \t]*$", ' ', s)
    s = re.sub(r"(?m)^[ \t]*\d{0,3}[ \t]*[A-Z(][A-Z\s&\x27\d\.(]{5,70}[ \t]*$", ' ', s)
    s = re.sub(r"(?m)^[ \t]*\d{1,4}[ \t]*$", ' ', s)
    s = re.sub(r"(?<=[a-z,;.])\s+\d{1,3}\s+[A-Z][A-Z&\x27\s]{5,55}(?=\s+[a-z])", ' ', s)
    s = re.sub(r"\b\d{1,3}\s+HOW TO JUDGE(?:\s+A?\s*\(?\s*NATIVITY)?\b[\d\s\.]{0,4}", ' ', s)
    s = re.sub(r"\bHOW TO JUDGE(?:\s+A)?\s+NATIVITY\b[\d\s\.]{0,4}", ' ', s)
    return re.sub(r'[ \t]+', ' ', s)


def main() -> None:
    text = (CLASSICS / 'leo_how_to_judge_nativity_1928_raw.txt').read_text(encoding='utf-8')
    problems: list[str] = []

    s_start = text.find('THE SUN IN THE TWELVE SIGNS', 190000)
    m_start = text.find('INFLUENCE OF THE MOON IN THE TWELVE SIGNS', s_start)
    app_a = text.find('APPEARANCE AS DENOTED', m_start if m_start > 0 else 220000)
    assert 0 < s_start < m_start < app_a, f'日月段锚点异常 ({s_start}, {m_start}, {app_a})'

    sun = norm(text[s_start:m_start]).strip()
    moon = norm(text[m_start:app_a]).strip()
    if len(sun) < 15000:
        problems.append(f'sun 段过短: {len(sun)}')
    if len(moon) < 18000:
        problems.append(f'moon 段过短: {len(moon)}')
    if not re.search(r'rising', moon[-600:], re.IGNORECASE):
        problems.append('moon 段尾部缺少与外貌章的过渡句')

    outp_prev = DATA / 'leo_nativity_v4.json'
    v4 = json.loads(outp_prev.read_text(encoding='utf-8'))
    out = dict(v4)
    out.update({
        'version': 'v5',
        'generated': '2026-08-26',
        'source': dict(v4['source'], note='v5 变更：moon_in_signs 终点锚点改用外貌章标题行'
                       '（原为依赖回退窗口的页裂短语，脆弱），norm 增加小节标题页码剥除；'
                       '内容区间与 v4 相同'),
        'sections': dict(v4['sections'], **{
            'sun_in_signs': {'anchor': v4['sections']['sun_in_signs']['anchor'], 'passage': sun},
            'moon_in_signs': {'anchor': v4['sections']['moon_in_signs']['anchor'], 'passage': moon},
        }),
    })

    outp = DATA / 'leo_nativity_v5.json'
    outp.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'leo v5 mined: sun={len(sun)} moon={len(moon)} (v4 moon={len(v4["sections"]["moon_in_signs"]["passage"])}) -> {outp}')
    if problems:
        print('PROBLEMS:')
        for p in problems:
            print('  -', p)
        raise SystemExit(1)


if __name__ == '__main__':
    main()
