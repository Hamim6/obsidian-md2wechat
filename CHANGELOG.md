# 更新日志

本文档记录了公众号排版助手 (obsidian-md2wechat) 的所有重要更改。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [1.0.0] - 2025-08-19

### 新增功能 ✨
- 一键将 Markdown 内容转换为微信公众号样式的 HTML
- 支持多种主题样式：
  - 默认温暖风 (default)
  - 字节范 (bytedance)
  - 苹果风 (apple)
  - 运动风 (sports)
  - 中国风 (chinese)
  - 赛博朋克 (cyber)
- 字体大小自定义配置（小号/中等/大号）
- 实时预览转换效果的自定义视图
- 一键复制转换结果到剪贴板
- 功能区按钮快速访问
- 命令面板命令支持
- 完整的设置页面，支持 API Key 配置

### 技术特性 🔧
- 基于 md2wechat.cn API 服务
- 支持整篇文档或选中文本的转换
- TypeScript 开发，类型安全
- 适配 Obsidian 0.15.0+ 版本
- 支持桌面端和移动端

### 用户体验 💡
- 友好的错误提示和状态通知
- 直观的设置界面
- 快速的转换响应
- 所见即所得的预览效果

---

## 如何使用

### 安装方法
1. 从 Releases 页面下载 `obsidian-md2wechat-v1.0.0.zip`
2. 解压后将文件放入 `.obsidian/plugins/obsidian-md2wechat/` 目录
3. 在 Obsidian 设置中启用插件
4. 在插件设置中配置 md2wechat API Key

### 基本使用
1. 打开 Markdown 文档
2. 选择要转换的文本（可选，不选则转换整篇文档）
3. 点击功能区的 📰 按钮或使用命令 `一键排版到公众号样式`
4. 在弹出的预览窗口中查看效果并复制结果

### 设置选项
- **API Key**: md2wechat.cn 服务的 API 密钥
- **主题**: 选择公众号样式主题
- **字体大小**: 调整文章字体大小

---

感谢使用公众号排版助手！如有问题或建议，请在 [GitHub Issues](https://github.com/geekjourneyx/obsidian-md2wechat/issues) 中反馈。