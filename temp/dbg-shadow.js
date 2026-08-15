const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ executablePath: "C:/Users/32268/AppData/Local/ms-playwright/chromium-1200/chrome-win64/chrome.exe" });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto("http://localhost:8081/desktop.html", { waitUntil: "networkidle" });
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); localStorage.setItem("cz_admin_ok","1"); });
  await page.reload({ waitUntil: "networkidle" });
  await page.click("#unlock-veil", { timeout: 3000 }).catch(() => {});
  await page.waitForFunction(() => document.querySelectorAll(".icon.locked").length === 0, { timeout: 15000 });
  await page.evaluate(() => { localStorage.setItem("cz_evt_question","1"); shadowJoin(); });
  await page.waitForTimeout(400);
  const info = await page.evaluate(() => {
    const items = [...document.querySelectorAll("#chat-list .chat-item")].map(it => it.getAttribute("data-chat") + "|" + it.offsetParent);
    const sm1 = document.getElementById("shadow-msg-1");
    return { items, sm1Display: sm1 ? getComputedStyle(sm1).display : "none", listRect: document.getElementById("chat-list").getBoundingClientRect().toJSON(), bodyRect: document.querySelector(".w-body").getBoundingClientRect().toJSON() };
  });
  console.log(JSON.stringify(info, null, 2));
  await page.evaluate(() => openWin("msg"));
  await page.waitForTimeout(300);
  const info2 = await page.evaluate(() => {
    const el = document.querySelector("#chat-list .chat-item[data-chat=zhang]");
    return el ? { rect: el.getBoundingClientRect().toJSON(), visible: el.offsetParent !== null } : "no zhang";
  });
  console.log("after open:", JSON.stringify(info2));
  await browser.close();
})().catch(e => { console.error("ERR", e.message); process.exit(1); });
