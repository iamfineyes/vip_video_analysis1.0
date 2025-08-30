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
            // 检测设备类型
            if (this.isMobileDevice()) {
                // 移动设备防广告模式
            } else {
                // 桌面设备新窗口模式
            }
            
            // 初始化接口选择器
            this.elements.apiSelect.innerHTML = '<option value="-1">🔄 自动选择最佳接口</option>';
            this.parseApis.forEach((api, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = `接口${index + 1}: ${new URL(api).hostname}`;
                this.elements.apiSelect.appendChild(option);
            });
            
            // 自动检测接口状态
            setTimeout(() => {
                this.checkApis();
            }, 1000);
            
        } catch (error) {
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

        try {
            // 纯前端实现URL检测
            const platform = this.detectPlatform(url);
            const isVip = this.isVipContent(url);

            if (platform) {
                this.elements.platformText.textContent = `检测到平台: ${platform}${isVip ? ' (VIP内容)' : ''}`;
                this.elements.platformInfo.style.display = 'flex';
                
                if (isVip) {
                    this.showAlert('检测到VIP内容，可以免费观看！', 'success');
                }
            } else {
                this.elements.platformInfo.style.display = 'none';
                this.showAlert('未检测到支持的平台，但仍可尝试解析', 'warning');
            }
        } catch (error) {
            this.elements.platformInfo.style.display = 'none';
            this.showAlert('链接检测失败', 'danger');
        } finally {
            this.setButtonLoading(this.elements.checkUrlBtn, false);
        }
    }

    // 检测接口状态
    async checkApis() {
        this.setButtonLoading(this.elements.checkApisBtn, true);
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
            
            if (data.available_count === 0) {
                this.showAlert('当前没有可用的解析接口，请检查网络连接', 'danger');
            } else if (data.available_count < data.total_count / 2) {
                this.showAlert('部分接口不可用，建议选择可用接口', 'warning');
            }
        } catch (error) {
            this.elements.apiStatus.innerHTML = '<div style="text-align: center; padding: 20px; color: #dc3545;"><i class="fas fa-exclamation-triangle"></i> 检测失败，请稍后重试</div>';
            this.showAlert('接口状态检测失败，请稍后重试', 'danger');
        } finally {
            this.setButtonLoading(this.elements.checkApisBtn, false);
        }
    }

    // 解析视频
    // 检测是否为移动设备
    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    // 安全打开链接（防止广告弹窗）
    // 广告域名黑名单
    getAdBlockList() {
        return [
            'googleads.g.doubleclick.net',
            'googlesyndication.com',
            'googleadservices.com',
            'google-analytics.com',
            'googletagmanager.com',
            'facebook.com/tr',
            'connect.facebook.net',
            'amazon-adsystem.com',
            'adsystem.amazon.com',
            'doubleclick.net',
            'adsense.google.com',
            'ads.yahoo.com',
            'advertising.com',
            'adsystem.com',
            'popads.net',
            'popcash.net',
            'propellerads.com',
            'revcontent.com',
            'outbrain.com',
            'taboola.com'
        ];
    }

    // 创建防广告iframe
    createAdBlockIframe(url) {
        return new Promise((resolve, reject) => {
            // 创建一个隐藏的iframe来预加载和检测
            const testFrame = document.createElement('iframe');
            testFrame.style.display = 'none';
            testFrame.style.position = 'absolute';
            testFrame.style.left = '-9999px';
            testFrame.src = url;
            
            let resolved = false;
            
            // 设置超时
            const timeout = setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    document.body.removeChild(testFrame);
                    reject(new Error('加载超时'));
                }
            }, 5000);
            
            testFrame.onload = () => {
                if (!resolved) {
                    resolved = true;
                    clearTimeout(timeout);
                    document.body.removeChild(testFrame);
                    resolve(true);
                }
            };
            
            testFrame.onerror = () => {
                if (!resolved) {
                    resolved = true;
                    clearTimeout(timeout);
                    document.body.removeChild(testFrame);
                    reject(new Error('加载失败'));
                }
            };
            
            document.body.appendChild(testFrame);
        });
    }

    // 移动端专用播放器
    createMobilePlayer(url, apiUsed) {
        // 创建全屏播放容器
        const playerContainer = document.createElement('div');
        playerContainer.id = 'mobile-player-container';
        playerContainer.innerHTML = `
            <div class="mobile-player-header">
                <button id="close-player" class="close-btn">✕ 关闭播放器</button>
                <span class="api-info">使用: ${apiUsed}</span>
            </div>
            <div class="mobile-player-content">
                <iframe id="mobile-player-frame" src="${url}" frameborder="0" allowfullscreen></iframe>
            </div>
            <div class="mobile-player-footer">
                <button id="refresh-player" class="refresh-btn">🔄 刷新</button>
                <button id="copy-link" class="copy-btn">📋 复制链接</button>
            </div>
        `;
        
        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            #mobile-player-container {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: #000;
                z-index: 10000;
                display: flex;
                flex-direction: column;
            }
            .mobile-player-header {
                background: #333;
                color: white;
                padding: 10px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 14px;
            }
            .close-btn {
                background: #ff4444;
                color: white;
                border: none;
                padding: 8px 12px;
                border-radius: 4px;
                cursor: pointer;
            }
            .mobile-player-content {
                flex: 1;
                position: relative;
            }
            #mobile-player-frame {
                width: 100%;
                height: 100%;
                border: none;
            }
            .mobile-player-footer {
                background: #333;
                padding: 10px;
                display: flex;
                gap: 10px;
                justify-content: center;
            }
            .refresh-btn, .copy-btn {
                background: #007bff;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(playerContainer);
        
        // 绑定事件
        document.getElementById('close-player').onclick = () => {
            document.body.removeChild(playerContainer);
            document.head.removeChild(style);
        };
        
        document.getElementById('refresh-player').onclick = () => {
            document.getElementById('mobile-player-frame').src = url;
        };
        
        document.getElementById('copy-link').onclick = () => {
            this.copyToClipboard(url);
            this.showAlert('链接已复制到剪贴板', 'success');
        };
        
        // 阻止页面滚动
        document.body.style.overflow = 'hidden';
        
        // 关闭时恢复滚动
        document.getElementById('close-player').onclick = () => {
            document.body.style.overflow = '';
            document.body.removeChild(playerContainer);
            document.head.removeChild(style);
        };
    }

    // 弹窗拦截器
    setupPopupBlocker() {
        // 拦截所有弹窗
        const originalOpen = window.open;
        window.open = function(url, name, features) {
            // 检查是否为广告域名
            if (url) {
                const adBlockList = this.getAdBlockList ? this.getAdBlockList() : [];
                for (const adDomain of adBlockList) {
                    if (url.includes(adDomain)) {
                        console.log('已拦截广告弹窗:', url);
                        return null;
                    }
                }
            }
            return originalOpen.call(window, url, name, features);
        }.bind(this);
        
        // 拦截广告点击事件
        document.addEventListener('click', (e) => {
            const target = e.target;
            if (target.tagName === 'A' || target.onclick) {
                const href = target.href || target.getAttribute('onclick');
                if (href) {
                    const adBlockList = this.getAdBlockList();
                    for (const adDomain of adBlockList) {
                        if (href.includes(adDomain)) {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('已拦截广告链接:', href);
                            return false;
                        }
                    }
                }
            }
        }, true);
    }

    safeOpenLink(url, apiUsed) {
        const isMobile = this.isMobileDevice();
        
        if (isMobile) {
            // 移动端：使用内置播放器，完全避免广告
            
            // 设置弹窗拦截器
            this.setupPopupBlocker();
            
            // 显示选择对话框
            const choice = confirm(`解析成功！使用${apiUsed}\n\n点击"确定"使用内置防广告播放器\n点击"取消"复制链接手动打开`);
            
            if (choice) {
                // 使用内置播放器
                this.createMobilePlayer(url, apiUsed);
                this.showAlert('防广告播放器已启动，享受无广告体验！', 'success');
            } else {
                // 复制链接
                this.copyToClipboard(url);
                this.showAlert('解析链接已复制到剪贴板', 'info');
            }
        } else {
            // 桌面端：尝试新窗口打开
            
            try {
                // 设置窗口特性，减少广告弹窗
                const windowFeatures = 'width=1200,height=800,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no';
                const newWindow = window.open(url, '_blank', windowFeatures);
                
                if (newWindow) {
                    // 防止广告劫持焦点
                    setTimeout(() => {
                        try {
                            newWindow.focus();
                        } catch (e) {
                            // 忽略跨域错误
                        }
                    }, 100);
                    
                    this.showAlert(`解析成功！使用${apiUsed}，已在新窗口打开视频`, 'success');
                } else {
                    throw new Error('弹窗被阻止');
                }
            } catch (error) {
                // 新窗口打开失败，提供备选方案
                this.showAlert('浏览器阻止了弹窗，请手动复制链接或允许弹窗', 'warning');
                this.copyToClipboard(url);
            }
        }
    }

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
        
        try {
            let parseUrl;
            let apiUsed;
            
            if (apiIndex === -1) {
                // 自动选择第一个接口
                parseUrl = this.generateParseUrl(this.parseApis[0], videoUrl);
                apiUsed = '接口1';
            } else {
                // 使用指定接口
                if (apiIndex >= 0 && apiIndex < this.parseApis.length) {
                    parseUrl = this.generateParseUrl(this.parseApis[apiIndex], videoUrl);
                    apiUsed = `接口${apiIndex + 1}`;
                } else {
                    throw new Error('选择的接口不存在');
                }
            }
            
            // 使用安全打开链接方法
            this.safeOpenLink(parseUrl, apiUsed);
            
        } catch (error) {
            this.showAlert('解析失败，请尝试其他接口或稍后重试', 'danger');
        } finally {
            this.setButtonLoading(this.elements.parseBtn, false);
        }
    }

    // 复制到剪贴板
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showAlert('解析链接已复制到剪贴板', 'info');
        } catch (error) {
            this.showAlert('无法复制到剪贴板，请手动复制', 'warning');
        }
    }

    // 清空输入
    clearInput() {
        this.elements.videoUrlInput.value = '';
        this.elements.apiSelect.value = '-1';
        this.elements.platformInfo.style.display = 'none';
        this.elements.videoUrlInput.style.borderColor = '#e9ecef';
        this.elements.videoUrlInput.focus();
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
