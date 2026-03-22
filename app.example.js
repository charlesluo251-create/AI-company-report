// ========== 配置区 ==========
// 请复制此文件为 app.js，并填入你的豆包 API Key

// 豆包 API Key（从火山引擎控制台获取）
const DOUBAO_API_KEY = 'YOUR_API_KEY_HERE';

// 豆包 API 端点
const API_ENDPOINT = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';

// 模型名称（推荐: doubao-1-5-pro-32k-250115）
const MODEL_NAME = 'doubao-1-5-pro-32k-250115';

// ========== 说明 ==========

/*
配置步骤：

1. 访问火山引擎官网：https://www.volcengine.com/
2. 注册并登录账号
3. 开通"火山方舟"服务
4. 在控制台获取 API Key
5. 创建推理接入点（Endpoint），选择豆包模型
6. 将 API Key 复制到上面的 DOUBAO_API_KEY
7. 将推理接入点 ID 复制到上面的 MODEL_NAME

注意事项：
- API Key 是敏感信息，请妥善保管
- 不要将包含真实 API Key 的 app.js 提交到代码仓库
- 推荐使用 .gitignore 来忽略 app.js 文件

Token 消耗：
- 每次生成报告约消耗 3,000-8,000 tokens
- 50万 tokens 约可生成 60-150 份报告
- 豆包 API 性价比高，适合频繁使用
*/

// ========== 工具函数 ==========

// 更新加载状态文字
const loadingSteps = [
    '正在搜索公司信息...',
    '正在分析行业痛点...',
    '正在评估产品契合度...',
    '正在研究竞争对手...',
    '正在生成本地化洞察...',
    '正在整理销售话术...',
    '报告生成完成！'
];

let currentStep = 0;

function updateLoadingText() {
    const loadingText = document.getElementById('loadingText');
    if (currentStep < loadingSteps.length) {
        loadingText.textContent = loadingSteps[currentStep];
        currentStep++;
    }
}

// 显示/隐藏加载动画
function toggleLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    const inputCard = document.getElementById('inputCard');
    const reportSection = document.getElementById('reportSection');

    if (show) {
        spinner.classList.add('active');
        inputCard.style.display = 'none';
        reportSection.classList.remove('active');
        currentStep = 0;
        updateLoadingText();

        // 每隔1.5秒更新一次加载文字
        window.loadingInterval = setInterval(updateLoadingText, 2000);
    } else {
        spinner.classList.remove('active');
        inputCard.style.display = 'block';
        reportSection.classList.add('active');
        clearInterval(window.loadingInterval);
    }
}

// ========== 报告生成函数 ==========

async function generateReport() {
    const companyName = document.getElementById('companyName').value.trim();
    const country = document.getElementById('country').value;
    const industry = document.getElementById('industry').value;
    const companyUrl = document.getElementById('companyUrl').value.trim();

    // 验证输入
    if (!companyName) {
        alert('请输入公司名称！');
        return;
    }

    if (DOUBAO_API_KEY === 'YOUR_API_KEY_HERE' || !MODEL_NAME || MODEL_NAME.startsWith('ep-xxxxxxxx')) {
        alert('请先在 app.js 文件中正确配置豆包 API Key 和 MODEL_NAME！\n\n参考 app.example.js 文件中的说明。');
        return;
    }

    // 显示加载状态
    const generateBtn = document.getElementById('generateBtn');
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>生成中...';
    toggleLoading(true);

    try {
        // 构建提示词
        const prompt = buildPrompt(companyName, country, industry, companyUrl);

        // 调用豆包 API
        const reportData = await callDoubaoAPI(prompt);

        // 解析并显示报告
        displayReport(reportData, companyName, country, industry);

    } catch (error) {
        console.error('生成报告失败:', error);
        alert('生成报告时出错：' + error.message);
        toggleLoading(false);
    } finally {
        generateBtn.disabled = false;
        generateBtn.innerHTML = '<i class="bi bi-magic"></i> 开始生成报告';
    }
}

