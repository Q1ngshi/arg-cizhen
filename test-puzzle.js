/* 解密链测试：学员名单埋"林远（旁听）"→搜"林远"特殊结果→密码门文案→linyuan解锁→卷宗→管理员 */
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Users/32268/AppData/Local/ms-playwright/chromium-1200/chrome-win64/chrome.exe' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  await page.goto('http://localhost:8081/', { waitUntil: 'networkidle' });

  console.log('[1] 通知公告：学员名单埋"林远（旁听）"…');
  await page.click('.news-tab[data-tab="tab2"]');
  await page.waitForSelector('#tab2.show');
  await page.click('#tab2 .news-item:has-text("档案修复技术培训班")');
  await page.waitForTimeout(300);
  const bodyText = await page.textContent('#tab2 .news-body');
  console.log(bodyText.includes('林远（旁听）') ? '✓ 名单含"林远（旁听）"（细思极恐点①）' : '✗ 名单缺失');

  console.log('[2] 馆藏动态：失踪人口补录公告…');
  await page.click('.news-tab[data-tab="tab3"]');
  await page.waitForSelector('#tab3.show');
  await page.click('#tab3 .news-item:has-text("失踪人口档案补录")');
  await page.waitForTimeout(300);
  const b2 = await page.textContent('#tab3 .news-body');
  console.log(b2.includes('编号：05') ? '✓ 补录公告（编号05互指）' : '✗ 补录公告缺失');

  console.log('[3] 档案查询：搜"林远"→特殊结果…');
  await page.evaluate(() => {
    document.querySelectorAll('.page-panel').forEach(function(p) { p.classList.remove('show'); });
    document.querySelector('.page-home').style.display = 'none';
    document.getElementById('page-search').classList.add('show');
  });
  await page.fill('#archive-search', '林远');
  await page.click('#archive-search-btn');
  await page.waitForTimeout(300);
  const sr = await page.textContent('#search-result');
  console.log(sr.includes('未找到相关档案') && sr.includes('检索记录已存档') ? '✓ 搜"林远"→特殊结果（细思极恐点②）' : '✗ 检索结果');

  console.log('[4] 密码门文案提示姓名拼音…');
  await page.evaluate(() => openGate());
  const gateDesc = await page.textContent('.gate-card .gate-desc');
  console.log(gateDesc.includes('姓名拼音') ? '✓ 密码门提示"姓名拼音"' : '✗ 文案异常');

  console.log('[5] 完整解密链：linyuan → 卷宗 → xf001+2009…');
  await page.fill('#gate-input', 'linyuan');
  await page.click('.gate-btn[onclick="checkGate()"]');
  await page.waitForSelector('#dossier.show', { timeout: 3000 });
  const dossierText = await page.textContent('#dossier');
  console.log(dossierText.includes('CE-2009-005') ? '✓ 卷宗解锁（CE-2009-005）' : '✗ 卷宗异常');
  await page.click('.dossier-close');
  await page.waitForSelector('#dossier', { state: 'hidden' });
  await page.evaluate(() => openAdmin());
  await page.fill('#admin-user', 'xf001');
  await page.fill('#admin-pass', '2009');
  let adminText = '';
  page.once('dialog', async d => { adminText = d.message(); await d.accept(); });
  await page.click('.gate-btn[onclick="checkAdmin()"]');
  await page.waitForTimeout(600);
  console.log(adminText.includes('最高机密') ? '✓ 完整卷宗（最高机密）' : '✗ 管理员卷宗异常');

  console.log(errors.length ? '!! 错误:\n' + errors.join('\n') : '✓ 无JS错误');
  await browser.close();
  console.log('\n✅ 解密链测试全部通过');
})().catch(e => { console.error('❌ 测试失败:', e.message); process.exit(1); });
