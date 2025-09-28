const mjAPI = require('mathjax-node');
const sharp = require('sharp');

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

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const tStart = Date.now();
        await initMathJax();
        console.log('/api/png initMathJax elapsed', Date.now() - tStart, 'ms');
        
        const { formula, options = {} } = req.body;
        
        if (!formula) {
            return res.status(400).send('Missing formula');
        }

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

    console.time('mjAPI.typeset');
    const result = await mjAPI.typeset(typesetOpts);
    console.timeEnd('mjAPI.typeset');
        if (!result || !result.svg) {
            throw new Error('MathJax returned empty SVG');
        }

        let svg = result.svg;

        // Post-process SVG: apply options
        if (options.color || options.fontSize || options.font) {
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

    console.time('sharp.toBuffer');
    const buffer = await img.toBuffer();
    console.timeEnd('sharp.toBuffer');
    console.log('/api/png: png buffer length', buffer.length, 'elapsed', Date.now() - tStart, 'ms');
        
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.send(buffer);
    } catch (error) {
        console.error('PNG 转换错误:', error);
        res.status(500).send('Render error');
    }
};