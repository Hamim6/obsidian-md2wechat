// view.ts

import { ItemView, WorkspaceLeaf, setIcon, Notice, MarkdownView } from 'obsidian';
import type Md2WechatPlugin from './main';

export const MD2WECHAT_VIEW_TYPE = 'md2wechat-html-view';

export class Md2WechatView extends ItemView {
  private contentWrapper: HTMLElement;
  private previewContainer: HTMLElement;
  private toolbarEl: HTMLElement;
  private drawerEl: HTMLElement;
  private overlayEl: HTMLElement;
  private plugin: Md2WechatPlugin;
  private themeSelect: HTMLSelectElement;
  private fontSizeSelect: HTMLSelectElement;
  private isDrawerOpen = false;
  private currentMarkdownContent: string | null = null; // 存储当前的 Markdown 内容

  constructor(leaf: WorkspaceLeaf, plugin: Md2WechatPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  private initializeView() {
    // 清空默认内容
    this.containerEl.empty();
    
    // 创建主容器
    this.contentWrapper = this.containerEl.createEl('div', {
      cls: 'md2wechat-view-wrapper'
    });

    // 创建极简工具栏
    this.toolbarEl = this.contentWrapper.createEl('div', {
      cls: 'md2wechat-minimal-toolbar'
    });

    // 左侧标题
    const titleEl = this.toolbarEl.createEl('div', {
      cls: 'md2wechat-toolbar-title',
      text: '公众号样式预览'
    });

    // 右侧图标按钮组
    const iconGroup = this.toolbarEl.createEl('div', {
      cls: 'md2wechat-icon-group'
    });

    // 设置图标 - 纯图标无容器
    const settingsIcon = iconGroup.createEl('div', {
      cls: 'md2wechat-icon md2wechat-settings-icon',
      attr: { 
        'aria-label': '排版设置', 
        'title': '点击打开排版设置面板，可调整主题和字体大小' 
      }
    });
    settingsIcon.addEventListener('click', () => this.toggleDrawer());

    // 复制图标 - 纯图标无容器  
    const copyIcon = iconGroup.createEl('div', {
      cls: 'md2wechat-icon md2wechat-copy-icon',
      attr: { 
        'aria-label': '复制内容', 
        'title': '复制转换后的HTML内容到剪贴板，可直接粘贴到微信公众号编辑器' 
      }
    });
    copyIcon.addEventListener('click', () => this.copyContent());

    // 打开公众号图标 - 纯图标无容器
    const wechatIcon = iconGroup.createEl('div', {
      cls: 'md2wechat-icon md2wechat-wechat-icon',
      attr: { 
        'aria-label': '打开公众号', 
        'title': '在新标签页打开微信公众号后台，方便粘贴内容' 
      }
    });
    wechatIcon.addEventListener('click', () => this.openWechat());

    // 创建遮罩层
    this.overlayEl = this.contentWrapper.createEl('div', {
      cls: 'md2wechat-overlay'
    });
    this.overlayEl.addEventListener('click', () => this.closeDrawer());

    // 创建抽屉面板
    this.drawerEl = this.contentWrapper.createEl('div', {
      cls: 'md2wechat-drawer'
    });

    // 抽屉头部
    const drawerHeader = this.drawerEl.createEl('div', {
      cls: 'md2wechat-drawer-header'
    });

    drawerHeader.createEl('h3', {
      cls: 'md2wechat-drawer-title',
      text: '排版设置'
    });

    const closeIcon = drawerHeader.createEl('div', {
      cls: 'md2wechat-drawer-close-icon',
      attr: { 
        'aria-label': '关闭设置', 
        'title': '关闭排版设置面板' 
      }
    });
    closeIcon.addEventListener('click', () => this.closeDrawer());

    // 抽屉内容
    const drawerContent = this.drawerEl.createEl('div', {
      cls: 'md2wechat-drawer-content'
    });

    // 🔧 自定义主题选择器 - 替代原生select解决显示问题
    const themeSection = drawerContent.createEl('div', {
      cls: 'md2wechat-drawer-section'
    });
    
    themeSection.createEl('label', {
      cls: 'md2wechat-drawer-label',
      text: '主题风格'
    });
    
    // 创建自定义下拉选择器容器
    const themeDropdown = themeSection.createEl('div', {
      cls: 'md2wechat-custom-select'
    });
    
    // 创建显示当前值的按钮
    const themeDisplayButton = themeDropdown.createEl('button', {
      cls: 'md2wechat-custom-select-button',
      type: 'button'
    });
    
    // 创建下拉箭头
    const themeArrow = themeDisplayButton.createEl('span', {
      cls: 'md2wechat-custom-select-arrow',
      text: '▼'
    });
    
    // 创建选项列表
    const themeOptionsList = themeDropdown.createEl('div', {
      cls: 'md2wechat-custom-select-options'
    });
    
    // 主题数据
    const themes = [
      { value: 'default', text: '默认温暖风' },
      { value: 'bytedance', text: '字节范' },
      { value: 'apple', text: '苹果风' },
      { value: 'sports', text: '运动风' },
      { value: 'chinese', text: '中国风' },
      { value: 'cyber', text: '赛博朋克' }
    ];
    
    let selectedTheme = this.plugin.settings.theme;
    let themeDropdownOpen = false;
    
    // 更新显示文本的函数
    const updateThemeDisplay = () => {
      const currentTheme = themes.find(t => t.value === selectedTheme);
      themeDisplayButton.textContent = currentTheme?.text || '请选择主题';
      themeDisplayButton.appendChild(themeArrow);
    };
    
    // 创建选项元素
    themes.forEach(theme => {
      const optionEl = themeOptionsList.createEl('div', {
        cls: 'md2wechat-custom-select-option',
        text: theme.text
      });
      
      if (theme.value === selectedTheme) {
        optionEl.addClass('md2wechat-custom-select-option-selected');
      }
      
      optionEl.addEventListener('click', () => {
        // 更新选中状态
        themeOptionsList.querySelectorAll('.md2wechat-custom-select-option').forEach(opt => {
          opt.removeClass('md2wechat-custom-select-option-selected');
        });
        optionEl.addClass('md2wechat-custom-select-option-selected');
        
        // 更新值
        selectedTheme = theme.value;
        updateThemeDisplay();
        
        // 关闭下拉列表
        themeOptionsList.removeClass('md2wechat-custom-select-options-open');
        themeDropdownOpen = false;
        themeArrow.textContent = '▼';
        
        // 保存设置变化
        this.plugin.settings.theme = selectedTheme;
        this.plugin.saveSettings();
        
        // 如果有内容则尝试重新转换
        this.triggerReconversion();
      });
    });
    
    // 按钮点击事件
    themeDisplayButton.addEventListener('click', (e) => {
      e.preventDefault();
      themeDropdownOpen = !themeDropdownOpen;
      
      if (themeDropdownOpen) {
        themeOptionsList.addClass('md2wechat-custom-select-options-open');
        themeArrow.textContent = '▲';
      } else {
        themeOptionsList.removeClass('md2wechat-custom-select-options-open');
        themeArrow.textContent = '▼';
      }
    });
    
    // 点击外部关闭下拉列表
    document.addEventListener('click', (e) => {
      if (!themeDropdown.contains(e.target as Node)) {
        themeOptionsList.removeClass('md2wechat-custom-select-options-open');
        themeDropdownOpen = false;
        themeArrow.textContent = '▼';
      }
    });
    
    // 初始化显示
    updateThemeDisplay();
    
    // 为兼容性保留select引用（指向隐藏元素）
    this.themeSelect = document.createElement('select');
    this.themeSelect.value = selectedTheme;

    // 🔧 自定义字体大小选择器 - 替代原生select解决显示问题
    const fontSection = drawerContent.createEl('div', {
      cls: 'md2wechat-drawer-section'
    });
    
    fontSection.createEl('label', {
      cls: 'md2wechat-drawer-label', 
      text: '字体大小'
    });
    
    // 创建自定义下拉选择器容器
    const fontDropdown = fontSection.createEl('div', {
      cls: 'md2wechat-custom-select'
    });
    
    // 创建显示当前值的按钮
    const fontDisplayButton = fontDropdown.createEl('button', {
      cls: 'md2wechat-custom-select-button',
      type: 'button'
    });
    
    // 创建下拉箭头
    const fontArrow = fontDisplayButton.createEl('span', {
      cls: 'md2wechat-custom-select-arrow',
      text: '▼'
    });
    
    // 创建选项列表
    const fontOptionsList = fontDropdown.createEl('div', {
      cls: 'md2wechat-custom-select-options'
    });
    
    // 字体数据
    const fontSizes = [
      { value: 'small', text: '小号' },
      { value: 'medium', text: '中等' },
      { value: 'large', text: '大号' }
    ];
    
    let selectedFontSize = this.plugin.settings.fontSize;
    let fontDropdownOpen = false;
    
    // 更新显示文本的函数
    const updateFontDisplay = () => {
      const currentFontSize = fontSizes.find(f => f.value === selectedFontSize);
      fontDisplayButton.textContent = currentFontSize?.text || '请选择字体大小';
      fontDisplayButton.appendChild(fontArrow);
    };
    
    // 创建选项元素
    fontSizes.forEach(size => {
      const optionEl = fontOptionsList.createEl('div', {
        cls: 'md2wechat-custom-select-option',
        text: size.text
      });
      
      if (size.value === selectedFontSize) {
        optionEl.addClass('md2wechat-custom-select-option-selected');
      }
      
      optionEl.addEventListener('click', () => {
        // 更新选中状态
        fontOptionsList.querySelectorAll('.md2wechat-custom-select-option').forEach(opt => {
          opt.removeClass('md2wechat-custom-select-option-selected');
        });
        optionEl.addClass('md2wechat-custom-select-option-selected');
        
        // 更新值
        selectedFontSize = size.value as 'small' | 'medium' | 'large';
        updateFontDisplay();
        
        // 关闭下拉列表
        fontOptionsList.removeClass('md2wechat-custom-select-options-open');
        fontDropdownOpen = false;
        fontArrow.textContent = '▼';
        
        // 保存设置变化
        this.plugin.settings.fontSize = selectedFontSize;
        this.plugin.saveSettings();
        
        // 如果有内容则尝试重新转换
        this.triggerReconversion();
      });
    });
    
    // 按钮点击事件
    fontDisplayButton.addEventListener('click', (e) => {
      e.preventDefault();
      fontDropdownOpen = !fontDropdownOpen;
      
      if (fontDropdownOpen) {
        fontOptionsList.addClass('md2wechat-custom-select-options-open');
        fontArrow.textContent = '▲';
      } else {
        fontOptionsList.removeClass('md2wechat-custom-select-options-open');
        fontArrow.textContent = '▼';
      }
    });
    
    // 点击外部关闭下拉列表
    document.addEventListener('click', (e) => {
      if (!fontDropdown.contains(e.target as Node)) {
        fontOptionsList.removeClass('md2wechat-custom-select-options-open');
        fontDropdownOpen = false;
        fontArrow.textContent = '▼';
      }
    });
    
    // 初始化显示
    updateFontDisplay();
    
    // 为兼容性保留select引用（指向隐藏元素）
    this.fontSizeSelect = document.createElement('select');
    this.fontSizeSelect.value = selectedFontSize;


    // 创建预览容器
    this.previewContainer = this.contentWrapper.createEl('div', {
      cls: 'md2wechat-preview-container'
    });

    // 创建内容区域
    const contentArea = this.previewContainer.createEl('div', {
      cls: 'md2wechat-content-area'
    });

    // 设置初始提示内容
    this.setInitialContent(contentArea);
    
    // 设置图标
    setIcon(settingsIcon, 'settings');
    setIcon(copyIcon, 'copy');
    setIcon(wechatIcon, 'external-link');
    setIcon(closeIcon, 'x');
  }

  private setInitialContent(container: HTMLElement) {
    container.innerHTML = `
      <div class="md2wechat-placeholder">
        <div class="md2wechat-placeholder-icon">📰</div>
        <h3>公众号排版预览</h3>
        <p>请在 Markdown 文件中点击功能区按钮或使用命令面板执行排版</p>
        <div class="md2wechat-placeholder-steps">
          <div class="step">1. 打开 Markdown 文件</div>
          <div class="step">2. 点击左侧 📰 图标</div>
          <div class="step">3. 查看转换效果</div>
        </div>
      </div>
    `;
  }

  private async copyContent() {
    const contentArea = this.previewContainer.querySelector('.md2wechat-content-area');
    if (contentArea && contentArea.innerHTML && !contentArea.querySelector('.md2wechat-placeholder')) {
      const btn = this.toolbarEl.querySelector('.md2wechat-copy-icon') as HTMLElement;
      
      try {
        // 方案1: 现代 Clipboard API - 支持多种格式
        if (navigator.clipboard && navigator.clipboard.write) {
          const htmlContent = contentArea.innerHTML;
          const textContent = contentArea.textContent || (contentArea as HTMLElement).innerText || '';
          
          const clipboardItems = [
            new ClipboardItem({
              'text/html': new Blob([htmlContent], { type: 'text/html' }),
              'text/plain': new Blob([textContent], { type: 'text/plain' })
            })
          ];
          
          await navigator.clipboard.write(clipboardItems);
          this.showIconFeedback(btn, 'success');
          new Notice('内容已复制到剪贴板！可直接粘贴到微信公众号编辑器', 3000);
          return;
        }
        
        // 方案2: 选区复制 (execCommand)
        const range = document.createRange();
        const selection = window.getSelection();
        
        range.selectNodeContents(contentArea);
        selection?.removeAllRanges();
        selection?.addRange(range);
        
        const execSuccess = document.execCommand('copy');
        selection?.removeAllRanges();
        
        if (execSuccess) {
          this.showIconFeedback(btn, 'success');
          new Notice('内容已复制到剪贴板！', 2000);
          return;
        }
        
        // 方案3: 回退到纯文本 Clipboard API
        if (navigator.clipboard && navigator.clipboard.writeText) {
          const textContent = contentArea.textContent || (contentArea as HTMLElement).innerText || '';
          await navigator.clipboard.writeText(textContent);
          
          this.showIconFeedback(btn, 'info');
          new Notice('纯文本已复制到剪贴板（不包含格式）', 2500);
          return;
        }
        
        throw new Error('所有复制方案均失败');
        
      } catch (error) {
        this.showIconFeedback(btn, 'error');
        new Notice('复制失败，请尝试手动复制', 3000);
        this.showManualCopyGuidance();
      }
    } else {
      new Notice('没有可复制的内容，请先执行排版操作');
    }
  }

  private showManualCopyGuidance() {
    const guidance = `复制失败，请手动操作：
    
1. 用鼠标选中预览窗口中的所有内容
2. 按 Ctrl+C (Windows/Linux) 或 Cmd+C (Mac) 复制
3. 在微信公众号编辑器中按 Ctrl+V 粘贴`;
    
    new Notice(guidance, 5000);
    
    // 自动选择内容区域便于用户手动复制
    try {
      const contentArea = this.previewContainer.querySelector('.md2wechat-content-area');
      if (contentArea) {
        const range = document.createRange();
        range.selectNodeContents(contentArea);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    } catch (error) {
      // 静默处理错误
    }
  }

  private openWechat() {
    const wechatUrl = 'https://mp.weixin.qq.com';
    
    try {
      window.open(wechatUrl, '_blank');
      
      const btn = this.toolbarEl.querySelector('.md2wechat-wechat-icon') as HTMLElement;
      this.showIconFeedback(btn, 'success');
      new Notice('微信公众号后台已在新标签页打开', 2000);
      
    } catch (error) {
      new Notice('无法打开微信公众号，请手动访问 https://mp.weixin.qq.com');
    }
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
    this.initializeView();
  }

  async onClose() {
    // 清理工作
    this.contentWrapper?.empty();
  }


  // 图标视觉反馈方法 - 不破坏图标
  private showIconFeedback(element: HTMLElement, type: 'success' | 'error' | 'info', duration: number = 1500) {
    const className = `md2wechat-icon-${type}`;
    
    // 添加反馈样式
    element.addClass(className);
    
    // 移除反馈样式
    setTimeout(() => {
      element.removeClass(className);
    }, duration);
  }

  // 抽屉交互方法
  private toggleDrawer() {
    if (this.isDrawerOpen) {
      this.closeDrawer();
    } else {
      this.openDrawer();
    }
  }

  private openDrawer() {
    this.isDrawerOpen = true;
    this.drawerEl.addClass('md2wechat-drawer-open');
    this.overlayEl.addClass('md2wechat-overlay-visible');
    
    const settingsIcon = this.toolbarEl.querySelector('.md2wechat-settings-icon');
    settingsIcon?.addClass('md2wechat-icon-active');
    
    // 防止页面滚动
    document.body.style.overflow = 'hidden';
  }

  private closeDrawer() {
    this.isDrawerOpen = false;
    this.drawerEl.removeClass('md2wechat-drawer-open');
    this.overlayEl.removeClass('md2wechat-overlay-visible');
    
    const settingsIcon = this.toolbarEl.querySelector('.md2wechat-settings-icon');
    settingsIcon?.removeClass('md2wechat-icon-active');
    
    // 恢复页面滚动
    document.body.style.overflow = '';
  }

  // 主题和字体变更处理已经集成到自定义选择器中

  // 触发重新转换 - 智能处理样式更新
  private async triggerReconversion() {
    const contentArea = this.previewContainer?.querySelector('.md2wechat-content-area');
    if (contentArea && !contentArea.querySelector('.md2wechat-placeholder')) {
      // 优先使用存储的 Markdown 内容重新转换
      if (this.currentMarkdownContent) {
        try {
          await this.reconvertWithStoredContent(this.currentMarkdownContent);
          return;
        } catch (error) {
          // 存储内容转换失败，尝试从活跃编辑器获取
        }
      }
      
      // 回退到从活跃编辑器获取内容
      const activeView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
      if (activeView) {
        try {
          await this.plugin.convertToWechatHTML();
        } catch (error) {
          // 静默处理错误
        }
      }
    }
  }
  
  // 使用存储的 Markdown 内容重新转换
  private async reconvertWithStoredContent(markdownContent: string) {
    if (!this.plugin.settings.apiKey) {
      return; // 没有 API Key 时静默返回
    }

    try {
      // 准备请求数据
      const requestData = {
        markdown: markdownContent,
        theme: this.plugin.settings.theme,
        fontSize: this.plugin.settings.fontSize,
      };

      const response = await fetch('https://www.md2wechat.cn/api/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.plugin.settings.apiKey,
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      
      if (result.code === 0 && result.data && result.data.html) {
        this.setContent(result.data.html);
        new Notice('样式已更新！');
      } else {
        throw new Error(result.msg || '转换失败');
      }

    } catch (error) {
      // 静默处理错误，不显示错误提示
      console.log('样式重新应用失败:', error.message);
    }
  }

  // 更新设置控件值（自定义选择器不需要此方法）
  updateSettingsControls() {
    // 自定义选择器自动显示正确的值
  }

  // 用于外部更新内容的方法
  setContent(html: string, markdownContent?: string) {
    const contentArea = this.previewContainer?.querySelector('.md2wechat-content-area');
    if (contentArea) {
      contentArea.innerHTML = html;
      // 添加滚动到顶部
      contentArea.scrollTop = 0;
      
      // 存储 Markdown 内容以便后续样式切换
      if (markdownContent) {
        this.currentMarkdownContent = markdownContent;
      }
    }
  }
}