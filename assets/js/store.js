/**
 * Store - 本地数据存储管理
 * 基于 localStorage 的封装，支持命名空间、数据迁移、导入导出
 */
const Store = {
  PREFIX: 'wb_',
  VERSION: '1.0.0',

  // 读取
  get(key, defaultValue = null) {
    try {
      const raw = localStorage.getItem(this.PREFIX + key);
      if (raw === null) return defaultValue;
      return JSON.parse(raw);
    } catch (e) {
      console.error('Store.get error:', key, e);
      return defaultValue;
    }
  },

  // 写入
  set(key, value) {
    try {
      localStorage.setItem(this.PREFIX + key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Store.set error:', key, e);
      Toast.show('存储空间不足，请清理旧数据', 'error');
      return false;
    }
  },

  // 删除
  remove(key) {
    localStorage.removeItem(this.PREFIX + key);
  },

  // 清空所有
  clear() {
    Object.keys(localStorage)
      .filter(k => k.startsWith(this.PREFIX))
      .forEach(k => localStorage.removeItem(k));
  },

  // 导出全部数据
  exportAll() {
    const data = {};
    Object.keys(localStorage)
      .filter(k => k.startsWith(this.PREFIX))
      .forEach(k => {
        const key = k.replace(this.PREFIX, '');
        try { data[key] = JSON.parse(localStorage.getItem(k)); }
        catch { data[key] = localStorage.getItem(k); }
      });
    return { version: this.VERSION, exportDate: new Date().toISOString(), data };
  },

  // 导入数据
  importAll(jsonStr) {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed.data) throw new Error('格式错误');
      Object.keys(parsed.data).forEach(key => {
        this.set(key, parsed.data[key]);
      });
      return true;
    } catch (e) {
      console.error('Import error:', e);
      return false;
    }
  },

  // 获取存储大小
  getSize() {
    let total = 0;
    Object.keys(localStorage)
      .filter(k => k.startsWith(this.PREFIX))
      .forEach(k => { total += localStorage.getItem(k).length; });
    return (total / 1024).toFixed(1); // KB
  }
};

/**
 * Toast 通知
 */
const Toast = {
  container: null,
  init() {
    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    document.body.appendChild(this.container);
  },
  show(msg, type = 'info', duration = 2500) {
    if (!this.container) this.init();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = msg;
    this.container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.25s';
      setTimeout(() => toast.remove(), 250);
    }, duration);
  }
};

/**
 * 工具函数
 */
const Utils = {
  // 日期格式化
  formatDate(date, fmt = 'YYYY-MM-DD') {
    const d = new Date(date);
    const map = {
      YYYY: d.getFullYear(),
      MM: String(d.getMonth() + 1).padStart(2, '0'),
      DD: String(d.getDate()).padStart(2, '0'),
      HH: String(d.getHours()).padStart(2, '0'),
      mm: String(d.getMinutes()).padStart(2, '0'),
      ss: String(d.getSeconds()).padStart(2, '0')
    };
    return fmt.replace(/YYYY|MM|DD|HH|mm|ss/g, m => map[m]);
  },

  // 今天的日期
  today() {
    return this.formatDate(new Date());
  },

  // 获取本周日期范围
  getWeekRange(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay() || 7; // 周日为7
    const monday = new Date(d);
    monday.setDate(d.getDate() - day + 1);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { start: monday, end: sunday };
  },

  // 获取月份天数
  getMonthDays(year, month) {
    return new Date(year, month + 1, 0).getDate();
  },

  // 获取月份第一天是星期几
  getFirstDay(year, month) {
    return new Date(year, month, 1).getDay() || 7;
  },

  // 唯一ID
  uid() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  },

  // 文件转Base64
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  // 下载文件
  download(filename, content, type = 'text/plain') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },

  // 防抖
  debounce(fn, delay = 300) {
    let timer;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  // 相对时间
  timeAgo(date) {
    const diff = Date.now() - new Date(date).getTime();
    const min = 60 * 1000, hour = 60 * min, day = 24 * hour;
    if (diff < min) return '刚刚';
    if (diff < hour) return Math.floor(diff / min) + '分钟前';
    if (diff < day) return Math.floor(diff / hour) + '小时前';
    if (diff < 7 * day) return Math.floor(diff / day) + '天前';
    return this.formatDate(date, 'MM-DD');
  }
};

/**
 * 默认数据初始化
 */
const DefaultData = {
  init() {
    // 账号配置
    if (!Store.get('accounts')) {
      Store.set('accounts', [
        { id: 'acc_1', name: '女性成长好物分享', platforms: ['小红书', '抖音', '微博'], category: '女性成长', color: '#fd79a8', createdAt: new Date().toISOString() },
        { id: 'acc_2', name: '居家租房好物', platforms: ['小红书', '抖音'], category: '居家生活', color: '#00b894', createdAt: new Date().toISOString() }
      ]);
    }

    // 待办事项
    if (!Store.get('todos')) Store.set('todos', []);

    // 日程任务
    if (!Store.get('tasks')) Store.set('tasks', []);

    // 知识库笔记
    if (!Store.get('notes')) Store.set('notes', []);

    // 热点记录
    if (!Store.get('hotspots')) Store.set('hotspots', {});

    // 选题记录
    if (!Store.get('topics')) Store.set('topics', []);

    // 运营数据
    if (!Store.get('analytics')) Store.set('analytics', []);

    // 理财记录
    if (!Store.get('finance')) Store.set('finance', { salaryPlan: [], fundLearning: [], fundHotspots: [] });

    // 副业探索
    if (!Store.get('sidehustle')) Store.set('sidehustle', []);

    // 书籍阅读
    if (!Store.get('books')) Store.set('books', []);

    // 记录库
    if (!Store.get('records')) Store.set('records', []);

    // 个人计划
    if (!Store.get('plans')) Store.set('plans', []);

    // 设置
    if (!Store.get('settings')) {
      Store.set('settings', { theme: 'light', username: '我', lastVisit: null });
    }
  }
};
