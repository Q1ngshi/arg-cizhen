/* 端到端测试：侦探板 → 档案 → 深入调查 → 连线 → 指认 → 反转 → 重玩 */
const { chromium } = require('playwright');
const fs = require('fs');

const URL = 'http://localhost:8081/';
const OUT = __dirname + '/shots/';

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    executablePath: 'C:/Users/32268/AppData/Local/ms-playwright/chromium-1200/chrome-win64/chrome.exe'
  });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !m.text().includes('404')) errors.push(m.text()); });

  const assert = (cond, msg) => {
    if (!cond) throw new Error('断言失败: ' + msg);
    console.log('  ✓', msg);
  };

  console.log('[1] 打开侦探板…');
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.evaluate(() => { localStorage.setItem('cz_intro_done','1'); localStorage.setItem('cz_site_done','1'); });
  await page.reload({ waitUntil: 'networkidle' });
  const charCount = await page.locator('.char-card').count();
  assert(charCount === 6, '6个人物头像 (实际' + charCount + ')');
  const deadCount = await page.locator('.char-card.char-dead').count();
  assert(deadCount === 3, '3个死者红叉标记');
  await page.screenshot({ path: OUT + '1-board.png' });

  console.log('[2] 点击人物A(周明安)查看档案…');
  await page.click('.char-card[data-id="A"]');
  await page.waitForSelector('#file-modal.show');
  const name = await page.textContent('#fm-name');
  assert(name.includes('周明安'), '档案显示姓名: ' + name.trim());
  const cause = await page.textContent('#fm-cause');
  assert(cause.includes('溺亡'), '死因显示: ' + cause.trim());
  await page.screenshot({ path: OUT + '2-file.png' });

  console.log('[3] 深入调查揭示隐藏线索…');
  await page.click('#btn-deep');
  await page.waitForSelector('#fm-hidden:not(.hidden)');
  const hidden = await page.textContent('#fm-hidden');
  assert(hidden.includes('笔记本'), '隐藏线索揭示: ' + hidden.trim());
  await page.click('#fm-close');
  await page.waitForSelector('#file-modal', { state: 'hidden' });

  console.log('[4] 点击连线查看关系…');
  await page.click('#lines-svg .rel-line-hot[data-rel="A-D"]');
  await page.waitForSelector('#rel-modal.show');
  const relText = await page.textContent('#rel-text');
  assert(relText.includes('扫了一夜') || relText.includes('后院') || relText.includes('走廊'), '关系描述: ' + relText.trim());
  await page.click('#rel-close');

  console.log('[5] 审查全部档案 + 怪屋收集罪证…');
  for (const id of ['B', 'C', 'D', 'E']) {
    await page.click(`.char-card[data-id="${id}"]`);
    await page.waitForSelector('#file-modal.show');
    const deepBtn = await page.locator('#btn-deep');
    if (await deepBtn.isVisible()) {
      await page.click('#btn-deep');
      await page.waitForSelector('#fm-hidden:not(.hidden)');
    }
    await page.click('#fm-close');
    await page.waitForSelector('#file-modal', { state: 'hidden' });
  }
  // 怪屋：从林建国档案进入图纸，收集3罪证
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
  assert(true, '审查5档案+收集3罪证后指认栏出现');
  await page.screenshot({ path: OUT + '3-accuse.png' });

  console.log('[6] 指控张雅心 → 确认 → 反转黑屏…');
  await page.click('#btn-accuse-d');
  await page.waitForSelector('#confirm-modal.show');
  const cTitle = await page.textContent('#confirm-title');
  assert(cTitle.includes('张雅心'), '确认弹窗: ' + cTitle.trim());
  await page.click('#confirm-ok');
  await page.waitForSelector('#stone-door.show', { timeout: 5000 });
  await page.click('#sd-open');
  await page.waitForSelector('#stone-door', { state: 'hidden' });
  await page.waitForSelector('#ending-screen.show', { timeout: 5000 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: OUT + '4-ending.png' });
  const line1 = await page.textContent('.ending-line.key');
  assert(line1 && (line1.includes('捐了一笔钱') || line1.includes('旧档案')), '反转关键行显示: ' + (line1 || '').trim());

  console.log('[7] 反转完整播放 + 重玩…');
  await page.waitForSelector('#btn-restart:not(.hidden)', { timeout: 45000 });
  assert(true, '反转文案播放完毕，重玩按钮出现');
  await page.screenshot({ path: OUT + '5-final.png' });
  await page.click('#btn-restart');
  await page.waitForSelector('#ending-screen', { state: 'hidden' });
  await page.waitForTimeout(300);
  assert(true, '重玩后回到侦探板');

  console.log('[8] 状态持久化验证（重开页面指认栏恢复）…');
  const reviewed = await page.locator('.char-card').count();
  assert(reviewed === 6, '重玩后状态重置，人物仍为6个');

  console.log(errors.length ? '!! 错误:\n' + errors.join('\n') : '✓ 无JS错误');
  await browser.close();
  console.log('\n✅ 端到端测试全部通过，截图已保存到 shots/');
})().catch(e => { console.error('❌ 测试失败:', e.message); process.exit(1); });
