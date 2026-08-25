# 西方占卜研究层 · Western Oracle Research

对标 `../bazi-research` 的方法论：**公版原始文献 → 编号流水线（抓取/挖掘/清洗/审计）→ 版本化数据集 → 站点消费**。
本目录是 western-oracle 网站的数据研究层，所有语料均为公有领域（public domain）。

## 目录结构

```
research/
├── classics/                  # 原始文献层（raw，不手改内容）
│   ├── waite_card_data_raw.json        # Waite《The Pictorial Key to the Tarot》1911 牌意（78张）
│   ├── papus_tob_divinatory_raw.txt    # Papus《Tarot of the Bohemians》1892 占卜释义（78张，第二独立来源）
│   ├── mcelroy_tarot_raw.json          # Mark McElroy《A Guide to Tarot Meanings》（作者声明公版，78张）
│   ├── rune_poem_anglosaxon_raw.txt    # 盎格鲁-撒克逊卢恩诗（29节，OE原文+Dickins 1915英译）
│   ├── rune_poems_norwegian_icelandic_raw.txt  # 挪威诗16节+冰岛诗16节（同上英译）
│   ├── tetrabiblos_book1_raw.txt        # Ptolemy《Tetrabiblos》Book I 选章（Ashmand 1822 英译）
│   └── astro_rulerships_ptolemy.json   # 传统行星守护表（源自 Ptolemy《Tetrabiblos》体系，curated）
├── pipeline/
│   ├── 01_fetch/dl_sources.py          # 拉取/校验原始文献
│   ├── 02_mine/mine_waite.py           # 编码映射（sacred-texts码 → 站点id）+ 文本规范化
│   ├── 02_mine/mine_papus_mcelroy.py   # Papus 文本解析 + McElroy JSON 挖掘（含牌名变体归一）
│   ├── 03_clean/clean_tarot.py         # 清洗：78张结构校验/去重/空值/与站点id集合对齐
│   ├── 03_clean/clean_tarot_sources.py # 清洗：三源合并对照（waite+papus+mcelroy 78×3）
│   ├── 03_clean/clean_runes.py         # 清洗：三诗合并 → 24老弗萨克（16符文三诗齐全）
│   └── 04_audit/
│       ├── audit.py                    # 审计：覆盖率/完整性/防篡改抽查(5张与原始JSON比对)
│       └── export_ts.py                # 导出站点 TS 模块（研究数据喂给网站）
└── data/                      # 版本化数据集（v1, v2, ... 只增不改）
    ├── waite_candidates_v1.json        # 挖掘候选
    ├── papus_candidates_v1.json        # Papus 挖掘候选（78）
    ├── mcelroy_candidates_v1.json      # McElroy 挖掘候选（78）
    ├── tarot_waite_v1.json             # 清洗后 Waite 牌意（78张）
    ├── tarot_sources_v2.json           # 三源合并对照（78张 × 3来源）
    ├── tetrabiblos_astro_v1.json        # Tetrabiblos 行星性质/庙宫/旺位（7行星，含原文引句）
    ├── alignment_cn_en_v1.json          # 中文-原文语义对齐（22大牌逐张+小牌规则模板）
    ├── rune_poem_oe_v1.json            # [v1, 已被v2取代] 仅盎格鲁-撒克逊诗
    ├── rune_poems_v2.json              # 清洗后三诗对照（24符文：16个三诗齐全+8个仅OE诗）
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

### tarot_sources_v2.json（三源对照）
每张牌同时携带三个独立来源的释义：
| 字段 | 说明 |
|---|---|
| waite | 1911《Pictorial Key》原书牌意（name/meaning_up/meaning_rev/description） |
| papus | 1892《Tarot of the Bohemians》占卜释义（第二独立历史来源） |
| mcelroy | keywords / fortune_telling[] / light[] / shadow[]（现代公版结构化释义） |

三来源相互独立（不同作者、不同年代、不同体系），清洗器强制三源 78×3 对齐，
任何一张牌缺任一来源都会导致审计失败。

### rune_poems_v2.json
| 字段 | 类型 | 说明 |
|---|---|---|
| rune | string | 老弗萨克符文名（Fehu...Dagaz，24个） |
| poems | object | 按语言索引的诗节，键为 `anglo_saxon` / `norwegian` / `icelandic` |
| poems.*.original | string | 原文（古英语/古诺斯语/古冰岛语） |
| poems.*.translation | string | Dickins 1915 英译 |
| poems.*.source | string | 单条来源声明 |

覆盖说明：16 个符文三诗齐全；8 个符文（Gebo/Wunjo/Eihwaz/Perthro/Ehwaz/Ingwaz/Othala/Dagaz）
在年轻弗萨克（挪威/冰岛诗的基础）中被弃用，故仅有盎格鲁-撒克逊诗节——这是**文献学事实**，
不是漏采；审计脚本会校验这一集合的准确性。

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
- 符文揭晓卡 → 三首卢恩诗原文+英译对照（`src/data/runePoems.ts`）

## 来源与版权

| 语料 | 来源 | 版权状态 |
|---|---|---|
| 塔罗牌意（来源1） | A.E. Waite, *The Pictorial Key to the Tarot*, 1911（经 sacred-texts 版本与 ekelen/tarot-api 挖掘） | 公版（美国，1911年出版） |
| 塔罗牌意（来源2） | Papus, *The Tarot of the Bohemians*, 1892, A.P. Morton 英译，取自 sacred-texts | 公版 |
| 塔罗释义（来源3） | Mark McElroy, *A Guide to Tarot Meanings*（作者声明公版），取自 dariusk/corpora | 公版 |
| 盎格鲁-撒克逊卢恩诗 | 8-9世纪佚名，英译 Bruce Dickins 1915，取自 Wikisource | 原诗与译本均公版 |
| 挪威/冰岛卢恩诗 | 约13/15世纪佚名，英译 Bruce Dickins 1915，取自 Wikisource | 同上 |
| 行星守护 | Ptolemy, *Tetrabiblos*（约2世纪）体系 | 公版 |

## 路线图（Roadmap）

- [x] 挪威卢恩诗 / 冰岛卢恩诗对照（v2，2026-08-25）
- [x] 第二独立塔罗牌意来源：Papus 1892（三源对照 v2，2026-08-25）
- [x] McElroy 公版结构化释义（fortune-telling/light/shadow，2026-08-25）
- [x] Ptolemy《Tetrabiblos》Book I 选章挖掘：行星性质/庙宫/旺位，与 curated 守护表交叉验证一致（v1，2026-08-25）
- [x] 中文-原文语义对齐标注 v1：22 大牌逐张（人工，含置信度）+ 56 小牌花色×阶位规则模板（依据 Papus 三段论）；已注入 AI 解读 prompt 做双语锚定（2026-08-25）
- [ ] 对齐 v2：小牌逐张人工对齐 + 语义相似度评分
- [ ] Tetrabiblos Book III/IV（命盘专题各章）继续挖掘
- [ ] Golden Dawn《Book T》占星对应（Tarotoo 数据集已含 GD 归属，可作参考实现）
