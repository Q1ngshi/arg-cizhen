# tools/ —— 一次性开发调试脚本

> 均为开发期排查用的临时脚本，**不属于游戏内容**，已由 .gitignore 排除（不随仓库发布）。
> 根目录保持整洁：仅 index.html / desktop.html / serve.js / run.bat / package.json 等游戏本体文件。

| 脚本 | 用途 |
|---|---|
| `debug-egg.js` | 彩蛋排查（一次性） |
| `debug-intro.js` / `debug-intro2.js` / `debug-intro3.js` | 开场流程排查（分阶段迭代版） |
| `debug-persist.js` | localStorage 持久化排查 |
| `temp_snap.js` | 临时截图辅助（截图产物输出到 shots/，已忽略） |

需要重新排查时直接在 tools/ 内运行即可；脚本内 URL 均为 `http://localhost:8081`（需先 `node serve.js`）。
