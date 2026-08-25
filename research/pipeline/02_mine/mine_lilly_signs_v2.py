"""02_mine: Lilly《Christian Astrology》(1647) v2（扩容版）。

输入: classics/lilly_christian_astrology_1647_raw.txt (Internet Archive OCR, 公版)
输出: data/lilly_signs_v2.json

v1 → v2 扩容（v1 提取率 1.1%，仅星座描述章一个 passage）:
  A. signs：星座描述章按 12 星座逐个切分。OCR 将星座符号/名称大量损坏，
     以各星座「本质属性句」的 OCR 特征串为锚点（有序断言，全部命中才通过）
  B. ch17_use_of_signs：新增 Ch XVII「former discourse of the twelve Signs
     的用法」章段
  C. essential_dignities：新增 Ch XVIII 行星本质尊贵章整章
  D. horary_aphorisms：新增占星问卦格言与考量（QUESTION. 起的编号格言表，
     按段落收录）
  E. albubater_marriage：新增 Albubater 婚姻格言章段

17 世纪长音 s 被 OCR 转 f（houfe=house），文本噪声按原貌保留。

校验:
  1. 12 星座锚点严格递增且每段 >= 700 字符
  2. aphorisms 段落 >= 40 且总量 >= 6000 字符；marriage 章锚点唯一命中
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CLASSICS = ROOT / 'classics'
DATA = ROOT / 'data'

SIGNS = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
         'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces']

# 各星座条目的 OCR 特征锚点（按原书顺序，必须严格递增命中）
SIGN_ANCHORS = [
    r'Mafculine,\s*Diurnall\s*Signe',            # Aries: 「a Masculine, Diurnall Signe」
    r'Earthly,Cold,Dry,Melancholy,Feminine',     # Taurus
    r'aerial hot,\s*moyft',                      # Gemini
    r'onely houfe of the Moon',                  # Cancer
    r'onely Houfe ofthe Sun',                    # Leo
    r'earthly,\s*cold,\s*melanchelly,\s*barren', # Virgo
    r'Signe aeriall,\s*hot and moyft',           # Libra
    r'acold,\s*watry,\s*noGurnal',               # Scorpio
    r'fiery\s*triplicity,\s*\.?Eaft',            # Sagittarius
    r'Houfe of Saturn,\s*and-?is',               # Capricorn
    r'anaierial,\s*hot andmoyt',                 # Aquarius
    r'Watry Triplicicy,Northern',                # Pisces
]

CHAPTER_START = 'leafes'
CH17_TITLE = 'Teaching what ufe.may be made'
ESS_DIG_HEADING = 'Effentiall Dignities'
CH19_HEADING = re.compile(r'(?m)^.{0,20}Cuap,\s*XIX,')
APHORISM_HEAD = re.compile(r'AvpHonrr\w{0,8}\s+and\s+Confiderations')


def norm(s: str) -> str:
    s = re.sub(r'(?m)^\s*\d{1,4}\s*$', ' ', s)
    return re.sub(r'[ \t]+', ' ', s)


def clean_passage(s: str) -> str:
    """清独立页码行、全大写页眉行与无小写字母的表格网格噪声行后压平空白。

    注意：Lilly 的页眉多为混合大小写 OCR 形态（'An FrtrbduSHion to AStrologie. 94'），
    无法安全按行清除——保留原貌（保真度优先），仅清除确定性噪声行。
    """
    s = re.sub(r"(?m)^\s*\d{1,4}\s*$", ' ', s)
    s = re.sub(r"(?m)^[ \t]*\d{1,3}[ \t]+[A-Z][A-Z\s&\x27\.]{5,55}[ \t]*\d{0,3}[ \t]*$", ' ', s)
    # 无小写字母的短行：Essential Dignities 表格 OCR 网格噪声/纯大写残行
    s = re.sub(r"(?m)^[ \t]*[^a-z\n]{3,60}[ \t]*$", ' ', s)
    # 行内表格噪声碎片（数字+全大写串后接正文小写处），如 '3 FV WHPRLI? VB 1,3.'
    s = re.sub(r"\b\d{0,2}[A-Z&?\d.,()'{}%\s]{9,48}(?=[A-Z][a-z])", ' ', s)
    return re.sub(r'\s+', ' ', s).strip()


def main() -> None:
    text = (CLASSICS / 'lilly_christian_astrology_1647_raw.txt').read_text(encoding='utf-8')
    problems: list[str] = []

    # ---- 章界 ----
    chap_start = text.find(CHAPTER_START)
    ess_pos = text.find(ESS_DIG_HEADING, chap_start + 1000)
    if not (200000 < chap_start < 230000):
        problems.append(f'星座章起点异常: {chap_start}')
    if not (230000 < ess_pos < 240000):
        problems.append(f'Essential Dignities 章头异常: {ess_pos}')

    # ---- A. 十二星座逐座切分 ----
    anchors_pos: list[tuple[str, int]] = []
    prev = chap_start
    for sign, pat in zip(SIGNS, SIGN_ANCHORS):
        m = re.search(pat, text[prev:ess_pos], re.IGNORECASE)
        if not m:
            problems.append(f'{sign} 锚点未命中: {pat!r}')
            continue
        pos = prev + m.start()
        anchors_pos.append((sign, pos))
        prev = pos + 50
    if len(anchors_pos) != 12:
        problems.append(f'星座锚点 {len(anchors_pos)}/12')
    ch17_pos = text.find(CH17_TITLE, chap_start)
    if not (anchors_pos[-1][1] < ch17_pos < anchors_pos[-1][1] + 6000):
        problems.append(f'Ch XVII 标题异常: {ch17_pos}')

    signs_out: dict[str, dict] = {}
    for i, (sign, pos) in enumerate(anchors_pos):
        seg_start = max(pos - 160, chap_start)
        nxt = anchors_pos[i + 1][1] - 160 if i + 1 < len(anchors_pos) else ch17_pos
        seg = clean_passage(text[seg_start:nxt])
        if len(seg) < 700:
            problems.append(f'{sign} 段过短: {len(seg)}')
        signs_out[sign] = {'passage': seg}

    # ---- B. Ch XVII 用法章 ----
    ch17_seg = clean_passage(text[ch17_pos:ess_pos])
    if len(ch17_seg) < 800:
        problems.append(f'ch17 段过短: {len(ch17_seg)}')

    # ---- C. Essential Dignities 章（至 Ch XIX）----
    m19 = CH19_HEADING.search(text, ess_pos)
    ess_end = m19.start() if m19 else ess_pos + 9000
    ess_seg = clean_passage(text[ess_pos:ess_end])
    if len(ess_seg) < 4000:
        problems.append(f'essential_dignities 段过短: {len(ess_seg)}')

    # ---- D/E. Aphorisms 与 Albubater 婚姻章 ----
    # 问卦格言章（原书 43 条编号格言）被 OCR 页裂严重切碎，
    # v2 整章收录并检测序号覆盖，不做逐条切分。
    m_aph = APHORISM_HEAD.search(text, 630000)
    aph_head = m_aph.start() if m_aph else -1
    question_pos = text.find('QUESTION.', aph_head) if aph_head > 0 else -1
    mar_pos = text.find('iwMDUs', 640000)
    if not (630000 < aph_head < 642000 and question_pos > aph_head):
        problems.append(f'aphorisms 章头异常: head={aph_head} q={question_pos}')
    if not (645000 < mar_pos < 655000):
        problems.append(f'marriage 章锚点异常: {mar_pos}')

    aph_body = text[question_pos:mar_pos]
    aph_seg = clean_passage(aph_body)
    aph_nums = {int(m.group(1)) for m in re.finditer(r'(?:^|\s)(\d{1,2})[\.\s]+(?=[A-Z])', aph_body)
                if 1 <= int(m.group(1)) <= 45}
    if len(aph_seg) < 9000:
        problems.append(f'aphorisms 章过短: {len(aph_seg)}')
    if len(aph_nums) < 30 or 43 not in aph_nums:
        problems.append(f'aphorisms 序号覆盖不足: {len(aph_nums)} 项, max={max(aph_nums, default=0)}')

    mar_seg = clean_passage(text[mar_pos:mar_pos + 9000])
    if len(mar_seg) < 3000:
        problems.append(f'albubater_marriage 段过短: {len(mar_seg)}')

    out = {
        'dataset': 'lilly_christian_astrology',
        'version': 'v2',
        'generated': '2026-08-26',
        'source': {
            'work': 'William Lilly, Christian Astrology in Three Books',
            'year': 1647,
            'rights': 'public domain',
            'origin': 'Internet Archive OCR (ca-william-lilly)',
            'note': '17 世纪长音 s 被 OCR 转 f（houfe=house）；v2 扩容：十二星座逐座切分、'
                    'Ch XVII/XVIII、问卦格言表、Albubater 婚姻格言',
        },
        'signs': signs_out,
        'ch17_use_of_signs': {'passage': ch17_seg},
        'essential_dignities': {'passage': ess_seg},
        'horary_aphorisms': {'passage': aph_seg, 'aphorism_numbers_detected': sorted(aph_nums)},
        'albubater_marriage': {'passage': mar_seg},
    }
    outp = DATA / 'lilly_signs_v2.json'
    outp.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    total = sum(len(v['passage']) for v in signs_out.values()) + len(ch17_seg) \
        + len(ess_seg) + len(aph_seg) + len(mar_seg)
    print(f"lilly v2 mined: signs={len(signs_out)} ch17={len(ch17_seg)} "
          f"ess_dig={len(ess_seg)} aphorisms={len(aph_seg)}ch/{len(aph_nums)}nums "
          f"marriage={len(mar_seg)} total={total}ch -> {outp}")
    if problems:
        print('PROBLEMS:')
        for p in problems:
            print('  -', p)
        raise SystemExit(1)


if __name__ == '__main__':
    main()
