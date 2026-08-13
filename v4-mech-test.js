/* v4 机制全流程验证：摩斯破译 → 最终卷七键解锁 → 警告/拒绝 → 确认再想想 → 二选一
   死亡抹除过场 → 重来 d3 → 第三选项 → 好结局；倒计时三态；时间解冻；林远三态；陈守正已登记
   依赖：node serve.js 运行中（localhost:8081） */
const { chromium } = require('playwright');
const BASE = 'http://localhost:8081';
let pass = 0, fail = 0;
const ok = (n, c, e) => { if (c) { pass++; console.log('  ✅ ' + n); } else { fail++; console.log('  ❌ ' + n + (e ? ' ← ' + e : '')); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Users/32268/AppData/Local/ms-playwright/chromium-1200/chrome-win64/chrome.exe' });

  /* ================= Phase A：官网（摩斯/停电检索 + 默认态） ================= */
  console.log('【A 官网：检索键 + 默认态】');
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload({ waitUntil: 'networkidle' });

  await page.click('#main-nav a[data-page="search"]');
  // A1 停电检索 → cz_evt_search_tingdian
  await page.fill('#archive-search', '停电');
  await page.click('#archive-search-btn');
  await page.waitForFunction(() => localStorage.getItem('cz_evt_search_tingdian'), { timeout: 5000 });
  const t1 = await page.locator('#search-result').textContent();
  ok('A1 停电检索：通知可见', t1.includes('3 月 17 日'));
  ok('A1 停电检索：写入 cz_evt_search_tingdian', await page.evaluate(() => !!localStorage.getItem('cz_evt_search_tingdian')));
  // A2 摩斯检索「八月廿七」→ cz_evt_morse_break
  await page.fill('#archive-search', '八月廿七');
  await page.click('#archive-search-btn');
  await page.waitForFunction(() => localStorage.getItem('cz_evt_morse_break'), { timeout: 5000 });
  const t2 = await page.locator('#search-result').textContent();
  ok('A2 摩斯检索：筹备记录 + 批注', t2.includes('名单照旧。八月廿七，河边。'));
  ok('A2 摩斯检索：写入 cz_evt_morse_break', await page.evaluate(() => !!localStorage.getItem('cz_evt_morse_break')));
  // A3 倒计时默认态（数字）
  const days = await page.locator('#cz-dict-days').textContent();
  ok('A3 倒计时默认态：数字天 (' + days.trim() + ')', /^\d+$/.test(days.trim()));
  // A4 林远默认态
  await page.fill('#archive-search', '林远');
  await page.click('#archive-search-btn');
  ok('A4 林远默认态：未找到', (await page.locator('#search-result').textContent()).includes('未找到相关档案'));
  // A5 陈守正默认态
  await page.fill('#archive-search', '陈守正');
  await page.click('#archive-search-btn');
  ok('A5 陈守正默认态：无已登记标记', !(await page.locator('#search-result').textContent()).includes('已登记'));

  /* ================= Phase B：桌面（七键解锁 + 最终卷全流程） ================= */
  console.log('【B 桌面：最终卷全流程】');
  await page.goto(BASE + '/desktop.html', { waitUntil: 'networkidle' });
  const unlock = async () => {
    await page.evaluate(() => localStorage.setItem('cz_admin_ok', '1'));
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.querySelectorAll('.icon.locked').length === 0, null, { timeout: 20000 });
  };
  await unlock();
  // 清掉 A2 已写入的摩斯键 → 构造「六键差摩斯」场景
  await page.evaluate(() => localStorage.removeItem('cz_evt_morse_break'));
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.querySelectorAll('.icon.locked').length === 0, null, { timeout: 20000 });

  const hasMsg = txt => page.evaluate(t => [...document.querySelectorAll('#msg-list .msg-item')].some(m => m.textContent.includes(t)), txt);

  // B0 六键注入（差摩斯）→ 档3 保底桥
  await page.evaluate(() => {
    localStorage.setItem('cz_evt_gate3_ok', Date.now());
    localStorage.setItem('cz_evt_handover_done', Date.now());
    localStorage.setItem('cz_evt_wang_read', Date.now());
    localStorage.setItem('cz_stage_log', JSON.stringify([{ k: 'calc_break' }, { k: 'bp_plate' }]));
  });
  await unlock();
  await sleep(2000);   // 等 1 秒轮询
  ok('B0 六键差摩斯：档3 保底桥出现', await hasMsg('八月廿七——去检索框问它。'));
  ok('B0 六键差摩斯：最终卷入口未解锁', await page.evaluate(() => document.getElementById('arch-final-entry').style.display === 'none'));

  // B1 摩斯键 → 七键齐 → 入口解锁 + morse_break 消息；顺带收录 BP-B（档2 铭牌触发对象）
  await page.evaluate(() => {
    localStorage.setItem('cz_evt_morse_break', Date.now());
    localStorage.setItem('cz_evt_blueprint_001', Date.now());
  });
  await unlock();
  await sleep(2000);
  ok('B1 七键齐：morse_break 消息', await hasMsg('检索词与恩慈大典关联。记录已归档。'));
  ok('B1 七键齐：最终卷入口解锁', await page.evaluate(() => document.getElementById('arch-final-entry').style.display !== 'none'));

  // B2 档1/档2：恢复 → restored3 → morse_hint1；图纸放大 ×4 → morse_hint2
  await page.dblclick('.icon[data-win="tools"]');
  await page.click('#win-tools .tab-btn:has-text("文件恢复")');
  await page.click('#btn-restore');
  await page.waitForFunction(() => document.getElementById('restored3').classList.contains('show'), { timeout: 20000 });
  ok('B2 恢复3：档1 抄件背面', await hasMsg('抄件背面：『点划成字。』'));
  await page.click('#win-tools .tab-btn:has-text("建筑图")');
  await page.locator('.bp-card[onclick*="openBPZoom(\'001\')"]').click();
  await page.waitForSelector('#bp-zoom.show');
  for (let i = 0; i < 4; i++) await page.click('#bp-zoom .bp-bar button:has-text("＋")');
  await sleep(600);
  ok('B2 铭牌揭示：档2 短是点长是划', await hasMsg('背面还有一行：『短是点，长是划。』'));
  await page.click('#bp-zoom-close');

  // B3 警告 → 我拒绝（d1）→ 警告重弹
  await page.dblclick('.icon[data-win="archive"]');
  await page.click('#arch-final-entry');
  await page.waitForSelector('#final-veil.show');
  ok('B3 打开最终卷：警告可见', await page.locator('#fv-warn').isVisible());
  await page.click('#fv-warn .fv-reject');
  await sleep(400);
  ok('B3 拒绝：d1 反抗点', await page.evaluate(() => localStorage.getItem('cz_resist_d1') === '1' && localStorage.getItem('cz_resist') === '1'));
  ok('B3 拒绝：警告重弹', await page.locator('#fv-warn').isVisible());

  // B4 继续阅读 → 登记 + 时间解冻 + 二选一（第三选项隐藏）
  await page.click('#fv-warn .btn');
  await sleep(600);
  ok('B4 阅读：cz_evt_final_read 写入', await page.evaluate(() => !!localStorage.getItem('cz_evt_final_read')));
  ok('B4 阅读：正文 + 二选一可见', await page.locator('#fv-body').isVisible() && await page.locator('#fv-chooser').isVisible());
  ok('B4 阅读：time_sync 消息', await hasMsg('系统检测到名单变更。时间同步恢复。'));
  ok('B4 阅读：称呼切换为名单在册', await hasMsg('身份已核验。称呼：名单在册。'));
  const clk = await page.locator('#clock').textContent();
  ok('B4 阅读：时钟解冻为真实时间 (' + clk.trim() + ')', /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(clk.trim()) && clk.trim() !== '2026-08-11 03:00');
  ok('B4 二选一：第三选项隐藏（1 点）', await page.evaluate(() => document.getElementById('fv-third').style.display === 'none'));

  // B5 选 访客05 → 再想想（d2）→ resist_ready + 重选
  await page.click('.fv-opt:has-text("访客 05")');
  ok('B5 确认弹窗出现', await page.locator('#fv-confirm').isVisible());
  await page.click('#fv-confirm .fv-reject');
  await sleep(400);
  ok('B5 再想想：d2 反抗点', await page.evaluate(() => localStorage.getItem('cz_resist_d2') === '1' && localStorage.getItem('cz_resist') === '2'));
  ok('B5 再想想：resist_ready 消息', await hasMsg('第三份交接记录，还没人签收过。'));
  ok('B5 再想想：回到二选一', await page.locator('#fv-chooser').isVisible());

  // B6 选自己 → 确认 → 抹除过场
  await page.click('.fv-opt:has-text("访客 05")');
  await page.click('#fv-confirm .btn');
  await sleep(500);
  ok('B6 抹除过场：已登记归位', (await page.locator('#fv-end').textContent()).includes('你已登记在册。欢迎归位。'));
  await sleep(2200);
  ok('B6 抹除过场：缺失行 1', (await page.locator('#fv-end').textContent()).includes('备份中缺失：3 秒的记忆。'));
  ok('B6 抹除过场：cz_evt_choice_self + 次数', await page.evaluate(() => !!localStorage.getItem('cz_evt_choice_self') && localStorage.getItem('cz_erase_cnt') === '1'));
  await sleep(2600);
  ok('B6 抹除过场：重新开始按钮', await page.locator('#fv-end button:has-text("重新开始")').isVisible());

  // B7 重来（d3）→ 第三选项解锁
  await page.click('#fv-end button:has-text("重新开始")');
  await sleep(400);
  ok('B7 重来：d3 反抗点 + 选择状态清空', await page.evaluate(() => localStorage.getItem('cz_resist') === '3' && localStorage.getItem('cz_resist_d3') === '1' && !localStorage.getItem('cz_evt_choice_self')));
  await page.click('#arch-final-entry');
  await page.waitForSelector('#final-veil.show');
  await sleep(300);
  ok('B7 重开：跳过警告直进正文（已读保留）', await page.locator('#fv-body').isVisible() && !(await page.locator('#fv-warn').isVisible()));
  ok('B7 第三选项：我不签收可见（3 点）', await page.locator('#fv-third').isVisible());

  // B8 守正结局（先）
  await page.click('#fv-chooser .fv-opt:has-text("陈守正")');
  await page.click('#fv-confirm .btn');
  await sleep(500);
  ok('B8 守正结局：记录已更新', (await page.locator('#fv-end').textContent()).includes('记录已更新。新的名字在名册上。'));
  ok('B8 守正结局：cz_evt_choice_shouzheng', await page.evaluate(() => !!localStorage.getItem('cz_evt_choice_shouzheng')));
  await sleep(1600);
  ok('B8 守正结局：卷宗关闭', !(await page.locator('#final-veil').getAttribute('class') || '').includes('show'));

  // B9 好结局（第三选项）
  await page.click('#arch-final-entry');
  await page.waitForSelector('#final-veil.show');
  await sleep(300);
  await page.click('#fv-third');
  await sleep(200);
  await page.click('#fv-confirm .btn');
  await sleep(500);
  const ge = await page.locator('#fv-end').textContent();
  ok('B9 好结局：记录未更新', ge.includes('记录未更新。没有新的名字。'));
  ok('B9 好结局：河边点灯钩子', ge.includes('今天，没有人被写进名册。'));
  ok('B9 好结局：cz_evt_good_end', await page.evaluate(() => !!localStorage.getItem('cz_evt_good_end')));
  ok('B9 好结局：good_end 消息（称呼回归访客 05）', await hasMsg('档案写入完成。访客 05 已从名单移出。'));
  await sleep(2000);
  ok('B9 好结局：回到桌面按钮', await page.locator('#fv-end button:has-text("回到桌面")').isVisible());

  /* ================= Phase C：官网三态（新 context 隔离） ================= */
  console.log('【C 官网三态 + 检索反转】');

  // C1 好结局态：待核验 + 林远已找回 + 陈守正未登记
  const c1 = await browser.newContext();
  const p1 = await c1.newPage();
  await p1.goto(BASE + '/', { waitUntil: 'networkidle' });
  await p1.evaluate(() => { localStorage.setItem('cz_evt_good_end', Date.now()); localStorage.setItem('cz_resist', '3'); });
  await p1.reload({ waitUntil: 'networkidle' });
  await sleep(300);
  ok('C1 好结局：倒计时待核验', (await p1.locator('#cz-dict-days').textContent()).trim() === '—' && (await p1.locator('#cz-dict-label').textContent()).includes('日期待核验'));
  await p1.click('#main-nav a[data-page="search"]');
  await p1.fill('#archive-search', '林远');
  await p1.click('#archive-search-btn');
  ok('C1 好结局：林远已找回', (await p1.locator('#search-result').textContent()).includes('已找回——档案已补录。'));
  await p1.fill('#archive-search', '陈守正');
  await p1.click('#archive-search-btn');
  ok('C1 好结局：陈守正无已登记', !(await p1.locator('#search-result').textContent()).includes('已登记'));

  // C2 已读态：红色名册倒计时 + 林远已登记
  const c2 = await browser.newContext();
  const p2 = await c2.newPage();
  await p2.goto(BASE + '/', { waitUntil: 'networkidle' });
  await p2.evaluate(() => localStorage.setItem('cz_evt_final_read', Date.now()));
  await p2.reload({ waitUntil: 'networkidle' });
  await sleep(300);
  const dd = (await p2.locator('#cz-dict-days').textContent()).trim();
  ok('C2 已读：红色名册倒计时', /^\d+$/.test(dd) && (await p2.locator('#cz-dict-label').textContent()).includes('大典还有') && (await p2.locator('#cz-dict-tail').textContent()).includes('名册上写着你的名字'));
  await p2.click('#main-nav a[data-page="search"]');
  await p2.fill('#archive-search', '林远');
  await p2.click('#archive-search-btn');
  ok('C2 已读：林远已登记', (await p2.locator('#search-result').textContent()).includes('已登记'));

  // C3 反抗 2 点（无好结局）：待核验
  const c3 = await browser.newContext();
  const p3 = await c3.newPage();
  await p3.goto(BASE + '/', { waitUntil: 'networkidle' });
  await p3.evaluate(() => localStorage.setItem('cz_resist', '2'));
  await p3.reload({ waitUntil: 'networkidle' });
  await sleep(300);
  ok('C3 反抗 2 点：倒计时待核验', (await p3.locator('#cz-dict-days').textContent()).trim() === '—' && (await p3.locator('#cz-dict-label').textContent()).includes('日期待核验'));

  // C4 守正已登记检索
  const c4 = await browser.newContext();
  const p4 = await c4.newPage();
  await p4.goto(BASE + '/', { waitUntil: 'networkidle' });
  await p4.evaluate(() => localStorage.setItem('cz_evt_choice_shouzheng', Date.now()));
  await p4.reload({ waitUntil: 'networkidle' });
  await p4.click('#main-nav a[data-page="search"]');
  await p4.fill('#archive-search', '陈守正');
  await p4.click('#archive-search-btn');
  ok('C4 守正结局：陈守正已登记', (await p4.locator('#search-result').textContent()).includes('已登记'));

  // C5-C7 P2 实时追逐（宽容制）：仅被登记后推进；在线满 15 分钟 −1 天；离线不计；0 天兜底
  const mkP2 = async () => {
    const c = await browser.newContext();
    const p = await c.newPage();
    await p.goto(BASE + '/', { waitUntil: 'networkidle' });
    return { c, p };
  };
  // C5 在线推进：在线时长已 898s+页面存活几秒 → 跨 15 分钟线 → 5→4
  {
    const { c, p } = await mkP2();
    await p.evaluate(() => {
      localStorage.setItem('cz_evt_final_read', Date.now());
      localStorage.setItem('cz_dict_prog', JSON.stringify({ days: 5, online: 898000 }));
    });
    await p.reload({ waitUntil: 'networkidle' });
    await sleep(7500);   // 首跑建 lastTick + 5 秒轮询累计
    ok('C5 实时追逐：在线推进 −1 天（5→4）', (await p.locator('#cz-dict-days').textContent()).trim() === '4');
    await c.close();
  }
  // C6 离线不扣：页面重开（lastTick 重置）→ 离线时长不进累计
  {
    const { c, p } = await mkP2();
    await p.evaluate(() => {
      localStorage.setItem('cz_evt_final_read', Date.now());
      localStorage.setItem('cz_dict_prog', JSON.stringify({ days: 5, online: 0 }));
    });
    await p.reload({ waitUntil: 'networkidle' });
    await sleep(7500);
    ok('C6 宽容制：离线时长不计入（保持 5 天）', (await p.locator('#cz-dict-days').textContent()).trim() === '5');
    await c.close();
  }
  // C7 0 天兜底：大典日当天不再减少、无负数
  {
    const { c, p } = await mkP2();
    await p.evaluate(() => {
      localStorage.setItem('cz_evt_final_read', Date.now());
      localStorage.setItem('cz_dict_prog', JSON.stringify({ days: 0, online: 1800000 }));
    });
    await p.reload({ waitUntil: 'networkidle' });
    await sleep(7500);
    ok('C7 0 天兜底：不再减少（0）', (await p.locator('#cz-dict-days').textContent()).trim() === '0');
    await c.close();
  }
  // C8 未登记：不进实时追逐（prog 不初始化、数字静态）
  {
    const { c, p } = await mkP2();
    await p.evaluate(() => localStorage.setItem('cz_dict_prog', JSON.stringify({ days: 5, online: 1800000 })));
    await p.reload({ waitUntil: 'networkidle' });
    await sleep(7500);
    const dd8 = (await p.locator('#cz-dict-days').textContent()).trim();
    ok('C8 未登记：不读实时进度（静态天数 ' + dd8 + '）', /^\d+$/.test(dd8) && dd8 !== '5' && await p.evaluate(() => !!localStorage.getItem('cz_dict_prog')));
    await c.close();
  }

  await c1.close(); await c2.close(); await c3.close(); await c4.close();
  await browser.close();
  console.log(`\n===== v4 机制验证：${pass} 通过 / ${fail} 失败 =====`);
  process.exit(fail ? 2 : 0);
})().catch(e => { console.error('崩溃:', e.message); process.exit(3); });
