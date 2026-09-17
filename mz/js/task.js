// 从ServerConfig获取apiUrl
let apiUrl = '';
let currentPage = 1;
let pageSize = 10;
let totalPages = 1;
let taskData = [];
let deleteTaskId = null;
let dateTimePicker = null;
let loadTaskDataThrottleTimer = null;
let lastLoadTaskDataTime = 0;

document.addEventListener('DOMContentLoaded', function () {
  try {
    apiUrl = ServerConfig.get('baseUrl');
    if (apiUrl) {
      loadTaskData();
      initDateTimePicker();
    } else {
      document.getElementById('taskList').innerHTML = '<div class="error-message">配置文件加载失败</div>';
    }
  } catch (error) {
    console.error('加载配置失败:', error);
    document.getElementById('taskList').innerHTML = '<div class="error-message">配置文件加载失败</div>';
  }
});

function initDateTimePicker() {
  dateTimePicker = new DateTimePicker('execTime', {
    defaultTime: '00:00'
  });
}

// 加载任务数据
function loadTaskData() {
  const now = Date.now();
  const throttleDelay = 1000;

  // 清除之前的定时器
  if (loadTaskDataThrottleTimer) {
    clearTimeout(loadTaskDataThrottleTimer);
    loadTaskDataThrottleTimer = null;
  }

  if (now - lastLoadTaskDataTime < throttleDelay) {
    return new Promise((resolve, reject) => {
      loadTaskDataThrottleTimer = setTimeout(() => {
        lastLoadTaskDataTime = Date.now();
        executeLoadTaskData().then(resolve).catch(reject);
      }, throttleDelay - (now - lastLoadTaskDataTime));
    });
  }

  lastLoadTaskDataTime = now;
  return executeLoadTaskData();
}

function executeLoadTaskData() {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    fetch(`${apiUrl}/api/task/list`, {
      method: 'POST',
      headers: {
        'Authorization': localStorage.getItem('token') || '',
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    })
      .then(response => {
        clearTimeout(timeoutId);
        if (!response.ok) {
          return response.json().then(err => {
            throw new Error(err.message || `HTTP ${response.status}`);
          }).catch(() => {
            throw new Error(`HTTP ${response.status}`);
          });
        }
        return response.json();
      })
      .then(res => {
        const data = res.data || [];
        taskData = data;
        renderTaskList(data);
        resolve();
      })
      .catch(error => {
        clearTimeout(timeoutId);
        console.error("请求失败:", error);
        const errorMsg = error.name === 'AbortError' ? '请求超时，请重试' : error.message;
        document.getElementById("taskList").innerHTML = `
          <div class="error-message">
            请求失败: ${errorMsg}
          </div>
        `;
        reject(error);
      });
  });
}

