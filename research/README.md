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
│   ├── tetrabiblos_ashmand_full_1822_raw.txt   # Ptolemy《Tetrabiblos》全书（Ashmand 1822，IA OCR）[2026-08-25]
│   ├── astro_rulerships_ptolemy.json   # 传统行星守护表（源自 Ptolemy《Tetrabiblos》体系，curated）
│   ├── robson_fixed_stars_1923_raw.txt # Robson《The Fixed Stars and Constellations in Astrology》(IA OCR) [2026-08-25]
│   ├── lilly_christian_astrology_1647_raw.txt # Lilly《Christian Astrology》(IA OCR) [2026-08-25]
│   ├── leo_how_to_judge_nativity_1928_raw.txt # Alan Leo《How to Judge a Nativity》(IA OCR) [2026-08-25]
│   ├── miller_ten_thousand_dreams_raw.txt     # Miller《Ten Thousand Dreams Interpreted》(PG #926) [2026-08-25]
│   ├── kunz_curious_lore_precious_stones_1913_raw.txt # Kunz《The Curious Lore of Precious Stones》(IA OCR) [2026-08-25]
│   ├── cheiro_palmistry_for_all_1916_raw.txt  # Cheiro《Palmistry for All》(PG #20480) [2026-08-25]
│   ├── sepharial_kabala_of_numbers_raw.txt    # Sepharial《The Kabala of Numbers》(IA OCR) [2026-08-25]
│   ├── tarotoo_cards_mirrored.json            # Tarotoo 现代结构化塔罗 (MIT, github Tarotoo-com/tarotoo-tarot-dataset) [2026-08-25]
│   └── corpora_zodiac_cc0_raw.json            # 黄道事实层 (CC0, dariusk/corpora divination/zodiac.json) [2026-08-25]
├── pipeline/
│   ├── 01_fetch/dl_sources.py          # 拉取/校验原始文献（塔罗+全部 IA/PG 源；Papus/McElroy/北欧诗为人工誊录）
│   ├── 02_mine/mine_waite.py           # 编码映射（sacred-texts码 → 站点id）+ 文本规范化
│   ├── 02_mine/mine_papus_mcelroy.py   # Papus 文本解析 + McElroy JSON 挖掘（含牌名变体归一）
│   ├── 02_mine/mine_fixed_stars.py     # Robson 恒星目录条目挖掘（Influence/With Sun/Moon 分节）[2026-08-25]
│   ├── 02_mine/mine_fixed_stars_v2.py  # Robson v2：漏星修复+Aldebaran 截断修复+With 行星小节全收 [2026-08-26]
│   ├── 02_mine/mine_dreams_miller.py   # Miller 词条挖掘（2250 条 term→meanings）[2026-08-25]
│   ├── 02_mine/mine_cheiro_palmistry.py # Cheiro 章节→结构化 section（主线/副线/星丘/手型）[2026-08-25]
│   ├── 02_mine/mine_sepharial_numbers.py # Sepharial Minor Key + 合成数释义表 [2026-08-25]
│   ├── 02_mine/mine_sepharial_numbers_v2.py # Sepharial v2：新增 Ch X 读心 / Ch XII 失物章 [2026-08-26]
│   ├── 02_mine/mine_kunz_birthstones.py # Kunz 诞生石票数表/胸甲十二石/水晶凝视章 [2026-08-25]
│   ├── 02_mine/mine_kunz_birthstones_v2.py # Kunz v2：十二月表+双诗+水晶/行星两整章段落库 [2026-08-26]
│   ├── 02_mine/mine_lilly_signs.py     # Lilly Book I 星座描述章整段收录（OCR 长音 s 噪声）[2026-08-25]
│   ├── 02_mine/mine_lilly_signs_v2.py  # Lilly v2：逐星座切分+Ch XVII/XVIII+问卦格言+婚姻格言 [2026-08-26]
│   ├── 02_mine/mine_leo_nativity.py    # Leo 十二宫/太阳十二星座/月亮十二星座三段 [2026-08-25]
│   ├── 02_mine/mine_leo_nativity_v2.py # Leo v2：五星入星座五章+Centiloquy 百条+逐宫切分 [2026-08-26]
│   ├── 02_mine/mine_tetrabiblos_books34.py # Tetrabiblos B3/B4 命盘专题十章按主题切分 [2026-08-25]
│   ├── 02_mine/mine_tetrabiblos_book2.py   # Tetrabiblos B2 政治气象占星十二章（quote+全文）[2026-08-26]
│   ├── 02_mine/mine_tetrabiblos_book1.py   # Tetrabiblos B1 基础原理卷全文（quote+全文）[2026-08-26]
│   ├── 02_mine/mine_tetrabiblos_books34_v2.py # B3/B4 全文体 v2（21 章整章正文）[2026-08-26]
│   ├── 02_mine/mine_robson_constellations.py  # Robson 星座目录/月宿二十八宿/魔法效应清单 [2026-08-26]
│   ├── 02_mine/mine_sepharial_numbers_v3.py   # Sepharial v3：19 章逐章段落库 [2026-08-26]
│   ├── 02_mine/mine_leo_nativity_v3.py        # Leo v3：元素星座/行星升起/太阳相位/结论章 [2026-08-26]
│   ├── 02_mine/mine_kunz_birthstones_v3.py    # Kunz v3：宗教用途/医疗用途两整章 [2026-08-26]
│   ├── 02_mine/mine_lilly_chapters.py         # Lilly 章节库：Book II 逐宫问事+Book III/IV 本命盘 [2026-08-26]
│   ├── 02_mine/mine_tetrabiblos_appendices.py # Tetrabiblos 附录卷：前言/Almagest 摘录/Centiloquy 百条 [2026-08-26]
│   ├── 02_mine/mine_leo_nativity_v4.py        # Leo v4：外貌规则/上升星座/Ch VII·VIII 章头 [2026-08-26]
│   ├── 02_mine/mine_kunz_birthstones_v4.py    # Kunz v4：前半部五章（迷信源流等）[2026-08-26]
│   ├── 02_mine/mine_robson_medieval_magic.py  # Robson 魔法章+星陨气象学+数学公式 [2026-08-26]
│   ├── 02_mine/mine_lilly_introduction.py     # Lilly 前部：序言+Book I 前十六章 [2026-08-26]
│   ├── 02_mine/mine_leo_nativity_v5.py        # Leo v5：日月段终点锚点稳健化 [2026-08-26]
│   ├── 02_mine/mine_robson_front_matter.py    # Robson 卷首天文学导论（Ch I）[2026-08-26]
│   ├── 02_mine/mine_leo_front_matter.py       # Leo 卷首：两版序言+占星史+目录+星座表 [2026-08-26]
│   ├── 02_mine/mine_kunz_front_matter.py      # Kunz 卷首：题献+序言+目录图版清单 [2026-08-26]
│   ├── 02_mine/mine_sepharial_numbers_v4.py   # Sepharial v4：补 INTRODUCTION [2026-08-26]
│   ├── 02_mine/mine_tetrabiblos_appendices_v2.py # 附录 v2：卷首起点提前至题献页（文件名 mine_tetrabiblos_appendices.py）[2026-08-26]
│   ├── 02_mine/curate_bookt_decans.py  # Golden Dawn Book T 三十六旬对应表（程序化生成+锚点校验）[2026-08-25]
│   ├── 03_clean/clean_tarot.py         # 清洗：78张结构校验/去重/空值/与站点id集合对齐
│   ├── 03_clean/clean_tarot_sources.py # 清洗：三源合并对照（waite+papus+mcelroy 78×3）
│   ├── 04_audit/
│   │   ├── audit.py                    # 审计：覆盖率/完整性/交叉验证（现覆盖 16 个数据集）
│   │   ├── qa_scan.py                  # 清洗质量扫描：OCR 噪声/页眉残留/编码损坏 [2026-08-25]
│   │   └── export_ts.py                # 导出站点 TS 模块（研究数据喂给网站）
└── data/                      # 版本化数据集（v1, v2, ... 只增不改）
    ├── waite_candidates_v1.json        # 挖掘候选
    ├── papus_candidates_v1.json        # Papus 挖掘候选（78）
    ├── mcelroy_candidates_v1.json      # McElroy 挖掘候选（78）
    ├── tarot_waite_v1.json             # 清洗后 Waite 牌意（78张）
    ├── tarot_sources_v2.json           # 三源合并对照（78张 × 3来源）
    ├── tetrabiblos_astro_v1.json        # Tetrabiblos 行星性质/庙宫/旺位（7行星，含原文引句）
    ├── tetrabiblos_books34_v1.json      # Tetrabiblos B3/B4 命盘专题引文（10主题×宫位提示）[2026-08-25]
    ├── fixed_stars_robson_v1.json       # Robson 恒星目录（96星：nature/influence/with_sun/with_moon/culminating）[2026-08-25]
    ├── lilly_signs_v1.json              # Lilly 星座描述章 passage（1647 原文 OCR）[2026-08-25]
    ├── leo_nativity_v1.json             # Leo 十二宫/日座/月座段落（1928 ed.）[2026-08-25]
    ├── book_t_decans_v1.json            # Golden Dawn 三十六旬→小牌/守护/GD称号（curated+程序生成）[2026-08-25]
    ├── dreams_miller_v1.json            # Miller 解梦词条（2250 条）[2026-08-25]
    ├── cheiro_palmistry_v1.json         # Cheiro 手相章节库（18 sections）[2026-08-25]
    ├── kunz_birthstones_v1.json         # Kunz 诞生石月度票数表+胸甲十二石+水晶凝视段 [2026-08-25]
    ├── sepharial_numbers_v1.json        # Sepharial 数字学（Minor Key 1-9+行星 / 问事9 / 合成数12..84）[2026-08-25]
    ├── kunz_birthstones_v2.json         # Kunz 扩容：十二月表+双诗+水晶/行星两整章段落库 [2026-08-26]
    ├── leo_nativity_v1.json             # Leo 十二宫/日座/月座段落（1928 ed.）[2026-08-25]
    ├── leo_nativity_v2.json             # Leo 扩容：五星入星座+Centiloquy 百条+第二..十二宫逐宫 [2026-08-26]
    ├── lilly_signs_v2.json              # Lilly 扩容：十二星座逐座+Ch XVII/XVIII+问卦格言+婚姻格言 [2026-08-26]
    ├── sepharial_numbers_v2.json        # Sepharial 扩容：v1 全量 + Ch X 读心 / Ch XII 失物章 [2026-08-26]
    ├── tetrabiblos_book2_v2.json        # Tetrabiblos Book II 政治气象占星十二章（quote+全文）[2026-08-26]
    ├── fixed_stars_robson_v2.json       # Robson v2：99 星 + With Mercury..Fortuna 小节全收（322 节）[2026-08-26]
    ├── tetrabiblos_book1_v2.json        # Tetrabiblos B1 基础原理卷全文按章收录 [2026-08-26]
    ├── tetrabiblos_books34_v2.json      # Tetrabiblos B3/B4 全文体 v2（21 章整章正文+主题标注）[2026-08-26]
    ├── robson_constellations_v1.json    # Robson 星座目录 89 条/月宿 28 宿/魔法效应清单 26 条 [2026-08-26]
    ├── sepharial_numbers_v3.json        # Sepharial v3：19 章逐章段落库（≈20 万字符散文）[2026-08-26]
    ├── leo_nativity_v3.json             # Leo v3：四元素星座深义/行星升起 12 座/太阳相位/Apheta/结论章 [2026-08-26]
    ├── kunz_birthstones_v3.json         # Kunz v3：宗教用途 255 段/医疗用途 143 段 [2026-08-26]
    ├── lilly_chapters_v1.json           # Lilly 章节库：Book II 逐宫问事 + Book III/IV 本命盘（≈94 万字符）[2026-08-26]
    ├── tetrabiblos_appendices_v1.json   # Tetrabiblos 附录卷：前言/Almagest 摘录/Centiloquy 87 条/星图说明 [2026-08-26]
    ├── leo_nativity_v4.json             # Leo v4：+外貌规则/上升星座/Ch VII 守护星/Ch VIII 健康寿限 [2026-08-26]
    ├── kunz_birthstones_v4.json         # Kunz v4：+迷信源流/护符护身符/护符使用/雕琢宝石/凶吉宝石五章（+26 万字符）[2026-08-26]
    ├── robson_medieval_magic_v1.json    # Robson 魔法章：恒星魔法印记 14 星/月宿魔法/星陨气象学/数学公式 [2026-08-26]
    ├── lilly_introduction_v1.json       # Lilly 前部：题献序言 + Book I 前十六章（行星本质/相位等）[2026-08-26]
    ├── leo_nativity_v5.json             # Leo v5：日月段终点锚点稳健化（章标题锚定）[2026-08-26]
    ├── robson_front_matter_v1.json      # Robson 卷首天文学导论（银河/星云/希腊字母表）[2026-08-26]
    ├── leo_front_matter_v1.json         # Leo 卷首：两版序言/占星史专论/详细目录/星座参照表（12 身体部位+4 三重序）/导论 [2026-08-26]
    ├── kunz_front_matter_v1.json        # Kunz 卷首：Morgan 题献/序言/目录与插图清单 [2026-08-26]
    ├── sepharial_numbers_v4.json        # Sepharial v4：+INTRODUCTION（数字科学与对应论）[2026-08-26]
    ├── tetrabiblos_appendices_v2.json   # 附录卷 v2：卷首起点提前至题献页（WAVERLEY 题献+Advertisement+序言全收）[2026-08-26]
    ├── fixed_stars_robson_v3.json      # Robson 恒星目录 v3：截断上限移除+章尾三篇论述正确分离（Zosma 尾巴归位）[2026-08-26]
    ├── robson_medieval_magic_v2.json    # Robson 魔法章 v2：Rules/Image 小节截断上限移除 [2026-08-26]
    ├── tarot_modern_v1.json             # Tarotoo 现代结构化塔罗（78张×love/career/mood/spiritual/yes_no；56数字牌与 Book T 表交叉验证一致）[2026-08-25]
    ├── zodiac_facts_v1.json             # 黄道事实层（12星座：黄经/元素/古典现代守护/日期；古典守护与 Ptolemy 庙宫表互证）[2026-08-25]
    ├── alignment_cn_en_v1.json          # 中文-原文语义对齐（22大牌逐张+小牌规则模板）
    ├── rune_poem_oe_v1.json            # [v1, 已被v2取代] 仅盎格鲁-撒克逊诗
    ├── rune_poems_v2.json              # 清洗后三诗对照（24符文：16个三诗齐全+8个仅OE诗）
    └── audit_report.json               # 审计报告（all_pass: true, 36 datasets）
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

