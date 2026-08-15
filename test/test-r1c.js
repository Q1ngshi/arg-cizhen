/* R1 收尾验证：6-B 档案回溯（已读标记跨会话恢复）+ 8-A PNG 隐写（tEXt chunk 证据图）
   依赖：node serve.js 运行中（localhost:8081） */
const { chromium } = require('playwright');
const BASE = 'http://localhost:8081';
let pass = 0, fail = 0;
const ok = (n, c, e) => { if (c) { pass++; console.log('  ✅ ' + n); } else { fail++; console.log('  ❌ ' + n + (e ? ' ← ' + e : '')); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Users/32268/AppData/Local/ms-playwright/chromium-1200/chrome-win64/chrome.exe' });

  /* ================= 8-A：PNG 隐写证据图 ================= */
  console.log('【8-A PNG 隐写：名册首页扫描件 tEXt chunk】');
  const resp = await (await browser.newPage()).request.get(BASE + '/assets/img/roster-scan.png');
  const buf = await resp.body();
  const hasTExt = buf.indexOf(Buffer.from('tEXt')) >= 0;
  ok('A1 PNG 文件可访问', resp.ok() && buf.length > 1000);
  ok('A2 PNG 含 tEXt chunk（隐写载体）', hasTExt);
  const textStart = buf.indexOf(Buffer.from('Comment')) + 8;
  const hidden = buf.slice(textStart, textStart + 100).toString('utf-8').split('\x00')[0];
  ok('A3 隐写文本：中元节那天被擦掉', hidden.includes('中元节那天被擦掉'));
  ok('A4 隐写文本：录像里他们都在', hidden.includes('录像里，他们都在'));

  // 官网检索「名册」→ 名册首页下载入口
  const pa = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await pa.goto(BASE + '/', { waitUntil: 'networkidle' });
  await pa.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await pa.reload({ waitUntil: 'networkidle' });
  await pa.click('#main-nav a[data-page="search"]');
  await pa.fill('#archive-search', '名册');
  await pa.click('#archive-search-btn');
  await pa.waitForFunction(() => document.getElementById('search-result').querySelector('img[src*="roster-scan"]'), { timeout: 5000 });
  ok('A5 检索名册：名册首页扫描件渲染', await pa.evaluate(() => document.querySelector('#search-result img[src*="roster-scan"]').naturalWidth > 0));
  const dlHref = await pa.evaluate(() => {
    const a = document.querySelector('#search-result a[download*="名册首页"]');
    return a ? a.getAttribute('href') : '';
  });
  ok('A6 检索名册：名册首页下载入口', dlHref.includes('roster-scan.png'));
  await pa.close();

  /* ================= 6-B：档案已读标记 ================= */
  console.log('【6-B 档案回溯：已读标记 + 跨会话恢复】');
  const pb = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await pb.goto(BASE + '/desktop.html', { waitUntil: 'networkidle' });
  await pb.evaluate(() => { localStorage.clear(); sessionStorage.clear(); localStorage.setItem('cz_admin_ok', '1'); });
  await pb.reload({ waitUntil: 'networkidle' });
  await pb.waitForFunction(() => document.querySelectorAll('.icon.locked').length === 0, null, { timeout: 20000 });
  // 打开内部档案，点 05 卷宗 → 应写 cz_read_05 且条目出现「· 已读」
  await pb.dblclick('.icon[data-win="archive"]');
  await pb.click('.arch-item:has-text("CE-2009-005")');
  ok('B1 打开卷宗写 cz_read_05', await pb.evaluate(() => !!localStorage.getItem('cz_read_05')));
  await sleep(200);
  ok('B2 条目出现「· 已读」标记', await pb.evaluate(() => [...document.querySelectorAll('.arch-item')].some(it => it.textContent.includes('· 已读'))));
  // 再点 01 → 写 cz_read_01
  await pb.click('.arch-item:has-text("CE-2009-001")');
  ok('B3 打开卷宗写 cz_read_01', await pb.evaluate(() => !!localStorage.getItem('cz_read_01')));
  // 模拟跨会话：重载页面后已读标记仍在
  await pb.reload({ waitUntil: 'networkidle' });
  await pb.waitForFunction(() => document.querySelectorAll('.icon.locked').length === 0, null, { timeout: 20000 });
  await pb.dblclick('.icon[data-win="archive"]');
  await sleep(300);
  ok('B4 重载后已读标记恢复（05 与 01）', await pb.evaluate(() => {
    const items = [...document.querySelectorAll('.arch-item')];
    const readCount = items.filter(it => it.textContent.includes('· 已读')).length;
    return readCount >= 2;
  }));
  ok('B5 未读条目不带已读标记（补-001 未读）', await pb.evaluate(() => {
    const it = [...document.querySelectorAll('.arch-item')].find(x => x.textContent.includes('2009-补-001'));
    return it && !it.textContent.includes('· 已读');
  }));
  // 幂等：再次打开 05 不重复加标记
  await pb.click('.arch-item:has-text("CE-2009-005")');
  await sleep(200);
  ok('B6 重复打开不产生重复标记', await pb.evaluate(() => {
    const it = [...document.querySelectorAll('.arch-item')].find(x => x.textContent.includes('CE-2009-005'));
    return it && it.querySelectorAll('.a-read').length === 1;
  }));
  await pb.close();

  await browser.close();
  console.log(`\n===== R1 收尾验证（6-B + 8-A）：${pass} 通过 / ${fail} 失败 =====`);
  process.exit(fail ? 2 : 0);
})().catch(e => { console.error('崩溃:', e.message); process.exit(3); });
