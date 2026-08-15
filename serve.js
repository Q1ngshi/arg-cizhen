/* 本地静态服务器：node serve.js → http://localhost:8081 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = __dirname;
const PORT = 8081;
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css',
  '.js': 'application/javascript', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml'
};
/* 1-C 假 404 页：统一「慈恩镇档案管理办公室 · 查无此档」风格（站内路径提示档案不存在，补齐平台层） */
function notFoundHtml(reqUrl){
  return '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><title>404 · 查无此档 - 慈恩镇档案管理办公室</title>' +
    '<style>body{margin:0;padding:0;background:#f5f2ea;font-family:SimSun,serif;color:#333}'.replace(/font-family[^}]*/, 'font-family:"SimSun",serif;color:#333') +
    '.wrap{max-width:640px;margin:80px auto;background:#fffdf8;border:1px solid #d8c8a8;padding:40px 48px;box-shadow:0 2px 12px rgba(0,0,0,.08)}' +
    'h1{font-size:22px;color:#8B0000;letter-spacing:3px;border-bottom:1px solid #e0d0b0;padding-bottom:14px;margin:0 0 18px}' +
    'p{font-size:14px;line-height:2;color:#444}' +
    '.code{font-family:Consolas,monospace;font-size:13px;background:#f0ead8;padding:10px 14px;margin:14px 0;border-left:3px solid #b0a080;color:#555}' +
    'a{color:#0000EE;text-decoration:underline}' +
    '.foot{margin-top:26px;font-size:12px;color:#999;border-top:1px solid #e0d0b0;padding-top:12px}</style></head>' +
    '<body><div class="wrap">' +
    '<h1>慈恩镇档案管理办公室 · 查无此档</h1>' +
    '<p>您请求的页面或档案编号：<span class="code">' + reqUrl.replace(/[<>&"]/g, '') + '</span></p>' +
    '<p>经核对，馆藏目录中不存在该档案。可能原因：<br>① 档案编号输入有误；<br>② 该档案尚未完成数字化；<br>③ 该档案已按规定移出公开目录（依据：《档案解密与公开暂行办法》2018 修订）。</p>' +
    '<p>如需帮助，请持本人身份证件至槐树街 7 号三楼档案修复室咨询，或致电 0571-XXXXXXX。</p>' +
    '<p><a href="/">返回慈恩镇档案管理办公室首页</a></p>' +
    '<div class="foot">慈恩镇档案管理办公室 · archive.cizhen.gov.cn<br>页面生成时间：2009-03-17 03:01（系统时间未校准）</div>' +
    '</div></body></html>';
}

http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';
  const file = path.normalize(path.join(ROOT, urlPath));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' }); return res.end(notFoundHtml(req.url)); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log('ARG游戏已启动：http://localhost:' + PORT);
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log('局域网: http://' + iface.address + ':' + PORT + '  ← 手机同一WiFi');
      }
    }
  }
});
