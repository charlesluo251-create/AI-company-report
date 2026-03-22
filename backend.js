const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
require('dotenv').config();

const app = express();
const PORT = 3001;

// Google Custom Search API 配置（备用，已弃用）
const GOOGLE_API_KEY = 'AIzaSyBaJ3kglNfDxToptmdQZ2Z0VrdUnrYV3MU';
const GOOGLE_SEARCH_ENGINE_ID = 'f0316afe5a69f4e93';

// SerpAPI 配置（主要搜索服务）
const SERPAPI_KEY = '9d30b598cc3f5771e311d3eec8218a4cb93ca7ef9c1b275c7934e245c1e98982';
const SERPAPI_ENDPOINT = 'https://serpapi.com/search';

// 豆包 API 配置
const DOUBAO_API_KEY = process.env.DOUBAO_API_KEY || '90ebfcd1-9ba0-4e68-a3c2-1912622fb0fb';
const API_ENDPOINT = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
const MODEL_NAME = 'doubao-1-5-pro-32k-250115';

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// 搜索公司的详细信息
async function searchCompanyInfo(companyName) {
    const searches = [
        {
            name: '官网信息',
            query: `"${companyName}" official website about us`,
            type: 'basic_info'
        },
        {
            name: '客服现状',
            query: `"${companyName}" customer service support contact`,
            type: 'customer_service'
        },
        {
            name: '公司规模',
            query: `"${companyName}" company size employees revenue funding`,
            type: 'company_scale'
        },
        {
            name: '竞争对手',
            query: `"${companyName}" competitors industry alternatives`,
            type: 'competitors'
        },
        {
            name: '最新动态',
            query: `"${companyName}" news 2024 2025 2026 latest`,
            type: 'news'
        },
        {
            name: 'LinkedIn',
            query: `"${companyName}" site:linkedin.com company`,
            type: 'linkedin'
        }
    ];

    // 使用多重搜索策略：Google -> Bing -> DuckDuckGo
    const results = {};

    for (const search of searches) {
        console.log(`\n🔍 搜索: ${search.name}...`);
        console.log(`   搜索词: ${search.query}`);

        let searchResults = [];

        // 优先使用SerpAPI（稳定、专业）
        console.log(`   -> 尝试 SerpAPI...`);
        searchResults = await serpapiSearch(search.query);

        // 如果SerpAPI失败，尝试DuckDuckGo
        if (searchResults.length === 0) {
            console.log(`   -> SerpAPI无结果，尝试 DuckDuckGo...`);
            searchResults = await duckduckgoSearch(search.query);
        }

        // 如果DuckDuckGo也失败，尝试Bing
        if (searchResults.length === 0) {
            console.log(`   -> DuckDuckGo无结果，尝试 Bing...`);
            searchResults = await bingSearch(search.query);
        }

        // 最后尝试Google API
        if (searchResults.length === 0) {
            console.log(`   -> Bing无结果，尝试 Google API...`);
            searchResults = await googleSearch(search.query);
        }

        results[search.type] = {
            name: search.name,
            query: search.query,
            results: searchResults.slice(0, 3), // 只取前3个结果
            source: searchResults.length > 0 ? 'success' : 'failed'
        };

        await sleep(1000); // 避免请求过快
    }

    return results;
}

// SerpAPI 搜索（主要搜索服务）
async function serpapiSearch(query) {
    try {
        const url = `${SERPAPI_ENDPOINT}?api_key=${SERPAPI_KEY}&engine=google&q=${encodeURIComponent(query)}&num=5`;
        console.log(`  -> SerpAPI请求: ${query}`);

        const response = await fetch(url);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`SerpAPI请求失败: ${response.status} - ${errorText.substring(0, 100)}`);
        }

        const data = await response.json();

        // SerpAPI返回格式
        if (data.error) {
            throw new Error(`SerpAPI错误: ${data.error}`);
        }

        const results = [];

        // 提取organic搜索结果
        if (data.organic_results && data.organic_results.length > 0) {
            data.organic_results.slice(0, 5).forEach((item, index) => {
                results.push({
                    id: `${index + 1}`,
                    url: item.link || item.url,
                    title: item.title || '无标题',
                    domain: new URL(item.link || item.url).hostname,
                    snippet: item.snippet || '无摘要'
                });
            });
        }

        console.log(`  -> SerpAPI找到 ${results.length} 个结果`);
        return results;
    } catch (error) {
        console.error(`  -> SerpAPI搜索失败:`, error.message);
        // 检查是否是额度问题
        if (error.message.includes('limit') || error.message.includes('exceeded')) {
            console.error(`  -> ⚠️ SerpAPI免费额度已用完，请升级套餐`);
        }
        return [];
    }
}