### fixed_stars_robson_v1.json
| 字段 | 类型 | 说明 |
|---|---|---|
| num | int/null | 原书目录序号（OCR 个别损坏为 null） |
| name / name_key | string | 星名 / 归一化键（折叠空白+casefold，OCR 断名如 "Reg ulus" 可命中） |
| designation | string | Bayer 编号与黄经位置原文（星座符号被 OCR 破坏，v2 与现代星表交叉补齐） |
| nature | string[] | 从 "Of the nature of X and Y" 抽取的行星性质 |
| influence / with_sun / with_moon / culminating | string | Robson 分节释义（节标题含 OCR 变体已归并） |

覆盖说明：目录章约百条中成功解析 96 条；个别星（如 Aldebaran）的 Influence 段被
OCR 页眉截断，内容并入 notes。审计校验关键八星（Algol/Aldebaran/Regulus/Antares/
Arcturus/Spica/Sirius/Pleiades）必须命中。

### tetrabiblos_books34_v1.json
按主题收录 Ashmand 1822 英译 Book III/IV 命盘专题章引文（quote 截首段），
每条带 `book/chapter/title/house_hint/source`。`house_hint` 为传统宫位对应（curated）：
siblings→3、marriage→7、children→5、friends→11、travel→9、death_quality→8、
occupation/rank→10、parents→4、body/mind→1、longevity→8。

