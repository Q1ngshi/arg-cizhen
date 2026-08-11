/* 状态持久化：审查1份→刷新→进度保留→重置后清除 */
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Users/32268/AppData/Local/ms-playwright/chromium-1200/chrome-win64/chrome.exe' });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('http://localhost:8081/', { waitUntil: 'networkidle' });
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('cz_intro_done','1'); localStorage.setItem('cz_site_done','1'); });
  await page.reload({ waitUntil: 'networkidle' });
  // 审查A
  await page.click('.char-card[data-id="A"]');
  await page.waitForSelector('#file-modal.show');
  await page.click('#btn-deep');
  await page.waitForSelector('#fm-hidden:not(.hidden)');
  await page.click('#fm-close');
  // 刷新
  await page.reload({ waitUntil: 'networkidle' });
  const count = await page.textContent('#reviewed-count');
  const dots = await page.locator('.char-card .char-avatar + .char-name + div').count();
  console.log(count === '1' ? '✓ 刷新后进度保留 (1/5): ' + count : '✗ 刷新后进度丢失: ' + count);
  // 清状态
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('cz_intro_done','1'); localStorage.setItem('cz_site_done','1'); });
  await page.reload({ waitUntil: 'networkidle' });
  const count2 = await page.textContent('#reviewed-count');
  console.log(count2 === '0' ? '✓ 重置后进度清零' : '✗ 重置失败: ' + count2);
  await browser.close();
})().catch(e => { console.error('❌ 失败:', e.message); process.exit(1); });
