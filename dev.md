### 开发概览

我们的插件将实现以下核心功能：

1.  **设置页面**: 用户可以在此配置他们的 API Key、默认主题和字号。
2.  **命令和按钮**: 在左侧功能区（Ribbon）添加一个图标按钮，并注册一个命令面板（Command Palette）的命令，用于触发排版。
3.  **API 调用**: 获取当前笔记的 Markdown 内容，连同设置中的参数，一起发送到 `https://www.md2wechat.cn/api/convert`。
4.  **结果渲染**: 创建一个新的视图（View），在一个独立的窗口中展示 API 返回的、已经排版好的 HTML 内容，方便用户预览和复制。

-----

### 步骤 1：准备开发环境

在开始之前，请确保你已经安装了以下工具：

1.  **Node.js**: 这是运行构建工具和管理依赖所必需的。请访问 [Node.js 官网](https://nodejs.org/) 下载并安装。
2.  **Git**: 用于克隆官方的插件模板。
3.  **代码编辑器**: 推荐使用 **VS Code**，它对 TypeScript 有非常好的支持。
4.  **Obsidian**: 你需要 Obsidian 本体来测试你的插件。

-----

### 步骤 2：创建插件项目

Obsidian 官方提供了一个非常棒的插件模板，可以帮助我们快速开始。

1.  **打开终端** (Terminal 或 PowerShell)。

2.  **克隆模板项目**：

    ```bash
    git clone https://github.com/obsidianmd/obsidian-sample-plugin.git your-plugin-name
    cd your-plugin-name
    ```

    将 `your-plugin-name` 替换为你的插件名称，例如 `md2wechat-publisher`。

3.  **安装依赖**:

    ```bash
    npm install
    ```

4.  **更新项目信息**:

      * 打开 `manifest.json` 文件，修改 `id`, `name`, `author`, `description` 等字段。这是你插件的身份信息。
        ```json
        {
          "id": "md2wechat-publisher",
          "name": "公众号排版助手",
          "version": "1.0.0",
          "minAppVersion": "0.15.0",
          "description": "一键调用 md2wechat API，将 Markdown 内容转换为公众号样式。",
          "author": "geekjourneyx",
          "authorUrl": "https://github.com/geekjourneyx",
          "isDesktopOnly": false
        }
        ```
      * 打开 `package.json` 文件，同样可以修改 `name`, `version`, `description` 等信息。

-----

### 步骤 3：编写核心代码

我们将主要修改 `main.ts` 文件，并创建一些新文件来组织代码。

#### 3.1 定义设置项 (`settings.ts`)

首先，创建一个新文件 `settings.ts` 来定义插件的设置项和默认值。这是一种良好的实践。

```typescript
// settings.ts

export interface Md2WechatSettings {
  apiKey: string;
  theme: string;
  fontSize: 'small' | 'medium' | 'large';
}

export const DEFAULT_SETTINGS: Md2WechatSettings = {
  apiKey: '',
  theme: 'default',
  fontSize: 'medium',
};
```

#### 3.2 创建渲染视图 (`view.ts`)

我们需要一个自定义的视图来展示返回的 HTML。创建一个新文件 `view.ts`。

```typescript
// view.ts

import { ItemView, WorkspaceLeaf } from 'obsidian';

export const MD2WECHAT_VIEW_TYPE = 'md2wechat-html-view';

export class Md2WechatView extends ItemView {
  private contentEl: HTMLElement;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
    this.contentEl = this.containerEl.createEl('div');
    this.contentEl.style.padding = '20px'; // 添加一些内边距
    this.contentEl.style.overflowY = 'auto'; // 允许滚动
  }

  getViewType(): string {
    return MD2WECHAT_VIEW_TYPE;
  }

  getDisplayText(): string {
    return '公众号预览';
  }

  getIcon(): string {
    return 'newspaper'; // 使用内置图标
  }

  async onOpen() {
    this.contentEl.innerHTML = '<h2>请在 Markdown 文件中执行排版命令...</h2>';
  }

  async onClose() {
    // 清理工作
    this.contentEl.empty();
  }

  // 用于外部更新内容的方法
  setContent(html: string) {
    this.contentEl.innerHTML = html;
  }
}
```

#### 3.3 实现主逻辑 (`main.ts`)

这是我们插件的核心，包含了设置加载、UI 注册、API 调用等所有逻辑。

```typescript
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
      const response = await fetch('https://www.md2wechat.cn/api/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.settings.apiKey,
        },
        body: JSON.stringify({
          markdown: markdownContent,
          theme: this.settings.theme,
          fontSize: this.settings.fontSize,
        }),
      });

      if (!response.ok) {
        throw new Error(`API 请求失败，状态码: ${response.status}`);
      }

      const result = await response.json();
      if (result && result.html) {
        this.showResultInView(result.html);
        new Notice('排版成功！');
      } else {
        throw new Error('API 返回的数据格式不正确。');
      }

    } catch (error) {
      console.error('调用 md2wechat API 时出错:', error);
      new Notice(`排版失败: ${error.message}`);
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
```

**代码解释**：

  * **`onload()`**: 插件加载时执行。我们在这里注册了视图、命令、图标和设置页。
  * **`convertToWechatHTML()`**: 核心函数。它获取当前笔记内容，读取设置，然后使用 `fetch` API 发送 POST 请求。
  * **`showResultInView()`**: 负责打开或激活我们的自定义视图，并将获取到的 HTML 渲染进去。
  * **`Md2WechatSettingTab`**: 一个独立的类，用于构建插件的设置界面，用户可以在这里输入 API Key 等信息。我们使用了下拉菜单来选择字号，提高了用户体验。

-----

### 步骤 4：构建和安装插件

1.  **编译代码**:
    在你的项目根目录下，运行构建命令。

    ```bash
    npm run build
    ```

    这会将你的 TypeScript 代码 (`.ts`) 编译成 Obsidian 可以理解的 JavaScript 代码 (`main.js`)。

2.  **安装到 Obsidian**:

      * 在你的 Obsidian Vault (仓库) 中，找到 `.obsidian/plugins` 文件夹。
      * 在 `plugins` 文件夹里，创建一个新的文件夹，名字就是你 `manifest.json` 里的 `id`，例如 `md2wechat-publisher`。
      * 将你项目中的 `main.js`, `styles.css` 和 `manifest.json` 这三个文件复制到刚刚创建的 `md2wechat-publisher` 文件夹中。

3.  **启用插件**:

      * 重启 Obsidian，或者重新加载它 (Reload App)。
      * 进入 `设置` -\> `第三方插件`。
      * 找到“公众号排版助手”，点击右侧的开关启用它。

-----

### 步骤 5：使用和测试

1.  **配置 API Key**:

      * 进入 `设置` -\> `第三方插件` -\> `公众号排版助手`。
      * 在设置页面填入你的 API Key、喜欢的主题名称和字号。

2.  **触发排版**:

      * 打开任意一篇 Markdown 笔记。
      * **方法一**: 点击左侧功能区的报纸图标 (`newspaper`)。
      * **方法二**: 按下 `Ctrl+P` (或 `Cmd+P`) 打开命令面板，输入“公众号”，选择“一键排版到公众号样式”命令。

3.  **查看结果**:

      * 执行命令后，Obsidian 的右侧应该会自动弹出一个新的窗口，标题为“公众号预览”。
      * 窗口中会显示已经排版好的 HTML 内容。你可以右键点击内容进行复制，然后粘贴到公众号编辑器中。

### 注意事项和开发指南

  * **API 安全**: 永远不要将你的 API Key 硬编码在代码里。通过设置页面让用户自行输入是最佳实践。
  * **错误处理**: 代码中使用了 `try...catch` 块来捕获网络请求或 API 返回的错误，并通过 `new Notice()` 给用户明确的提示，这是非常重要的。
  * **用户体验**:
      * 在开始 API 请求时，使用 `new Notice('正在进行排版...')` 给用户一个即时反馈。
      * 对于设置项，尽可能使用下拉菜单、开关等控件，而不是纯文本输入框，可以减少用户输入错误的概率。
  * **Obsidian API**: 我们使用了 `fetch`，但对于更复杂的网络请求，Obsidian 提供了 `requestUrl` API，它可以更好地处理跨域等问题。对于这个场景，`fetch` 已经足够。
  * **代码组织**: 将不同的功能模块（如 `View`, `Settings`）拆分到不同的文件中，可以让你的主文件 `main.ts` 更加清晰。
  * **开发模式**: 为了方便调试，可以在开发时使用 `npm run dev`。这个命令会自动监视文件变化并重新编译，你只需要在 Obsidian 中重新加载插件即可看到效果。

至此，你已经成功地从 0 到 1 开发了一个功能完整的 Obsidian 插件。祝贺你！接下来，你可以根据自己的需求，继续为它添加更多功能，比如主题选择下拉菜单、本地缓存、一键复制按钮等。