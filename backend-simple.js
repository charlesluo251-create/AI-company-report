const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = 3001;

// 豆包 API 配置
const DOUBAO_API_KEY = process.env.DOUBAO_API_KEY || '90ebfcd1-9ba0-4e68-a3c2-1912622fb0fb';
const API_ENDPOINT = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
const MODEL_NAME = 'doubao-1-5-pro-32k-250115';

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// 调用豆包 API 生成报告（使用 AI 内置知识）
async function generateReportWithAI(companyName, country, industry) {
    const prompt = `你是一个专业的B2B客户情报分析师。请为"${companyName}"生成一份详细的客户洞察报告。

【帮我吧产品介绍】
帮我吧是金万维旗下的一体化智能服务管理平台，核心功能：
- AI智能客服：7x24小时自动应答，支持多语言
- 呼叫中心：PBX云总机、智能IVR、通话录音质检
- 在线客服：网页/APP/微信多渠道接入
- 远程协助：支持Windows/Mac/Linux，无需预装软件
- 工单系统：自动分派、SLA管理、多维度统计
- 客户管理：360度客户视图、行为轨迹追踪
- 知识库：AI自动推荐、多版本管理
- BI报表：20+数据大屏、自定义报表
- 无代码开发：拖拽式搭建业务流程

【目标公司】
公司名称：${companyName}
国家：${country || '未指定'}
行业：${industry || '未指定'}

【重要要求】
1. 利用你的知识库中关于该公司和行业的信息生成报告
2. 对于知名公司（如Grab、Shopee、Shopify、Razer等），使用你掌握的真实信息
3. 对于普通公司，基于行业特点和公司名称进行合理推断
4. 所有分析都要具体、有数据支撑
5. 东南亚市场的公司要考虑本地化因素（语言、文化、合规）
6. 不要编造不存在的事实，但可以基于行业常识推断
7. 每个数据点如果不确定，标注"基于行业知识"或"基于公司特征推断"

【报告结构】
请严格按照以下JSON格式返回：

{
  "companyInfo": {
    "name": "公司全名",
    "country": "总部所在国家",
    "industry": "所属行业",
    "scale": "公司规模（员工数、年营收）",
    "business": "主营业务详细描述",
    "website": "官网URL（如果能确定）",
    "sourceNote": "数据来源说明（如：基于公开信息/基于行业知识）"
  },
  "painPoints": {
    "title": "核心痛点分析",
    "points": [
      "痛点1：具体描述，包含具体场景或数据",
      "痛点2：具体描述，包含具体场景或数据"
    ]
  },
  "productFit": {
    "overall": "9/10 - 具体说明契合原因",
    "recommendedModules": [
      {
        "module": "模块名称",
        "reason": "推荐理由，说明如何解决具体痛点",
        "priority": "高/中/低",
        "expectedImpact": "预计带来的改善（具体化）"
      }
    ],
    "expectedROI": "ROI分析，包含成本节约和收益提升的估算"
  },
  "competitors": {
    "currentSolutions": [
      "竞品A：该公司可能使用的客服工具（如Zendesk、Freshdesk、Intercom、自建系统）",
      "竞品B：另一种可能方案"
    ],
    "advantages": [
      "优势1：帮我吧相比竞品的优势（具体对比）",
      "优势2：其他优势"
    ],
    "differentiators": "3-5个差异化卖点，每个都要具体"
  },
  "localization": {
    "languageNeeds": "该公司客户支持需要的语言（东南亚常见：马来语、印尼语、泰语、越南语、英语）",
    "culturalConsiderations": "文化因素（如：东南亚用户偏好WhatsApp沟通、节假日客服高峰、商务礼仪）",
    "regionalChallenges": "地区特有挑战（如：网络环境、多币种支付、法规要求）",
    "compliance": "合规要求（如：PDPA、数据本地化、隐私保护）"
  },
  "salesPitch": {
    "opening": "开场白话术，可以直接使用",
    "keyTalkingPoints": [
      "要点1：具体话题，包含数据和案例",
      "要点2：具体话题，包含数据和案例"
    ],
    "objectionHandling": {
      "objection": "客户最可能提出的异议（如：价格太高、现有系统够用、迁移成本）",
      "response": "应对话术，包含数据和案例证明"
    },
    "closing": "促成技巧和话术"
  },
  "dataSources": {
    "note": "本报告基于AI知识库和行业分析生成。如需获取最新实时数据，建议结合官网、LinkedIn、行业报告等来源验证。",
    "recommendedVerification": [
      "公司官网：查看关于我们、投资者关系页面",
      "LinkedIn：公司官方页面查看员工数、业务范围",
      "媒体报道：搜索该公司最近新闻和客户评价",
      "行业报告：查看该行业的客服和客户成功趋势"
    ]
  }
}

【输出要求】
- 必须返回纯JSON格式，不要任何markdown标记
- 每个分析点都要具体、详细，不要一句话带过
- 每个模块至少50字
- 针对该公司的实际业务，不要套用模板
- 东南亚公司要特别关注本地化需求`;

    const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DOUBAO_API_KEY}`
        },
        body: JSON.stringify({
            model: MODEL_NAME,
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.8,
            max_tokens: 8000
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API 调用失败: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();

    console.log(`  -> AI返回内容长度: ${content.length}`);

    // 解析 JSON
    let jsonStr = content;
    if (content.includes('```json')) {
        jsonStr = content.replace(/```json/g, '').replace(/```/g, '').trim();
    } else if (content.includes('```')) {
        jsonStr = content.replace(/```/g, '').trim();
    }

    return JSON.parse(jsonStr);
}

// API 路由
app.post('/api/generate-report', async (req, res) => {
    try {
        const { companyName, country, industry, companyUrl } = req.body;

        console.log(`\n🚀 开始生成报告: ${companyName}`);
        console.log(`📍 国家: ${country || '未指定'}, 行业: ${industry || '未指定'}`);

        console.log(`\n🤖 调用 AI 生成报告（基于知识库）...`);
        const reportData = await generateReportWithAI(companyName, country, industry);
        console.log(`✅ 报告生成成功`);

        // 返回结果
        res.json({
            success: true,
            data: reportData,
            searchResults: null
        });

    } catch (error) {
        console.error('❌ 生成报告失败:', error);
        console.error('错误堆栈:', error.stack);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║   帮我吧 - 客户情报报告 Bot (简化版)  ║
╚════════════════════════════════════════╝

🌐 服务器地址: http://localhost:${PORT}
🤖 AI模型: ${MODEL_NAME}
📝 模式: 知识库模式（无需搜索）

按 Ctrl+C 停止服务器
    `);
});
