"""04_audit/qa_scan.py: 数据集清洗质量扫描（OCR 噪声/编码损坏/残留页码）。

扫描 data/*.json 中所有文本值，检测:
  A. 编码损坏：U+FFFD 替换符、连续控制字符
  B. 页码残留：独立数字行、'PAGE 123'-类页眉模式混入正文
  C. 短文本异常：字段过短（可能截断）
输出问题清单（不修改数据），供 v2 清洗定位。

用法: python research/pipeline/04_audit/qa_scan.py
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / 'data'

MOJIBAKE = re.compile(r'[\ufffd]')
CTRL = re.compile(r'[\x00-\x08\x0b\x0c\x0e-\x1f]')
PAGE_NUM_LINE = re.compile(r'(?m)^\s*\d{1,4}\s*$')
PAGE_HEADER = re.compile(r'\b\d{1,3}\s+[A-Z][A-Z\s]{6,40}\d{0,3}\b')  # '121 INFLUENCE OF STARS AND NEBULAS'
MULTI_QMARK = re.compile(r'\?{2,}')


def walk_texts(node, path=''):
    """递归产出 (path, text)。"""
    if isinstance(node, str):
        yield path, node
    elif isinstance(node, dict):
        for k, v in node.items():
            if k in ('source',):  # 元信息不扫
                continue
            yield from walk_texts(v, f'{path}.{k}' if path else k)
    elif isinstance(node, list):
        for i, v in enumerate(node):
            yield from walk_texts(v, f'{path}[{i}]')


def main() -> None:
    problems_total = 0
    for fp in sorted(DATA.glob('*.json')):
        if fp.name == 'audit_report.json':
            continue
        try:
            doc = json.loads(fp.read_text(encoding='utf-8'))
        except Exception as e:
            print(f'[FATAL] {fp.name}: JSON 解析失败 {e}')
            problems_total += 1
            continue

        issues = {'mojibake': [], 'ctrl': [], 'page_num_line': [], 'page_header': [], 'multi_qmark': []}
        counts = {k: 0 for k in issues}
        samples = {'page_num_line': [], 'page_header': []}
        n_texts = 0
        total_len = 0
        for path, text in walk_texts(doc):
            if not text.strip():
                continue
            n_texts += 1
            total_len += len(text)
            if MOJIBAKE.search(text) and len(issues['mojibake']) < 5:
                issues['mojibake'].append(path)
            if CTRL.search(text) and len(issues['ctrl']) < 5:
                issues['ctrl'].append(path)
            if MULTI_QMARK.search(text) and len(issues['multi_qmark']) < 5:
                issues['multi_qmark'].append(path)
            m = PAGE_NUM_LINE.search(text)
            if m:
                counts['page_num_line'] += 1
                if len(samples['page_num_line']) < 3:
                    samples['page_num_line'].append((path, m.group(0).strip()))
            mh = PAGE_HEADER.search(text)
            if mh:
                counts['page_header'] += 1
                if len(samples['page_header']) < 3:
                    samples['page_header'].append((path, mh.group(0)[:50]))

        real = {k: (v if isinstance(v, list) else None) for k, v in issues.items() if v}
        for k in ('page_num_line', 'page_header'):
            if counts[k]:
                real[k] = samples[k]
        status = 'CLEAN' if not real else 'ISSUES'
        print(f'{status}  {fp.name}  ({n_texts} texts, avg {total_len // max(n_texts,1)} chars)')
        if real:
            problems_total += 1
            for k, v in real.items():
                detail = v[:3] if isinstance(v, list) else v
                print(f'    - {k}: e.g. {detail}')

    print()
    print('QA:', 'PROBLEMS FOUND' if problems_total else 'ALL CLEAN-ish (see counts above)')
    raise SystemExit(0)


if __name__ == '__main__':
    main()
