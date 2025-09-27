# MathJax to PNG Converter

这是一个将 MathJax 数学公式转换为 PNG 图片的 Web 应用。它提供了一个简单的 Web 界面，允许用户输入 LaTeX 格式的数学公式，并将其转换为高质量的 PNG 图片。

## 功能特点

- Web 界面输入 LaTeX 公式
- 实时预览转换结果
- 支持复杂的数学公式
- 输出高质量 PNG 图片
- Docker 支持

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

1. 构建 Docker 镜像：
```bash
docker build -t mathjax2png .
```

2. 运行容器：
```bash
docker run -p 3000:3000 mathjax2png
```

3. 访问 http://localhost:3000 使用应用

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

- 前端：HTML, CSS, JavaScript
- 后端：Node.js, Express
- 转换：mathjax-node, sharp
- 容器化：Docker

## 许可证

MIT