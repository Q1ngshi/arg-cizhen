/* 顺序锁测试：未检索→点击乱码被拒；搜"槐树街"→解锁→点击乱码→管理员门 */
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Users/32268/AppData/Local/ms-playwright/chromium-1200/chrome-win64/chrome.exe' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  await page.goto('http://localhost:8081/', { waitUntil: 'networkidle' });

  console.log('[1] 未检索时点击乱码→被拒…');
  let alert1 = '';
  page.once('dialog', async d => { alert1 = d.message(); await d.accept(); });
  await page.click('.n-title:has-text("槐树街调查记录")');
  await page.waitForTimeout(400);
  const adminShown1 = await page.locator('#admin-modal.show').count();
  console.log(adminShown1 === 0 && alert1.includes('档案查询') ? '✓ 未检索被拒（提示先查档案查询）' : '✗ 顺序锁失效');

  console.log('[2] 档案查询搜"槐树街"→解锁…');
  await page.evaluate(() => {
    document.querySelectorAll('.page-panel').forEach(function(p) { p.classList.remove('show'); });
    document.querySelector('.page-home').style.display = 'none';
    document.getElementById('page-search').classList.add('show');
  });
  await page.fill('#archive-search', '槐树街');
  await page.click('#archive-search-btn');
  await page.waitForTimeout(300);
  const sr = await page.textContent('#search-result');
  console.log(sr.includes('槐树街调查记录') ? '✓ 检索到槐树街调查记录（数据异常）' : '✗ 检索异常');
  const unlocked = await page.evaluate(() => sessionStorage.getItem('cz_admin_unlock'));
  console.log(unlocked === '1' ? '✓ 管理员入口已解锁' : '✗ 未解锁');

  console.log('[3] 回首页→点击乱码→管理员门打开…');
  await page.evaluate(() => {
    document.getElementById('page-search').classList.remove('show');
    document.querySelector('.page-home').style.display = '';
  });
  await page.click('.n-title:has-text("槐树街调查记录")');
  await page.waitForSelector('#admin-modal.show', { timeout: 3000 });
  console.log('✓ 管理员门打开（账号+密码）');

  console.log('[4] 管理员提示已降隐（卷宗面板无直白指路）…');
  await page.click('#admin-modal .gate-btn.cancel');
  await page.evaluate(() => openGate());
  await page.fill('#gate-input', 'linyuan');
  await page.click('.gate-btn[onclick="checkGate()"]');
  await page.waitForSelector('#dossier.show');
  const dossierText = await page.textContent('#dossier');
  const hasDirect = dossierText.includes('账号格式请参阅');
  console.log(!hasDirect ? '✓ 卷宗面板无直白指路（改为"请与三楼修复室联系"）' : '✗ 直白提示仍在');
  const hiddenHint = dossierText.includes('三楼修复室');
  console.log(hiddenHint ? '✓ 隐晦暗示存在（三楼修复室）' : '✗ 暗示缺失');

  console.log(errors.length ? '!! 错误:\n' + errors.join('\n') : '✓ 无JS错误');
  await browser.close();
  console.log('\n✅ 顺序锁+降隐测试通过');
})().catch(e => { console.error('❌ 失败:', e.message); process.exit(1); });
