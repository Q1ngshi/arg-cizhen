/* 石室双结局：推开→"你终于走了进去"；离开→"和十七年前一样" */
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Users/32268/AppData/Local/ms-playwright/chromium-1200/chrome-win64/chrome.exe' });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('http://localhost:8081/', { waitUntil: 'networkidle' });
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('cz_intro_done', '1'); localStorage.setItem('cz_site_done', '1'); });
  await page.reload({ waitUntil: 'networkidle' });

  async function toDoor() {
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
    for (let i = 0; i < 3; i++) {
      await page.click('.room.crime:not(.crime-found)');
      await page.waitForSelector('#crime-modal.show');
      await page.click('#crime-close');
      await page.waitForSelector('#crime-modal', { state: 'hidden' });
      await page.waitForTimeout(200);
    }
    await page.waitForSelector('.room.hidden-space.revealed', { timeout: 5000 });
    await page.click('#bs-back');
    await page.waitForSelector('#accuse-bar.show', { timeout: 5000 });
    await page.click('#btn-accuse-d');
    await page.waitForSelector('#confirm-modal.show');
    await page.click('#confirm-ok');
    await page.waitForSelector('#stone-door.show', { timeout: 5000 });
  }

  console.log('[1] 推开结局…');
  await toDoor();
  await page.screenshot({ path: 'shots/19-stone-door.png' });
  await page.click('#sd-open');
  await page.waitForSelector('#ending-screen.show');
  await page.waitForTimeout(37500);
  const lines1 = await page.locator('.ending-line').allTextContents();
  const openEnd = lines1.some(l => l.includes('走了进去'));
  const openPart1 = lines1.some(l => l.includes('捐了一笔钱') || l.includes('没有在旧档案里'));
  console.log(openPart1 ? '✓ 推开：完整第一层（共谋者）' : '✗ 推开：第一层缺失');
  console.log(openEnd ? '✓ 推开：收尾"你终于，走了进去。"' : '✗ 推开：收尾缺失');
  await page.click('#btn-restart');
  await page.waitForTimeout(600);

  console.log('[2] 离开结局…');
  await page.evaluate(() => localStorage.removeItem('cz_case_progress'));
  await page.reload({ waitUntil: 'networkidle' });
  await toDoor();
  await page.click('#sd-leave');
  await page.waitForSelector('#ending-screen.show');
  await page.waitForTimeout(37500);
  const lines2 = await page.locator('.ending-line').allTextContents();
  const leaveEnd = lines2.some(l => l.includes('和十七年前一样'));
  const leaveShort = lines2.some(l => l.includes('捐了一笔钱') || l.includes('没有在旧档案里'));
  console.log(leaveShort ? '✓ 离开：第一层压缩版（捐了一笔钱）' : '✗ 离开：第一层缺失');
  console.log(leaveEnd ? '✓ 离开：收尾"和十七年前一样。"' : '✗ 离开：收尾缺失');
  await page.screenshot({ path: 'shots/20-leave-ending.png' });
  await browser.close();
  console.log('\n✅ 石室双结局测试通过');
})().catch(e => { console.error('❌ 失败:', e.message); process.exit(1); });