### book_t_decans_v1.json
Golden Dawn《Book T》三十六旬对应表：sign/decan/度数区间/Chaldean 守护/
塔罗小牌/GD 称号（Lord of ...）。守护序列由程序生成（杜绝手抄错位），
牌卡-旬对应与称号人工对照录入，审计内置 11 个通行锚点抽查。

### dreams_miller_v1.json / kunz_birthstones_v1.json / cheiro_palmistry_v1.json / sepharial_numbers_v1.json
- dreams：2250 词条（term/term_key/meanings[]），PG #926 正文 `_词条_.` 标题切分；
- kunz：12 月诞生石票数表（八传统汇总）+ 胸甲/根基十二石对照 + 水晶凝视章段落；
  OCR 月名残缺月份以原书表值核对后补录（防篡改式验证）；
- cheiro：18 个结构化 section（head/life/destiny/sun/heart/marriage/children/health/
  girdle/intuition 八条线 + 七星丘 + 手型），章节标题关键词归档；
- sepharial：Minor Key 数字 1-9 含义与对应行星 + 问事所思 1-9 + 合成数释义 12..84。

### lilly_signs_v1.json / leo_nativity_v1.json
17-20 世纪公版占星教科书的星座/宫位语义层源头文献：
Lilly 1647 Book I 星座描述章整章 passage（长音 s OCR 噪声保留原貌）；
Leo 十二宫、太阳十二星座、月亮十二星座三段（1928 ed.）。

