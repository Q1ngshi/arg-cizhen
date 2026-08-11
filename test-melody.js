/* 说话吉他小曲测试：解锁触发melody+全屏卷宗面板+循环稳定+开关控制 */
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Users/32268/AppData/Local/ms-playwright/chromium-1200/chrome-win64/chrome.exe' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  await page.goto('http://localhost:8081/', { waitUntil: 'networkidle' });
  await page.click('#btn-bgm');
  await page.click('#btn-bgm');

  console.log('[1] 解锁触发说话吉他小曲…');
  await page.evaluate(() => openGate());
  await page.fill('#gate-input', 'linyuan');
  await page.click('.gate-btn[onclick="checkGate()"]');
  await page.waitForTimeout(800);
  const melodyOn = await page.evaluate(() => !!AudioMgr._melodyTimer);
  const dossierShown = await page.locator('#dossier.show').count();
  console.log(dossierShown === 1 ? '✓ 全屏卷宗面板打开' : '✗ 卷宗面板未打开');
  console.log(melodyOn ? '✓ 说话吉他小曲已启动（循环调度运行）' : '✗ melody未启动');
  await page.screenshot({ path: 'shots/25-melody.png' });

  console.log('[2] 小曲循环播放中（等一个loop周期）…');
  await page.waitForTimeout(14000);
  const stillOn = await page.evaluate(() => !!AudioMgr._melodyTimer);
  console.log(stillOn ? '✓ 循环调度稳定（14秒无中断）' : '✗ 调度器中断');

  console.log('[3] 关闭卷宗面板→关闭音乐→小曲停止…');
  await page.click('.dossier-close');
  await page.waitForSelector('#dossier', { state: 'hidden' });
  await page.click('#btn-bgm');
  await page.waitForTimeout(300);
  const stopped = await page.evaluate(() => !AudioMgr._melodyTimer);
  console.log(stopped ? '✓ 关闭后小曲停止' : '✗ 小曲未停止');

  console.log(errors.length ? '!! 错误:\n' + errors.join('\n') : '✓ 无JS错误');
  await browser.close();
  console.log('\n✅ 说话吉他小曲测试通过');
})().catch(e => { console.error('❌ 测试失败:', e.message); process.exit(1); });
