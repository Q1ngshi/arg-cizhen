/* 游玩轨迹埋点全流程测试：官网 → 桌面 → 交接班，断言 cz_stage_log 与日志节格式
   覆盖四门四手段：linyuan（教学）/ 2009 管理员（日期提取）/ 1942 门禁07（计算器破译）/ 0172 档案门（图纸观察） */
const { chromium } = require('playwright');
const BASE = 'http://localhost:8081';
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Users/32268/AppData/Local/ms-playwright/chromium-1200/chrome-win64/chrome.exe' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  const getLog = () => page.evaluate(() => {
    try { return JSON.parse(localStorage.getItem('cz_stage_log') || '[]'); } catch (e) { return []; }
  });
  const waitLog = (k, e, timeout) => page.waitForFunction(({ k, e }) => {
    try {
      var arr = JSON.parse(localStorage.getItem('cz_stage_log') || '[]');
      return arr.some(function (it) { return it.k === k && (e === undefined || it.e === e); });
    } catch (err) { return false; }
  }, { k, e }, { timeout: timeout || 15000 });

  const pairs = arr => arr.map(it => it.e === undefined ? it.k : it.k + '|' + it.e);

  /* ================= Phase A：官网（19 节点，含 search|07、卡点保险丝 search|1942） ================= */
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload({ waitUntil: 'networkidle' });

  console.log('[A1] 打开官网 → site_open');
  await waitLog('site_open');

  console.log('[A2] 检索 林远 → 检索 05 → 密码门');
  await page.click('#main-nav a[data-page="search"]');
  await page.fill('#archive-search', '林远');
  await page.click('#archive-search-btn');
  await waitLog('search', '林远');
  await page.fill('#archive-search', '05');
  await page.click('#archive-search-btn');
  await waitLog('search', '05');
  await page.click('#search-result .search-result-item');   // 损坏条目 → openGate
  await page.click('#gate-modal.show');

  console.log('[A3] 密码门：错误 → 正确');
  await page.fill('#gate-input', '12345');
  await page.click('#gate-modal .gate-btn:not(.cancel)');   // 确 认
  await waitLog('gate_fail');
  await page.fill('#gate-input', 'linyuan');
  await page.click('#gate-modal .gate-btn:not(.cancel)');
  await waitLog('gate_ok');
  await page.click('#dossier.show .dossier-close');          // 关闭卷宗

  console.log('[A4] 检索 槐树街 → 回首页 → 管理员门（2009：卷宗落款年份）');
  await page.fill('#archive-search', '槐树街');
  await page.click('#archive-search-btn');
  await waitLog('search', '槐树街');
  await page.click('#main-nav a[data-page="home"]');
  await page.click('.news-item .n-title[onclick*="tryOpenAdmin"]');
  await page.click('#admin-modal.show');
  await waitLog('admin_open');
  await page.fill('#admin-user', 'xf001');
  await page.fill('#admin-pass', '2009');
  await page.click('#admin-modal .gate-btn:not(.cancel)');  // 登 录
  await waitLog('admin_ok');
  await page.click('#dossier2.show .dossier-close');         // 退出系统

  console.log('[A5] 检索 图纸 → 下载附件');
  await page.click('#main-nav a[data-page="search"]');
  await page.fill('#archive-search', '图纸');
  await page.click('#archive-search-btn');
  await waitLog('s_bp');
  await page.click('a[href="javascript:downloadBP()"]');
  await waitLog('dl_bp');

  console.log('[A6] 检索 陈守正');
  await page.fill('#archive-search', '陈守正');
  await page.click('#archive-search-btn');
  await waitLog('s_chen');

  console.log('[A7] 展开补录通知 → check05');
  await page.click('#main-nav a[data-page="home"]');
  await page.click('.news-tab[data-tab="tab3"]');
  await page.click('.news-item:not(.news-body):has-text("补录")');
  await waitLog('check05');

  console.log('[A8] 门禁 07：卡点保险丝 1942 → 通过（dossier3 存档清单含 0172 印证）');
  await page.click('#main-nav a[data-page="search"]');
  await page.fill('#archive-search', '07');
  await page.click('#archive-search-btn');
  await page.click('#search-result .search-result-item');
  await page.click('#gate3-modal.show');
  await waitLog('gate3_open');
  // 卡点路径：看到提示 → 搜 1942 确认 → 再回来输密码
  await page.click('#gate3-modal .gate-btn.cancel');        // 关弹窗
  await page.fill('#archive-search', '1942');
  await page.click('#archive-search-btn');
  await waitLog('search', '1942');
  await page.waitForFunction(() => document.getElementById('search-result').textContent.indexOf('编号 07') !== -1, { timeout: 5000 });
  await page.fill('#archive-search', '07');
  await page.click('#archive-search-btn');
  await page.click('#search-result .search-result-item');   // gate3_open 去重，不再记
  await page.fill('#gate3-input', '1942');
  await page.click('#gate3-modal .gate-btn:not(.cancel)');
  await waitLog('gate3_ok');

  const siteLog = await getLog();
  const siteSeq = pairs(siteLog);

  /* ================= Phase B：桌面 ================= */
  console.log('[B1] 打开终端 → 时钟同步 + 任务闭环');
  await page.goto(BASE + '/desktop.html', { waitUntil: 'networkidle' });
  await page.click('#unlock-veil', { timeout: 3000 }).catch(() => { });   // 跳过解锁动画
  await page.waitForFunction(() => document.querySelectorAll('.icon.locked').length === 0, { timeout: 15000 });
  await waitLog('task1_done');
  await waitLog('task2_done');
  await waitLog('task3_done');

  console.log('[B2] 内部档案：05/06/补001/补002/01');
  await page.dblclick('.icon[data-win="archive"]');
  for (const t of ['CE-2009-005', 'CE-2009-006', '2009-补-001', '2009-补-002']) {
    await page.click(`.arch-item:has-text("${t}")`);
  }
  await waitLog('arch_05'); await waitLog('arch_06'); await waitLog('arch_p1'); await waitLog('arch_p2');
  await page.click('.arch-item:has-text("CE-2009-001")');
  await waitLog('arch_01');

  console.log('[B3] 档案门：0172（dossier3 存档清单）→ 收录');
  await page.dblclick('.icon[data-win="archive"]');
  await page.click('.arch-item:has-text("CE-2009-001")');
  await page.fill('#arch01-input', '0172');
  await page.click('#arch01-gate button');
  await waitLog('bp_001');

  console.log('[B4] 建筑图：放大看柜位铭牌 → 挖掘储物间 ×3');
  await page.dblclick('.icon[data-win="tools"]');
  await page.click('#win-tools .tab-btn:has-text("建筑图")');
  await page.locator(".bp-card[onclick*=\"openBPZoom('001')\"]").click();
  await page.waitForSelector('#bp-zoom.show');
  await page.click('#bp-zoom .bp-bar button:has-text("＋")');   // 1.25×/次，×4 = 244% ≥ 200% 触发 bp_plate
  await page.click('#bp-zoom .bp-bar button:has-text("＋")');
  await page.click('#bp-zoom .bp-bar button:has-text("＋")');
  await page.click('#bp-zoom .bp-bar button:has-text("＋")');
  await waitLog('bp_plate');
  // 缩小 ×4 回到初始视图（“1:1”仅重置缩放不清平移，挖掘点会留在视野外）
  await page.click('#bp-zoom .bp-bar button:has-text("−")');
  await page.click('#bp-zoom .bp-bar button:has-text("−")');
  await page.click('#bp-zoom .bp-bar button:has-text("−")');
  await page.click('#bp-zoom .bp-bar button:has-text("−")');
  for (let i = 0; i < 3; i++) {
    await page.click('#bp-zoom .bp-dig');
    await page.waitForTimeout(400);
  }
  await page.waitForSelector('#bp-reveal.on', { timeout: 5000 });
  await waitLog('dig');
  await page.click('#bp-zoom-close');

  console.log('[B5] 计算器破译：2009−67=1942');
  await page.click('#win-tools .tab-btn:has-text("计算器")');
  for (const t of ['2', '0', '0', '9', '−', '6', '7', '=']) {
    await page.click(`.calc .k:has-text("${t}")`);
  }
  await waitLog('calc_break');

  console.log('[B6] 文件恢复');
  await page.click('#win-tools .tab-btn:has-text("文件恢复")');
  await page.click('#btn-restore');
  await waitLog('restore', undefined, 20000);

  console.log('[B7] 交接班 → 系统操作日志节');
  await page.click('#win-tools .tab-btn:has-text("交接班")');
  await page.click('#btn-handover');
  await waitLog('handover');
  await page.waitForFunction(() => document.getElementById('handover').textContent.indexOf('系统操作日志') !== -1, { timeout: 5000 });
  const handoverText = await page.locator('#handover').textContent();
  const copyVisible = await page.locator('#btn-handover-copy').isVisible();

  console.log('[B8] 交接后重扫 → 红本第23页之后');
  await page.click('#win-tools .tab-btn:has-text("文件恢复")');
  await page.click('#btn-restore');
  await waitLog('restore3', undefined, 20000);
  await page.waitForSelector('#restored3.show', { timeout: 5000 });

  /* ================= 断言 ================= */
  const log = await getLog();
  const seq = pairs(log);
  let fail = 0;
  const check = (name, ok) => { console.log((ok ? '✓ ' : '✗ ') + name); if (!ok) fail++; };

  /* 1. 官网段顺序严格一致（19 节点，含 search|07、卡点保险丝 search|1942） */
  const expectSite = ['site_open', 'search|林远', 'search|05', 'gate_open', 'gate_fail', 'gate_ok',
    'search|槐树街', 'admin_open', 'admin_ok', 'search|图纸', 's_bp', 'dl_bp',
    'search|陈守正', 's_chen', 'check05', 'search|07', 'gate3_open', 'search|1942', 'gate3_ok'];
  check('官网段 19 节点顺序一致', JSON.stringify(siteSeq) === JSON.stringify(expectSite));

  /* 2. 桌面加载簇（bp_p2/task3/task2 同一 poll 轮，unlock 取决于动画跳过时机，顺序可有竞态）
       唯一确定约束：unlock→task1_done 相邻；簇整体在 gate3_ok 之后、操作节点之前 */
  const cluster = ['bp_p2', 'task3_done', 'task2_done', 'unlock', 'task1_done'];
  const rest = seq.filter(s => cluster.indexOf(s) === -1);
  const tail = ['arch_05', 'arch_06', 'arch_p1', 'arch_p2', 'arch_01', 'bp_001', 'bp_plate', 'dig', 'calc_break', 'restore', 'handover', 'restore3'];
  check('剔除桌面加载簇后 = 官网19 + 桌面操作12',
    JSON.stringify(rest) === JSON.stringify(expectSite.concat(tail)));
  check('unlock 与 task1_done 相邻', seq.indexOf('task1_done') === seq.indexOf('unlock') + 1);
  check('桌面加载簇均在 gate3_ok 之后', cluster.every(s => seq.indexOf(s) > seq.indexOf('gate3_ok')));
  const tailIdx = tail.map(k => seq.indexOf(k));
  const maxClu = Math.max(...cluster.map(s => seq.indexOf(s)));
  check('桌面操作节点均在加载簇之后', tailIdx.every(i => i > maxClu));
  check('日志总长 = 36 条', log.length === 36);

  /* 3. 交接班日志节 */
  const section = handoverText.split('—— 附：系统操作日志（本班）——')[1] || '';
  const lines = section.trim().split('\n').filter(Boolean);
  check('日志节 34 行（交接班快照时 restore3 尚未发生：handover 前共 34 条）', lines.length === 34);
  check('首行 = 01 官网 打开 · 0:00', lines[0] === '01 官网 打开 · 0:00');
  check('行格式 = NN 名称 · 分:秒', lines.every(l => /^\d{2} .+ · \d+:\d{2}$/.test(l)));
  let mono = true, prev = -1;
  for (const l of lines) {
    const m = l.match(/· (\d+):(\d+)$/);
    const v = parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
    if (v < prev) mono = false;
    prev = v;
  }
  check('相对时间单调不减', mono);
  check('复制记录按钮可见', copyVisible);
  check('日志含 检索 林远（中文关键词原文）', lines.some(l => l.includes('检索 林远')));
  check('日志含 墙体检验', lines.some(l => l.includes('墙体检验')));

  if (fail) {
    console.log('\n—— 实际日志序列 ——');
    seq.forEach((s, i) => console.log(String(i + 1).padStart(2, '0'), s));
  }
  await browser.close();
  console.log(fail ? `\n❌ ${fail} 项未通过` : '\n✅ 埋点全流程测试通过');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('❌ 失败:', e.message); process.exit(1); });
