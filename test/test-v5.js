/* v5 提升验证：验证式推理（01:47 判断 / 红本关系判断）+ 建筑图 v3（擦除彩蛋 / 热区标注）
   + 美术证据（值班表 / 盘点单 / 户籍卡 / 名册撕页）加载
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

  /* ================= Phase A：官网（01:47 判断 + 证据图） ================= */
  console.log('【A 官网：记录核对 + 美术证据】');
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  track(page);
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload({ waitUntil: 'networkidle' });

  // A1 值班表 SVG（CE-2009-005 卷宗内）
  await page.click('#main-nav a[data-page="search"]');
  await page.fill('#archive-search', '05');
  await page.click('#archive-search-btn');
  await page.click('#search-result .search-result-item');   // 损坏条目 → 密码门
  await page.fill('#gate-input', 'linyuan');
  await page.click('#gate-modal .gate-btn:not(.cancel)');
  await page.waitForSelector('#dossier.show');
  const dutyOk = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll('#dossier img')];
    return imgs.some(i => i.src.includes('duty-roster.svg') && i.naturalWidth > 0);
  });
  ok('A1 值班表证据图加载（卷宗内）', dutyOk);
  await page.click('#dossier.show .dossier-close');

  // A2 检索「名册」→ 盘点单 SVG
  await page.fill('#archive-search', '名册');
  await page.click('#archive-search-btn');
  await page.waitForFunction(() => document.getElementById('search-result').querySelector('img[src*="inventory-list"]'), { timeout: 5000 });
  const invOk = await page.evaluate(() => {
    const im = document.querySelector('#search-result img[src*="inventory-list"]');
    return im && im.naturalWidth > 0;
  });
  ok('A2 盘点单证据图加载（检索「名册」）', invOk);

  // A3 dossier3：01:47 出入登记 + 判断谜题
  await page.evaluate(() => {
    sessionStorage.setItem('cz_admin_unlock', '1');
    window._catalog['07'] = { title: '教会地下档案室备案记录（1965-2009）', status: '限制调阅，需门禁密码', desc: '人员出入登记' };
  });
  await page.fill('#archive-search', '07');
  await page.click('#archive-search-btn');
  await page.click('#search-result .search-result-item');
  await page.fill('#gate3-input', '1942');
  await page.click('#gate3-modal .gate-btn:not(.cancel)');
  await page.waitForSelector('#dossier3.show');
  ok('A3 出入登记行（01:47 · 无姓名 · 已登记）', (await page.locator('#dossier3').textContent()).includes('01:47'));
  await page.click('#judge-0147 .judge-opt:has-text("陈某")');          // 错答
  await sleep(200);
  ok('A3 错答：记录矛盾，待查（不写事件键）', (await page.locator('#judge-0147-fb').textContent()).includes('记录矛盾') && await page.evaluate(() => !localStorage.getItem('cz_evt_judge_0147')));
  await page.click('#judge-0147 .judge-opt:has-text("王执事")');        // 正答
  await sleep(200);
  ok('A3 正答：核对完成 + 访客 01', (await page.locator('#judge-0147-fb').textContent()).includes('核对完成') && (await page.locator('#judge-0147-fb').textContent()).includes('访客 01'));
  ok('A3 正答：写入 cz_evt_judge_0147', await page.evaluate(() => !!localStorage.getItem('cz_evt_judge_0147')));
  ok('A3 正答：选项隐藏', await page.evaluate(() => document.getElementById('judge-0147-opts').style.display === 'none'));
  await page.close();

  /* ================= Phase B：桌面（红本判断 + 擦除彩蛋 + 热区 + 最终卷撕页） ================= */
  console.log('【B 桌面：验证式 + 建筑图 v3】');
  const p2 = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  track(p2);
  await p2.goto(BASE + '/desktop.html', { waitUntil: 'networkidle' });
  await p2.evaluate(() => localStorage.setItem('cz_admin_ok', '1'));
  await p2.reload({ waitUntil: 'networkidle' });
  await p2.waitForFunction(() => document.querySelectorAll('.icon.locked').length === 0, null, { timeout: 20000 });

  // B1 红本抄本关系判断（restored2）
  await p2.dblclick('.icon[data-win="tools"]');
  await p2.click('#win-tools .tab-btn:has-text("文件恢复")');
  await p2.click('#btn-restore');
  await p2.waitForSelector('#restored2.show', { timeout: 20000 });
  await p2.click('#judge-redbook .judge-opt:has-text("门禁密码")');      // 错答
  await sleep(200);
  ok('B1 错答：记录矛盾，待查', (await p2.locator('#judge-redbook-fb').textContent()).includes('记录矛盾'));
  await p2.click('#judge-redbook .judge-opt:has-text("名册（红皮")');    // 正答
  await sleep(200);
  ok('B1 正答：核对完成 + 册子', (await p2.locator('#judge-redbook-fb').textContent()).includes('核对完成'));
  ok('B1 正答：写入 cz_evt_judge_redbook', await p2.evaluate(() => !!localStorage.getItem('cz_evt_judge_redbook')));

  // B2 户籍证据图（arch-p1）
  await p2.dblclick('.icon[data-win="archive"]');
  await p2.click('.arch-item:has-text("2009-补-001")');
  const hhOk = await p2.evaluate(() => {
    const im = document.querySelector('#arch-p1 img[src*="household-change"]');
    return im && im.naturalWidth > 0;
  });
  ok('B2 户籍卡证据图加载（arch-p1）', hhOk);

  // B3 建筑图 BP-A：热区标注 + 擦除彩蛋
  await p2.evaluate(() => localStorage.setItem('cz_evt_blueprint_p2', Date.now()));
  await p2.dblclick('.icon[data-win="tools"]');
  await p2.click('#win-tools .tab-btn:has-text("建筑图")');
  await p2.locator(".bp-card[onclick*=\"openBPZoom('p2')\"]").click();
  await p2.waitForSelector('#bp-zoom.show');
  ok('B3 擦除按钮仅 BP-A 可见', await p2.locator('#bp-erase-btn').isVisible());
  await p2.click('.bp-hot[onclick*="A-store"]');
  await sleep(200);
  ok('B3 热区标注：西侧区域', (await p2.locator('#bp-hot-anno').textContent()).includes('已划除'));
  await p2.click('#bp-erase-btn');   // 进入擦除模式
  const nRed = await p2.locator('#bp-stage .bp-red').count();
  ok('B3 红批注元素 = 8', nRed === 8);
  for (let i = 0; i < nRed; i++) {
    await p2.locator('#bp-stage .bp-red').nth(i).click({ force: true });
    await sleep(60);
  }
  await p2.waitForFunction(() => document.getElementById('bp-erase-reveal').classList.contains('on'), null, { timeout: 5000 });
  ok('B3 擦除完成：还原房间轮廓浮现', true);
  ok('B3 写入 cz_evt_bp_erase + 埋点 bp_erase', await p2.evaluate(() => !!localStorage.getItem('cz_evt_bp_erase')));
  ok('B3 系统消息：擦除完成', await p2.evaluate(() => [...document.querySelectorAll('#msg-list .msg-item')].some(m => m.textContent.includes('擦除完成'))));
  ok('B3 擦除按钮已隐藏', await p2.evaluate(() => document.getElementById('bp-erase-btn').style.display === 'none'));
  await p2.click('#bp-zoom-close');

  // B4 建筑图 BP-B：热区标注
  await p2.evaluate(() => localStorage.setItem('cz_evt_blueprint_001', Date.now()));
  await p2.click('#win-tools .tab-btn:has-text("建筑图")');
  await p2.locator(".bp-card[onclick*=\"openBPZoom('001')\"]").click();
  await p2.waitForSelector('#bp-zoom.show');
  ok('B4 擦除按钮 BP-B 隐藏', await p2.evaluate(() => document.getElementById('bp-erase-btn').style.display === 'none'));
  await p2.click('.bp-hot[onclick*="B-holy"]');
  await sleep(200);
  ok('B4 热区标注：圣器室北墙无开口', (await p2.locator('#bp-hot-anno').textContent()).includes('北墙无开口'));
  await p2.click('#bp-zoom-close');

  // B5 最终卷：名册撕页残片加载
  await p2.evaluate(() => {
    localStorage.setItem('cz_evt_search_tingdian', Date.now());
    localStorage.setItem('cz_evt_gate3_ok', Date.now());
    localStorage.setItem('cz_evt_handover_done', Date.now());
    localStorage.setItem('cz_evt_morse_break', Date.now());
    localStorage.setItem('cz_evt_wang_read', Date.now());
    localStorage.setItem('cz_stage_log', JSON.stringify([{ k: 'calc_break' }, { k: 'bp_plate' }]));
  });
  await p2.reload({ waitUntil: 'networkidle' });
  await p2.waitForFunction(() => document.querySelectorAll('.icon.locked').length === 0, null, { timeout: 20000 });
  await p2.waitForFunction(() => document.getElementById('arch-final-entry').style.display !== 'none', null, { timeout: 10000 });
  await p2.dblclick('.icon[data-win="archive"]');
  await p2.click('#arch-final-entry');
  await p2.waitForSelector('#final-veil.show');
  await p2.click('#fv-warn .btn');
  await sleep(400);
  const tornOk = await p2.evaluate(() => {
    const imgs = [...document.querySelectorAll('#fv-body img')];
    return imgs.some(i => i.src.includes('roster-torn-page.svg') && i.naturalWidth > 0);
  });
  ok('B5 名册撕页残片加载（最终卷）', tornOk);
  await p2.close();

  /* ================= Phase C：移动端视口骨架 ================= */
  console.log('【C 移动端视口：无 JS 错误】');
  const mob = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  track(mob);
  await mob.goto(BASE + '/desktop.html', { waitUntil: 'networkidle' });
  await sleep(1200);
  await mob.dblclick('.icon[data-win="browser"]');
  await sleep(400);
  const winBox = await mob.locator('#win-browser').boundingBox();
  ok('C1 移动端：窗口全宽自适应', winBox && winBox.width >= 389);
  await mob.close();

  await browser.close();
  const errs = errors.filter(e => !e.includes('favicon'));
  console.log(errs.length ? '⚠ 页面错误：\n' + errs.join('\n') : '（无页面 JS 错误）');
  console.log(`\n===== v5 提升验证：${pass} 通过 / ${fail} 失败 =====`);
  process.exit(fail ? 2 : 0);
})().catch(e => { console.error('崩溃:', e.message); process.exit(3); });
