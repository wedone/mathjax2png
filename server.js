const express = require('express');
const cors = require('cors');
const mjAPI = require('mathjax-node');
const sharp = require('sharp');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const port = process.env.PORT || 3000;

// 添加更详细的请求日志
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// 初始化 MathJax
console.log('正在初始化 MathJax...');
mjAPI.config({
    MathJax: {
        SVG: {
            font: 'TeX'
        }
    }
});
mjAPI.start();
console.log('MathJax 初始化完成');

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// API 路由处理 LaTeX 公式转换
app.post('/convert', async (req, res) => {
    try {
        const { formula } = req.body;
        if (!formula) {
            return res.status(400).json({ error: '请提供 LaTeX 公式' });
        }

        // 使用 MathJax 将公式转换为 SVG
        const result = await mjAPI.typeset({
            math: formula,
            format: 'TeX',
            svg: true,
        });

        // 生成唯一的文件名
        const hash = crypto.createHash('md5').update(formula).digest('hex');
        const filename = `${hash}.png`;
        const filepath = path.join(__dirname, 'public', 'images', filename);

        // 将 SVG 转换为 PNG 并保存
        await sharp(Buffer.from(result.svg))
            .png()
            .toFile(filepath);

        // 返回图片的URL
        const imageUrl = `/images/${filename}`;
        res.json({ url: imageUrl });
    } catch (error) {
        console.error('转换错误:', error);
        res.status(500).json({ error: '转换过程中出现错误' });
    }
});

// 打印环境信息
console.log('环境变量:', {
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV,
    VSCODE_REMOTE: process.env.VSCODE_REMOTE
});

app.listen(port, '0.0.0.0', () => {
    console.log(`服务器运行在 http://0.0.0.0:${port}`);
    console.log('支持的所有地址访问');
    console.log('如果在 VS Code 远程环境中运行，请使用端口转发功能访问');
});