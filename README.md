# VIP视频播放器 - 纯前端版本

🎬 一个完全基于前端技术的VIP视频解析工具，无需后端服务器，可直接部署到任何静态网站托管平台。

## ✨ 特性

- 🚀 **纯前端实现** - 无需后端服务器，完全基于JavaScript
- 🌐 **多平台支持** - 支持爱奇艺、腾讯视频、优酷、芒果TV等主流平台
- 📱 **响应式设计** - 完美适配桌面端和移动端
- 🎨 **现代化UI** - 美观的渐变设计和流畅的动画效果
- ⚡ **快速部署** - 一键部署到Vercel、Netlify等平台
- 🔒 **安全可靠** - 客户端解析，保护用户隐私

## 🚀 快速开始

### 在线访问

直接访问已部署的版本：[https://your-app.vercel.app](https://your-app.vercel.app)

### 本地运行

1. **克隆项目**
   ```bash
   git clone https://github.com/your-username/vip-video-player-frontend.git
   cd vip-video-player-frontend
   ```

2. **启动本地服务器**
   ```bash
   # 使用Python（推荐）
   python -m http.server 8000
   
   # 或使用Node.js
   npx serve .
   
   # 或使用PHP
   php -S localhost:8000
   ```

3. **打开浏览器**
   访问 `http://localhost:8000`

## 📦 部署到Vercel

### 方法一：通过GitHub（推荐）

1. **Fork本项目到你的GitHub账号**

2. **连接Vercel**
   - 访问 [Vercel官网](https://vercel.com)
   - 使用GitHub账号登录
   - 点击 "New Project"
   - 选择你Fork的项目
   - 点击 "Deploy"

3. **自动部署**
   - Vercel会自动检测项目类型
   - 几分钟后即可获得永久访问链接

### 方法二：直接上传

1. **下载项目文件**
   - 下载所有文件到本地

2. **拖拽部署**
   - 访问 [Vercel部署页面](https://vercel.com/new)
   - 直接拖拽项目文件夹到页面
   - 等待部署完成

## 🛠️ 项目结构

```
frontend-only/
├── index.html          # 主页面
├── app.js             # 核心JavaScript逻辑
├── style.css          # 样式文件
├── vercel.json        # Vercel部署配置
├── package.json       # 项目配置
└── README.md          # 说明文档
```

## 🎯 使用方法

1. **输入视频链接**
   - 在输入框中粘贴VIP视频的完整链接
   - 支持的平台：爱奇艺、腾讯视频、优酷、芒果TV等

2. **选择解析接口**
   - 系统会自动检测可用的解析接口
   - 选择一个可用的接口进行解析

3. **开始解析**
   - 点击"开始解析"按钮
   - 等待解析完成，获取播放链接

4. **复制链接**
   - 解析成功后，可以复制播放链接
   - 在支持的播放器中打开链接观看

## 🔧 技术栈

- **HTML5** - 页面结构
- **CSS3** - 样式和动画
- **JavaScript (ES6+)** - 核心逻辑
- **Fetch API** - 网络请求
- **Clipboard API** - 剪贴板操作

## 🌟 支持的平台

| 平台 | 状态 | 说明 |
|------|------|------|
| 爱奇艺 | ✅ | 支持VIP内容解析 |
| 腾讯视频 | ✅ | 支持VIP内容解析 |
| 优酷 | ✅ | 支持VIP内容解析 |
| 芒果TV | ✅ | 支持VIP内容解析 |
| 哔哩哔哩 | ✅ | 支持大会员内容 |
| 搜狐视频 | ✅ | 支持VIP内容解析 |

## 📱 移动端支持

- ✅ iOS Safari
- ✅ Android Chrome
- ✅ 微信内置浏览器
- ✅ QQ浏览器
- ✅ UC浏览器

## ⚠️ 注意事项

1. **合法使用**
   - 本工具仅供学习和研究使用
   - 请遵守相关法律法规和平台服务条款
   - 不得用于商业用途

2. **解析稳定性**
   - 解析接口可能会失效，属于正常现象
   - 建议收藏多个解析接口作为备用
   - 如遇问题，请尝试更换其他接口

3. **隐私保护**
   - 所有解析过程在客户端完成
   - 不会收集或存储用户数据
   - 建议在可信网络环境下使用

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

1. **Fork项目**
2. **创建特性分支** (`git checkout -b feature/AmazingFeature`)
3. **提交更改** (`git commit -m 'Add some AmazingFeature'`)
4. **推送到分支** (`git push origin feature/AmazingFeature`)
5. **创建Pull Request**

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- 感谢所有解析接口提供者
- 感谢开源社区的支持
- 感谢Vercel提供免费托管服务

## 📞 联系我们

- 📧 Email: your-email@example.com
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/vip-video-player-frontend/issues)
- 💬 讨论: [GitHub Discussions](https://github.com/your-username/vip-video-player-frontend/discussions)

---

⭐ 如果这个项目对你有帮助，请给它一个星标！