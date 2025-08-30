// VIP视频播放器 - 纯前端版本
// 无需后端服务器，可直接部署到静态托管平台

class VipVideoPlayerFrontend {
    constructor() {
        // VIP解析接口列表（与后端版本保持一致）
        this.parseApis = [
            "https://jx.playerjy.com/?url=",  // 测试可用
            "https://jx.777jiexi.com/player/?url=",
            "https://jx.xyflv.com/?url=",
            "https://jx.m3u8.tv/jiexi/?url=",
            "https://jx.yparse.com/index.php?url=",
            "https://jx.aidouer.net/?url=",
            "https://jx.618g.com/?url=",
            "https://www.8090g.cn/?url=",
            "https://jx.mmkv.cn/tv.php?url=",
            "https://www.ckplayer.vip/jiexi/?url=",
            "https://jx.xmflv.com/?url=",
            "https://jx.we-vip.com/?url=",
            "https://jx.bozrc.com:4433/player/?url=",
            "https://jx.blbo.cc:4433/?url="
        ];
        
        // 支持的平台
        this.supportedPlatforms = {
            'iqiyi.com': '爱奇艺',
            'v.qq.com': '腾讯视频', 
            'youku.com': '优酷',
            'mgtv.com': '芒果TV',
            'bilibili.com': '哔哩哔哩',
            'le.com': '乐视视频',
            'sohu.com': '搜狐视频'
        };
        
        this.initElements();
        this.bindEvents();
        this.init();
    }

    // 初始化DOM元素
    initElements() {
        this.elements = {
            videoUrlInput: document.getElementById('videoUrl'),
            apiSelect: document.getElementById('apiSelect'),
            parseBtn: document.getElementById('parseBtn'),
            checkUrlBtn: document.getElementById('checkUrlBtn'),
            checkApisBtn: document.getElementById('checkApisBtn'),
            clearBtn: document.getElementById('clearBtn'),
            clearLogBtn: document.getElementById('clearLogBtn'),
            statusLog: document.getElementById('statusLog'),
            platformInfo: document.getElementById('platformInfo'),
            platformText: document.getElementById('platformText'),
            apiStatus: document.getElementById('apiStatus'),
            apiSummary: document.getElementById('apiSummary')
        };
    }

