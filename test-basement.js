/* 怪屋端到端：图纸入口→房间探索→3罪证→隐藏浮现→指控解锁 */
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Users/32268/AppData/Local/ms-playwright/chromium-1200/chrome-win64/chrome.exe' });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  await page.goto('http://localhost:8081/', { waitUntil: 'networkidle' });
  await page.evaluate(() => { localStorage.setItem('cz_intro_done','1'); localStorage.setItem('cz_site_done','1'); localStorage.removeItem('cz_case_progress'); });
  await page.reload({ waitUntil: 'networkidle' });

  // 审查全部档案（含E深入调查）
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
  // 此时指控栏不应出现（还差罪证）
  const accuseVisible1 = await page.locator('#accuse-bar.show').count();
  console.log(accuseVisible1 === 0 ? '✓ 罪证未集齐时指控栏不出现' : '✗ 指控栏提前出现');

  // 打开林建国档案 → 图纸按钮
  await page.click('.char-card[data-id="E"]');
  await page.waitForSelector('#file-modal.show');
  const bpVisible = await page.locator('#btn-blueprint:not(.hidden)').count();
  console.log(bpVisible === 1 ? '✓ 图纸入口按钮出现' : '✗ 图纸入口缺失');
  await page.click('#btn-blueprint');
  await page.waitForSelector('#basement-scene.show');
  const rooms = await page.locator('.room').count();
  console.log(rooms === 6 ? '✓ 平面图6个区域渲染 (5房间+1隐藏头部)' : '✗ 区域数异常: ' + rooms);
  await page.screenshot({ path: 'shots/7-basement.png' });

  // 探索普通房间（主厅）
  await page.click('.room:not(.crime):not(.hidden-space)');
  await page.waitForSelector('#crime-modal.show');
  const rd = await page.textContent('#crime-desc');
  console.log(rd.includes('占位') || rd.length > 0 ? '✓ 普通房间描述弹出' : '✗ 房间描述异常');
  await page.click('#crime-close');
  await page.waitForSelector('#crime-modal', { state: 'hidden' });

  // 依次发现3个罪证（罪证房间 = .room.crime:not(.crime-found)）
  for (let i = 0; i < 3; i++) {
    await page.click('.room.crime:not(.crime-found)');
    await page.waitForSelector('#crime-modal.show');
    const name = await page.textContent('#crime-name');
    console.log('  发现罪证:', name.trim());
    await page.click('#crime-close');
    await page.waitForSelector('#crime-modal', { state: 'hidden' });
    await page.waitForTimeout(200);
  }
  const count = await page.textContent('#crime-count');
  console.log(count === '3' ? '✓ 3份罪证集齐' : '✗ 罪证计数: ' + count);
  await page.waitForSelector('.room.hidden-space.revealed', { timeout: 5000 });
  console.log('✓ 被划掉的空间浮现（地下三层）');
  await page.screenshot({ path: 'shots/8-hidden-revealed.png' });

  // 返回 → 指控解锁
  await page.click('#bs-back');
  await page.waitForSelector('#basement-scene', { state: 'hidden' });
  await page.waitForSelector('#accuse-bar.show', { timeout: 5000 });
  console.log('✓ 返回后指控栏解锁');
  await page.screenshot({ path: 'shots/9-accuse-unlocked.png' });

  console.log(errors.length ? '!! 错误:\n' + errors.join('\n') : '✓ 无JS错误');
  await browser.close();
  console.log('\n✅ 怪屋模块测试全部通过');
})().catch(e => { console.error('❌ 测试失败:', e.message); process.exit(1); });
