/* 游戏层面提升验证：时间线归档玩法（可玩性）+ 可发现性补漏（006 暗示 / hero 微钩子）
   依赖：node serve.js 运行中（localhost:8081） */
const { chromium } = require('playwright');
const BASE = 'http://localhost:8081';
let pass = 0, fail = 0;
const ok = (n, c, e) => { if (c) { pass++; console.log('  ✅ ' + n); } else { fail++; console.log('  ❌ ' + n + (e ? ' ← ' + e : '')); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Users/32268/AppData/Local/ms-playwright/chromium-1200/chrome-win64/chrome.exe' });
  const errors = [];
  const track = p => {
    p.on('pageerror', e => errors.push('pageerror: ' + e.message));
    p.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  };

  /* ================= A：官网 hero 微钩子 ================= */
  console.log('【A 官网入口微钩子】');
  const pa = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  track(pa);
  await pa.goto(BASE + '/', { waitUntil: 'networkidle' });
  ok('A1 hero 角落微钩子「图摄于 2009 年春」', (await pa.locator('.hero-img').textContent()).includes('图摄于 2009 年春'));
  await pa.close();

  /* ================= B：时间线归档玩法（正确顺序） ================= */
  console.log('【B 时间线归档：正确顺序】');
  const pb = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  track(pb);
  await pb.goto(BASE + '/desktop.html', { waitUntil: 'networkidle' });
  await pb.evaluate(() => { localStorage.clear(); localStorage.setItem('cz_admin_ok', '1'); });
  await pb.reload({ waitUntil: 'networkidle' });
  await pb.waitForFunction(() => document.querySelectorAll('.icon.locked').length === 0, null, { timeout: 20000 });
  await pb.dblclick('.icon[data-win="tools"]');
  await pb.click('#win-tools .tab-btn:has-text("归档整理")');
  ok('B1 时间线：7 张事件卡', await pb.locator('#tl-cards .tl-card').count() === 7);
  ok('B1 时间线：7 个时间槽', await pb.locator('#tl-timeline .tl-slot').count() === 7);
  ok('B1 未点满：核对按钮禁用', await pb.locator('#btn-tl-check').isDisabled());
  // 正确顺序 1→7
  for (let i = 1; i <= 7; i++) {
    await pb.click('#tl-card-' + i);
  }
  ok('B2 点满 7 张：核对按钮启用', !(await pb.locator('#btn-tl-check').isDisabled()));
  await pb.click('#btn-tl-check');
  await sleep(200);
  ok('B2 归档完成：时间线归档完成文案', (await pb.locator('#tl-fb').textContent()).includes('时间线归档完成'));
  ok('B2 写入 cz_evt_timeline + 埋点 timeline', await pb.evaluate(() => !!localStorage.getItem('cz_evt_timeline')));
  await pb.close();

  /* ================= C：时间线归档（错误顺序 → 待查不惩罚） ================= */
  console.log('【C 时间线归档：错误顺序】');
  const pc = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  track(pc);
  await pc.goto(BASE + '/desktop.html', { waitUntil: 'networkidle' });
  await pc.evaluate(() => { localStorage.clear(); localStorage.setItem('cz_admin_ok', '1'); });
  await pc.reload({ waitUntil: 'networkidle' });
  await pc.waitForFunction(() => document.querySelectorAll('.icon.locked').length === 0, null, { timeout: 20000 });
  await pc.dblclick('.icon[data-win="tools"]');
  await pc.click('#win-tools .tab-btn:has-text("归档整理")');
  // 错误顺序：2,1,3,4,5,6,7（第 1、2 件互换）
  for (const i of [2, 1, 3, 4, 5, 6, 7]) {
    await pc.click('#tl-card-' + i);
  }
  await pc.click('#btn-tl-check');
  await sleep(200);
  ok('C1 错误顺序：记录矛盾，待查（不惩罚）', (await pc.locator('#tl-fb').textContent()).includes('记录矛盾，待查'));
  ok('C1 错误顺序：不写 cz_evt_timeline', await pc.evaluate(() => !localStorage.getItem('cz_evt_timeline')));
  await pc.close();

  /* ================= D：可发现性——被登记统计消息含 006 暗示 ================= */
  console.log('【D 可发现性：006 暗示】');
  const pd = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  track(pd);
  await pd.goto(BASE + '/desktop.html', { waitUntil: 'networkidle' });
  await pd.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('cz_admin_ok', '1');
    localStorage.setItem('cz_evt_gate3_ok', Date.now());
    localStorage.setItem('cz_evt_handover_done', Date.now());
    localStorage.setItem('cz_evt_wang_read', Date.now());
    localStorage.setItem('cz_evt_morse_break', Date.now());
    localStorage.setItem('cz_evt_search_tingdian', Date.now());
    localStorage.setItem('cz_stage_log', JSON.stringify([{ k: 'calc_break' }, { k: 'bp_plate' }]));
  });
  await pd.reload({ waitUntil: 'networkidle' });
  await pd.waitForFunction(() => document.querySelectorAll('.icon.locked').length === 0, null, { timeout: 20000 });
  await pd.waitForFunction(() => document.getElementById('arch-final-entry').style.display !== 'none', null, { timeout: 10000 });
  await pd.dblclick('.icon[data-win="archive"]');
  await pd.click('#arch-final-entry');
  await pd.waitForSelector('#final-veil.show');
  await pd.click('#fv-warn .btn');
  await sleep(600);
  const msgTxt = await pd.evaluate(() => [...document.querySelectorAll('#msg-list .msg-item')].map(m => m.textContent).join('\n'));
  ok('D1 统计消息含「归档码」', msgTxt.includes('归档码'));
  ok('D1 统计消息含「CE-2009-006」暗示', msgTxt.includes('CE-2009-006'));
  await pd.close();

  /* ================= F：任务①操作化——归档登记表（核对→改正→归档） ================= */
  console.log('【F 归档登记表】');
  const pf = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  track(pf);
  await pf.goto(BASE + '/desktop.html', { waitUntil: 'networkidle' });
  await pf.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await pf.reload({ waitUntil: 'networkidle' });
  await pf.click('#boot').catch(() => {});
  await sleep(600);
  await pf.dblclick('.icon[data-win="archform"]');
  await pf.waitForSelector('#win-archform.open');
  ok('F1 待归档文件：登记表可见（编号05/年份2009预填/xf001）', await pf.evaluate(() => document.getElementById('archform-year').value === '2009' && document.getElementById('win-archform').textContent.includes('05')));
  await pf.click('#win-archform .btn');
  await sleep(300);
  ok('F2 未核对直接归档：被拦下（待查不惩罚）', (await pf.locator('#archform-fb').textContent()).includes('馆藏动态补录通知不一致'));
  ok('F2 未核对：不写 cz_evt_archive_filed', await pf.evaluate(() => !localStorage.getItem('cz_evt_archive_filed')));
  await pf.fill('#archform-year', '2026');
  await pf.click('#win-archform .btn');
  await sleep(400);
  ok('F3 改 2026 归档：归档完成', (await pf.locator('#archform-fb').textContent()).includes('归档完成'));
  ok('F3 写入 cz_evt_archive_filed + 任务①✅', await pf.evaluate(() => !!localStorage.getItem('cz_evt_archive_filed') && document.getElementById('task-1').textContent.includes('✅')));
  ok('F4 收集进度条存在（已归档异常记录 N/12）', (await pf.locator('#collect-prog').textContent()).match(/已归档异常记录：\d+ \/ 12/));
  await pf.close();

  /* ================= G：去污修复探针（卷宗落款涂黑 + 红本碎片拼合） ================= */
  console.log('【G 去污修复探针】');
  // G1 官网：卷宗落款涂黑 → 去污显形（管理员密码「落款年份」从读变操作）
  const pg1 = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  track(pg1);
  await pg1.goto(BASE + '/', { waitUntil: 'networkidle' });
  await pg1.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await pg1.reload({ waitUntil: 'networkidle' });
  await pg1.click('#main-nav a[data-page="search"]');
  await pg1.fill('#archive-search', '05');
  await pg1.click('#archive-search-btn');
  await pg1.click('#search-result .search-result-item');
  await pg1.fill('#gate-input', 'linyuan');
  await pg1.click('#gate-modal .gate-btn:not(.cancel)');
  await pg1.waitForSelector('#dossier.show');
  ok('G1 卷宗落款被涂黑（▊ 遮罩）', (await pg1.locator('#dossier-date').textContent()).includes('▊'));
  await pg1.click('#btn-restore-date');
  await sleep(300);
  ok('G1 去污后年份显形（二〇〇九年三月十七日）', (await pg1.locator('#dossier-date').textContent()).includes('二〇〇九年三月十七日'));
  ok('G1 写入 cz_evt_restore_year', await pg1.evaluate(() => !!localStorage.getItem('cz_evt_restore_year')));
  await pg1.close();
  // G2 桌面：红本碎片去污拼合
  const pg2 = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  track(pg2);
  await pg2.goto(BASE + '/desktop.html', { waitUntil: 'networkidle' });
  await pg2.evaluate(() => { localStorage.clear(); localStorage.setItem('cz_admin_ok', '1'); });
  await pg2.reload({ waitUntil: 'networkidle' });
  await pg2.waitForFunction(() => document.querySelectorAll('.icon.locked').length === 0, null, { timeout: 20000 });
  await pg2.dblclick('.icon[data-win="tools"]');
  await pg2.click('#win-tools .tab-btn:has-text("文件恢复")');
  await pg2.click('#btn-restore');
  await pg2.waitForSelector('#restored2.show', { timeout: 20000 });
  ok('G2 红本恢复：3 张含污渍碎片', await pg2.locator('#rb-frags .rb-frag').count() === 3);
  ok('G2 拼合前完整抄本隐藏', await pg2.evaluate(() => document.getElementById('rb-joined').style.display === 'none'));
  for (let i = 1; i <= 3; i++) { await pg2.click('#rb-frag-' + i); await sleep(300); }
  await pg2.waitForFunction(() => document.getElementById('rb-joined').style.display === 'block', null, { timeout: 5000 });
  ok('G2 三张去污后自动拼合（完整抄本 + 剪报）', await pg2.evaluate(() => document.getElementById('rb-joined').textContent.includes('3月16日')));
  ok('G2 写入 cz_evt_redbook_puzzle + 埋点 redbook_clean', await pg2.evaluate(() => !!localStorage.getItem('cz_evt_redbook_puzzle')));
  await pg2.close();

  /* ================= E：浏览器窗口默认最大化（主内容界面大屏） ================= */
  console.log('【E 浏览器默认大屏】');
  const pe = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  track(pe);
  await pe.goto(BASE + '/desktop.html', { waitUntil: 'networkidle' });
  await pe.evaluate(() => { localStorage.clear(); localStorage.setItem('cz_admin_ok', '1'); });
  await pe.reload({ waitUntil: 'networkidle' });
  await pe.waitForFunction(() => document.querySelectorAll('.icon.locked').length === 0, null, { timeout: 20000 });
  await pe.dblclick('.icon[data-win="browser"]');
  await sleep(300);
  ok('E1 浏览器打开即最大化', await pe.evaluate(() => document.getElementById('win-browser').classList.contains('maxed')));
  const bw = await pe.locator('#win-browser').boundingBox();
  ok('E2 大屏宽度 ≈ 视口（非 760 小窗）', bw && bw.width > 1000);
  // ▢ 取消最大化 → 恢复 760×560 基准
  await pe.click('#win-browser .t-btn:has-text("▢")');
  await sleep(200);
  const bw2 = await pe.locator('#win-browser').boundingBox();
  ok('E3 取消最大化恢复基准 760×560', bw2 && Math.abs(bw2.width - 760) < 4 && Math.abs(bw2.height - 560) < 4);
  // 双击标题栏 → 再次最大化
  await pe.dblclick('#win-browser .w-titlebar');
  await sleep(200);
  ok('E4 双击标题栏可最大化', await pe.evaluate(() => document.getElementById('win-browser').classList.contains('maxed')));
  await pe.close();

  await browser.close();
  const errs = errors.filter(e => !e.includes('favicon'));
  console.log(errs.length ? '⚠ 页面错误：\n' + errs.join('\n') : '（无页面 JS 错误）');
  console.log(`\n===== 游戏层面提升验证：${pass} 通过 / ${fail} 失败 =====`);
  process.exit(fail ? 2 : 0);
})().catch(e => { console.error('崩溃:', e.message); process.exit(3); });