// Google Search 搜索（使用免费 API，备用）
async function googleSearch(query) {
    try {
        const url = `https://customsearch.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(query)}&num=5`;
        console.log(`  -> 请求: ${url.substring(0, 100)}...`);

        const response = await fetch(url);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`  -> HTTP ${response.status}: ${errorText}`);
            const errorData = JSON.parse(errorText);
            throw new Error(`Google API 错误: ${errorData.error?.message || response.status}`);
        }

        const data = await response.json();

        // 详细日志
        console.log(`  -> API 返回数据结构:`, JSON.keys(data));
        console.log(`  -> 总结果数:`, data.searchInformation?.totalResults);
        console.log(`  -> items 数量:`, data.items?.length);

        if (!data.items || data.items.length === 0) {
            console.log(`  -> 未找到结果`);
            return [];
        }

        const results = data.items.map((item, index) => ({
            id: `${index + 1}`,
            url: item.link,
            title: item.title,
            domain: new URL(item.link).hostname,
            snippet: item.snippet || '无摘要'
        }));

        console.log(`  -> 找到 ${results.length} 个结果`);
        return results;
    } catch (error) {
        console.error(`  -> 搜索失败:`, error.message);
        console.error(`  -> 完整错误:`, error.stack);
        return [];
    }
}

// DuckDuckGo 搜索（备用方案1）
async function duckduckgoSearch(query) {
    try {
        const response = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            }
        });

        if (!response.ok) {
            throw new Error(`请求失败: ${response.status}`);
        }

        const html = await response.text();
        console.log(`  -> DuckDuckGo HTML长度: ${html.length}`);

        const $ = cheerio.load(html);
        const results = [];

        // DuckDuckGo结果容器
        $('.result__body').each((i, el) => {
            if (results.length >= 5) return false;
            try {
                const titleEl = $(el).find('.result__a');
                const snippetEl = $(el).find('.result__snippet');
                const title = titleEl.text().trim();
                let url = titleEl.attr('href') || '';

                // DuckDuckGo会做URL重定向，需要解码
                if (url.includes('//duckduckgo.com/l/?uddg=')) {
                    url = decodeURIComponent(url.split('uddg=')[1]?.split('&')[0] || '');
                }

                if (title && url && url.startsWith('http')) {
                    results.push({
                        url,
                        title,
                        domain: new URL(url).hostname,
                        snippet: snippetEl.text().trim() || '点击查看详情'
                    });
                }
            } catch (e) { /* 跳过无效条目 */ }
        });

        // 如果上面方式没找到，试另一个选择器
        if (results.length === 0) {
            $('a.result__a').each((i, el) => {
                if (results.length >= 5) return false;
                try {
                    const title = $(el).text().trim();
                    let url = $(el).attr('href') || '';
                    if (url.includes('uddg=')) {
                        url = decodeURIComponent(url.split('uddg=')[1]?.split('&')[0] || '');
                    }
                    if (title && url && url.startsWith('http')) {
                        results.push({
                            url,
                            title,
                            domain: new URL(url).hostname,
                            snippet: '点击查看详情'
                        });
                    }
                } catch (e) { /* 跳过 */ }
            });
        }

        console.log(`  -> DuckDuckGo找到 ${results.length} 个结果`);
        return results;
    } catch (error) {
        console.error(`  -> DuckDuckGo搜索失败:`, error.message);
        return [];
    }
}

