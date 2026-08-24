# 神谕 · Western Oracle

一座**纯浏览器端**的西方占卜工具集：塔罗 · 西洋占星 · 合盘 · 行运 · 生命灵数 · 卢恩符文。

无后端、无账号、无埋点——所有计算在你的浏览器内完成，数据不出本机。
全站 8-bit 像素画风：78 张牌面经像素化重绘，与像素小巫女「露娜」同一画风——点她可以听星星的悄悄话。

## 功能

| 模块 | 说明 |
|---|---|
| ✦ 塔罗牌阵 | 78 张韦特塔罗（1909 公版 RWS 插图），单张 / 三张 / 十字五张 / **凯尔特十字十张大阵**，正逆位、3D 翻牌 |
| ☉ 西洋占星 | 本命盘计算 + SVG 星盘轮（宫位、相位、元素/模式统计） |
| ☍ 合盘 Synastry | 双人比较盘：双环星盘轮 + 交叉相位 chips，看缘分深浅 |
| ⟳ 行运 Transits | 此刻天空 × 你的本命盘：内环行运盘、行运相位按紧密排序、今日月相、可随时刷新 |
| ∴ 生命灵数 | 生命路径 / 生日 / 表达 / 灵魂愿望 / 人格五数 + 今日流年流月流日 |
| ᛟ 卢恩符文 | 古弗萨克 24 符文抽取，正位/倒转，单颗或三颗牌位 |

- 每个模块都内置**本地规则文案解读**；可选配置任意 OpenAI 兼容接口获得 **AI 个性化解读**（密钥仅存 localStorage，浏览器直连服务商）
- 首页每日板块：每日一牌（按日期全局确定）、每日符文、实时月相
- 互动彩蛋：像素女巫打字机对话、翻牌星屑爆裂、鼠标星星拖尾、随机流星、卡片 3D 跟随倾斜、符文石逐颗揭晓、灵数跳字滚动、星盘轮缓旋装饰环（尊重 `prefers-reduced-motion`）

## 技术栈

- Vue 3 + TypeScript（strict）+ Vue Router
- Vite 构建
- [celestine](https://github.com/Anonyfox/celestine) —— 纯 JS 星历计算（经 NASA/JPL/Swiss Ephemeris 验证）
- 字体：[ZCOOL KuaiLe](https://fonts.google.com/specimen/ZCOOL+KuaiLe)（站酷快乐体，OFL）+ Press Start 2P（OFL），经 fontsource 自托管
- 随机数基于 `crypto.getRandomValues`
- GitHub Actions 自动部署到 GitHub Pages

## 本地开发

```bash
npm install
npm run dev      # 开发服务器
npm run build    # 类型检查 + 产物构建（输出到 dist/）
npm run preview  # 预览生产构建
```

## 部署到 GitHub Pages

1. Fork / 推送本仓库
2. 仓库 **Settings → Pages → Source** 选择 **GitHub Actions**
3. 推送到 `main` 即自动构建部署（见 `.github/workflows/deploy.yml`）

## 版权与隐私

- 塔罗牌面基于 1909 年 Rider-Waite-Smith 插图（Pamela Colman Smith 绘，公有领域），经像素化重绘（缩块 + 调色板量化 + 最近邻放大）以统一 8-bit 画风
- 除「你主动配置的 AI 接口」外，本站不发起任何网络请求；出生信息与占卜历史仅保存在本机 localStorage

## 免责声明

本站内容用于文化与娱乐目的，不构成医疗、法律、投资建议，请理性看待占卜结果。

## License

[MIT](./LICENSE)。星历计算依赖 [celestine](https://github.com/Anonyfox/celestine)（MIT）。
