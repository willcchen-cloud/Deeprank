# 精准打磨 DeepRank 主页宇宙风

Written against: `657c216efe5ec29c583157d4cf02d8ebb3405afd`

## Design language

- Audited surface: `index.html` 对应的公司主页，包括首屏、数据流程、采集系统、质量层、保密交付、终屏联系区、移动导航与联系 Modal。
- Design sources: `index.html`、`styles.css`、`script.js`、`favicon.svg`、`assets/hero-galaxy.png`、`assets/images/*.png`，以及本地 `dist` 的实际渲染结果。
- Documented decisions: `README.md` 只记录静态发布和联系渠道，没有主页视觉规范；本计划以现有运行路径、素材、双语字典、响应式分支和用户已选择的“A：精准打磨现有宇宙风”为约束。
- Governing owners and consumers: `index.html` 拥有内容与语义；`styles.css` 拥有字体、全屏构图和响应式布局；`script.js` 拥有双语、菜单、Modal、表单与 Canvas 生命周期；`tests/site-browser.spec.js` 和 `tests/site-regression.test.js` 拥有浏览器与源码回归；`scripts/build-static.js` 拥有发布白名单。
- Explicit exceptions: None documented.

## Evidence chain

- Surface: `/`，1440×1000 桌面渲染。
- Problem: 终屏同时显示 “Contact DeepRank” 和 “Discuss a Data Project”，但两者均为 `[data-contact-open]`，进入同一个 Modal；浏览器验证两者没有不同的目标或上下文。
- Design evidence: `index.html` 的 `.final-actions`；`script.js` 的 `contactOpenButtons.forEach(...openContactModal)`；现有终屏主次按钮样式。
- Owner: `index.html`、`script.js`、`styles.css`。
- Scope and affected surfaces: 终屏英文和中文状态、联系 Modal 触发器、焦点归还、相关浏览器测试。
- Uncertainty: None；用户已经决定收敛为一个主要联系 CTA，且明确要求不改变 Modal 协议和打开逻辑。

- Surface: 首屏 `.hero-cta` 到第二、第三章节的页面顺序。
- Problem: 首屏 CTA 当前指向 `#capture-systems`，跳过编号为 02 的 `#technology`，直接进入编号为 03 的采集系统。
- Design evidence: `index.html` 的 `href="#capture-systems"`、`id="technology"`、`id="capture-systems"` 和章节编号；浏览器基线确认 URL 进入 `#capture-systems`。
- Owner: `index.html`。
- Scope and affected surfaces: 英文和中文首屏共用同一链接目标；现有锚点滚动测试。
- Uncertainty: None；用户已指定改为 `#technology`。

- Surface: `#confidential-delivery`，641–920px。
- Problem: `@media (max-width: 920px)` 中正文保留约 460px 宽，而 `.confidential-features` 绝对定位为 390px 宽；实际测量在 641px 产生 257×133px 重叠，在 768px 产生 130×133px 重叠。900px 和 920px 未重叠，但仍依赖脆弱的绝对位置。
- Design evidence: `styles.css` 的 `.confidential-copy`、`.confidential-features`、`.confidential-flow` 及 920/640px 分支；`/tmp/deeprank-homepage-768.png` 的实际渲染。
- Owner: `styles.css`。
- Scope and affected surfaces: 保密交付章节的英文/中文、641、768、900、920px；桌面大于 920px 的电影化构图除外。
- Uncertainty: None；应在 920px 及以下统一进入正常文档流，消除绝对定位碰撞。

- Surface: 首屏能力坐标，390×844。
- Problem: 640px 以下 `.coordinate-point__text` 和连接线均为 `display:none`，六个能力项只剩 22×22px 圆点；浏览器验证六组文字全部隐藏，无法从视觉上理解能力含义。
- Design evidence: 现有 `.coordinate-layer`、六个 `.coordinate-point`、`heroNodes.*` 双语字典和 640px CSS 分支；`/tmp/deeprank-homepage-390.png`。
- Owner: `index.html` 的现有坐标结构、`styles.css` 的移动分支、`script.js` 的 `heroNodes` 文案。
- Scope and affected surfaces: 390px 及其他不超过 640px 的移动端；大于 640px 的星系坐标布局除外。
- Uncertainty: None；复用现有六个能力项和 `.coordinate-point__zh`，不创建第二套内容。

