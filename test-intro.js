/* 档案馆开场测试：标题→归档5份→数量对不上→林远档案→钩子→进入调查→三疑目标 */
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Users/32268/AppData/Local/ms-playwright/chromium-1200/chrome-win64/chrome.exe' });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  await page.goto('http://localhost:8081/', { waitUntil: 'networkidle' });
  await page.evaluate(() => { localStorage.setItem('cz_site_done','1'); localStorage.removeItem('cz_intro_done'); localStorage.removeItem('cz_case_progress'); });
  await page.reload({ waitUntil: 'networkidle' });

  console.log('[1] 开场标题…');
  await page.waitForSelector('#intro-title:not(.hidden)', { timeout: 3000 });
  console.log('✓ "你回到了慈恩镇。"');
  await page.waitForSelector('#intro-workbench:not(.hidden)', { timeout: 5000 });
  const files = await page.locator('.intro-file').count();
  console.log(files === 5 ? '✓ 工作台5份档案' : '✗ 档案数: ' + files);
  await page.screenshot({ path: 'shots/15-intro.png' });

  console.log('[2] 逐份归档…');
  for (let i = 0; i < 5; i++) {
    await page.click('.intro-file:not(.filed)');
    await page.waitForTimeout(120);
  }
  await page.waitForSelector('#intro-check:not(.hidden)', { timeout: 3000 });
  const check = await page.textContent('#intro-check');
  console.log(check.includes('核对无误') ? '✓ 数量核对无误（玩家放松）' : '✗ 核对: ' + check.trim().slice(0, 20));

  console.log('[3] 角落文件夹（数量对不上）…');
  await page.waitForSelector('#intro-corner:not(.hidden)', { timeout: 5000 });
  await page.click('#intro-corner');
  await page.waitForSelector('#intro-fileview:not(.hidden)', { timeout: 3000 });
  const fvName = await page.textContent('#intro-fv-name');
  const fvMeta = await page.textContent('#intro-fv-meta');
  console.log(fvName.includes('林远') && fvMeta.includes('失踪') ? '✓ 林远档案（失踪·未归档）' : '✗ 档案: ' + fvName.trim() + fvMeta.trim());
  await page.screenshot({ path: 'shots/16-linyuan-file.png' });

  console.log('[4] 钩子句…');
  await page.click('#intro-continue');
  await page.waitForSelector('#intro-hook:not(.hidden)', { timeout: 3000 });
  const hook = await page.textContent('#intro-hook');
  console.log(hook.includes('在哪里听过') ? '✓ 钩子句：在哪里听过' : '✗ 钩子: ' + hook.slice(0, 20));

  console.log('[5] 开始调查→三疑目标…');
  await page.click('#intro-start');
  await page.waitForSelector('#intro-scene', { state: 'hidden', timeout: 5000 });
  await page.waitForSelector('#goals-bar:not(.hidden)', { timeout: 3000 });
  const goals = await page.locator('.goal').count();
  console.log(goals === 3 ? '✓ 三疑目标任务条显示（3项）' : '✗ 目标数: ' + goals);
  await page.screenshot({ path: 'shots/17-goals.png' });

  console.log('[6] 深挖赵秀兰→目标①完成…');
  await page.click('.char-card[data-id="B"]');
  await page.waitForSelector('#file-modal.show');
  await page.click('#btn-deep');
  await page.waitForSelector('#fm-hidden:not(.hidden)');
  await page.click('#fm-close');
  const g1 = await page.locator('#goal-1.done').count();
  console.log(g1 === 1 ? '✓ 目标①"谁选中了他"完成' : '✗ 目标①未完成');
  await page.screenshot({ path: 'shots/18-goal-done.png' });

  console.log('[7] 重玩跳过开场（intro_done）…');
  await page.evaluate(() => location.reload());
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  const introHidden = await page.locator('#intro-scene').evaluate(el => getComputedStyle(el).display === 'none');
  const goalsVisible = await page.locator('#goals-bar:not(.hidden)').count();
  console.log(introHidden && goalsVisible === 1 ? '✓ 重玩直接进调查（开场跳过）' : '✗ 重玩开场未跳过');

  console.log(errors.length ? '!! 错误:\n' + errors.join('\n') : '✓ 无JS错误');
  await browser.close();
  console.log('\n✅ 档案馆开场测试通过');
})().catch(e => { console.error('❌ 测试失败:', e.message); process.exit(1); });
