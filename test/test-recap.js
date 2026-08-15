/* R5-2 验证：进度 recap——重开桌面开场消息附「上一班交接摘要」，解决跨日失忆（Phillips catch-up）
   A) 无进度 → 不打扰（不注入 recap）
   B) 有进度 → 开场注入「上一班交接摘要」（含已发现 X/12、最后操作节点中文名）
   C) 同会话不重复（sessionStorage 会话级标记）
   D) 重开（新标签页 = 新会话）→ 再次 recap（跨日重开仍可 catch-up）
   依赖：node serve.js 运行中（localhost:8081） */
const { chromium } = require('playwright');
const BASE = 'http://localhost:8081';
let pass = 0, fail = 0;
const ok = (n, c, e) => { if (c) { pass++; console.log('  ✅ ' + n); } else { fail++; console.log('  ❌ ' + n + (e ? ' ← ' + e : '')); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Users/32268/AppData/Local/ms-playwright/chromium-1200/chrome-win64/chrome.exe' });

  /* ================= R5-2A：无进度 → 无 recap ================= */
  console.log('【R5-2A 无进度：开场不打扰】');
  const pa = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await pa.goto(BASE + '/desktop.html', { waitUntil: 'networkidle' });
  await pa.evaluate(() => { localStorage.clear(); sessionStorage.clear(); localStorage.setItem('cz_admin_ok', '1'); });
  await pa.reload({ waitUntil: 'networkidle' });
  await pa.waitForFunction(() => window.booted === true, null, { timeout: 20000 });
  await pa.evaluate(() => showOpening());
  await sleep(300);
  ok('A1 无进度 → 开场无「上一班交接摘要」', await pa.evaluate(() =>
    ![...document.querySelectorAll('#msg-list .msg-item')].some(m => m.textContent.includes('上一班交接摘要'))));
  ok('A2 无进度 → 未写会话 recap 标记', await pa.evaluate(() => sessionStorage.getItem('cz_recap_shown') === null));
  await pa.close();

  /* ================= R5-2B：有进度 → recap 注入 ================= */
  console.log('【R5-2B 有进度：开场注入上一班交接摘要】');
  // B/D 共用同一 browser context：localStorage 跨标签共享（真实浏览器语义），sessionStorage 每标签独立
  const ctxBD = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const pb = await ctxBD.newPage();
  await pb.goto(BASE + '/desktop.html', { waitUntil: 'networkidle' });
  await pb.evaluate(() => {
    localStorage.clear(); sessionStorage.clear();
    localStorage.setItem('cz_admin_ok', '1');
    localStorage.setItem('cz_evt_search_tingdian', '1700000000000');   // 发现 1/12
    localStorage.setItem('cz_stage_log', JSON.stringify([
      { k: 'site_open', t: 1700000000000 },
      { k: 'search', e: '林远', t: 1700000060000 }
    ]));
  });
  await pb.reload({ waitUntil: 'networkidle' });
  await pb.waitForFunction(() => window.booted === true, null, { timeout: 20000 });
  await pb.evaluate(() => showOpening());
  await sleep(400);
  const recapText = await pb.evaluate(() => {
    const m = [...document.querySelectorAll('#msg-list .msg-item')].find(x => x.textContent.includes('上一班交接摘要'));
    return m ? m.textContent : '';
  });
  ok('B1 有进度 → 开场注入「上一班交接摘要」', recapText.includes('上一班交接摘要'));
  ok('B2 摘要含本班已发现 1 / 12', recapText.includes('1 / 12'));
  ok('B3 摘要含最后操作节点中文名（检索）', recapText.includes('最后操作节点：检索'));
  ok('B4 会话级标记 cz_recap_shown 已写（sessionStorage）', await pb.evaluate(() => sessionStorage.getItem('cz_recap_shown') === '1'));

  /* ================= R5-2C：同会话不重复 ================= */
  const before = await pb.evaluate(() => document.querySelectorAll('#msg-list .msg-item').length);
  await pb.evaluate(() => showOpening());
  await sleep(250);
  const after = await pb.evaluate(() => document.querySelectorAll('#msg-list .msg-item').length);
  ok('C1 同会话二次 showOpening 不重复 recap', before === after);
  await pb.close();

  /* ================= R5-2D：重开桌面（新会话）→ 再次 recap ================= */
  console.log('【R5-2D 重开桌面：跨日重开仍可 catch-up】');
  const pd = await ctxBD.newPage();   // 同 context 新标签页：localStorage 共享进度，sessionStorage 全新
  await pd.goto(BASE + '/desktop.html', { waitUntil: 'networkidle' });
  await pd.waitForFunction(() => window.booted === true, null, { timeout: 20000 });
  await pd.evaluate(() => showOpening());
  await sleep(400);
  ok('D1 重开桌面（新会话）→ 再次出现上一班交接摘要', await pd.evaluate(() =>
    [...document.querySelectorAll('#msg-list .msg-item')].some(m => m.textContent.includes('上一班交接摘要'))));
  await pd.close();
  await ctxBD.close();

  console.log('\n结果：' + pass + ' 通过，' + fail + ' 失败');
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
