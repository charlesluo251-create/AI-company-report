const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

// MIME 类型映射
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
    console.log(`${new Date().toLocaleTimeString()} - ${req.method} ${req.url}`);

    // 默认访问 index.html
    let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);

    // 获取文件扩展名
    const extname = String(path.extname(filePath)).toLowerCase();

    // 设置 Content-Type
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    // 读取文件
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 - 文件未找到</h1>', 'utf-8');
            } else {
                res.writeHead(500, { 'Content-Type': 'text/html' });
                res.end('<h1>500 - 服务器错误</h1>', 'utf-8');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║  帮我吧 - 客户情报报告 Bot 已启动！      ║
╚════════════════════════════════════════╝

🌐 访问地址: http://localhost:${PORT}
📁 工作目录: ${__dirname}

按 Ctrl+C 停止服务器
    `);
});
