/**
 * 个人计划模块 + 系统模块
 */
const PlanModule = {
  list: {
    filter: 'all',

    render() {
      const el = document.getElementById('page-plan-list');
      const plans = Store.get('plans') || [];

      const active = plans.filter(p => !p.done);
      const completed = plans.filter(p => p.done);

      el.innerHTML = `
        <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div class="flex gap-2">
            <button class="btn btn-sm ${this.filter === 'all' ? 'btn-primary' : ''}" onclick="PlanModule.list.setFilter('all')">全部 (${plans.length})</button>
            <button class="btn btn-sm ${this.filter === 'active' ? 'btn-primary' : ''}" onclick="PlanModule.list.setFilter('active')">进行中 (${active.length})</button>
            <button class="btn btn-sm ${this.filter === 'done' ? 'btn-primary' : ''}" onclick="PlanModule.list.setFilter('done')">已完成 (${completed.length})</button>
          </div>
          <button class="btn btn-primary btn-sm" onclick="PlanModule.list.add()">+ 新建计划</button>
        </div>

        <!-- 进度概览 -->
        ${plans.length ? `
          <div class="card mb-4">
            <div class="flex items-center justify-between mb-2">
              <div class="card-title">整体进度</div>
              <span class="text-sm font-bold">${completed.length}/${plans.length} (${Math.round(completed.length/plans.length*100)}%)</span>
            </div>
            <div class="progress-bar" style="height:10px;">
              <div class="progress-bar-fill" style="width:${completed.length/plans.length*100}%;"></div>
            </div>
          </div>
        ` : ''}

        <div id="plansList"></div>
      `;

      this.renderList();
    },

    setFilter(f) {
      this.filter = f;
      this.render();
    },

    renderList() {
      const container = document.getElementById('plansList');
      let plans = Store.get('plans') || [];

      if (this.filter === 'active') plans = plans.filter(p => !p.done);
      else if (this.filter === 'done') plans = plans.filter(p => p.done);

      plans.sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1;
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return (priorityOrder[a.priority]||1) - (priorityOrder[b.priority]||1);
      });

      if (!plans.length) {
        container.innerHTML = `
          <div class="card">
            <div class="empty-state">
              <div class="icon">🎯</div>
              <div class="title">暂无计划</div>
              <div class="desc">设定你的个人目标计划</div>
            </div>
          </div>
        `;
        return;
      }

      const priorityMap = {
        high: { label: '🔴 高', tag: 'tag-danger' },
        medium: { label: '🟡 中', tag: 'tag-warning' },
        low: { label: '🟢 低', tag: 'tag-success' }
      };
      const typeMap = {
        goal: '🎯 目标', habit: '🔄 习惯', project: '📋 项目', other: '📌 其他'
      };

      container.innerHTML = plans.map(p => `
        <div class="card" style="${p.done ? 'opacity:0.6;' : ''}">
          <div class="flex items-start gap-3">
            <span class="checkbox ${p.done ? 'checked' : ''}" onclick="PlanModule.list.toggle('${p.id}')"></span>
            <div class="flex-1">
              <div style="font-size:15px;font-weight:600;${p.done ? 'text-decoration:line-through;' : ''}">${p.title}</div>
              ${p.description ? `<div class="text-sm text-secondary mt-2">${p.description}</div>` : ''}
              <div class="flex items-center gap-2 mt-3 flex-wrap">
                <span class="tag ${priorityMap[p.priority]?.tag || ''}">${priorityMap[p.priority]?.label || '🟡 中'}</span>
                <span class="tag tag-primary">${typeMap[p.type] || '📌 其他'}</span>
                ${p.deadline ? `<span class="tag ${p.deadline < Utils.today() && !p.done ? 'tag-danger' : ''}">📅 ${p.deadline}</span>` : ''}
                ${p.progress ? `<span class="tag">进度 ${p.progress}%</span>` : ''}
              </div>
              ${p.progress ? `<div class="progress-bar mt-3"><div class="progress-bar-fill" style="width:${p.progress}%;"></div></div>` : ''}
              <div class="text-xs text-muted mt-3">${Utils.timeAgo(p.createdAt)}</div>
            </div>
            <div class="flex flex-col gap-1">
              <button class="btn btn-sm btn-ghost" onclick="PlanModule.list.edit('${p.id}')">✏️</button>
              <button class="btn btn-sm btn-ghost" onclick="PlanModule.list.delete('${p.id}')">🗑️</button>
            </div>
          </div>
        </div>
      `).join('');
    },

    add() {
      Modal.show({
        title: '新建计划',
        content: `
          <div class="flex flex-col gap-3">
            <div>
              <label class="text-sm text-secondary mb-2 block">计划标题</label>
              <input class="input" id="pTitle" placeholder="如：学会理财、读完10本书..." autofocus>
            </div>
            <div>
              <label class="text-sm text-secondary mb-2 block">描述</label>
              <textarea class="textarea" id="pDesc" placeholder="详细描述..."></textarea>
            </div>
            <div class="grid grid-2">
              <div>
                <label class="text-sm text-secondary mb-2 block">类型</label>
                <select class="select" id="pType">
                  <option value="goal">🎯 目标</option>
                  <option value="habit">🔄 习惯</option>
                  <option value="project">📋 项目</option>
                  <option value="other">📌 其他</option>
                </select>
              </div>
              <div>
                <label class="text-sm text-secondary mb-2 block">优先级</label>
                <select class="select" id="pPriority">
                  <option value="high">🔴 高</option>
                  <option value="medium" selected>🟡 中</option>
                  <option value="low">🟢 低</option>
                </select>
              </div>
            </div>
            <div>
              <label class="text-sm text-secondary mb-2 block">截止日期</label>
              <input type="date" class="input" id="pDeadline">
            </div>
            <div>
              <label class="text-sm text-secondary mb-2 block">初始进度（%）</label>
              <input type="range" id="pProgress" min="0" max="100" value="0" style="width:100%;">
              <span id="pProgressLabel" class="text-sm">0%</span>
            </div>
          </div>
        `,
        onConfirm: () => {
          const title = document.getElementById('pTitle').value.trim();
          if (!title) { Toast.show('请输入标题', 'error'); return false; }
          const plans = Store.get('plans') || [];
          plans.push({
            id: Utils.uid(),
            title,
            description: document.getElementById('pDesc').value.trim(),
            type: document.getElementById('pType').value,
            priority: document.getElementById('pPriority').value,
            deadline: document.getElementById('pDeadline').value,
            progress: parseInt(document.getElementById('pProgress').value),
            done: false,
            createdAt: new Date().toISOString()
          });
          Store.set('plans', plans);
          Toast.show('计划已创建', 'success');
          this.render();
          return true;
        }
      });

      const slider = document.getElementById('pProgress');
      const label = document.getElementById('pProgressLabel');
      slider.addEventListener('input', () => label.textContent = slider.value + '%');
    },

    edit(id) {
      const plans = Store.get('plans') || [];
      const plan = plans.find(p => p.id === id);
      if (!plan) return;

      Modal.show({
        title: '编辑计划',
        content: `
          <div class="flex flex-col gap-3">
            <input class="input" id="pTitle" value="${plan.title}">
            <textarea class="textarea" id="pDesc">${plan.description||''}</textarea>
            <div class="grid grid-2">
              <select class="select" id="pType">
                ${['goal','habit','project','other'].map(t => `<option value="${t}" ${plan.type===t?'selected':''}>${({goal:'🎯 目标',habit:'🔄 习惯',project:'📋 项目',other:'📌 其他'})[t]}</option>`).join('')}
              </select>
              <select class="select" id="pPriority">
                ${['high','medium','low'].map(p => `<option value="${p}" ${plan.priority===p?'selected':''}>${({high:'🔴 高',medium:'🟡 中',low:'🟢 低'})[p]}</option>`).join('')}
              </select>
            </div>
            <input type="date" class="input" id="pDeadline" value="${plan.deadline||''}">
            <input type="range" id="pProgress" min="0" max="100" value="${plan.progress||0}" style="width:100%;">
            <span id="pProgressLabel" class="text-sm">${plan.progress||0}%</span>
          </div>
        `,
        onConfirm: () => {
          plan.title = document.getElementById('pTitle').value.trim();
          plan.description = document.getElementById('pDesc').value.trim();
          plan.type = document.getElementById('pType').value;
          plan.priority = document.getElementById('pPriority').value;
          plan.deadline = document.getElementById('pDeadline').value;
          plan.progress = parseInt(document.getElementById('pProgress').value);
          if (plan.progress >= 100) plan.done = true;
          Store.set('plans', plans);
          Toast.show('已更新', 'success');
          this.render();
          return true;
        }
      });

      const slider = document.getElementById('pProgress');
      const label = document.getElementById('pProgressLabel');
      slider.addEventListener('input', () => label.textContent = slider.value + '%');
    },

    toggle(id) {
      const plans = Store.get('plans') || [];
      const plan = plans.find(p => p.id === id);
      if (plan) {
        plan.done = !plan.done;
        if (plan.done) plan.progress = 100;
        Store.set('plans', plans);
        Toast.show(plan.done ? '🎉 完成！' : '已重新标记为进行中', 'success');
        this.render();
      }
    },

    delete(id) {
      Modal.confirm('确认删除这个计划？', () => {
        let plans = Store.get('plans') || [];
        plans = plans.filter(p => p.id !== id);
        Store.set('plans', plans);
        Toast.show('已删除', 'success');
        this.render();
      });
    }
  }
};