### v2 扩容数据集（2026-08-26）

针对 v1 提取率过低（0.7%–22%）的六个源做扩容重挖，`data/` 只增不改，v2 为 v1 超集：

#### kunz_birthstones_v2.json（0.7% → ~17%）
| 字段 | 说明 |
|---|---|
| favored_by_month / breastplate_and_foundation | 同 v1 |
| sentiments_of_months | 新增「Sentiments of the Months」十二月表：诞生石/守护天使/护符宝石/主保使徒/对应宝石/黄道宫/花 + 每月双诗；表值逐项回查原文核对（防篡改），OCR 拼写替身（Seorpio 等）登记于 VALUE_RAW_ALTS |
| chapters.crystal_gazing | 水晶凝视整章段落库（149 段，页眉行定位 ≈333611–430772） |
| chapters.planetary_and_astral_influences | 行星与星辰感应整章段落库（79 段，≈638488–689018） |

#### leo_nativity_v2.json（5.7% → ~45%）
| 字段 | 说明 |
|---|---|
| sections | 同 v1 三大段（十二宫总论/日座/月座） |
| planets_in_signs | 新增土/木/火/金/水五星「入十二星座」五章整章（星座符号被 OCR 损坏，不逐星座切分） |
| centiloquy.aphorisms | 新增「A Centiloquy」百条格言逐条解析：罗马数字锚定按期望序列 I.–C. 匹配（OCR 数字噪声 'XXXV1.' 归一），恰 100 条 |
| houses | 第二..十二宫逐宫切分（运行页眉行定位，边界允许 ≤1 页溢出） |

#### lilly_signs_v2.json（dataset=lilly_christian_astrology）
| 字段 | 说明 |
|---|---|
| signs | 星座描述章按 12 星座逐座切分。OCR 将星座符号损坏，以各座「本质属性句」特征串为有序锚点（如 Aries=`Mafculine, Diurnall Signe`、Pisces=`Watry Triplicicy,Northern`），全部命中且严格递增才通过；每段可能含前一座 ≤160 字符尾迹 |
| ch17_use_of_signs | Ch XVII「十二星座论述的用法」章段 |
| essential_dignities | Ch XVIII 行星本质尊贵章（至 Ch XIX），含尊贵表区域（网格噪声行已清除） |
| horary_aphorisms | 著名问卦格言与考量章（QUESTION. 起 43 条编号格言）：因 OCR 页裂严重不做逐条切分，整章收录并检测序号覆盖（38/43 命中） |
| albubater_marriage | Albubater 婚姻格言章段 |

#### sepharial_numbers_v2.json
v1 全量（minor_key/things_thought_of/resultant_meanings）+ 新增
`chapters.x_thought_reading_by_numbers`（Ch X「以数读心」，21 段）与
`chapters.xii_of_things_lost`（Ch XII「论失物」，10 段）。

#### tetrabiblos_book2_v2.json（Book II 此前完全未挖）
政治/气象占星卷十二章：index/heading（检测到的章号行原文，Ch XI/XIII 章号行
被 OCR 吃掉以标题特征串补锚）/title/quote（首实质段落）/body（整章正文，
页眉残行清除）。审计要求 ≥12 章且五个必收主题命中。

#### fixed_stars_robson_v2.json（96 → 99 星，+322 个 With-行星小节）
| 修复 | 说明 |
|---|---|
| 漏星 | 星名内噪声字符净化（`59. Has*.`）；正文噪声假匹配（'Hom.' 行）不再切断条目边界 |
| 截断 | Aldebaran 类条目 Influence 节头丢失不再致命：notes 上限放宽 + 全部小节照收 |
| aspects | 新增 With Mercury/Venus/Mars/Jupiter/Saturn/Uranus/Neptune/Fortuna 小节全收（322 节，Aldebaran 单星回收 6 节） |
| 名称归一 | SnARATAN→Sheratan（以条目正文 'Sharatain' 上下文为证断言） |

### 第三轮扩容数据集（2026-08-26 第二批）

覆盖率审计显示 v2 后仍有大量未挖区块（lilly 仅 3%、B1 全文未挖、
Robson 星座/月宿目录整块跳过等），第二批扩容：

| 数据集 | 新增内容 | 说明 |
|---|---|---|
| tetrabiblos_book1_v2.json | B1 基础原理卷全文按章收录（≈10.4 万字符） | 通走 Chapter 标题行；个别章标题行 OCR 损坏时正文并入相邻章，文本零丢失 |
| tetrabiblos_books34_v2.json | B3/B4 全文体：21 章整章正文（≈22 万字符） | 替代 v1 的首段引文；TOPICS 主题+house_hint 标注保留；B4 止于书末 Almagest 附录前 |
| robson_constellations_v1.json | 星座目录 89 条（Legend/History/Influence 分节）+ 月宿 28 宿 + Medieval Magic 星座魔法效应清单 26 条 | 与 fixed_stars_robson_v2 的恒星目录互补；OCR 编号别名 'z.'='1.' 已处理 |
| sepharial_numbers_v3.json | 全部 19 章逐章段落库（≈20 万字符散文） | Ch I/XI 表格保持独立字段；章界以 CHAPTER 行+标题行双重锚定 |
| leo_nativity_v3.json | 四元素星座深义 4 章 / Ch III·V / 行星升起十二星座逐座章 / 太阳相位章 / Apheta 与 Anareta / 宫位结语与天王海王相位 / Ch XXI-XXII 结论章（共 ≈23 万字符） | v2 内容全数保留 |
| kunz_birthstones_v3.json | Religious Uses 整章 255 段 / Therapeutic Uses 整章 143 段（≈20 万字符） | 含原书图版图注，按原貌保留 |
| lilly_chapters_v1.json | 区域 A=Ch XIX 相位术语至格言章前；区域 B=Book II 逐宫问事章（买卖/朋友/旅行…）与 Book III/IV 本命盘判断（合计 ≈94 万字符） | OCR 页裂严重不做章节切分，段落级收录；图版网格噪声段已滤除 |

