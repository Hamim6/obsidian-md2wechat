// main.ts

import { App, Editor, MarkdownView, Notice, Plugin, PluginSettingTab, Setting, WorkspaceLeaf } from 'obsidian';
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
      (leaf) => new Md2WechatView(leaf)
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
    console.log('正在卸载公众号排版助手插件...');
    this.app.workspace.detachLeavesOfType(MD2WECHAT_VIEW_TYPE);
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
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

      console.log('发送 API 请求:', {
        url: 'https://www.md2wechat.cn/api/convert',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.settings.apiKey ? '***已设置***' : '未设置',
        },
        body: requestData,
        markdownLength: markdownContent.length,
      });

      const response = await fetch('https://www.md2wechat.cn/api/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.settings.apiKey,
        },
        body: JSON.stringify(requestData),
      });

      console.log('HTTP 响应状态:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        contentType: response.headers.get('content-type'),
      });

      // 先获取响应文本，便于调试
      const responseText = await response.text();
      console.log('原始响应内容:', responseText);

      if (!response.ok) {
        let errorMessage = `HTTP 请求失败 - 状态码: ${response.status} (${response.statusText})`;
        
        // 尝试解析错误响应
        try {
          const errorData = JSON.parse(responseText);
          if (errorData.msg) {
            errorMessage += `\n错误信息: ${errorData.msg}`;
          }
          if (errorData.code) {
            errorMessage += `\n错误码: ${errorData.code}`;
          }
          console.log('解析的错误响应:', errorData);
        } catch (parseError) {
          console.log('无法解析错误响应为 JSON:', parseError.message);
        }
        
        throw new Error(errorMessage);
      }

      // 解析 JSON 响应
      let result;
      try {
        result = JSON.parse(responseText);
        console.log('解析的 API 响应:', result);
      } catch (parseError) {
        console.error('JSON 解析失败:', parseError.message);
        throw new Error(`服务器返回了无效的 JSON 数据: ${parseError.message}`);
      }

      // 检查 API 响应格式和状态
      if (typeof result !== 'object' || result === null) {
        throw new Error('API 响应不是有效的对象格式');
      }

      if (result.code === 0) {
        if (result.data && result.data.html) {
          console.log('转换成功，HTML 长度:', result.data.html.length);
          this.showResultInView(result.data.html);
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
  async showResultInView(html: string) {
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
            view.setContent(html);
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

    new Setting(containerEl)
      .setName('主题名称')
      .setDesc('选择你喜欢的排版主题。')
      .addText(text => text
        .setPlaceholder('例如：default')
        .setValue(this.plugin.settings.theme)
        .onChange(async (value) => {
          this.plugin.settings.theme = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('字号大小')
      .setDesc('选择正文的字号大小。')
      .addDropdown(dropdown => dropdown
        .addOption('small', '小号')
        .addOption('medium', '中等')
        .addOption('large', '大号')
        .setValue(this.plugin.settings.fontSize)
        .onChange(async (value: 'small' | 'medium' | 'large') => {
          this.plugin.settings.fontSize = value;
          await this.plugin.saveSettings();
        }));
  }
}