- Surface: 全页英文、中文标题和 UI 字体。
- Problem: CSS 声明 `Inter`，但项目没有字体文件或 `@font-face`，并大量使用 200/220/240/260 字重；本地 Chrome 恰好可解析 `Inter`，但该能力不由发布产物保证，跨系统会回退或合成字重。
- Design evidence: `styles.css` 的 `body`/`.is-en`/`.is-cn` 字体栈和各标题选择器；发布白名单中没有字体资产；用户已要求不使用 CDN、不下载字体并改用可靠系统字体和标准字重。
- Owner: `styles.css`。
- Scope and affected surfaces: 首屏、五个内容章节、卡片标题和联系 Modal 标题；字号、行高、颜色与间距除外。
- Uncertainty: None；采用现有平台字体和 300/400 标准字重，不引入资源。

## Current visual baseline

- 1440px: 深蓝黑宇宙、冷白 HUD、少量暖色星光、玻璃卡片和左文右景构图形成稳定品牌身份；首屏、流程、采集、质量、保密、终屏素材语言连贯。
- 768px: 主体无横向溢出，但保密正文和五张卡片明显重叠，信息层级不可读。
- 390px: 主体无横向溢出；首屏坐标文字全部消失，只剩六个圆点；终屏两个相同功能 CTA 纵向堆叠。
- Modal: 打开后初始焦点进入 `email`；背景 `.hero` 和 `.page-flow` 均 inert；焦点可从关闭按钮反向循环到提交按钮；Escape 关闭后焦点返回触发器。
- 移动菜单: Enter 打开后 `aria-expanded=true`、导航解除 inert；Escape 关闭后恢复 inert 并将焦点归还菜单按钮；语言切换后菜单关闭。
- Motion: Canvas 保持单一 RAF；现有 CSS reveal/背景动效继续由 CSS 管理。390px 下为 620 个 dust 粒子和 16 个 flow；reduced-motion 下 Canvas 停止、背景动画为 0s、reveal 直接可见且无 transform。
- Audit artifacts: `/tmp/deeprank-homepage-desktop-1440.png`、`/tmp/deeprank-homepage-768.png`、`/tmp/deeprank-homepage-390.png`。它们仅为本次本地证据，不进入仓库。

## Goals

1. 终屏只保留一个明确的主要联系 CTA，继续打开原 `#contactModal`。
2. 首屏 CTA 按页面叙事进入 `#technology`，英文和中文行为一致。
3. 920px 及以下的保密交付内容使用稳定的正常文档流/网格，641–920px 不发生正文与卡片重叠。
4. 640px 及以下将现有六个星系坐标改为紧凑、可读的双语能力标签，同时保持桌面坐标视觉不变。
5. 使用不依赖下载的系统字体栈和 300/400 标准字重，保留当前超轻、冷静的科技感。

## Non-goals

- 不替换深空图片、配色、背景合成、favicon、页头品牌符号或整体章节顺序。
- 不处理 SEO、Open Graph、结构化数据或其他 metadata；不调用或执行 `fixing-metadata`。
- 不改变联系表单字段、校验、busy 状态、toast、`POST /api/contact-leads` 请求体或 Netlify Function/后台记录逻辑。
- 不改变 Modal 的焦点陷阱、背景 inert、Escape 关闭和焦点归还协议。
- 不改变移动菜单的键盘、inert、`aria-expanded` 和断点状态机。
- 不重写 Canvas、粒子数量、单 RAF、resize 节流、visibility 或 reduced-motion 生命周期。
- 不修改构建白名单、发布边界、后台页面、数据库、服务端代码或静态图片。
- 不增加客户名称、案例、指标、认证或业务承诺。

## Design decision

把“A：精准打磨”作为一个统一的主页收敛决策：保留现有宇宙视觉和运行协议，只修正用户已经确认的内容层级、锚点顺序、响应式布局、移动信息呈现和字体可移植性。所有实现复用现有 HTML 元素、i18n 字典、CSS 断点、按钮样式和测试入口；不新增组件库、字体资产、动画系统或 API。

## Reuse

