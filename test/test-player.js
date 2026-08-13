/* 模拟真实玩家游玩路线：浏览→发现裂缝→试错→串联线索→双重解锁→通关 */
const { chromium } = require('playwright');
const fs = require('fs');
const OUT = __dirname + '/shots/player/';

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: 'C:/Users/32268/AppData/Local/ms-playwright/chromium-1200/chrome-win64/chrome.exe' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  const log = (msg) => console.log('  🎮', msg);

  console.log('========== 玩家游玩模拟开始 ==========');
  await page.goto('http://localhost:8081/', { waitUntil: 'networkidle' });
  log('打开官网：慈恩镇档案管理办公室（正常网站，无异常感）');
  await page.screenshot({ path: OUT + '01-home.png' });

  // 1. 正常浏览：点开要闻里的红色条目
  log('浏览要闻 → 注意到红色条目"特大案件卷宗"→ 点击');
  await page.click('.news-item .n-title.alert');
  await page.waitForSelector('#gate-modal.show');
  log('弹出密码门：需要"检索人姓名拼音"——不知道，先试了"admin"');
  await page.fill('#gate-input', 'admin');
  await page.click('.gate-btn[onclick="checkGate()"]');
  await page.waitForSelector('#gate-err:not(.hidden)');
  log('提示"密码错误。档案将永久封存。"——先关掉，继续逛');
  await page.screenshot({ path: OUT + '02-gate-fail.png' });
  await page.click('.gate-btn.cancel');

  // 2. 逛通知公告
  log('切到"通知公告"标签 → 点开《档案修复技术培训班（第三期）》');
  await page.click('.news-tab[data-tab="tab2"]');
  await page.waitForSelector('#tab2.show');
  await page.click('#tab2 .news-item:has-text("档案修复技术培训班")');
  await page.waitForTimeout(300);
  const listText = await page.textContent('#tab2 .news-body');
  log(listText.includes('林远（旁听）') ? '→ 学员名单里看到"林远（旁听）"？？这个人没听说过，但名字记住了' : '→ 名单未找到林远');
  await page.screenshot({ path: OUT + '03-training-list.png' });

  // 3. 馆藏动态
  log('切到"馆藏动态" → 点开《失踪人口档案补录》');
  await page.click('.news-tab[data-tab="tab3"]');
  await page.waitForSelector('#tab3.show');
  await page.click('#tab3 .news-item:has-text("失踪人口档案补录")');
  await page.waitForTimeout(300);
  log('→ "补录2009年度失踪人员档案1件（编号05）"——和"特大案件卷宗"对上了');
  await page.screenshot({ path: OUT + '04-supplement.png' });

  // 4. 档案查询
  log('去"档案查询"页，搜刚才记下的名字"林远"');
  await page.evaluate(() => {
    document.querySelectorAll('.page-panel').forEach(function(p) { p.classList.remove('show'); });
    document.querySelector('.page-home').style.display = 'none';
    document.getElementById('page-search').classList.add('show');
  });
  await page.fill('#archive-search', '林远');
  await page.click('#archive-search-btn');
  await page.waitForTimeout(300);
  const r1 = await page.textContent('#search-result');
  log(r1.includes('检索记录已存档') ? '→ "未找到相关档案。（检索记录已存档）"……很奇怪，搜不到比搜到更让人在意' : '→ 检索结果异常');
  await page.screenshot({ path: OUT + '05-search-linyuan.png' });

  log('再搜"槐树街"试试（馆藏目录里见过这个词）');
  await page.fill('#archive-search', '槐树街');
  await page.click('#archive-search-btn');
  await page.waitForTimeout(300);
  const r2 = await page.textContent('#search-result');
  log(r2.includes('槐树街调查记录') ? '→ "槐树街调查记录（数据异常）——请前往馆藏目录尝试访问"' : '→ 检索异常');
  await page.screenshot({ path: OUT + '06-search-huaishu.png' });

  // 5. 回馆藏目录点乱码
  log('回首页 → 馆藏目录里那个乱码条目"槐树街调查记录"——现在可以点了');
  await page.evaluate(() => {
    document.getElementById('page-search').classList.remove('show');
    document.querySelector('.page-home').style.display = '';
  });
  await page.click('.n-title:has-text("槐树街调查记录")');
  await page.waitForSelector('#admin-modal.show');
  log('弹出"内部档案管理系统·管理员认证"——需要账号+密码，先看看');
  await page.screenshot({ path: OUT + '07-admin-gate.png' });
  await page.click('#admin-modal .gate-btn.cancel');

  // 6. 翻机构概况找账号
  log('线索里说修复室……去"机构概况"看看');
  await page.click('#main-nav a[data-page="org"]');
  await page.waitForSelector('#page-org.show');
  const orgText = await page.textContent('#page-org');
  log(orgText.includes('xf001') ? '→ 内设机构表：档案修复室 内部编号 xf001——账号有了，密码还不知道' : '→ 机构概况未找到xf001');
  await page.screenshot({ path: OUT + '08-org.png' });

  // 7. 回到密码门，用"林远"拼音试
  log('回到要闻的密码门——提示"姓名拼音"，那个学员名单里的"林远"→ lin yuan');
  await page.click('#main-nav a[data-page="home"]');
  await page.waitForTimeout(300);
  log('切回"要闻"标签，再点红色条目');
  await page.click('.news-tab[data-tab="tab1"]');
  await page.waitForSelector('#tab1.show');
  await page.click('.news-item .n-title.alert');
  await page.waitForSelector('#gate-modal.show');
  await page.fill('#gate-input', 'linyuan');
  await page.click('.gate-btn[onclick="checkGate()"]');
  await page.waitForSelector('#dossier.show', { timeout: 3000 });
  log('→ 解锁！全屏卷宗面板：CE-2009-005');
  const dossierText = await page.textContent('#dossier');
  log(dossierText.includes('2009年3月17日') ? '→ 卷宗内容：林远……2009年3月17日失踪……（年份=2009？）' : '→ 卷宗内容异常');
  log(dossierText.includes('三楼修复室') ? '→ 底部提示"如需更高权限，请与三楼修复室联系"——修复室=xf001，密码试2009' : '→ 提示缺失');
  await page.screenshot({ path: OUT + '09-dossier-1.png' });
  await page.click('.dossier-close');

  // 8. 管理员门：xf001 + 2009
  log('回到乱码条目 → 管理员门 → 账号 xf001 + 密码 2009');
  await page.click('.n-title:has-text("槐树街调查记录")');
  await page.waitForSelector('#admin-modal.show');
  await page.fill('#admin-user', 'xf001');
  await page.fill('#admin-pass', '2009');
  await page.click('#admin-modal .gate-btn[onclick="checkAdmin()"]');
  await page.waitForSelector('#dossier2.show', { timeout: 3000 });
  const adminDossier = await page.textContent('#dossier2');
  log(adminDossier.includes('最高机密') ? '→ 完整卷宗解锁：最高机密 + 教会地下档案室（L3新条目出现）' : '→ 管理员卷宗异常');
  log(adminDossier.includes('CE-2009-005') ? '→ 卷宗内容：CE-2009-005 林远失踪案（操作员 xf001）' : '→ 卷宗内容异常');
  await page.screenshot({ path: OUT + '10-dossier-2.png' });

  console.log('========== 游玩模拟结束 ==========');
  console.log(errors.length ? '!! 页面错误:\n' + errors.join('\n') : '✓ 全程无JS错误');
  await browser.close();
})().catch(e => { console.error('❌ 模拟中断:', e.message); process.exit(1); });
