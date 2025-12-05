# Cloudflare Workers 项目

一个可以部署到 Cloudflare 的基础项目，使用 Cloudflare Workers 提供全球边缘计算能力。

## 🚀 快速开始

### 前置要求
- Node.js 16+
- pnpm 8.0.0+
- Cloudflare 账户（免费账户即可）

### 安装依赖
```bash
pnpm install
```

### 本地开发
```bash
pnpm dev
```

访问 `http://localhost:8787` 查看应用。

### 部署到 Cloudflare

1. **登录 Cloudflare**
```bash
pnpm exec wrangler login
```

2. **配置 wrangler.toml**
   - 如果要部署到自己的域名，修改 `account_id` 和 `zone_id`
   - 或使用 Cloudflare Workers 子域名（默认配置）

3. **部署**
```bash
pnpm deploy
```

## 📁 项目结构

```
.
├── src/
│   ├── index.js          # Worker 入口文件
│   └── index.html        # 静态 HTML 页面
├── wrangler.toml         # Cloudflare Workers 配置
├── package.json          # 项目依赖
└── README.md             # 本文件
```

## 🔧 配置说明

### wrangler.toml
- `name`: 项目名称
- `account_id`: 你的 Cloudflare 账户 ID
- `zone_id`: 你的域名 Zone ID（可选）
- `workers_dev`: 是否使用 Workers 子域名

### 获取必要信息
- **Account ID**: 登录 Cloudflare 仪表板 → 右上角账户 → 复制 Account ID
- **Zone ID**: 选择域名 → 右侧栏查看 Zone ID

## 📝 API 端点

- `GET /` - 返回主页 HTML
- `GET /api/hello` - 返回 JSON 响应示例

## 🌐 部署选项

### 1. 免费 Workers 子域名（推荐新手）
无需配置，直接部署即可获得 `*.workers.dev` 域名

### 2. 自定义域名
需要在 Cloudflare 管理的域名下部署，修改 wrangler.toml：
```toml
account_id = "your_account_id"
zone_id = "your_zone_id"
route = "yoursite.com/*"
```

## 💡 常用命令

```bash
# 查看部署状态
pnpm exec wrangler deployments list

# 查看日志
pnpm exec wrangler tail

# 删除部署
pnpm exec wrangler delete
```

## 📚 更多资源

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/commands/)
- [Workers 示例](https://developers.cloudflare.com/workers/examples/)

## 📄 License

MIT