// Bing搜索（备用方案2）
async function bingSearch(query) {
    try {
        const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}&count=10&setlang=en`;
        console.log(`  -> Bing请求: ${url.substring(0, 80)}...`);

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Cache-Control': 'no-cache',
            }
        });

        if (!response.ok) {
            throw new Error(`Bing请求失败: ${response.status}`);
        }

        const html = await response.text();
        console.log(`  -> Bing HTML长度: ${html.length}`);

        const $ = cheerio.load(html);
        const results = [];

        // Bing搜索结果选择器（多种备选）
        const selectors = [
            'li.b_algo h2 a',
            '#b_results .b_algo h2 a',
            '.b_title h2 a',
            'h2 a[href^="http"]'
        ];

        for (const selector of selectors) {
            if (results.length > 0) break;
            $(selector).each((i, el) => {
                if (results.length >= 5) return false;
                try {
                    const title = $(el).text().trim();
                    const url = $(el).attr('href') || '';
                    // 找对应的摘要
                    const snippet = $(el).closest('li.b_algo').find('.b_caption p, .b_algoSlug').first().text().trim();

                    if (title && url && url.startsWith('http') && !url.includes('bing.com')) {
                        results.push({
                            url,
                            title,
                            domain: new URL(url).hostname,
                            snippet: snippet || '点击查看详情'
                        });
                    }
                } catch (e) { /* 跳过 */ }
            });
        }

        console.log(`  -> Bing找到 ${results.length} 个结果`);
        return results;
    } catch (error) {
        console.error(`  -> Bing搜索失败:`, error.message);
        return [];
    }
}

// 调用豆包 API 生成报告
async function generateReportWithAI(companyName, country, industry, searchResults) {
    const searchContext = formatSearchResults(searchResults);

    const prompt = `你是一个专业的B2B客户情报分析师。请根据以下搜索结果，生成一份详细的客户洞察报告。

【目标公司】
公司名称：${companyName}
国家：${country || '未指定'}
行业：${industry || '未指定'}

【搜索结果数据源】
${searchContext}

【帮我吧产品简介（简版）】
帮我吧是金万维旗下的一体化智能服务管理平台，核心功能：
- AI智能客服：7x24小时自动应答，支持英语
- 呼叫中心：PBX云总机、智能IVR、通话录音质检
- 在线客服：网页/APP/微信多渠道接入
- 工单系统：自动分派、SLA管理、多维度统计
- 远程协助：支持Windows/Mac/Linux
- 客户管理：360度客户视图、行为轨迹追踪
- 知识库：AI自动推荐、多版本管理
- BI报表：20+数据大屏、自定义报表

【核心要求 - 必须严格执行】
1. 重点分析公司本身，减少产品介绍篇幅（80%分析公司，20%介绍产品）
2. 必须基于搜索结果深入分析：
   - 公司规模、业务模式、市场地位、发展阶段
   - 客户群体特征、服务场景、业务痛点
   - 竞争格局、差异化优势、面临的挑战
3. 痛点分析必须具体化，格式要求：
   "痛点描述（基于搜索结果的具体数据）+ 来源标注。用帮我吧的XX功能解决，具体方式..."

4. 每个数据点都要标注来源（格式：[官网信息-1]、[客服现状-2]等）
5. 所有 URL 都要保留在报告中，方便验证
6. 竞争对手分析要提及搜索结果中找到的真实竞品
7. 如果搜索结果中没有某些信息，基于行业知识分析时，明确标注"基于行业知识"

【报告结构要求】
请严格按照以下JSON格式返回：

{
  "companyInfo": {
    "name": "公司全名",
    "country": "总部所在国家",
    "industry": "所属行业",
    "scale": "公司规模（员工数、年营收、成立时间、融资情况）+ 来源标注",
    "business": "主营业务详细描述（商业模式、主要产品/服务、目标客户）+ 来源标注",
    "market": "市场地位（市场份额、排名、主要竞争对手）+ 来源标注",
    "customers": "客户群体特征（用户数量、分布地区、主要客户类型）+ 来源标注",
    "website": "官网URL + 来源标注",
    "sources": ["来源编号: URL"]
  },
  "painPoints": {
    "title": "核心痛点分析",
    "points": [
      "痛点1：根据搜索结果，该公司XX（具体业务/规模）+ 数据 + 来源标注。建议用帮我吧的XX功能，具体解决方式...",
      "痛点2：从XX来源看，该公司XX... + 数据 + 来源标注。用帮我吧的XX功能，可以..."
    ]
  },
  "productFit": {
    "overall": "9/10 - 结合搜索数据说明契合原因（具体说明）+ 来源标注",
    "recommendedModules": [
      {
        "module": "模块名称",
        "reason": "从搜索结果看该公司XX（数据）+ 来源标注，所以推荐这个模块，具体原因...",
        "priority": "高/中/低",
        "expectedImpact": "预计改善：XX（量化指标如节省X%时间、提升Y%效率）+ 来源标注"
      }
    ],
    "expectedROI": "ROI分析：根据该公司规模（XX人/XX营收）+ 来源标注，使用帮我吧预计每月节省客服成本XX美元，X个月回本..."
  },
  "competitors": {
    "currentSolutions": [
      "竞品A（从搜索结果找到，描述其市场地位/特点）+ 来源标注 [来源编号]",
      "竞品B + 来源标注"
    ],
    "advantages": [
      "优势1：相比竞品A，帮我吧支持XX（搜索结果显示该客户需要的特性）+ 来源标注",
      "优势2：帮我吧的XX功能可以解决该公司从搜索结果看存在的XX问题 + 来源标注"
    ],
    "differentiators": "差异化卖点 + 来源标注"
  },
  "localization": {
    "languageNeeds": "根据搜索结果，该公司业务涉及XX国家（数据）+ 来源标注，目前客服主要语言是XX。帮我吧支持英语，可满足英语客服需求。如需多语言，建议...",
    "culturalConsiderations": "文化考量（基于搜索结果的本地化信息）+ 来源标注",
    "regionalChallenges": "地区挑战（政治/经济/技术环境）+ 来源标注",
    "compliance": "合规要求（数据保护、行业监管）+ 来源标注"
  },
  "salesPitch": {
    "opening": "开场白：从搜索结果看，贵公司在XX领域表现突出，员工XX人，营收XX美元，业务覆盖XX国 + 来源标注。我了解到贵公司正在XX方面寻求提升...",
    "keyTalkingPoints": [
      "要点1：基于贵公司XX（业务特点/数据）+ 来源标注，帮我吧的XX功能可以帮助您...",
      "要点2：贵公司面临的XX挑战 + 来源标注，用帮我吧的XX方案可以..."
    ],
    "objectionHandling": {
      "objection": "客户异议（基于搜索结果可能提出的疑问）+ 来源标注",
      "response": "应对话术 + 结合搜索数据和帮我吧功能 + 来源标注"
    },
    "closing": "促成技巧 + 来源标注"
  },
  "dataSources": {
    "官网信息": [
      {id: "官网信息-1", url: "...", title: "..."}
    ],
    "客服现状": [
      {id: "客服现状-1", url: "...", title: "..."}
    ]
  }
}

【输出要求】
- 必须返回纯JSON格式，不要任何markdown标记
- 每个数据点都要有来源标注
- 公司信息要详细（规模、业务、市场、客户）
- 痛点分析必须包含：具体数据 + 问题描述 + 用帮我吧哪个功能 + 怎么解决 + 预计改善
- dataSources 字段要包含所有搜索结果的详细信息
- URL 必须完整保留
- 绝对不能使用省略号(...)，必须写完整内容`;

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
            max_tokens: 8000
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API 调用失败: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();

    // 解析 JSON
    let jsonStr = content;
    if (content.includes('```json')) {
        jsonStr = content.replace(/```json/g, '').replace(/```/g, '').trim();
    } else if (content.includes('```')) {
        jsonStr = content.replace(/```/g, '').trim();
    }

    return JSON.parse(jsonStr);
}

// 格式化搜索结果
function formatSearchResults(searchResults) {
    let formatted = '【搜索数据源】\n\n';

    for (const [key, search] of Object.entries(searchResults)) {
        formatted += `【${search.name}】\n`;
        formatted += `搜索词: ${search.query}\n\n`;

        if (search.results.length === 0) {
            formatted += `❌ 未找到相关结果\n\n`;
            continue;
        }

        search.results.forEach((result, index) => {
            formatted += `[${key}-${index + 1}] ${result.title}\n`;
            formatted += `    URL: ${result.url}\n`;
            formatted += `    摘要: ${result.snippet || '无摘要'}\n\n`;
        });

        formatted += '\n';
    }

    return formatted;
}

// 辅助函数
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 测试端点 - 测试SerpAPI
app.get('/api/test-serpapi/:query', async (req, res) => {
    try {
        const { query } = req.params;
        console.log(`\n🧪 测试 SerpAPI: ${query}`);

        const results = await serpapiSearch(query);

        res.json({
            success: true,
            query: query,
            count: results.length,
            results: results
        });
    } catch (error) {
        console.error('测试失败:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 测试端点 - 测试所有搜索引擎
app.get('/api/test-all/:query', async (req, res) => {
    try {
        const { query } = req.params;
        console.log(`\n🧪 测试所有搜索引擎: ${query}`);

        const results = {
            serpapi: await serpapiSearch(query),
            duckduckgo: await duckduckgoSearch(query),
            bing: await bingSearch(query),
            google: await googleSearch(query)
        };

        res.json({
            success: true,
            query: query,
            results: results,
            summary: {
                serpapi: results.serpapi.length,
                duckduckgo: results.duckduckgo.length,
                bing: results.bing.length,
                google: results.google.length,
                total: results.serpapi.length + results.duckduckgo.length + results.bing.length + results.google.length
            }
        });
    } catch (error) {
        console.error('测试失败:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 测试端点 - 测试Google API（保留兼容性）
app.get('/api/test-google/:query', async (req, res) => {
    try {
        const { query } = req.params;
        console.log(`\n🧪 测试 Google API: ${query}`);

        const results = await googleSearch(query);

        res.json({
            success: true,
            query: query,
            count: results.length,
            results: results
        });
    } catch (error) {
        console.error('测试失败:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 测试端点 - 测试所有搜索引擎
app.get('/api/test-all/:query', async (req, res) => {
    try {
        const { query } = req.params;
        console.log(`\n🧪 测试所有搜索引擎: ${query}`);

        const results = {
            google: await googleSearch(query),
            bing: await bingSearch(query),
            duckduckgo: await duckduckgoSearch(query)
        };

        res.json({
            success: true,
            query: query,
            results: results,
            summary: {
                google: results.google.length,
                bing: results.bing.length,
                duckduckgo: results.duckduckgo.length,
                total: results.google.length + results.bing.length + results.duckduckgo.length
            }
        });
    } catch (error) {
        console.error('测试失败:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// API 路由
app.post('/api/generate-report', async (req, res) => {
    try {
        const { companyName, country, industry, companyUrl } = req.body;

        console.log(`\n🚀 开始生成报告: ${companyName}`);
        console.log(`📍 国家: ${country || '未指定'}, 行业: ${industry || '未指定'}`);

        // 步骤1: 搜索公司信息
        console.log(`\n📊 步骤1/3: 搜索公司信息...`);
        const searchResults = await searchCompanyInfo(companyName);

        // 统计搜索结果
        let totalResults = 0;
        for (const [key, search] of Object.entries(searchResults)) {
            const count = search.results?.length || 0;
            totalResults += count;
            console.log(`   ${search.name}: ${count} 个结果`);
        }
        console.log(`✅ 搜索完成，总共找到 ${totalResults} 个结果`);

        if (totalResults === 0) {
            console.warn('⚠️ 所有搜索都失败了，使用通用信息');
        }

        // 步骤2: 调用 AI 生成报告
        console.log(`\n🤖 步骤2/3: 调用 AI 生成报告...`);
        const reportData = await generateReportWithAI(companyName, country, industry, searchResults);
        console.log(`✅ 报告生成成功`);

        // 步骤3: 返回结果
        console.log(`\n✅ 步骤3/3: 返回报告`);

        res.json({
            success: true,
            data: reportData,
            searchResults: searchResults
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
╔══════════════════════════════════════════╗
║   帮我吧 - 客户情报报告 Bot (后端版)   ║
╚══════════════════════════════════════════╝

🌐 服务器地址: http://localhost:${PORT}
📝 前端页面: http://localhost:${PORT}/index.html
🔧 API 端点:
   - POST /api/generate-report (生成报告)
   - GET  /api/test-serpapi/:query (测试SerpAPI)
   - GET  /api/test-all/:query (测试所有搜索引擎)

🔍 搜索策略: SerpAPI → DuckDuckGo → Bing → Google (自动fallback)
📊 AI模型: 豆包 Pro 32K
✨ 搜索服务: SerpAPI (100次/月免费)

按 Ctrl+C 停止服务器
    `);
});
