/* 联系人会话 UI 快速验证：列表渲染 / 切换过滤 / 未读红点 / 任务卡归属 */
const { chromium } = require('playwright');
const BASE = 'http://localhost:8081';
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Users/32268/AppData/Local/ms-playwright/chromium-1200/chrome-win64/chrome.exe' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  let fail = 0;
  const check = (name, ok) => { console.log((ok ? '✓ ' : '✗ ') + name); if (!ok) fail++; };

  await page.goto(BASE + '/desktop.html', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.clear(); sessionStorage.clear();
    localStorage.setItem('cz_admin_ok', '1');   // 模拟官网管理员认证完成（解锁前提）
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.click('#unlock-veil', { timeout: 3000 }).catch(() => { });
  await page.waitForFunction(() => document.querySelectorAll('.icon.locked').length === 0, { timeout: 15000 });

  // 1. 打开信息窗口
  await page.dblclick('.icon[data-win="msg"]');
  await page.waitForSelector('#win-msg.open');
  await page.waitForTimeout(400);

  // 2. 联系人列表 3 项
  check('联系人列表 3 项（值班员/王执事/系统）',
    await page.locator('#chat-list .chat-item').count() === 3);

  // 3. 默认激活值班员会话，可见消息全部归它
  check('默认激活值班员',
    await page.locator('#chat-list .chat-item.active[data-chat="person"]').count() === 1);
  check('值班员会话 2 条可见（开场 + 解锁回执）',
    await page.evaluate(() => {
      const v = document.querySelectorAll('#msg-list .msg-item:not([style*="display: none"])');
      return v.length === 2 && [...v].every(m => m.getAttribute('data-chat') === 'person');
    }));

  // 4. 王执事会话：3 条旧留言，任务卡隐藏
  await page.click('#chat-list .chat-item[data-chat="wang"]');
  await page.waitForTimeout(100);
  check('王执事会话 3 条可见',
    await page.evaluate(() => {
      const v = document.querySelectorAll('#msg-list .msg-item:not([style*="display: none"])');
      return v.length === 3 && [...v].every(m => m.getAttribute('data-chat') === 'wang');
    }));
  check('切换后任务卡隐藏',
    await page.evaluate(() => getComputedStyle(document.getElementById('task-card')).display === 'none'));

  // 5. 系统会话：静态 2 条 + site_loaded + admin_ok（解锁后实时消息也归系统）
  await page.click('#chat-list .chat-item[data-chat="sys"]');
  await page.waitForTimeout(100);
  check('系统会话消息全部归属系统（≥2 条）',
    await page.evaluate(() => {
      const v = document.querySelectorAll('#msg-list .msg-item:not([style*="display: none"])');
      return v.length >= 2 && [...v].every(m => m.getAttribute('data-chat') === 'sys');
    }));

  // 6. 实时消息路由：切回值班员后 fireIncoming → 红点出现、预览更新
  await page.click('#chat-list .chat-item[data-chat="person"]');
  await page.evaluate(() => { window.openChat('sys'); fireIncoming('测试消息：值班员来新信了。'); });
  await page.waitForTimeout(300);
  check('值班员会话未读红点 = 1',
    await page.evaluate(() => document.getElementById('cb-person').textContent === '1' &&
      !document.getElementById('cb-person').classList.contains('hidden')));
  check('预览更新为值班员最后消息',
    await page.evaluate(() => document.getElementById('prev-person').textContent.indexOf('值班员来新信了') !== -1));
  check('切回值班员后红点清零',
    await page.evaluate(() => { openChat('person'); return document.getElementById('cb-person').classList.contains('hidden'); }));

  // 7. 新消息进入激活会话不产生红点
  await page.evaluate(() => fireIncoming('还在值班员会话里。'));
  await page.waitForTimeout(200);
  check('激活会话新消息无红点',
    await page.evaluate(() => document.getElementById('cb-person').classList.contains('hidden')));

  await browser.close();
  console.log(fail ? `\n❌ ${fail} 项未通过` : '\n✅ 联系人会话 UI 验证通过');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('❌ 失败:', e.message); process.exit(1); });
