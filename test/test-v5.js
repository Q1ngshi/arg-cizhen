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
  for (let i = 1; i <= 3; i++) { await p2.click('#rb-frag-' + i); await p2.waitForTimeout(300); }   // 先去污拼合
  await p2.waitForFunction(() => document.getElementById('rb-joined').style.display === 'block', null, { timeout: 5000 });
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
  /* ================= Phase D：ARG 借鉴落地（meta 界面层 / 守则 / 伪社区 / 文件彩蛋） ================= */
  console.log('【D ARG 借鉴：meta + 守则 + 伪社区 + 文件彩蛋】');
  const pd = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const dLogs = [];
  pd.on('console', m => { if (m.type() === 'log') dLogs.push(m.text()); });
  await pd.goto(BASE + '/', { waitUntil: 'networkidle' });
  await pd.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await pd.reload({ waitUntil: 'networkidle' });
  ok('D1 默认态：控制台系统日志（慈恩镇档案门户）', dLogs.some(t => t.includes('慈恩镇档案门户')));
  ok('D1 默认态：title 正常', (await pd.title()) === '慈恩镇档案管理办公室');
  // 守则矛盾条款（规则怪谈：官方语气混入恶意条款）
  await pd.click('#main-nav a[data-page="search"]');
  ok('D2 守则条款：检索到本人姓名立即停止', (await pd.locator('#page-search').textContent()).includes('如检索结果出现您的姓名'));
  // 伪社区留言板
  await pd.click('#main-nav a[data-page="contact"]');
  const contactTxt = await pd.locator('#page-contact').textContent();
  ok('D3 留言板：别搜林远', contactTxt.includes('别搜「林远」'));
  ok('D3 留言板：替他值个班（伪社区钩子）', contactTxt.includes('他让我替他值个班'));
  ok('D3 留言板：8-27 暂停服务（大典日呼应）', contactTxt.includes('2026-08-27 起暂停服务'));
  // 被登记态：title / favicon / console 全部变化
  await pd.evaluate(() => localStorage.setItem('cz_evt_final_read', Date.now()));
  await pd.reload({ waitUntil: 'networkidle' });
  ok('D4 被登记：title 检索记录已存档', (await pd.title()).includes('检索记录已存档'));
  ok('D4 被登记：控制台名单在册', dLogs.some(t => t.includes('名单在册')));
  ok('D4 被登记：favicon 换登记章', await pd.evaluate(() => document.querySelector('link[rel="icon"]').href.includes('%E7%99%BB%E8%AE%B0')));
  // 好结局态：title / console 恢复
  await pd.evaluate(() => { localStorage.setItem('cz_evt_good_end', Date.now()); });
  await pd.reload({ waitUntil: 'networkidle' });
  ok('D5 好结局：title 档案已补录', (await pd.title()).includes('档案已补录'));
  ok('D5 好结局：控制台档案已补录', dLogs.some(t => t.includes('档案已补录')));
  // SVG 源文件彩蛋（fetch 文本断言：文件本身即恐怖）
  const resp = await pd.request.get(BASE + '/assets/img/inventory-list.svg');
  const svgSrc = await resp.text();
  ok('D6 盘点单源码彩蛋：复核备注（3-17 之后不在原位）', svgSrc.includes('3-17 之后再查，已不在原位'));
  ok('D6 盘点单源码彩蛋：隐藏文本（名册不在库里。在册里。）', svgSrc.includes('名册不在库里。在册里。'));
  // 下载原件入口
  await pd.evaluate(() => localStorage.clear());
  await pd.reload({ waitUntil: 'networkidle' });
  await pd.click('#main-nav a[data-page="search"]');
  await pd.fill('#archive-search', '名册');
  await pd.click('#archive-search-btn');
  ok('D7 检索名册：下载原件入口（源文件核对暗示）', await pd.locator('#search-result a[download]').count() > 0);
  await pd.close();

  /* ================= Phase E：提分路线——藏宝链（base64 解码）+ 自传播钩子（统计/留言） ================= */
  console.log('【E 藏宝链 + 自传播钩子】');
  const pe = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  // E1 base64 解码链：SVG 源文件 → 提取加密存档行 → 官网检索框粘贴解码
  const svgResp = await pe.request.get(BASE + '/assets/img/inventory-list.svg');
  const svgSrcE = await svgResp.text();
  const b64m = svgSrcE.match(/5oWI[A-Za-z0-9+/=]+/);
  ok('E1 加密存档行存在于盘点单源文件', !!b64m);
  await pe.goto(BASE + '/', { waitUntil: 'networkidle' });
  await pe.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await pe.reload({ waitUntil: 'networkidle' });
  await pe.click('#main-nav a[data-page="search"]');
  await pe.fill('#archive-search', b64m ? b64m[0] : '');
  await pe.click('#archive-search-btn');
  const decTxt = await pe.locator('#search-result').textContent();
  ok('E1 检索框解码：记录已解码', decTxt.includes('记录已解码'));
  ok('E1 解码内容与 01:47 谜题互文（已登记）', decTxt.includes('已登记'));
  ok('E1 解码写入 cz_evt_roster_decode', await pe.evaluate(() => !!localStorage.getItem('cz_evt_roster_decode')));
  // E2 留言板动态留言：被登记态多出「03:01 见。」，好结局不出现
  await pe.evaluate(() => localStorage.setItem('cz_evt_final_read', Date.now()));
  await pe.reload({ waitUntil: 'networkidle' });
  await pe.click('#main-nav a[data-page="contact"]');
  ok('E2 被登记：留言板多出「03:01 见。」', (await pe.locator('#mboard-live').textContent()).includes('03:01 见'));
  await pe.evaluate(() => localStorage.setItem('cz_evt_good_end', Date.now()));
  await pe.reload({ waitUntil: 'networkidle' });
  await pe.click('#main-nav a[data-page="contact"]');
  ok('E2 好结局：留言板不再出现「03:01 见。」', !(await pe.locator('#mboard-live').textContent()).includes('03:01 见'));
  await pe.close();
  // E3 被登记统计消息：桌面阅读最终卷 → 「已发现 X / 12 处」
  const pe2 = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await pe2.goto(BASE + '/desktop.html', { waitUntil: 'networkidle' });
  await pe2.evaluate(() => {
    localStorage.setItem('cz_admin_ok', '1');
    localStorage.setItem('cz_evt_gate3_ok', Date.now());
    localStorage.setItem('cz_evt_handover_done', Date.now());
    localStorage.setItem('cz_evt_wang_read', Date.now());
    localStorage.setItem('cz_evt_morse_break', Date.now());
    localStorage.setItem('cz_evt_search_tingdian', Date.now());
    localStorage.setItem('cz_stage_log', JSON.stringify([{ k: 'calc_break' }, { k: 'bp_plate' }]));
  });
  await pe2.reload({ waitUntil: 'networkidle' });
  await pe2.waitForFunction(() => document.querySelectorAll('.icon.locked').length === 0, null, { timeout: 20000 });
  await pe2.waitForFunction(() => document.getElementById('arch-final-entry').style.display !== 'none', null, { timeout: 10000 });
  await pe2.dblclick('.icon[data-win="archive"]');
  await pe2.click('#arch-final-entry');
  await pe2.waitForSelector('#final-veil.show');
  await pe2.click('#fv-warn .btn');
  await sleep(600);
  ok('E3 被登记：异常记录统计 X / 12 处', await pe2.evaluate(() => [...document.querySelectorAll('#msg-list .msg-item')].some(m => /已发现 \d+ \/ 12 处/.test(m.textContent))));
  await pe2.close();

  await browser.close();
  const errs = errors.filter(e => !e.includes('favicon'));
  console.log(errs.length ? '⚠ 页面错误：\n' + errs.join('\n') : '（无页面 JS 错误）');
  console.log(`\n===== v5 提升验证：${pass} 通过 / ${fail} 失败 =====`);
  process.exit(fail ? 2 : 0);
})().catch(e => { console.error('崩溃:', e.message); process.exit(3); });
