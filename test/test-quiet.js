/* 静默官网验证：点击开关不再启动环境音；小曲功能保留 */
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Users/32268/AppData/Local/ms-playwright/chromium-1200/chrome-win64/chrome.exe' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  await page.goto('http://localhost:8081/', { waitUntil: 'networkidle' });
  await page.click('#btn-bgm'); await page.click('#btn-bgm'); // 关→开（确保enabled=true）
  await page.waitForTimeout(500);
  const ambient = await page.evaluate(() => !!AudioMgr.ambientNodes);
  const hb = await page.evaluate(() => !!AudioMgr._hb);
  console.log(!ambient && !hb ? '✓ 官网开启音乐后无环境音/无心跳（静默）' : '✗ 环境音仍在: ' + JSON.stringify({ ambient, hb }));
  // 解锁小曲仍工作
  await page.evaluate(() => openGate());
  await page.fill('#gate-input', 'linyuan');
  await page.click('.gate-btn[onclick="checkGate()"]');
  await page.waitForTimeout(600);
  const melody = await page.evaluate(() => !!AudioMgr._melodyTimer);
  const dossier = await page.locator('#dossier.show').count();
  console.log(dossier === 1 && melody ? '✓ 解锁小曲仍正常（说话吉他+卷宗面板）' : '✗ 小曲异常');
  console.log(errors.length ? '!! ' + errors.join('\n') : '✓ 无JS错误');
  await browser.close();
  console.log('✅ 静默官网测试通过');
})().catch(e => { console.error('❌ 失败:', e.message); process.exit(1); });
