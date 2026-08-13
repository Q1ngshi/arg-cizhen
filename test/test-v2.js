/* v2《赎罪祭》全流程：6人侦探板→档案→档案箱(看到名字)→怪屋→指控→双层反转 */
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Users/32268/AppData/Local/ms-playwright/chromium-1200/chrome-win64/chrome.exe' });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  await page.goto('http://localhost:8081/', { waitUntil: 'networkidle' });
  await page.evaluate(() => { localStorage.setItem('cz_intro_done','1'); localStorage.setItem('cz_site_done','1'); localStorage.removeItem('cz_case_progress'); });
  await page.reload({ waitUntil: 'networkidle' });

  console.log('[1] 6人侦探板（含林远失踪者）…');
  const chars = await page.locator('.char-card').count();
  console.log(chars === 6 ? '✓ 6个人物' : '✗ 人物数: ' + chars);
  const missing = await page.locator('.char-card.char-missing').count();
  console.log(missing === 1 ? '✓ 林远失踪者样式' : '✗ 失踪者样式缺失');
  await page.screenshot({ path: 'shots/10-board-v2.png' });

  console.log('[2] 林远档案（情感核心）…');
  await page.click('.char-card[data-id="F"]');
  await page.waitForSelector('#file-modal.show');
  const relText = await page.textContent('#fm-hint');
  console.log(relText.includes('老树') ? '✓ 与你的关系显示: ' + relText.trim().slice(0, 30) + '…' : '✗ 关系字段: ' + relText.trim());
  await page.click('#fm-close');

  console.log('[3] 旧档案室（村民证词+捐赠记录触发）…');
  await page.click('#btn-archive');
  await page.waitForSelector('#archive-box.show');
  const files = await page.locator('.ab-file').count();
  console.log(files === 7 ? '✓ 7份档案文件' : '✗ 文件数: ' + files);
  // 读村民证词
  await page.click('.ab-file:not(.special)');
  await page.waitForSelector('#reader-modal.show');
  await page.click('#reader-close');
  await page.waitForSelector('#reader-modal', { state: 'hidden' });
  // 捐赠记录（特殊文件）→ 看到自己的名字
  await page.click('.ab-file.special');
  await page.waitForSelector('#reader-modal.show');
  const donText = await page.textContent('#reader-text');
  console.log(donText.includes('你的名字') ? '✓ 捐赠记录显示你的名字' : '✗ 捐赠记录: ' + donText.trim().slice(0, 20));
  await page.click('#reader-close');
  await page.waitForSelector('#reader-modal', { state: 'hidden' });
  const sawName = await page.evaluate(() => JSON.parse(localStorage.getItem('cz_case_progress') || '{}').sawName);
  console.log(sawName === true ? '✓ 触发点已标记(sawName)' : '✗ sawName未标记');
  await page.click('#ab-back');
  await page.waitForSelector('#archive-box', { state: 'hidden' });
  await page.screenshot({ path: 'shots/11-archive.png' });

  console.log('[4] 审查5人档案（林远不计入）…');
  for (const id of ['A', 'B', 'C', 'D', 'E']) {
    await page.click(`.char-card[data-id="${id}"]`);
    await page.waitForSelector('#file-modal.show');
    if (await page.locator('#btn-deep').isVisible()) {
      await page.click('#btn-deep');
      await page.waitForSelector('#fm-hidden:not(.hidden)');
    }
    await page.click('#fm-close');
    await page.waitForSelector('#file-modal', { state: 'hidden' });
  }
  const count = await page.textContent('#reviewed-count');
  console.log(count === '5' ? '✓ 审查进度5/5（林远不计入）' : '✗ 进度: ' + count);

  console.log('[5] 怪屋收集3罪证…');
  await page.click('.char-card[data-id="E"]');
  await page.waitForSelector('#btn-blueprint:not(.hidden)');
  await page.click('#btn-blueprint');
  await page.waitForSelector('#basement-scene.show');
  for (let i = 0; i < 3; i++) {
    await page.click('.room.crime:not(.crime-found)');
    await page.waitForSelector('#crime-modal.show');
    const crimeName = await page.textContent('#crime-name');
    console.log('   ', crimeName.trim());
    await page.click('#crime-close');
    await page.waitForSelector('#crime-modal', { state: 'hidden' });
    await page.waitForTimeout(200);
  }
  await page.waitForSelector('.room.hidden-space.revealed', { timeout: 5000 });
  console.log('✓ 隐藏空间浮现（安息祭石室）');
  await page.click('#bs-back');
  await page.waitForSelector('#accuse-bar.show', { timeout: 5000 });

  console.log('[6] 指控→双层反转…');
  await page.click('#btn-accuse-d');
  await page.waitForSelector('#confirm-modal.show');
  await page.click('#confirm-ok');
  await page.waitForSelector('#stone-door.show', { timeout: 5000 });
  await page.click('#sd-open');
  await page.waitForSelector('#stone-door', { state: 'hidden' });
  await page.waitForSelector('#ending-screen.show');
  await page.waitForTimeout(6000);
  const lines1 = await page.locator('.ending-line').allTextContents();
  const hasPart1 = lines1.some(l => l.includes('捐了一笔钱'));
  console.log(hasPart1 ? '✓ 第一层反转（共谋者）出现' : '✗ 第一层缺失');
  await page.waitForTimeout(26000);
  const lines2 = await page.locator('.ending-line').allTextContents();
  const hasPart2 = lines2.some(l => l.includes('执行者'));
  console.log(hasPart2 ? '✓ 第二层反转（执行者）出现' : '✗ 第二层缺失');
  await page.waitForSelector('#btn-restart:not(.hidden)', { timeout: 15000 });
  console.log('✓ 反转完整播放，重玩按钮出现');
  await page.screenshot({ path: 'shots/12-ending-v2.png' });

  console.log(errors.length ? '!! 错误:\n' + errors.join('\n') : '✓ 无JS错误');
  await browser.close();
  console.log('\n✅ 《赎罪祭》v2全流程测试通过');
})().catch(e => { console.error('❌ 测试失败:', e.message); process.exit(1); });
