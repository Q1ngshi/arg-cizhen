/* 玩家模拟代理（cizhen-player）：以普通玩家认知路径走查《慈恩镇》第一局核心闭环。
   协议见 docs/玩家模拟协议.md。每步 = 玩家意图 + 心理 + 动作 + 可达性验证；
   某步失败重试 3 次仍不可达 → 记为卡点。本脚本不含任何"预知答案"的跳关。 */
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
  page.setDefaultTimeout(6000);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const frame = () => page.frameLocator('#site-frame');
  const nav = async (name) => { await frame().locator('#main-nav a[data-page="' + name + '"]').click(); await sleep(250); };

  /* 0. 清存档（新玩家） */
  await page.goto(BASE + '/desktop.html', { waitUntil: 'networkidle' });
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload({ waitUntil: 'networkidle' });

  /* 1. 开机 */
  await page.waitForSelector('#boot', { timeout: 10000 });
  await page.click('#boot').catch(() => {});
  await sleep(800);

  /* 2. 信息 → 读任务①（现在是「核对归档表」） */
  const msgOpen = await try3(async () => {
    await page.dblclick('.icon[data-win="msg"]');
    await page.waitForSelector('#win-msg.open', { timeout: 3000 });
  });
  const taskText = await page.locator('#task-1').textContent().catch(() => '');
  step('打开「信息」读任务①', '任务让打开「待归档文件」核对登记表——桌面上有个文件图标', msgOpen, '任务①:' + (taskText || '').slice(0, 36));

  /* 3. 打开「待归档文件」→ 看表 → 直接归档（预填 2009）→ 应被拦下 */
  const afOpen = await try3(async () => {
    await page.dblclick('.icon[data-win="archform"]');
    await page.waitForSelector('#win-archform.open', { timeout: 3000 });
  });
  const afYear = await page.locator('#archform-year').inputValue().catch(() => '');
  step('打开「待归档文件」查看登记表', '登记表预填了：编号 05、补录年份 2009、登记人 xf001——年份对吗？不确定，先归档试试', afOpen, '预填年份:' + afYear);
  await page.click('#win-archform .btn').catch(() => {});
  await sleep(300);
  const afErr = await page.locator('#archform-fb').textContent().catch(() => '');
  step('直接点「归档」（未核对）', '被拦下了：补录年份与馆藏动态通知不一致——系统提示去官网核对', afErr.includes('馆藏动态'), '反馈:' + afErr.slice(0, 40));

  /* 4. 打开浏览器 → 官网馆藏动态核对补录通知 */
  const broOpen = await try3(async () => {
    await page.dblclick('.icon[data-win="browser"]');
    await page.waitForSelector('#win-browser.open', { timeout: 3000 });
    await page.waitForFunction(() => { const f = document.getElementById('site-frame'); return f && f.contentDocument && f.contentDocument.readyState === 'complete'; }, null, { timeout: 8000 });
  });
  step('打开内网浏览器', '去官网「馆藏动态」核对补录通知的日期', broOpen, '');
  const newsOk = await try3(async () => {
    await frame().locator('.news-tab[data-tab="tab3"]').click();
    await frame().locator('.news-item:not(.news-body):has-text("补录")').first().click();
    await sleep(300);
  });
  const newsText = await frame().locator('.news-list#tab3').textContent().catch(() => '');
  step('馆藏动态 → 展开「失踪人口档案补录」通知', '通知说 2026 年 6 月完成补录——那登记表上的 2009 是错的，应该是 2026', newsOk && (newsText || '').includes('2026'), '含2026:' + (newsText || '').includes('2026'));

  /* 5. 回桌面 → 待归档文件 → 改年份 2026 → 归档 */
  const afFix = await try3(async () => {
    await page.click('#win-browser .t-btn:has-text("—")').catch(() => {});   // 最小化浏览器窗口
    await page.waitForTimeout(300);
    await page.dblclick('.icon[data-win="archform"]');
    await page.fill('#archform-year', '2026');
    await page.click('#win-archform .btn');
    await sleep(400);
  });
  const afOk = await page.locator('#archform-fb').textContent().catch(() => '');
  step('改补录年份为 2026 → 归档', '归档成功！系统还提了一句：登记人账号 2009-03-17 已停用？日期对不上，记下', afFix && afOk.includes('归档完成'), '反馈:' + afOk.slice(0, 30) + '… cz_evt_archive_filed:' + await page.evaluate(() => !!localStorage.getItem('cz_evt_archive_filed')));
  const task1 = await page.locator('#task-1').textContent().catch(() => '');
  step('任务①完成', '任务卡变绿了——第一次「做事」完成', task1.includes('✅'), '任务卡:' + task1.slice(0, 30));

  /* 6. 继续：检查点①③（红色标题/学员名单）→ 密码门 linyuan */
  const redOk = await try3(async () => { await page.dblclick('.icon[data-win="browser"]'); await frame().locator('.news-tab[data-tab="tab1"]').click(); await frame().locator('.news-item .n-title.alert').first().click(); await sleep(300); });
  const gateVisible = await frame().locator('#gate-modal').evaluate(el => el.classList.contains('show')).catch(() => false);
  step('检查点：点红色标题「特大案件卷宗」', '密码门提示「检索人姓名拼音」——还不知道是谁，先取消', redOk && gateVisible, '');
  await frame().locator('#gate-modal .gate-btn.cancel').click().catch(() => {});
  const trOk = await try3(async () => {
    await frame().locator('.news-tab[data-tab="tab2"]').click();
    await frame().locator('.news-item:not(.news-body):has-text("培训班")').first().click();
    await sleep(300);
  });
  const trText = await frame().locator('.news-list#tab2').textContent().catch(() => '');
  step('检查点：通知公告 → 培训班学员名单', '名单里有「林远（旁听）」——密码门要姓名拼音，回头试', trOk && (trText || '').includes('林远'), '名单含林远:' + (trText || '').includes('林远'));

  /* 7. 搜「林远」验证 */
  const searchLY = await try3(async () => { await nav('search'); await frame().locator('#archive-search').fill('林远'); await frame().locator('#archive-search-btn').click(); await sleep(400); });
  const lyRes = await frame().locator('#search-result').textContent().catch(() => '');
  step('档案查询搜「林远」', '「未找到。（检索记录已存档）」？不对劲', searchLY, '结果:' + (lyRes || '').replace(/\s+/g, ' ').slice(0, 40));

  /* 8. 回首页 → 切回要闻 → 密码门 linyuan */
  await nav('home');
  const gate2a = await try3(async () => {
    await frame().locator('.news-tab[data-tab="tab1"]').click();
    await frame().locator('.news-item .n-title.alert').first().click();
    await frame().locator('#gate-modal').waitFor({ state: 'visible', timeout: 3000 });
  });
  const gate2b = await try3(async () => { await frame().locator('#gate-input').fill('linyuan'); });
  const gate2c = await try3(async () => { await frame().locator('#gate-modal .gate-btn:not(.cancel)').click(); await sleep(500); });
  const dossierShown = await frame().locator('#dossier').evaluate(el => el.classList.contains('show')).catch(() => false);
  step('密码门输入 linyuan（学员名单名字的拼音）', '培训班名单「林远」→ 拼音 linyuan，赌一把', gate2a && gate2b && gate2c && dossierShown, '卷宗解锁:' + dossierShown);
  /* 卷宗落款被涂黑 → 去污修复（管理员密码线索从读变操作） */
  const redactedSeen = (await frame().locator('#dossier-date').textContent().catch(() => '')).includes('▊');
  const restoreOk = await try3(async () => { await frame().locator('#btn-restore-date').click(); await sleep(400); });
  const yearTxt = await frame().locator('#dossier-date').textContent().catch(() => '');
  step('卷宗落款被涂黑 → 点「去污修复」', '落款被涂黑了？档案修复室的本职——去污。露出了「二〇〇九年三月十七日」，记下年份 2009', redactedSeen && restoreOk && yearTxt.includes('二〇〇九年'), '涂黑:' + redactedSeen + ' 去污显形:' + yearTxt.slice(0, 16));
  await frame().locator('#dossier.show .dossier-close').click().catch(() => {});

  /* 9. 机构概况 → xf001 */
  const org = await try3(async () => { await nav('org'); await sleep(300); });
  const orgTxt = await frame().locator('#page-org').textContent().catch(() => '');
  step('机构概况 → 内设机构', '卷宗说管理员账号格式在机构概况——档案修复室 xf001 标红', org, 'xf001:' + (orgTxt || '').includes('xf001'));

  /* 10. 搜「槐树街」→ 乱码条目 → 管理员门 xf001+2009 */
  const hs = await try3(async () => { await nav('search'); await frame().locator('#archive-search').fill('槐树街'); await frame().locator('#archive-search-btn').click(); await sleep(400); });
  step('档案查询搜「槐树街」', '卷宗地址是槐树街——搜到「调查记录（数据异常）」', hs, '');
  const admin = await try3(async () => { await nav('home'); await frame().locator('[onclick="tryOpenAdmin()"]').click(); await sleep(300); });
  const adminVisible = await frame().locator('#admin-modal').evaluate(el => el.classList.contains('show')).catch(() => false);
  step('点馆藏目录乱码条目 → 管理员门', '账号 xf001，密码提示「卷宗落款年份（4 位数字）」', admin && adminVisible, '');
  const adminOk = await try3(async () => {
    await frame().locator('#admin-user').fill('xf001');
    await frame().locator('#admin-pass').fill('2009');
    await frame().locator('#admin-modal .gate-btn:not(.cancel)').click();
    await sleep(500);
  });
  const dossier2Shown = await frame().locator('#dossier2').evaluate(el => el.classList.contains('show')).catch(() => false);
  step('管理员登录 xf001 + 2009（卷宗落款 → 2009）', '落款年份就是密码，赌对了', adminOk && dossier2Shown, 'L2 解锁:' + dossier2Shown);
  await frame().locator('#dossier2.show .dossier-close').click().catch(() => {});
  await page.waitForFunction(() => document.querySelectorAll('.icon.locked').length === 0, null, { timeout: 15000 }).catch(() => {});
  await page.click('#unlock-veil').catch(() => {});

  /* 11. 07 门禁：搜 07 → 计算器 2009−67=1942 */
  const s07 = await try3(async () => { await nav('search'); await frame().locator('#archive-search').fill('07'); await frame().locator('#archive-search-btn').click(); await sleep(400); });
  const g3 = await try3(async () => { await frame().locator('#search-result .search-result-item').first().click(); await sleep(300); });
  const g3Desc = await frame().locator('#gate3-desc').textContent().catch(() => '');
  step('搜「07」→ 教会地下档案室门禁', '王执事 2009 年去世、终年 67——密码和他有关，回桌面用计算器算', s07 && g3, '提示:' + (g3Desc || '').replace(/\s+/g, ' ').slice(0, 50));
  await frame().locator('#gate3-modal .gate-btn.cancel').click().catch(() => {});
  const calc = await try3(async () => {
    await page.click('#win-browser .t-btn:has-text("—")').catch(() => {});
    await page.waitForTimeout(300);
    await page.dblclick('.icon[data-win="tools"]');
    await page.waitForSelector('#win-tools.open', { timeout: 3000 });
    await page.click('#win-tools .tab-btn:has-text("计算器")');
    await page.waitForSelector('#pane-calc.show', { timeout: 3000 });
    for (const t of ['2', '0', '0', '9', '−', '6', '7', '=']) await page.click('.calc .k:has-text("' + t + '")');
    await sleep(400);
  });
  const calcRes = await page.locator('#cdisp').textContent().catch(() => '');
  step('桌面计算器 2009−67', '67 岁、2009 年走的——出生年份 1942？算一下', calc && calcRes === '1942', '结果:' + calcRes);
  const g3b = await try3(async () => {
    await page.dblclick('.icon[data-win="browser"]');
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

  /* 12. 三任务闭环 + 收集进度 */
  await sleep(1200);
  const t1 = await page.locator('#task-1').textContent().catch(() => '');
  const t2 = await page.locator('#task-2').textContent().catch(() => '');
  const t3 = await page.locator('#task-3').textContent().catch(() => '');
  const tasksDone = [t1, t2, t3].every(t => (t || '').trim().startsWith('✅'));
  const prog = await page.locator('#collect-prog').textContent().catch(() => '');
  step('回桌面看任务卡 + 收集进度', '三个任务都完成了；收集进度条在任务卡下方', tasksDone, [t1, t2, t3].map(t => (t || '').slice(0, 20)).join(' | ') + ' ｜ ' + prog);

  const stuck = results.filter(r => !r.ok);
  console.log('\n════════════════════════════════════');
  console.log(`游玩日志：${results.length} 步，卡点 ${stuck.length} 处，页面错误 ${errors.length} 个`);
  stuck.forEach(s => console.log(`卡点[${s.no}] ${s.intent}：${s.note}`));
  if (errors.length) console.log('页面错误: ' + errors.join('; '));
  console.log('════════════════════════════════════');
  await browser.close();
  process.exit(stuck.length ? 1 : 0);
})().catch(e => { console.error('崩溃:', e.message); process.exit(3); });
