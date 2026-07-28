/**
 * 个人成长模块
 */
const GrowModule = {
  // ===== 理财学习 =====
  finance: {
    render() {
      const el = document.getElementById('page-grow-finance');
      const finance = Store.get('finance') || { salaryPlan: [], fundLearning: [], fundHotspots: [] };

      el.innerHTML = `
        <!-- 基金热点 -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">📊 今日基金热点</div>
            <div class="ai-badge" onclick="GrowModule.finance.fetchFundHotspot()">🤖 获取热点</div>
          </div>
          <div id="fundHotspotList"></div>
        </div>

        <div class="grid grid-2">
          <!-- 工资规划 -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">💰 工资规划</div>
              <button class="btn btn-sm btn-primary" onclick="GrowModule.finance.addSalary()">+ 添加</button>
            </div>
            <div id="salaryPlanList"></div>
          </div>

          <!-- 基金学习 -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">📚 基金学习笔记</div>
              <button class="btn btn-sm btn-primary" onclick="GrowModule.finance.addLearning()">+ 添加</button>
            </div>
            <div id="fundLearningList"></div>
          </div>
        </div>
      `;

      this.renderHotspots();
      this.renderSalaryPlan();
      this.renderLearning();
    },

    renderHotspots() {
      const container = document.getElementById('fundHotspotList');
      const finance = Store.get('finance') || { fundHotspots: [] };
      const today = Utils.today();
      const todayHotspots = (finance.fundHotspots || []).filter(h => h.date === today);

      if (!todayHotspots.length) {
        container.innerHTML = `<div class="empty-state" style="padding:20px;"><div class="desc">今日尚未获取基金热点<br>点击「获取热点」</div></div>`;
        return;
      }

      container.innerHTML = `
        <table class="data-table">
          <thead><tr><th>板块/题材</th><th>相关基金</th><th>涨跌</th><th>说明</th></tr></thead>
          <tbody>
            ${todayHotspots.map(h => `
              <tr>
                <td style="font-weight:500;">${h.sector}</td>
                <td class="text-sm">${h.funds || '-'}</td>
                <td><span class="tag ${h.change === 'up' ? 'tag-success' : h.change === 'down' ? 'tag-danger' : ''}">${h.change === 'up' ? '↑' : h.change === 'down' ? '↓' : '-'} ${h.percent || ''}</span></td>
                <td class="text-sm text-secondary">${h.note || ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    },

    fetchFundHotspot() {
      Modal.show({
        title: '🤖 获取基金热点',
        content: `
          <div class="flex flex-col gap-3">
            <div class="card" style="background:linear-gradient(135deg,rgba(108,92,231,0.08),rgba(253,121,168,0.08));border:none;margin:0;">
              <div style="font-size:13px;line-height:1.8;">
                <strong>使用方法：</strong><br>
                1. 查看支付宝/天天基金等APP的基金热点<br>
                2. 截图或复制热点信息<br>
                3. 发送给 AI 助手（WorkBuddy）<br>
                4. 告诉 AI：「请整理今天基金热点，格式：板块|相关基金|涨跌|幅度|说明」<br>
                5. 粘贴到下方解析
              </div>
            </div>
            <textarea class="textarea" id="fundText" placeholder="格式示例：&#10;半导体|xx基金|涨|3.5%|政策利好&#10;新能源|xx基金|跌|1.2%|回调" style="min-height:120px;"></textarea>
          </div>
        `,
        confirmText: '解析',
        onConfirm: () => {
          const text = document.getElementById('fundText').value.trim();
          if (!text) return false;
          const finance = Store.get('finance') || { fundHotspots: [] };
          if (!finance.fundHotspots) finance.fundHotspots = [];

          text.split('\n').filter(l => l.trim()).forEach(line => {
            const parts = line.split(/[|\t,，]/).map(s => s.trim()).filter(Boolean);
            if (parts.length >= 2) {
              finance.fundHotspots.push({
                date: Utils.today(),
                sector: parts[0],
                funds: parts[1] || '',
                change: parts[2]?.includes('涨') || parts[2]?.includes('↑') ? 'up' : parts[2]?.includes('跌') || parts[2]?.includes('↓') ? 'down' : 'flat',
                percent: parts[3] || '',
                note: parts[4] || '',
                createdAt: new Date().toISOString()
              });
            }
          });

          Store.set('finance', finance);
          Toast.show('基金热点已更新', 'success');
          this.render();
          return true;
        }
      });
    },

    renderSalaryPlan() {
      const container = document.getElementById('salaryPlanList');
      const finance = Store.get('finance') || { salaryPlan: [] };
      const plans = finance.salaryPlan || [];

      if (!plans.length) {
        container.innerHTML = `<div class="empty-state" style="padding:20px;"><div class="desc">设置你的工资分配方案<br>例如：生活50% / 储蓄30% / 投资20%</div></div>`;
        return;
      }

      const total = plans.reduce((s, p) => s + (p.amount || 0), 0);
      container.innerHTML = `
        <div class="mb-3" style="font-size:13px;color:var(--text-secondary);">月工资总额：<strong style="color:var(--text);">¥${total.toLocaleString()}</strong></div>
        ${plans.map(p => `
          <div class="todo-item">
            <span style="font-size:18px;">${p.icon || '💸'}</span>
            <div class="flex-1">
              <div style="font-size:13px;font-weight:500;">${p.category}</div>
              <div class="text-xs text-muted">${p.percent}% · ¥${(p.amount||0).toLocaleString()}</div>
              <div class="progress-bar mt-2">
                <div class="progress-bar-fill" style="width:${p.percent}%;background:${p.color||'var(--primary)'};"></div>
              </div>
            </div>
            <button class="btn btn-sm btn-ghost" onclick="GrowModule.finance.editSalary('${p.id}')">✏️</button>
          </div>
        `).join('')}
      `;
    },

    addSalary() {
      Modal.show({
        title: '添加工资规划',
        content: `
          <div class="flex flex-col gap-3">
            <div>
              <label class="text-sm text-secondary mb-2 block">分类（如：生活费、储蓄、投资、学习）</label>
              <input class="input" id="sCategory" placeholder="分类名称" autofocus>
            </div>
            <div class="grid grid-2">
              <div>
                <label class="text-sm text-secondary mb-2 block">金额（¥）</label>
                <input type="number" class="input" id="sAmount" placeholder="0">
              </div>
              <div>
                <label class="text-sm text-secondary mb-2 block">占比（%）</label>
                <input type="number" class="input" id="sPercent" placeholder="0">
              </div>
            </div>
            <div>
              <label class="text-sm text-secondary mb-2 block">图标</label>
              <select class="select" id="sIcon">
                <option value="💸">💸 生活费</option>
                <option value="🏦">🏦 储蓄</option>
                <option value="📈">📈 投资</option>
                <option value="📖">📖 学习</option>
                <option value="🎮">🎮 娱乐</option>
                <option value="🎁">🎁 其他</option>
              </select>
            </div>
            <input type="color" id="sColor" value="#6c5ce7" style="width:60px;height:36px;border:none;border-radius:8px;cursor:pointer;">
          </div>
        `,
        onConfirm: () => {
          const finance = Store.get('finance') || { salaryPlan: [] };
          if (!finance.salaryPlan) finance.salaryPlan = [];
          finance.salaryPlan.push({
            id: Utils.uid(),
            category: document.getElementById('sCategory').value.trim(),
            amount: parseInt(document.getElementById('sAmount').value) || 0,
            percent: parseInt(document.getElementById('sPercent').value) || 0,
            icon: document.getElementById('sIcon').value,
            color: document.getElementById('sColor').value,
            createdAt: new Date().toISOString()
          });
          Store.set('finance', finance);
          Toast.show('已添加', 'success');
          this.render();
          return true;
        }
      });
    },

    editSalary(id) {
      const finance = Store.get('finance') || { salaryPlan: [] };
      const plan = (finance.salaryPlan || []).find(p => p.id === id);
      if (!plan) return;

      Modal.show({
        title: '编辑工资规划',
        content: `
          <div class="flex flex-col gap-3">
            <input class="input" id="sCategory" value="${plan.category}">
            <div class="grid grid-2">
              <input type="number" class="input" id="sAmount" value="${plan.amount}">
              <input type="number" class="input" id="sPercent" value="${plan.percent}">
            </div>
            <select class="select" id="sIcon">
              ${['💸','🏦','📈','📖','🎮','🎁'].map(i => `<option value="${i}" ${plan.icon===i?'selected':''}>${i}</option>`).join('')}
            </select>
            <input type="color" id="sColor" value="${plan.color}" style="width:60px;height:36px;border:none;border-radius:8px;cursor:pointer;">
          </div>
        `,
        onConfirm: () => {
          plan.category = document.getElementById('sCategory').value.trim();
          plan.amount = parseInt(document.getElementById('sAmount').value) || 0;
          plan.percent = parseInt(document.getElementById('sPercent').value) || 0;
          plan.icon = document.getElementById('sIcon').value;
          plan.color = document.getElementById('sColor').value;
          Store.set('finance', finance);
          Toast.show('已更新', 'success');
          this.render();
          return true;
        }
      });
    },

    renderLearning() {
      const container = document.getElementById('fundLearningList');
      const finance = Store.get('finance') || { fundLearning: [] };
      const notes = finance.fundLearning || [];

      if (!notes.length) {
        container.innerHTML = `<div class="empty-state" style="padding:20px;"><div class="desc">记录你的基金学习笔记<br>如：定投策略、选基方法等</div></div>`;
        return;
      }

      container.innerHTML = notes.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).map(n => `
        <div class="todo-item">
          <span style="font-size:16px;">📚</span>
          <div class="flex-1">
            <div style="font-size:13px;font-weight:500;">${n.title}</div>
            <div class="text-xs text-secondary mt-2">${n.content}</div>
            <div class="text-xs text-muted mt-2">${Utils.timeAgo(n.createdAt)}</div>
          </div>
          <button class="btn btn-sm btn-ghost" onclick="GrowModule.finance.deleteLearning('${n.id}')">🗑️</button>
        </div>
      `).join('');
    },

    addLearning() {
      Modal.show({
        title: '基金学习笔记',
        content: `
          <div class="flex flex-col gap-3">
            <input class="input" id="lTitle" placeholder="笔记标题（如：什么是定投）" autofocus>
            <textarea class="textarea" id="lContent" placeholder="学习内容..." style="min-height:150px;"></textarea>
          </div>
        `,
        onConfirm: () => {
          const title = document.getElementById('lTitle').value.trim();
          const content = document.getElementById('lContent').value.trim();
          if (!title) return false;
          const finance = Store.get('finance') || { fundLearning: [] };
          if (!finance.fundLearning) finance.fundLearning = [];
          finance.fundLearning.push({
            id: Utils.uid(), title, content,
            createdAt: new Date().toISOString()
          });
          Store.set('finance', finance);
          Toast.show('笔记已保存', 'success');
          this.render();
          return true;
        }
      });
    },

    deleteLearning(id) {
      const finance = Store.get('finance') || { fundLearning: [] };
      finance.fundLearning = (finance.fundLearning || []).filter(n => n.id !== id);
      Store.set('finance', finance);
      Toast.show('已删除', 'success');
      this.render();
    }
  },

  // ===== 副业探索 =====
  sidehustle: {
    render() {
      const el = document.getElementById('page-grow-sidehustle');
      const ideas = Store.get('sidehustle') || [];

      el.innerHTML = `
        <div class="flex items-center justify-between mb-4">
          <div class="text-sm text-muted">记录和探索你的搞钱思路 💡</div>
          <div class="flex gap-2">
            <div class="ai-badge" onclick="GrowModule.sidehustle.aiSuggest()">🤖 AI推荐</div>
            <button class="btn btn-primary btn-sm" onclick="GrowModule.sidehustle.add()">+ 添加思路</button>
          </div>
        </div>
        <div id="ideasList" class="grid grid-auto"></div>
      `;

      this.renderList();
    },

    renderList() {
      const container = document.getElementById('ideasList');
      const ideas = Store.get('sidehustle') || [];
      ideas.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

      if (!ideas.length) {
        container.innerHTML = `
          <div class="empty-state" style="grid-column:1/-1;">
            <div class="icon">🚀</div>
            <div class="title">还没有副业思路</div>
            <div class="desc">记录你的搞钱想法，或让AI帮你推荐</div>
          </div>
        `;
        return;
      }

      const statusMap = { idea: { label: '💡 想法', tag: 'tag-primary' }, trying: { label: '🔄 尝试中', tag: 'tag-warning' }, running: { label: '✅ 运营中', tag: 'tag-success' }, paused: { label: '⏸️ 暂停', tag: '' } };

      container.innerHTML = ideas.map(i => `
        <div class="note-card" style="border-left-color:${i.color || 'var(--accent)'};" onclick="GrowModule.sidehustle.view('${i.id}')">
          <div class="flex items-center justify-between mb-2">
            <div class="note-title">${i.title}</div>
            <span class="tag ${statusMap[i.status]?.tag || ''}">${statusMap[i.status]?.label || '💡 想法'}</span>
          </div>
          <div class="note-preview">${i.description || ''}</div>
          ${i.expectedIncome ? `<div class="mt-2 text-xs text-secondary">💰 预期收入：${i.expectedIncome}</div>` : ''}
          <div class="note-meta">
            ${i.difficulty ? `<span class="tag">难度：${'⭐'.repeat(i.difficulty)}</span>` : ''}
            <span>${Utils.timeAgo(i.createdAt)}</span>
          </div>
        </div>
      `).join('');
    },

    add() {
      Modal.show({
        title: '添加搞钱思路',
        content: `
          <div class="flex flex-col gap-3">
            <input class="input" id="iTitle" placeholder="副业名称（如：闲鱼卖货）" autofocus>
            <div>
              <label class="text-sm text-secondary mb-2 block">状态</label>
              <select class="select" id="iStatus">
                <option value="idea">💡 想法</option>
                <option value="trying">🔄 尝试中</option>
                <option value="running">✅ 运营中</option>
                <option value="paused">⏸️ 暂停</option>
              </select>
            </div>
            <div>
              <label class="text-sm text-secondary mb-2 block">难度（1-5星）</label>
              <input type="range" id="iDifficulty" min="1" max="5" value="3" style="width:100%;">
            </div>
            <div>
              <label class="text-sm text-secondary mb-2 block">预期收入</label>
              <input class="input" id="iIncome" placeholder="如：2000-5000元/月">
            </div>
            <textarea class="textarea" id="iDesc" placeholder="详细描述你的副业计划..." style="min-height:120px;"></textarea>
          </div>
        `,
        onConfirm: () => {
          const title = document.getElementById('iTitle').value.trim();
          if (!title) return false;
          const ideas = Store.get('sidehustle') || [];
          ideas.push({
            id: Utils.uid(),
            title,
            status: document.getElementById('iStatus').value,
            difficulty: parseInt(document.getElementById('iDifficulty').value),
            expectedIncome: document.getElementById('iIncome').value.trim(),
            description: document.getElementById('iDesc').value.trim(),
            color: ['#fd79a8','#00b894','#fdcb6e','#6c5ce7','#e17055'][Math.floor(Math.random()*5)],
            createdAt: new Date().toISOString()
          });
          Store.set('sidehustle', ideas);
          Toast.show('思路已添加', 'success');
          this.render();
          return true;
        }
      });
    },

    view(id) {
      const ideas = Store.get('sidehustle') || [];
      const idea = ideas.find(i => i.id === id);
      if (!idea) return;
      const statusMap = { idea: '💡 想法', trying: '🔄 尝试中', running: '✅ 运营中', paused: '⏸️ 暂停' };

      Modal.show({
        title: idea.title,
        content: `
          <div class="flex flex-col gap-3">
            <div class="flex gap-2 flex-wrap">
              <span class="tag tag-primary">${statusMap[idea.status]}</span>
              ${idea.difficulty ? `<span class="tag">难度 ${'⭐'.repeat(idea.difficulty)}</span>` : ''}
              ${idea.expectedIncome ? `<span class="tag tag-success">💰 ${idea.expectedIncome}</span>` : ''}
            </div>
            <div style="font-size:14px;line-height:1.8;white-space:pre-wrap;">${idea.description || '(无描述)'}</div>
            <div class="text-xs text-muted">添加于 ${Utils.formatDate(idea.createdAt, 'YYYY-MM-DD')}</div>
          </div>
        `,
        confirmText: '编辑',
        onConfirm: () => { this.edit(id); return true; }
      });
    },

    edit(id) {
      const ideas = Store.get('sidehustle') || [];
      const idea = ideas.find(i => i.id === id);
      if (!idea) return;

      Modal.show({
        title: '编辑思路',
        content: `
          <div class="flex flex-col gap-3">
            <input class="input" id="iTitle" value="${idea.title}">
            <select class="select" id="iStatus">
              ${['idea','trying','running','paused'].map(s => `<option value="${s}" ${idea.status===s?'selected':''}>${({idea:'💡 想法',trying:'🔄 尝试中',running:'✅ 运营中',paused:'⏸️ 暂停'})[s]}</option>`).join('')}
            </select>
            <input type="range" id="iDifficulty" min="1" max="5" value="${idea.difficulty||3}" style="width:100%;">
            <input class="input" id="iIncome" value="${idea.expectedIncome||''}">
            <textarea class="textarea" id="iDesc" style="min-height:120px;">${idea.description||''}</textarea>
          </div>
        `,
        onConfirm: () => {
          idea.title = document.getElementById('iTitle').value.trim();
          idea.status = document.getElementById('iStatus').value;
          idea.difficulty = parseInt(document.getElementById('iDifficulty').value);
          idea.expectedIncome = document.getElementById('iIncome').value.trim();
          idea.description = document.getElementById('iDesc').value.trim();
          Store.set('sidehustle', ideas);
          Toast.show('已更新', 'success');
          this.render();
          return true;
        }
      });
    },

    aiSuggest() {
      Modal.show({
        title: '🤖 AI 推荐搞钱思路',
        content: `
          <div class="flex flex-col gap-3">
            <div class="card" style="background:linear-gradient(135deg,rgba(108,92,231,0.08),rgba(253,121,168,0.08));border:none;margin:0;">
              <div style="font-size:13px;line-height:1.8;">
                <strong>使用方法：</strong><br>
                1. 告诉 AI 助手你的情况（技能、时间、资源）<br>
                2. 例如：「我是上班族，周末有空，擅长写作，帮我推荐5个适合的副业」<br>
                3. AI 返回推荐后，复制到下方<br>
                4. 点击「生成思路」会自动解析成卡片
              </div>
            </div>
            <textarea class="textarea" id="aiSuggestText" placeholder="粘贴AI返回的副业推荐..." style="min-height:150px;"></textarea>
          </div>
        `,
        confirmText: '生成思路',
        onConfirm: () => {
          const text = document.getElementById('aiSuggestText').value.trim();
          if (!text) return false;
          const ideas = Store.get('sidehustle') || [];
          let count = 0;

          text.split('\n').forEach(line => {
            const trimmed = line.trim().replace(/^\d+[\.\、\)]\s*/, '');
            if (trimmed.length < 3) return;
            // 取第一行或冒号前作为标题
            const colonIdx = trimmed.search(/[：:]/);
            const title = colonIdx > 0 ? trimmed.substring(0, colonIdx) : trimmed.substring(0, 20);
            const desc = colonIdx > 0 ? trimmed.substring(colonIdx + 1).trim() : trimmed;

            ideas.push({
              id: Utils.uid(),
              title: title.trim(),
              status: 'idea',
              difficulty: 3,
              expectedIncome: '',
              description: desc,
              color: ['#fd79a8','#00b894','#fdcb6e','#6c5ce7','#e17055'][count % 5],
              source: 'ai_suggest',
              createdAt: new Date().toISOString()
            });
            count++;
          });

          Store.set('sidehustle', ideas);
          Toast.show(`生成了 ${count} 个思路`, 'success');
          this.render();
          return true;
        }
      });
    }
  },

  // ===== 书籍阅读 =====
  reading: {
    render() {
      const el = document.getElementById('page-grow-reading');
      const books = Store.get('books') || [];

      const reading = books.filter(b => b.status === 'reading');
      const finished = books.filter(b => b.status === 'finished');
      const planned = books.filter(b => b.status === 'planned');

      el.innerHTML = `
        <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div class="flex gap-2 text-sm">
            <span class="tag tag-primary">📖 在读 ${reading.length}</span>
            <span class="tag tag-success">✅ 已读 ${finished.length}</span>
            <span class="tag">📋 待读 ${planned.length}</span>
          </div>
          <div class="flex gap-2">
            <div class="ai-badge" onclick="GrowModule.reading.aiDiscuss()">🤖 AI探讨</div>
            <button class="btn btn-primary btn-sm" onclick="GrowModule.reading.add()">+ 添加书籍</button>
          </div>
        </div>

        <div class="grid grid-3">
          <div class="card">
            <div class="card-title mb-3">📖 在读</div>
            <div id="readingList"></div>
          </div>
          <div class="card">
            <div class="card-title mb-3">✅ 已读</div>
            <div id="finishedList"></div>
          </div>
          <div class="card">
            <div class="card-title mb-3">📋 待读</div>
            <div id="plannedList"></div>
          </div>
        </div>
      `;

      this.renderBookList('readingList', reading);
      this.renderBookList('finishedList', finished);
      this.renderBookList('plannedList', planned);
    },

    renderBookList(containerId, books) {
      const container = document.getElementById(containerId);
      if (!books.length) {
        container.innerHTML = `<div class="text-xs text-muted text-center" style="padding:20px;">暂无</div>`;
        return;
      }

      container.innerHTML = books.map(b => `
        <div class="todo-item" style="flex-direction:column;align-items:stretch;padding:10px 0;">
          <div class="flex items-center justify-between">
            <div style="font-weight:500;font-size:13px;flex:1;">${b.title}</div>
            <div class="flex gap-1">
              <button class="btn btn-sm btn-ghost" onclick="GrowModule.reading.view('${b.id}')">📖</button>
              <button class="btn btn-sm btn-ghost" onclick="GrowModule.reading.edit('${b.id}')">✏️</button>
            </div>
          </div>
          <div class="text-xs text-muted mt-2">${b.author || ''} ${b.progress ? `· 进度${b.progress}%` : ''}</div>
          ${b.note ? `<div class="text-xs text-secondary mt-2" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${b.note}</div>` : ''}
        </div>
      `).join('');
    },

    add() {
      Modal.show({
        title: '添加书籍',
        content: `
          <div class="flex flex-col gap-3">
            <input class="input" id="bTitle" placeholder="书名" autofocus>
            <input class="input" id="bAuthor" placeholder="作者">
            <div>
              <label class="text-sm text-secondary mb-2 block">状态</label>
              <select class="select" id="bStatus">
                <option value="planned">📋 待读</option>
                <option value="reading">📖 在读</option>
                <option value="finished">✅ 已读</option>
              </select>
            </div>
            <div>
              <label class="text-sm text-secondary mb-2 block">阅读进度（%）</label>
              <input type="range" id="bProgress" min="0" max="100" value="0" style="width:100%;">
              <span id="bProgressLabel" class="text-sm">0%</span>
            </div>
            <textarea class="textarea" id="bNote" placeholder="读书笔记、感想..." style="min-height:100px;"></textarea>
          </div>
        `,
        onConfirm: () => {
          const title = document.getElementById('bTitle').value.trim();
          if (!title) return false;
          const books = Store.get('books') || [];
          books.push({
            id: Utils.uid(),
            title,
            author: document.getElementById('bAuthor').value.trim(),
            status: document.getElementById('bStatus').value,
            progress: parseInt(document.getElementById('bProgress').value),
            note: document.getElementById('bNote').value.trim(),
            createdAt: new Date().toISOString()
          });
          Store.set('books', books);
          Toast.show('书籍已添加', 'success');
          this.render();
          return true;
        }
      });

      // 进度滑块
      const slider = document.getElementById('bProgress');
      const label = document.getElementById('bProgressLabel');
      slider.addEventListener('input', () => label.textContent = slider.value + '%');
    },

    view(id) {
      const books = Store.get('books') || [];
      const book = books.find(b => b.id === id);
      if (!book) return;

      Modal.show({
        title: book.title,
        content: `
          <div class="flex flex-col gap-3">
            <div class="flex gap-2 flex-wrap">
              <span class="tag tag-primary">${book.author || '未知作者'}</span>
              <span class="tag">${book.status === 'reading' ? '📖 在读' : book.status === 'finished' ? '✅ 已读' : '📋 待读'}</span>
              ${book.progress ? `<span class="tag">进度 ${book.progress}%</span>` : ''}
            </div>
            ${book.progress ? `<div class="progress-bar"><div class="progress-bar-fill" style="width:${book.progress}%;"></div></div>` : ''}
            <div style="font-size:14px;line-height:1.8;white-space:pre-wrap;">${book.note || '(暂无笔记)'}</div>
          </div>
        `,
        confirmText: '编辑',
        onConfirm: () => { this.edit(id); return true; }
      });
    },

    edit(id) {
      const books = Store.get('books') || [];
      const book = books.find(b => b.id === id);
      if (!book) return;

      Modal.show({
        title: '编辑书籍',
        content: `
          <div class="flex flex-col gap-3">
            <input class="input" id="bTitle" value="${book.title}">
            <input class="input" id="bAuthor" value="${book.author||''}">
            <select class="select" id="bStatus">
              <option value="planned" ${book.status==='planned'?'selected':''}>📋 待读</option>
              <option value="reading" ${book.status==='reading'?'selected':''}>📖 在读</option>
              <option value="finished" ${book.status==='finished'?'selected':''}>✅ 已读</option>
            </select>
            <input type="range" id="bProgress" min="0" max="100" value="${book.progress||0}" style="width:100%;">
            <span id="bProgressLabel" class="text-sm">${book.progress||0}%</span>
            <textarea class="textarea" id="bNote" style="min-height:100px;">${book.note||''}</textarea>
          </div>
        `,
        onConfirm: () => {
          book.title = document.getElementById('bTitle').value.trim();
          book.author = document.getElementById('bAuthor').value.trim();
          book.status = document.getElementById('bStatus').value;
          book.progress = parseInt(document.getElementById('bProgress').value);
          book.note = document.getElementById('bNote').value.trim();
          Store.set('books', books);
          Toast.show('已更新', 'success');
          this.render();
          return true;
        }
      });

      const slider = document.getElementById('bProgress');
      const label = document.getElementById('bProgressLabel');
      slider.addEventListener('input', () => label.textContent = slider.value + '%');
    },

    aiDiscuss() {
      Modal.show({
        title: '🤖 AI 书籍探讨',
        content: `
          <div class="flex flex-col gap-3">
            <div class="card" style="background:linear-gradient(135deg,rgba(108,92,231,0.08),rgba(253,121,168,0.08));border:none;margin:0;">
              <div style="font-size:13px;line-height:1.8;">
                <strong>如何与AI探讨书籍：</strong><br>
                1. 告诉 AI 你正在读的书名和作者<br>
                2. 提出你想探讨的问题，例如：<br>
                &nbsp;&nbsp;·「这本书的核心观点是什么？」<br>
                &nbsp;&nbsp;·「第三章的XX概念怎么理解？」<br>
                &nbsp;&nbsp;·「这本书的观点和XX书有什么不同？」<br>
                3. 把探讨中有价值的内容记录到笔记中
              </div>
            </div>
            <div>
              <label class="text-sm text-secondary mb-2 block">选择书籍</label>
              <select class="select" id="discussBook">
                ${(Store.get('books')||[]).map(b => `<option value="${b.title}">${b.title}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="text-sm text-secondary mb-2 block">你的思考/问题</label>
              <textarea class="textarea" id="discussText" placeholder="输入你对这本书的思考或疑问，稍后发送给AI助手探讨..." style="min-height:150px;"></textarea>
            </div>
            <div>
              <label class="text-sm text-secondary mb-2 block">AI探讨后的记录（可选）</label>
              <textarea class="textarea" id="discussResult" placeholder="把与AI探讨后的有价值的结论记录在这里，保存到笔记..." style="min-height:100px;"></textarea>
            </div>
          </div>
        `,
        confirmText: '保存探讨记录',
        onConfirm: () => {
          const bookTitle = document.getElementById('discussBook').value;
          const text = document.getElementById('discussResult').value.trim();
          if (!text) { Toast.show('请输入探讨记录', 'error'); return false; }
          const books = Store.get('books') || [];
          const book = books.find(b => b.title === bookTitle);
          if (book) {
            book.note = (book.note || '') + '\n\n--- AI探讨记录 ---\n' + text;
            Store.set('books', books);
            Toast.show('探讨记录已保存到书籍笔记', 'success');
          }
          return true;
        }
      });
    }
  },

  // ===== 记录库 =====
  record: {
    currentCategory: 'all',
    currentTag: null,
    // 预设标签（带颜色索引）
    presetTags: [
      { name: '小思考', color: 0 },
      { name: '金句摘抄', color: 1 },
      { name: '读书笔记', color: 2 },
      { name: '生活感悟', color: 3 },
      { name: '工作思考', color: 4 },
      { name: '日记', color: 5 },
      { name: '副业灵感', color: 6 },
      { name: '复盘总结', color: 7 },
    ],

    render() {
      const el = document.getElementById('page-grow-record');
      const records = Store.get('records') || [];
      const allTags = this.getAllTags();

      el.innerHTML = `
        <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div class="flex gap-2 flex-wrap">
            <button class="btn btn-sm ${this.currentCategory === 'all' && !this.currentTag ? 'btn-primary' : ''}" onclick="GrowModule.record.setCategory('all')">全部 (${records.length})</button>
            ${allTags.map(t => `
              <button class="btn btn-sm ${this.currentTag === t.name ? 'btn-primary' : ''}" onclick="GrowModule.record.setTag('${t.name}')">
                ${t.name} (${records.filter(r => r.tags && r.tags.includes(t.name)).length})
              </button>
            `).join('')}
          </div>
          <div class="flex gap-2">
            <div class="ai-badge" onclick="GrowModule.record.aiImport()">🤖 AI导入</div>
            <button class="btn btn-primary btn-sm" onclick="GrowModule.record.add()">+ 新建记录</button>
          </div>
        </div>
        <div id="recordsList" class="grid grid-auto"></div>
      `;

      this.renderList();
    },

    // 获取所有标签（合并预设和自定义）
    getAllTags() {
      const records = Store.get('records') || [];
      const usedTags = new Set();
      records.forEach(r => {
        if (r.tags) r.tags.forEach(t => usedTags.add(t));
      });
      // 合并预设标签和已使用标签
      const result = [...this.presetTags];
      usedTags.forEach(name => {
        if (!result.find(t => t.name === name)) {
          result.push({ name, color: Math.floor(Math.random() * 8) });
        }
      });
      return result;
    },

    // 获取标签颜色
    getTagColor(name) {
      const tag = this.getAllTags().find(t => t.name === name);
      return tag ? tag.color : 0;
    },

    setCategory(cat) {
      this.currentCategory = cat;
      this.currentTag = null;
      this.render();
    },

    setTag(tag) {
      this.currentTag = this.currentTag === tag ? null : tag;
      this.render();
    },

    renderList() {
      const container = document.getElementById('recordsList');
      let records = Store.get('records') || [];
      if (this.currentTag) {
        records = records.filter(r => r.tags && r.tags.includes(this.currentTag));
      }
      records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      if (!records.length) {
        container.innerHTML = `
          <div class="empty-state" style="grid-column:1/-1;">
            <div class="icon">✍️</div>
            <div class="title">记录库还是空的</div>
            <div class="desc">记录你看到的金句、思考、日记<br>支持多标签、来源链接、个人思考</div>
          </div>
        `;
        return;
      }

      container.innerHTML = records.map(r => {
        const tagsHtml = (r.tags || []).map(t => `<span class="tag-label tag-color-${this.getTagColor(t)}">${t}</span>`).join('');
        const imagesHtml = (r.images || []).length ? `
          <div class="record-images">
            ${r.images.slice(0, 4).map(img => `<img src="${img}" onclick="event.stopPropagation();GrowModule.record.viewImage('${img}')">`).join('')}
            ${r.images.length > 4 ? `<div style="width:80px;height:80px;display:flex;align-items:center;justify-content:center;background:var(--bg-hover);border-radius:6px;font-size:13px;color:var(--text-muted);">+${r.images.length - 4}</div>` : ''}
          </div>
        ` : '';
        return `
          <div class="record-card" style="border-left-color:${r.color||'var(--primary)'};" onclick="GrowModule.record.view('${r.id}')">
            ${r.title ? `<div class="record-title">${r.title}</div>` : ''}
            ${r.source ? `<div class="record-source">📎 ${r.sourceTitle || r.source}</div>` : ''}
            <div class="record-excerpt">${r.content}</div>
            ${r.thought ? `<div class="record-thought">💭 ${r.thought}</div>` : ''}
            ${imagesHtml}
            <div class="record-footer">
              <div class="record-tags">${tagsHtml}</div>
              <div class="record-time">${Utils.formatDate(r.createdAt, 'YYYY-MM-DD HH:mm')}</div>
            </div>
          </div>
        `;
      }).join('');
    },

    add() {
      const allTags = this.getAllTags();
      this._editingImages = [];

      Modal.show({
        title: '新建记录',
        content: `
          <div class="flex flex-col gap-3">
            <div>
              <label class="text-sm text-secondary mb-2 block">标题（可选）</label>
              <input class="input" id="rTitle" placeholder="给这条记录起个标题...">
            </div>
            <div>
              <label class="text-sm text-secondary mb-2 block">标签</label>
              <div class="tag-selector" id="rTagSelector">
                ${allTags.map(t => `<span class="tag-label tag-color-${t.color}" data-tag="${t.name}" onclick="GrowModule.record.toggleTag(this)">${t.name}</span>`).join('')}
              </div>
              <div class="tag-input-row">
                <input class="input" id="rNewTag" placeholder="输入新标签名称..." style="font-size:12px;">
                <button class="btn btn-sm" onclick="GrowModule.record.addNewTag()">+ 添加</button>
              </div>
            </div>
            <div>
              <label class="text-sm text-secondary mb-2 block">内容</label>
              <textarea class="textarea" id="rContent" placeholder="记录一段话、金句、笔记..." style="min-height:120px;" autofocus></textarea>
            </div>
            <div>
              <label class="text-sm text-secondary mb-2 block">个人思考（可选）</label>
              <textarea class="textarea" id="rThought" placeholder="写下你对这段内容的思考、感悟..." style="min-height:80px;"></textarea>
            </div>
            <div>
              <label class="text-sm text-secondary mb-2 block">来源链接（可选）</label>
              <div class="source-input-row">
                <input class="input" id="rSource" placeholder="粘贴链接（小红书/微博/网页等）">
              </div>
              <input class="input mt-2" id="rSourceTitle" placeholder="来源标题（如：小红书@作者）" style="font-size:12px;">
            </div>
            <div>
              <label class="text-sm text-secondary mb-2 block">添加图片（可选，可多选）</label>
              <input type="file" accept="image/*" multiple id="rImages" class="input" onchange="GrowModule.record.handleImages(this)">
              <div class="image-preview-grid" id="rImagePreview"></div>
            </div>
          </div>
        `,
        onConfirm: () => {
          const title = document.getElementById('rTitle').value.trim();
          const content = document.getElementById('rContent').value.trim();
          if (!content) { Toast.show('请输入内容', 'error'); return false; }
          const thought = document.getElementById('rThought').value.trim();
          const source = document.getElementById('rSource').value.trim();
          const sourceTitle = document.getElementById('rSourceTitle').value.trim();
          const tags = Array.from(document.querySelectorAll('#rTagSelector .tag-label.selected')).map(el => el.dataset.tag);

          const records = Store.get('records') || [];
          records.push({
            id: Utils.uid(),
            title, content, thought,
            source, sourceTitle,
            tags,
            images: this._editingImages || [],
            color: ['#6c5ce7','#fd79a8','#00b894','#fdcb6e','#0984e3','#e17055'][Math.floor(Math.random()*6)],
            createdAt: new Date().toISOString()
          });
          Store.set('records', records);
          Toast.show('记录已保存', 'success');
          this._editingImages = [];
          this.render();
          return true;
        }
      });
    },

    // 标签选择切换
    toggleTag(el) {
      el.classList.toggle('selected');
    },

    // 添加新标签
    addNewTag() {
      const input = document.getElementById('rNewTag');
      const name = input.value.trim();
      if (!name) return;
      const selector = document.getElementById('rTagSelector');
      // 检查是否已存在
      if (selector.querySelector(`[data-tag="${name}"]`)) {
        Toast.show('标签已存在', 'warning');
        return;
      }
      const colorIdx = Math.floor(Math.random() * 8);
      const tagEl = document.createElement('span');
      tagEl.className = `tag-label tag-color-${colorIdx} selected`;
      tagEl.dataset.tag = name;
      tagEl.onclick = function() { this.classList.toggle('selected'); };
      tagEl.textContent = name;
      selector.appendChild(tagEl);
      input.value = '';
    },

    // 处理多图上传
    _editingImages: [],
    handleImages(input) {
      const files = Array.from(input.files);
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          this._editingImages.push(e.target.result);
          this.renderImagePreview();
        };
        reader.readAsDataURL(file);
      });
    },

    renderImagePreview() {
      const container = document.getElementById('rImagePreview');
      if (!container) return;
      container.innerHTML = this._editingImages.map((img, i) => `
        <div class="preview-item">
          <img src="${img}">
          <div class="remove-btn" onclick="GrowModule.record.removeImage(${i})">×</div>
        </div>
      `).join('');
    },

    removeImage(index) {
      this._editingImages.splice(index, 1);
      this.renderImagePreview();
    },

    view(id) {
      const records = Store.get('records') || [];
      const record = records.find(r => r.id === id);
      if (!record) return;

      const tagsHtml = (record.tags || []).map(t => `<span class="tag-label tag-color-${this.getTagColor(t)}">${t}</span>`).join('');

      Modal.show({
        title: record.title || '记录详情',
        content: `
          <div class="flex flex-col gap-3">
            ${tagsHtml ? `<div class="flex gap-2 flex-wrap">${tagsHtml}</div>` : ''}
            ${record.source ? `<div class="record-source">📎 ${record.sourceTitle || record.source}${record.source.startsWith('http') ? ` <a href="${record.source}" target="_blank" style="color:var(--primary);text-decoration:none;font-size:11px;">打开 ↗</a>` : ''}</div>` : ''}
            <div style="font-size:14px;line-height:1.8;white-space:pre-wrap;">${record.content}</div>
            ${record.thought ? `<div class="record-thought">💭 ${record.thought}</div>` : ''}
            ${(record.images||[]).length ? `<div class="record-images">${record.images.map(img => `<img src="${img}" onclick="GrowModule.record.viewImage('${img}')" style="width:100%;height:auto;max-height:200px;">`).join('')}</div>` : ''}
            <div class="text-xs text-muted">📅 ${Utils.formatDate(record.createdAt, 'YYYY-MM-DD HH:mm')}</div>
          </div>
        `,
        confirmText: '编辑',
        onConfirm: () => { this.edit(id); return true; }
      });
    },

    viewImage(src) {
      Modal.show({
        title: '图片',
        content: `<img src="${src}" style="width:100%;border-radius:8px;">`,
        confirmText: '关闭',
        onConfirm: () => true
      });
    },

    edit(id) {
      const records = Store.get('records') || [];
      const record = records.find(r => r.id === id);
      if (!record) return;
      const allTags = this.getAllTags();
      this._editingImages = [...(record.images || [])];

      // 合并已有标签
      const existingTags = record.tags || [];
      existingTags.forEach(name => {
        if (!allTags.find(t => t.name === name)) {
          allTags.push({ name, color: this.getTagColor(name) });
        }
      });

      Modal.show({
        title: '编辑记录',
        content: `
          <div class="flex flex-col gap-3">
            <input class="input" id="rTitle" value="${record.title||''}" placeholder="标题">
            <div>
              <label class="text-sm text-secondary mb-2 block">标签</label>
              <div class="tag-selector" id="rTagSelector">
                ${allTags.map(t => `<span class="tag-label tag-color-${t.color} ${existingTags.includes(t.name) ? 'selected' : ''}" data-tag="${t.name}" onclick="GrowModule.record.toggleTag(this)">${t.name}</span>`).join('')}
              </div>
              <div class="tag-input-row">
                <input class="input" id="rNewTag" placeholder="新标签..." style="font-size:12px;">
                <button class="btn btn-sm" onclick="GrowModule.record.addNewTag()">+ 添加</button>
              </div>
            </div>
            <textarea class="textarea" id="rContent" style="min-height:120px;">${record.content}</textarea>
            <div>
              <label class="text-sm text-secondary mb-2 block">个人思考</label>
              <textarea class="textarea" id="rThought" style="min-height:80px;">${record.thought||''}</textarea>
            </div>
            <div>
              <label class="text-sm text-secondary mb-2 block">来源链接</label>
              <input class="input" id="rSource" value="${record.source||''}">
              <input class="input mt-2" id="rSourceTitle" value="${record.sourceTitle||''}" style="font-size:12px;">
            </div>
            <div>
              <label class="text-sm text-secondary mb-2 block">图片</label>
              <input type="file" accept="image/*" multiple id="rImages" class="input" onchange="GrowModule.record.handleImages(this)">
              <div class="image-preview-grid" id="rImagePreview"></div>
            </div>
          </div>
        `,
        onConfirm: () => {
          record.title = document.getElementById('rTitle').value.trim();
          record.content = document.getElementById('rContent').value.trim();
          record.thought = document.getElementById('rThought').value.trim();
          record.source = document.getElementById('rSource').value.trim();
          record.sourceTitle = document.getElementById('rSourceTitle').value.trim();
          record.tags = Array.from(document.querySelectorAll('#rTagSelector .tag-label.selected')).map(el => el.dataset.tag);
          record.images = this._editingImages;
          record.updatedAt = new Date().toISOString();
          Store.set('records', records);
          Toast.show('已更新', 'success');
          this._editingImages = [];
          this.render();
          return true;
        }
      });

      this.renderImagePreview();
    },

    // AI 导入 - 从微信对话中粘贴内容
    aiImport() {
      const allTags = this.getAllTags();
      this._editingImages = [];

      Modal.show({
        title: '🤖 AI 导入记录',
        content: `
          <div class="flex flex-col gap-3">
            <div class="card" style="background:linear-gradient(135deg,rgba(108,92,231,0.08),rgba(253,121,168,0.08));border:none;margin:0;">
              <div style="font-size:13px;line-height:1.8;">
                <strong>使用方法：</strong><br>
                1. 在微信里把链接/图片/文字发给 AI 助手<br>
                2. 告诉 AI：「提取内容，整理成记录格式」<br>
                3. 将 AI 整理好的内容粘贴到下方<br>
                4. 选择标签、补充你的思考<br>
                5. 保存即可
              </div>
            </div>
            <div>
              <label class="text-sm text-secondary mb-2 block">标题</label>
              <input class="input" id="rTitle" placeholder="记录标题">
            </div>
            <div>
              <label class="text-sm text-secondary mb-2 block">标签</label>
              <div class="tag-selector" id="rTagSelector">
                ${allTags.map(t => `<span class="tag-label tag-color-${t.color}" data-tag="${t.name}" onclick="GrowModule.record.toggleTag(this)">${t.name}</span>`).join('')}
              </div>
              <div class="tag-input-row">
                <input class="input" id="rNewTag" placeholder="新标签..." style="font-size:12px;">
                <button class="btn btn-sm" onclick="GrowModule.record.addNewTag()">+ 添加</button>
              </div>
            </div>
            <div>
              <label class="text-sm text-secondary mb-2 block">内容（粘贴 AI 提取的文字）</label>
              <textarea class="textarea" id="rContent" placeholder="粘贴 AI 提取整理后的内容..." style="min-height:120px;"></textarea>
            </div>
            <div>
              <label class="text-sm text-secondary mb-2 block">个人思考</label>
              <textarea class="textarea" id="rThought" placeholder="写下你的思考..." style="min-height:80px;"></textarea>
            </div>
            <div>
              <label class="text-sm text-secondary mb-2 block">来源链接</label>
              <input class="input" id="rSource" placeholder="原始链接">
              <input class="input mt-2" id="rSourceTitle" placeholder="来源说明（如：小红书@樱桃小炸弹）" style="font-size:12px;">
            </div>
          </div>
        `,
        confirmText: '保存记录',
        onConfirm: () => {
          const title = document.getElementById('rTitle').value.trim();
          const content = document.getElementById('rContent').value.trim();
          if (!content) { Toast.show('请输入内容', 'error'); return false; }
          const thought = document.getElementById('rThought').value.trim();
          const source = document.getElementById('rSource').value.trim();
          const sourceTitle = document.getElementById('rSourceTitle').value.trim();
          const tags = Array.from(document.querySelectorAll('#rTagSelector .tag-label.selected')).map(el => el.dataset.tag);

          const records = Store.get('records') || [];
          records.push({
            id: Utils.uid(),
            title, content, thought,
            source, sourceTitle,
            tags,
            images: [],
            color: ['#6c5ce7','#fd79a8','#00b894','#fdcb6e','#0984e3','#e17055'][Math.floor(Math.random()*6)],
            source_type: 'ai_import',
            createdAt: new Date().toISOString()
          });
          Store.set('records', records);
          Toast.show('记录已保存', 'success');
          this.render();
          return true;
        }
      });
    }
  }
};