**第三轮后整体覆盖情况**：leo ≈72%、kunz ≈51%、robson ≈64%、sepharial ≈86%、
tetrabiblos 全书 ≈90%（B1/B2/B3/B4 正文全收）、lilly ≈64%。

### 第四轮扩容数据集（2026-08-26 第三批 remine）

严格覆盖率审计（逐字节区间比对）发现第三批后仍余五块未挖，全部补齐：

| 数据集 | 新增内容 | 说明 |
|---|---|---|
| tetrabiblos_appendices_v1.json | Ashmand 译者前言/导论 + Almagest 摘录 + 纬度表/升交表说明 + **Ptolemy《Centiloquy》百条格言**（87/100 条独立编号，13 条编号行 OCR 损毁、正文并入相邻条）+ 黄道平面星图说明（≈9.5 万字符） | Centiloquy 用罗马数字序列匹配解析（容忍 'VI..'/'I,' 标点变形与编辑距离 1 编号腐蚀），缺失清单随数据记录 |
| leo_nativity_v4.json | 外貌规则两节 / THE RISING SIGN 章 / Ch VII「The Ruling Planet」章头 / Ch VIII「Health & Length of Life」章头（+8.5 万字符） | 此前 v3 误从行星升起章起跳，遗漏了 213603–296144 区块 |
| kunz_birthstones_v4.json | 前半部五章：迷信源流 / 护符护身符 / 护符使用 / 雕琢宝石 / 凶吉宝石（+26 万字符） | 运行页眉定位；图版铭文残片已滤除。至此除书首题页外全书覆盖 |
| robson_medieval_magic_v1.json | 恒星魔法印记 14 星（Rules 石草配方 + Image 形象效应）/ 月宿魔法 / **Astro-Meteorology 恒星气象效应章** / 书末数学公式组 | 星名 OCR 腐蚀以印章图版页正确拼写为证归一（Aldebaran/Algol/Arcturus 等） |
| lilly_introduction_v1.json | 题献/致读者/序言（目录页行滤除）+ Book I 前十六章（七政本质/黄道总论/宫位/相位词汇等）（≈12.6 万字符） | 星座描述章之前的全部 Book I 内容 |

**第四轮后整体覆盖情况**：leo ≈96%（仅余出版广告页）、kunz ≈95%（仅余书首题页/
版权页）、robson ≈99%（仅余卷首扫描噪声）、sepharial ≈98%、tetrabiblos ≈100%
（含附录卷）、lilly ≈98%。剩余未挖部分均为非内容性材料：图书馆盖章/扫描噪声/
题页/版权页/出版广告/纯页眉页码带。

### 第五轮（2026-08-26 锚点稳健化 + 最后补漏）

精确逐字节覆盖率终验后：

- leo_nativity_v5.json：moon_in_signs 终点从 v1 依赖回退窗口的脆弱短语锚点
  （'Personal Appearance and Character'）改为外貌章标题行，norm 增加小节标题
  页码剥除；内容区间与 v4 相同。
- robson_front_matter_v1.json：Ch I「The Fixed Stars in Astronomy」天文学导论
  （恒星距离/银河结构/星云/星等命名/希腊字母表，≈1.6 万字符）——Robson 全书至此完整。

**最终精确覆盖率**（逐字节区间计算）：lilly 99.9% / tetrabiblos 99.0% /
robson 100% / sepharial 97.8% / kunz 97.5% / leo ≈95.6%。剩余为题页、
出版广告、图书馆印章与扫描噪声。

### 第六轮（2026-08-26 卷首前置内容逐区人工审读）

对全部「剩余未挖」区块完整导出人工审读（非抽样），发现四处此前误判为
「非内容」的真内容，全部补挖：

| 数据集 | 补挖内容 | 说明 |
|---|---|---|
| leo_front_matter_v1.json | 两版序言 + **The History of Astrology 占星史专论**（埃及→迦勒底→希腊→罗马→阿拉伯→近代 astrologer 名录）/ 详细目录 / 星座参照表（12 星座所辖身体部位 + 四重三重序，结构化锚点断言）/ INTRODUCTION 哲学导论（≈3.9 万字符） | 此前误判为图书馆盖章噪声 |
| kunz_front_matter_v1.json | Morgan 题献页（全大写排版专用通道）/ Kunz 序言全文（含致谢名单与资料来源）/ 目录与三类插图总清单（≈1.7 万字符） | 此前误判为题页噪声 |
| sepharial_numbers_v4.json | 书首 INTRODUCTION：数字科学起源与 Swedenborg 对应论学说（≈5 千字符） | v3 章界从 CHAPTER I 起跳遗漏 |
| tetrabiblos_appendices_v2.json | 附录卷 front_matter 起点自 5500 提前至题献页：WAVERLEY 题献 + Advertisement + 序言开头全收（fm ≈5 万字符） | v1 在序言中段起跳切掉开头 |

lilly 卷首（0–1600）经审读确认为书名页/肖像说明/图书馆戳，无正文，
维持不挖。**至此六个源的剩余未挖字节经逐区人工确认均为非内容材料。**

### 第七轮（2026-08-26 覆盖率证明器驱动的最后补漏）

放弃人工区间记账，改用**覆盖率证明器**：把全部数据集文本切 8 词词块反向
定位到原始文件字节并标记覆盖，机器列出所有 ≥250 字符的未覆盖片段。
据此又发现四处漏挖：

