# 公众号排版助手 - 安装使用指南

## 📥 安装方法

### 方法一：手动安装（推荐）

1. **下载插件文件**
   - 从 [Releases](https://github.com/geekjourneyx/obsidian-md2wechat/releases) 页面下载最新版本
   - 或者克隆/下载本仓库的代码

2. **构建插件**（如果下载的是源码）
   ```bash
   npm install
   npm run build
   ```

3. **定位插件目录**
   - 打开 Obsidian 设置
   - 进入 `设置` → `关于` → 点击 `显示配置文件夹`
   - 在配置文件夹中找到 `.obsidian/plugins/` 目录

4. **安装插件**
   - 在 `plugins` 目录下创建文件夹 `obsidian-md2wechat`
   - 将以下文件复制到该文件夹：
     - `main.js`
     - `manifest.json`
     - `styles.css`

5. **启用插件**
   - 重启 Obsidian 或使用 `Ctrl+R`（Windows/Linux）/ `Cmd+R`（macOS）重新加载
   - 进入 `设置` → `第三方插件`
   - 找到"公众号排版助手"，点击开关启用

### 方法二：开发者模式安装

1. **克隆仓库到插件目录**
   ```bash
   cd /path/to/your/vault/.obsidian/plugins/
   git clone https://github.com/geekjourneyx/obsidian-md2wechat.git
   cd obsidian-md2wechat
   npm install
   npm run dev
   ```

2. **启用插件**
   - 重启 Obsidian
   - 在设置中启用插件

## ⚙️ 配置设置

1. **获取 API Key**
   - 访问 [极简美学排版神器](https://www.md2wechat.cn) 官网
   - 注册账号并获取你的 API Key

2. **配置插件**
   - 进入 `设置` → `第三方插件` → `公众号排版助手`
   - 填写以下信息：
     - **API Key**: 从极简美学排版神器获取的密钥
     - **主题名称**: 选择排版主题（如：default、orange、purple 等）
     - **字号大小**: 选择文字大小（小号/中等/大号）

## 🎯 使用方法

### 基本使用

1. **打开 Markdown 文件**
   - 在 Obsidian 中打开任意 Markdown 文档

2. **执行排版**
   - **方法一**: 点击左侧功能区的报纸图标 📰
   - **方法二**: 使用命令面板（`Ctrl+P` / `Cmd+P`），搜索"一键排版到公众号样式"

3. **预览结果**
   - 插件会在右侧打开预览窗口
   - 显示转换后的公众号样式 HTML

4. **复制内容**
   - 在预览窗口中右键选择内容
   - 复制后粘贴到微信公众号编辑器

### 高级功能

- **主题切换**: 在设置中更改主题名称，支持多种预设样式
- **字体调节**: 根据需要调整文字大小
- **实时预览**: 修改文档后重新执行命令即可更新预览

## 🔧 故障排除

### 常见问题

**Q: 提示"请先在设置中填写 API Key"**
- A: 确保在插件设置中正确填写了从极简美学排版神器获取的 API Key

**Q: 提示"请先打开一个 Markdown 文件"**
- A: 确保当前激活的文件是 .md 格式的 Markdown 文件

**Q: 提示"排版失败: API 请求失败"**
- A: 检查网络连接，确认 API Key 是否正确，或稍后重试

**Q: 预览窗口没有显示内容**
- A: 检查 Markdown 文件是否有内容，确认 API 返回了正确的 HTML

### 开发者调试

1. **查看控制台**
   - 按 `Ctrl+Shift+I`（Windows/Linux）/ `Cmd+Option+I`（macOS）
   - 查看 Console 标签页中的错误信息

2. **检查网络请求**
   - 在 Network 标签页查看 API 请求状态
   - 确认请求是否成功发送和接收

## 📝 更新日志

### v1.0.0
- ✨ 首次发布
- 🚀 支持一键转换 Markdown 到公众号样式
- ⚙️ 可配置主题和字体大小
- 🖼️ 实时预览功能
- 📱 支持桌面和移动端

## 🤝 反馈与支持

- **问题反馈**: [GitHub Issues](https://github.com/geekjourneyx/obsidian-md2wechat/issues)
- **功能建议**: 欢迎提交 Pull Request 或开启 Issue
- **使用交流**: 欢迎在 Issues 中分享使用心得

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件