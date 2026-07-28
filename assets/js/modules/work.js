/**
 * 工作区模块
 */
const WorkModule = {
  // ===== 日程表 =====
  calendar: {
    view: 'month', // 'month' or 'week'
    currentDate: new Date(),
    selectedDate: Utils.today(),

    render() {
      const el = document.getElementById('page-work-calendar');
      const today = Utils.today();
      const tasks = Store.get('tasks') || [];
      const todayTasks = tasks.filter(t => t.date === today);

      el.innerHTML = `
        <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div class="flex items-center gap-2">
            <button class="btn btn-icon" onclick="WorkModule.calendar.prev()" title="上个月">←</button>
            <div class="flex items-center gap-3">
              <span style="font-size:18px;font-weight:700" id="calCurrentLabel"></span>
            </div>
            <button class="btn btn-icon" onclick="WorkModule.calendar.next()" title="下个月">→</button>
            <button class="btn btn-sm" onclick="WorkModule.calendar.goToday()">今天</button>
          </div>
          <div class="flex items-center gap-2">
            <div class="ai-badge" onclick="WorkModule.calendar.aiImport()">🤖 AI导入</div>
            <div class="flex" style="background:var(--bg-hover);border-radius:8px;padding:2px;">
              <button class="btn btn-sm ${this.view === 'month' ? 'btn-primary' : 'btn-ghost'}" onclick="WorkModule.calendar.setView('month')">月视图</button>
              <button class="btn btn-sm ${this.view === 'week' ? 'btn-primary' : 'btn-ghost'}" onclick="WorkModule.calendar.setView('week')">周视图</button>
            </div>
          </div>
        </div>

        <div class="grid grid-3">
          <div class="card" style="grid-column: span 2;">
            <div id="calendarView"></div>
          </div>
          <div class="card">
            <div class="card-header">
              <div class="card-title" id="selectedDateLabel">${this.selectedDate}</div>
              <button class="btn btn-sm btn-primary" onclick="WorkModule.calendar.addTask()">+ 任务</button>
            </div>
            <div id="selectedDateTasks"></div>
          </div>
        </div>

        ${todayTasks.length ? `
          <div class="card mt-3">
            <div class="card-header">
              <div class="card-title">📌 今日任务 (${todayTasks.length})</div>
              <button class="btn btn-sm" onclick="WorkModule.calendar.addToTodo()">转待办清单</button>
            </div>
            <div id="todayTaskList"></div>
          </div>
        ` : ''}
      `;

      this.renderCalendar();
      this.renderSelectedDateTasks();
      if (todayTasks.length) this.renderTodayTasks();
    },

    setView(v) {
      this.view = v;
      this.render();
    },

    prev() {
      const d = new Date(this.currentDate);
      if (this.view === 'month') d.setMonth(d.getMonth() - 1);
      else d.setDate(d.getDate() - 7);
      this.currentDate = d;
      this.render();
    },

    next() {
      const d = new Date(this.currentDate);
      if (this.view === 'month') d.setMonth(d.getMonth() + 1);
      else d.setDate(d.getDate() + 7);
      this.currentDate = d;
      this.render();
    },

    goToday() {
      this.currentDate = new Date();
      this.selectedDate = Utils.today();
      this.render();
    },

    renderCalendar() {
      const label = document.getElementById('calCurrentLabel');
      const container = document.getElementById('calendarView');

      if (this.view === 'month') {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        label.textContent = `${year}年${month + 1}月`;

        const days = Utils.getMonthDays(year, month);
        const firstDay = Utils.getFirstDay(year, month); // 1=周一
        const today = Utils.today();
        const tasks = Store.get('tasks') || [];

        // 计算上月填充
        const prevMonthDays = Utils.getMonthDays(year, month - 1);
        const cells = [];

        // 上月填充
        for (let i = firstDay - 2; i >= 0; i--) {
          const prevDate = new Date(year, month - 1, prevMonthDays - i);
          cells.push({ date: Utils.formatDate(prevDate), otherMonth: true });
        }
        // 本月
        for (let i = 1; i <= days; i++) {
          cells.push({ date: Utils.formatDate(new Date(year, month, i)), otherMonth: false });
        }
        // 下月填充到42格
        while (cells.length < 42) {
          const lastDate = new Date(cells[cells.length - 1].date);
          lastDate.setDate(lastDate.getDate() + 1);
          cells.push({ date: Utils.formatDate(lastDate), otherMonth: true });
        }

        const weekDays = ['一', '二', '三', '四', '五', '六', '日'];
        container.innerHTML = `
          <div class="calendar-grid">
            ${weekDays.map(d => `<div class="calendar-header-cell">${d}</div>`).join('')}
            ${cells.map(cell => {
              const taskCount = tasks.filter(t => t.date === cell.date).length;
              const isToday = cell.date === today;
              const isSelected = cell.date === this.selectedDate;
              return `
                <div class="calendar-cell ${cell.otherMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}"
                     onclick="WorkModule.calendar.selectDate('${cell.date}')">
                  <span class="date-num">${parseInt(cell.date.split('-')[2])}</span>
                  ${taskCount ? `<span class="task-dot"></span><span class="task-count">${taskCount}</span>` : ''}
                </div>
              `;
            }).join('')}
          </div>
        `;
      } else {
        // 周视图
        const { start, end } = Utils.getWeekRange(this.currentDate);
        label.textContent = `${Utils.formatDate(start, 'MM-DD')} ~ ${Utils.formatDate(end, 'MM-DD')}`;
        const today = Utils.today();
        const tasks = Store.get('tasks') || [];
        const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

        let html = '<div class="week-view">';
        for (let i = 0; i < 7; i++) {
          const d = new Date(start);
          d.setDate(start.getDate() + i);
          const dateStr = Utils.formatDate(d);
          const dayTasks = tasks.filter(t => t.date === dateStr);
          const isToday = dateStr === today;
          html += `
            <div class="week-day ${isToday ? 'today' : ''}">
              <div class="week-day-header">${weekDays[i]} ${parseInt(dateStr.split('-')[2])}</div>
              ${dayTasks.length ? dayTasks.map(t => `
                <div class="todo-item" style="padding:6px 8px;margin-bottom:4px;background:var(--bg-card);border-radius:6px;">
                  <span class="priority-star ${t.priority === 'important' ? 'active' : ''}" onclick="WorkModule.calendar.togglePriority('${t.id}')" style="font-size:14px;">${t.priority === 'important' ? '⭐' : '☆'}</span>
                  <span class="todo-text" style="font-size:12px;">${t.title}</span>
                </div>
              `).join('') : '<div class="text-xs text-muted text-center" style="padding:10px;">无任务</div>'}
              <button class="btn btn-sm btn-ghost w-full" onclick="WorkModule.calendar.quickAddTask('${dateStr}')" style="margin-top:4px;font-size:11px;">+ 添加</button>
            </div>
          `;
        }
        html += '</div>';
        container.innerHTML = html;
      }
    },

    selectDate(date) {
      this.selectedDate = date;
      this.render();
    },

    renderSelectedDateTasks() {
      const container = document.getElementById('selectedDateTasks');
      const label = document.getElementById('selectedDateLabel');
      if (label) label.textContent = this.selectedDate;

      const tasks = (Store.get('tasks') || []).filter(t => t.date === this.selectedDate);
      if (!tasks.length) {
        container.innerHTML = `
          <div class="empty-state" style="padding:20px;">
            <div class="desc">这一天还没有任务<br>点击「+ 任务」添加</div>
          </div>
        `;
        return;
      }

      container.innerHTML = tasks.map(t => `
        <div class="todo-item">
          <span class="priority-star ${t.priority === 'important' ? 'active' : ''}" onclick="WorkModule.calendar.togglePriority('${t.id}')">${t.priority === 'important' ? '⭐' : '☆'}</span>
          <span class="checkbox ${t.done ? 'checked' : ''}" onclick="WorkModule.calendar.toggleDone('${t.id}')"></span>
          <span class="todo-text ${t.done ? '' : ''}" style="${t.done ? 'text-decoration:line-through;color:var(--text-muted);' : ''}">${t.title}</span>
          <div class="todo-actions">
            <button class="btn btn-sm btn-ghost" onclick="WorkModule.calendar.editTask('${t.id}')">✏️</button>
            <button class="btn btn-sm btn-ghost" onclick="WorkModule.calendar.deleteTask('${t.id}')">🗑️</button>
          </div>
        </div>
      `).join('');
    },

    renderTodayTasks() {
      const container = document.getElementById('todayTaskList');
      const today = Utils.today();
      const tasks = (Store.get('tasks') || []).filter(t => t.date === today);
      container.innerHTML = tasks.map(t => `
        <div class="todo-item">
          <span class="priority-star ${t.priority === 'important' ? 'active' : ''}" onclick="WorkModule.calendar.togglePriority('${t.id}')">${t.priority === 'important' ? '⭐' : '☆'}</span>
          <span class="checkbox ${t.done ? 'checked' : ''}" onclick="WorkModule.calendar.toggleDone('${t.id}')"></span>
          <span class="todo-text" style="${t.done ? 'text-decoration:line-through;color:var(--text-muted);' : ''}">${t.title}</span>
          <span class="tag ${t.priority === 'important' ? 'tag-warning' : 'tag-success'}">${t.priority === 'important' ? '重要' : '普通'}</span>
        </div>
      `).join('');
    },

    addTask(date) {
      const taskDate = date || this.selectedDate;
      Modal.show({
        title: '添加任务',
        content: `
          <div class="flex flex-col gap-3">
            <div>
              <label class="text-sm text-secondary mb-2 block">任务标题</label>
              <input class="input" id="taskTitle" placeholder="输入任务内容..." autofocus>
            </div>
            <div>
              <label class="text-sm text-secondary mb-2 block">日期</label>
              <input type="date" class="input" id="taskDate" value="${taskDate}">
            </div>
            <div>
              <label class="text-sm text-secondary mb-2 block">优先级</label>
              <div class="flex gap-2">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="priority" value="normal" checked> 📘 普通
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="priority" value="important"> ⭐ 重要
                </label>
              </div>
            </div>
            <div>
              <label class="text-sm text-secondary mb-2 block">备注（可选）</label>
              <textarea class="textarea" id="taskNote" placeholder="补充说明..."></textarea>
            </div>
          </div>
        `,
        onConfirm: () => {
          const title = document.getElementById('taskTitle').value.trim();
          if (!title) { Toast.show('请输入任务标题', 'error'); return false; }
          const date = document.getElementById('taskDate').value;
          const priority = document.querySelector('input[name="priority"]:checked').value;
          const note = document.getElementById('taskNote').value.trim();

          const tasks = Store.get('tasks') || [];
          tasks.push({
            id: Utils.uid(),
            title, date, priority, note,
            done: false,
            createdAt: new Date().toISOString()
          });
          Store.set('tasks', tasks);
          Toast.show('任务已添加', 'success');
          this.render();
          return true;
        }
      });
    },

    quickAddTask(date) {
      this.addTask(date);
    },

    editTask(id) {
      const tasks = Store.get('tasks') || [];
      const task = tasks.find(t => t.id === id);
      if (!task) return;

      Modal.show({
        title: '编辑任务',
        content: `
          <div class="flex flex-col gap-3">
            <input class="input" id="taskTitle" value="${task.title}">
            <input type="date" class="input" id="taskDate" value="${task.date}">
            <div class="flex gap-2">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="priority" value="normal" ${task.priority !== 'important' ? 'checked' : ''}> 📘 普通
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="priority" value="important" ${task.priority === 'important' ? 'checked' : ''}> ⭐ 重要
              </label>
            </div>
            <textarea class="textarea" id="taskNote">${task.note || ''}</textarea>
          </div>
        `,
        onConfirm: () => {
          const title = document.getElementById('taskTitle').value.trim();
          if (!title) return false;
          task.title = title;
          task.date = document.getElementById('taskDate').value;
          task.priority = document.querySelector('input[name="priority"]:checked').value;
          task.note = document.getElementById('taskNote').value.trim();
          Store.set('tasks', tasks);
          Toast.show('任务已更新', 'success');
          this.render();
          return true;
        }
      });
    },

    deleteTask(id) {
      Modal.confirm('确认删除这个任务？', () => {
        let tasks = Store.get('tasks') || [];
        tasks = tasks.filter(t => t.id !== id);
        Store.set('tasks', tasks);
        Toast.show('任务已删除', 'success');
        this.render();
      });
    },

    toggleDone(id) {
      const tasks = Store.get('tasks') || [];
      const task = tasks.find(t => t.id === id);
      if (task) {
        task.done = !task.done;
        Store.set('tasks', tasks);
        this.render();
      }
    },

    togglePriority(id) {
      const tasks = Store.get('tasks') || [];
      const task = tasks.find(t => t.id === id);
      if (task) {
        task.priority = task.priority === 'important' ? 'normal' : 'important';
        Store.set('tasks', tasks);
        this.render();
      }
    },

    addToTodo() {
      const today = Utils.today();
      const tasks = (Store.get('tasks') || []).filter(t => t.date === today && !t.todoSynced);
      if (!tasks.length) {
        Toast.show('今日任务已同步到待办清单', 'info');
        return;
      }
      const todos = Store.get('todos') || [];
      tasks.forEach(t => {
        todos.push({
          id: Utils.uid(),
          title: t.title,
          priority: t.priority,
          done: false,
          source: 'calendar',
          sourceDate: t.date,
          createdAt: new Date().toISOString()
        });
        t.todoSynced = true;
      });
      Store.set('todos', todos);
      Store.set('tasks', Store.get('tasks'));
      Toast.show(`已将 ${tasks.length} 个任务转为待办`, 'success');
      this.render();
    },

    aiImport() {
      Modal.show({
        title: '🤖 AI 智能导入任务',
        content: `
          <div class="flex flex-col gap-3">
            <div class="card" style="background:linear-gradient(135deg,rgba(108,92,231,0.08),rgba(253,121,168,0.08));border:none;margin:0;">
              <div style="font-size:13px;line-height:1.8;">
                <strong>使用方法：</strong><br>
                1. 拍照或截图后，将图片发给你的 AI 助手（如微信里的 WorkBuddy）<br>
                2. 告诉 AI：「请帮我把图片中的任务提取出来，归类到对应日期」<br>
                3. AI 返回结果后，复制粘贴到下方文本框<br>
                4. 点击「智能解析」，系统会自动识别日期和任务内容
              </div>
            </div>
            <div>
              <label class="text-sm text-secondary mb-2 block">粘贴 AI 返回的任务文本</label>
              <textarea class="textarea" id="aiText" placeholder="示例：&#10;7月28日：完成项目报告 ⭐&#10;7月29日：团队周会&#10;7月30日：客户演示 ⭐" style="min-height:120px;"></textarea>
            </div>
            <div class="text-xs text-muted">💡 提示：AI 返回的文本中包含日期关键词（如7月28日、明天、下周一等）会自动识别</div>
          </div>
        `,
        confirmText: '智能解析',
        onConfirm: () => {
          const text = document.getElementById('aiText').value.trim();
          if (!text) { Toast.show('请粘贴文本', 'error'); return false; }
          this.parseAIText(text);
          return true;
        }
      });
    },

    parseAIText(text) {
      const tasks = Store.get('tasks') || [];
      let count = 0;
      const lines = text.split('\n').filter(l => l.trim());

      const now = new Date();
      lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;

        // 匹配日期
        let date = null;
        let title = trimmed;

        // 匹配 X月X日 / X月X号
        let m = trimmed.match(/(\d{1,2})月(\d{1,2})[日号]/);
        if (m) {
          const month = parseInt(m[1]) - 1;
          const day = parseInt(m[2]);
          date = Utils.formatDate(new Date(now.getFullYear(), month, day));
          title = trimmed.replace(m[0], '').trim();
        }

        // 匹配 明天/后天/今天
        if (!date) {
          if (/今天/.test(trimmed)) {
            date = Utils.today();
            title = trimmed.replace('今天', '').replace(/[:：]/, '').trim();
          } else if (/明天/.test(trimmed)) {
            const t = new Date(); t.setDate(t.getDate() + 1);
            date = Utils.formatDate(t);
            title = trimmed.replace('明天', '').replace(/[:：]/, '').trim();
          } else if (/后天/.test(trimmed)) {
            const t = new Date(); t.setDate(t.getDate() + 2);
            date = Utils.formatDate(t);
            title = trimmed.replace('后天', '').replace(/[:：]/, '').trim();
          }
        }

        // 匹配 下周X
        if (!date) {
          m = trimmed.match(/下周([一二三四五六日天])/);
          if (m) {
            const dayMap = {'一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'日':7,'天':7};
            const targetDay = dayMap[m[1]];
            const t = new Date();
            const currentDay = t.getDay() || 7;
            let diff = targetDay - currentDay + 7;
            if (diff > 7) diff -= 7;
            t.setDate(t.getDate() + diff);
            date = Utils.formatDate(t);
            title = trimmed.replace(m[0], '').replace(/[:：]/, '').trim();
          }
        }

        // 匹配 YYYY-MM-DD
        if (!date) {
          m = trimmed.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
          if (m) {
            date = `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;
            title = trimmed.replace(m[0], '').replace(/[:：]/, '').trim();
          }
        }

        // 清理标题
        title = title.replace(/^[-—·•\s\|]+/, '').replace(/[-—·•\s\|]+$/, '').trim();
        if (!title) return;

        // 检测优先级
        const priority = /[⭐★🔴❗]/.test(trimmed) || /重要|紧急|关键/.test(trimmed) ? 'important' : 'normal';
        title = title.replace(/[⭐★🔴❗]/g, '').replace(/重要|紧急|关键/g, '').trim();

        if (!date) date = Utils.today();

        tasks.push({
          id: Utils.uid(),
          title,
          date,
          priority,
          done: false,
          source: 'ai_import',
          createdAt: new Date().toISOString()
        });
        count++;
      });

      Store.set('tasks', tasks);
      Toast.show(`成功导入 ${count} 个任务`, 'success');
      this.render();
    }
  },

  // ===== 待办清单 =====
  todo: {
    filter: 'all',

    render() {
      const el = document.getElementById('page-work-todo');
      const todos = Store.get('todos') || [];

      el.innerHTML = `
        <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div class="flex gap-2">
            <button class="btn btn-sm ${this.filter === 'all' ? 'btn-primary' : ''}" onclick="WorkModule.todo.setFilter('all')">全部 (${todos.length})</button>
            <button class="btn btn-sm ${this.filter === 'pending' ? 'btn-primary' : ''}" onclick="WorkModule.todo.setFilter('pending')">待完成 (${todos.filter(t=>!t.done).length})</button>
            <button class="btn btn-sm ${this.filter === 'done' ? 'btn-primary' : ''}" onclick="WorkModule.todo.setFilter('done')">已完成 (${todos.filter(t=>t.done).length})</button>
            <button class="btn btn-sm ${this.filter === 'important' ? 'btn-primary' : ''}" onclick="WorkModule.todo.setFilter('important')">⭐ 重要 (${todos.filter(t=>t.priority==='important').length})</button>
          </div>
          <button class="btn btn-primary btn-sm" onclick="WorkModule.todo.add()">+ 新建待办</button>
        </div>
        <div class="card">
          <div id="todoList"></div>
        </div>
      `;

      this.renderList();
    },

    setFilter(f) {
      this.filter = f;
      this.render();
    },

    renderList() {
      const container = document.getElementById('todoList');
      let todos = Store.get('todos') || [];

      if (this.filter === 'pending') todos = todos.filter(t => !t.done);
      else if (this.filter === 'done') todos = todos.filter(t => t.done);
      else if (this.filter === 'important') todos = todos.filter(t => t.priority === 'important');

      // 排序：未完成在前，重要在前
      todos.sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1;
        if (a.priority !== b.priority) return a.priority === 'important' ? -1 : 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      if (!todos.length) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="icon">📝</div>
            <div class="title">暂无待办事项</div>
            <div class="desc">点击右上角新建待办</div>
          </div>
        `;
        return;
      }

      container.innerHTML = todos.map(t => `
        <div class="todo-item ${t.done ? 'completed' : ''}">
          <span class="priority-star ${t.priority === 'important' ? 'active' : ''}" onclick="WorkModule.todo.togglePriority('${t.id}')">${t.priority === 'important' ? '⭐' : '☆'}</span>
          <span class="checkbox ${t.done ? 'checked' : ''}" onclick="WorkModule.todo.toggle('${t.id}')"></span>
          <div class="flex-1">
            <div class="todo-text">${t.title}</div>
            ${t.note ? `<div class="text-xs text-muted mt-2">${t.note}</div>` : ''}
            <div class="flex items-center gap-2 mt-2">
              ${t.source === 'calendar' ? `<span class="tag tag-primary">📅 来自日程</span>` : ''}
              <span class="text-xs text-muted">${Utils.timeAgo(t.createdAt)}</span>
            </div>
          </div>
          <div class="todo-actions">
            <button class="btn btn-sm btn-ghost" onclick="WorkModule.todo.edit('${t.id}')">✏️</button>
            <button class="btn btn-sm btn-ghost" onclick="WorkModule.todo.delete('${t.id}')">🗑️</button>
          </div>
        </div>
      `).join('');
    },

    add() {
      Modal.show({
        title: '新建待办',
        content: `
          <div class="flex flex-col gap-3">
            <input class="input" id="todoTitle" placeholder="输入待办内容..." autofocus>
            <div class="flex gap-2">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="priority" value="normal" checked> 📘 普通
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="priority" value="important"> ⭐ 重要
              </label>
            </div>
            <textarea class="textarea" id="todoNote" placeholder="备注（可选）"></textarea>
          </div>
        `,
        onConfirm: () => {
          const title = document.getElementById('todoTitle').value.trim();
          if (!title) { Toast.show('请输入内容', 'error'); return false; }
          const priority = document.querySelector('input[name="priority"]:checked').value;
          const note = document.getElementById('todoNote').value.trim();
          const todos = Store.get('todos') || [];
          todos.push({
            id: Utils.uid(), title, priority, note,
            done: false,
            createdAt: new Date().toISOString()
          });
          Store.set('todos', todos);
          Toast.show('待办已添加', 'success');
          this.render();
          return true;
        }
      });
    },

    edit(id) {
      const todos = Store.get('todos') || [];
      const todo = todos.find(t => t.id === id);
      if (!todo) return;
      Modal.show({
        title: '编辑待办',
        content: `
          <div class="flex flex-col gap-3">
            <input class="input" id="todoTitle" value="${todo.title}">
            <div class="flex gap-2">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="priority" value="normal" ${todo.priority !== 'important' ? 'checked' : ''}> 📘 普通
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="priority" value="important" ${todo.priority === 'important' ? 'checked' : ''}> ⭐ 重要
              </label>
            </div>
            <textarea class="textarea" id="todoNote">${todo.note || ''}</textarea>
          </div>
        `,
        onConfirm: () => {
          const title = document.getElementById('todoTitle').value.trim();
          if (!title) return false;
          todo.title = title;
          todo.priority = document.querySelector('input[name="priority"]:checked').value;
          todo.note = document.getElementById('todoNote').value.trim();
          Store.set('todos', todos);
          Toast.show('已更新', 'success');
          this.render();
          return true;
        }
      });
    },

    delete(id) {
      Modal.confirm('确认删除？', () => {
        let todos = Store.get('todos') || [];
        todos = todos.filter(t => t.id !== id);
        Store.set('todos', todos);
        Toast.show('已删除', 'success');
        this.render();
      });
    },

    toggle(id) {
      const todos = Store.get('todos') || [];
      const todo = todos.find(t => t.id === id);
      if (todo) {
        todo.done = !todo.done;
        Store.set('todos', todos);
        this.render();
      }
    },

    togglePriority(id) {
      const todos = Store.get('todos') || [];
      const todo = todos.find(t => t.id === id);
      if (todo) {
        todo.priority = todo.priority === 'important' ? 'normal' : 'important';
        Store.set('todos', todos);
        this.render();
      }
    }
  },

  // ===== 知识库 =====
  knowledge: {
    currentCategory: 'all',

    render() {
      const el = document.getElementById('page-work-knowledge');
      const notes = Store.get('notes') || [];
      const categories = this.getCategories();

      el.innerHTML = `
        <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div class="flex gap-2 flex-wrap">
            <button class="btn btn-sm ${this.currentCategory === 'all' ? 'btn-primary' : ''}" onclick="WorkModule.knowledge.setCategory('all')">全部 (${notes.length})</button>
            ${categories.map(c => `
              <button class="btn btn-sm ${this.currentCategory === c ? 'btn-primary' : ''}" onclick="WorkModule.knowledge.setCategory('${c}')">${c} (${notes.filter(n=>n.category===c).length})</button>
            `).join('')}
          </div>
          <div class="flex gap-2">
            <div class="ai-badge" onclick="WorkModule.knowledge.aiOCR()">🤖 拍照识字</div>
            <button class="btn btn-primary btn-sm" onclick="WorkModule.knowledge.add()">+ 新建笔记</button>
          </div>
        </div>
        <div id="notesGrid" class="grid grid-auto"></div>
      `;

      this.renderNotes();
    },

    getCategories() {
      const notes = Store.get('notes') || [];
      return [...new Set(notes.map(n => n.category).filter(Boolean))];
    },

    setCategory(cat) {
      this.currentCategory = cat;
      this.render();
    },

    renderNotes() {
      const container = document.getElementById('notesGrid');
      let notes = Store.get('notes') || [];
      if (this.currentCategory !== 'all') {
        notes = notes.filter(n => n.category === this.currentCategory);
      }
      notes.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));

      if (!notes.length) {
        container.innerHTML = `
          <div class="empty-state" style="grid-column: 1 / -1;">
            <div class="icon">📚</div>
            <div class="title">知识库还是空的</div>
            <div class="desc">新建笔记或用AI拍照识字来添加内容</div>
          </div>
        `;
        return;
      }

      container.innerHTML = notes.map(n => `
        <div class="note-card" style="border-left-color: ${n.color || 'var(--primary)'};" onclick="WorkModule.knowledge.view('${n.id}')">
          <div class="note-title">${n.title}</div>
          <div class="note-preview">${n.content || '(无内容)'}</div>
          ${n.image ? `<img src="${n.image}" style="width:100%;border-radius:6px;margin-top:8px;max-height:120px;object-fit:cover;">` : ''}
          <div class="note-meta">
            ${n.category ? `<span class="tag tag-primary">${n.category}</span>` : ''}
            <span>${Utils.timeAgo(n.updatedAt || n.createdAt)}</span>
          </div>
        </div>
      `).join('');
    },

    add() {
      const categories = this.getCategories();
      Modal.show({
        title: '新建笔记',
        content: `
          <div class="flex flex-col gap-3">
            <input class="input" id="noteTitle" placeholder="笔记标题..." autofocus>
            <div>
              <label class="text-sm text-secondary mb-2 block">分类</label>
              <input class="input" id="noteCategory" list="categoryList" placeholder="输入或选择分类">
              <datalist id="categoryList">
                ${categories.map(c => `<option value="${c}">`).join('')}
              </datalist>
            </div>
            <div>
              <label class="text-sm text-secondary mb-2 block">内容</label>
              <textarea class="textarea" id="noteContent" placeholder="记录你的笔记内容..." style="min-height:150px;"></textarea>
            </div>
            <div>
              <label class="text-sm text-secondary mb-2 block">添加图片（可选）</label>
              <input type="file" accept="image/*" id="noteImage" class="input" onchange="WorkModule.knowledge.previewImage(this)">
              <img id="noteImagePreview" style="display:none;max-width:100%;border-radius:8px;margin-top:8px;">
            </div>
          </div>
        `,
        onConfirm: () => {
          const title = document.getElementById('noteTitle').value.trim();
          if (!title) { Toast.show('请输入标题', 'error'); return false; }
          const content = document.getElementById('noteContent').value.trim();
          const category = document.getElementById('noteCategory').value.trim() || '未分类';
          const img = document.getElementById('noteImagePreview').src;

          const notes = Store.get('notes') || [];
          notes.push({
            id: Utils.uid(),
            title, content, category,
            image: img || null,
            color: this.getRandomColor(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          Store.set('notes', notes);
          Toast.show('笔记已保存', 'success');
          this.render();
          return true;
        }
      });
    },

    view(id) {
      const notes = Store.get('notes') || [];
      const note = notes.find(n => n.id === id);
      if (!note) return;

      Modal.show({
        title: note.title,
        content: `
          <div class="flex flex-col gap-3">
            ${note.category ? `<span class="tag tag-primary" style="align-self:flex-start;">${note.category}</span>` : ''}
            ${note.image ? `<img src="${note.image}" style="width:100%;border-radius:8px;">` : ''}
            <div style="font-size:14px;line-height:1.8;white-space:pre-wrap;">${note.content || '(无内容)'}</div>
            <div class="text-xs text-muted">创建于 ${Utils.formatDate(note.createdAt, 'YYYY-MM-DD HH:mm')}</div>
          </div>
        `,
        confirmText: '编辑',
        onConfirm: () => {
          this.edit(id);
          return true;
        }
      });
    },

    edit(id) {
      const notes = Store.get('notes') || [];
      const note = notes.find(n => n.id === id);
      if (!note) return;
      const categories = this.getCategories();

      Modal.show({
        title: '编辑笔记',
        content: `
          <div class="flex flex-col gap-3">
            <input class="input" id="noteTitle" value="${note.title}">
            <input class="input" id="noteCategory" list="categoryList" value="${note.category || ''}" placeholder="分类">
            <datalist id="categoryList">${categories.map(c => `<option value="${c}">`).join('')}</datalist>
            <textarea class="textarea" id="noteContent" style="min-height:150px;">${note.content || ''}</textarea>
            ${note.image ? `<img src="${note.image}" style="max-width:100%;border-radius:8px;">` : ''}
            <input type="file" accept="image/*" id="noteImage" class="input" onchange="WorkModule.knowledge.previewImage(this)">
            <img id="noteImagePreview" ${note.image ? `src="${note.image}"` : 'style="display:none;"'} style="max-width:100%;border-radius:8px;margin-top:8px;">
          </div>
        `,
        onConfirm: () => {
          note.title = document.getElementById('noteTitle').value.trim();
          note.content = document.getElementById('noteContent').value.trim();
          note.category = document.getElementById('noteCategory').value.trim() || '未分类';
          const img = document.getElementById('noteImagePreview');
          if (img.src && img.style.display !== 'none') note.image = img.src;
          note.updatedAt = new Date().toISOString();
          Store.set('notes', notes);
          Toast.show('笔记已更新', 'success');
          this.render();
          return true;
        }
      });
    },

    delete(id) {
      Modal.confirm('确认删除这条笔记？', () => {
        let notes = Store.get('notes') || [];
        notes = notes.filter(n => n.id !== id);
        Store.set('notes', notes);
        Toast.show('已删除', 'success');
        this.render();
      });
    },

    previewImage(input) {
      const file = input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.getElementById('noteImagePreview');
        img.src = e.target.result;
        img.style.display = 'block';
      };
      reader.readAsDataURL(file);
    },

    getRandomColor() {
      const colors = ['#6c5ce7', '#fd79a8', '#00b894', '#fdcb6e', '#e17055', '#0984e3'];
      return colors[Math.floor(Math.random() * colors.length)];
    },

    aiOCR() {
      Modal.show({
        title: '🤖 AI 拍照识字',
        content: `
          <div class="flex flex-col gap-3">
            <div class="card" style="background:linear-gradient(135deg,rgba(108,92,231,0.08),rgba(253,121,168,0.08));border:none;margin:0;">
              <div style="font-size:13px;line-height:1.8;">
                <strong>使用方法：</strong><br>
                1. 拍摄或截图你需要识别的内容<br>
                2. 将图片发送给你的 AI 助手（WorkBuddy）<br>
                3. 告诉 AI：「请识别图片中的文字，整理成笔记格式」<br>
                4. 将 AI 整理好的内容复制到下方<br>
                5. 选择分类后保存即可
              </div>
            </div>
            <input class="input" id="ocrTitle" placeholder="笔记标题">
            <input class="input" id="ocrCategory" placeholder="分类（如：会议纪要、学习笔记、工作文档）">
            <textarea class="textarea" id="ocrContent" placeholder="粘贴AI识别整理后的文字内容..." style="min-height:200px;"></textarea>
          </div>
        `,
        confirmText: '保存笔记',
        onConfirm: () => {
          const title = document.getElementById('ocrTitle').value.trim();
          const content = document.getElementById('ocrContent').value.trim();
          const category = document.getElementById('ocrCategory').value.trim() || '未分类';
          if (!title || !content) { Toast.show('请填写标题和内容', 'error'); return false; }
          const notes = Store.get('notes') || [];
          notes.push({
            id: Utils.uid(), title, content, category,
            image: null,
            color: this.getRandomColor(),
            source: 'ai_ocr',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          Store.set('notes', notes);
          Toast.show('笔记已保存', 'success');
          this.render();
          return true;
        }
      });
    }
  }
};
