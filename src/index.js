/**
 * Welcome to Cloudflare Workers!
 *
 * This is a basic Cloudflare Workers project that serves a simple HTML page
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 返回静态 HTML 内容
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(getHTML(), {
        headers: {
          "Content-Type": "text/html; charset=UTF-8",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    // API 示例端点
    if (url.pathname === "/api/hello") {
      return new Response(
        JSON.stringify({ message: "Hello from Cloudflare Workers!" }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 404 处理
    return new Response("Not Found", { status: 404 });
  },
};

function getHTML() {
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Cloudflare Workers App</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
          'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
          sans-serif;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        min-height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
      }

      .container {
        background: white;
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        padding: 40px;
        max-width: 600px;
        text-align: center;
      }

      h1 {
        color: #333;
        margin-bottom: 20px;
        font-size: 2.5em;
      }

      .subtitle {
        color: #666;
        font-size: 1.1em;
        margin-bottom: 30px;
      }

      .button {
        display: inline-block;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 12px 30px;
        border-radius: 6px;
        text-decoration: none;
        border: none;
        cursor: pointer;
        font-size: 1em;
        margin: 10px 5px;
        transition: transform 0.2s;
      }

      .button:hover {
        transform: translateY(-2px);
      }

      .features {
        text-align: left;
        margin-top: 40px;
        border-top: 1px solid #eee;
        padding-top: 30px;
      }

      .features h2 {
        color: #333;
        margin-bottom: 20px;
        font-size: 1.3em;
      }

      .features ul {
        list-style: none;
      }

      .features li {
        color: #666;
        padding: 10px 0;
        border-bottom: 1px solid #f0f0f0;
      }

      .features li:last-child {
        border-bottom: none;
      }

      .status {
        background: #f5f5f5;
        padding: 20px;
        border-radius: 6px;
        margin-top: 20px;
        font-family: 'Courier New', monospace;
        font-size: 0.9em;
        color: #333;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>🚀 Welcome to Cloudflare Workers</h1>
      <p class="subtitle">Your app is running on the edge!</p>

      <button class="button" onclick="testAPI()">Test API</button>
      <button class="button" onclick="location.href='https://developers.cloudflare.com/workers/'">Docs</button>

      <div class="features">
        <h2>✨ Features</h2>
        <ul>
          <li>⚡ Instant global deployment</li>
          <li>🌍 Runs on Cloudflare's edge network</li>
          <li>🔒 Built-in security and DDoS protection</li>
          <li>💰 Pay-as-you-go pricing</li>
          <li>🛠️ Easy to develop and deploy</li>
        </ul>
      </div>

      <div class="status" id="status">Ready to deploy!</div>
    </div>

    <script>
      async function testAPI() {
        try {
          const response = await fetch('/api/hello');
          const data = await response.json();
          document.getElementById('status').textContent = JSON.stringify(data, null, 2);
        } catch (error) {
          document.getElementById('status').textContent = 'API Error: ' + error.message;
        }
      }
    </script>
  </body>
</html>
  `;
}
