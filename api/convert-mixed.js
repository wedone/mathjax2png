const mjAPI = require('mathjax-node');
const sharp = require('sharp');
const crypto = require('crypto');
const path = require('path');

// 初始化 MathJax（仅在首次加载时）
let initialized = false;
async function initMathJax() {
    if (!initialized) {
        mjAPI.config({
            MathJax: {
                SVG: {
                    font: 'TeX'
                }
            }
        });
        mjAPI.start();
        initialized = true;
    }
}

// Helper: 解析混合内容，返回文本和公式的数组
function parseMixedContent(content) {
    const parts = [];
    let currentIndex = 0;
    const regex = /(\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$)/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
        // 添加公式前的文本（如果有）
        if (match.index > currentIndex) {
            parts.push({
                type: 'text',
                content: content.slice(currentIndex, match.index)
            });
        }
        
        // 添加公式
        parts.push({
            type: 'formula',
            content: match[1],
            isDisplay: match[1].startsWith('$$')
        });
        
        currentIndex = match.index + match[1].length;
    }

    // 添加剩余的文本（如果有）
    if (currentIndex < content.length) {
        parts.push({
            type: 'text',
            content: content.slice(currentIndex)
        });
    }

    return parts;
}

// Helper: render formula to base64
async function renderFormulaToBase64(formula, options = {}) {
    await initMathJax();
    
    // 处理公式：移除包裹的 $ 或 $$
    let cleanFormula = formula;
    if (formula.startsWith('$$') && formula.endsWith('$$')) {
        cleanFormula = formula.slice(2, -2);
    } else if (formula.startsWith('$') && formula.endsWith('$')) {
        cleanFormula = formula.slice(1, -1);
    }

    const typesetOpts = { 
        math: cleanFormula, 
        format: 'TeX', 
        svg: true,
        display: formula.startsWith('$$')
    };

    const result = await mjAPI.typeset(typesetOpts);
    if (!result || !result.svg) {
        throw new Error('MathJax returned empty SVG');
    }

    let svg = result.svg;

    // Post-process SVG: apply options
    if (options.color || options.fontSize || options.font) {
        const colorAttr = options.color ? ` fill="${options.color}" stroke="${options.color}"` : '';
        let sizeStyle = '';
        if (options.fontSize) {
            const fs = Number(options.fontSize);
            if (!isNaN(fs)) sizeStyle = ` font-size: ${fs}px;`;
        }

        svg = svg.replace(/^<svg([^>]*)>/, (m, g1) => {
            let newTag = `<svg${g1}`;
            if (!/\bfill=/.test(g1) && options.color) newTag += ` fill=\"${options.color}\" stroke=\"${options.color}\"`;
            
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
    const density = options.dpi ? Number(options.dpi) : 96;
    let img = sharp(svgBuffer, { density });

    if (options.width || options.height) {
        const w = options.width ? Number(options.width) : null;
        const h = options.height ? Number(options.height) : null;
        img = img.resize(w, h, { fit: 'contain' });
    } else if (options.scale) {
        const scale = Number(options.scale) || 1;
        if (scale !== 1) img = sharp(svgBuffer, { density: Math.round(density * scale) });
    }

    if (options.transparent === false || options.transparent === 'false') {
        const bg = options.bgcolor || '#ffffff';
        img = img.png().flatten({ background: bg });
    } else {
        img = img.png();
    }

    const buffer = await img.toBuffer();
    return buffer.toString('base64');
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { content, options = {} } = req.body;
        
        if (!content) {
            return res.status(400).json({ error: '请提供内容' });
        }

        // 解析混合内容
        const parts = parseMixedContent(content);
        
        // 处理所有部分
        const result = { parts: [] };

        for (const part of parts) {
            if (part.type === 'text') {
                result.parts.push({
                    type: 'text',
                    content: part.content
                });
            } else {
                // 公式部分转换为 base64 图片
                const base64 = await renderFormulaToBase64(part.content, {
                    ...options,
                    display: part.isDisplay
                });
                
                result.parts.push({
                    type: 'formula',
                    content: part.content,
                    base64: `data:image/png;base64,${base64}`
                });
            }
        }

        res.json(result);
    } catch (error) {
        console.error('转换错误:', error);
        res.status(500).json({ 
            error: '转换过程中出现错误',
            detail: error.message 
        });
    }
};