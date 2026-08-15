const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto('http://127.0.0.1:8081/desktop.html');
  await page.evaluate(() => {
    localStorage.setItem('cz_admin_ok', '1');
    sessionStorage.setItem('cz_admin_unlock', '1');
    if (typeof unlock === 'function') unlock();
  });
  await page.waitForTimeout(600);
  await page.evaluate(() => openWin('msg'));
  await page.waitForTimeout(400);
  // 注入 6 个模拟联系人（验证突破 3 个 + 滚动）
  await page.evaluate(() => {
    const names = ['陈誉','施宏宇','王鹏越','陈渝渊','李四','张三'];
    const list = document.getElementById('chat-list');
    names.forEach((n, i) => {
      const li = document.createElement('div');
      li.className = 'chat-item';
      li.setAttribute('data-chat', 'fake' + i);
      li.innerHTML = '<span class="c-avatar">◈</span><div class="c-mid"><div class="c-name">' + n + '</div><div class="c-prev">测试消息预览…</div></div><div class="c-right"><div class="c-time">00:0' + i + '</div></div>';
      list.appendChild(li);
    });
  });
  await page.waitForTimeout(300);
  const r = await page.evaluate(() => {
    const win = document.getElementById('win-msg');
    const list = document.getElementById('chat-list');
    const view = document.getElementById('chat-view');
    const msgs = document.getElementById('msg-list');
    const input = document.querySelector('.chat-input');
    return {
      winW: win.offsetWidth, winH: win.offsetHeight,
      chatListCount: document.querySelectorAll('#chat-list .chat-item').length,
      listScrollable: list.scrollHeight > list.clientHeight,
      listScrollH: list.scrollHeight, listClientH: list.clientHeight,
      listOverflowY: getComputedStyle(list).overflowY,
      msgScrollable: msgs.scrollHeight > msgs.clientHeight,
      msgScrollH: msgs.scrollHeight, msgClientH: msgs.clientHeight,
      msgOverflowY: getComputedStyle(msgs).overflowY,
      inputExists: !!input,
      bodyOverflow: getComputedStyle(document.getElementById('win-msg').querySelector('.w-body')).overflow,
      headFlex: getComputedStyle(view).display
    };
  });
  console.log(JSON.stringify(r, null, 2));
  await page.screenshot({ path: 'temp/shot-msg-scroll.png' });
  await browser.close();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
