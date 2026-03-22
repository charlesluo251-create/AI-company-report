# 帮我吧 - 客户情报报告Bot 🎯

一个**真正的联网搜索**客户情报分析工具，为销售团队生成有数据来源的深度客户洞察报告。

## ✨ 核心特性

- ✅ **Google 搜索**：使用 Google Custom Search API，搜索结果100%可靠
- 📊 **数据来源标注**：每个数据都标注来源编号和 URL
- 🔍 **6类数据源**：
  - 官网信息
  - 客服现状
  - 公司规模
  - 竞争对手
  - 最新动态
  - LinkedIn 信息
- 📋 **完整数据来源列表**：报告末尾列出所有搜索结果
- 🎯 **聚焦东南亚**：专为马来/新加坡/印尼/越南/泰国/菲律宾市场定制
- 🖨️ **支持打印/导出**：可导出 PDF

## 🚀 快速开始

### 第一步：安装依赖

```bash
npm install
```

### 第二步：配置 Google API Key

编辑 `backend.js` 文件，确保这两行正确：

```javascript
const GOOGLE_API_KEY = '你的API Key';
const GOOGLE_SEARCH_ENGINE_ID = '你的搜索引擎ID';
```

> **注意**：当前使用的是通用搜索引擎 ID，可以直接使用。

### 第三步：启动后端服务器

```bash
# Windows
启动服务器.bat
# 或
重启服务器.bat

# 命令行
npm start
```

### 第四步：访问应用

打开浏览器访问：**http://localhost:3001**

## 📊 报告结构

### 1. 公司信息
- 国家、行业、规模
- 主营业务
- 官网链接

### 2. 行业痛点分析
- 具体痛点描述
- 每个痛点都有数据来源标注 [来源编号]

### 3. 帮我吧产品契合度
- 总体契合度评分
- 推荐模块及优先级
- 预期 ROI

### 4. 竞争对手分析
- 当前使用的解决方案
- 帮我吧的优势
- 差异化卖点

### 5. 本地化洞察
- 语言需求
- 文化考量
- 地区挑战
- 合规要求

### 6. 销售切入点和话术
- 开场白
- 关键谈话点
- 异议处理
- 促成技巧

### 7. 数据来源 ⭐
- 完整的搜索结果列表
- 每个结果都有 URL
- 可点击验证

## 🔧 技术架构

```
前端 (index.html + app.js)
    ↓
后端 API (backend.js)
    ↓
Google Custom Search API
    ↓
豆包 AI 分析生成
    ↓
结构化报告 (JSON)
```

## 📁 项目结构

```
20260320155907/
├── index.html              # 前端界面
├── app.js                 # 前端逻辑
├── backend.js            # 后端服务器（Google 搜索 + AI）
├── package.json          # 项目配置
├── 启动服务器.bat       # Windows 启动脚本
├── 重启服务器.bat       # Windows 重启脚本
└── README.md             # 说明文档
```

## 💡 使用示例

### 示例 1：搜索知名公司

```
公司名称: Grab
国家: Singapore
行业: Fintech
```

### 示例 2：搜索本地公司

```
公司名称: Company A (马来西亚某物流公司)
网址: https://company-a.com.my
```

### 示例 3：最小输入

```
公司名称: Shopee
```

系统会自动搜索所有相关信息。

## ⚠️ 注意事项

1. **后端必须运行**：前端需要调用后端 API
2. **Google API 配额**：免费版每天100次搜索，付费版无限
3. **网络连接**：需要能访问 Google API 和豆包 API
4. **豆包 API 费用**：每次生成约消耗 3,000-6,000 tokens

## 🔑 获取 Google API Key

1. 访问 https://console.cloud.google.com/
2. 创建新项目或选择现有项目
3. 启用 "Custom Search API"
4. 创建凭据 → API Key
5. 访问 https://programmablesearchengine.google.com/ 创建搜索引擎
6. 获取搜索引擎 ID (cx)
7. 填入 `backend.js` 配置

## 🐛 常见问题

### Q: 报告显示"未找到结果"
**A:** 检查 Google API Key 是否正确，后端日志会显示详细错误

### Q: Google API 报错 "quotaExceeded"
**A:** 免费配额用完，需要等24小时重置或升级付费版

### Q: 后端启动失败
**A:** 检查 3001 端口是否被占用，使用"重启服务器.bat"

## 🔮 未来计划

- [ ] 添加报告历史功能
- [ ] 支持批量生成多个公司报告
- [ ] 导出 Excel/Word 格式
- [ ] 添加自定义报告模板
- [ ] 支持更多搜索引擎（Bing、DuckDuckGo 备用）

## 📞 联系方式

有问题请联系开发团队。

---

**创建时间**: 2026-03-20
**版本**: 2.1 (Google Search API 版本)