/**
 * 系统模块 - AI使用指南 + 设置
 */
const SystemModule = {
  ai: {
    render() {
      const el = document.getElementById('page-system-ai');
      el.innerHTML = `
        <div class="card">
          <div class="card-header">
            <div class="card-title">🤖 AI 功能使用指南</div>
          </div>
          <div style="font-size:14px;line-height:1.8;color:var(--text-secondary);">
            本工作台的 AI 功能采用<strong>「预留接口 + 手动协作」</strong>模式。<br>
            你可以通过 AI 助手（如 WorkBuddy）处理图片识别、热点抓取、选题生成等任务，再将结果粘贴回工作台自动解析。
          </div>
        </div>

        <div class="grid grid-2">
          <div class="card">
            <div class="card-title mb-3">📅 日程 AI 导入</div>
            <div style="font-size:13px;line-height:1.8;">
              <strong>功能位置：</strong>工作区 → 日程表 → AI导入<br><br>
              <strong>使用场景：</strong><br>
              · 拍照记录白板上的任务<br>
              · 截图微信/钉钉里的工作安排<br>
              · 语音转文字后的会议纪要<br><br>
              <strong>操作步骤：</strong><br>
              1. 将图片发给 AI 助手<br>
              2. 告诉AI：「提取图片中的任务，标注日期和重要性」<br>
              3. 复制AI返回的文本<br>
              4. 在日程表点击「AI导入」，粘贴文本<br>
              5. 系统自动识别日期和优先级
            </div>
          </div>

          <div class="card">
            <div class="card-title mb-3">📚 知识库 OCR 识字</div>
            <div style="font-size:13px;line-height:1.8;">
              <strong>功能位置：</strong>工作区 → 知识库 → 拍照识字<br><br>
              <strong>使用场景：</strong><br>
              · 拍书本/课件内容，整理成笔记<br>
              · 截图会议PPT，提取文字<br>
              · 拍照记录纸质文档<br><br>
              <strong>操作步骤：</strong><br>
              1. 拍照后发给 AI 助手<br>
              2. 告诉AI：「识别图片文字，整理成笔记」<br>
              3. 复制整理好的内容<br>
              4. 在知识库点击「拍照识字」<br>
              5. 粘贴内容，选择分类后保存
            </div>
          </div>

          <div class="card">
            <div class="card-title mb-3">🔥 热点抓取</div>
            <div style="font-size:13px;line-height:1.8;">
              <strong>功能位置：</strong>自媒体 → 热点速报 → 获取热点<br><br>
              <strong>支持平台：</strong>微博、抖音、小红书、知乎<br><br>
              <strong>操作步骤：</strong><br>
              1. 打开各平台查看热搜榜<br>
              2. 截图或复制热点列表<br>
              3. 发给AI助手整理<br>
              4. 告诉AI：「整理格式：平台|标题|热度」<br>
              5. 粘贴到热点速报页面解析<br>
              6. 可一键将热点转为选题
            </div>
          </div>

          <div class="card">
            <div class="card-title mb-3">💡 AI 选题推荐</div>
            <div style="font-size:13px;line-height:1.8;">
              <strong>功能位置：</strong>自媒体 → 选题管理<br><br>
              <strong>使用场景：</strong><br>
              · 结合热点生成选题方向<br>
              · 根据账号定位推荐内容<br><br>
              <strong>操作步骤：</strong><br>
              1. 在热点速报中点击「转选题」<br>
              2. 或直接在选题管理中新建<br>
              3. 也可让AI根据账号定位推荐选题<br>
              4. 告诉AI：「我的账号是XX领域，推荐5个选题」<br>
              5. 粘贴到选题表格中
            </div>
          </div>

          <div class="card">
            <div class="card-title mb-3">📖 AI 书籍探讨</div>
            <div style="font-size:13px;line-height:1.8;">
              <strong>功能位置：</strong>个人成长 → 书籍阅读 → AI探讨<br><br>
              <strong>使用场景：</strong><br>
              · 与AI讨论书中观点<br>
              · 深入理解书籍内容<br>
              · 对比不同书籍的观点<br><br>
              <strong>操作步骤：</strong><br>
              1. 选择正在读的书<br>
              2. 输入你的思考或疑问<br>
              3. 将问题发给AI助手<br>
              4. 将探讨结论记录回笔记
            </div>
          </div>

          <div class="card">
            <div class="card-title mb-3">🚀 AI 副业推荐</div>
            <div style="font-size:13px;line-height:1.8;">
              <strong>功能位置：</strong>个人成长 → 副业探索 → AI推荐<br><br>
              <strong>使用场景：</strong><br>
              · 根据个人技能推荐副业<br>
              · 探索新的搞钱方向<br><br>
              <strong>操作步骤：</strong><br>
              1. 告诉AI你的技能和时间<br>
              2. 例如：「上班族，周末有空，擅长写作」<br>
              3. AI返回推荐后粘贴<br>
              4. 系统自动解析成思路卡片
            </div>
          </div>

          <div class="card">
            <div class="card-title mb-3">💰 基金热点获取</div>
            <div style="font-size:13px;line-height:1.8;">
              <strong>功能位置：</strong>个人成长 → 理财学习<br><br>
              <strong>使用场景：</strong><br>
              · 每日基金市场热点<br>
              · 板块涨跌信息<br><br>
              <strong>操作步骤：</strong><br>
              1. 查看基金APP热点<br>
              2. 截图发给AI整理<br>
              3. 告诉AI：「整理格式：板块|基金|涨跌|幅度|说明」<br>
              4. 粘贴解析
            </div>
          </div>

          <div class="card" style="background:linear-gradient(135deg,rgba(108,92,231,0.08),rgba(253,121,168,0.08));border:none;">
            <div class="card-title mb-3">💡 AI 使用小贴士</div>
            <div style="font-size:13px;line-height:1.8;">
              · 所有AI功能都不依赖API，完全通过手动协作完成<br>
              · 你可以随时在微信中找到 WorkBuddy 发送图片或文字<br>
              · 建议每天固定时间（如早上9点）获取热点和数据<br>
              · 重要数据请定期导出备份<br>
              · 当前存储占用：<strong>${Store.getSize()} KB</strong>
            </div>
          </div>
        </div>
      `;
    }
  },

  settings: {
    render() {
      const el = document.getElementById('page-system-settings');
      const settings = Store.get('settings') || {};
      const size = Store.getSize();

      // 统计各模块数据量
      const stats = {
        tasks: (Store.get('tasks')||[]).length,
        todos: (Store.get('todos')||[]).length,
        notes: (Store.get('notes')||[]).length,
        topics: (Store.get('topics')||[]).length,
        analytics: (Store.get('analytics')||[]).length,
        books: (Store.get('books')||[]).length,
        records: (Store.get('records')||[]).length,
        plans: (Store.get('plans')||[]).length
      };

      el.innerHTML = `
        <div class="card">
          <div class="card-title mb-3">⚙️ 基本设置</div>
          <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <div>
                <div style="font-weight:500;">用户名</div>
                <div class="text-xs text-muted">显示在界面中</div>
              </div>
              <input class="input" style="width:180px;" id="setUsername" value="${settings.username || '我'}">
            </div>
            <div class="flex items-center justify-between">
              <div>
                <div style="font-weight:500;">主题模式</div>
                <div class="text-xs text-muted">亮色/暗色切换</div>
              </div>
              <button class="btn btn-sm" onclick="document.getElementById('themeToggle').click()">
                ${settings.theme === 'dark' ? '☀️ 亮色' : '🌙 暗色'}
              </button>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-title mb-3">📊 数据统计</div>
          <div class="grid grid-4" style="gap:8px;">
            <div class="text-center" style="background:var(--bg-hover);padding:12px;border-radius:8px;">
              <div style="font-size:22px;font-weight:700;color:var(--primary);">${stats.tasks}</div>
              <div class="text-xs text-muted">日程任务</div>
            </div>
            <div class="text-center" style="background:var(--bg-hover);padding:12px;border-radius:8px;">
              <div style="font-size:22px;font-weight:700;color:var(--success);">${stats.todos}</div>
              <div class="text-xs text-muted">待办事项</div>
            </div>
            <div class="text-center" style="background:var(--bg-hover);padding:12px;border-radius:8px;">
              <div style="font-size:22px;font-weight:700;color:var(--accent);">${stats.notes}</div>
              <div class="text-xs text-muted">知识笔记</div>
            </div>
            <div class="text-center" style="background:var(--bg-hover);padding:12px;border-radius:8px;">
              <div style="font-size:22px;font-weight:700;color:var(--info);">${stats.topics}</div>
              <div class="text-xs text-muted">选题</div>
            </div>
            <div class="text-center" style="background:var(--bg-hover);padding:12px;border-radius:8px;">
              <div style="font-size:22px;font-weight:700;color:var(--warning);">${stats.analytics}</div>
              <div class="text-xs text-muted">运营数据</div>
            </div>
            <div class="text-center" style="background:var(--bg-hover);padding:12px;border-radius:8px;">
              <div style="font-size:22px;font-weight:700;color:var(--danger);">${stats.books}</div>
              <div class="text-xs text-muted">书籍</div>
            </div>
            <div class="text-center" style="background:var(--bg-hover);padding:12px;border-radius:8px;">
              <div style="font-size:22px;font-weight:700;color:var(--primary);">${stats.records}</div>
              <div class="text-xs text-muted">记录</div>
            </div>
            <div class="text-center" style="background:var(--bg-hover);padding:12px;border-radius:8px;">
              <div style="font-size:22px;font-weight:700;color:var(--success);">${stats.plans}</div>
              <div class="text-xs text-muted">计划</div>
            </div>
          </div>
          <div class="mt-3 text-center text-sm text-muted">存储占用：<strong>${size} KB</strong></div>
        </div>

        <div class="card">
          <div class="card-title mb-3">💾 数据管理</div>
          <div class="flex gap-2 flex-wrap">
            <button class="btn btn-primary" onclick="App.exportData()">📥 导出全部数据</button>
            <button class="btn" onclick="SystemModule.settings.importData()">📤 导入数据</button>
            <button class="btn btn-danger" onclick="SystemModule.settings.clearAll()">🗑️ 清空所有数据</button>
          </div>
          <div class="mt-3 text-xs text-muted">
            💡 建议每周导出一次数据备份。数据存储在浏览器本地，清除浏览器缓存会导致数据丢失。
          </div>
        </div>

        <div class="card">
          <div class="card-title mb-3">ℹ️ 关于</div>
          <div style="font-size:13px;line-height:1.8;color:var(--text-secondary);">
            <strong>个人工作台 v1.0.0</strong><br>
            · 纯本地存储，无需联网<br>
            · 支持电脑和手机自适应<br>
            · AI功能通过 WorkBuddy 助手协作完成<br>
            · 数据完全私有，不上传任何服务器
          </div>
        </div>
      `;

      // 用户名保存
      document.getElementById('setUsername').addEventListener('change', Utils.debounce((e) => {
        settings.username = e.target.value;
        Store.set('settings', settings);
        Toast.show('用户名已更新', 'success');
      }, 500));
    },

    importData() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (Store.importAll(ev.target.result)) {
            Toast.show('数据导入成功！页面将刷新...', 'success');
            setTimeout(() => location.reload(), 1500);
          } else {
            Toast.show('导入失败，文件格式错误', 'error');
          }
        };
        reader.readAsText(file);
      };
      input.click();
    },

    clearAll() {
      Modal.show({
        title: '⚠️ 确认清空所有数据？',
        content: `
          <div style="font-size:14px;line-height:1.8;color:var(--danger);">
            此操作将删除所有数据，包括：<br>
            · 日程任务和待办事项<br>
            · 知识库笔记<br>
            · 自媒体选题和数据<br>
            · 个人成长记录<br>
            · 所有计划和设置<br><br>
            <strong>建议先导出备份！</strong><br>
            确认清空请在下方输入「确认清空」
          </div>
          <input class="input mt-3" id="confirmText" placeholder="输入「确认清空」" style="margin-top:12px;">
        `,
        confirmText: '清空',
        onConfirm: () => {
          const text = document.getElementById('confirmText').value.trim();
          if (text !== '确认清空') {
            Toast.show('请输入「确认清空」以确认', 'error');
            return false;
          }
          Store.clear();
          Toast.show('所有数据已清空，页面将刷新...', 'success');
          setTimeout(() => location.reload(), 1500);
          return true;
        }
      });
    }
  }
};

