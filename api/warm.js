const mjAPI = require('mathjax-node');

let initialized = false;
let initPromise = null;

async function initMathJax() {
    if (!initialized) {
        if (!initPromise) {
            initPromise = (async () => {
                mjAPI.config({ MathJax: { SVG: { font: 'TeX' } } });
                await mjAPI.start();
                initialized = true;
            })();
        }
        await initPromise;
    }
}

module.exports = async (req, res) => {
    try {
        const tStart = Date.now();
        await initMathJax();
        res.json({ ok: true, elapsed: Date.now() - tStart });
    } catch (err) {
        console.error('warm error', err);
        res.status(500).json({ ok: false, error: String(err) });
    }
};
