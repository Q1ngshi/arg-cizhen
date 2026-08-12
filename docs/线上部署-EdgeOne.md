# 线上部署：腾讯云 EdgeOne Pages（大陆可访问 · 免费 · 免实名）

> 背景（2026-08）：jsDelivr 对所有 .html 返回 text/plain（浏览器显示源码）；
> GitHub Pages 在大陆被 IP 阻断。EdgeOne Pages = 腾讯云边缘加速，edgeone.app
> 域名大陆可访问，免费版仅需邮箱注册（**无需实名、无需信用卡**），
> GitHub 仓库一键导入，以后每次 push 自动重新部署，永久免费。

## 一次性操作（约 10 分钟，只需做一次）

### 第 1 步：注册腾讯云
1. 打开 https://cloud.tencent.com/ → 右上角「注册」
2. 用**邮箱**注册即可（或微信扫码登录，二选一）
3. 注册完**不需要**实名认证（EdgeOne Pages 免费版不需要）

### 第 2 步：进入 EdgeOne Pages
1. 打开 https://console.cloud.tencent.com/edgeone/pages
2. 如果没有跳转，控制台搜索框搜「EdgeOne」→ 左侧菜单「Pages」

### 第 3 步：导入 GitHub 仓库
1. 点「新建项目」→ 选「导入 Git 仓库」
2. 按提示授权 GitHub 账号（会跳转到 GitHub 授权页面，登录后点 Approve）
3. 选择仓库：`arg-cizhen`

### 第 4 步：构建设置（纯静态，零配置）
| 设置项 | 填什么 |
|---|---|
| 框架预设 | 无（纯静态 HTML） |
| 构建命令 | 留空 |
| 输出目录 | `/`（仓库根目录） |
| 加速区域 | 默认即可 |

点「部署」。

### 第 5 步：拿到链接
部署完成后会得到形如 `https://xxxxxxxx.edgeone.app` 的地址。

**发给朋友的链接（推荐入口，终端版）**：
`https://xxxxxxxx.edgeone.app/desktop.html`

**官网版**：`https://xxxxxxxx.edgeone.app/`

## 以后更新游戏（自动，不用管）
Claude push 到 GitHub 后，EdgeOne 自动拉取最新代码并重新部署。
想手动刷新：控制台 → Pages → 你的项目 → 构建部署 → 新建部署。

## 验证（发给朋友前自查）
- 打开链接应直接出现开机画面（不是代码）
- 或者命令行检查：`curl -sI https://xxxxxxxx.edgeone.app/desktop.html`
  应看到 `Content-Type: text/html`（看到 text/plain 就是有问题）

## 备选平台（如果 EdgeOne 注册不顺）
- **GitCode**（gitcode.net，CSDN 系，手机号注册）：导入 GitHub 仓库 → 服务 → Pages（静态 HTML）
- **Gitee Pages**：需实名 + 仓库审查，且 2026 年有停服说法，不推荐
