下面给你一套通用、最稳的“把项目部署到 AWS EC2”流程（适用于 Next.js / Node.js API / 静态站 / 带 Nginx 反代）。我按“生产可用”的方式写：Ubuntu + Nginx + HTTPS + PM2（或 systemd）。

⸻

1) 准备 EC2（安全组 + SSH）

 1. 在 AWS 控制台创建 EC2（推荐 Ubuntu 22.04/24.04）。
 2. 安全组放行端口：
 • 22（SSH）
 • 80（HTTP）
 • 443（HTTPS）
 3. SSH 登录：

chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@<EC2公网IP>
<!-- ssh -i ./jane-ec2.pem ec2-user@44.210.18.7 -->

⸻

2) 服务器初始化（更新 + 基础工具）

sudo apt update && sudo apt -y upgrade
sudo apt -y install git curl nginx
sudo systemctl enable --now nginx

可选：开防火墙（Ubuntu 常用 ufw）：

sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

⸻

3) 安装 Node.js（推荐用 nvm）

curl -fsSL <https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh> | bash
source ~/.bashrc   # 或 source ~/.zshrc
nvm install --lts
node -v
npm -v

⸻

4) 拉代码 & 安装依赖

建议放到 /var/www：

sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www
cd /var/www

git clone <你的仓库地址> app
cd app

# 任选包管理器

npm ci

# 或 pnpm i --frozen-lockfile

# 或 bun install

如果是 Next.js：

npm run build

⸻

5) 启动方式（两种任选其一）

方案 A：PM2（最常用）

npm i -g pm2

# Node API 示例（入口 index.js/server.js）

pm2 start server.js --name app

# Next.js 示例（生产启动）

pm2 start "npm run start -- -p 3000" --name next-app

pm2 save
pm2 startup systemd

# 按提示复制那条 sudo 命令执行一次

方案 B：systemd（更“系统级”）

适合你想完全不用 pm2 的场景，我也可以按你的项目入口给你生成 service 文件。

⸻

6) Nginx 反向代理到你的应用端口（例如 3000）

创建站点配置：

sudo nano /etc/nginx/sites-available/app

写入（把域名改成你的；没有域名也可以先用 EC2 IP 访问）：

server {
  listen 80;
  server_name yourdomain.com <www.yourdomain.com>;

  location / {
    proxy_pass <http://127.0.0.1:3000>;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}

启用并检查：

sudo ln -s /etc/nginx/sites-available/app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

⸻

7) 配 HTTPS（Let’s Encrypt）

前提：你域名 A 记录指向 EC2 公网 IP，并且 80/443 放行。

sudo apt -y install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d <www.yourdomain.com>

自动续期验证：

sudo certbot renew --dry-run

⸻

8) 环境变量与配置（生产必做）
 • 不要把 .env 提交到仓库
 • 在服务器上创建：

cd /var/www/app
nano .env

如果用 PM2，建议用 --update-env 或生态文件 ecosystem.config.js 管理变量。

⸻

9) 更新部署（最简单的发布流程）

cd /var/www/app
git pull
npm ci
npm run build
pm2 restart next-app   # 或你的进程名

⸻

10) 常见坑快速排查
 • 访问不了：检查安全组是否开 80/443；检查 Nginx 是否 active。

sudo systemctl status nginx
curl -I <http://localhost>

 • 502 Bad Gateway：应用没起或端口不对。

pm2 ls
curl -I <http://127.0.0.1:3000>

 • Next.js 端口：npm run start -- -p 3000
 • 日志：

pm2 logs
sudo tail -n 200 /var/log/nginx/error.log

⸻

如果你告诉我三点，我可以把上面步骤“定制成一份你直接照抄就能跑通的部署脚本 + nginx 配置”：

 1. 你的项目类型：Next.js / Node API / 静态站 / 其它
 2. 你用的包管理器：npm / pnpm / yarn / bun
 3. 是否有域名要上 HTTPS（有的话把域名写出来）