- `index.html` 的 `.hero-cta`、`.final-actions`、`.coordinate-layer` 和六个 `.coordinate-point`。
- `script.js` 的 `heroNodes.*.label`、现有空的 `heroNodes.*.zh`、`renderI18n()` 和通用 `contactOpenButtons` 绑定。
- `styles.css` 的 `--ink`、`--muted`、`--soft`、玻璃边框/背景、移动 640px 与菜单 920px 断点。
- Exemplar: 桌面 `.coordinate-point` 的点、线、主标签层级；移动 `.site-nav` 的紧凑玻璃面板；`.capture-info` 的可读卡片边框和背景。
- 新增两个排版 token：`--font-sans-en`、`--font-sans-cn`，以及 `--font-weight-light: 300`、`--font-weight-regular: 400`。现有系统没有可发布字体所有者，而这些值需要统一服务首屏、章节标题、卡片标题和 Modal 标题，因此集中在 `:root`，不建立额外组件。

## Changes

1. `index.html`
   - Change: 将首屏 `<a class="hero-cta">` 的 `href` 从 `#capture-systems` 改为 `#technology`；不改变 `data-i18n="hero.cta"` 文案或箭头结构。
   - Change: 删除 `.final-actions` 中带 `.final-button--quiet` 的第二个按钮，只保留 `data-i18n="final.primaryCta"` 的主要按钮。
   - Preserve: 保留主要按钮的 `type="button"`、`aria-haspopup="dialog"`、`aria-controls="contactModal"` 和 `data-contact-open`，因此 Modal 打开与焦点归还仍使用现有逻辑。
   - Preserve: 复用六个现有 `.coordinate-point` 和各自双语 `aria-label`；不复制能力列表，不添加新交互控件或伪 ARIA。
   - Verify: DOM 中恰好一个 `[data-contact-open]`；首屏链接恰好指向现有 `#technology`；页面仍只有一个 `h1`，章节标题层级不变。

2. `script.js`
   - Change: 删除英文 `final.secondaryCta` 和中文 `final.secondaryCta` 两个不再有消费者的字典键。
   - Change: 填充现有 `heroNodes.*.zh`：英文模式提供对应中文短标签，中文模式提供对应英文短标签。使用现有 `renderI18n()` 渲染，不增加 DOM 写入机制。
   - Preserve: 不改 `contactOpenButtons`、`openContactModal()`、`closeContactModal()`、`getModalFocusableElements()`、`submitContactForm()`、移动菜单函数和 Canvas 函数。
   - Preserve: 不新增 fetch，不改变 `/api/contact-leads`、HTTP method、JSON 字段或错误处理。
   - Verify: 切换语言后移动能力项的主/次语言顺序互换；唯一 CTA 的文本在英文为 “Contact DeepRank”，中文为“联系深序科技”。

3. `styles.css` — 字体与 CTA
   - Change: 在 `:root` 定义可靠的本地系统字体栈。英文栈使用 `"Helvetica Neue", Arial, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`；中文栈使用 `"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`。移除未随项目发布的 `Inter`/远程字体假设。
   - Change: 将当前 200、220、240、260 的展示字重统一映射到 `var(--font-weight-light)`（300）；保留正文与标签现有 300，品牌/必要强调使用现有 400。不得使用非标准中间数值。
   - Change: 删除仅服务已移除第二 CTA 的 `.final-button--quiet` 规则；保留 `.hero-cta`、`.final-button` 和 reduced-motion 行为，并为 `.hero-cta:focus-visible` 增加明确的 outline/offset，使用现有冷白边框色，不只复用 hover 颜色变化。
   - Preserve: 字号、行高、字距、颜色、最大宽度、背景和按钮几何不作为本阶段重设计对象。
   - Verify: 源码不包含 `font-weight: 200|220|240|260`；不新增 `@font-face`、外部 URL 或字体文件；1440/768/390px 标题仍保持轻盈且不截断。

4. `styles.css` — 保密交付响应式策略
   - Change: 桌面大于 920px 的绝对构图完全保留。
   - Change: 在 `@media (max-width: 920px)` 中让 `.confidential-section` 成为纵向正常流容器，保持背景层 absolute；将 `.confidential-features` 改为 `position: relative`、清除 `top/right/left`、宽度 100%、正文后留固定间距，并使用两列 `repeat(2, minmax(0, 1fr))` 稳定网格；第五张卡横跨两列。
   - Change: 同一断点将 `.confidential-flow` 改为正常流元素，清除 `left/right/bottom`，放在卡片网格之后；章节高度由内容决定，不再以 980px 和绝对坐标维持间距。
   - Change: 在 `@media (max-width: 640px)` 中把卡片网格降为一列，取消第五张卡跨列；保留现有五列紧凑流程条，但作为正常流元素，并移除旧的 `top: 438px`、固定 `min-height: 1080px` 等补偿值。
   - Preserve: 保密背景图、shade、focus glow、卡片视觉、流程顺序和中英文内容。
   - Motion constraint: 仅改变静态布局；保留现有一次性 opacity/translate reveal，不动画 grid、height、top、width 或其他布局属性，不新增 blur 动画。
   - Verify: 641、768、900、920px 下 `.confidential-copy` 与 `.confidential-features` 的矩形交集面积为 0；无横向溢出；中文长文案不覆盖卡片或流程条。

