# Vercel App

这是一个使用 Next.js 构建的应用程序，旨在通过 Vercel 部署。

## 项目结构

- `src/pages/_app.tsx`：自定义入口文件，用于初始化页面。
- `src/pages/index.tsx`：应用的主页组件。
- `src/pages/api/hello.ts`：API路由示例，处理对 `/api/hello` 的请求。
- `src/styles/globals.css`：全局样式文件。
- `src/components/Layout.tsx`：布局组件，提供统一的页面结构。

## 部署

1. 确保你已经将项目推送到 GitHub。
2. 登录到 [Vercel](https://vercel.com)。
3. 点击 "New Project"。
4. 选择你的 GitHub 仓库。
5. 按照提示完成部署。

## 使用

运行以下命令以启动开发服务器：

```bash
npm run dev
```

访问 `http://localhost:3000` 查看应用。