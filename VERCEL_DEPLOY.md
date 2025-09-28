# Vercel 部署指南

## 部署到 Vercel

### 步骤 1: 推送代码到 GitHub

确保你的代码已经推送到 GitHub 仓库。

### 步骤 2: 部署到 Vercel

#### 方法 1: 通过 GitHub 自动部署（推荐）

1. 访问 [Vercel](https://vercel.com) 并使用 GitHub 账号登录
2. 点击 "New Project" 
3. 选择你的 GitHub 仓库 `mathjax2png`
4. Vercel 会自动检测 `vercel.json` 配置
5. 点击 "Deploy" 开始部署
6. 部署完成后会获得一个域名（如：`https://mathjax2png-xxx.vercel.app`）

#### 方法 2: 通过 Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录 Vercel
vercel login

# 在项目根目录部署
vercel

# 第一次部署会询问配置，按照提示操作
```

### 项目结构

```
mathjax2png/
├── api/
│   ├── convert.js          # 纯公式转换 API
│   ├── convert-mixed.js    # 混合内容转换 API
│   └── png.js              # PNG 图片生成 API
├── public/
│   └── index.html          # 前端界面
├── vercel.json             # Vercel 配置文件
├── package.json            # 项目依赖
└── README.md               # 说明文档
```

### API 端点

部署后可用的 API：

- `POST /api/convert` - 纯公式转换
  ```json
  {
    "formula": "E=mc^2",
    "options": { "dpi": 150 }
  }
  ```

- `POST /api/convert-mixed` - 混合内容转换
  ```json
  {
    "content": "这是公式 $E=mc^2$ 在文本中",
    "options": { "dpi": 150 }
  }
  ```

- `POST /api/png` - 获取 PNG 图片（二进制）
  ```json
  {
    "formula": "\\frac{a}{b}",
    "options": { "dpi": 150 }
  }
  ```

### 免费版限制

Vercel 免费版适合个人项目，但有一些限制：

1. **函数执行时间**: 10秒（Hobby 计划）
2. **带宽**: 每月 100GB
3. **函数调用**: 每月 100,000 次
4. **部署**: 每天 100 次

对于数学公式转换应用来说，这些限制通常足够使用。

### 升级建议

如果需要更高的性能，可以考虑：

1. **Pro 计划** ($20/月):
   - 函数执行时间: 60秒
   - 无带宽限制
   - 更多并发请求

2. **自定义域名**: 免费版也支持自定义域名

### 监控和调试

1. 在 Vercel Dashboard 可以查看：
   - 函数日志
   - 性能指标
   - 错误报告
   - 部署历史

2. 本地测试 API：
   ```bash
   # 安装 vercel dev 进行本地测试
   vercel dev
   ```

### 环境变量（可选）

如果需要配置环境变量，在 Vercel Dashboard 的项目设置中添加：

```
NODE_ENV=production
```

### 成功部署检查

部署成功后，访问你的 Vercel 域名应该看到：
- 主页显示公式转换界面
- 可以切换"公式转换"和"混合文本"模式
- 预览功能正常工作
- 导出功能可用

恭喜！你的 MathJax to PNG 转换器现在已经部署在 Vercel 上了。