/**
 * Modal 弹窗组件
 */
const Modal = {
  currentConfirm: null,

  show({ title, content, onConfirm, confirmText = '确认', cancelText = '取消' }) {
    this.close();
    this.currentConfirm = onConfirm;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.id = 'modalOverlay';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">${title}</div>
          <button class="modal-close" onclick="Modal.close()">✕</button>
        </div>
        <div class="modal-body">${content}</div>
        <div class="modal-footer">
          <button class="btn" onclick="Modal.close()">${cancelText}</button>
          <button class="btn btn-primary" id="modalConfirmBtn">${confirmText}</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    // 点击遮罩关闭
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.close();
    });

    // 确认按钮
    document.getElementById('modalConfirmBtn').addEventListener('click', () => {
      if (this.currentConfirm) {
        const result = this.currentConfirm();
        if (result !== false) this.close();
      } else {
        this.close();
      }
    });

    // 自动聚焦第一个输入框
    setTimeout(() => {
      const firstInput = overlay.querySelector('input, textarea, select');
      if (firstInput) firstInput.focus();
    }, 100);
  },

  confirm(message, onConfirm) {
    this.show({
      title: '确认',
      content: `<div style="font-size:14px;line-height:1.6;">${message}</div>`,
      confirmText: '确认',
      onConfirm: () => { onConfirm(); return true; }
    });
  },

  close() {
    const overlay = document.getElementById('modalOverlay');
    if (overlay) overlay.remove();
    this.currentConfirm = null;
  }
};

/**
 * 页面路由注册
 */
const Pages = {
  'work-calendar': WorkModule.calendar,
  'work-todo': WorkModule.todo,
  'work-knowledge': WorkModule.knowledge,
  'media-dashboard': MediaModule.dashboard,
  'media-hotspot': MediaModule.hotspot,
  'media-topic': MediaModule.topic,
  'media-data': MediaModule.data,
  'media-quarterly': MediaModule.quarterly,
  'grow-finance': GrowModule.finance,
  'grow-sidehustle': GrowModule.sidehustle,
  'grow-reading': GrowModule.reading,
  'grow-record': GrowModule.record,
  'plan-list': PlanModule.list,
  'system-ai': SystemModule.ai,
  'system-settings': SystemModule.settings,
};