| 数据集 | 补漏内容 |
|---|---|
| leo_nativity_v6.json | Ch II 黄道十二星座开篇论述（黄道定义/地球公转与十二宫对应，≈1.4 万字符）——v1 终点锚点截断 |
| kunz_birthstones_v5.json | Ch IX「Birth-Stones」整章正文段落库（诞生石史/约瑟夫斯引文/Napoleon 语，207 段 ≈4.5 万字符）+ 印度月宝石表 + 美国各州宝石产地表 + 美德宝石对应表 |
| robson_constellations_v2.json | 月宿双清单分开收录（印度详表 28 宿含 Revati/Ashadha 长条目 + 中国表 23 宿——v1 去重误留简略轮）/ Ch II 星座感应正文 / 分点岁差与 Regulus-Rome 论述 / Robson 自序 |
| sepharial_numbers_v5.json | 各章短编号条目表：Ch XII 失物方位 39 条 / Ch III 毕达哥拉斯数值含义 49 条 / Ch IV 数字 1-10 含义图等（编号 OCR 空格变形 '1 1 .' 已容忍） |
| lilly_chapters_v2.json | 行级清洗替代整段丢弃——恢复此前被管道符守卫误杀的散文（如"Of Buying and Selling Lands"章、内战军中问卦实例）；网格行仍按行剔除 |

**最终逐字覆盖率（证明器实测）**：leo 99.0% / tetrabiblos 98.8% /
sepharial 93.3% / kunz 92.0% / lilly 79.2% / robson 75.4%。
剩余未逐字覆盖部分 = ①星盘图表/星历表网格残骸（有意弃收的不可读噪声）、
②插图题注碎片、③目录页码剥离导致的回标失配（对应内容已在结构化字段中）。

## 复现方式

```bash
python research/pipeline/01_fetch/dl_sources.py          # 拉取+校验全部公版源（IA/PG 直连）
python research/pipeline/02_mine/mine_waite.py           # 塔罗挖掘
python research/pipeline/02_mine/mine_papus_mcelroy.py   # Papus/McElroy 挖掘
python research/pipeline/03_clean/clean_tarot.py         # 清洗塔罗
python research/pipeline/03_clean/clean_tarot_sources.py # 三源合并
python research/pipeline/03_clean/clean_runes.py         # 清洗卢恩诗
python research/pipeline/02_mine/mine_fixed_stars.py     # 固定恒星（96星）
python research/pipeline/02_mine/mine_dreams_miller.py   # 解梦词条（2250）
python research/pipeline/02_mine/mine_cheiro_palmistry.py # 手相章节库
python research/pipeline/02_mine/mine_sepharial_numbers.py # 数字学
python research/pipeline/02_mine/mine_kunz_birthstones.py  # 诞生石/水晶
python research/pipeline/02_mine/mine_lilly_signs.py     # Lilly 星座章
python research/pipeline/02_mine/mine_leo_nativity.py    # Leo 宫位/日座/月座
python research/pipeline/02_mine/mine_tetrabiblos_books34.py # Tetrabiblos B3/B4 专题
python research/pipeline/02_mine/mine_tetrabiblos_book2.py   # Tetrabiblos Book II 十二章
python research/pipeline/02_mine/mine_kunz_birthstones_v2.py  # Kunz 扩容（v2）
python research/pipeline/02_mine/mine_leo_nativity_v2.py     # Leo 五星/百条格言/逐宫（v2）
python research/pipeline/02_mine/mine_lilly_signs_v2.py      # Lilly 逐星座+格言章（v2）
python research/pipeline/02_mine/mine_sepharial_numbers_v2.py # Sepharial Ch X/XII（v2）
python research/pipeline/02_mine/mine_fixed_stars_v3.py      # Robson 截断上限精修（v3）
python research/pipeline/02_mine/mine_robson_medieval_magic.py # Robson 魔法章（v2）
python research/pipeline/02_mine/mine_tetrabiblos_book1.py   # Tetrabiblos B1 全章
python research/pipeline/02_mine/mine_tetrabiblos_books34_v2.py # B3/B4 全文体 v2
python research/pipeline/02_mine/mine_robson_constellations.py  # 星座目录/月宿/魔法清单
python research/pipeline/02_mine/mine_sepharial_numbers_v3.py   # Sepharial 19 章库（v3）
python research/pipeline/02_mine/mine_leo_nativity_v3.py        # Leo 扩容区块（v3）
python research/pipeline/02_mine/mine_kunz_birthstones_v3.py    # Kunz 宗教/医疗章（v3）
python research/pipeline/02_mine/mine_lilly_chapters.py         # Lilly 章节库
python research/pipeline/02_mine/mine_tetrabiblos_appendices.py # Tetrabiblos 附录卷+Centiloquy
python research/pipeline/02_mine/mine_leo_nativity_v4.py        # Leo 外貌/上升章（v4）
python research/pipeline/02_mine/mine_kunz_birthstones_v4.py    # Kunz 前半部五章（v4）
python research/pipeline/02_mine/mine_robson_medieval_magic.py  # Robson 魔法章/气象学
python research/pipeline/02_mine/mine_lilly_introduction.py     # Lilly 前部 Book I 前十六章
python research/pipeline/02_mine/mine_lilly_chapters.py         # Lilly 章节库（v2 行级清洗）
python research/pipeline/02_mine/mine_kunz_birthstones_v5.py    # Kunz Ch IX 全文+三表（v5）
python research/pipeline/02_mine/mine_robson_constellations_v2.py # Robson 月宿双清单+Ch II（v2）
python research/pipeline/02_mine/mine_sepharial_numbers_v5.py   # Sepharial 短条目表（v5）
python research/pipeline/02_mine/mine_leo_nativity_v6.py        # Leo Ch II 开篇（v6）
python research/pipeline/02_mine/mine_leo_nativity_v5.py        # Leo 日月段锚点稳健化（v5）
python research/pipeline/02_mine/mine_robson_front_matter.py    # Robson 卷首导论
python research/pipeline/02_mine/mine_leo_front_matter.py       # Leo 卷首（序言/历史/星座表）
python research/pipeline/02_mine/mine_kunz_front_matter.py      # Kunz 卷首（题献/序言）
python research/pipeline/02_mine/mine_sepharial_numbers_v4.py   # Sepharial INTRODUCTION（v4）
python research/pipeline/02_mine/mine_tetrabiblos_appendices.py # Tetrabiblos 附录卷（v2，卷首全收）
python research/pipeline/02_mine/curate_bookt_decans.py  # Book T 三十六旬
python research/pipeline/04_audit/audit.py               # 审计44数据集（不过则退出码1）
python research/pipeline/04_audit/fidelity_check.py      # 保真度抽查：673抽样回查原始文献
python research/pipeline/04_audit/qa_scan.py             # 清洗质量扫描（OCR噪声/页眉/编码）
python research/pipeline/04_audit/export_ts.py           # 导出站点 TS（15个模块）
```

