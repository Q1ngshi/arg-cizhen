const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto('http://127.0.0.1:8081/desktop.html');
  // 模拟管理员解锁
  await page.evaluate(() => {
    localStorage.setItem('cz_admin_ok', '1');
    sessionStorage.setItem('cz_admin_unlock', '1');
    if (typeof unlock === 'function') unlock();
  });
  await page.waitForTimeout(800);
  await page.evaluate(() => openWin('msg'));
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'temp/shot-msg-1.png' });
  // 切到王执事会话
  await page.click('#chat-list .chat-item[data-chat="wang"]');
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'temp/shot-msg-2.png' });
  await browser.close();
  console.log('OK');
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
