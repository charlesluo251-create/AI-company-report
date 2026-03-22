# Google Custom Search API 修复指南

## 当前问题

当前使用的搜索引擎ID (`017576662512468239146:omuauf_lfve`) 是Google的**示例引擎**，有以下限制：
- 可能不返回所有搜索结果
- 配置不明确
- 容易出现访问权限问题

## 解决方案：创建自己的搜索引擎

### 步骤1：创建 Google Programmable Search Engine

1. 访问：https://programmablesearchengine.google.com/
2. 点击 "创建" 或 "New Search Engine"
3. 填写信息：
   - **要搜索的网站**：留空（这样就可以搜索整个网络）
   - **搜索引擎名称**：Bangwo8 Search Engine（或你喜欢的名字）
   - **语言**：英语（或所有语言）
4. 点击 "创建"

### 步骤2：配置搜索引擎

1. 创建后，点击 "设置" (Setup)
2. 找到 **搜索引擎ID (Search Engine ID)**，格式类似：`017576662512468239146:xxxxxxxxxx`
3. **复制这个ID**

### 步骤3：更新配置文件

打开 `backend.js`，找到第11行：

```javascript
const GOOGLE_SEARCH_ENGINE_ID = '017576662512468239146:omuauf_lfve';
```

替换成你刚才创建的引擎ID：

```javascript
const GOOGLE_SEARCH_ENGINE_ID = '你复制的新ID';
```

### 步骤4：启用 API（你可能已经完成）

确保在 Google Cloud Console 中启用：
1. 访问：https://console.cloud.google.com/apis/library/customsearch.googleapis.com
2. 确认 "Custom Search API" 状态为 ✅ 已启用

### 步骤5：验证 API Key

你的 API Key: `AIzaSyDJAOgFj3Bq3Z5IU3chCwq9s11FHEy1nvU`

验证它是否有权限：
1. 访问：https://console.cloud.google.com/apis/credentials
2. 找到你的 API Key
3. 点击编辑
4. 在 "应用程序限制" 中，确保至少选择了：
   - ✅ 无（不推荐，但最简单）
   - 或添加你的服务器IP地址
5. 在 "API 限制" 中，确保选择了：
   - ✅ 限制密钥 → Custom Search API

## 测试 API

启动服务器后，直接在浏览器访问：

```
http://localhost:3001/api/test-google/Grab
```

如果配置正确，你会看到JSON格式的搜索结果。

## 备用方案：多重搜索策略

我已经在代码中添加了**自动fallback机制**：

1. **Google Search API**（首选，需要配置）
2. **Bing搜索**（自动，备用）
3. **DuckDuckGo**（自动，备用）

即使Google API不工作，系统也会自动尝试其他搜索引擎，确保你总能拿到数据。

## 测试所有搜索引擎

访问这个URL可以测试所有3个搜索引擎：

```
http://localhost:3001/api/test-all/Grab
```

返回结果会显示每个引擎找到了多少结果。

## 常见问题

### Q: 为什么不直接用Bing或DuckDuckGo？
A: 它们是网页抓取，不如官方API稳定。Google API更可靠，但需要配置。

### Q: 我的API Key为什么不能用？
A: 可能原因：
- API限制设置不正确（需要允许Custom Search API）
- IP地址限制太严格
- API配额已用完（免费版每天100次请求）

### Q: 能否同时使用多个API Key？
A: 可以！如果需要，我可以帮你添加轮询机制。

## 下一步

1. 按照上述步骤创建自己的搜索引擎
2. 更新 `backend.js` 中的 `GOOGLE_SEARCH_ENGINE_ID`
3. 重启服务器：`重启服务器.bat`
4. 访问 `http://localhost:3001/api/test-google/Grab` 测试
5. 如果成功，访问 `http://localhost:3001/index.html` 开始生成报告

## 需要帮助？

如果还有问题，查看后端控制台的详细日志，它会显示：
- 每个搜索的具体URL
- API返回的错误信息
- 搜索结果的统计数据
