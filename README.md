# 神谕 · Western Oracle

一座**纯浏览器端**的西方占卜工具集：塔罗 · 西洋占星 · 生命灵数 · 卢恩符文。

无后端、无账号、无埋点——所有计算在你的浏览器内完成，数据不出本机。

## 功能

| 模块 | 说明 |
|---|---|
| ✦ 塔罗牌阵 | 78 张韦特塔罗全牌，单张指引 / 三张时序 / 十字五张牌阵，正逆位、3D 翻牌交互 |
| ☉ 西洋占星 | 输入出生信息，浏览器内计算十大星体本命盘：SVG 星盘轮、宫位、主要相位、元素/模式统计 |
| ∴ 生命灵数 | 生命路径数、生日数、表达数、灵魂愿望数、人格数（毕达哥拉斯体系，含 11/22/33 大师数） |
| ᛟ 卢恩符文 | 古弗萨克 24 符文抽取，正位/倒转，单颗或三颗牌位 |

每个模块都内置**本地规则文案解读**；可选配置任意 OpenAI 兼容接口获得 **AI 个性化解读**（密钥仅存于 localStorage，请求由浏览器直连你指定的服务商）。

## 技术栈

- Vue 3 + TypeScript（strict）+ Vue Router
- Vite 构建，按路由分包
- [celestine](https://github.com/Anonyfox/celestine) —— 纯 JS 星历计算（经 NASA/JPL/Swiss Ephemeris 验证）
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

1. 在 GitHub 新建仓库并推送本目录
2. 仓库 **Settings → Pages → Source** 选择 **GitHub Actions**
3. 推送到 `main` 即自动构建部署（见 `.github/workflows/deploy.yml`）

## 隐私

- 除「你主动配置的 AI 接口」外，本站不发起任何网络请求
- 出生信息与占卜历史仅保存在本机 localStorage

## 免责声明

本站内容用于文化与娱乐目的，不构成医疗、法律、投资建议，请理性看待占卜结果。

## License

[MIT](./LICENSE)。星历计算依赖 [celestine](https://github.com/Anonyfox/celestine)（MIT）。