// 构建提示词
function buildPrompt(companyName, country, industry, companyUrl) {
    const contextInfo = [];
    if (country) contextInfo.push(`国家: ${country}`);
    if (industry) contextInfo.push(`行业: ${industry}`);
    if (companyUrl) contextInfo.push(`网址: ${companyUrl}`);

    const companyContext = contextInfo.length > 0 ? `\n${contextInfo.join('\n')}` : '';

    return `你是一个专业的B2B客户情报分析师，为"帮我吧"（Bangwo8）生成客户洞察报告。

【帮我吧产品介绍】
帮我吧是金万维旗下的一体化智能服务管理平台，主要功能包括：
- AI智能客服
- 呼叫中心
- 在线客服
- 远程协助
- 工单系统
- 客户管理
- 知识库
- BI报表
- 无代码开发

目标客户：中大型企业，主要服务东南亚市场（Singapore, Malaysia, Indonesia, Vietnam, Thailand, Philippines）
主要客户群体：SaaS公司、IT服务公司、电商平台的 Customer Success/Support 负责人

【任务】
为以下客户生成深度洞察报告：

公司名称：${companyName}
${companyContext}

【要求】
请按照以下结构生成报告，使用JSON格式返回：
{
  "companyInfo": {
    "name": "公司名称",
    "country": "国家",
    "industry": "行业",
    "scale": "公司规模",
    "business": "主营业务"
  },
  "painPoints": {
    "title": "主要痛点",
    "points": [
      "痛点1：详细描述",
      "痛点2：详细描述"
    ]
  },
  "productFit": {
    "overall": "总体契合度评分（1-10分）",
    "recommendedModules": [
      {
        "module": "模块名称",
        "reason": "推荐理由",
        "priority": "优先级（高/中/低）"
      }
    ],
    "expectedROI": "预期的ROI和收益"
  },
  "competitors": {
    "currentSolutions": [
      "当前可能使用的解决方案1",
      "当前可能使用的解决方案2"
    ],
    "advantages": [
      "帮我吧相比竞品的优势1",
      "帮我吧相比竞品的优势2"
    ],
    "differentiators": "差异化卖点"
  },
  "localization": {
    "languageNeeds": "语言支持需求",
    "culturalConsiderations": "文化考量",
    "regionalChallenges": "地区特有挑战",
    "compliance": "合规要求"
  },
  "salesPitch": {
    "opening": "开场白话术",
    "keyTalkingPoints": [
      "关键谈话点1",
      "关键谈话点2"
    ],
    "objectionHandling": {
      "objection": "客户可能的异议",
      "response": "应对话术"
    },
    "closing": "促成技巧"
  }
}

注意事项：
1. 基于该公司的实际业务特点和行业特性进行分析
2. 痛点分析要具体、真实
3. 产品推荐要有理有据
4. 销售话术要贴近东南亚市场的商业文化
5. 返回必须是合法的JSON格式，不要包含任何markdown标记`;
}