5. `styles.css` — 390px 移动能力标签
   - Change: 仅在 `@media (max-width: 640px)` 将 `.coordinate-layer` 从全屏绝对坐标改为首屏内容后的正常流双列网格，清除 parallax transform、各节点 `left/top` 和 `translate(-50%, -50%)`。
   - Change: 填充字典后，在基础/桌面规则中明确保持 `.coordinate-point__zh { display: none; }`，避免新次语言文字进入桌面星系坐标；仅在 `@media (max-width: 640px)` 恢复显示。
   - Change: 每个 `.coordinate-point` 使用现有玻璃语言形成紧凑信息单元，最小高度至少 44px；显示 dot、主语言 `.coordinate-point__label` 和次语言 `.coordinate-point__zh`，隐藏 code、连接线和长 note。
   - Change: `.coordinate-point__text` 在移动端恢复 `display:block`、允许换行并清除绝对定位；`.coordinate-point__zh` 以更低对比度作为第二行，但仍保持可读。
   - Change: 为移动端 `.coordinate-point:focus-visible` 提供明确的边框/outline；焦点或 active 状态只能通过 transform/opacity/颜色反馈，不改变网格尺寸。
   - Change: 调整移动 `.hero__content` 的 `min-height`/底部间距，使能力网格进入首屏正常流并避免与 CTA、页头或下一章节相撞；不得用新的绝对 `top` 值把问题转移到其他手机高度。
   - Preserve: 大于 640px 的星系坐标位置、点线、hover/focus detail 和鼠标视差完全不变；既有双语 `aria-label` 保留。
   - Accessibility constraint: 不新增无名称控件、不使用 `tabindex>0`、不移除默认键盘可达性；标签不能仅在 hover 时出现。
   - Motion constraint: 移动网格不继承 `--mx/--my` 位移，不新增 RAF、scroll listener 或 CSS 变量动画。
   - Verify: 390px 六个能力项均有可见主/次语言文本、焦点可见、无横向溢出；英文和中文模式都不截断关键标签。

6. `tests/site-regression.test.js`
   - Change: 将首屏 CTA 源码断言从 `#capture-systems` 更新为 `#technology`。
   - Change: 增加唯一 `[data-contact-open]`、不存在 `final.secondaryCta`、六组 `heroNodes.*.zh` 已填充、没有外部字体/`@font-face` 和没有 200/220/240/260 字重的源码断言。
   - Preserve: 现有移动菜单、Canvas finite coordinates、resize/visibility/reduced-motion 生命周期测试。
   - Verify: 测试不执行网络请求，不依赖外部字体安装状态。

7. `tests/site-browser.spec.js`
   - Change: 首屏 CTA 测试改为进入 `#technology`；终屏断言恰好一个主要 CTA，并删除第二 CTA 打开/焦点归还分支。
   - Change: 保留并复用现有 Modal 测试，验证唯一 CTA 仍可 Enter 打开、初始焦点进入表单、Tab/Shift+Tab 循环、Escape 关闭并归还同一触发器。
   - Change: 新增 641、768、900、920px 保密交付矩形不相交断言，并逐一验证 `scrollWidth <= clientWidth`。
   - Change: 在 390px 验证六个 `.coordinate-point__label` 与六个 `.coordinate-point__zh` 可见、每个能力项位于视口宽度内、双列网格无横向溢出；切换中英文后再次验证文字和尺寸。
   - Change: 明确断言新 UI 测试不会点击提交按钮；保留现有表单协议测试的页面内 fetch 拦截，任何 POST 都只能命中拦截器，不能到达真实 API。
   - Preserve: favicon、控制台错误、移动菜单、Modal 尺寸和 Canvas 非有限坐标检查。

