/* 第四条线·暗网全链路验证：5 人渐进浮现 / 持久化恢复 / 第四结局（销毁名册） */
const { chromium } = require('playwright');
const BASE = 'http://localhost:8081';
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Users/32268/AppData/Local/ms-playwright/chromium-1200/chrome-win64/chrome.exe' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  let fail = 0;
  const check = (name, ok) => { console.log((ok ? '✓ ' : '✗ ') + name); if (!ok) fail++; };

  await page.goto(BASE + '/desktop.html', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.clear(); sessionStorage.clear();
    localStorage.setItem('cz_admin_ok', '1');
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.click('#unlock-veil', { timeout: 3000 }).catch(() => { });
  await page.waitForFunction(() => document.querySelectorAll('.icon.locked').length === 0, { timeout: 15000 });

  // 1. 初始 3 项；触发 cz_evt_question → shadowJoin → 张学阔浮现（4 项 + 密信可见）
  check('初始联系人 3 项',
    await page.locator('#chat-list .chat-item').count() === 3);
  await page.evaluate(() => {
    localStorage.setItem('cz_evt_question', '1');
    shadowJoin();
  });
  await page.waitForTimeout(300);
  check('触发后张学阔浮现（联系人 4 项）',
    await page.locator('#chat-list .chat-item').count() === 4 &&
    await page.locator('#chat-list .chat-item[data-chat="zhang"]').count() === 1);
  // 打开信息窗口（聊天窗口关闭状态下触发的联系人也应可交互）
  await page.dblclick('.icon[data-win="msg"]');
  await page.waitForSelector('#win-msg.open');
  await page.waitForTimeout(400);
  check('张学阔首条密信显示',
    await page.evaluate(() => getComputedStyle(document.getElementById('shadow-msg-1')).display !== 'none'));

  // 2. 打开张学阔会话 → 陈誉浮现（5 项）；点击陈誉密信可见
  await page.click('#chat-list .chat-item[data-chat="zhang"]');
  await page.waitForTimeout(1200);
  check('打开张学阔 → 陈誉浮现（联系人 5 项）',
    await page.locator('#chat-list .chat-item').count() === 5 &&
    await page.locator('#chat-list .chat-item[data-chat="chenyu"]').count() === 1);
  await page.click('#chat-list .chat-item[data-chat="chenyu"]');
  await page.waitForTimeout(200);
  check('陈誉密信可见',
    await page.evaluate(() => getComputedStyle(document.getElementById('shadow-msg-2')).display !== 'none'));

  // 3. 手动触发 施宏宇/王鹏越 → 陈渝渊自动浮现（8 项）
  await page.evaluate(() => {
    shadowTrigger('shihongyu');
    shadowTrigger('wangpengyue');
  });
  await page.waitForTimeout(1500);
  check('陈渝渊最终自动浮现（联系人 8 项）',
    await page.locator('#chat-list .chat-item').count() === 8 &&
    await page.locator('#chat-list .chat-item[data-chat="chenyuyuan"]').count() === 1);
  await page.click('#chat-list .chat-item[data-chat="chenyuyuan"]');
  await page.waitForTimeout(200);
  check('陈渝渊密信可见',
    await page.evaluate(() => getComputedStyle(document.getElementById('shadow-msg-5')).display !== 'none'));

  // 4. 持久化键：cz_evt_shadow_members 含全部 5 人
  check('cz_evt_shadow_members 持久化 5 人',
    await page.evaluate(() => {
      const m = (localStorage.getItem('cz_evt_shadow_members') || '').split(',').filter(Boolean);
      return ['zhang','chenyu','shihongyu','wangpengyue','chenyuyuan'].every(k => m.indexOf(k) >= 0);
    }));

  // 5. 刷新恢复：联系人 8 项 + 密信全部显示（不重复推送：liveCount 归零后不弹新通知）
  await page.reload({ waitUntil: 'networkidle' });
  await page.click('#unlock-veil', { timeout: 3000 }).catch(() => { });
  await page.waitForFunction(() => document.querySelectorAll('.icon.locked').length === 0, { timeout: 15000 });
  await page.waitForTimeout(800);
  check('刷新后恢复全部暗网成员（联系人 8 项）',
    await page.locator('#chat-list .chat-item').count() === 8);
  await page.dblclick('.icon[data-win="msg"]');
  await page.waitForSelector('#win-msg.open');
  await page.waitForTimeout(400);
  await page.click('#chat-list .chat-item[data-chat="chenyuyuan"]');
  await page.waitForTimeout(200);
  check('刷新后密信保持显示',
    await page.evaluate(() => getComputedStyle(document.getElementById('shadow-msg-5')).display !== 'none'));

  // 6. 最终卷：集齐 5 人后第四选项「附录」浮现；未集齐不显示（先清 members 验证）
  await page.evaluate(() => localStorage.removeItem('cz_evt_shadow_members'));
  await page.evaluate(() => openFinal());
  await page.evaluate(() => fvRead());
  await page.waitForTimeout(200);
  check('未集齐 5 人：第四选项隐藏',
    await page.evaluate(() => getComputedStyle(document.getElementById('fv-fourth')).display === 'none'));
  await page.evaluate(() => {
    localStorage.setItem('cz_evt_shadow_members', 'zhang,chenyu,shihongyu,wangpengyue,chenyuyuan');
    showChooser();
  });
  await page.waitForTimeout(200);
  check('集齐 5 人：第四选项浮现',
    await page.evaluate(() => getComputedStyle(document.getElementById('fv-fourth')).display !== 'none'));

  // 7. 第四结局：fvChoice('burn') → fvEndBurn 文案 + 持久键
  await page.evaluate(() => fvChoice('burn'));
  await page.evaluate(() => fvConfirmGo());
  await page.waitForTimeout(300);
  check('第四结局演出出现（销毁名册文案）',
    await page.evaluate(() => document.getElementById('fv-end').textContent.indexOf('灯，可以不用再点了') !== -1));
  check('第四结局持久键 cz_evt_burn_end 写入',
    await page.evaluate(() => !!localStorage.getItem('cz_evt_burn_end')));

  await browser.close();
  console.log(fail ? `\n❌ ${fail} 项未通过` : '\n✅ 暗网全链路 + 第四结局验证通过');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('❌ 失败:', e.message); process.exit(1); });
