# 西方占卜研究层 · Western Oracle Research

对标 `../bazi-research` 的方法论：**公版原始文献 → 编号流水线（抓取/挖掘/清洗/审计）→ 版本化数据集 → 站点消费**。
本目录是 western-oracle 网站的数据研究层，所有语料均为公有领域（public domain）。

## 目录结构

```
research/
├── classics/                  # 原始文献层（raw，不手改内容）
│   ├── waite_card_data_raw.json        # Waite《The Pictorial Key to the Tarot》1911 牌意（78张）
│   ├── rune_poem_anglosaxon_raw.txt    # 盎格鲁-撒克逊卢恩诗（29节，OE原文+Dickins 1915英译）
│   └── astro_rulerships_ptolemy.json   # 传统行星守护表（源自 Ptolemy《Tetrabiblos》体系，curated）
├── pipeline/
│   ├── 01_fetch/dl_sources.py          # 拉取/校验原始文献
│   ├── 02_mine/mine_waite.py           # 编码映射（sacred-texts码 → 站点id）+ 文本规范化
│   ├── 03_clean/clean_tarot.py         # 清洗：78张结构校验/去重/空值/与站点id集合对齐
│   ├── 03_clean/clean_runes.py         # 清洗：29节→24老弗萨克映射/覆盖校验
│   └── 04_audit/
│       ├── audit.py                    # 审计：覆盖率/完整性/防篡改抽查(5张与原始JSON比对)
│       └── export_ts.py                # 导出站点 TS 模块（研究数据喂给网站）
└── data/                      # 版本化数据集（v1, v2, ... 只增不改）
    ├── waite_candidates_v1.json        # 挖掘候选
    ├── tarot_waite_v1.json             # 清洗后 Waite 牌意（78张）
    ├── rune_poem_oe_v1.json            # 清洗后卢恩诗对照（24符文）
    └── audit_report.json               # 审计报告
```

## 数据字典

### tarot_waite_v1.json
| 字段 | 类型 | 说明 |
|---|---|---|
| site_id | string | 站点牌 id（如 `fool`、`wands-ace`），与 `src/data/tarot.ts` 一致 |
| source_code | string | sacred-texts 原始编码（如 `ar00`、`waac`） |
| name | string | Waite 原书牌名（英文） |
| arcana | `major`/`minor` | 大/小阿卡纳 |
| meaning_up | string | 正位牌意（Waite 原文，规范化空白） |
| meaning_rev | string | 逆位牌意（Waite 原文） |
| description | string | 牌面描述（Waite 原文） |

### rune_poem_oe_v1.json
| 字段 | 类型 | 说明 |
|---|---|---|
| rune | string | 老弗萨克符文名（Fehu...Dagaz，24个） |
| as_name | string | 盎格鲁-撒克逊诗节名（如 `FEOH`、`ETHEL`） |
| oe_text | string | 古英语原文 |
| en_text | string | Dickins 1915 英译 |
| source | string | 来源声明 |

### astro_rulerships_ptolemy.json
传统（古典）行星守护关系：七大经典行星 × 双重守护星座，源自 Ptolemy《Tetrabiblos》第一卷体系，人工整理并标注出处。

## 复现方式

```bash
python research/pipeline/01_fetch/dl_sources.py   # 拉取+校验
python research/pipeline/02_mine/mine_waite.py    # 挖掘
python research/pipeline/03_clean/clean_tarot.py  # 清洗塔罗
python research/pipeline/03_clean/clean_runes.py  # 清洗卢恩诗
python research/pipeline/04_audit/audit.py        # 审计（不过则退出码1）
python research/pipeline/04_audit/export_ts.py    # 导出站点 TS
```

## 站点消费位置

- 塔罗详情弹窗 → 「Waite 原文牌意 · 1911」（`src/data/waiteMeanings.ts`）
- 符文揭晓卡 → 「盎格鲁-撒克逊卢恩诗原文+英译」（`src/data/runePoemOE.ts`）

## 来源与版权

| 语料 | 来源 | 版权状态 |
|---|---|---|
| 塔罗牌意 | A.E. Waite, *The Pictorial Key to the Tarot*, 1911（经 sacred-texts 版本与 ekelen/tarot-api 挖掘） | 公版（美国，1911年出版） |
| 卢恩诗 | *The Anglo-Saxon Rune Poem*（8-9世纪佚名），英译 Bruce Dickins, *Runic and Heroic Poems*, 1915，取自 Wikisource | 原诗与1915译本均公版 |
| 行星守护 | Ptolemy, *Tetrabiblos*（约2世纪）体系 | 公版 |

## 路线图（Roadmap）

- [ ] 挪威卢恩诗 / 冰岛卢恩诗 对照（同源 Wikisource Dickins 1915）
- [ ] Ptolemy《Tetrabiblos》行星 significations 全量挖掘（sacred-texts 公版英译）
- [ ] Waite《The Tarot of the Bohemians》牌阵理论补充
- [ ] 中文牌意与 Waite 原文的语义对齐标注（用于 AI 解读 prompt 增强）
