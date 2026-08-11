/* hover聚焦验证：hover人物A → 其连线点亮，其余隐退 */
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Users/32268/AppData/Local/ms-playwright/chromium-1200/chrome-win64/chrome.exe' });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('http://localhost:8081/', { waitUntil: 'networkidle' });
  await page.evaluate(() => { localStorage.setItem('cz_intro_done','1'); localStorage.setItem('cz_site_done','1'); });
  await page.reload({ waitUntil: 'networkidle' });
  await page.hover('.char-card[data-id="A"]');
  await page.waitForTimeout(300);
  const focusing = await page.evaluate(() => document.getElementById('board-canvas').classList.contains('focusing'));
  const aFocused = await page.evaluate(() => document.querySelectorAll('.rel-line.focused').length);
  const aRel = await page.evaluate(() => document.querySelectorAll('.rel-line[data-rel*="A"]').length);
  console.log(focusing ? '✓ 聚焦模式激活' : '✗ 聚焦未激活');
  console.log(aFocused === aRel ? `✓ A的关系线全部点亮 (${aFocused}/${aRel})` : `✗ 点亮数不对 (${aFocused}/${aRel})`);
  await page.screenshot({ path: 'shots/6-focus-A.png' });
  await page.mouse.move(10, 400); // 移开
  await page.waitForTimeout(300);
  const unfocus = await page.evaluate(() => !document.getElementById('board-canvas').classList.contains('focusing'));
  console.log(unfocus ? '✓ 移开后聚焦解除' : '✗ 聚焦未解除');
  await browser.close();
})().catch(e => { console.error('❌ 失败:', e.message); process.exit(1); });
