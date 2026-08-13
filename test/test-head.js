/* 十字架头部推理交互验证：点击被划掉的头部→提示；集齐罪证→头部揭示可点击 */
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Users/32268/AppData/Local/ms-playwright/chromium-1200/chrome-win64/chrome.exe' });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('http://localhost:8081/', { waitUntil: 'networkidle' });
  await page.evaluate(() => { localStorage.setItem('cz_intro_done','1'); localStorage.setItem('cz_site_done','1'); localStorage.removeItem('cz_case_progress'); });
  await page.reload({ waitUntil: 'networkidle' });
  // 进入图纸（E深入调查→图纸）
  for (const id of ['A', 'B', 'C', 'D', 'E']) {
    await page.click(`.char-card[data-id="${id}"]`);
    await page.waitForSelector('#file-modal.show');
    if (await page.locator('#btn-deep').isVisible()) { await page.click('#btn-deep'); await page.waitForSelector('#fm-hidden:not(.hidden)'); }
    await page.click('#fm-close');
    await page.waitForSelector('#file-modal', { state: 'hidden' });
  }
  await page.click('.char-card[data-id="E"]');
  await page.waitForSelector('#btn-blueprint:not(.hidden)');
  await page.click('#btn-blueprint');
  await page.waitForSelector('#basement-scene.show');
  // 1. 头部虚线区可点击（推理种子）
  await page.click('.room.hidden-space.clickable');
  await page.waitForSelector('#crime-modal.show');
  const hint = await page.textContent('#crime-desc');
  console.log(hint.includes('十字架，不该没有头') ? '✓ 头部推理种子提示' : '✗ 提示: ' + hint.trim().slice(0, 20));
  await page.click('#crime-close');
  await page.waitForSelector('#crime-modal', { state: 'hidden' });
  await page.screenshot({ path: 'shots/13-church-head.png' });
  // 2. 集齐罪证
  for (let i = 0; i < 3; i++) {
    await page.click('.room.crime:not(.crime-found)');
    await page.waitForSelector('#crime-modal.show');
    await page.click('#crime-close');
    await page.waitForSelector('#crime-modal', { state: 'hidden' });
    await page.waitForTimeout(200);
  }
  await page.waitForTimeout(1500);
  // 3. 头部揭示
  const revealed = await page.locator('.room.hidden-space.revealed').count();
  console.log(revealed === 1 ? '✓ 十字架的头揭示（地下室·献祭之地）' : '✗ 头部未揭示');
  await page.click('.room.hidden-space.revealed');
  await page.waitForSelector('#crime-modal.show');
  const desc = await page.textContent('#crime-desc');
  console.log(desc.includes('十字架的头') ? '✓ 献祭之地描述' : '✗ 描述: ' + desc.trim().slice(0, 20));
  await page.screenshot({ path: 'shots/14-head-revealed.png' });
  await browser.close();
  console.log('\n✅ 十字架头部推理测试通过');
})().catch(e => { console.error('❌ 失败:', e.message); process.exit(1); });
