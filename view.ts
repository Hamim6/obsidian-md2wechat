// view.ts

import { ItemView, WorkspaceLeaf } from 'obsidian';

export const MD2WECHAT_VIEW_TYPE = 'md2wechat-html-view';

export class Md2WechatView extends ItemView {
  private contentWrapper: HTMLElement;
  private previewContainer: HTMLElement;
  private toolbarEl: HTMLElement;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
    this.initializeView();
  }

  private initializeView() {
    // 清空默认内容
    this.containerEl.empty();
    
    // 创建主容器
    this.contentWrapper = this.containerEl.createEl('div', {
      cls: 'md2wechat-view-wrapper'
    });

    // 创建工具栏
    this.toolbarEl = this.contentWrapper.createEl('div', {
      cls: 'md2wechat-toolbar'
    });
    
    const titleEl = this.toolbarEl.createEl('div', {
      cls: 'md2wechat-toolbar-title',
      text: '公众号样式预览'
    });

    // 按钮组容器
    const buttonGroup = this.toolbarEl.createEl('div', {
      cls: 'md2wechat-button-group'
    });

    const copyBtn = buttonGroup.createEl('button', {
      cls: 'md2wechat-copy-btn',
      text: '复制内容'
    });

    const wechatBtn = buttonGroup.createEl('button', {
      cls: 'md2wechat-wechat-btn',
      text: '打开公众号'
    });

    copyBtn.addEventListener('click', () => this.copyContent());
    wechatBtn.addEventListener('click', () => this.openWechat());

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
      
      console.log('开始复制内容...');
      console.log('内容区域:', contentArea);
      console.log('HTML 长度:', contentArea.innerHTML.length);
      
      const btn = this.toolbarEl.querySelector('.md2wechat-copy-btn') as HTMLElement;
      const originalText = btn.textContent;
      
      try {
        // 方案1: 现代 Clipboard API - 支持多种格式
        if (navigator.clipboard && navigator.clipboard.write) {
          console.log('尝试使用 Clipboard API (方案1)');
          
          const htmlContent = contentArea.innerHTML;
          const textContent = contentArea.textContent || (contentArea as HTMLElement).innerText || '';
          
          const clipboardItems = [
            new ClipboardItem({
              'text/html': new Blob([htmlContent], { type: 'text/html' }),
              'text/plain': new Blob([textContent], { type: 'text/plain' })
            })
          ];
          
          await navigator.clipboard.write(clipboardItems);
          console.log('Clipboard API 复制成功');
          
          btn.textContent = '复制成功!';
          btn.style.backgroundColor = '#34c759';
          
          setTimeout(() => {
            btn.textContent = originalText;
            btn.style.backgroundColor = '';
          }, 2000);
          return;
        }
        
        // 方案2: 选区复制 (execCommand)
        console.log('尝试使用选区复制 (方案2)');
        const range = document.createRange();
        const selection = window.getSelection();
        
        range.selectNodeContents(contentArea); // 选择内容而非节点本身
        selection?.removeAllRanges();
        selection?.addRange(range);
        
        console.log('选区建立完成，范围:', range.toString().substring(0, 100));
        
        // 尝试 execCommand 复制
        const execSuccess = document.execCommand('copy');
        console.log('execCommand 结果:', execSuccess);
        
        // 清除选区
        selection?.removeAllRanges();
        
        if (execSuccess) {
          btn.textContent = '复制成功!';
          btn.style.backgroundColor = '#34c759';
          
          setTimeout(() => {
            btn.textContent = originalText;
            btn.style.backgroundColor = '';
          }, 2000);
          return;
        }
        
        // 方案3: 回退到纯文本 Clipboard API
        if (navigator.clipboard && navigator.clipboard.writeText) {
          console.log('尝试纯文本复制 (方案3)');
          const textContent = contentArea.textContent || (contentArea as HTMLElement).innerText || '';
          await navigator.clipboard.writeText(textContent);
          
          btn.textContent = '文本已复制';
          btn.style.backgroundColor = '#f39c12';
          
          setTimeout(() => {
            btn.textContent = originalText;
            btn.style.backgroundColor = '';
          }, 2000);
          
          console.log('纯文本复制成功');
          return;
        }
        
        throw new Error('所有复制方案均失败');
        
      } catch (error) {
        console.error('复制过程出错:', error);
        console.error('错误详情:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        
        // 错误状态反馈
        btn.textContent = '复制失败';
        btn.style.backgroundColor = '#ff3b30';
        
        setTimeout(() => {
          btn.textContent = originalText;
          btn.style.backgroundColor = '';
        }, 2000);
        
        // 方案4: 手动复制指导
        this.showManualCopyGuidance();
      }
    } else {
      console.log('没有可复制的内容');
      alert('没有可复制的内容，请先执行排版操作。');
    }
  }

  private showManualCopyGuidance() {
    // 创建提示模态框或提示信息
    const guidance = `复制失败，请手动操作：
    
1. 用鼠标选中预览窗口中的所有内容
2. 按 Ctrl+C (Windows/Linux) 或 Cmd+C (Mac) 复制
3. 在微信公众号编辑器中按 Ctrl+V 粘贴

如果仍有问题，请检查浏览器权限设置。`;
    
    alert(guidance);
    
    // 可选：自动选择内容区域便于用户手动复制
    try {
      const contentArea = this.previewContainer.querySelector('.md2wechat-content-area');
      if (contentArea) {
        const range = document.createRange();
        range.selectNodeContents(contentArea);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
        console.log('已自动选择内容，用户可手动复制');
      }
    } catch (error) {
      console.log('无法自动选择内容:', error);
    }
  }

  private openWechat() {
    // 打开微信公众号平台
    const wechatUrl = 'https://mp.weixin.qq.com';
    
    try {
      // 在新标签页中打开
      window.open(wechatUrl, '_blank');
      
      // 按钮反馈
      const btn = this.toolbarEl.querySelector('.md2wechat-wechat-btn') as HTMLElement;
      const originalText = btn.textContent;
      btn.textContent = '已打开';
      btn.style.backgroundColor = '#10ac84';
      
      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.backgroundColor = '';
      }, 1500);
      
    } catch (error) {
      console.error('打开微信公众号失败:', error);
      alert('无法打开微信公众号，请手动访问 https://mp.weixin.qq.com');
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
    // 视图已在 initializeView 中初始化
  }

  async onClose() {
    // 清理工作
    this.contentWrapper?.empty();
  }

  // 用于外部更新内容的方法
  setContent(html: string) {
    const contentArea = this.previewContainer?.querySelector('.md2wechat-content-area');
    if (contentArea) {
      contentArea.innerHTML = html;
      // 添加滚动到顶部
      contentArea.scrollTop = 0;
    }
  }
}