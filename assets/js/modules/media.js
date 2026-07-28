/**
 * 自媒体运营模块
 */
const MediaModule = {
  // ===== 运营概览 =====
  dashboard: {
    render() {
      const el = document.getElementById('page-media-dashboard');
      const accounts = Store.get('accounts') || [];
      const today = Utils.today();
      const hotspots = Store.get('hotspots') || {};
      const todayHotspots = hotspots[today] || [];
      const topics = (Store.get('topics') || []).filter(t => t.date === today);
      const analytics = Store.get('analytics') || [];
      const todayAnalytics = analytics.filter(a => a.date === today);

      el.innerHTML = `
        <!-- 账号状态卡片 -->
        <div class="grid grid-2 mb-4">
          ${accounts.map(acc => {
            const accData = todayAnalytics.filter(a => a.accountId === acc.id);
            const accTopics = (Store.get('topics') || []).filter(t => t.accountId === acc.id);
            const weekTopics = accTopics.filter(t => {
              const { start } = Utils.getWeekRange();
              return t.date >= Utils.formatDate(start);
            });
            return `
              <div class="card" style="border-left:4px solid ${acc.color};">
                <div class="flex items-center justify-between mb-3">
                  <div>
                    <div style="font-size:16px;font-weight:700;">${acc.name}</div>
                    <div class="text-xs text-muted mt-2">${acc.platforms.join(' · ')} · ${acc.category}</div>
                  </div>
                  <button class="btn btn-sm btn-ghost" onclick="MediaModule.dashboard.editAccount('${acc.id}')">⚙️</button>
                </div>
                <div class="grid grid-3 mt-3" style="gap:8px;">
                  <div class="text-center" style="background:var(--bg-hover);padding:10px;border-radius:8px;">
                    <div style="font-size:20px;font-weight:700;color:${acc.color};">${weekTopics.length}</div>
                    <div class="text-xs text-muted">本周选题</div>
                  </div>
                  <div class="text-center" style="background:var(--bg-hover);padding:10px;border-radius:8px;">
                    <div style="font-size:20px;font-weight:700;color:${acc.color};">${accData.length}</div>
                    <div class="text-xs text-muted">今日数据</div>
                  </div>
                  <div class="text-center" style="background:var(--bg-hover);padding:10px;border-radius:8px;">
                    <div style="font-size:20px;font-weight:700;color:${acc.color};">${accTopics.filter(t=>t.status==='published').length}</div>
                    <div class="text-xs text-muted">已发布</div>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- 今日热点 + 今日选题 -->
        <div class="grid grid-2">
          <div class="card">
            <div class="card-header">
              <div class="card-title">🔥 今日热点速报</div>
              <span class="text-xs text-muted">${todayHotspots.length} 条</span>
              <button class="btn btn-sm" onclick="App.navigate('media-hotspot')">查看全部</button>
            </div>
            ${todayHotspots.length ? todayHotspots.slice(0, 5).map((h, i) => `
              <div class="todo-item" style="padding:8px 0;">
                <span style="font-size:16px;">${i < 3 ? ['🥇','🥈','🥉'][i] : '📌'}</span>
                <div class="flex-1">
                  <div style="font-size:13px;font-weight:500;">${h.title}</div>
                  <div class="flex gap-2 mt-2">
                    <span class="tag ${h.platform === '微博' ? 'tag-danger' : h.platform === '抖音' ? 'tag-primary' : 'tag-accent'}">${h.platform}</span>
                    <span class="text-xs text-muted">${h.heat || ''}</span>
                  </div>
                </div>
              </div>
            `).join('') : `
              <div class="empty-state" style="padding:20px;">
                <div class="desc">今日尚未获取热点<br>点击「热点速报」获取</div>
              </div>
            `}
          </div>

          <div class="card">
            <div class="card-header">
              <div class="card-title">💡 今日选题</div>
              <span class="text-xs text-muted">${topics.length} 个</span>
              <button class="btn btn-sm" onclick="App.navigate('media-topic')">管理选题</button>
            </div>
            ${topics.length ? topics.slice(0, 5).map(t => `
              <div class="todo-item" style="padding:8px 0;">
                <span class="priority-star ${t.priority === 'high' ? 'active' : ''}">${t.priority === 'high' ? '⭐' : '📌'}</span>
                <div class="flex-1">
                  <div style="font-size:13px;">${t.title}</div>
                  <div class="flex gap-2 mt-2">
                    <span class="tag" style="background:${(accounts.find(a=>a.id===t.accountId)||{}).color || 'var(--primary)'}20;color:${(accounts.find(a=>a.id===t.accountId)||{}).color || 'var(--primary)'};">${(accounts.find(a=>a.id===t.accountId)||{}).name || ''}</span>
                    <span class="tag ${t.status === 'published' ? 'tag-success' : t.status === 'draft' ? 'tag-warning' : ''}">${t.status === 'published' ? '已发布' : t.status === 'draft' ? '草稿' : '待定'}</span>
                  </div>
                </div>
              </div>
            `).join('') : `
              <div class="empty-state" style="padding:20px;">
                <div class="desc">今日还没有选题<br>去选题管理添加</div>
              </div>
            `}
          </div>
        </div>

        <!-- 快捷操作 -->
        <div class="card mt-4">
          <div class="card-title mb-3">⚡ 快捷操作</div>
          <div class="flex gap-2 flex-wrap">
            <button class="btn btn-primary" onclick="MediaModule.dashboard.fetchHotspot()">🔥 获取今日热点</button>
            <button class="btn btn-accent" onclick="MediaModule.dashboard.addTopic()">+ 新建选题</button>
            <button class="btn btn-success" onclick="MediaModule.dashboard.addAnalytics()">录入今日数据</button>
            <button class="btn" onclick="App.navigate('media-data')">查看数据分析</button>
            <button class="btn" onclick="App.navigate('media-quarterly')">生成季度报表</button>
          </div>
        </div>
      `;
    },

    editAccount(id) {
      const accounts = Store.get('accounts') || [];
      const acc = accounts.find(a => a.id === id);
      if (!acc) return;
      Modal.show({
        title: '编辑账号',
        content: `
          <div class="flex flex-col gap-3">
            <input class="input" id="accName" value="${acc.name}" placeholder="账号名称">
            <input class="input" id="accCategory" value="${acc.category}" placeholder="账号类别">
            <div>
              <label class="text-sm text-secondary mb-2 block">运营平台（逗号分隔）</label>
              <input class="input" id="accPlatforms" value="${acc.platforms.join(', ')}">
            </div>
            <div>
              <label class="text-sm text-secondary mb-2 block">主题色</label>
              <input type="color" id="accColor" value="${acc.color}" style="width:60px;height:36px;border:none;border-radius:8px;cursor:pointer;">
            </div>
          </div>
        `,
        onConfirm: () => {
          acc.name = document.getElementById('accName').value.trim();
          acc.category = document.getElementById('accCategory').value.trim();
          acc.platforms = document.getElementById('accPlatforms').value.split(',').map(s=>s.trim()).filter(Boolean);
          acc.color = document.getElementById('accColor').value;
          Store.set('accounts', accounts);
          Toast.show('账号已更新', 'success');
          this.render();
          return true;
        }
      });
    },

    fetchHotspot() {
      MediaModule.hotspot.fetchToday();
    },

    addTopic() {
      MediaModule.topic.add();
    },

    addAnalytics() {
      MediaModule.data.addToday();
    }
  },

  // ===== 热点速报 =====
  hotspot: {
    render() {
      const el = document.getElementById('page-media-hotspot');
      const today = Utils.today();
      const hotspots = Store.get('hotspots') || {};
      const todayList = hotspots[today] || [];
      const accounts = Store.get('accounts') || [];

      el.innerHTML = `
        <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <div style="font-size:16px;font-weight:600;">${today} 热点速报</div>
            <div class="text-xs text-muted mt-2">共 ${todayList.length} 条热点</div>
          </div>
          <div class="flex gap-2">
            <div class="ai-badge" onclick="MediaModule.hotspot.fetchToday()">🤖 获取热点</div>
            <button class="btn btn-sm" onclick="MediaModule.hotspot.viewHistory()">📅 历史热点</button>
          </div>
        </div>

        ${todayList.length ? `
          <div class="card">
            <table class="data-table">
              <thead>
                <tr>
                  <th>排名</th>
                  <th>热点话题</th>
                  <th>平台</th>
                  <th>热度</th>
                  <th>相关账号建议</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                ${todayList.map((h, i) => `
                  <tr>
                    <td>${i + 1}</td>
                    <td style="font-weight:500;">${h.title}</td>
                    <td><span class="tag ${h.platform === '微博' ? 'tag-danger' : h.platform === '抖音' ? 'tag-primary' : 'tag-accent'}">${h.platform}</span></td>
                    <td class="text-sm text-muted">${h.heat || '-'}</td>
                    <td class="text-sm">
                      ${accounts.filter(a => h.suggestedAccounts && h.suggestedAccounts.includes(a.id)).map(a => `<span class="tag" style="background:${a.color}20;color:${a.color};">${a.name}</span>`).join('') || '<span class="text-muted">-</span>'}
                    </td>
                    <td>
                      <button class="btn btn-sm btn-primary" onclick="MediaModule.hotspot.toTopic('${i}')">转选题</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : `
          <div class="card">
            <div class="empty-state">
              <div class="icon">🔥</div>
              <div class="title">今日热点尚未获取</div>
              <div class="desc">点击「获取热点」生成今日热点速报</div>
            </div>
          </div>
        `}

        <div class="card mt-4">
          <div class="card-title mb-3">📋 ���点来源说明</div>
          <div style="font-size:13px;line-height:1.8;color:var(--text-secondary);">
            当前支持的热点来源：<strong>微博热搜、抖音热榜、小红书热点、知乎热榜</strong>。<br>
            点击「获取热点」后，系统会引导你通过 AI 助手获取各平台实时热点数据，粘贴后自动解析成表格。
          </div>
        </div>
      `;
    },

    fetchToday() {
      Modal.show({
        title: '🤖 获取今日热点',
        content: `
          <div class="flex flex-col gap-3">
            <div class="card" style="background:linear-gradient(135deg,rgba(108,92,231,0.08),rgba(253,121,168,0.08));border:none;margin:0;">
              <div style="font-size:13px;line-height:1.8;">
                <strong>获取步骤：</strong><br>
                1. 打开微博/抖音/小红书/知乎，查看热搜榜<br>
                2. 截图或复制热点列表<br>
                3. 发送给 AI 助手（WorkBuddy）<br>
                4. 告诉 AI：「请整理今天各平台的热点，格式：平台|热点标题|热度」<br>
                5. 将结果粘贴到下方文本框<br>
                6. 点击「解析热点」自动生成速报
              </div>
            </div>
            <div>
              <label class="text-sm text-secondary mb-2 block">选择平台</label>
              <div class="flex gap-2 flex-wrap">
                <label class="flex items-center gap-2"><input type="checkbox" class="platform-cb" value="微博" checked> 微博</label>
                <label class="flex items-center gap-2"><input type="checkbox" class="platform-cb" value="抖音" checked> 抖音</label>
                <label class="flex items-center gap-2"><input type="checkbox" class="platform-cb" value="小红书" checked> 小红书</label>
                <label class="flex items-center gap-2"><input type="checkbox" class="platform-cb" value="知乎" checked> 知乎</label>
              </div>
            </div>
            <div>
              <label class="text-sm text-secondary mb-2 block">粘贴热点数据</label>
              <textarea class="textarea" id="hotspotText" placeholder="格式示例：&#10;微博|某明星热搜|#话题#|1234万&#10;抖音|热门挑战|挑战名称|5678万&#10;小红书|好物推荐|话题|90w" style="min-height:150px;"></textarea>
            </div>
          </div>
        `,
        confirmText: '解析热点',
        onConfirm: () => {
          const text = document.getElementById('hotspotText').value.trim();
          if (!text) { Toast.show('请粘贴热点数据', 'error'); return false; }
          const platforms = Array.from(document.querySelectorAll('.platform-cb:checked')).map(cb => cb.value);
          this.parseHotspot(text, platforms);
          return true;
        }
      });
    },

    parseHotspot(text, platforms) {
      const today = Utils.today();
      const hotspots = Store.get('hotspots') || {};
      const accounts = Store.get('accounts') || [];
      const list = [];

      const lines = text.split('\n').filter(l => l.trim());
      lines.forEach(line => {
        const parts = line.split(/[|\t,，]/).map(s => s.trim()).filter(Boolean);
        if (parts.length >= 2) {
          let platform, title, heat;
          // 尝试匹配平台名
          const platformIdx = parts.findIndex(p => ['微博','抖音','小红书','知乎'].includes(p));
          if (platformIdx >= 0) {
            platform = parts[platformIdx];
            parts.splice(platformIdx, 1);
            title = parts[0];
            heat = parts[1] || '';
          } else {
            platform = platforms[0] || '综合';
            title = parts[0];
            heat = parts[1] || '';
          }

          if (platforms.includes(platform) || platforms.length === 0) {
            // 智能推荐相关账号
            const suggestedAccounts = accounts.filter(a => {
              if (platform === '小红书' && a.platforms.includes('小红书')) return true;
              if (platform === '抖音' && a.platforms.includes('抖音')) return true;
              if (platform === '微博' && a.platforms.includes('微博')) return true;
              return false;
            }).map(a => a.id);

            list.push({
              title, platform, heat,
              suggestedAccounts,
              fetchedAt: new Date().toISOString()
            });
          }
        }
      });

      if (list.length === 0) {
        Toast.show('未能解析到热点数据，请检查格式', 'error');
        return;
      }

      hotspots[today] = list;
      Store.set('hotspots', hotspots);
      Toast.show(`成功获取 ${list.length} 条热点`, 'success');
      this.render();
    },

    toTopic(index) {
      const today = Utils.today();
      const hotspots = Store.get('hotspots') || {};
      const hotspot = (hotspots[today] || [])[index];
      if (!hotspot) return;

      const accounts = Store.get('accounts') || [];
      const suggestedAcc = hotspot.suggestedAccounts || [];

      Modal.show({
        title: '热点转选题',
        content: `
          <div class="flex flex-col gap-3">
            <div class="card" style="background:var(--bg-hover);border:none;margin:0;">
              <div class="text-sm text-secondary">热点话题：</div>
              <div style="font-size:15px;font-weight:600;margin-top:4px;">${hotspot.title}</div>
              <div class="mt-2"><span class="tag ${hotspot.platform === '微博' ? 'tag-danger' : 'tag-primary'}">${hotspot.platform}</span> <span class="text-xs text-muted">${hotspot.heat || ''}</span></div>
            </div>
            <div>
              <label class="text-sm text-secondary mb-2 block">选题标题</label>
              <input class="input" id="topicTitle" value="${hotspot.title} - 结合${hotspot.platform}热点" autofocus>
            </div>
            <div>
              <label class="text-sm text-secondary mb-2 block">关联账号</label>
              <select class="select" id="topicAccount">
                ${accounts.map(a => `<option value="${a.id}" ${suggestedAcc.includes(a.id) ? 'selected' : ''}>${a.name}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="text-sm text-secondary mb-2 block">优先级</label>
              <div class="flex gap-2">
                <label class="flex items-center gap-2"><input type="radio" name="tpriority" value="normal" checked> 普通</label>
                <label class="flex items-center gap-2"><input type="radio" name="tpriority" value="high"> 高优</label>
              </div>
            </div>
            <textarea class="textarea" id="topicNote" placeholder="选题思路、角度..."></textarea>
          </div>
        `,
        onConfirm: () => {
          const title = document.getElementById('topicTitle').value.trim();
          if (!title) return false;
          const accountId = document.getElementById('topicAccount').value;
          const priority = document.querySelector('input[name="tpriority"]:checked').value;
          const note = document.getElementById('topicNote').value.trim();

          const topics = Store.get('topics') || [];
          topics.push({
            id: Utils.uid(),
            title, accountId, priority, note,
            status: 'pending',
            source: 'hotspot',
            date: Utils.today(),
            createdAt: new Date().toISOString()
          });
          Store.set('topics', topics);
          Toast.show('选题已创建', 'success');
          App.navigate('media-topic');
          return true;
        }
      });
    },

    viewHistory() {
      const hotspots = Store.get('hotspots') || {};
      const dates = Object.keys(hotspots).sort().reverse();

      Modal.show({
        title: '历史热点',
        content: dates.length ? `
          <div class="flex flex-col gap-2">
            ${dates.map(d => `
              <div class="todo-item" style="cursor:pointer;" onclick="MediaModule.hotspot.viewDate('${d}')">
                <span>📅</span>
                <span class="flex-1">${d}</span>
                <span class="tag">${hotspots[d].length} 条</span>
              </div>
            `).join('')}
          </div>
        ` : '<div class="empty-state"><div class="desc">暂无历史热点</div></div>',
        confirmText: '关闭',
        onConfirm: () => true
      });
    },

    viewDate(date) {
      Modal.close();
      const hotspots = Store.get('hotspots') || {};
      const list = hotspots[date] || [];
      const accounts = Store.get('accounts') || [];

      Modal.show({
        title: `${date} 热点速报`,
        content: `
          <table class="data-table">
            <thead><tr><th>#</th><th>话题</th><th>平台</th><th>热度</th></tr></thead>
            <tbody>
              ${list.map((h, i) => `<tr><td>${i+1}</td><td>${h.title}</td><td>${h.platform}</td><td class="text-sm text-muted">${h.heat||'-'}</td></tr>`).join('')}
            </tbody>
          </table>
        `,
        confirmText: '关闭',
        onConfirm: () => true
      });
    }
  },

  // ===== 选题管理 =====
  topic: {
    filter: 'all',

    render() {
      const el = document.getElementById('page-media-topic');
      const topics = Store.get('topics') || [];
      const accounts = Store.get('accounts') || [];

      el.innerHTML = `
        <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div class="flex gap-2 flex-wrap">
            <button class="btn btn-sm ${this.filter === 'all' ? 'btn-primary' : ''}" onclick="MediaModule.topic.setFilter('all')">全部</button>
            <button class="btn btn-sm ${this.filter === 'pending' ? 'btn-primary' : ''}" onclick="MediaModule.topic.setFilter('pending')">待定</button>
            <button class="btn btn-sm ${this.filter === 'draft' ? 'btn-primary' : ''}" onclick="MediaModule.topic.setFilter('draft')">草稿</button>
            <button class="btn btn-sm ${this.filter === 'published' ? 'btn-primary' : ''}" onclick="MediaModule.topic.setFilter('published')">已发布</button>
          </div>
          <button class="btn btn-primary btn-sm" onclick="MediaModule.topic.add()">+ 新建选题</button>
        </div>

        <div class="card">
          <table class="data-table">
            <thead>
              <tr>
                <th>日期</th>
                <th>选题标题</th>
                <th>账号</th>
                <th>优先级</th>
                <th>状态</th>
                <th>来源</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody id="topicTableBody">
            </tbody>
          </table>
        </div>
      `;

      this.renderTable();
    },

    setFilter(f) {
      this.filter = f;
      this.render();
    },

    renderTable() {
      const tbody = document.getElementById('topicTableBody');
      let topics = Store.get('topics') || [];
      const accounts = Store.get('accounts') || [];

      if (this.filter !== 'all') {
        topics = topics.filter(t => t.status === this.filter);
      }
      topics.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      if (!topics.length) {
        tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state" style="padding:30px;"><div class="desc">暂无选题</div></div></td></tr>`;
        return;
      }

      tbody.innerHTML = topics.map(t => {
        const acc = accounts.find(a => a.id === t.accountId);
        return `
          <tr>
            <td class="text-sm">${t.date}</td>
            <td style="font-weight:500;">${t.title}</td>
            <td><span class="tag" style="background:${(acc||{}).color || 'var(--primary)'}20;color:${(acc||{}).color || 'var(--primary)'};">${(acc||{}).name || '-'}</span></td>
            <td>${t.priority === 'high' ? '⭐ 高优' : '📘 普通'}</td>
            <td>
              <span class="tag ${t.status === 'published' ? 'tag-success' : t.status === 'draft' ? 'tag-warning' : 'tag-primary'}">
                ${t.status === 'published' ? '已发布' : t.status === 'draft' ? '草稿' : '待定'}
              </span>
            </td>
            <td class="text-sm text-muted">${t.source === 'hotspot' ? '🔥 热点' : '✍️ 手动'}</td>
            <td>
              <div class="flex gap-1">
                <button class="btn btn-sm btn-ghost" onclick="MediaModule.topic.changeStatus('${t.id}')">🔄</button>
                <button class="btn btn-sm btn-ghost" onclick="MediaModule.topic.edit('${t.id}')">✏️</button>
                <button class="btn btn-sm btn-ghost" onclick="MediaModule.topic.delete('${t.id}')">🗑️</button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    },

    add() {
      const accounts = Store.get('accounts') || [];
      Modal.show({
        title: '新建选题',
        content: `
          <div class="flex flex-col gap-3">
            <div>
              <label class="text-sm text-secondary mb-2 block">选题标题</label>
              <input class="input" id="topicTitle" placeholder="输入选题标题..." autofocus>
            </div>
            <div>
              <label class="text-sm text-secondary mb-2 block">关联账号</label>
              <select class="select" id="topicAccount">
                ${accounts.map(a => `<option value="${a.id}">${a.name}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="text-sm text-secondary mb-2 block">优先级</label>
              <div class="flex gap-2">
                <label class="flex items-center gap-2"><input type="radio" name="tpriority" value="normal" checked> 📘 普通</label>
                <label class="flex items-center gap-2"><input type="radio" name="tpriority" value="high"> ⭐ 高优</label>
              </div>
            </div>
            <div>
              <label class="text-sm text-secondary mb-2 block">状态</label>
              <select class="select" id="topicStatus">
                <option value="pending">待定</option>
                <option value="draft">草稿</option>
                <option value="published">已发布</option>
              </select>
            </div>
            <div>
              <label class="text-sm text-secondary mb-2 block">选题思路</label>
              <textarea class="textarea" id="topicNote" placeholder="选题角度、内容方向..."></textarea>
            </div>
          </div>
        `,
        onConfirm: () => {
          const title = document.getElementById('topicTitle').value.trim();
          if (!title) { Toast.show('请输入标题', 'error'); return false; }
          const topics = Store.get('topics') || [];
          topics.push({
            id: Utils.uid(),
            title,
            accountId: document.getElementById('topicAccount').value,
            priority: document.querySelector('input[name="tpriority"]:checked').value,
            status: document.getElementById('topicStatus').value,
            note: document.getElementById('topicNote').value.trim(),
            source: 'manual',
            date: Utils.today(),
            createdAt: new Date().toISOString()
          });
          Store.set('topics', topics);
          Toast.show('选题已添加', 'success');
          this.render();
          return true;
        }
      });
    },

    edit(id) {
      const topics = Store.get('topics') || [];
      const topic = topics.find(t => t.id === id);
      if (!topic) return;
      const accounts = Store.get('accounts') || [];

      Modal.show({
        title: '编辑选题',
        content: `
          <div class="flex flex-col gap-3">
            <input class="input" id="topicTitle" value="${topic.title}">
            <select class="select" id="topicAccount">
              ${accounts.map(a => `<option value="${a.id}" ${a.id === topic.accountId ? 'selected' : ''}>${a.name}</option>`).join('')}
            </select>
            <div class="flex gap-2">
              <label class="flex items-center gap-2"><input type="radio" name="tpriority" value="normal" ${topic.priority !== 'high' ? 'checked' : ''}> 📘 普通</label>
              <label class="flex items-center gap-2"><input type="radio" name="tpriority" value="high" ${topic.priority === 'high' ? 'checked' : ''}> ⭐ 高优</label>
            </div>
            <select class="select" id="topicStatus">
              <option value="pending" ${topic.status === 'pending' ? 'selected' : ''}>待定</option>
              <option value="draft" ${topic.status === 'draft' ? 'selected' : ''}>草稿</option>
              <option value="published" ${topic.status === 'published' ? 'selected' : ''}>已发布</option>
            </select>
            <textarea class="textarea" id="topicNote">${topic.note || ''}</textarea>
          </div>
        `,
        onConfirm: () => {
          topic.title = document.getElementById('topicTitle').value.trim();
          topic.accountId = document.getElementById('topicAccount').value;
          topic.priority = document.querySelector('input[name="tpriority"]:checked').value;
          topic.status = document.getElementById('topicStatus').value;
          topic.note = document.getElementById('topicNote').value.trim();
          Store.set('topics', topics);
          Toast.show('已更新', 'success');
          this.render();
          return true;
        }
      });
    },

    changeStatus(id) {
      const topics = Store.get('topics') || [];
      const topic = topics.find(t => t.id === id);
      if (!topic) return;
      const statuses = ['pending', 'draft', 'published'];
      const idx = statuses.indexOf(topic.status);
      topic.status = statuses[(idx + 1) % statuses.length];
      Store.set('topics', topics);
      Toast.show(`状态: ${topic.status === 'published' ? '已发布' : topic.status === 'draft' ? '草稿' : '待定'}`, 'success');
      this.render();
    },

    delete(id) {
      Modal.confirm('确认删除这个选题？', () => {
        let topics = Store.get('topics') || [];
        topics = topics.filter(t => t.id !== id);
        Store.set('topics', topics);
        Toast.show('已删除', 'success');
        this.render();
      });
    }
  },

  // ===== 数据分析 =====
  data: {
    render() {
      const el = document.getElementById('page-media-data');
      const analytics = Store.get('analytics') || [];
      const accounts = Store.get('accounts') || [];

      el.innerHTML = `
        <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div class="flex gap-2">
            <button class="btn btn-sm btn-primary" onclick="MediaModule.data.addToday()">+ 录入今日数据</button>
            <button class="btn btn-sm" onclick="MediaModule.data.viewHistory()">📊 历史数据</button>
            <button class="btn btn-sm" onclick="MediaModule.data.monthlyReport()">📅 月度统计</button>
          </div>
        </div>

        <!-- 图表区 -->
        <div class="grid grid-2">
          <div class="card">
            <div class="card-title mb-3">📈 近7天数据趋势</div>
            <div class="chart-container" id="trendChart"></div>
          </div>
          <div class="card">
            <div class="card-title mb-3">📊 账号数据对比</div>
            <div class="chart-container" id="compareChart"></div>
          </div>
        </div>

        <!-- 今日数据表 -->
        <div class="card mt-4">
          <div class="card-header">
            <div class="card-title">📋 最新数据记录</div>
          </div>
          <div id="analyticsTable"></div>
        </div>
      `;

      this.renderTable();
      this.renderCharts();
    },

    renderTable() {
      const container = document.getElementById('analyticsTable');
      const analytics = Store.get('analytics') || [];
      const accounts = Store.get('accounts') || [];

      const recent = analytics.slice().sort((a,b) => b.date.localeCompare(a.date)).slice(0, 10);

      if (!recent.length) {
        container.innerHTML = `<div class="empty-state"><div class="icon">📊</div><div class="title">暂无数据</div><div class="desc">点击「录入今日数据」开始记录</div></div>`;
        return;
      }

      container.innerHTML = `
        <table class="data-table">
          <thead>
            <tr><th>日期</th><th>账号</th><th>平台</th><th>浏览</th><th>点赞</th><th>评论</th><th>转发</th><th>粉丝增减</th><th>操作</th></tr>
          </thead>
          <tbody>
            ${recent.map(a => {
              const acc = accounts.find(ac => ac.id === a.accountId);
              return `
                <tr>
                  <td class="text-sm">${a.date}</td>
                  <td><span class="tag" style="background:${(acc||{}).color||'var(--primary)'}20;color:${(acc||{}).color||'var(--primary)'};">${(acc||{}).name||'-'}</span></td>
                  <td class="text-sm">${a.platform}</td>
                  <td>${a.views || 0}</td>
                  <td>${a.likes || 0}</td>
                  <td>${a.comments || 0}</td>
                  <td>${a.shares || 0}</td>
                  <td style="color:${(a.followersGain||0) >= 0 ? 'var(--success)' : 'var(--danger)'};">${(a.followersGain||0) >= 0 ? '+' : ''}${a.followersGain || 0}</td>
                  <td><button class="btn btn-sm btn-ghost" onclick="MediaModule.data.delete('${a.id}')">🗑️</button></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    },

    renderCharts() {
      const analytics = Store.get('analytics') || [];
      const accounts = Store.get('accounts') || [];

      // 近7天趋势
      const trendEl = document.getElementById('trendChart');
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        last7Days.push(Utils.formatDate(d));
      }

      const trendData = last7Days.map(date => {
        const dayData = analytics.filter(a => a.date === date);
        return {
          date: date.slice(5),
          views: dayData.reduce((s, a) => s + (a.views||0), 0),
          likes: dayData.reduce((s, a) => s + (a.likes||0), 0),
          comments: dayData.reduce((s, a) => s + (a.comments||0), 0)
        };
      });

      // 用Canvas绘制简易折线图
      this.drawLineChart(trendEl, trendData, ['views','likes','comments'], ['浏览量','点赞','评论'], ['#6c5ce7','#fd79a8','#00b894']);

      // 账号对比
      const compareEl = document.getElementById('compareChart');
      const accData = accounts.map(acc => {
        const accAnalytics = analytics.filter(a => a.accountId === acc.id);
        return {
          name: acc.name,
          color: acc.color,
          views: accAnalytics.reduce((s,a) => s + (a.views||0), 0),
          likes: accAnalytics.reduce((s,a) => s + (a.likes||0), 0),
          followers: accAnalytics.reduce((s,a) => s + (a.followersGain||0), 0)
        };
      });
      this.drawBarChart(compareEl, accData);
    },

    drawLineChart(container, data, keys, labels, colors) {
      const w = container.clientWidth || 400;
      const h = 220;
      const padding = { top: 20, right: 20, bottom: 30, left: 40 };
      const cw = w - padding.left - padding.right;
      const ch = h - padding.top - padding.bottom;

      const maxVal = Math.max(...data.flatMap(d => keys.map(k => d[k])), 1);
      const stepX = cw / Math.max(data.length - 1, 1);

      let svg = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="overflow:visible;">`;
      // 网格线
      for (let i = 0; i <= 4; i++) {
        const y = padding.top + (ch / 4) * i;
        svg += `<line x1="${padding.left}" y1="${y}" x2="${padding.left+cw}" y2="${y}" stroke="var(--border)" stroke-dasharray="3,3"/>`;
        svg += `<text x="${padding.left-5}" y="${y+4}" text-anchor="end" font-size="10" fill="var(--text-muted)">${Math.round(maxVal * (1 - i/4))}</text>`;
      }
      // X轴标签
      data.forEach((d, i) => {
        const x = padding.left + stepX * i;
        svg += `<text x="${x}" y="${h-8}" text-anchor="middle" font-size="10" fill="var(--text-muted)">${d.date}</text>`;
      });

      // 折线
      keys.forEach((key, ki) => {
        const points = data.map((d, i) => {
          const x = padding.left + stepX * i;
          const y = padding.top + ch * (1 - d[key] / maxVal);
          return `${x},${y}`;
        }).join(' ');

        svg += `<polyline points="${points}" fill="none" stroke="${colors[ki]}" stroke-width="2" stroke-linejoin="round"/>`;
        // 数据点
        data.forEach((d, i) => {
          const x = padding.left + stepX * i;
          const y = padding.top + ch * (1 - d[key] / maxVal);
          svg += `<circle cx="${x}" cy="${y}" r="3" fill="${colors[ki]}"/>`;
        });
      });

      // 图例
      labels.forEach((label, i) => {
        const lx = padding.left + i * 80;
        svg += `<rect x="${lx}" y="4" width="10" height="10" fill="${colors[i]}" rx="2"/>`;
        svg += `<text x="${lx+14}" y="13" font-size="11" fill="var(--text-secondary)">${label}</text>`;
      });

      svg += '</svg>';
      container.innerHTML = svg;
    },

    drawBarChart(container, data) {
      const w = container.clientWidth || 400;
      const h = 220;
      const padding = { top: 20, right: 20, bottom: 40, left: 40 };
      const cw = w - padding.left - padding.right;
      const ch = h - padding.top - padding.bottom;

      const maxVal = Math.max(...data.flatMap(d => [d.views, d.likes]), 1);
      const barWidth = cw / (data.length * 3);

      let svg = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`;
      // 网格
      for (let i = 0; i <= 4; i++) {
        const y = padding.top + (ch / 4) * i;
        svg += `<line x1="${padding.left}" y1="${y}" x2="${padding.left+cw}" y2="${y}" stroke="var(--border)" stroke-dasharray="3,3"/>`;
        svg += `<text x="${padding.left-5}" y="${y+4}" text-anchor="end" font-size="10" fill="var(--text-muted)">${Math.round(maxVal * (1 - i/4))}</text>`;
      }

      data.forEach((d, i) => {
        const x = padding.left + i * (cw / data.length) + 10;
        // 浏览量
        const bh1 = ch * (d.views / maxVal);
        svg += `<rect x="${x}" y="${padding.top+ch-bh1}" width="${barWidth}" height="${bh1}" fill="${d.color}" rx="3"/>`;
        // 点赞
        const bh2 = ch * (d.likes / maxVal);
        svg += `<rect x="${x+barWidth+2}" y="${padding.top+ch-bh2}" width="${barWidth}" height="${bh2}" fill="${d.color}" opacity="0.6" rx="3"/>`;

        // 标签
        svg += `<text x="${x+barWidth}" y="${h-8}" text-anchor="middle" font-size="10" fill="var(--text-muted)">${d.name.slice(0,4)}</text>`;
      });

      // 图例
      svg += `<rect x="${padding.left}" y="4" width="10" height="10" fill="var(--primary)" rx="2"/>`;
      svg += `<text x="${padding.left+14}" y="13" font-size="11" fill="var(--text-secondary)">浏览量</text>`;
      svg += `<rect x="${padding.left+60}" y="4" width="10" height="10" fill="var(--primary)" opacity="0.6" rx="2"/>`;
      svg += `<text x="${padding.left+74}" y="13" font-size="11" fill="var(--text-secondary)">点赞</text>`;

      svg += '</svg>';
      container.innerHTML = svg;
    },

    addToday() {
      const accounts = Store.get('accounts') || [];
      const today = Utils.today();

      Modal.show({
        title: '录入运营数据',
        content: `
          <div class="flex flex-col gap-3">
            <div>
              <label class="text-sm text-secondary mb-2 block">日期</label>
              <input type="date" class="input" id="aDataDate" value="${today}">
            </div>
            <div>
              <label class="text-sm text-secondary mb-2 block">账号</label>
              <select class="select" id="aAccount">
                ${accounts.map(a => `<option value="${a.id}">${a.name}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="text-sm text-secondary mb-2 block">平台</label>
              <select class="select" id="aPlatform">
                ${(accounts[0]?.platforms || ['小红书']).map(p => `<option value="${p}">${p}</option>`).join('')}
              </select>
            </div>
            <div class="grid grid-2">
              <div>
                <label class="text-sm text-secondary mb-2 block">浏览量</label>
                <input type="number" class="input" id="aViews" placeholder="0" value="0">
              </div>
              <div>
                <label class="text-sm text-secondary mb-2 block">点赞</label>
                <input type="number" class="input" id="aLikes" placeholder="0" value="0">
              </div>
              <div>
                <label class="text-sm text-secondary mb-2 block">评论</label>
                <input type="number" class="input" id="aComments" placeholder="0" value="0">
              </div>
              <div>
                <label class="text-sm text-secondary mb-2 block">转发/收藏</label>
                <input type="number" class="input" id="aShares" placeholder="0" value="0">
              </div>
              <div>
                <label class="text-sm text-secondary mb-2 block">粉丝增减</label>
                <input type="number" class="input" id="aFollowers" placeholder="0" value="0">
              </div>
            </div>
            <textarea class="textarea" id="aNote" placeholder="备注（可选）"></textarea>
          </div>
        `,
        onConfirm: () => {
          const analytics = Store.get('analytics') || [];
          analytics.push({
            id: Utils.uid(),
            date: document.getElementById('aDataDate').value,
            accountId: document.getElementById('aAccount').value,
            platform: document.getElementById('aPlatform').value,
            views: parseInt(document.getElementById('aViews').value) || 0,
            likes: parseInt(document.getElementById('aLikes').value) || 0,
            comments: parseInt(document.getElementById('aComments').value) || 0,
            shares: parseInt(document.getElementById('aShares').value) || 0,
            followersGain: parseInt(document.getElementById('aFollowers').value) || 0,
            note: document.getElementById('aNote').value.trim(),
            createdAt: new Date().toISOString()
          });
          Store.set('analytics', analytics);
          Toast.show('数据已录入', 'success');
          this.render();
          return true;
        }
      });
    },

    delete(id) {
      Modal.confirm('确认删除这条数据？', () => {
        let analytics = Store.get('analytics') || [];
        analytics = analytics.filter(a => a.id !== id);
        Store.set('analytics', analytics);
        Toast.show('已删除', 'success');
        this.render();
      });
    },

    viewHistory() {
      const analytics = Store.get('analytics') || [];
      const accounts = Store.get('accounts') || [];
      const sorted = analytics.slice().sort((a,b) => b.date.localeCompare(a.date));

      Modal.show({
        title: '历史数据',
        content: sorted.length ? `
          <div style="max-height:400px;overflow-y:auto;">
            <table class="data-table">
              <thead><tr><th>日期</th><th>账号</th><th>平台</th><th>浏览</th><th>点赞</th><th>评论</th></tr></thead>
              <tbody>
                ${sorted.map(a => {
                  const acc = accounts.find(ac => ac.id === a.accountId);
                  return `<tr><td class="text-sm">${a.date}</td><td>${(acc||{}).name||'-'}</td><td>${a.platform}</td><td>${a.views||0}</td><td>${a.likes||0}</td><td>${a.comments||0}</td></tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        ` : '<div class="empty-state"><div class="desc">暂无历史数据</div></div>',
        confirmText: '关闭',
        onConfirm: () => true
      });
    },

    monthlyReport() {
      const analytics = Store.get('analytics') || [];
      const accounts = Store.get('accounts') || [];
      const now = new Date();
      const monthStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;

      const monthData = analytics.filter(a => a.date.startsWith(monthStr));

      Modal.show({
        title: `${monthStr} 月度统计`,
        content: monthData.length ? `
          <div style="max-height:450px;overflow-y:auto;">
            ${accounts.map(acc => {
              const accData = monthData.filter(a => a.accountId === acc.id);
              if (!accData.length) return '';
              const platforms = [...new Set(accData.map(a => a.platform))];
              return `
                <div class="card" style="border-left:4px solid ${acc.color};margin-bottom:12px;">
                  <div style="font-weight:700;margin-bottom:8px;">${acc.name}</div>
                  <table class="data-table">
                    <thead><tr><th>平台</th><th>总浏览</th><th>总点赞</th><th>总评论</th><th>总转发</th><th>粉丝增长</th></tr></thead>
                    <tbody>
                      ${platforms.map(p => {
                        const pData = accData.filter(a => a.platform === p);
                        return `<tr>
                          <td>${p}</td>
                          <td>${pData.reduce((s,a)=>s+(a.views||0),0)}</td>
                          <td>${pData.reduce((s,a)=>s+(a.likes||0),0)}</td>
                          <td>${pData.reduce((s,a)=>s+(a.comments||0),0)}</td>
                          <td>${pData.reduce((s,a)=>s+(a.shares||0),0)}</td>
                          <td style="color:var(--success);">+${pData.reduce((s,a)=>s+(a.followersGain||0),0)}</td>
                        </tr>`;
                      }).join('')}
                    </tbody>
                  </table>
                </div>
              `;
            }).join('')}
          </div>
        ` : '<div class="empty-state"><div class="desc">本月暂无数据</div></div>',
        confirmText: '关闭',
        onConfirm: () => true
      });
    }
  },

  // ===== 季度报表 =====
  quarterly: {
    render() {
      const el = document.getElementById('page-media-quarterly');
      const now = new Date();
      const quarter = Math.floor(now.getMonth() / 3) + 1;
      const year = now.getFullYear();

      el.innerHTML = `
        <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div class="flex gap-2">
            <select class="select" id="qYear" style="width:100px;" onchange="MediaModule.quarterly.render()">
              ${[year, year-1].map(y => `<option value="${y}" ${y===year?'selected':''}>${y}年</option>`).join('')}
            </select>
            <select class="select" id="qQuarter" style="width:100px;" onchange="MediaModule.quarterly.render()">
              ${[1,2,3,4].map(q => `<option value="${q}" ${q===quarter?'selected':''}>Q${q}</option>`).join('')}
            </select>
          </div>
          <button class="btn btn-sm btn-primary" onclick="MediaModule.quarterly.export()">📥 导出报表</button>
        </div>
        <div id="quarterlyContent"></div>
      `;

      this.renderContent();
    },

    renderContent() {
      const container = document.getElementById('quarterlyContent');
      const year = document.getElementById('qYear')?.value || new Date().getFullYear();
      const quarter = parseInt(document.getElementById('qQuarter')?.value || 1);
      const accounts = Store.get('accounts') || [];
      const analytics = Store.get('analytics') || [];

      const startMonth = (quarter - 1) * 3;
      const endMonth = startMonth + 2;
      const startDate = `${year}-${String(startMonth+1).padStart(2,'0')}`;
      const endDate = `${year}-${String(endMonth+1).padStart(2,'0')}`;

      const quarterData = analytics.filter(a => {
        const month = a.date.substring(0, 7);
        return month >= startDate && month <= endDate;
      });

      let html = `
        <div class="card">
          <div class="card-header">
            <div class="card-title">${year}年 Q${quarter} 季度报表</div>
            <span class="text-sm text-muted">${startDate} ~ ${endDate}</span>
          </div>
      `;

      if (!quarterData.length) {
        html += `<div class="empty-state"><div class="icon">📊</div><div class="title">本季度暂无数据</div><div class="desc">去录入运营数据后这里会自动统计</div></div>`;
      } else {
        // 总览
        const totalViews = quarterData.reduce((s,a) => s+(a.views||0), 0);
        const totalLikes = quarterData.reduce((s,a) => s+(a.likes||0), 0);
        const totalComments = quarterData.reduce((s,a) => s+(a.comments||0), 0);
        const totalShares = quarterData.reduce((s,a) => s+(a.shares||0), 0);
        const totalFollowers = quarterData.reduce((s,a) => s+(a.followersGain||0), 0);

        html += `
          <div class="grid grid-5 mb-4" style="grid-template-columns:repeat(5,1fr);gap:8px;">
            <div class="text-center" style="background:var(--bg-hover);padding:12px;border-radius:8px;">
              <div style="font-size:22px;font-weight:700;color:var(--primary);">${totalViews.toLocaleString()}</div>
              <div class="text-xs text-muted">总浏览</div>
            </div>
            <div class="text-center" style="background:var(--bg-hover);padding:12px;border-radius:8px;">
              <div style="font-size:22px;font-weight:700;color:var(--accent);">${totalLikes.toLocaleString()}</div>
              <div class="text-xs text-muted">总点赞</div>
            </div>
            <div class="text-center" style="background:var(--bg-hover);padding:12px;border-radius:8px;">
              <div style="font-size:22px;font-weight:700;color:var(--success);">${totalComments}</div>
              <div class="text-xs text-muted">总评论</div>
            </div>
            <div class="text-center" style="background:var(--bg-hover);padding:12px;border-radius:8px;">
              <div style="font-size:22px;font-weight:700;color:var(--info);">${totalShares}</div>
              <div class="text-xs text-muted">总转发</div>
            </div>
            <div class="text-center" style="background:var(--bg-hover);padding:12px;border-radius:8px;">
              <div style="font-size:22px;font-weight:700;color:var(--warning);">+${totalFollowers}</div>
              <div class="text-xs text-muted">粉丝增长</div>
            </div>
          </div>
        `;

        // 分账号分平台明细
        html += '<div style="overflow-x:auto;"><table class="data-table"><thead><tr><th>账号</th><th>平台</th><th>浏览</th><th>点赞</th><th>评论</th><th>转发</th><th>粉丝增长</th><th>互动率</th></tr></thead><tbody>';

        accounts.forEach(acc => {
          const accData = quarterData.filter(a => a.accountId === acc.id);
          const platforms = [...new Set(accData.map(a => a.platform))];
          platforms.forEach(p => {
            const pData = accData.filter(a => a.platform === p);
            if (!pData.length) return;
            const views = pData.reduce((s,a)=>s+(a.views||0),0);
            const likes = pData.reduce((s,a)=>s+(a.likes||0),0);
            const comments = pData.reduce((s,a)=>s+(a.comments||0),0);
            const shares = pData.reduce((s,a)=>s+(a.shares||0),0);
            const followers = pData.reduce((s,a)=>s+(a.followersGain||0),0);
            const engagement = views > 0 ? ((likes + comments + shares) / views * 100).toFixed(2) : '0.00';

            html += `<tr>
              <td><span class="tag" style="background:${acc.color}20;color:${acc.color};">${acc.name}</span></td>
              <td>${p}</td>
              <td>${views.toLocaleString()}</td>
              <td>${likes}</td>
              <td>${comments}</td>
              <td>${shares}</td>
              <td style="color:var(--success);">+${followers}</td>
              <td>${engagement}%</td>
            </tr>`;
          });
        });

        html += '</tbody></table></div>';

        // 月度对比
        html += '<div class="card-title mt-4 mb-3">📅 月度对比</div><div class="chart-container" id="quarterlyChart"></div>';
      }

      html += '</div>';
      container.innerHTML = html;

      if (quarterData.length) {
        this.renderChart(quarterData, accounts, year, quarter);
      }
    },

    renderChart(data, accounts, year, quarter) {
      const container = document.getElementById('quarterlyChart');
      if (!container) return;

      const months = [];
      for (let i = 0; i < 3; i++) {
        const m = (quarter - 1) * 3 + i + 1;
        months.push(`${year}-${String(m).padStart(2,'0')}`);
      }

      const chartData = months.map(m => {
        const mData = data.filter(a => a.date.substring(0,7) === m);
        return {
          date: m,
          views: mData.reduce((s,a) => s+(a.views||0), 0),
          likes: mData.reduce((s,a) => s+(a.likes||0), 0),
          comments: mData.reduce((s,a) => s+(a.comments||0), 0)
        };
      });

      MediaModule.data.drawLineChart(container, chartData, ['views','likes','comments'], ['浏览量','点赞','评论'], ['#6c5ce7','#fd79a8','#00b894']);
    },

    export() {
      const year = document.getElementById('qYear').value;
      const quarter = document.getElementById('qQuarter').value;
      const accounts = Store.get('accounts') || [];
      const analytics = Store.get('analytics') || [];

      const startMonth = (quarter - 1) * 3;
      const startDate = `${year}-${String(startMonth+1).padStart(2,'0')}`;
      const endDate = `${year}-${String(startMonth+3).padStart(2,'0')}`;
      const quarterData = analytics.filter(a => {
        const m = a.date.substring(0,7);
        return m >= startDate && m <= endDate;
      });

      let csv = `${year}年Q${quarter}季度报表\n\n`;
      csv += '账号,平台,日期,浏览量,点赞,评论,转发,粉丝增减\n';
      quarterData.forEach(a => {
        const acc = accounts.find(ac => ac.id === a.accountId);
        csv += `${(acc||{}).name||''},${a.platform},${a.date},${a.views||0},${a.likes||0},${a.comments||0},${a.shares||0},${a.followersGain||0}\n`;
      });

      Utils.download(`${year}-Q${quarter}-报表.csv`, '\ufeff' + csv, 'text/csv');
      Toast.show('报表已导出', 'success');
    }
  }
};
