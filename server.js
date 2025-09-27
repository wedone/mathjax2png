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

// Helper: render formula to png filepath (returns filename)
async function renderFormulaToPng(formula, options = {}) {
    // Normalize options for stable hashing
    const optsForHash = {
        dpi: options.dpi ? Number(options.dpi) : undefined,
        width: options.width ? Number(options.width) : undefined,
        height: options.height ? Number(options.height) : undefined,
        scale: options.scale ? Number(options.scale) : undefined,
        bgcolor: options.bgcolor || undefined,
        transparent: options.transparent ? Boolean(options.transparent) : undefined,
    };

    const hash = crypto.createHash('md5')
        .update(formula)
        .update(JSON.stringify(optsForHash))
        .digest('hex');
    const filename = `${hash}.png`;
    const filepath = path.join(__dirname, 'public', 'images', filename);

    // 如果已存在则返回
    try {
        await fs.access(filepath);
        return { filename, filepath };
    } catch (e) {
        // 不存在，继续生成
    }

    const typesetOpts = { math: formula, format: 'TeX', svg: true };
    if (optsForHash.display) typesetOpts.display = true;
    const result = await mjAPI.typeset(typesetOpts);
    let svg = result.svg;

    // Post-process SVG: apply color, fontsize, font-family if provided
    if (options.color || options.fontSize || options.font) {
        // Inject attributes into <svg ...>
        const colorAttr = options.color ? ` fill="${options.color}" stroke="${options.color}"` : '';
        const fontAttr = options.font ? ` style=\"font-family: ${options.font};\"` : '';
        // handle fontsize by adding to style
        let sizeStyle = '';
        if (options.fontSize) {
            const fs = Number(options.fontSize);
            if (!isNaN(fs)) sizeStyle = ` font-size: ${fs}px;`;
        }

        // Merge with existing <svg ...> opening tag
        svg = svg.replace(/^<svg([^>]*)>/, (m, g1) => {
            let newTag = `<svg${g1}`;
            if (!/\bfill=/.test(g1) && options.color) newTag += ` fill=\"${options.color}\" stroke=\"${options.color}\"`;
            // merge style
            if (/\bstyle=/.test(g1)) {
                newTag = newTag.replace(/style=\"([^\"]*)\"/, (ms, s1) => {
                    return `style=\"${s1}${sizeStyle}\"`;
                });
            } else if (sizeStyle || options.font) {
                const fs = sizeStyle || '';
                const ff = options.font ? ` font-family: ${options.font};` : '';
                newTag += ` style=\"${ff}${fs}\"`;
            }
            newTag += '>';
            return newTag;
        });
    }

    const svgBuffer = Buffer.from(svg);

    // Use density to control rasterization resolution (dpi)
    const density = options.dpi ? Number(options.dpi) : 96;

    let img = sharp(svgBuffer, { density });

    // Resize if width/height provided
    if (options.width || options.height) {
        const w = options.width ? Number(options.width) : null;
        const h = options.height ? Number(options.height) : null;
        img = img.resize(w, h, { fit: 'contain' });
    } else if (options.scale) {
        // If scale provided, approximate by multiplying density
        const scale = Number(options.scale) || 1;
        if (scale !== 1) img = sharp(svgBuffer, { density: Math.round(density * scale) });
    }

    // Background / transparency
    if (options.transparent === true || options.transparent === 'true') {
        // keep alpha
    } else if (options.bgcolor) {
        img = img.png().flatten({ background: options.bgcolor });
    } else {
        // default white background to avoid transparent PNGs
        img = img.png().flatten({ background: '#ffffff' });
    }

    await img.toFile(filepath);
    return { filename, filepath };
}

// GET /png?formula=...  -> 返回 image/png（二进制），并缓存到 public/images
app.get('/png', async (req, res) => {
    try {
        const formula = req.query.formula;
        if (!formula) return res.status(400).send('Missing formula');

        const options = {
            dpi: req.query.dpi,
            width: req.query.width,
            height: req.query.height,
            scale: req.query.scale,
            bgcolor: req.query.bgcolor,
            transparent: req.query.transparent,
        };

        const { filename, filepath } = await renderFormulaToPng(formula, options);
        res.set('Content-Type', 'image/png');
        // 强缓存一天
        res.set('Cache-Control', 'public, max-age=86400');
        res.sendFile(filepath);
    } catch (err) {
        console.error('/png error', err);
        res.status(500).send('Render error');
    }
});

// GET /png/b64/:data  -> data 为 base64url 编码的公式（更短的 URL）
app.get('/png/b64/:data', async (req, res) => {
    try {
        const b64 = req.params.data;
        if (!b64) return res.status(400).send('Missing data');
        // base64url -> base64
        const base64 = b64.replace(/-/g, '+').replace(/_/g, '/');
        const formula = Buffer.from(base64, 'base64').toString('utf8');
        const options = {
            dpi: req.query.dpi,
            width: req.query.width,
            height: req.query.height,
            scale: req.query.scale,
            bgcolor: req.query.bgcolor,
            transparent: req.query.transparent,
        };

        const { filename, filepath } = await renderFormulaToPng(formula, options);
        res.set('Content-Type', 'image/png');
        res.set('Cache-Control', 'public, max-age=86400');
        res.sendFile(filepath);
    } catch (err) {
        console.error('/png/b64 error', err);
        res.status(500).send('Render error');
    }
});

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

// POST /png -> 接受 JSON { formula: string, options: {...} } 返回 image/png 二进制
app.post('/png', async (req, res) => {
    try {
        const { formula, options } = req.body || {};
        if (!formula) return res.status(400).json({ error: 'Missing formula' });

        const opts = options || {};
        const { filename, filepath } = await renderFormulaToPng(formula, opts);
        res.set('Content-Type', 'image/png');
        res.set('Cache-Control', 'public, max-age=86400');
        res.sendFile(filepath);
    } catch (err) {
        console.error('/png POST error', err);
        res.status(500).json({ error: 'Render error' });
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