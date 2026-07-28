/**
 * App - 主应用框架
 */
const App = {
  currentPage: 'work-calendar',
  sidebarOpen: false,

  // 导航配置
  nav: [
    {
      group: '工作区',
      items: [
        { id: 'work-calendar', name: '日程表', icon: '📅' },
        { id: 'work-todo', name: '待办清单', icon: '✅' },
        { id: 'work-knowledge', name: '知识库', icon: '📚' },
      ]
    },
    {
      group: '自媒体运营',
      items: [
        { id: 'media-dashboard', name: '运营概览', icon: '📊' },
        { id: 'media-hotspot', name: '热点速报', icon: '🔥' },
        { id: 'media-topic', name: '选题管理', icon: '💡' },
        { id: 'media-data', name: '数据分析', icon: '📈' },
        { id: 'media-quarterly', name: '季度报表', icon: '🗂️' },
      ]
    },
    {
      group: '个人成长',
      items: [
        { id: 'grow-finance', name: '理财学习', icon: '💰' },
        { id: 'grow-sidehustle', name: '副业探索', icon: '🚀' },
        { id: 'grow-reading', name: '书籍阅读', icon: '📖' },
        { id: 'grow-record', name: '记录库', icon: '✍️' },
      ]
    },
    {
      group: '个人计划',
      items: [
        { id: 'plan-list', name: '计划清单', icon: '🎯' },
      ]
    },
    {
      group: '系统',
      items: [
        { id: 'system-ai', name: 'AI使用指南', icon: '🤖' },
        { id: 'system-settings', name: '设置', icon: '⚙️' },
      ]
    }
  ],

  init() {
    DefaultData.init();
    Toast.init();
    this.renderSidebar();
    this.bindEvents();
    this.navigate(this.currentPage);
    this.checkDailyUpdate();

    // 检查是否首次访问
    const settings = Store.get('settings');
    if (!settings.lastVisit) {
      setTimeout(() => {
        Toast.show('欢迎使用工作台！数据自动保存在本地，建议定期导出备份 📥', 'success', 4000);
      }, 500);
    }
    settings.lastVisit = new Date().toISOString();
    Store.set('settings', settings);
  },

  // 渲染侧边栏
  renderSidebar() {
    const nav = document.getElementById('sidebarNav');
    nav.innerHTML = this.nav.map(group => `
      <div class="nav-group">
        <div class="nav-group-title">${group.group}</div>
        ${group.items.map(item => `
          <div class="nav-item ${item.id === this.currentPage ? 'active' : ''}" data-page="${item.id}">
            <span class="icon">${item.icon}</span>
            <span>${item.name}</span>
          </div>
        `).join('')}
      </div>
    `).join('');

    // 绑定点击
    nav.querySelectorAll('.nav-item').forEach(el => {
      el.addEventListener('click', () => {
        const page = el.dataset.page;
        this.navigate(page);
        if (window.innerWidth <= 768) this.closeSidebar();
      });
    });
  },

  // 绑定全局事件
  bindEvents() {
    // 菜单切换（移动端）
    document.getElementById('menuToggle').addEventListener('click', () => this.toggleSidebar());
    document.getElementById('sidebarOverlay').addEventListener('click', () => this.closeSidebar());

    // 主题切换
    document.getElementById('themeToggle').addEventListener('click', () => {
      const settings = Store.get('settings');
      settings.theme = settings.theme === 'dark' ? 'light' : 'dark';
      Store.set('settings', settings);
      this.applyTheme();
    });

    // 导出数据
    document.getElementById('exportBtn').addEventListener('click', () => this.exportData());

    this.applyTheme();
  },

  // 切换页面
  navigate(pageId) {
    this.currentPage = pageId;

    // 更新导航高亮
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.page === pageId);
    });

    // 更新标题
    const item = this.findNavItem(pageId);
    document.getElementById('pageTitle').textContent = item ? `${item.icon} ${item.name}` : '工作台';

    // 渲染页面
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const pageEl = document.getElementById('page-' + pageId);
    if (pageEl) {
      pageEl.classList.add('active');
      // 调用页面渲染函数
      if (Pages[pageId] && typeof Pages[pageId].render === 'function') {
        Pages[pageId].render();
      }
    }
  },

  // 查找导航项
  findNavItem(id) {
    for (const group of this.nav) {
      const item = group.items.find(i => i.id === id);
      if (item) return item;
    }
    return null;
  },

  // 应用主题
  applyTheme() {
    const settings = Store.get('settings');
    document.documentElement.setAttribute('data-theme', settings.theme);
    const btn = document.getElementById('themeToggle');
    btn.textContent = settings.theme === 'dark' ? '☀️' : '🌙';
  },

  // 侧边栏切换
  toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebarOverlay').classList.toggle('active');
  },
  closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('active');
  },

  // 导出数据
  exportData() {
    const data = Store.exportAll();
    const json = JSON.stringify(data, null, 2);
    Utils.download(`workbench-backup-${Utils.today()}.json`, json, 'application/json');
    Toast.show(`数据已导出 (${Store.getSize()} KB)`, 'success');
  },

  // 每日检查
  checkDailyUpdate() {
    const today = Utils.today();
    const lastCheck = Store.get('lastDailyCheck');
    if (lastCheck !== today) {
      Store.set('lastDailyCheck', today);
      // 可以在这里触发每日热点更新等
    }
  }
};

// 启动
document.addEventListener('DOMContentLoaded', () => App.init());
