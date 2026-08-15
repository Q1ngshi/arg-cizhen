const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto("http://127.0.0.1:8081/desktop.html");
  await page.evaluate(() => { localStorage.setItem("cz_admin_ok","1"); sessionStorage.setItem("cz_admin_unlock","1"); if (typeof unlock==="function") unlock(); });
  await page.waitForTimeout(500);
  await page.evaluate(() => openWin("msg"));
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    for (let i=0;i<25;i++) pushMsg("m-person","📩","值班员 · 档案科","第"+i+"条测试消息，用于验证消息区滚动是否正常生效。");
  });
  await page.waitForTimeout(400);
  const r = await page.evaluate(() => {
    const msgs = document.getElementById("msg-list");
    return { scrollable: msgs.scrollHeight > msgs.clientHeight, sh: msgs.scrollHeight, ch: msgs.clientHeight, overflowY: getComputedStyle(msgs).overflowY };
  });
  console.log(JSON.stringify(r));
  await page.screenshot({ path: "temp/shot-msg-long.png" });
  await browser.close();
})().catch(e => { console.error("ERR", e.message); process.exit(1); });
