/* 重玩彩蛋：第2次通关追加"回到这里"行（直接调用playEnding验证） */
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Users/32268/AppData/Local/ms-playwright/chromium-1200/chrome-win64/chrome.exe' });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('http://localhost:8081/', { waitUntil: 'networkidle' });
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('cz_intro_done', '1'); localStorage.setItem('cz_site_done', '1'); });
  await page.reload({ waitUntil: 'networkidle' });
  // 第1次通关
  await page.evaluate(() => { localStorage.removeItem('cz_case_progress'); playEnding('D'); });
  await page.waitForTimeout(600);
  const p1 = await page.evaluate(() => localStorage.getItem('cz_case_plays'));
  console.log(p1 === '1' ? '✓ 第1次通关 plays=1' : '✗ plays: ' + p1);
  // 第2次通关（清空ending-lines后重新播放）
  await page.evaluate(() => { localStorage.removeItem('cz_case_progress'); });
  await page.evaluate(() => { document.getElementById('ending-lines').innerHTML = ''; playEnding('E'); });
  await page.waitForTimeout(600);
  const p2 = await page.evaluate(() => localStorage.getItem('cz_case_plays'));
  console.log(p2 === '2' ? '✓ 第2次通关 plays=2' : '✗ plays: ' + p2);
  await page.waitForTimeout(38500); // 等彩蛋行出现（delay 37000）
  const lines = await page.locator('.ending-line').allTextContents();
  const egg = lines.find(l => l.includes('第 2 次'));
  console.log(egg ? '✓ 彩蛋行: ' + egg.trim() : '✗ 彩蛋缺失');
  await browser.close();
  console.log('✅ 重玩彩蛋测试通过');
})().catch(e => { console.error('❌ 失败:', e.message); process.exit(1); });