### 验证方法论（三层）

1. **确定性**：全部挖掘脚本重跑后数据集 SHA256 逐字节一致（无随机性、无顺序依赖）；
2. **保真度**：`fidelity_check.py` 按 seed=1901 抽样 624 条，词块化回查原始文献，
   命中率阈值 70%（页眉清除造成的"空洞"允许跨洞，超短字段命中 ≥1 块即通过）——
   防止挖掘过程张冠李戴或凭空造文；
3. **交叉验证**：Tarotoo 56 数字牌行星/星座 ↔ Book T 三十六旬表逐张互证；
   corpora 古典守护 ↔ Ptolemy 庙宫表 12/12 互证；Book T 表内置 11 个通行锚点。

## 站点消费位置

- 塔罗详情弹窗 → 「Waite 原文牌意 · 1911」（`src/data/waiteMeanings.ts`）
- 符文揭晓卡 → 三首卢恩诗原文+英译对照（`src/data/runePoems.ts`）
- 占星语义层 → Tetrabiblos 行星性质/庙旺（`src/data/tetrabiblosPlanets.ts`）
- 塔罗弹窗 → GD 十度分金归属（`src/data/bookTDecans.ts`）+ 现代四域解读/是非占卜（`src/data/tarotModern.ts`）
- 解梦页 → Miller 扩展词典 2250 词条，搜索时动态 import 懒加载（`src/data/dreamsMiller.ts`，独立 chunk ~265KB gzip）
- 已导出待接线：fixedStars / palmistrySections / sepharialNumbers / kunzBirthstones /
  zodiacFacts / tetrabiblosBooks34 / classicalPassages

## 来源与版权

| 语料 | 来源 | 版权状态 |
|---|---|---|
| 塔罗牌意（来源1） | A.E. Waite, *The Pictorial Key to the Tarot*, 1911（经 sacred-texts 版本与 ekelen/tarot-api 挖掘） | 公版（美国，1911年出版） |
| 塔罗牌意（来源2） | Papus, *The Tarot of the Bohemians*, 1892, A.P. Morton 英译，取自 sacred-texts | 公版 |
| 塔罗释义（来源3） | Mark McElroy, *A Guide to Tarot Meanings*（作者声明公版），取自 dariusk/corpora | 公版 |
| 盎格鲁-撒克逊卢恩诗 | 8-9世纪佚名，英译 Bruce Dickins 1915，取自 Wikisource | 原诗与译本均公版 |
| 挪威/冰岛卢恩诗 | 约13/15世纪佚名，英译 Bruce Dickins 1915，取自 Wikisource | 同上 |
| 行星守护 / 命盘专题章 | Ptolemy, *Tetrabiblos*（约2世纪），J.M. Ashmand 英译 1822 | 公版 |
| 固定恒星 | Vivian E. Robson, *The Fixed Stars and Constellations in Astrology*, 1923, Cecil Palmer | 公版 |
| 星座/宫位语义层（古典） | William Lilly, *Christian Astrology*, 1647 | 公版 |
| 星座/宫位语义层（现代） | Alan Leo (1860-1917), *How to Judge a Nativity*, 1928 ed. | 公版 |
| 解梦词条 | Gustavus Hindman Miller, *Ten Thousand Dreams Interpreted*, 1901（PG #926） | 公版 |
| 宝石/水晶民俗 | George F. Kunz, *The Curious Lore of Precious Stones*, 1913, Lippincott | 公版 |
| 手相 | Cheiro, *Palmistry for All*, 1916（PG #20480） | 公版 |
| 数字学 | Sepharial, *The Kabala of Numbers*, 约1911 | 公版 |
| 三十六旬对应 | Golden Dawn, *Book T – The Tarot*, 约1892 手稿 | 公版（原始手稿） |
| 塔罗现代结构化层（来源4） | Tarotoo-com/tarotoo-tarot-dataset v2.0.0（github，MIT） | MIT 开源 |
| 黄道事实层 | dariusk/corpora data/divination/zodiac.json（github） | CC0 |

IA=Internet Archive 公版扫描件 OCR；PG=Project Gutenberg。

### 已评估并拒绝的来源

| 来源 | 拒绝原因 |
|---|---|
| ljt-one/dream-symbols-dataset（985 词条） | 仓库无 LICENSE（默认保留版权），不可再分发 |
| metabismuth/tarot-json | 仅牌名/花色元数据，与站点已有数据重复，无释义增量 |
| dariusk/corpora gemstones.json | 仅 350 个宝石名词列表，无民俗/疗愈语义 |
| smallcat419/tarot-card-data 等 SEO 性新仓库 | 星数低、内容溯源不明（指向商业站），许可声明不可信 |

## 路线图（Roadmap）

