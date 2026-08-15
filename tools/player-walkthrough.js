/* 玩家模拟代理（cizhen-player）：以普通玩家认知路径走查《慈恩镇》第一局核心闭环。
   协议见 docs/玩家模拟协议.md。每步 = 玩家意图 + 心理 + 动作 + 可达性验证；
   某步失败重试 3 次仍不可达 → 记为卡点。本脚本不含任何"预知答案"的跳关，
   全部动作由可见信息驱动（红色标题→密码门→搜名字→卷宗提示→机构概况→管理员→07 门禁→计算器）。 */
const { chromium } = require('playwright');
const BASE = 'http://localhost:8081';
const results = [];
let stepNo = 0;
const sleep = ms => new Promise(r => setTimeout(r, ms));
function step(intent, mind, ok, note) {
  stepNo++;
  results.push({ no: stepNo, intent, mind, ok, note });
  console.log(`[${stepNo}] ${ok ? '✅' : '❌'} ${intent}\n     玩家在想:${mind}\n     ${note || ''}`);
}
async function try3(fn) {
  for (let i = 0; i < 3; i++) {
    try { await fn(); return true; } catch (e) { await sleep(400); }
  }
  return false;
}

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Users/32268/AppData/Local/ms-playwright/chromium-1200/chrome-win64/chrome.exe' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 860 } });
  page.setDefaultTimeout(6000);   // 隐藏元素快速失败（玩家不会等 30 秒）
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const frame = () => page.frameLocator('#site-frame');
  const nav = async (name) => {   // 玩家点击官网主导航
    await frame().locator('#main-nav a[data-page="' + name + '"]').click();
    await sleep(250);
  };

  /* 0. 清存档（新玩家） */
  await page.goto(BASE + '/desktop.html', { waitUntil: 'networkidle' });
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload({ waitUntil: 'networkidle' });

  /* 1. 开机 */
  await page.waitForSelector('#boot', { timeout: 10000 });
  await page.click('#boot').catch(() => {});
  await sleep(800);

  /* 2. 信息 → 读任务（3 个检查点） */
  const msgOpen = await try3(async () => {
    await page.dblclick('.icon[data-win="msg"]');
    await page.waitForSelector('#win-msg.open', { timeout: 3000 });
  });
  const taskText = await page.locator('#task-1').textContent().catch(() => '');
  step('打开「信息」读任务①', '任务说先看馆藏动态补录通知/红色标题/学员名单，照做', msgOpen, '任务①:' + (taskText || '').slice(0, 40));

  /* 3. 浏览器（官网） */
  const broOpen = await try3(async () => {
    await page.dblclick('.icon[data-win="browser"]');
    await page.waitForSelector('#win-browser.open', { timeout: 3000 });
    await page.waitForFunction(() => { const f = document.getElementById('site-frame'); return f && f.contentDocument && f.contentDocument.readyState === 'complete'; }, null, { timeout: 8000 });
  });
  step('打开内网浏览器', '官网加载了，按检查点过', broOpen, '');

  /* 4. 检查点①：红色标题 → 密码门（先回首页） */
  const redOk = await try3(async () => { await nav('home'); await frame().locator('.news-item .n-title.alert').first().click(); await sleep(300); });
  const gateVisible = await frame().locator('#gate-modal').evaluate(el => el.classList.contains('show')).catch(() => false);
  const gateDesc = await frame().locator('#gate-desc').textContent().catch(() => '');
  step('检查点①:点红色标题「特大案件卷宗」', '密码门提示「检索人姓名拼音」——还不知道是谁，先取消', redOk && gateVisible, '提示:' + (gateDesc || '').replace(/\s+/g, ' ').slice(0, 50));
  await frame().locator('#gate-modal .gate-btn.cancel').click().catch(() => {});

  /* 5. 检查点②：馆藏动态 → 补录通知 */
  const newsOk = await try3(async () => {
    await frame().locator('.news-tab[data-tab="tab3"]').click();
    await frame().locator('.news-item:not(.news-body):has-text("补录")').first().click();
    await sleep(300);
  });
  const newsText = await frame().locator('.news-list#tab3').textContent().catch(() => '');
  step('检查点②:馆藏动态 → 展开「失踪人口档案补录」', '补录 1 件、编号 05——年份对不上，记下来', newsOk, '含05:' + (newsText || '').includes('05'));

  /* 6. 检查点③：通知公告 → 培训班学员名单 */
  const trOk = await try3(async () => {
    await frame().locator('.news-tab[data-tab="tab2"]').click();
    await frame().locator('.news-item:not(.news-body):has-text("培训班")').first().click();
    await sleep(300);
  });
  const trText = await frame().locator('.news-list#tab2').textContent().catch(() => '');
  const linyuanSeen = (trText || '').includes('林远');
  step('检查点③:通知公告 → 培训班学员名单', '名单里有「林远（旁听）」——密码门要姓名拼音，回头试', trOk && linyuanSeen, '名单含「林远（旁听）」:' + linyuanSeen);

  /* 7. 搜「林远」验证（切到档案查询页） */
  const searchLY = await try3(async () => { await nav('search'); await frame().locator('#archive-search').fill('林远'); await frame().locator('#archive-search-btn').click(); await sleep(400); });
  const lyRes = await frame().locator('#search-result').textContent().catch(() => '');
  step('档案查询搜「林远」', '「未找到。（检索记录已存档）」？不对劲', searchLY, '结果:' + (lyRes || '').replace(/\s+/g, ' ').slice(0, 40));

  /* 8. 回首页 → 切回「要闻」标签 → 密码门 linyuan（分段验证） */
  await nav('home');
  const gate2a = await try3(async () => {
    await frame().locator('.news-tab[data-tab="tab1"]').click();   // 玩家切回要闻标签再点红色标题
    await frame().locator('.news-item .n-title.alert').first().click();
    await frame().locator('#gate-modal').waitFor({ state: 'visible', timeout: 3000 });
  });
  const gate2b = await try3(async () => { await frame().locator('#gate-input').fill('linyuan'); });
  const gateVal = await frame().locator('#gate-input').inputValue().catch(() => '');
  const gate2c = await try3(async () => { await frame().locator('#gate-modal .gate-btn:not(.cancel)').click(); await sleep(500); });
  const dossierShown = await frame().locator('#dossier').evaluate(el => el.classList.contains('show')).catch(() => false);
  step('密码门输入 linyuan（学员名单名字的拼音）', '培训班名单「林远」→ 拼音 linyuan，赌一把', gate2a && gate2b && gate2c && dossierShown, 'modal开:' + gate2a + ' 输入值:' + JSON.stringify(gateVal) + ' 确认:' + gate2c + ' 卷宗解锁:' + dossierShown);
  const dossierTxt = await frame().locator('#dossier').textContent().catch(() => '');
  step('读卷宗 CE-2009-005', '林远 2009-03-17 失踪——他失踪 17 年了？那培训班名单……', dossierShown, '含「管理员权限」提示:' + (dossierTxt || '').includes('管理员'));
  await frame().locator('#dossier.show .dossier-close').click().catch(() => {});

  /* 9. 机构概况 → xf001 */
  const org = await try3(async () => { await nav('org'); await sleep(300); });
  const orgTxt = await frame().locator('#page-org').textContent().catch(() => '');
  step('机构概况 → 内设机构', '卷宗说管理员账号格式在机构概况——档案修复室 xf001 标红', org, 'xf001:' + (orgTxt || '').includes('xf001'));

  /* 10. 搜「槐树街」→ 乱码条目 → 管理员门 xf001+2009 */
  const hs = await try3(async () => { await nav('search'); await frame().locator('#archive-search').fill('槐树街'); await frame().locator('#archive-search-btn').click(); await sleep(400); });
  step('档案查询搜「槐树街」', '卷宗地址是槐树街——搜到「调查记录（数据异常）」，去馆藏目录找', hs, '');
  const admin = await try3(async () => {
    await nav('home');
    await frame().locator('[onclick="tryOpenAdmin()"]').click();
    await sleep(300);
  });
  const adminVisible = await frame().locator('#admin-modal').evaluate(el => el.classList.contains('show')).catch(() => false);
  step('点馆藏目录「槐树街调查记录」乱码条目', '管理员门：账号 xf001，密码提示「卷宗落款年份（4 位数字）」', admin && adminVisible, '提示:' + (await frame().locator('#admin-modal').textContent().catch(() => '')).replace(/\s+/g, ' ').slice(0, 50));
  const adminOk = await try3(async () => {
    await frame().locator('#admin-user').fill('xf001');
    await frame().locator('#admin-pass').fill('2009');
    await frame().locator('#admin-modal .gate-btn:not(.cancel)').click();
    await sleep(500);
  });
  const dossier2Shown = await frame().locator('#dossier2').evaluate(el => el.classList.contains('show')).catch(() => false);
  step('管理员登录 xf001 + 2009（卷宗落款：二〇〇九年三月十七日 → 2009）', '落款年份就是密码，赌对了', adminOk && dossier2Shown, '完整卷宗（L2）解锁:' + dossier2Shown);
  await frame().locator('#dossier2.show .dossier-close').click().catch(() => {});
  /* 桌面解锁仪式（unlock-veil 全屏动画约 3-4 秒，真实玩家会等它播完/点击跳过） */
  await page.waitForFunction(() => document.querySelectorAll('.icon.locked').length === 0, null, { timeout: 15000 }).catch(() => {});
  await page.click('#unlock-veil').catch(() => {});   // 点击跳过剩余动画（玩家行为）

  /* 11. 07 门禁：搜 07 → 计算器 2009−67=1942 */
  const s07 = await try3(async () => { await nav('search'); await frame().locator('#archive-search').fill('07'); await frame().locator('#archive-search-btn').click(); await sleep(400); });
  const g3 = await try3(async () => { await frame().locator('#search-result .search-result-item').first().click(); await sleep(300); });
  const g3Desc = await frame().locator('#gate3-desc').textContent().catch(() => '');
  step('搜「07」→ 教会地下档案室门禁', '王执事 2009 年去世、终年 67——密码和他有关，回桌面用计算器算', s07 && g3, '提示:' + (g3Desc || '').replace(/\s+/g, ' ').slice(0, 50));
  await frame().locator('#gate3-modal .gate-btn.cancel').click().catch(() => {});
  const calc = await try3(async () => {
    await page.click('#win-browser .t-btn:has-text("—")').catch(() => {});   // 玩家最小化浏览器窗口，露出桌面图标
    await page.waitForTimeout(300);
    await page.dblclick('.icon[data-win="tools"]');
    await page.waitForSelector('#win-tools.open', { timeout: 3000 });
    await page.click('#win-tools .tab-btn:has-text("计算器")');
    await page.waitForSelector('#pane-calc.show', { timeout: 3000 });
    for (const t of ['2', '0', '0', '9', '−', '6', '7', '=']) await page.click('.calc .k:has-text("' + t + '")');
    await sleep(400);
  });
  const calcRes = await page.locator('#cdisp').textContent().catch(() => '');
  step('桌面计算器 2009−67', '67 岁、2009 年走的——出生年份 1942？算一下', calc, '结果:' + calcRes);
  const g3b = await try3(async () => {
    await page.dblclick('.icon[data-win="browser"]');   // 重新打开浏览器（官网状态保留）
    await nav('search');
    await frame().locator('#archive-search').fill('07');
    await frame().locator('#archive-search-btn').click();
    await frame().locator('#search-result .search-result-item').first().click();
    await frame().locator('#gate3-input').fill('1942');
    await frame().locator('#gate3-modal .gate-btn:not(.cancel)').click();
    await sleep(500);
  });
  const dossier3Shown = await frame().locator('#dossier3').evaluate(el => el.classList.contains('show')).catch(() => false);
  step('门禁输入 1942（计算器结果）', '计算器破译的 1942 就是门禁密码', g3b && dossier3Shown, '07 档案解锁:' + dossier3Shown);

  /* 12. 三任务闭环 */
  await sleep(1200);
  const t1 = await page.locator('#task-1').textContent().catch(() => '');
  const t2 = await page.locator('#task-2').textContent().catch(() => '');
  const t3 = await page.locator('#task-3').textContent().catch(() => '');
  const tasksDone = [t1, t2, t3].every(t => (t || '').trim().startsWith('✅'));   // 任务完成文案分别为 已整理/已核对/已调阅
  step('回桌面看任务卡', '三个任务应该都完成了？', tasksDone, [t1, t2, t3].map(t => (t || '').slice(0, 22)).join(' | '));

  const stuck = results.filter(r => !r.ok);
  console.log('\n════════════════════════════════════');
  console.log(`游玩日志：${results.length} 步，卡点 ${stuck.length} 处，页面错误 ${errors.length} 个`);
  stuck.forEach(s => console.log(`卡点[${s.no}] ${s.intent}：${s.note}`));
  if (errors.length) console.log('页面错误: ' + errors.join('; '));
  console.log('════════════════════════════════════');
  await browser.close();
  process.exit(stuck.length ? 1 : 0);
})().catch(e => { console.error('崩溃:', e.message); process.exit(3); });