8. Generated output and repository boundaries
   - Change: 实现完成后只通过现有 `scripts/build-static.js` 同步 `index.html`、`styles.css`、`script.js` 到 `dist`；不要手改 `dist`。
   - Preserve: `PUBLISH_FILES` 内容不变；不增加字体、截图、设计计划以外的发布文件。
   - Verify: `tests/build-output.test.js` 继续证明 `dist` 只包含白名单文件，且所有本地资源引用存在。

## Scope

- Inherit: 首页所有英文/中文状态、桌面与移动共享的 CTA/字体规则、由现有 build 生成的 `dist` 副本。
- Verify: 1280/1440px 桌面构图、641/768/900/920px 保密布局、390px 移动首屏、联系 Modal、移动菜单、Canvas 和 reduced-motion。
- Exclude: admin 页面、Netlify Function、数据库、metadata、图片生成、构建白名单变更、外部字体、真实 API、客户证明内容。

## Accessibility and motion-performance constraints

- 唯一 CTA 必须保留原生 `<button>`、可访问名称、`aria-haspopup="dialog"` 和 `aria-controls="contactModal"`；不要为原生语义添加重复 role。
- Modal 打开时继续设置背景 inert/`aria-hidden`，初始焦点进入表单；Tab/Shift+Tab 陷阱、Escape 和焦点归还不得变化。
- 移动菜单的按钮名称、`aria-expanded`、`aria-controls`、导航 inert 与 Escape 归还必须保持。
- 六个移动能力项必须显示文字并保持键盘可达和可见焦点；不能以颜色作为唯一 focus 状态，不能设置正数 tabindex。
- 不改变表单 label、required、busy、feedback live region、字段名称或错误协议；新测试不产生真实提交。
- 布局切换使用 media query 和静态 grid/flex；不通过 JS 测量后逐帧写入，不动画 width/height/top/grid。
- 保留一个 Canvas RAF 及其 `running` 停止条件；visibility、resize 节流和 reduced-motion 分支不修改。
- 不新增 scroll 事件、第二套动画系统、持续 filter/blur、继承 CSS 变量动画或大面积 paint 动画。
- reduced-motion 下 Canvas 必须停止，reveal 必须可见，移动能力网格不得依赖动画才能读取。

## Test matrix

| Area | Viewport/state | Procedure | Expected result |
| --- | --- | --- | --- |
| Confidential layout | 641×1000 | 切到英文和中文，读取 copy/features bounding boxes | 交集面积 0，无横向溢出，流程条位于卡片后 |
| Confidential layout | 768×1024 | 同上并截图复核 | 无文字/卡片覆盖；背景和玻璃层级保留 |
| Confidential layout | 900×1000 | 同上 | 正常流网格稳定，无断点跳回绝对定位 |
| Confidential layout | 920×1000 | 同上 | 920px 边界稳定；921px 才进入原桌面构图 |
| Mobile capabilities | 390×844，EN | 检查六个能力项、焦点顺序和尺寸 | 六组双语标签可读、双列、最小 44px、无横向溢出 |
| Mobile capabilities | 390×844，ZH | 通过移动菜单切换语言后复查 | 中文为主、英文为次；菜单关闭并归还焦点 |
| Hero CTA | Desktop/390，EN/ZH | 激活首屏 CTA | URL 进入 `#technology`，目标章节进入视口 |
| Final CTA | Desktop/390，EN/ZH | 统计并激活 `[data-contact-open]` | 恰好一个主要 CTA，仍打开原 Modal |
| Modal keyboard | Desktop | Enter 打开；Tab/Shift+Tab；Escape | 初始焦点、焦点环、背景 inert、关闭与归还全部保持 |
| Mobile menu | 390 | Enter、Tab、Escape、语言切换、变更到桌面宽度 | `aria-expanded`/inert/焦点归还无回归 |
| Reduced motion | 390，`prefers-reduced-motion: reduce` | 加载页面并读取运行状态 | Canvas `running=false`，reveal 可见且无 transform |
| Canvas lifecycle | 0尺寸、resize burst、hidden/visible | 运行现有 unit harness | 单 RAF；无无穷坐标；仅尺寸变化时重建；隐藏/减弱动效时停止 |
| Contact protocol | EN/ZH | 只打开/关闭 Modal；协议测试使用页面内 fetch mock | 新 UI 测试无 POST；既有 mock 仍捕获相同 JSON，不连接真实 API |
| Typography | 1440/768/390，EN/ZH | 检查 computed style 与视觉截图 | 只使用系统栈和 300/400；无截断、跳行或明显层级变重 |
| Repository boundary | Build output | 运行白名单测试 | 无新发布路径；favicon、图片、后台和 API 边界不变 |

