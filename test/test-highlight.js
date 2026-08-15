/* R5-1 验证：深渊区视觉高光——被登记瞬间的页面级异变（全站日期跳变 / 滚动异常 / 倒计时血字）
   A) desktop 终端：登记瞬间 → 倒计时血字 overlay + 滚动异常 + 时钟日期跳变 + cz_invasion_terminal 幂等
   B) index 官网：被登记后首次打开 → 顶部日期瞬时跳变（cz_invasion_site 一次性）+ 3-A 长期异变
   C) 好结局豁免（不跳变、不加异变）
   依赖：node serve.js 运行中（localhost:8081） */
const { chromium } = require('playwright');
const BASE = 'http://localhost:8081';
let pass = 0, fail = 0;
const ok = (n, c, e) => { if (c) { pass++; console.log('  ✅ ' + n); } else { fail++; console.log('  ❌ ' + n + (e ? ' ← ' + e : '')); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Users/32268/AppData/Local/ms-playwright/chromium-1200/chrome-win64/chrome.exe' });

  /* ================= R5-1A：desktop 登记瞬间 ================= */
  console.log('【R5-1A 终端：被登记瞬间的页面级异变】');
  const pd = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await pd.goto(BASE + '/desktop.html', { waitUntil: 'networkidle' });
  await pd.evaluate(() => { localStorage.clear(); sessionStorage.clear(); localStorage.setItem('cz_admin_ok', '1'); });
  await pd.reload({ waitUntil: 'networkidle' });
  await pd.waitForFunction(() => document.querySelectorAll('.icon.locked').length === 0, null, { timeout: 20000 });
  // 打开最终卷 → 继续阅读（登记瞬间）
  await pd.evaluate(() => { openFinal(); });
  await pd.click('#fv-warn .btn');
  const t0 = Date.now();
  ok('A1 登记写入 cz_evt_final_read', await pd.evaluate(() => !!localStorage.getItem('cz_evt_final_read')));
  ok('A2 视觉高光幂等键 cz_invasion_terminal 已写', await pd.evaluate(() => !!localStorage.getItem('cz_invasion_terminal')));
  ok('A3 倒计时血字 overlay 出现', await pd.evaluate(() => !!document.getElementById('invasion-veil')));
  ok('A4 血字克制：03:01 倒计时、无血腥素材、无直白文案', await pd.evaluate(() => {
    const v = document.getElementById('invasion-veil');
    if (!v) return false;
    const t = v.textContent;
    return t.includes('03:01') && t.includes('登记倒计时') && !t.includes('血') && !t.includes('死')
      && !v.querySelector('img') && !v.querySelector('canvas');
  }));
  ok('A5 滚动异常 class 已挂载（±3px 抖动）', await pd.evaluate(() => document.getElementById('desktop').classList.contains('cz-scroll-glitch')));
  // 时钟日期跳变轮询（2.5s 窗口内应出现异常值）
  let clockGlitch = false;
  while (Date.now() - t0 < 2500) {
    const c = await pd.evaluate(() => document.getElementById('clock') ? document.getElementById('clock').textContent : '');
    if (c.includes('未校准') || c.includes('19??')) { clockGlitch = true; break; }
    await sleep(80);
  }
  ok('A6 时钟日期跳变（异常值闪现后恢复）', clockGlitch);
  // 等待 overlay 生命周期结束（约 3.6s）
  const el = Date.now() - t0;
  if (el < 3700) await sleep(3700 - el);
  ok('A7 overlay 约 3.6s 后自动移除', await pd.evaluate(() => !document.getElementById('invasion-veil')));
  // 幂等：再次触发不重建 overlay
  await pd.evaluate(() => window.triggerInvasion());
  await sleep(150);
  ok('A8 幂等：二次触发不重建 overlay', await pd.evaluate(() => !document.getElementById('invasion-veil')));
  await pd.close();

  /* ================= R5-1B：官网被登记后首次访问 ================= */
  console.log('【R5-1B 官网：全站日期跳变（一次性）+ 3-A 长期异变】');
  const pi = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await pi.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('cz_evt_final_read', '1700000000000');
  });
  await pi.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  let dateGlitch = false;
  const d0 = Date.now();
  while (Date.now() - d0 < 2600) {
    const t = await pi.evaluate(() => { const el = document.getElementById('today'); return el ? el.textContent : ''; });
    if (t.includes('2009年3月17日') || t.includes('1942年6月19日') || t.includes('????年')) { dateGlitch = true; break; }
    await sleep(70);
  }
  ok('B1 顶部日期瞬时跳变（2009/1942/???? 闪现）', dateGlitch);
  await sleep(1300);
  ok('B2 cz_invasion_site 已写入（一次性键）', await pi.evaluate(() => !!localStorage.getItem('cz_invasion_site')));
  ok('B3 顶部日期已恢复真实日期（拟真不受损）', await pi.evaluate(() => {
    const t = document.getElementById('today') ? document.getElementById('today').textContent : '';
    return t.includes('今天是') && !t.includes('2009年3月17日') && !t.includes('????年');
  }));
  ok('B4 3-A 长期异变：body.cz-registered 变暗', await pi.evaluate(() => document.body.classList.contains('cz-registered')));
  ok('B5 3-A 长期异变：新闻日期错位为 2009-03-1X', await pi.evaluate(() => {
    const el = document.querySelector('.n-date');
    return !!el && /^2009-03-1\d/.test(el.textContent.trim());
  }));
  // 幂等：reload 后不再跳变（cz_invasion_site 已写）
  await pi.reload({ waitUntil: 'domcontentloaded' });
  await sleep(600);
  ok('B6 幂等：reload 后顶部日期不再跳变', await pi.evaluate(() => {
    const t = document.getElementById('today') ? document.getElementById('today').textContent : '';
    return t.includes('今天是') && !t.includes('????年');
  }));
  await pi.close();

  /* ================= R5-1C：好结局豁免 ================= */
  console.log('【R5-1C 好结局豁免：不跳变、不加异变】');
  const pg = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await pg.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('cz_evt_final_read', '1700000000000');
    localStorage.setItem('cz_evt_good_end', '1700000000000');
  });
  await pg.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await sleep(800);
  ok('C1 好结局豁免：不写 cz_invasion_site', await pg.evaluate(() => !localStorage.getItem('cz_invasion_site')));
  ok('C2 好结局豁免：不加 cz-registered（官网回归正常）', await pg.evaluate(() => !document.body.classList.contains('cz-registered')));
  await pg.close();

  console.log('\n结果：' + pass + ' 通过，' + fail + ' 失败');
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