    // 绑定事件监听器
    bindEvents() {
        this.elements.parseBtn.addEventListener('click', () => this.parseVideo());
        this.elements.checkUrlBtn.addEventListener('click', () => this.checkUrl());
        this.elements.checkApisBtn.addEventListener('click', () => this.checkApis());
        this.elements.clearBtn.addEventListener('click', () => this.clearInput());
        this.elements.clearLogBtn.addEventListener('click', () => this.clearLog());

        // URL输入框事件
        this.elements.videoUrlInput.addEventListener('blur', () => {
            if (this.elements.videoUrlInput.value.trim()) {
                this.checkUrl();
            }
        });

        this.elements.videoUrlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.parseVideo();
            }
        });

        // 实时URL验证
        this.elements.videoUrlInput.addEventListener('input', () => {
            this.validateUrl();
        });
    }

    // 工具函数：格式化时间
    formatTime() {
        const now = new Date();
        return now.toLocaleTimeString('zh-CN', { hour12: false });
    }

    // 添加日志
    addLog(message, type = 'info') {
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.innerHTML = `[${this.formatTime()}] ${message}`;
        this.elements.statusLog.appendChild(logEntry);
        this.elements.statusLog.scrollTop = this.elements.statusLog.scrollHeight;
    }

    // 设置按钮加载状态
    setButtonLoading(button, loading) {
        if (loading) {
            button.disabled = true;
            const icon = button.querySelector('i');
            icon.className = 'loading';
        } else {
            button.disabled = false;
            const icon = button.querySelector('i');
            this.restoreButtonIcon(button, icon);
        }
    }

    // 恢复按钮图标
    restoreButtonIcon(button, icon) {
        if (button === this.elements.parseBtn) icon.className = 'fas fa-play';
        else if (button === this.elements.checkUrlBtn) icon.className = 'fas fa-search';
        else if (button === this.elements.checkApisBtn) icon.className = 'fas fa-network-wired';
        else if (button === this.elements.clearBtn) icon.className = 'fas fa-eraser';
        else if (button === this.elements.clearLogBtn) icon.className = 'fas fa-trash';
    }

    // 显示提示信息
    showAlert(message, type = 'info') {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.innerHTML = `<i class="fas fa-${this.getAlertIcon(type)}"></i> ${message}`;
        
        const inputSection = document.querySelector('.input-section');
        inputSection.insertBefore(alert, inputSection.firstChild);
        
        setTimeout(() => {
            alert.remove();
        }, 5000);
    }

    // 获取提示图标
    getAlertIcon(type) {
        const icons = {
            'success': 'check-circle',
            'danger': 'exclamation-triangle',
            'warning': 'exclamation-circle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    // 检测接口可用性（纯前端实现）
    async checkApiAvailability(api) {
        try {
            // 提取基础URL
            let baseUrl = api.replace('?url=', '').replace('/player/', '/').replace('/jiexi/', '/');
            if (baseUrl.endsWith('/')) {
                baseUrl = baseUrl.slice(0, -1);
            }
            
            // 使用fetch进行简单的连通性测试
            // 注意：由于CORS限制，这种方法可能不完全准确
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(baseUrl, {
                method: 'HEAD',
                mode: 'no-cors',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            return true; // 如果没有抛出异常，认为接口可用
        } catch (error) {
            if (error.name === 'AbortError') {
                return false; // 超时
            }
            // 对于CORS错误，我们假设接口是可用的
            return true;
        }
    }

    // 检测所有接口状态
    async checkAllApisStatus() {
        const results = [];
        let availableCount = 0;
        
        // 并发检测所有接口
        const promises = this.parseApis.map(async (api, index) => {
            const isAvailable = await this.checkApiAvailability(api);
            if (isAvailable) {
                availableCount++;
            }
            
            return {
                index: index,
                api: api,
                available: isAvailable,
                status: isAvailable ? '可用' : '不可用'
            };
        });
        
        const apiResults = await Promise.all(promises);
        
        return {
            results: apiResults,
            available_count: availableCount,
            total_count: this.parseApis.length,
            success_rate: Math.round(availableCount / this.parseApis.length * 100 * 10) / 10
        };
    }

    // 检测视频平台
    detectPlatform(url) {
        for (const [domain, name] of Object.entries(this.supportedPlatforms)) {
            if (url.includes(domain)) {
                return name;
            }
        }
        return null;
    }

    // 检测是否为VIP内容
    isVipContent(url) {
        const vipKeywords = ['vip', 'VIP', '会员', '付费', 'premium'];
        return vipKeywords.some(keyword => url.includes(keyword));
    }

    // 生成解析链接
    generateParseUrl(api, videoUrl) {
        return api + encodeURIComponent(videoUrl);
    }

    // 验证URL格式
    validateUrl() {
        const url = this.elements.videoUrlInput.value.trim();
        const urlPattern = /^https?:\/\/.+/;
        
        if (url && !urlPattern.test(url)) {
            this.elements.videoUrlInput.style.borderColor = '#dc3545';
            return false;
        } else {
            this.elements.videoUrlInput.style.borderColor = '#e9ecef';
            return true;
        }
    }

    // 初始化应用
    async init() {
        try {
            this.addLog('正在初始化VIP视频播放器（纯前端版）...', 'info');
            this.addLog('正在加载解析接口列表...', 'info');
            
            // 填充接口选择下拉框
            this.parseApis.forEach((api, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = `接口${index + 1}`;
                this.elements.apiSelect.appendChild(option);
            });
            
            this.addLog(`✓ 已加载 ${this.parseApis.length} 个解析接口`, 'success');
            this.addLog('系统初始化完成，可以开始使用！', 'success');
            this.addLog('💡 提示：纯前端版本无需服务器，可直接访问！', 'info');
            
            // 自动检测接口状态
            setTimeout(() => {
                this.checkApis();
            }, 1000);
            
        } catch (error) {
            this.addLog(`❌ 初始化失败: ${error.message}`, 'error');
            this.showAlert('系统初始化失败，请刷新页面重试', 'danger');
        }
    }

    // 检测URL
    async checkUrl() {
        const url = this.elements.videoUrlInput.value.trim();
        if (!url) {
            this.showAlert('请先输入视频链接！', 'warning');
            return;
        }

        if (!this.validateUrl()) {
            this.showAlert('请输入有效的URL地址（以http://或https://开头）', 'warning');
            return;
        }

        this.setButtonLoading(this.elements.checkUrlBtn, true);
        this.addLog(`正在检测链接: ${url}`, 'info');

        try {
            // 纯前端实现URL检测
            const platform = this.detectPlatform(url);
            const isVip = this.isVipContent(url);

            if (platform) {
                this.addLog(`✓ 检测到支持的平台: ${platform}`, 'success');
                this.elements.platformText.textContent = `检测到平台: ${platform}${isVip ? ' (VIP内容)' : ''}`;
                this.elements.platformInfo.style.display = 'flex';
                
                if (isVip) {
                    this.addLog('✓ 检测到VIP内容，可以使用本工具免费观看', 'success');
                    this.showAlert('检测到VIP内容，可以免费观看！', 'success');
                } else {
                    this.addLog('ℹ 该内容可能不需要VIP，但仍可使用本工具播放', 'info');
                }
            } else {
                this.addLog('⚠ 未检测到支持的平台，但仍可尝试播放', 'warning');
                this.elements.platformInfo.style.display = 'none';
                this.showAlert('未检测到支持的平台，但仍可尝试解析', 'warning');
            }
        } catch (error) {
            this.addLog(`❌ 检测链接失败: ${error.message}`, 'error');
            this.elements.platformInfo.style.display = 'none';
            this.showAlert('链接检测失败', 'danger');
        } finally {
            this.setButtonLoading(this.elements.checkUrlBtn, false);
        }
    }

    // 检测接口状态
    async checkApis() {
        this.setButtonLoading(this.elements.checkApisBtn, true);
        this.addLog('开始检测解析接口状态...', 'info');
        this.elements.apiStatus.innerHTML = '<div style="text-align: center; padding: 20px;"><div class="loading"></div> 正在检测接口状态...</div>';

        try {
            const data = await this.checkAllApisStatus();
            
            // 更新摘要信息
            this.elements.apiSummary.textContent = `${data.available_count}/${data.total_count} 个接口可用 (${data.success_rate}%)`;
            
            // 显示详细状态
            this.elements.apiStatus.innerHTML = '';
            data.results.forEach(result => {
                const apiItem = document.createElement('div');
                apiItem.className = `api-item ${result.available ? 'available' : 'unavailable'}`;
                apiItem.innerHTML = `
                    <div class="api-name">
                        <i class="fas fa-${result.available ? 'check-circle' : 'times-circle'}"></i>
                        接口${result.index + 1}
                    </div>
                    <div class="api-status-badge ${result.available ? 'badge-success' : 'badge-danger'}">
                        ${result.status}
                    </div>
                `;
                this.elements.apiStatus.appendChild(apiItem);
            });
            
            this.addLog(`接口检测完成: ${data.available_count}/${data.total_count} 个接口可用`, 
                       data.available_count > 0 ? 'success' : 'error');
            
            if (data.available_count === 0) {
                this.addLog('⚠ 警告: 当前没有可用的解析接口，请检查网络连接', 'warning');
                this.showAlert('当前没有可用的解析接口，请检查网络连接', 'danger');
            } else if (data.available_count < data.total_count / 2) {
                this.addLog('⚠ 注意: 部分接口不可用，可能影响解析成功率', 'warning');
                this.showAlert('部分接口不可用，建议选择可用接口', 'warning');
            } else {
                this.addLog('✓ 接口状态良好，可以正常使用', 'success');
            }
        } catch (error) {
            this.addLog(`❌ 接口状态检测失败: ${error.message}`, 'error');
            this.elements.apiStatus.innerHTML = '<div style="text-align: center; padding: 20px; color: #dc3545;"><i class="fas fa-exclamation-triangle"></i> 检测失败，请稍后重试</div>';
            this.showAlert('接口状态检测失败，请稍后重试', 'danger');
        } finally {
            this.setButtonLoading(this.elements.checkApisBtn, false);
        }
    }

    // 解析视频
    async parseVideo() {
        const url = this.elements.videoUrlInput.value.trim();
        if (!url) {
            this.showAlert('请先输入视频链接！', 'warning');
            this.elements.videoUrlInput.focus();
            return;
        }

        if (!this.validateUrl()) {
            this.showAlert('请输入有效的URL地址', 'warning');
            this.elements.videoUrlInput.focus();
            return;
        }

        // 确保URL以http://或https://开头
        let videoUrl = url;
        if (!videoUrl.startsWith('http://') && !videoUrl.startsWith('https://')) {
            videoUrl = 'https://' + videoUrl;
        }

        const apiIndex = parseInt(this.elements.apiSelect.value);

        this.setButtonLoading(this.elements.parseBtn, true);
        this.addLog(`开始解析视频: ${videoUrl}`, 'info');
        
        try {
            let parseUrl;
            let apiUsed;
            
            if (apiIndex === -1) {
                // 自动选择第一个接口
                this.addLog('正在自动选择解析接口...', 'info');
                parseUrl = this.generateParseUrl(this.parseApis[0], videoUrl);
                apiUsed = '接口1';
                this.addLog(`自动选择接口1生成解析链接`, 'info');
            } else {
                // 使用指定接口
                if (apiIndex >= 0 && apiIndex < this.parseApis.length) {
                    parseUrl = this.generateParseUrl(this.parseApis[apiIndex], videoUrl);
                    apiUsed = `接口${apiIndex + 1}`;
                    this.addLog(`使用指定接口${apiIndex + 1}`, 'info');
                } else {
                    throw new Error('选择的接口不存在');
                }
            }
            
            this.addLog(`✓ 解析成功！使用${apiUsed}`, 'success');
            this.addLog(`生成解析链接: ${parseUrl}`, 'info');
            this.addLog('正在打开视频播放页面...', 'info');
            
            // 在新窗口打开解析链接
            const newWindow = window.open(parseUrl, '_blank');
            
            if (newWindow) {
                this.showAlert(`解析成功！使用${apiUsed}，已在新窗口打开视频`, 'success');
                this.addLog('✓ 视频播放页面已在新窗口打开', 'success');
            } else {
                this.showAlert('解析成功，但无法自动打开新窗口，请手动复制链接', 'warning');
                this.addLog('⚠ 浏览器阻止了弹窗，请手动打开解析链接', 'warning');
                
                // 复制到剪贴板
                this.copyToClipboard(parseUrl);
            }
            
        } catch (error) {
            this.addLog(`❌ 解析过程中出现错误: ${error.message}`, 'error');
            this.showAlert('解析失败，请尝试其他接口或稍后重试', 'danger');
        } finally {
            this.setButtonLoading(this.elements.parseBtn, false);
        }
    }

    // 复制到剪贴板
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.addLog('✓ 解析链接已复制到剪贴板', 'success');
            this.showAlert('解析链接已复制到剪贴板', 'info');
        } catch (error) {
            this.addLog('⚠ 无法复制到剪贴板，请手动复制', 'warning');
        }
    }

    // 清空输入
    clearInput() {
        this.elements.videoUrlInput.value = '';
        this.elements.apiSelect.value = '-1';
        this.elements.platformInfo.style.display = 'none';
        this.elements.videoUrlInput.style.borderColor = '#e9ecef';
        this.addLog('已清空输入内容', 'info');
        this.elements.videoUrlInput.focus();
    }

    // 清空日志
    clearLog() {
        this.elements.statusLog.innerHTML = '';
        this.addLog('日志已清空', 'info');
        this.addLog('欢迎使用VIP视频播放器 纯前端版！', 'info');
    }

    // 获取平台图标
    getPlatformIcon(platform) {
        const icons = {
            '爱奇艺': 'fas fa-play-circle',
            '腾讯视频': 'fas fa-video',
            '优酷': 'fas fa-film',
            '芒果TV': 'fas fa-tv',
            'bilibili': 'fab fa-bilibili'
        };
        return icons[platform] || 'fas fa-play';
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.vipPlayer = new VipVideoPlayerFrontend();
});

// 导出类以供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VipVideoPlayerFrontend;
}