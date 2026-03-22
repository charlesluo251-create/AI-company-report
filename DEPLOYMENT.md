# 帮我吧 - 客户情报报告Bot

一键生成企业客户洞察报告，基于SerpAPI实时搜索 + AI分析。

## 部署到Render.com（免费）

### 方法1：通过GitHub部署（推荐）

**步骤1：上传代码到GitHub**

1. 把这个项目文件夹push到你的GitHub仓库

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/charlesluo251-create/your-repo-name.git
git push -u origin main
```

**步骤2：在Render部署**

1. 访问：https://dashboard.render.com/
2. 登录/注册账号
3. 点击 **"New +"** → **"Web Service"**
4. 连接你的GitHub仓库
5. 配置如下：
   - **Name**: `bangwo8-intelligence-bot`（或你喜欢的名字）
   - **Region**: Singapore（或离用户最近的区域）
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node backend.js`
6. 点击 **"Advanced"** → **"Environment Variables"**，添加：
   - `SERPAPI_KEY`: 你的SerpAPI Key
   - `DOUBAO_API_KEY`: 你的豆包API Key
7. 点击 **"Create Web Service"**

**等待3-5分钟，部署完成！**

访问你的应用地址，格式：`https://你的应用名.onrender.com`

---

### 方法2：直接上传（不用GitHub）

1. 打开：https://dashboard.render.com/
2. 点击 **"New +"** → **"Web Service"**
3. 选择 **"Upload a public directory"**
4. 上传项目文件夹（排除node_modules）
5. 按方法1的步骤5-7配置

---

## 本地运行

```bash
# 安装依赖
npm install

# 启动服务器
node backend.js

# 访问 http://localhost:3001
```

## API Key配置

### 获取豆包API Key
1. 访问：https://console.volcengine.com/ark
2. 创建API Key

### 获取SerpAPI Key
1. 访问：https://serpapi.com/users/sign_up
2. 注册后获取免费API Key（100次/月）

## 功能特性

- ✅ 实时搜索企业信息（SerpAPI）
- ✅ AI深度分析（豆包Pro 32K）
- ✅ 生成完整客户洞察报告
- ✅ 80%公司分析 + 20%产品推荐
- ✅ 支持PDF导出

## 免费额度

- **Render.com**: 750小时/月（完全免费）
- **SerpAPI**: 100次搜索/月（免费）
- **豆包API**: 50万tokens（免费）

## 技术栈

- Node.js + Express
- SerpAPI（搜索）
- 豆包AI（分析）
- Bootstrap 5（前端）