- [x] 挪威卢恩诗 / 冰岛卢恩诗对照（v2，2026-08-25）
- [x] 第二独立塔罗牌意来源：Papus 1892（三源对照 v2，2026-08-25）
- [x] McElroy 公版结构化释义（fortune-telling/light/shadow，2026-08-25）
- [x] Ptolemy《Tetrabiblos》Book I 选章挖掘：行星性质/庙宫/旺位，与 curated 守护表交叉验证一致（v1，2026-08-25）
- [x] 中文-原文语义对齐标注 v1：22 大牌逐张（人工，含置信度）+ 56 小牌花色×阶位规则模板（依据 Papus 三段论）；已注入 AI 解读 prompt 做双语锚定（2026-08-25）
- [x] Robson 固定恒星目录挖掘 v1：96 星 nature/influence/with_sun/moon/culminating（2026-08-25）
- [x] Lilly《Christian Astrology》1647 + Alan Leo 十二宫/日座/月座语料入库，补星座宫位出处（2026-08-25）
- [x] 零语料模块补齐：Miller 解梦 / Kunz 水晶诞生石 / Cheiro 手相 / Sepharial 数字学（2026-08-25）
- [x] Tetrabiblos Book III/IV 命盘专题十章按主题挖掘 + Golden Dawn《Book T》三十六旬对应表（roadmap「Book T 占星对应」落地）（2026-08-25）
- [x] 清洗程序扩容 v2：六源重挖（kunz 0.7%→~17% / lilly 1.1%→逐座切分+格言章 /
      sepharial 4.0%→+Ch X·XII / tetrabiblos Book II 零→十二章全文 /
      leo 5.7%→~45% 五星+百条格言+逐宫 / robson 截断漏星修复+322 小节）；
      audit 22 数据集全绿、fidelity 352 抽样全绿、qa_scan 无残留（2026-08-26）
- [x] 清洗程序扩容第二批：覆盖率审计驱动，补挖 B1 全文/B3B4 全文体/星座月宿目录/
      Sepharial 19 章/Leo 元素与行星升起章/Kunz 宗教医疗章/Lilly Book II+III/IV 章节库；
      整体覆盖 leo≈72% kunz≈51% robson≈64% sepharial≈86% tetrabiblos≈90% lilly≈64%；
      audit 29 数据集全绿、fidelity 489 抽样全绿、qa_scan 无残留（2026-08-26）
- [x] 清洗程序扩容第三批：严格逐字节覆盖率审计驱动，补挖 Tetrabiblos 附录卷
      （含 Ptolemy《Centiloquy》百条格言 87 条独立解析）/ Leo 外貌与上升星座章 /
      Kunz 前半部五章 / Robson 魔法印记与星陨气象学章 / Lilly 序言与 Book I 前十六章；
      audit 34 数据集全绿、fidelity 586 抽样全绿、qa_scan 无残留（2026-08-26）
- [x] 清洗程序收尾：精确逐字节覆盖率终验（lilly 99.9% / tetrabiblos 99% /
      robson 100% / sepharial 97.8% / kunz 97.5% / leo ≈95.6%，剩余均为题页/
      广告/扫描噪声）；Leo 日月段终点锚点稳健化（v5）+ Robson 卷首导论补挖；
      audit 36 数据集全绿、fidelity 596 抽样全绿、qa_scan 无残留（2026-08-26）
- [x] 清洗程序终审：剩余区块完整导出逐区人工审读，纠正四处误判——Leo 卷首
      （两版序言/占星史专论/详细目录/星座参照表/导论）、Kunz 卷首（题献/序言/
      插图清单）、Sepharial INTRODUCTION、Tetrabiblos 题献+Advertisement+序言开头，
      全部补挖；lilly 卷首确认仅书名页维持不挖；六源覆盖 95.6–100%；
      audit 40 数据集全绿、fidelity 624 抽样全绿、qa_scan 无残留（2026-08-26）
- [x] 清洗程序精修：Robson 截断上限放宽——恒星条目分节 1600→无上限、notes 900→无上限，
      并将末星（Zosma）误吞的章尾三篇论述（世俗占星结论/新星论/魔法导论 ≈1.66 万字符）
      分离为独立 chapter_end_essays 字段；魔法章 Rules/Image 上限移除；
      audit 44 数据集全绿、fidelity 673 抽样全绿、qa_scan 无残留（2026-08-26）
- [x] 清洗程序完备性证明：覆盖率证明器（全部数据集文本反向回标原文字节）
      又揪出四处漏挖——Leo Ch II 黄道开篇论述、Kunz Ch IX 整章正文与三张表
      （印度月宝石/美国各州宝石/美德宝石对应）、Robson 月宿双清单（印度详表+
      中国表）与 Ch II 正文及岁差论文、Sepharial 各章短编号条目（失物方位/
      毕氏数值表等）、Lilly 行级清洗恢复被整段误杀的散文；
      最终逐字覆盖率：leo 99.0% / tetrabiblos 98.8% / sepharial 93.3% /
      kunz 92.0% / lilly 79.2% / robson 75.4%；剩余为星盘图表网格残骸、
      插图题注碎片与目录页码剥离造成的回标失配（数据语义已在结构化字段中）；
      audit 44 数据集全绿、fidelity 673 抽样全绿、qa_scan 无残留（2026-08-26）
- [ ] 对齐 v2：小牌逐张人工对齐 + 语义相似度评分
- [ ] fixed_stars v3：与现代星表交叉补齐黄经与星座（候选方案：HYG database RA/Dec + 岁差计算至 J1923 黄经；注意 HYG 为 CC BY-SA，衍生数据需同许可）
- [ ] 站点 corpus.ts 语义层接入研究层 v2 引用（lilly 逐座/leo 百条格言/kunz 十二月表）
- [ ] 站点接线第二批：fixedStars（星盘恒星层）/ palmistrySections（手相原文面板）/
      sepharialNumbers（数字学出处）/ kunzBirthstones（水晶页诞生石表）/
      zodiacFacts（占星页事实条）/ tetrabiblosBooks34 + classicalPassages（AI prompt 锚定）
