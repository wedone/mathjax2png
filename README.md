# MathJax to PNG Converter

这是一个将 MathJax 数学公式转换为 PNG 图片的 Web 应用。它提供了一个简单的 Web 界面，允许用户输入 LaTeX 格式的数学公式，并将其转换为高质量的 PNG 图片。

## 功能特点


## 快速开始

### 本地运行

1. 安装依赖：
```bash
npm install
```

2. 启动服务器：
```bash
npm start
```

3. 访问 http://localhost:3000 使用应用

### Docker 部署

你可以通过以下两种方式使用 Docker：

#### 方式一：从 GitHub Container Registry 拉取镜像

```bash
# 拉取镜像
docker pull ghcr.io/wedone/mathjax2png:latest

# 运行容器
docker run -p 3000:3000 ghcr.io/wedone/mathjax2png:latest
```

#### 方式二：本地构建

1. 构建 Docker 镜像：
```bash
docker build -t mathjax2png .
```

2. 运行容器：
```bash
docker run -p 3000:3000 mathjax2png
```

访问 http://localhost:3000 使用应用

## API 使用

转换接口：
```
POST /convert
Content-Type: application/json

{
    "formula": "你的LaTeX公式"
}
```

响应：PNG 图片（image/png）

## 技术栈


## 许可证

MIT
# MathJax to PNG Converter

这是一个将 MathJax/LaTeX 数学公式转换为 PNG 图片的轻量服务，提供浏览器前端和 HTTP API。支持多种渲染选项（dpi、尺寸、颜色、字体等），并且可以通过 Docker 容器运行或使用 GitHub Actions 构建镜像。

## 快速开始

### 本地运行

1. 安装依赖：
```bash
npm install
```

2. 启动服务器：
```bash
npm start
```

3. 访问 http://localhost:3000 使用内置前端，或使用以下 API 直接渲染。

### Docker 部署

从 GitHub Container Registry（若已构建并推送）：
```bash
docker pull ghcr.io/wedone/mathjax2png:latest
docker run -p 3000:3000 ghcr.io/wedone/mathjax2png:latest
```

或本地构建并运行：
```bash
docker build -t mathjax2png .
docker run -p 3000:3000 mathjax2png
```

## HTTP API

两个主要接口：

1) GET /png
- 用法：通过查询参数请求并直接返回 PNG 二进制
- 示例：
```
GET /png?formula=<url-encoded-latex>&dpi=150&color=%2300aa00&fontSize=24&font=Times&display=1
```

2) POST /png
- 用法：发送 JSON（适合长公式或复杂选项）
- 请求体：
```json
{
    "formula": "\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}",
    "options": { "dpi": 200, "color": "#cc0000", "fontSize": 24 }
}
```

- 返回：PNG 二进制（Content-Type: image/png）

3) GET /png/b64/:data
- 说明：将公式用 base64url 编码放到路径中，URL 更简洁，适合直接嵌入 `<img>`。
- 示例：
```html
<img src="https://your-host/png/b64/<base64url>?dpi=150&color=%2300aa00" />
```

4) 兼容旧接口
- POST /convert 仍然存在，接受 `{ formula }` 并返回 `{ url: '/images/<hash>.png' }`。

前端生成的包含参数的链接（GET /png 与 /png/b64）
---------------------------------

前端现在会生成一个完整的 GET 链接，包含公式与渲染参数，方便直接复制到页面或嵌入到 HTML 中。生成的两种常见形式：

- 标准查询参数形式（适用于短公式）：

    http://your-host/png?formula=<url-encoded-latex>&dpi=150&color=%2300aa00&fontSize=24

    示例（curl）:
    ```bash
    curl -G "http://localhost:3000/png" \
        --data-urlencode "formula=\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}" \
        --data "dpi=150" --data "fontSize=20" -o out.png
    ```

- base64url 变体（适用于长公式或包含复杂字符时）：

    http://your-host/png/b64/<base64url>?dpi=150&color=%2300aa00

    说明：base64url 使用 URL-safe 的 Base64 编码（将 + 替换为 -，/ 替换为 _，并去掉尾部的 =），可以避免因为 URL 长度或特殊字符导致的错误。示例（Python 生成 base64url 并请求）：
    ```bash
    FORMULA='\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}'
    B64=$(python3 - <<'PY'
    import base64
    s = r"""$FORMULA"""
    b = base64.urlsafe_b64encode(s.encode()).decode().rstrip('=')
    print(b)
    PY
    )
    curl "http://localhost:3000/png/b64/$B64?dpi=150&fontSize=20" -o out.png
    ```

注意事项：

- URL 长度限制：浏览器和代理对 URL 长度有上限（不同平台差异较大），当公式较长时优先使用 base64url 变体。前端会在生成链接时提示超长警告。
- 参数一致性：通过 GET 链接传入的参数（dpi、width、height、scale、color、bgcolor、transparent、display、fontSize、font）会影响生成结果，前端会在链接中包含当前的选项以保证可复现性。

前端 UI 说明：

- 页面上的 “生成图片链接” 会生成包含当前渲染参数的 GET 链接并填入输入框；你可以直接复制该链接或将生成的 `<img src=...>` 嵌入到页面。
- 如果公式较长或包含复杂字符，页面还提供 “复制 base64 链接” 按钮，复制 `/png/b64/<base64url>?...` 形式的 URL（base64url 已在前文说明），以避免 URL 长度或编码问题。



## 支持的渲染参数

（可通过 GET 查询参数、POST JSON 的 options 字段或 /png/b64 的查询参数传入）

- formula (string) — 必需，LaTeX 公式
- dpi (number) — 控制矢量转栅格时的 density（类似 codecogs 的 dpi），默认 96
- width, height (number) — 输出尺寸（像素）
- scale (number) — 缩放系数（影响 raster density）
- bgcolor (string) — 背景颜色（例如 `#ffffff`）
- transparent (bool) — true 则输出透明 PNG
- display (bool) — 行间公式（MathJax display 模式）
- color (string) — 公式主色（会设置 SVG fill/stroke）
- fontSize (number) — 字体大小（px），会注入到 SVG style
- font (string) — 字体族（需在服务器镜像中安装该字体以生效）

示例：
```bash
# GET（URL 编码）
curl -o out.png "http://localhost:3000/png?formula=%5Cint_0%5E%5Cinfty+e%5E%7B-x%5E2%7D+dx+%3D+%5Cfrac%7B%5Csqrt%7B%5Cpi%7D%7D%7B2%7D&dpi=150&color=%2300aa00&fontSize=24"

# POST（JSON）
curl -X POST -H "Content-Type: application/json" \
    -d '{"formula":"\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}", "options": {"dpi":200, "color":"#cc0000", "fontSize":24}}' \
    http://localhost:3000/png --output out.png
```

## 字体与兼容性说明

- 我们在 Dockerfile 中安装了一些常用字体（DejaVu / Noto 包），以改善符号和 CJK 字形支持。如果需要特定商用字体，请把字体文件复制到镜像并更新 `fontconfig` 配置。
- `font` 参数仅在服务器上已安装该字体时才会生效。否则会回退到默认字体。

## 缓存与存储

- 渲染后的 PNG 会缓存到 `public/images/`，文件名基于公式内容和参数的 MD5 哈希，重复请求将复用已生成的图片。
- 长期运行建议配置清理策略或将图片上传至持久化对象存储（S3/OCIBlob），我可以帮你接入。

## 安全与生产化建议

- 如果公开 API，请使用 API key、身份认证或速率限制防止滥用。
- 使用 PM2 或 Docker Compose / systemd 管理进程，保证服务可靠运行。

## License

MIT