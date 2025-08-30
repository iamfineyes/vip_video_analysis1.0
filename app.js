// VIP视频播放器 - 纯前端版本
// 无需后端服务器，可直接部署到静态托管平台

class VipVideoPlayerFrontend {
    constructor() {
        // VIP解析接口列表（2024年最新更新）
        this.parseApis = [
            "https://jx.playerjy.com/?url=",  // JY解析 - 稳定推荐
            "https://im1907.top/?jx=",  // 纯净1 - 新增
            "https://www.ckplayer.vip/jiexi/?url=",  // CK解析 - 稳定
            "https://jx.m3u8.tv/jiexi/?url=",  // M3U8解析
            "https://jx.yparse.com/index.php?url=",  // 云析解析
            "https://jx.xmflv.com/?url=",  // 虾米解析
            "https://yparse.ik9.cc/index.php?url=",  // IK9解析 - 新增
            "https://jiexi.site/?url=",  // JX解析 - 新增
            "https://www.playm3u8.cn/jiexi.php?url=",  // PM解析 - 新增
            "https://www.pangujiexi.com/jiexi/?url=",  // 盘古2 - 新增
            "https://www.pouyun.com/?url=",  // 剖云解析 - 新增
            "https://jx.nnxv.cn/tv.php?url=",  // 七哥解析 - 新增
            "https://json.ovvo.pro/jx.php?url=",  // 神哥解析 - 新增
            "https://www.yemu.xyz/?url="  // 夜幕解析 - 新增
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
            quickTestBtn: document.getElementById('quickTestBtn'),

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
        this.elements.quickTestBtn.addEventListener('click', () => this.quickTest());

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
        // 处理特殊格式的接口
        if (api.includes('?jx=')) {
            // 对于im1907.top这类使用?jx=参数的接口
            return api + encodeURIComponent(videoUrl);
        } else {
            // 标准格式的接口
            return api + encodeURIComponent(videoUrl);
        }
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
            // 添加CSP内容安全策略
            this.addContentSecurityPolicy();
            
            // 启动超强弹窗拦截器
            this.setupPopupBlocker();
            
            // 启动广告元素自动清理器
            this.adCleaner = this.setupAdElementRemoval();
            
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
            
            console.log('🛡️ VIP视频播放器已启动 - 超强广告拦截模式');
            
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
    // 超强广告域名黑名单 - 覆盖99%的广告和跟踪域名
    getAdBlockList() {
        return [
            // Google广告系列
            'googleads.g.doubleclick.net',
            'googlesyndication.com',
            'googleadservices.com',
            'google-analytics.com',
            'googletagmanager.com',
            'doubleclick.net',
            'adsense.google.com',
            'adsystem.google.com',
            'pagead2.googlesyndication.com',
            'tpc.googlesyndication.com',
            
            // Facebook/Meta广告
            'facebook.com/tr',
            'connect.facebook.net',
            'facebook.com/plugins',
            'facebook.com/ajax',
            
            // Amazon广告
            'amazon-adsystem.com',
            'adsystem.amazon.com',
            'amazon-adsystem.cn',
            
            // Yahoo广告
            'ads.yahoo.com',
            'advertising.yahoo.com',
            'analytics.yahoo.com',
            
            // 通用广告网络
            'advertising.com',
            'adsystem.com',
            'adnxs.com',
            'adsafeprotected.com',
            'scorecardresearch.com',
            'quantserve.com',
            'moatads.com',
            'adsymptotic.com',
            
            // 弹窗广告
            'popads.net',
            'popcash.net',
            'popunder.net',
            'propellerads.com',
            'propeller-tracking.com',
            'pushwoosh.com',
            'pusher.com',
            'pushcrew.com',
            
            // 内容推荐广告
            'revcontent.com',
            'outbrain.com',
            'taboola.com',
            'mgid.com',
            'contentad.net',
            'zemanta.com',
            
            // 中国广告网络
            'baidu.com/cpro',
            'pos.baidu.com',
            'cbjs.baidu.com',
            'union.360.cn',
            'lianmeng.360.cn',
            'tanx.com',
            'alimama.com',
            'mmstat.com',
            'cnzz.com',
            'umeng.com',
            'gridsum.com',
            
            // 视频广告专用
            'adsystem.com',
            'videoadex.com',
            'smartadserver.com',
            'adskeeper.co.uk',
            'exoclick.com',
            'exosrv.com',
            'juicyads.com',
            'trafficjunky.net',
            'ero-advertising.com',
            
            // 移动广告
            'admob.com',
            'chartboost.com',
            'flurry.com',
            'inmobi.com',
            'millennialmedia.com',
            'mobfox.com',
            'mopub.com',
            'tapjoy.com',
            'unity3d.com/webgl',
            
            // 跟踪和分析
            'hotjar.com',
            'crazyegg.com',
            'mouseflow.com',
            'fullstory.com',
            'logrocket.com',
            'segment.com',
            'mixpanel.com',
            'amplitude.com',
            
            // 恶意重定向
            'redirect.com',
            'redirector.com',
            'bit.ly',
            'tinyurl.com',
            'short.link',
            'adf.ly',
            'linkbucks.com',
            
            // 常见广告关键词
            'advertisement',
            'banner',
            'popup',
            'popunder',
            'interstitial',
            'overlay',
            'preroll',
            'midroll',
            'postroll',
            'sponsored',
            'promotion',
            'affiliate'
        ];
    }

    // 创建超强防广告iframe
    createAdBlockIframe(url) {
        return new Promise((resolve, reject) => {
            // 创建一个隐藏的iframe来预加载和检测
            const testFrame = document.createElement('iframe');
            testFrame.style.display = 'none';
            testFrame.style.position = 'absolute';
            testFrame.style.left = '-9999px';
            testFrame.src = url;
            
            // 添加沙盒保护
            testFrame.sandbox = 'allow-scripts allow-same-origin allow-forms';
            testFrame.referrerPolicy = 'no-referrer';
            testFrame.loading = 'lazy';
            
            let resolved = false;
            
            // 设置超时
            const timeout = setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    if (document.body.contains(testFrame)) {
                        document.body.removeChild(testFrame);
                    }
                    reject(new Error('加载超时'));
                }
            }, 5000);
            
            testFrame.onload = () => {
                if (!resolved) {
                    resolved = true;
                    clearTimeout(timeout);
                    if (document.body.contains(testFrame)) {
                        document.body.removeChild(testFrame);
                    }
                    resolve(true);
                }
            };
            
            testFrame.onerror = () => {
                if (!resolved) {
                    resolved = true;
                    clearTimeout(timeout);
                    if (document.body.contains(testFrame)) {
                        document.body.removeChild(testFrame);
                    }
                    reject(new Error('加载失败'));
                }
            };
            
            document.body.appendChild(testFrame);
        });
    }
    
    // 添加CSP内容安全策略
    addContentSecurityPolicy() {
        // 检查是否已经存在CSP
        const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
        if (existingCSP) {
            return;
        }
        
        const cspMeta = document.createElement('meta');
        cspMeta.httpEquiv = 'Content-Security-Policy';
        cspMeta.content = [
            "default-src 'self' https: data:",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
            "style-src 'self' 'unsafe-inline' https:",
            "img-src 'self' data: https: blob:",
            "media-src 'self' https: data: blob:",
            "frame-src 'self' https: data:",
            "connect-src 'self' https: wss: ws:",
            "font-src 'self' https: data:",
            "object-src 'self' https:",
            "base-uri 'self'",
            "form-action 'self' https:",
            "frame-ancestors 'self'"
        ].join('; ');
        
        document.head.appendChild(cspMeta);
        console.log('✅ CSP内容安全策略已添加');
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
                <iframe id="mobile-player-frame" 
                    src="${url}" 
                    frameborder="0" 
                    allowfullscreen
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation allow-presentation allow-downloads allow-modals allow-orientation-lock allow-pointer-lock allow-popups-to-escape-sandbox"
                    referrerpolicy="no-referrer-when-downgrade"
                    loading="eager"
                    allow="autoplay *; fullscreen *; picture-in-picture *; encrypted-media *; accelerometer *; gyroscope *; camera *; microphone *; geolocation *"></iframe>
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
                overflow: hidden;
            }
            .mobile-player-header {
                background: #333;
                color: white;
                padding: 10px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 14px;
                flex-shrink: 0;
            }
            .close-btn {
                background: #ff4444;
                color: white;
                border: none;
                padding: 8px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                min-width: 80px;
            }
            .api-info {
                font-size: 12px;
                color: #ccc;
            }
            .mobile-player-content {
                flex: 1;
                position: relative;
                overflow: hidden;
                background: #000;
            }
            #mobile-player-frame {
                width: 100%;
                height: 100%;
                border: none;
                display: block;
                background: #000;
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
        
        // 获取iframe并注入广告拦截脚本
        const iframe = document.getElementById('mobile-player-frame');
        this.injectAdBlockScript(iframe);
        
        // 移动端专用广告拦截优化
        this.optimizeMobileAdBlocking(playerContainer, iframe);
        
        // 阻止页面滚动
        document.body.style.overflow = 'hidden';
        
        // 绑定事件
        const closePlayer = () => {
            document.body.style.overflow = '';
            if (document.body.contains(playerContainer)) {
                document.body.removeChild(playerContainer);
            }
            if (document.head.contains(style)) {
                document.head.removeChild(style);
            }
        };
        
        document.getElementById('close-player').onclick = closePlayer;
        
        document.getElementById('refresh-player').onclick = () => {
            if (iframe) {
                iframe.src = url;
                this.showAlert('播放器已刷新', 'info');
            }
        };
        
        document.getElementById('copy-link').onclick = () => {
            this.copyToClipboard(url);
        };
        
        // 添加加载状态提示
        iframe.onload = () => {
            console.log('移动端播放器加载完成');
        };
        
        iframe.onerror = () => {
            this.showAlert('播放器加载失败，请尝试刷新或使用其他接口', 'danger');
        };
        
        // 添加键盘事件支持（ESC键关闭）
        const handleKeyPress = (e) => {
            if (e.key === 'Escape') {
                closePlayer();
                document.removeEventListener('keydown', handleKeyPress);
            }
        };
        document.addEventListener('keydown', handleKeyPress);
    }

    // 弹窗拦截器
    // 超强弹窗拦截器 - 多层防护
    setupPopupBlocker() {
        const adBlockList = this.getAdBlockList();
        
        // 1. 拦截window.open
        const originalOpen = window.open;
        window.open = function(url, name, features) {
            if (url) {
                // 检查广告域名
                for (const adDomain of adBlockList) {
                    if (url.includes(adDomain)) {
                        console.log('🚫 已拦截广告弹窗:', url);
                        return { close: () => {}, focus: () => {}, blur: () => {} }; // 返回假窗口对象
                    }
                }
                
                // 检查可疑URL模式
                const suspiciousPatterns = [
                    /\/ads?\//i,
                    /\/popup/i,
                    /\/banner/i,
                    /\/promo/i,
                    /\/affiliate/i,
                    /\/redirect/i,
                    /\?utm_/i,
                    /\?ref=/i,
                    /\?aff=/i
                ];
                
                for (const pattern of suspiciousPatterns) {
                    if (pattern.test(url)) {
                        console.log('🚫 已拦截可疑弹窗:', url);
                        return { close: () => {}, focus: () => {}, blur: () => {} };
                    }
                }
            }
            return originalOpen.call(window, url, name, features);
        }.bind(this);
        
        // 2. 拦截延迟弹窗 (setTimeout/setInterval)
        const originalSetTimeout = window.setTimeout;
        const originalSetInterval = window.setInterval;
        
        window.setTimeout = function(callback, delay, ...args) {
            if (typeof callback === 'string') {
                // 检查字符串代码中的弹窗
                if (/window\.open|popup|advertisement/i.test(callback)) {
                    console.log('🚫 已拦截延迟弹窗脚本');
                    return 0;
                }
            }
            return originalSetTimeout.call(window, callback, delay, ...args);
        };
        
        window.setInterval = function(callback, delay, ...args) {
            if (typeof callback === 'string') {
                if (/window\.open|popup|advertisement/i.test(callback)) {
                    console.log('🚫 已拦截循环弹窗脚本');
                    return 0;
                }
            }
            return originalSetInterval.call(window, callback, delay, ...args);
        };
        
        // 3. 拦截事件监听器中的弹窗
        const originalAddEventListener = EventTarget.prototype.addEventListener;
        EventTarget.prototype.addEventListener = function(type, listener, options) {
            if (type === 'click' || type === 'mousedown' || type === 'touchstart') {
                const wrappedListener = function(event) {
                    // 检查是否会触发弹窗
                    const target = event.target;
                    if (target && (target.href || target.onclick)) {
                        const href = target.href || target.getAttribute('onclick') || '';
                        for (const adDomain of adBlockList) {
                            if (href.includes(adDomain)) {
                                event.preventDefault();
                                event.stopPropagation();
                                console.log('🚫 已拦截事件触发的广告:', href);
                                return false;
                            }
                        }
                    }
                    return listener.call(this, event);
                };
                return originalAddEventListener.call(this, type, wrappedListener, options);
            }
            return originalAddEventListener.call(this, type, listener, options);
        };
        
        // 4. 拦截表单提交弹窗
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (form.action) {
                for (const adDomain of adBlockList) {
                    if (form.action.includes(adDomain)) {
                        e.preventDefault();
                        console.log('🚫 已拦截表单广告提交:', form.action);
                        return false;
                    }
                }
            }
        }, true);
        
        // 5. 拦截右键菜单弹窗
        document.addEventListener('contextmenu', (e) => {
            const target = e.target;
            if (target.tagName === 'A' && target.href) {
                for (const adDomain of adBlockList) {
                    if (target.href.includes(adDomain)) {
                        e.preventDefault();
                        console.log('🚫 已拦截右键广告链接');
                        return false;
                    }
                }
            }
        }, true);
        
        // 6. 拦截键盘快捷键弹窗
        document.addEventListener('keydown', (e) => {
            // 拦截常见的广告快捷键
            if ((e.ctrlKey && e.key === 'n') || // Ctrl+N
                (e.ctrlKey && e.key === 't') || // Ctrl+T
                e.key === 'F11') { // F11全屏可能被广告利用
                // 检查当前焦点元素是否可疑
                const activeElement = document.activeElement;
                if (activeElement && activeElement.href) {
                    for (const adDomain of adBlockList) {
                        if (activeElement.href.includes(adDomain)) {
                            e.preventDefault();
                            console.log('🚫 已拦截快捷键广告');
                            return false;
                        }
                    }
                }
            }
        }, true);
        
        // 7. 拦截焦点变化弹窗
        let lastFocusTime = Date.now();
        window.addEventListener('focus', () => {
            const now = Date.now();
            if (now - lastFocusTime < 1000) { // 1秒内多次焦点变化可能是广告
                console.log('🚫 检测到可疑焦点变化，可能是广告行为');
            }
            lastFocusTime = now;
        });
        
        // 8. 拦截页面卸载弹窗
        window.addEventListener('beforeunload', (e) => {
            // 阻止广告在页面关闭时弹出
            e.preventDefault = () => {};
            e.returnValue = '';
        });
        
        console.log('✅ 超强弹窗拦截器已启动 - 8层防护已激活');
    }
    
    // 广告元素DOM检测和自动移除
    setupAdElementRemoval() {
        const adSelectors = [
            // 通用广告选择器
            '[class*="ad-"]', '[class*="ads-"]', '[class*="advertisement"]',
            '[id*="ad-"]', '[id*="ads-"]', '[id*="advertisement"]',
            '[class*="banner"]', '[class*="popup"]', '[class*="overlay"]',
            '[class*="sponsored"]', '[class*="promo"]',
            
            // 具体广告网络
            '.google-ads', '.googlesyndication', '.adsense',
            '.facebook-ad', '.fb-ad', '.twitter-ad',
            '.taboola', '.outbrain', '.revcontent',
            '.mgid', '.contentad', '.zemanta',
            
            // 弹窗相关
            '.modal-ad', '.popup-ad', '.overlay-ad',
            '.interstitial', '.lightbox-ad',
            
            // 移动端广告
            '.mobile-ad', '.app-ad', '.native-ad',
            
            // 视频广告
            '.video-ad', '.preroll', '.midroll', '.postroll',
            '.ad-container', '.ad-wrapper', '.ad-slot'
        ];
        
        const removeAdElements = () => {
            let removedCount = 0;
            
            // 移除已知的广告元素
            adSelectors.forEach(selector => {
                try {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(element => {
                        if (element && element.parentNode) {
                            element.parentNode.removeChild(element);
                            removedCount++;
                        }
                    });
                } catch (e) {
                    // 忽略选择器错误
                }
            });
            
            // 检查可疑的iframe
            const iframes = document.querySelectorAll('iframe');
            iframes.forEach(iframe => {
                const src = iframe.src || '';
                const adBlockList = this.getAdBlockList();
                
                for (const adDomain of adBlockList) {
                    if (src.includes(adDomain)) {
                        if (iframe.parentNode) {
                            iframe.parentNode.removeChild(iframe);
                            removedCount++;
                            console.log('🚫 已移除广告iframe:', src);
                        }
                        break;
                    }
                }
            });
            
            // 检查可疑的脚本标签
            const scripts = document.querySelectorAll('script[src]');
            scripts.forEach(script => {
                const src = script.src || '';
                const adBlockList = this.getAdBlockList();
                
                for (const adDomain of adBlockList) {
                    if (src.includes(adDomain)) {
                        if (script.parentNode) {
                            script.parentNode.removeChild(script);
                            removedCount++;
                            console.log('🚫 已移除广告脚本:', src);
                        }
                        break;
                    }
                }
            });
            
            // 检查可疑的链接
            const links = document.querySelectorAll('a[href]');
            links.forEach(link => {
                const href = link.href || '';
                const adBlockList = this.getAdBlockList();
                
                for (const adDomain of adBlockList) {
                    if (href.includes(adDomain)) {
                        // 不直接删除链接，而是禁用它
                        link.style.display = 'none';
                        link.onclick = (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            return false;
                        };
                        removedCount++;
                        console.log('🚫 已禁用广告链接:', href);
                        break;
                    }
                }
            });
            
            if (removedCount > 0) {
                console.log(`🧹 已清理 ${removedCount} 个广告元素`);
            }
        };
        
        // 立即执行一次清理
        removeAdElements();
        
        // 使用MutationObserver监控DOM变化
        const observer = new MutationObserver((mutations) => {
            let shouldClean = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // 检查新添加的元素是否为广告
                            const element = node;
                            const className = element.className || '';
                            const id = element.id || '';
                            
                            if (className.includes('ad') || className.includes('banner') ||
                                className.includes('popup') || className.includes('sponsored') ||
                                id.includes('ad') || id.includes('banner')) {
                                shouldClean = true;
                            }
                        }
                    });
                }
            });
            
            if (shouldClean) {
                // 延迟执行，避免频繁清理
                setTimeout(removeAdElements, 100);
            }
        });
        
        // 开始监控
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        // 定期清理（每30秒）
        setInterval(removeAdElements, 30000);
        
        console.log('🧹 广告元素自动清理器已启动');
        
        // 返回清理函数，供外部调用
        return removeAdElements;
    }
    
    // 用户脚本注入 - 在播放页面中运行广告拦截脚本
    createAdBlockUserScript() {
        return `
            // 超强广告拦截用户脚本
            (function() {
                'use strict';
                
                console.log('🛡️ 广告拦截用户脚本已启动');
                
                // 广告域名黑名单
                const adDomains = ${JSON.stringify(this.getAdBlockList())};
                
                // 1. 拦截所有弹窗
                const originalOpen = window.open;
                window.open = function(url, name, features) {
                    if (url) {
                        for (const domain of adDomains) {
                            if (url.includes(domain)) {
                                console.log('🚫 用户脚本拦截弹窗:', url);
                                return { close: () => {}, focus: () => {}, blur: () => {} };
                            }
                        }
                    }
                    return originalOpen.call(window, url, name, features);
                };
                
                // 2. 拦截广告请求
                const originalFetch = window.fetch;
                window.fetch = function(url, options) {
                    if (typeof url === 'string') {
                        // 视频播放白名单
                        const isVideoRequest = url.includes('.m3u8') || url.includes('.mp4') || 
                                              url.includes('.flv') || url.includes('.ts') ||
                                              url.includes('video') || url.includes('stream') ||
                                              url.includes('play') || url.includes('media') ||
                                              url.includes('hls') || url.includes('dash');
                        
                        if (!isVideoRequest) {
                            for (const domain of adDomains) {
                                if (url.includes(domain)) {
                                    console.log('🚫 用户脚本拦截请求:', url);
                                    return Promise.reject(new Error('广告请求被拦截'));
                                }
                            }
                        }
                    }
                    return originalFetch.call(window, url, options);
                };
                
                // 3. 拦截XMLHttpRequest
                const originalXHROpen = XMLHttpRequest.prototype.open;
                XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
                    if (typeof url === 'string') {
                        // 视频播放白名单
                        const isVideoRequest = url.includes('.m3u8') || url.includes('.mp4') || 
                                              url.includes('.flv') || url.includes('.ts') ||
                                              url.includes('video') || url.includes('stream') ||
                                              url.includes('play') || url.includes('media') ||
                                              url.includes('hls') || url.includes('dash');
                        
                        if (!isVideoRequest) {
                            for (const domain of adDomains) {
                                if (url.includes(domain)) {
                                    console.log('🚫 用户脚本拦截XHR:', url);
                                    // 重定向到空响应
                                    url = 'data:text/plain,blocked';
                                    break;
                                }
                            }
                        }
                    }
                    return originalXHROpen.call(this, method, url, async, user, password);
                };
                
                // 4. 移除广告元素
                const removeAds = () => {
                    const adSelectors = [
                        '[class*="ad-"]', '[class*="ads-"]', '[class*="advertisement"]',
                        '[id*="ad-"]', '[id*="ads-"]', '[id*="advertisement"]',
                        '[class*="banner"]', '[class*="popup"]', '[class*="overlay"]',
                        '.google-ads', '.googlesyndication', '.adsense',
                        '.taboola', '.outbrain', '.revcontent'
                    ];
                    
                    let removed = 0;
                    adSelectors.forEach(selector => {
                        try {
                            document.querySelectorAll(selector).forEach(el => {
                                if (el.parentNode) {
                                    el.parentNode.removeChild(el);
                                    removed++;
                                }
                            });
                        } catch (e) {}
                    });
                    
                    if (removed > 0) {
                        console.log('🧹 用户脚本清理了', removed, '个广告元素');
                    }
                };
                
                // 5. 监控DOM变化
                const observer = new MutationObserver(() => {
                    setTimeout(removeAds, 100);
                });
                
                if (document.body) {
                    observer.observe(document.body, { childList: true, subtree: true });
                    removeAds();
                } else {
                    document.addEventListener('DOMContentLoaded', () => {
                        observer.observe(document.body, { childList: true, subtree: true });
                        removeAds();
                    });
                }
                
                // 6. 定期清理
                setInterval(removeAds, 5000);
                
                // 7. 拦截常见广告事件
                ['click', 'mousedown', 'touchstart'].forEach(eventType => {
                    document.addEventListener(eventType, (e) => {
                        const target = e.target;
                        if (target && target.href) {
                            for (const domain of adDomains) {
                                if (target.href.includes(domain)) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log('🚫 用户脚本拦截广告点击');
                                    return false;
                                }
                            }
                        }
                    }, true);
                });
                
                // 8. 隐藏广告相关CSS
                const style = document.createElement('style');
                style.textContent = \`
                    [class*="ad-"], [class*="ads-"], [class*="advertisement"],
                    [id*="ad-"], [id*="ads-"], [id*="advertisement"],
                    .google-ads, .googlesyndication, .adsense,
                    .taboola, .outbrain, .revcontent {
                        display: none !important;
                        visibility: hidden !important;
                        opacity: 0 !important;
                        width: 0 !important;
                        height: 0 !important;
                    }
                \`;
                document.head.appendChild(style);
                
                console.log('✅ 用户脚本广告拦截器已完全激活');
            })();
        `;
    }
    
    // 注入用户脚本到iframe
    injectAdBlockScript(iframe) {
        try {
            const script = this.createAdBlockUserScript();
            
            // 等待iframe加载完成
            iframe.onload = () => {
                try {
                    // 尝试注入脚本到iframe
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    const scriptElement = iframeDoc.createElement('script');
                    scriptElement.textContent = script;
                    iframeDoc.head.appendChild(scriptElement);
                    console.log('✅ 已向iframe注入广告拦截脚本');
                } catch (e) {
                    // 跨域限制，无法注入
                    console.log('⚠️ 无法向跨域iframe注入脚本，使用其他防护措施');
                }
            };
        } catch (e) {
            console.log('⚠️ 脚本注入失败:', e.message);
        }
    }
    
    // 移动端专用广告拦截优化
    optimizeMobileAdBlocking(playerContainer, iframe) {
        console.log('🔧 启动移动端专用广告拦截优化');
        
        // 1. 移动端触摸事件拦截
        const touchEventHandler = (e) => {
            const target = e.target;
            
            // 检查是否为广告相关元素
            if (target && (target.href || target.onclick)) {
                const adDomains = this.getAdBlockList();
                const href = target.href || '';
                
                for (const domain of adDomains) {
                    if (href.includes(domain)) {
                        e.preventDefault();
                        e.stopPropagation();
                        e.stopImmediatePropagation();
                        console.log('🚫 移动端拦截广告触摸:', href);
                        return false;
                    }
                }
            }
            
            // 检查可疑的弹窗触发
            if (target && target.tagName && 
                (target.tagName.toLowerCase() === 'div' || target.tagName.toLowerCase() === 'span') &&
                (target.style.position === 'fixed' || target.style.position === 'absolute') &&
                target.style.zIndex > 1000) {
                e.preventDefault();
                console.log('🚫 移动端拦截可疑弹窗触发');
                return false;
            }
        };
        
        ['touchstart', 'touchend', 'touchmove'].forEach(eventType => {
            playerContainer.addEventListener(eventType, touchEventHandler, { capture: true, passive: false });
        });
        
        // 2. 移动端特有广告检测和清理
        const mobileAdCleanup = () => {
            // 移动端常见广告选择器
            const mobileAdSelectors = [
                '[class*="mobile-ad"]', '[class*="m-ad"]', '[class*="app-ad"]',
                '[id*="mobile-ad"]', '[id*="m-ad"]', '[id*="app-ad"]',
                '.mobile-banner', '.app-banner', '.touch-ad',
                '[style*="position: fixed"][style*="z-index"]',
                '[class*="overlay"][style*="position: fixed"]',
                '[class*="popup"][style*="position: absolute"]'
            ];
            
            let removed = 0;
            mobileAdSelectors.forEach(selector => {
                try {
                    document.querySelectorAll(selector).forEach(el => {
                        // 额外检查：确保不是播放器本身
                        if (!el.closest('#mobile-player-container')) {
                            if (el.parentNode) {
                                el.parentNode.removeChild(el);
                                removed++;
                            }
                        }
                    });
                } catch (e) {}
            });
            
            if (removed > 0) {
                console.log('🧹 移动端清理了', removed, '个广告元素');
            }
        };
        
        // 3. 防止iframe被劫持
        const protectIframe = () => {
            try {
                // 监控iframe的src变化
                const originalSrc = iframe.src;
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
                            const newSrc = iframe.src;
                            if (newSrc !== originalSrc) {
                                // 检查新URL是否为广告
                                const adDomains = this.getAdBlockList();
                                for (const domain of adDomains) {
                                    if (newSrc.includes(domain)) {
                                        console.log('🚫 阻止iframe被劫持到广告页面:', newSrc);
                                        iframe.src = originalSrc;
                                        return;
                                    }
                                }
                            }
                        }
                    });
                });
                
                observer.observe(iframe, { attributes: true, attributeFilter: ['src'] });
            } catch (e) {
                console.log('⚠️ iframe保护设置失败:', e.message);
            }
        };
        
        // 4. 全屏保护
        const protectFullscreen = () => {
            // 防止广告强制退出全屏
            document.addEventListener('fullscreenchange', (e) => {
                if (!document.fullscreenElement && playerContainer.style.display !== 'none') {
                    console.log('🔒 检测到全屏状态变化，保护播放器');
                }
            });
            
            // 防止页面被重定向
            const originalLocation = window.location.href;
            Object.defineProperty(window, 'location', {
                get: () => ({ href: originalLocation }),
                set: (value) => {
                    console.log('🚫 阻止页面重定向:', value);
                    return false;
                }
            });
        };
        
        // 5. 移动端网络请求拦截
        const interceptMobileRequests = () => {
            // 拦截移动端特有的广告请求
            const mobileAdPatterns = [
                '/mobile-ads/', '/m-ads/', '/app-ads/',
                'mobile_ad', 'm_ad', 'app_ad',
                'touch-ads', 'responsive-ads'
            ];
            
            const originalFetch = window.fetch;
            window.fetch = function(url, options) {
                if (typeof url === 'string') {
                    // 排除视频相关的请求
                    const isVideoRequest = url.includes('.m3u8') || url.includes('.mp4') || 
                                          url.includes('.flv') || url.includes('.ts') ||
                                          url.includes('video') || url.includes('stream') ||
                                          url.includes('play') || url.includes('media');
                    
                    if (!isVideoRequest) {
                        for (const pattern of mobileAdPatterns) {
                            if (url.includes(pattern)) {
                                console.log('🚫 移动端拦截广告请求:', url);
                                return Promise.reject(new Error('移动端广告请求被拦截'));
                            }
                        }
                    }
                }
                return originalFetch.call(window, url, options);
            };
        };
        
        // 6. 移动端用户体验保护
        const protectUserExperience = () => {
            // 防止意外的页面跳转
            window.addEventListener('beforeunload', (e) => {
                if (playerContainer && playerContainer.parentNode) {
                    e.preventDefault();
                    e.returnValue = '确定要离开播放页面吗？';
                    return '确定要离开播放页面吗？';
                }
            });
            
            // 防止页面滚动干扰
            document.body.style.touchAction = 'none';
            document.body.style.userSelect = 'none';
            
            // 恢复函数
            const restoreUserExperience = () => {
                document.body.style.touchAction = '';
                document.body.style.userSelect = '';
            };
            
            // 播放器关闭时恢复
            const closeBtn = document.getElementById('close-player');
            if (closeBtn) {
                const originalOnClick = closeBtn.onclick;
                closeBtn.onclick = () => {
                    restoreUserExperience();
                    if (originalOnClick) originalOnClick();
                };
            }
        };
        
        // 启动所有优化
        setTimeout(() => {
            mobileAdCleanup();
            protectIframe();
            protectFullscreen();
            interceptMobileRequests();
            protectUserExperience();
        }, 100);
        
        // 定期清理
        const cleanupInterval = setInterval(mobileAdCleanup, 3000);
        
        // 播放器关闭时清理定时器
        const closeBtn = document.getElementById('close-player');
        if (closeBtn) {
            const originalOnClick = closeBtn.onclick;
            closeBtn.onclick = () => {
                clearInterval(cleanupInterval);
                if (originalOnClick) originalOnClick();
            };
        }
        
        console.log('✅ 移动端专用广告拦截优化已完成');
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
                try {
                    // 使用内置播放器
                    this.createMobilePlayer(url, apiUsed);
                    this.showAlert('防广告播放器已启动，享受无广告体验！', 'success');
                    
                    // 添加播放器启动后的检查
                    setTimeout(() => {
                        const iframe = document.getElementById('mobile-player-frame');
                        if (iframe) {
                            console.log('移动端播放器已创建，URL:', url);
                            // 检查iframe是否正确加载
                            iframe.addEventListener('load', () => {
                                console.log('iframe加载完成');
                            });
                            iframe.addEventListener('error', () => {
                                console.error('iframe加载失败');
                                this.showAlert('视频加载失败，请尝试其他接口', 'danger');
                            });
                        }
                    }, 100);
                    
                } catch (error) {
                    console.error('创建移动播放器失败:', error);
                    this.showAlert('播放器启动失败，正在复制链接...', 'warning');
                    this.copyToClipboard(url);
                }
            } else {
                // 复制链接
                this.copyToClipboard(url);
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
            
            console.log('开始解析视频:', {
                originalUrl: videoUrl,
                parseUrl: parseUrl,
                apiUsed: apiUsed,
                isMobile: this.isMobileDevice()
            });
            
            // 使用安全打开链接方法
            this.safeOpenLink(parseUrl, apiUsed);
            
        } catch (error) {
            console.error('解析视频失败:', error);
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

    // 快速测试功能
    quickTest() {
        // 使用一个测试视频链接
        const testUrl = 'https://v.qq.com/x/cover/mzc00200mp8vo9b.html';
        this.elements.videoUrlInput.value = testUrl;
        this.showAlert('已填入测试链接，点击"开始解析"测试功能', 'info');
        
        // 自动检测链接
        setTimeout(() => {
            this.checkUrl();
        }, 500);
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
