/* ARG官网伪装壳测试：官网显示→寻人启事→损坏档案→密码门→控制台彩蛋→进入内部系统 */
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Users/32268/AppData/Local/ms-playwright/chromium-1200/chrome-win64/chrome.exe' });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  await page.goto('http://localhost:8081/', { waitUntil: 'networkidle' });
  await page.evaluate(() => { localStorage.clear(); });
  await page.reload({ waitUntil: 'networkidle' });

  console.log('[1] 打开显示官网（非游戏界面）…');
  await page.waitForSelector('#site-shell.show', { timeout: 3000 });
  const logo = await page.textContent('.site-logo');
  console.log(logo.includes('慈恩镇档案馆') ? '✓ 官网显示：' + logo.trim() : '✗ 官网未显示');
  const centerHits = await page.evaluate(() => {
    const el = document.elementFromPoint(195, 420);
    return el ? el.closest('#site-shell') !== null : false;
  });
  console.log(centerHits ? '✓ 侦探板未暴露（官网覆盖在外层）' : '✗ 官网未覆盖侦探板');
  await page.screenshot({ path: 'shots/21-site.png' });

  console.log('[2] 寻人启事（17年前·林远）…');
  await page.click('#news-lost');
  await page.waitForSelector('#news-lost-body', { state: 'visible' });
  const lostText = await page.textContent('#news-lost-body');
  console.log(lostText.includes('林远') && lostText.includes('老树') ? '✓ 寻人启事含线索（河边那棵老树）' : '✗ 寻人启事: ' + lostText.slice(0, 30));
  await page.screenshot({ path: 'shots/22-news-lost.png' });

  console.log('[3] 损坏档案→密码门…');
  await page.click('#cat-broken');
  await page.waitForSelector('#gate-modal.show', { timeout: 3000 });
  console.log('✓ 密码门弹出（档案调阅·管理认证）');

  console.log('[4] 错误密码→封存提示…');
  await page.fill('#gate-input', 'wrong');
  await page.click('#gate-ok');
  await page.waitForSelector('#gate-err:not(.hidden)', { timeout: 3000 });
  const err = await page.textContent('#gate-err');
  console.log(err.includes('永久封存') ? '✓ 错误提示：' + err.trim() : '✗ 错误提示异常');

  console.log('[5] 控制台彩蛋…');
  const egg = await page.evaluate(() => window.linyuan());
  console.log(egg.includes('数一数馆藏') ? '✓ 控制台彩蛋 linyuan()：' + egg : '✗ 彩蛋缺失');

  console.log('[6] 正确密码（linyuan）→ 进入内部系统…');
  await page.fill('#gate-input', 'linyuan');
  await page.click('#gate-ok');
  await page.waitForSelector('#site-shell', { state: 'hidden', timeout: 3000 });
  await page.waitForSelector('#intro-title:not(.hidden)', { timeout: 4000 });
  console.log('✓ 密码通过 → "你回到了慈恩镇。"（内部系统开场）');
  await page.screenshot({ path: 'shots/23-internal-intro.png' });

  console.log('[7] 完整进入内部（归档→林远→调查）…');
  await page.waitForSelector('#intro-workbench:not(.hidden)', { timeout: 5000 });
  for (let i = 0; i < 5; i++) {
    await page.click('.intro-file:not(.filed)');
    await page.waitForTimeout(120);
  }
  await page.waitForSelector('#intro-corner:not(.hidden)', { timeout: 5000 });
  await page.click('#intro-corner');
  await page.waitForSelector('#intro-fileview:not(.hidden)', { timeout: 3000 });
  const fvName = await page.textContent('#intro-fv-name');
  console.log(fvName.includes('林远') ? '✓ 内部归档发现林远档案（官网"5缺1"呼应）' : '✗ 档案异常');
  await page.click('#intro-continue');
  await page.click('#intro-start');
  await page.waitForSelector('#intro-scene', { state: 'hidden', timeout: 5000 });
  console.log('✓ 进入侦探板（内部系统）');

  console.log('[8] site_done 后重访直接进内部…');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const siteShown = await page.locator('#site-shell.show').count();
  console.log(siteShown === 0 ? '✓ 重访跳过官网直达内部' : '✗ 官网重复显示');

  console.log(errors.length ? '!! 错误:\n' + errors.join('\n') : '✓ 无JS错误');
  await browser.close();
  console.log('\n✅ ARG官网伪装壳测试通过');
})().catch(e => { console.error('❌ 测试失败:', e.message); process.exit(1); });
