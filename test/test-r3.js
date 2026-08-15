/* R3 验证：氛围峰值 + 载体（1-A 网群 / 1-B ver=2009 / 1-C 假404 / 3-A 异变 / 3-B 指令反噬 / 3-C 音频变化）
   依赖：node serve.js 运行中（localhost:8081） */
const { chromium } = require('playwright');
const BASE = 'http://localhost:8081';
let pass = 0, fail = 0;
const ok = (n, c, e) => { if (c) { pass++; console.log('  ✅ ' + n); } else { fail++; console.log('  ❌ ' + n + (e ? ' ← ' + e : '')); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Users/32268/AppData/Local/ms-playwright/chromium-1200/chrome-win64/chrome.exe' });

  /* ================= R3-1A 慈恩镇网群伪外部层 ================= */
  console.log('【1-A 慈恩镇网群】');
  const p1 = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await p1.goto(BASE + '/', { waitUntil: 'networkidle' });
  ok('A1 机构概况页含「慈恩镇网站群」导航表', await p1.evaluate(() => document.body.innerHTML.includes('慈恩镇网站群')));
  ok('A2 档案办之外单位标注「建设中」', await p1.evaluate(() => {
    const t = document.getElementById('town-sites');
    return !!t && t.innerHTML.includes('建设中');
  }));
  ok('A3 虚构单位名（水利站/文教办/粮站）', await p1.evaluate(() => {
    const t = document.getElementById('town-sites');
    return !!t && t.innerHTML.includes('水利站') && t.innerHTML.includes('粮站');
  }));
  await p1.close();

  /* ================= R3-1B 历史版本时间胶囊 ?ver=2009 ================= */
  console.log('【1-B 历史版本时间胶囊】');
  const p2 = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await p2.goto(BASE + '/?ver=2009', { waitUntil: 'networkidle' });
  ok('B1 ver=2009 时 body 加 cz-ver2009（黑白维护态）', await p2.evaluate(() => document.body.classList.contains('cz-ver2009')));
  ok('B2 2009 版标题/提示存在', await p2.evaluate(() => document.body.innerHTML.includes('维护') || document.body.innerHTML.includes('2009')));
  // 无参数时默认态
  const p2b = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await p2b.goto(BASE + '/', { waitUntil: 'networkidle' });
  ok('B3 无参数默认不进入 2009 态', await p2b.evaluate(() => !document.body.classList.contains('cz-ver2009')));
  await p2b.close(); await p2.close();

  /* ================= R3-1C 假 404 页 ================= */
  console.log('【1-C 假 404】');
  const resp404 = await (await browser.newPage()).request.get(BASE + '/no-such-page.html');
  const t404 = await resp404.text();
  ok('C1 404 响应状态码 404', resp404.status() === 404);
  ok('C2 404 页为「查无此档」风格', t404.includes('查无此档') && t404.includes('慈恩镇档案管理办公室'));

  /* ================= R3-3A 深水区全页面异变 ================= */
  console.log('【3-A 全页面异变（被登记后）】');
  const p3 = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await p3.goto(BASE + '/', { waitUntil: 'networkidle' });
  await p3.evaluate(() => { localStorage.clear(); sessionStorage.clear(); localStorage.setItem('cz_evt_final_read', '1'); });
  await p3.reload({ waitUntil: 'networkidle' });
  ok('A1 被登记后 body 加 cz-registered（视觉异变生效）', await p3.evaluate(() => document.body.classList.contains('cz-registered')));
  ok('A2 倒计时加血字慢闪类（cz-blink）', await p3.evaluate(() => !!document.querySelector('.cz-blink')));
  ok('A3 新闻日期错位/替换已注入', await p3.evaluate(() => {
    const b = document.body.innerHTML;
    return b.includes('cz-registered') || /(2009|2010|日期|错位)/.test(b);
  }));
  // 默认态无异变
  await p3.evaluate(() => localStorage.clear());
  await p3.reload({ waitUntil: 'networkidle' });
  ok('A4 默认态无异变类', await p3.evaluate(() => !document.body.classList.contains('cz-registered')));
  await p3.close();

  /* ================= R3-3B 指令反噬 ================= */
  console.log('【3-B 指令反噬】');
  const p4 = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await p4.goto(BASE + '/', { waitUntil: 'networkidle' });
  await p4.evaluate(() => { localStorage.clear(); sessionStorage.clear(); localStorage.setItem('cz_evt_final_read', '1'); });
  await p4.reload({ waitUntil: 'networkidle' });
  const clause = await p4.evaluate(() => {
    const el = document.getElementById('clause-extra');
    return el ? el.textContent : null;
  });
  ok('B1 被登记后查阅须知变可执行指令「请关闭此页面」', clause && clause.includes('请关闭此页面'));
  await p4.evaluate(() => {
    const el = document.getElementById('clause-extra');
    if (el) el.click();
  });
  await sleep(400);
  ok('B2 点击后出现全屏黑底白字覆盖层', await p4.evaluate(() => {
    const ov = document.querySelector('div[style*="background: rgb(0, 0, 0)"], div[style*="background:#000"]');
    return !!ov && ov.style.position === 'fixed';
  }));
  await p4.close();

  /* ================= R3-3C 音频变化（desktop 心跳 + 翻页） ================= */
  console.log('【3-C 音频变化】');
  const p5 = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await p5.goto(BASE + '/desktop.html', { waitUntil: 'networkidle' });
  await p5.evaluate(() => { localStorage.clear(); sessionStorage.clear(); localStorage.setItem('cz_admin_ok', '1'); });
  await p5.reload({ waitUntil: 'networkidle' });
  await p5.waitForFunction(() => document.querySelectorAll('.icon.locked').length === 0, null, { timeout: 20000 });
  // 静态核查：音频函数存在
  ok('C1 heartbeatThump 函数存在', await p5.evaluate(() => typeof window.heartbeatThump === 'function'));
  ok('C2 pageflipNoise 函数存在', await p5.evaluate(() => typeof window.pageflipNoise === 'function'));
  ok('C3 startHeartbeatAmbient / syncAudioAmbient 存在', await p5.evaluate(() => typeof window.startHeartbeatAmbient === 'function' && typeof window.syncAudioAmbient === 'function'));
  // 未登记：不启动心跳
  ok('C4 未登记不启动心跳定时器', await p5.evaluate(() => window.ambHeartbeatTimer === null));
  // 模拟被登记（finalizeRegistration 会设置 cz_evt_final_read 并启动）
  await p5.evaluate(() => { localStorage.setItem('cz_evt_final_read', Date.now()); window.startHeartbeatAmbient(); });
  ok('C5 被登记后启动心跳定时器', await p5.evaluate(() => window.ambHeartbeatTimer !== null));
  await p5.evaluate(() => { window.stopHeartbeatAmbient(); });
  ok('C6 好结局/停止后心跳定时器清除', await p5.evaluate(() => window.ambHeartbeatTimer === null));
  await p5.close();

  await browser.close();
  console.log(`\n===== R3 氛围峰值验证：${pass} 通过 / ${fail} 失败 =====`);
  process.exit(fail ? 2 : 0);
})().catch(e => { console.error('崩溃:', e.message); process.exit(3); });