## Validation

- Product: 从首屏依次进入数据流程、浏览完整服务叙事并从唯一终屏 CTA 打开联系表单；英文和中文均一致。
- Interface: 对照 Test matrix 检查内容极值、断点、键盘、焦点、语言、reduced-motion 和 Canvas 生命周期；截图只写 `/tmp`。
- System: 复用现有 `.hero-cta`、`.coordinate-point`、i18n 和 media query；确认没有并行 CTA、重复能力列表、外部字体或新动画循环。
- Repository: `node --test tests/site-regression.test.js` → 源码、菜单和 Canvas 单元回归通过。
- Repository: `./node_modules/.bin/playwright test tests/site-browser.spec.js` → 本地浏览器矩阵通过；配置内服务只连接 localhost，表单协议用现有 fetch mock，不触达真实 API。
- Repository: `node --test tests/build-output.test.js` → 现有 build 白名单和 `dist` 资源完整性通过。
- Repository: `git diff --check` → 无空白错误。
- Repository: `git status --short` → 只出现实现明确涉及的源码、测试和 build 生成副本；不得出现截图、字体、依赖、Skill、服务端或 metadata 文件。

## Risks and rollback

- Risk: 系统字体 300 在不同平台的实际笔画略有差异。Mitigation: 不改变字号/行高/宽度，至少在 Chrome 的 1440/768/390px 和中英文截图中复核换行；若 300 不可用，只允许回退 400，不恢复非标准中间字重。
- Risk: 920px 以下正常流会增加保密章节高度并改变背景裁切。Mitigation: 保持背景 `cover` 和 shade，分别验证 641/768/900/920px；优先增加内容高度，不允许重新引入绝对 top 补偿。
- Risk: 双语能力标签增加首屏高度。Mitigation: 仅在 <=640px 使用两列、短标签、44px 单元；隐藏 code/note/line，允许页面自然变高，禁止通过缩小文字到不可读尺寸解决。
- Risk: 删除第二 CTA 会使旧测试和 i18n 键失效。Mitigation: 同一阶段更新唯一 CTA 断言和两种语言，不改变通用 Modal 绑定。
- Rollback: 每个阶段保持可独立回退；先回退 CSS 响应式/字体，再回退 HTML/字典；重新通过现有 build 生成 `dist`。不得用 reset 或手工恢复生成文件替代版本化回退。

## Phased implementation order

1. 更新 `tests/site-regression.test.js` 和 `tests/site-browser.spec.js` 的预期，覆盖唯一 CTA、`#technology`、四个保密断点、390px 双语能力标签和字体约束；所有表单网络继续拦截。
2. 修改 `index.html`：首屏锚点和唯一终屏 CTA；立即验证 DOM、Modal 触发器与焦点归还。
3. 修改 `script.js`：删除 secondary CTA 字典键并填充六组双语次标签；验证 EN/ZH 切换和菜单关闭状态。
4. 修改 `styles.css` 字体栈/标准字重，先在桌面确认视觉层级未漂移。
5. 修改 `styles.css` 的 920/640px 保密正常流和 390px 能力标签网格；按 641→768→900→920→390 的顺序验证，避免用单一截图掩盖边界问题。
6. 运行无障碍、动效、Canvas 和表单协议回归；不得为修复测试而改 Modal、菜单、Canvas 或 API。
7. 通过现有 build 同步 `dist`，运行白名单与完整浏览器测试；截图仅写 `/tmp`，检查 Git 状态不含任何越界文件。

## Stop conditions

- Stop if 实现需要外部字体、CDN、下载依赖或新增发布资产。
- Stop if 单一 CTA 无法复用现有 `data-contact-open`，或需要改变 Modal/表单/API 协议。
- Stop if 移动能力标签需要复制第二套业务内容、添加未经定义的新能力，或改变桌面大于 640px 的星系坐标构图。
- Stop if 保密布局无法在正常流中解决而需要重新引入按视口硬编码的绝对 top/height。
- Stop if 任何浏览器测试尝试访问外部网站或向真实 `/api/contact-leads` 发出 POST。
- Stop if scope 扩展到 metadata、服务端、后台、构建白名单、图片生成或客户证明内容。

## Design documentation

- After acceptance and validation: none；仓库当前没有管理该主页的 `DESIGN.md`，本阶段不创建新的设计规范。