// 渲染任务列表
function renderTaskList(data) {
  const taskList = document.getElementById('taskList');

  // 过滤数据
  const filteredData = filterTasks(data);
  
  // 分页
  totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;
  
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pageData = filteredData.slice(startIndex, endIndex);

  if (pageData.length === 0) {
    taskList.innerHTML = '<div class="empty-message">暂无任务数据</div>';
    updatePageInfo();
    return;
  }

  // 创建表格
  const table = document.createElement('table');
  table.className = 'task-table';
  table.style.width = '100%';

  // 创建表头
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  const headers = [
    { text: '方法', minWidth: '50px', maxWidth: '80px' },
    { text: '执行内容', minWidth: '80px', maxWidth: '120px' },
    { text: '状态', minWidth: '50px', maxWidth: '50px' },
    { text: '操作', minWidth: '20px', maxWidth: '80px' },
    { text: '执行时间', minWidth: '80px', maxWidth: '120px' },
    { text: '执行消息', minWidth: '80px', maxWidth: '120px' },
    { text: '创建时间', minWidth: '80px', maxWidth: '120px' },
    { text: '执行完成时间', minWidth: '80px', maxWidth: '120px' }
  ];

  headers.forEach(header => {
    const th = document.createElement('th');
    th.textContent = header.text;
    th.style.minWidth = header.minWidth;
    th.style.maxWidth = header.maxWidth;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // 创建表格体
  const tbody = document.createElement('tbody');
  
  pageData.forEach((item) => {
    const statusClass = item.state === 0 ? 'status-running' : 
                       item.state === 1 ? 'status-success' : 'status-failed';
    const statusText = item.state === 0 ? '执行中' : 
                      item.state === 1 ? '执行完成' : '执行失败';
    const execTime = item.execTime ? formatDateTime(item.execTime) : '-';
    const createTime = item.createTime ? formatDateTime(item.createTime) : '-';
    const execCompleteTime = item.execCompleteTime ? formatDateTime(item.execCompleteTime) : '-';
    const execContext = item.execContext || '-';
    const msg = item.msg || '-';

    const row = document.createElement('tr');
    const tds = [
      `${item.method || '-'}`,
      `<span title="${execContext.replace(/'/g, "\\'").replace(/"/g, '&quot;')}">${truncateText(execContext, 20)}</span>`,
      `<span class="status-badge ${statusClass}">${statusText}</span>`,
      `<div class="item-actions"><button class="btn btn-edit" onclick="editTask(${item.taskId})">修改</button><button class="btn btn-delete" onclick="deleteTask(${item.taskId})">删除</button></div>`,
      `${execTime}`,
      `<span title="${msg.replace(/'/g, "\\'").replace(/"/g, '&quot;')}">${truncateText(msg, 15)}</span>`,
      `${createTime}`,
      `${execCompleteTime}`
    ];

    tds.forEach((content, index) => {
      const td = document.createElement('td');
      td.innerHTML = content;
      td.style.minWidth = headers[index].minWidth;
      td.style.maxWidth = headers[index].maxWidth;
      row.appendChild(td);
    });

    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  taskList.innerHTML = '';
  taskList.appendChild(table);
  updatePageInfo();
}

// 过滤任务
function filterTasks(data) {
  const userName = document.getElementById('searchUserName').value.trim().toLowerCase();
  const method = document.getElementById('searchMethod').value.trim().toLowerCase();
  const state = document.getElementById('searchState').value;

  return data.filter(item => {
    const matchUserName = !userName || (item.userName && item.userName.toLowerCase().includes(userName));
    const matchMethod = !method || (item.method && item.method.toLowerCase().includes(method));
    const matchState = state === '' || item.state === parseInt(state);
    return matchUserName && matchMethod && matchState;
  });
}

// 搜索任务
function searchTasks() {
  const userName = document.getElementById('searchUserName').value.trim();
  if (userName) {
    searchByUserName();
  } else {
    currentPage = 1;
    renderTaskList(taskData);
  }
}

// 重置搜索
function resetSearch() {
  document.getElementById('searchUserName').value = '';
  document.getElementById('searchMethod').value = '';
  document.getElementById('searchState').value = '';
  currentPage = 1;
  renderTaskList(taskData);
  loadTaskData()
    .then(() => {
      showToast('更新成功', 'success', 1000);
    })
    .catch(error => {
      showToast('更新失败: ' + (error.message || '未知错误'), 'error', 1500);
    });
}

// 打开搜索对话框
function openSearchDialog() {
  document.getElementById('searchUserName').focus();
}

// 通过用户名查询任务
function searchByUserName() {
  const userName = document.getElementById('searchUserName').value.trim();
  if (!userName) {
    showToast('请输入用户名称', 'error', 1500);
    return;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  fetch(`${apiUrl}/api/task/queryByUserName?userName=${encodeURIComponent(userName)}`, {
    method: 'GET',
    headers: {
      'Authorization': localStorage.getItem('token') || '',
      'Content-Type': 'application/json',
    },
    signal: controller.signal,
  })
    .then(response => {
      clearTimeout(timeoutId);
      if (!response.ok) {
        return response.json().then(err => {
          throw new Error(err.message || `HTTP ${response.status}`);
        }).catch(() => {
          throw new Error(`HTTP ${response.status}`);
        });
      }
      return response.json();
    })
    .then(res => {
      const data = res.data || [];
      taskData = data;
      currentPage = 1;
      renderTaskList(data);
    })
    .catch(error => {
      clearTimeout(timeoutId);
      console.error("请求失败:", error);
      const errorMsg = error.name === 'AbortError' ? '请求超时，请重试' : error.message;
      showToast(`查询失败: ${errorMsg}`, 'error', 1500);
    });
}

// 分页跳转
function goToPage(page) {
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  renderTaskList(taskData);
}

// 更新分页信息
function updatePageInfo() {
  document.getElementById('pageInfo').textContent = `第 ${currentPage} 页 / 共 ${totalPages} 页`;
}

// 格式化日期时间
function formatDateTime(dateTimeStr) {
  if (!dateTimeStr) return '-';
  const date = new Date(dateTimeStr);
  if (isNaN(date.getTime())) return dateTimeStr;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// 截断文本
function truncateText(text, maxLength) {
  if (!text) return '-';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// 打开添加对话框
function openAddDialog() {
  document.getElementById('dialogTitle').textContent = '添加任务';
  document.getElementById('taskId').value = '';
  document.getElementById('method').value = '';
  document.getElementById('execContext').value = '';
  
  if (dateTimePicker) {
    dateTimePicker.setValue('');
  }

  document.getElementById('taskDialog').classList.add('show');

  setTimeout(() => {
    document.getElementById('method').focus();
  }, 100);
}

// 编辑任务
function editTask(taskId) {
  const task = taskData.find(item => item.taskId === taskId);
  if (!task) {
    showToast('任务不存在', 'error', 1500);
    return;
  }

  document.getElementById('dialogTitle').textContent = '修改任务';
  document.getElementById('taskId').value = task.taskId;
  document.getElementById('method').value = task.method || '';
  document.getElementById('execContext').value = task.execContext || '';
  
  if (dateTimePicker) {
    dateTimePicker.setValue(formatDateTimeForPicker(task.execTime));
  }

  document.getElementById('taskDialog').classList.add('show');
}

function formatDateTimeForPicker(dateTimeStr) {
  if (!dateTimeStr) return '';
  const date = new Date(dateTimeStr);
  if (isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// 关闭任务对话框
function closeTaskDialog() {
  document.getElementById('taskDialog').classList.remove('show');
}

// 确认任务对话框
function confirmTaskDialog() {
  const taskId = document.getElementById('taskId').value;
  const method = document.getElementById('method').value.trim();
  const execContext = document.getElementById('execContext').value.trim();
  const execTime = document.getElementById('execTime').value;

  if (!method) {
    showToast('请选择方法', 'error', 1500);
    return;
  }

  if (!execContext) {
    showToast('请输入执行内容', 'error', 1500);
    return;
  }

  if (!execTime) {
    showToast('请选择执行时间', 'error', 1500);
    return;
  }

  const taskData = {
    method: method,
    execContext: execContext,
    execTime: formatDateTimeForBackend(execTime),
    state: 0
  };

  if (taskId) {
    taskData.taskId = parseInt(taskId);
    updateTask(taskData);
  } else {
    addTask(taskData);
  }
}

function formatDateTimeForBackend(dateTimeStr) {
  if (!dateTimeStr) return null;
  
  const date = new Date(dateTimeStr);
  if (isNaN(date.getTime())) return null;
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// 添加任务
function addTask(data) {
  const requestData = {
    ...data,
    token: localStorage.getItem('token') || ''
  };

  fetch(`${apiUrl}/api/task/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': localStorage.getItem('token') || ''
    },
    body: JSON.stringify(requestData)
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    })
    .then(res => {
      if (res.code === 200 || res.code === "200") {
        showToast('添加成功', 'success', 1500);
        closeTaskDialog();
        loadTaskData();
      } else {
        showToast(res.msg || '添加失败', 'error', 1500);
      }
    })
    .catch(error => {
      console.error('添加任务失败:', error);
      showToast('添加失败: ' + error.message, 'error', 1500);
    });
}

// 更新任务
function updateTask(data) {
  const requestData = {
    ...data,
    token: localStorage.getItem('token') || ''
  };

  fetch(`${apiUrl}/api/task/update`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': localStorage.getItem('token') || ''
    },
    body: JSON.stringify(requestData)
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    })
    .then(res => {
      if (res.code === 200 || res.code === "200") {
        showToast('修改成功', 'success', 1500);
        closeTaskDialog();
        loadTaskData();
      } else {
        showToast(res.msg || '修改失败', 'error', 1500);
      }
    })
    .catch(error => {
      console.error('修改任务失败:', error);
      showToast('修改失败: ' + error.message, 'error', 1500);
    });
}

// 删除任务
function deleteTask(id) {
  deleteTaskId = id;
  document.getElementById('deleteDialog').classList.add('show');
}

// 关闭删除对话框
function closeDeleteDialog() {
  document.getElementById('deleteDialog').classList.remove('show');
  deleteTaskId = null;
}

// 确认删除
function confirmDelete() {
  if (!deleteTaskId) return;

  fetch(`${apiUrl}/api/task/delete?taskId=${deleteTaskId}`, {
    method: 'POST',
    headers: {
      'Authorization': localStorage.getItem('token') || ''
    }
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    })
    .then(res => {
      if (res.code === 200 || res.code === "200") {
        showToast('删除成功', 'success', 1500);
        closeDeleteDialog();
        loadTaskData();
      } else {
        showToast(res.msg || '删除失败', 'error', 1500);
      }
    })
    .catch(error => {
      console.error('删除任务失败:', error);
      showToast('删除失败: ' + error.message, 'error', 1500);
    });
}

// 显示弹窗
function showToast(message, type = 'info', duration = 3000) {
  const toastContainer = document.getElementById('toastContainer');

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  // 设置更高的 z-index，确保显示在弹窗之上
  toast.style.zIndex = '9999';

  const progressDiv = document.createElement('div');
  progressDiv.className = 'toast-progress';
  toast.appendChild(progressDiv);

  toastContainer.appendChild(toast);
  toast.offsetHeight;
  toast.classList.add('show');

  const timer = setTimeout(() => {
    removeToast(toast);
  }, duration);

  const startTime = Date.now();
  const updateProgress = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min((elapsed / duration) * 100, 100);
    progressDiv.style.width = `${100 - progress}%`;

    if (progress < 100) {
      requestAnimationFrame(updateProgress);
    }
  };
  updateProgress();

  toast.addEventListener('click', () => {
    clearTimeout(timer);
    removeToast(toast);
  });
}

// 移除弹窗
function removeToast(toastElement) {
  toastElement.classList.remove('show');
  toastElement.addEventListener('transitionend', function handler() {
    this.removeEventListener('transitionend', handler);
    if (this.parentNode) {
      this.parentNode.removeChild(this);
    }
  });
}
