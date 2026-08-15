/* R4 验证：传播数据回收埋点（cz_share_copy / cz_share_foreign）+ 7-C 社区挂靠引导文案
   依赖：node serve.js 运行中（localhost:8081） */
const { chromium } = require('playwright');
const BASE = 'http://localhost:8081';
let pass = 0, fail = 0;
const ok = (n, c, e) => { if (c) { pass++; console.log('  ✅ ' + n); } else { fail++; console.log('  ❌ ' + n + (e ? ' ← ' + e : '')); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Users/32268/AppData/Local/ms-playwright/chromium-1200/chrome-win64/chrome.exe' });

  /* ================= R4-回收：desktop 复制交接记录 → cz_share_copy ================= */
  console.log('【R4 传播回收：复制交接记录埋点】');
  const pd = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await pd.goto(BASE + '/desktop.html', { waitUntil: 'networkidle' });
  await pd.evaluate(() => { localStorage.clear(); sessionStorage.clear(); localStorage.setItem('cz_admin_ok', '1'); });
  await pd.reload({ waitUntil: 'networkidle' });
  await pd.waitForFunction(() => document.querySelectorAll('.icon.locked').length === 0, null, { timeout: 20000 });
  await pd.dblclick('.icon[data-win="tools"]');
  await pd.click('#pane-handover, .tab-btn:has-text("交接班")');
  await pd.click('#btn-handover');
  await pd.waitForFunction(() => document.getElementById('btn-handover-copy').style.display !== 'none', { timeout: 5000 });
  // 触发复制（playwright 不依赖真实剪贴板权限，直接调用函数）
  await pd.evaluate(() => window.copyHandover());
  await sleep(300);
  ok('D1 复制交接记录后 cz_share_copy = 1', await pd.evaluate(() => localStorage.getItem('cz_share_copy') === '1'));
  ok('D2 复制行为写入 cz_stage_log（share_copy）', await pd.evaluate(() => {
    const arr = JSON.parse(localStorage.getItem('cz_stage_log') || '[]');
    return arr.some(x => x.k === 'share_copy');
  }));
  await pd.evaluate(() => window.copyHandover());
  await sleep(300);
  ok('D3 再次复制递增为 2', await pd.evaluate(() => localStorage.getItem('cz_share_copy') === '2'));
  await pd.close();

  /* ================= R4-回收：官网输入他人交接码 → cz_share_foreign ================= */
  console.log('【R4 传播回收：官网解码他人交接码埋点】');
  const pf = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await pf.goto(BASE + '/', { waitUntil: 'networkidle' });
  await pf.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await pf.reload({ waitUntil: 'networkidle' });
  await pf.click('#main-nav a[data-page="search"]');
  await pf.fill('#archive-search', '3F2A91-07');
  await pf.click('#archive-search-btn');
  await pf.waitForFunction(() => document.getElementById('search-result').textContent.includes('交接记录 · 进度摘要'), { timeout: 5000 });
  ok('F1 解码他人交接码显示进度摘要', true);
  ok('F2 解码他人交接码后 cz_share_foreign = 1', await pf.evaluate(() => localStorage.getItem('cz_share_foreign') === '1'));
  ok('F3 写入 cz_stage_log（share_foreign）', await pf.evaluate(() => {
    const arr = JSON.parse(localStorage.getItem('cz_stage_log') || '[]');
    return arr.some(x => x.k === 'share_foreign');
  }));
  await pf.close();

  /* ================= R4-7C：社区挂靠引导文案存在（静态核查） ================= */
  console.log('【R4-7C 社区挂靠引导文案】');
  const resp = await (await browser.newPage()).request.get(BASE + '/desktop.html');
  const html = await resp.text();
  ok('C1 见证者结局含转述引导（本机档案编号）', html.includes('如需将本卷转述其他单位，可使用交接记录'));
  ok('C2 好结局含编号出示引导', html.includes('如需向其他单位转述本卷调查过程，请出示本机档案编号'));
  ok('C3 交接复制埋点注释在案', html.includes("R4-回收传播数据：记录「交接记录被复制」次数"));
  const ri = await (await browser.newPage()).request.get(BASE + '/index.html');
  const html2 = await ri.text();
  ok('C4 官网交接码解码埋点注释在案', html2.includes("R4-回收传播数据：记录「他人交接码被解码」次数"));
  // 运营指引文档存在
  const rd = await (await browser.newPage()).request.get(BASE + '/docs/社区挂靠与传播回收-运营指引.md');
  ok('C5 运营指引文档可访问', rd.ok() && (await rd.text()).includes('cz_share_foreign'));
  ok('C6 文档包含 B 站实况投稿引导模板', (await rd.text()).includes('B 站实况投稿引导文案'));

  await browser.close();
  console.log(`\n===== R4 验证（传播回收 + 社区挂靠）：${pass} 通过 / ${fail} 失败 =====`);
  process.exit(fail ? 2 : 0);
})().catch(e => { console.error('崩溃:', e.message); process.exit(3); });
