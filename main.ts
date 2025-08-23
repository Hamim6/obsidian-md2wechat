// main.ts

import { App, Editor, MarkdownView, Notice, Plugin, PluginSettingTab, Setting, WorkspaceLeaf, requestUrl } from 'obsidian';
import { Md2WechatSettings, DEFAULT_SETTINGS } from './settings';
import { Md2WechatView, MD2WECHAT_VIEW_TYPE } from './view';

export default class Md2WechatPlugin extends Plugin {
  settings: Md2WechatSettings;

  async onload() {
    console.log('正在加载公众号排版助手插件...');

    await this.loadSettings();

    // 注册自定义视图
    this.registerView(
      MD2WECHAT_VIEW_TYPE,
      (leaf) => new Md2WechatView(leaf, this)
    );

    // 添加功能区图标按钮
    this.addRibbonIcon('newspaper', '排版到公众号', async (evt: MouseEvent) => {
      new Notice('正在进行排版...');
      await this.convertToWechatHTML();
    });

    // 添加命令
    this.addCommand({
      id: 'convert-to-wechat-html',
      name: '一键排版到公众号样式',
      editorCallback: async (editor: Editor, view: MarkdownView) => {
        new Notice('正在进行排版...');
        await this.convertToWechatHTML();
      },
    });

    // 添加设置页面
    this.addSettingTab(new Md2WechatSettingTab(this.app, this));
  }

  onunload() {
    // 插件卸载时的清理工作
    // 不在此处手动分离视图叶子，让 Obsidian 自动处理
  }

  async loadSettings() {
    const loadedData = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedData);
    
    // 设置已加载
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  // 核心功能：调用 API 并渲染
  async convertToWechatHTML() {
    if (!this.settings.apiKey) {
      new Notice('错误：请先在设置中填写 API Key！');
      return;
    }

    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView) {
      new Notice('请先打开一个 Markdown 文件！');
      return;
    }

    const markdownContent = activeView.editor.getValue();
    if (!markdownContent.trim()) {
      new Notice('当前文件没有内容！');
      return;
    }

    try {
      // 准备请求数据
      const requestData = {
        markdown: markdownContent,
        theme: this.settings.theme,
        fontSize: this.settings.fontSize,
      };

      // 发送 API 请求

      const response = await requestUrl({
        url: 'https://www.md2wechat.cn/api/convert',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.settings.apiKey,
        },
        body: JSON.stringify(requestData),
      });

      // 检查响应状态
      if (response.status >= 400) {
        let errorMessage = `HTTP 请求失败 - 状态码: ${response.status}`;
        
        // 尝试解析错误响应
        try {
          const errorData = response.json;
          if (errorData && errorData.msg) {
            errorMessage += `\n错误信息: ${errorData.msg}`;
          }
          if (errorData && errorData.code) {
            errorMessage += `\n错误码: ${errorData.code}`;
          }
        } catch (parseError) {
          // 错误响应解析失败
        }
        
        throw new Error(errorMessage);
      }

      // 获取解析后的 JSON 响应
      const result = response.json;

      // 检查 API 响应格式和状态
      if (typeof result !== 'object' || result === null) {
        throw new Error('API 响应不是有效的对象格式');
      }

      if (result.code === 0) {
        if (result.data && result.data.html) {
          // 转换成功
          this.showResultInView(result.data.html, markdownContent);
          new Notice('排版成功！');
        } else {
          console.error('成功响应但缺少 HTML 数据:', result);
          throw new Error('API 返回成功但未包含 HTML 数据');
        }
      } else {
        const errorMsg = result.msg || '未知错误';
        const errorCode = result.code || '无错误码';
        console.error('API 业务错误:', { code: errorCode, msg: errorMsg, fullResponse: result });
        throw new Error(`API 错误 (${errorCode}): ${errorMsg}`);
      }

    } catch (error) {
      console.error('完整错误信息:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      
      // 根据错误类型提供更有用的提示
      let userMessage = '排版失败: ';
      if (error.message.includes('Failed to fetch') || error.message.includes('Network Error')) {
        userMessage += '网络连接失败，请检查网络连接';
      } else if (error.message.includes('401')) {
        userMessage += 'API Key 无效或已过期，请检查设置';
      } else if (error.message.includes('403')) {
        userMessage += '访问被拒绝，请检查 API Key 权限';
      } else if (error.message.includes('429')) {
        userMessage += 'API 调用频率过高，请稍后重试';
      } else if (error.message.includes('500')) {
        userMessage += '服务器内部错误，请稍后重试';
      } else {
        userMessage += error.message;
      }
      
      new Notice(userMessage);
    }
  }

  // 在新视图中显示结果
  async showResultInView(html: string, markdownContent?: string) {
    // 先分离已存在的同类型叶子
    this.app.workspace.detachLeavesOfType(MD2WECHAT_VIEW_TYPE);

    // 在右侧打开一个新的叶子
    const newLeaf = this.app.workspace.getRightLeaf(false);
    if (newLeaf) {
        await newLeaf.setViewState({
            type: MD2WECHAT_VIEW_TYPE,
            active: true,
        });

        // 激活叶子并获取视图实例来更新内容
        this.app.workspace.revealLeaf(newLeaf);
        const view = newLeaf.view as Md2WechatView;
        if (view instanceof Md2WechatView) {
            view.updateSettingsControls();
            view.setContent(html, markdownContent);
        }
    }
  }
}


// 设置页面的实现
class Md2WechatSettingTab extends PluginSettingTab {
  plugin: Md2WechatPlugin;

  constructor(app: App, plugin: Md2WechatPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    containerEl.createEl('h2', { text: '公众号排版助手设置' });

    new Setting(containerEl)
      .setName('API Key')
      .setDesc('请输入从 md2wechat.cn 获取的 API Key。')
      .addText(text => text
        .setPlaceholder('wme_your_api_key_here')
        .setValue(this.plugin.settings.apiKey)
        .onChange(async (value) => {
          this.plugin.settings.apiKey = value;
          await this.plugin.saveSettings();
        }));

    // 添加说明文本
    containerEl.createEl('p', {
      text: '💡 主题和字体大小设置已移到预览窗口的工具栏中，方便实时调整和预览效果。',
      cls: 'setting-item-description'
    });
  }
}
