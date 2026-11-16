# Ziyue Zhang · 个人网站

仿照 [gracexygu.github.io](https://gracexygu.github.io/) 的编辑设计风格做的个人作品集：克莱因蓝 + 纸感底色、Cormorant Garamond 衬线标题、JetBrains Mono 小标签。

纯静态站点，无构建、无依赖（只有 Google Fonts 一个外链）。

## 文件

```
site/
├── index.html            页面结构与文案
├── styles.css            全部样式（颜色 / 字体 / 版式变量在 :root）
├── main.js               滚动渐入、导航高亮、关键词微交互、折扇表盘、About 打字机、小红书滑轨、光束初始化
├── side-rays.js          首页蓝色光束（React Bits SideRays 的原生 JS 移植，WebGL2）
├── pixel-snow.js         Contact 蓝色像素雪花（PixelSnow 的原生 JS 移植，WebGL2）
└── assets/
    ├── portrait-fade.png 首屏人像（原图：背景减淡为纸色 + 四边羽化）
    ├── cv.pdf            简历下载
    ├── favicon.svg       站点图标
    ├── experience/       经历卡片照片 exp-01.jpg … exp-05.jpg（已填）
    └── xhs/              小红书封面 xhs-01.webp … xhs-05.webp（已填，取自笔记原图）
```

## 交互说明

### 0. About · 打字机动效

标题「从通信工程，走到 AI 产品。」和三段自述在滚到视口时**逐字敲出来**。

- HTML 上给元素加 `data-type="速度"`（毫秒/字），JS 会把每个字包成 `<span class="tw">`，光标 `.tw-caret` 插在「下一个待打的字」前面
- 关键取舍：**未打出的字只设 `opacity:0`，仍然占位**。所以行高、断行在打字前就定好了，光标沿既有的字格走，不会边打边跳版
- 中文标点（，。、：；？！）后多停 150ms，读起来像真的在敲；标题 29ms/字、正文 6.5–13ms/字、段间停 220ms，最后光标闪 2.2s 再淡出（2026-11 整体提速一倍，原来是 58 / 13）
- 第一段只留「我现在在中传读…」这一句，原来开头括号里的说明已删
- 打字段落里的 `<b>` 带底部蓝色高亮，字没打出来时高亮会浮在半空 —— 用 `.is-typing b{background-image:none}` 先关掉，这段打完再恢复
- `prefers-reduced-motion` 或 `?static=1` 时直接显示全文（光标也不留）
- 没有 JS 时文字正常可见：隐藏是 JS 加的，不依赖 CSS

### 0.5 首屏 · 蓝色光束（SideRays）

首页右上角射进来的那束蓝光，是 React Bits `<SideRays />` 的原生移植（`side-rays.js`），跟像素雪花同一套路：IIFE 挂在 `window.createSideRays(el, opts)`，返回 `destroy`，不引入 React、不加构建链。

- 容器 `index.html` 里的 `<div class="hero-rays" data-rays>`；`.hero-rays{position:absolute;inset:0;z-index:0;pointer-events:none}`，`.hero-grid` 在 1 层，所以光束从背后透上来但不吃鼠标事件
- `.hero` 补了 `padding-top`，给光束留出「从顶上打下来」的起点；`origin:'top-right'` 对应人像那一侧
- **`lightMode:true` 必须开**：纸白底上不开这个会把颜色加成近白、整片糊掉（和雪花同理）
- 参数在 `main.js` 末尾：`intensity:2.0`、`spread:1.7`、`density:12`、`sharpness:0.78`、`falloff:1.9`、`glow:0.18`、`opacity:0.55`、`blend:0.2`、`c1:#002FA7` / `c2:#2F5BE0`
- 调参经验：早期 `intensity 1.05 / spread 1.9 / sharpness 0.3` 是一坨雾，看着像背景脏了；要「光束」感就得**窄扇形（spread↓）+ 多光柱（density↑）+ 锐边（sharpness↑）+ 低辉光（glow↓）**，颜色只用纯克莱因蓝、`blend` 压到 0.2 防止发紫
- `followMouse:true`、`mouseInfluence:0.35`：鼠标移动时整束光轻微跟手
- 截图验证要加 `--use-gl=swiftshader`（WebGL2 在 headless 下默认不启用，否则整块是空的）
- 不支持 WebGL2 时 `createSideRays` 返回 `null`，容器留空，首屏排版不受影响

### 1. 作品区（Selected Work）· 索引表 + 点击展开

7 条内容（3 个产品案 + 4 个实验）平铺成一张索引表，不再一屏一屏铺长文；点某一行才展开它的拆解。

- 结构：`.work-index` > `.work-item` × 7；每行是 `<button class="wi-head">`（索引号 / 标题 + 类型·场景·时间 / 数字 / 圆形加号）；展开体在 `.wi-panel` 里
- 三条产品案用 4 个 `.wi-cell`（需求拆解 → 落地），四个实验用 3 个（角色 / 规模 / 产出），加 `--3` 修饰类
- 展开动画：`.wi-panel{grid-template-rows:0fr → 1fr}`（比 `max-height` 更贴内容高度）+ 内层 `opacity / translateY`，缓动 `cubic-bezier(.22,.75,.28,1)`
- 交互：点击切换、**同时只开一条**（打开新的会自动收起旧的）、加号旋转成「−」、标题与数字变克莱因蓝、行底色淡淡泛蓝
- 键盘：`Tab` 到行，`Enter / Space` 展开；`↑ ↓` 换行、`Home / End` 到首末行；收起状态下里的链接 `tabindex="-1"`，不会被 Tab 误入
- 加内容：复制一个 `.work-item`，改 `wi-idx`、`wi-title`、`wi-sub` 三个 `.mono`、`wi-stat`，以及 `id="wi-pNN"` 与 `aria-controls`
- 响应式：`≤1080px` 详情格子两列；`≤760px` 面板左侧内缩取消、格子两列；`≤520px` 格子单列、数字缩到 16px
- 区块引导：原来那句大标题「三件产品，四个实验。」已删，`.work-lead` 里只剩 `Focus：…` 一句，由它自己当标题 —— 字体跟全站一致走 `--serif`，`clamp(21px, 2.15vw, 30px)`、行高 1.58、`letter-spacing:.012em`；只有 `用户 / 产品 / 实验` 三个名词用 `<em>` 标克莱因蓝（不加斜，中文合成斜体在大字号会飘），`Focus` 用 Cormorant 斜体、颜色同正文
- 窄屏断行：三个分句各自包在 `<span class="cl">` 里，`≤760px` 设 `display:inline-block`，让整句按分句换行（760 断在第一个逗号、492 三行一句一行），不会把「改变行为」拆成「改变行 / 为，」
- 论文外链：E-Match（04）挂了 3 篇（Acta Psychologica 综述 / SSRN 团队心率耦合 / IEEE CIML SigFuse-DualCNN），Xuefei（05）挂了 1 篇（IJHCI · PAMA），都用 `https://doi.org/10.xxxx` 直链写在 `.wi-links` 里 —— 全部 `curl -x` 验证过 302 可跳转；`.wi-links` 是 `flex-wrap` 的单行小字，再加链接会自然折行，不用改样式

### 2. 首屏人像

`portrait-fade.png` 是**原图直出**：没有抠图，而是把蓝幕背景按「蓝色度」判定后整体压向纸色 `#F5F5F4`，再做矩形羽化（左右 7.5%、上 4.5%、下 16%），所以图片边界与页面底色完全重合，看不出方框。

- 生成脚本：仓库根目录 `fade.py`（换图后重跑一次即可）。
- 换图时无需改代码，只要覆盖 `assets/portrait-fade.png`；若原图背景色差很大，重跑 `fade.py` 会重新做纸色对齐。
- 桌面端图右侧越出版心（`.hero-side` 的负 `margin-right`），移动端改为居中、完整显示。

### 3. 经历区（Experience）· 折扇 + 表盘

1:1 复刻参考站的做法：5 张照片卡以 `transform-origin: center bottom` 为圆心排成折扇，下方是一条刻度弧（41 根刻度）+ 指针 + 年份标记。

- 几何常量在 `main.js`：`SPREAD=14`（每张卡角距）、半径 `radius()`、`cardRot()`（卡片自身旋转）
- **卡片半径**：`>1080px → 499`，`≤1080px → 400`，`≤760px → 300`，`≤520px → 220`
- **表盘半径只有卡片的一半**（2026-11 改小）：`.dial-arc-center` 方块边长 500/400/300/220 → R = 250/200/150/110。卡片与表盘不再同心，是有意的——扇面撑开照片，表盘只做克制的时间刻度，别再把它调回 1:1
- 交互：点当前卡翻面看详情 / 点侧卡或年份切换 / Prev、Next / 刻度跳转 / 拖拽 / 触控板横向滑动 / 键盘 ← →
- 年份标记在独立图层 `.dial-markers` 里用三角函数定位，**不随圆环旋转**，文字永远正立
- ⚠️ `.dial-clock` 高度 = **弧顶留白 + 可见弧深**，四档 157 / 135 / 107 / 91。弧顶留白（`.dial-arc-center` 的 `top`：40 / 40 / 34 / 34）必须放得下最上面那个年份标签，否则 `overflow:hidden` 会把「2020」切掉一截
- ⚠️ `.dial-marker-year` 一定要显式写 `line-height:1.1`：继承 body 的 1.9 会让标签盒子高达 24px，顶部年份被裁。加卡片或改 `SPREAD` 时这两个值一起看
- 卡片照片按 `exp-01.jpg … exp-05.jpg` 放入 `assets/experience/`；缺失时自动回退成「年份水印 + photo to be added」占位，不会出现破图
- 卡片背面文案（`.fan-flip-back .description`）：2020 专业排名 + 竞赛、2024 荣誉 + 论文、2026.04 商拍链路、2026.07 三个 0→1 方向；**武汉大学（Era_2021）背面只有校名/专业/城市**，没有正文 —— 该卡加了 `.is-bare` 修饰类，把 `.fan-location` 的 `margin-top:auto` 归 0，四项信息整体居中，读起来像一张名片而不是缺了段落（这是「一学期交换、无额外成果」的诚实表达，别硬填字数）
- ⚠️ 2024 那条文案最长（约 80 字），小屏会溢出：`≤760px` 起 `description` 降到 10.5px/1.7、内边距 18/16，`≤520px` 再降到 9.5px/1.58、`subtitle-back` 10px，四档（1440/1080/760/492）实测 `scrollHeight == clientHeight`。以后往任意卡片加字，先跑这个溢出检查

### 4. Beyond work — Xiaohongshu · Share Foods & Life

3D 圆柱环绕轮播那版**已弃用**（侧面卡片透视失真，观感不好），现为横向滑动卡片条，边缘用 `mask-image` 做渐隐，底部有进度条。

- 5 篇笔记 + 1 张 `All notes` 卡，全部指向真实笔记页（带 `xsec_token`，可直开）：
  | # | 笔记 | 赞 |
  |---|---|---|
  | 01 | 我将永远拥护这杯！ | 1,297 |
  | 02 | 也没人告诉我苹果树这么美啊啊（Gleaning） | 1,119 |
  | 03 | 不是首尔！是五道口！！！ | 941 |
  | 04 | 北京最近吃过的意面🍝（合集版） | 266 |
  | 05 | 北京美术馆的夏日仙品 梅果gelato华夫饼 | 203 |
- 封面：`assets/xhs/xhs-01.webp … xhs-05.webp`，直接取笔记原图（3:4，webp 比 jpg 小一半）；文件名与卡片 `data-frame` 顺序不一定对应（03 卡用的是 xhs-04.webp，按点赞排序与文件名顺序不同，改图时认 `alt`）
- 卡内结构：`.xhs-cover`（3:4 封面 + 渐变 emoji 兜底）→ `.xhs-info > .xhs-text`（标题两行截断 + `.xhs-meta` 心动数）→ `.xhs-go ↗`；`.xhs-title` 设了 `min-height:40px`，让一行标题和两行标题的卡片高度一致
- 头部统计：`1万+ / Likes & saves`（账号获赞与收藏）、`3,826 / On 5 picks`（这 5 篇点赞之和）。粉丝数小红书显示为「10+」，放上去反而掉价，故不展示
- `.beyond-stats` 原本为了等真实数字写成 `display:none`，已改回 `display:flex`
- 抓数据的办法：`agent-browser` 用 **headed 模式 + 全新 `--session`** 打开笔记页（headless 会被风控判 `error_code=300012`，curl/WebFetch 只能拿到登录页或纯文本），再用 `eval` 读 `.engage-bar .count` 与 `.media-container img`；封面图 URL 有时效（`sns-webpic-qc.xhscdn.com/2026...`），拿到要立刻下载

### 5. Contact 尾部 · Toolkit 融进页脚前

**底色已从克莱因蓝改成和其他区一样的纸白**（2026-11），蓝只留在标题斜体、栏题、邮箱 hover 和雪花上：

- `.contact{background:var(--paper);color:var(--ink)}`，顶部补 1px 的 `--rule` 分隔线、`padding-top:104px`，和 `.section` 的节奏对齐
- 原来所有 `#fff / rgba(255,255,255,x)` 的浅字改为 `--ink` / `--ink-2` / `--mist`，`#AFC2FF` 换成 `--klein`；印章圆环描边与旋转文字也一起换成蓝
- 蓝色像素雪花：`.contact-snow`（`position:absolute` 铺在标题这一段，`z-index:0`；`.contact-inner` 与 `.footer` 抬到 1 层）里由 `pixel-snow.js` 画一块 WebGL2 canvas
- 雪花只铺标题区（`height:clamp(420px,72vh,700px)`）+ `fade:0.3` 底部渐隐，Toolkit 的小字不被压住。想整页飘雪，把 `.contact-snow` 改回 `inset:0` 即可
- 参数在 `main.js` 末尾：`color` 用克莱因蓝、`lightMode:true`（浅底必须用彩色像素模式，深底模式会把颜色加成近白）、`density:0.2`、`flakeSize:0.45`、`pixelSize:2`。**别用组件默认的 0.5 / 1 / 3**，那样是暴雪，会盖住字
- `pixel-snow.js` 是 React Bits `<PixelSnow />` 的逐行原生移植（去掉 hooks，改成 `createPixelSnow(el, opts)` 返回 `destroy`），没上 React、没加构建链；不支持 WebGL2 时返回 `null`，容器留空不影响排版
- 鼠标划过会拨开雪花（`mouseInteraction`），离开视口由 IntersectionObserver 停掉 rAF 循环

Toolkit 收在 Contact 尾部、页脚之上：

- 结构与样式：`index.html` 里的 `.contact-toolkit` / `.ctk-grid` / `.ctk-col`，样式在 `styles.css` 的 CONTACT 段末尾
- 视觉：一条 `--rule` 分隔线起头，`Product / Tools / Technical` 三栏，栏题克莱因蓝，条目用 `--rule-soft` 细线分隔，hover 变蓝并右移 6px
- 分隔线与大邮箱之间靠 `.contact-toolkit` 的 `margin-top` 撑开（桌面 76px / ≤760px 60px / ≤520px 50px），因为原来承担这段留白的是 `.contact-links` 的上下 padding
- 响应式：`≤760px` 三栏改单列，`≤520px` 缩小条目字号
- 区块编号：Beyond work = `04`，Contact = `05`（Notes 小节已整段删除，编号随之收敛）

### 5.1 已删除的两处 Contact 元素

- **联系链接行**（`.contact-links`：Email / 电话 / GitHub / Rednote / Puppyland / CV / Beijing · GMT+8）整块移除。现在 Contact 区只剩一个大的 `zzy2526@outlook.com` 邮箱链接作为唯一行动点，GitHub / 小红书 / CV 仍可从导航和 Beyond 区进入。CSS 里的 `.contact-links` 主规则与两处媒体查询覆盖一并删除。
- **Toolkit 表头**（`.ctk-head`：`Toolkit` + `工具 / 技能 / 语言`）移除。三栏各自的栏题（Product / Tools / Technical）已足够说明内容，不再需要总标题。`.ctk-head` / `.ctk-hint` 样式同步删除。
- **页脚色值行**（`<span class="mono">Klein Blue no. 002FA7</span>`）移除。页脚现在只剩「© 2026 Ziyue Zhang · 张子玥」与「Back to top ↑」两项，`justify-content:space-between` 自动左右分置，不需要改样式。

## 本地预览

直接双击 `index.html` 即可。或起一个本地服务：

```bash
cd site
python -m http.server 8000
# 打开 http://localhost:8000
```

调试用参数：`?static=1` 会跳过滚动渐入（截图 / 录屏用）。

## 部署到 GitHub Pages

**已上线**：<https://lunarzz221.github.io/>

- 仓库：`LunarzZ221/LunarzZ221.github.io`（public，原 `crystal.github.io` 已改名），分支 `main`，Pages source = `main` / `root`，`https_enforced` 已开
- 仓库名等于 `username.github.io`，所以是**用户站点**，直接挂在根域名下，没有子路径
- 全站资源全部用相对路径（`styles.css`、`assets/...`），根域名和子路径都能跑，不需要改 `<base>`
- 仓库根目录放了空文件 `.nojekyll`，跳过 Jekyll 处理（构建更快，也避免以后出现下划线文件名被忽略）
- 本地 `git remote` 已指向新仓库；旧的 `/crystal.github.io/` 子路径现在 404（不是跳转），如果之前在别处贴过，需要换成新地址

日常更新只需要：

```bash
cd site
git add -A && git commit -m "更新说明" && git push
```

推送走 HTTPS 时需要本机代理（当前仓库已写入 `http.proxy=http://127.0.0.1:7897`，与 Clash 默认端口一致；代理没开时 push 会 443 超时）。推完等 1 分钟左右自动构建，看构建状态：仓库 Actions / Settings → Pages。

## 还差什么（素材到位就能填满）

- [x] **经历照片** `assets/experience/exp-01.jpg … exp-05.jpg`：已按顺序填入（电信之星发言 / 演出后抱花 / 校园活动 / 街头 / 形象照）。原图有 4:3、3:2、3:4 混排，靠 `object-fit:cover` 居中裁切，焦点都在正中，不需要逐张调 `object-position`
- [x] **小红书封面** `assets/xhs/xhs-01.webp … xhs-05.webp`：已抓 5 篇真实笔记原图（3:4 webp）
- [x] **获赞数**：账号获赞与收藏 1万+、5 篇精选合计 3,826，已写进 `.beyond-stats`
- [x] **论文外链**：E-Match 3 篇、Xuefei 1 篇，DOI 直链已挂
- [ ] **正式版 CV**：替换 `assets/cv.pdf`（现在这份是简历图片导出的，文字不可选）
- [ ] **项目链接**：Xuefei / E-Match 若有 Demo 或仓库，可按 `.wi-links` 再补一行
- [ ] **域名**（可选）：在 Pages 设置里绑定自定义域名

## 设计变量速查

| 变量 | 值 | 用途 |
|---|---|---|
| `--klein` | `#002FA7` | 主色（克莱因蓝） |
| `--ink` | `#1A1A1A` | 正文黑 |
| `--paper` | `#F5F5F4` | 纸感底色（人像融合的对齐色） |
| `--green` | `#16805C` | 数据结果（如 −40%） |
| `--serif` | Cormorant Garamond / Noto Serif SC | 标题、引言 |
| `--mono` | JetBrains Mono | 标签、编号、meta |

断点：`1080px`（收窄双栏）、`760px`（单列 + 藏导航链接）、`520px`（更紧凑的折扇 / 表盘 / 首屏）。
