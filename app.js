// 豆包 API 配置（现在由后端管理，前端只需要调用后端）
// 自动检测当前域名，本地开发用localhost，部署用实际域名
const BACKEND_API_URL = `${window.location.protocol}//${window.location.host}/api/generate-report`;

// ========== 工具函数 ==========

// 更新加载状态文字
const loadingSteps = [
    '🔍 正在搜索公司官网信息...',
    '🔍 正在搜索客服支持现状...',
    '🔍 正在搜索公司规模和业务...',
    '🔍 正在搜索竞争对手信息...',
    '🔍 正在搜索最新新闻动态...',
    '🔍 正在搜索 LinkedIn 信息...',
    '⚙️ 正在分析搜索结果...',
    '📊 正在生成行业痛点分析...',
    '✅ 正在评估产品契合度...',
    '🏢 正在分析竞争对手...',
    '🌏 正在生成本地化洞察...',
    '💬 正在整理销售话术...',
    '✨ 报告生成完成！'
];

let currentStep = 0;
let totalSteps = loadingSteps.length;

function updateLoadingText() {
    const loadingText = document.getElementById('loadingText');
    const progressBar = document.getElementById('progressBar');
    const loadingStepsContainer = document.getElementById('loadingSteps');

    if (currentStep < loadingSteps.length) {
        const progress = Math.round((currentStep + 1) / totalSteps * 100);
        loadingText.innerHTML = `${loadingSteps[currentStep]}`;
        progressBar.style.width = `${progress}%`;

        // 更新步骤列表
        updateStepsList(loadingStepsContainer, currentStep);

        currentStep++;
    }
}

function updateStepsList(container, currentStepIndex) {
    // 首次加载时创建所有步骤
    if (container.children.length === 0) {
        loadingSteps.forEach((step, index) => {
            const stepDiv = document.createElement('div');
            stepDiv.className = 'step-item';
            stepDiv.id = `step-${index}`;
            stepDiv.innerHTML = `<span class="step-icon">○</span> ${step.replace(/[🔍⚙️📊✅🏢🌏💬✨]/g, '').trim()}`;
            container.appendChild(stepDiv);
        });
    }

    // 更新当前步骤状态
    for (let i = 0; i < loadingSteps.length; i++) {
        const stepEl = document.getElementById(`step-${i}`);
        if (!stepEl) continue;

        const icon = stepEl.querySelector('.step-icon');
        if (i < currentStepIndex) {
            stepEl.className = 'step-item completed';
            icon.textContent = '✓';
        } else if (i === currentStepIndex) {
            stepEl.className = 'step-item active';
            icon.textContent = '▶';
        } else {
            stepEl.className = 'step-item';
            icon.textContent = '○';
        }
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

        // 每隔2秒更新一次加载文字（总共约24秒完成12步）
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

    // 显示加载状态
    const generateBtn = document.getElementById('generateBtn');
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>生成中...';
    toggleLoading(true);

    try {
        // 调用后端 API
        const response = await fetch(BACKEND_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                companyName,
                country,
                industry,
                companyUrl
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`后端调用失败: ${response.status} - ${errorData.error || '未知错误'}`);
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || '生成报告失败');
        }

        // 显示报告
        displayReport(result.data, result.searchResults, companyName, country, industry);

    } catch (error) {
        console.error('生成报告失败:', error);
        alert('生成报告时出错：' + error.message + '\n\n请稍后重试或联系技术支持');
        toggleLoading(false);
    } finally {
        generateBtn.disabled = false;
        generateBtn.innerHTML = '<i class="bi bi-magic"></i> 开始生成报告';
    }
}

// 显示报告
function displayReport(reportData, searchResults, companyName, country, industry) {
    // 更新报告标题
    document.getElementById('reportTitle').textContent = companyName;
    const now = new Date();
    // 确保年份正确
    const currentYear = now.getFullYear();
    if (currentYear < 2025) {
        now.setFullYear(2026);
    }
    document.getElementById('reportMeta').textContent = `生成时间: ${now.toLocaleString('zh-CN')}`;

    // 公司信息
    const companyInfoHtml = `
        <div class="row">
            <div class="col-md-6">
                <p><strong>国家:</strong> ${reportData.companyInfo?.country || 'N/A'}</p>
                <p><strong>行业:</strong> ${reportData.companyInfo?.industry || 'N/A'}</p>
                <p><strong>规模:</strong> ${reportData.companyInfo?.scale || 'N/A'}</p>
            </div>
            <div class="col-md-6">
                <p><strong>官网:</strong> <a href="${reportData.companyInfo?.website || '#'}" target="_blank">查看</a></p>
                <p><strong>业务:</strong> ${reportData.companyInfo?.business || 'N/A'}</p>
            </div>
        </div>
    `;
    document.getElementById('companyInfo').innerHTML = companyInfoHtml;

    // 行业痛点分析
    const painPointsHtml = `
        <h4>${reportData.painPoints?.title || '行业痛点'}</h4>
        <ul>
            ${reportData.painPoints?.points?.map(p => `<li>${p}</li>`).join('') || '<li>暂无数据</li>'}
        </ul>
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

    // 数据来源
    const dataSourcesHtml = generateDataSourcesHtml(reportData.dataSources || searchResults);
    document.getElementById('dataSources').innerHTML = dataSourcesHtml;

    // 隐藏加载，显示报告
    toggleLoading(false);
}

// 生成数据来源 HTML
function generateDataSourcesHtml(dataSources) {
    if (!dataSources || Object.keys(dataSources).length === 0) {
        return '<p>暂无数据来源信息</p>';
    }

    let html = '';

    for (const [category, sources] of Object.entries(dataSources)) {
        html += `<h5 class="mt-4 mb-3">📋 ${category}</h5>`;

        if (Array.isArray(sources) && sources.length > 0) {
            html += '<div class="table-responsive"><table class="table table-sm">';
            html += '<thead><tr><th>ID</th><th>标题</th><th>链接</th></tr></thead><tbody>';

            sources.forEach(source => {
                const id = source.id || 'N/A';
                const title = source.title || '无标题';
                const url = source.url || '#';

                html += `<tr>
                    <td><code>${id}</code></td>
                    <td>${title}</td>
                    <td><a href="${url}" target="_blank" class="btn-link">查看</a></td>
                </tr>`;
            });

            html += '</tbody></table></div>';
        } else {
            html += '<p class="text-muted">未找到相关数据</p>';
        }
    }

    return html;
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