// 调用豆包 API
async function callDoubaoAPI(prompt) {
    try {
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
                temperature: 0.7,
                max_tokens: 4000
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API 调用失败: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();

        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('API 返回格式异常');
        }

        const content = data.choices[0].message.content.trim();

        // 尝试解析 JSON（可能会包含 markdown 代码块）
        let jsonStr = content;
        if (content.includes('```json')) {
            jsonStr = content.replace(/```json/g, '').replace(/```/g, '').trim();
        } else if (content.includes('```')) {
            jsonStr = content.replace(/```/g, '').trim();
        }

        const reportData = JSON.parse(jsonStr);
        return reportData;

    } catch (error) {
        console.error('豆包 API 调用出错:', error);
        throw error;
    }
}

// 显示报告
function displayReport(reportData, companyName, country, industry) {
    // 更新报告标题
    document.getElementById('reportTitle').textContent = companyName;
    const now = new Date();
    document.getElementById('reportMeta').textContent = `生成时间: ${now.toLocaleString('zh-CN')}`;

    // 行业痛点分析
    const painPointsHtml = `
        <h4>${reportData.painPoints?.title || '行业痛点'}</h4>
        <ul>
            ${reportData.painPoints?.points?.map(p => `<li>${p}</li>`).join('') || '<li>暂无数据</li>'}
        </ul>
        <div class="highlight-box">
            <strong>核心痛点：</strong> 该公司在客户服务和支持方面面临的主要挑战是...
        </div>
    `;
    document.getElementById('painPoints').innerHTML = painPointsHtml;

    // 产品契合度
    const productFitHtml = `
        <div class="mb-3">
            <span class="tag tag-success">总体契合度: ${reportData.productFit?.overall || 'N/A'}</span>
        </div>
        <h4>推荐模块</h4>
        <div class="table-responsive">
            <table class="table">
                <thead>
                    <tr>
                        <th>模块</th>
                        <th>推荐理由</th>
                        <th>优先级</th>
                    </tr>
                </thead>
                <tbody>
                    ${reportData.productFit?.recommendedModules?.map(m => `
                        <tr>
                            <td><strong>${m.module}</strong></td>
                            <td>${m.reason}</td>
                            <td>
                                <span class="tag ${m.priority === '高' ? 'tag-danger' : m.priority === '中' ? 'tag-warning' : 'tag-primary'}">
                                    ${m.priority}
                                </span>
                            </td>
                        </tr>
                    `).join('') || '<tr><td colspan="3">暂无数据</td></tr>'}
                </tbody>
            </table>
        </div>
        <div class="highlight-box">
            <strong>预期收益：</strong> ${reportData.productFit?.expectedROI || '暂无数据'}
        </div>
    `;
    document.getElementById('productFit').innerHTML = productFitHtml;

    // 竞争对手分析
    const competitorsHtml = `
        <h4>当前可能使用的解决方案</h4>
        <ul>
            ${reportData.competitors?.currentSolutions?.map(s => `<li>${s}</li>`).join('') || '<li>暂无数据</li>'}
        </ul>
        <h4 class="mt-4">帮我吧的优势</h4>
        <ul>
            ${reportData.competitors?.advantages?.map(a => `<li>${a}</li>`).join('') || '<li>暂无数据</li>'}
        </ul>
        <div class="highlight-box">
            <strong>差异化卖点：</strong> ${reportData.competitors?.differentiators || '暂无数据'}
        </div>
    `;
    document.getElementById('competitors').innerHTML = competitorsHtml;

    // 本地化洞察
    const localizationHtml = `
        <div class="row">
            <div class="col-md-6">
                <h5><i class="bi bi-translate"></i> 语言需求</h5>
                <p>${reportData.localization?.languageNeeds || '暂无数据'}</p>
            </div>
            <div class="col-md-6">
                <h5><i class="bi bi-globe"></i> 文化考量</h5>
                <p>${reportData.localization?.culturalConsiderations || '暂无数据'}</p>
            </div>
        </div>
        <div class="highlight-box">
            <strong>地区特有挑战：</strong> ${reportData.localization?.regionalChallenges || '暂无数据'}
        </div>
        <div class="mt-3">
            <strong><i class="bi bi-shield-check"></i> 合规要求：</strong> ${reportData.localization?.compliance || '暂无数据'}
        </div>
    `;
    document.getElementById('localization').innerHTML = localizationHtml;

    // 销售切入点和话术
    const salesPitchHtml = `
        <div class="highlight-box">
            <strong>📞 开场白：</strong>
            <p class="mb-0 mt-2">"${reportData.salesPitch?.opening || '暂无话术'}"</p>
        </div>

        <h4 class="mt-4">关键谈话点</h4>
        <ol>
            ${reportData.salesPitch?.keyTalkingPoints?.map(p => `<li>${p}</li>`).join('') || '<li>暂无数据</li>'}
        </ol>

        <h4 class="mt-4">异议处理</h4>
        <div class="table-responsive">
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>客户可能的异议</th>
                        <th>应对话术</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>${reportData.salesPitch?.objectionHandling?.objection || '暂无数据'}</td>
                        <td>${reportData.salesPitch?.objectionHandling?.response || '暂无数据'}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="highlight-box mt-4">
            <strong>🎯 促成技巧：</strong> ${reportData.salesPitch?.closing || '暂无数据'}
        </div>
    `;
    document.getElementById('salesPitch').innerHTML = salesPitchHtml;

    // 隐藏加载，显示报告
    toggleLoading(false);
}

// 打印报告
function printReport() {
    window.print();
}

// 按下回车键触发生成
document.addEventListener('DOMContentLoaded', function() {
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                generateReport();
            }
        });
    });
});
