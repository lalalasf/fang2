// 从ServerConfig获取apiUrl
let apiUrl = '';
document.addEventListener('DOMContentLoaded', function () {
  try {
    apiUrl = ServerConfig.get('baseUrl');
    if (apiUrl) {
      loadNoticeData();
    } else {
      document.getElementById('noticeList').innerHTML = '<div class="error-message">配置文件加载失败</div>';
    }
  } catch (error) {
    console.error('加载配置失败:', error);
    document.getElementById('noticeList').innerHTML = '<div class="error-message">配置文件加载失败</div>';
  }
});

let noticeDataT = [];
let nextItemId = 0;

// 自定义对话框相关变量
let currentOperation = null; // 'edit' 或 'add'
let currentItemId = null;

function loadNoticeData() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  fetch(`${apiUrl}/fang3/zfy`, {
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
      const allData = res.data || [];
      console.log('获取到的数据总量:', allData.length);

      // 筛选100条以后的数据
      const dataAfter100 = allData.slice(100);
      console.log('100条以后的数据量:', dataAfter100.length);

      // 过滤出有效数据
      const filteredData = dataAfter100.filter(item => {
        // 检查item是否存在且长度大于1
        if (item == null) return false;
        if (typeof item === 'object' && item.context) {
          return item.context.length > 1;
        }
        return typeof item === 'string' && item.length > 1;
      });
      console.log('过滤后的数据量:', filteredData.length);

      // 计算下一个可用ID
      const maxId = filteredData.reduce((max, item) => {
        const itemId = item.id || 0;
        return Math.max(max, itemId);
      }, 101);
      nextItemId = maxId + 1;
      console.log('下一个可用ID:', nextItemId);

      noticeDataT = filteredData;
      renderNoticeList(filteredData);
    })
    .catch(error => {
      clearTimeout(timeoutId);
      console.error("请求失败:", error);
      const errorMsg = error.name === 'AbortError' ? '请求超时，请重试' : error.message;
      document.getElementById("noticeList").innerHTML = `
        <div class="error-message">
          请求失败: ${errorMsg}
        </div>
      `;
    });
}

function renderNoticeList(data) {
  const noticeList = document.getElementById('noticeList');

  if (data.length === 0) {
    noticeList.innerHTML = '<div class="empty-message">暂无符合条件的数据</div>';
    return;
  }

  const html = `<div class="list-row">
    ${data.map((item) => {
    const itemId = item.id || 0;
    const itemContent = item.context || item;
    const escapedContent = itemContent.replace(/'/g, "\\'");
    const isMzAmusement = itemContent == 'mzamusement.cn' || itemContent == 'yumifang3.site';
    const textColorClass = isMzAmusement ? ' text-color' : '';
    return `
        <div class="item" data-id="${itemId}" data-context="${itemContent}">
          <div class="text-part${textColorClass}">
            ${itemId}. ${itemContent}
          </div>
          <div class="item-actions">
            <button class="btn btn-edit" onclick="editItem(${itemId}, '${escapedContent}')">修改</button>
            <button class="btn btn-delete" onclick="deleteItem(${itemId})">删除</button>
          </div>
        </div>
      `;
  }).join('')}
  </div>`;

  noticeList.innerHTML = html;
}

function editItem(itemId, itemContent) {
  currentOperation = 'edit';
  currentItemId = itemId;
  
  // 设置对话框标题和输入框内容
  document.getElementById('dialogTitle').textContent = '修改内容';
  document.getElementById('dialogInput').value = itemContent;
  
  // 显示对话框
  document.getElementById('customInputDialog').classList.add('show');
  
  // 聚焦输入框
  setTimeout(() => {
    document.getElementById('dialogInput').focus();
  }, 100);
}

function deleteItem(itemId) {
  if (confirm(`确定要删除第${itemId}条数据吗？`)) {
    // 这里可以实现删除逻辑，调用API删除数据
    var context = itemId + ',-';
    sendPostUpdateRequest(context);
  }
}

function addItem() {
  currentOperation = 'add';
  currentItemId = null;
  
  // 设置对话框标题和清空输入框
  document.getElementById('dialogTitle').textContent = '添加内容';
  document.getElementById('dialogInput').value = '';
  
  // 显示对话框
  document.getElementById('customInputDialog').classList.add('show');
  
  // 聚焦输入框
  setTimeout(() => {
    document.getElementById('dialogInput').focus();
  }, 100);
}

function sendPostUpdateRequest(context) {
  var requestData = {
    context: context,
    status: 0,
    token: localStorage.getItem('token') || ''
  };
  const api_url = apiUrl + "/fang3/a/update";
  console.log(requestData);
  fetch(api_url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestData)
  })
    .then(response => {
      console.log(response)
      if (!response.ok) {
        showToast(`操作失败！${response.status}`, 'error', 1500); // 成功消息，显示2.5秒
        throw new Error(` 状态码: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (data.code === "200") {
        showToast(`更新成功！`, 'success', 1500); // 成功消息，显示2.5秒
        if (requestData.token) {
          localStorage.setItem("token", requestData.token);
        }
        // 重新加载数据
        loadNoticeData();
      } else {
        showToast(`更新失败！` + `<p style='color:red'>${data.code} ${data.msg}</p>` + `更新失败</p>`, 'error', 2500); // 成功消息，显示2.5秒
      }
      return;
    })
    .catch(error => {
      showToast(`操作失败！${error.message}`, 'error', 2500); // 成功消息，显示2.5秒
      console.error('Error:', error);
    });
}

function getNoticeDataALl() {

    if (noticeDataT.length === 0) {
        showToast('没有数据', 'info', 1000);
        return;
    }
    var text = '';
    for (var i = 0; i < noticeDataT.length; ++i) {
        if (noticeDataT[i].context.trim().length <= 2) continue;
        text += noticeDataT[i].id + ',' + noticeDataT[i].context + '\n';
    }
    try {
        // 先尝试复制到剪贴板
        navigator.clipboard.writeText(text);

        showToast('全部复制！', 'success', 1000); // 成功消息，显示1秒
    } catch (err) {
        // 回退到老方法
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = 0;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);

        showSuccessBtn()
        showToast('全部复制！', 'success', 1000); // 成功消息，显示1秒
    }
}

// 获取弹窗容器
const toastContainer = document.getElementById('toastContainer');

// 创建并显示弹窗的函数
function showToast(message, type = 'info', duration = 3000) { // type: 'success', 'error', 'info'; duration: 毫秒
  // 1. 创建弹窗元素
  const toast = document.createElement('div');
  toast.className = `toast ${type}`; // 添加基本类和类型类
  toast.textContent = message;

  // 2. (可选) 添加进度条指示器
  const progressDiv = document.createElement('div');
  progressDiv.className = 'toast-progress';
  toast.appendChild(progressDiv);

  // 3. 将弹窗添加到容器中
  toastContainer.appendChild(toast);

  // 4. 强制浏览器重绘，确保初始样式（opacity: 0, transform: translateY(-20px)）应用后再添加 show 类
  // 这样可以触发动画
  toast.offsetHeight;

  // 5. 添加 'show' 类，触发动画效果
  toast.classList.add('show');

  // 6. 设置定时器，用于自动移除弹窗
  const timer = setTimeout(() => {
    removeToast(toast);
  }, duration);

  // 7. (可选) 添加进度条动画效果 (需要额外的 JS)
  // 启动一个动画循环来更新进度条宽度
  const startTime = Date.now();
  const updateProgress = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min((elapsed / duration) * 100, 100);
    progressDiv.style.width = `${100 - progress}%`; // 从右到左减少宽度

    if (progress < 100) {
      requestAnimationFrame(updateProgress); // 继续动画
    }
  };
  updateProgress(); // 开始动画

  // 8. (可选) 允许用户点击弹窗来提前关闭
  toast.addEventListener('click', () => {
    clearTimeout(timer); // 清除自动移除的定时器
    removeToast(toast);
  });

  // 9. 返回定时器ID，以便外部可以控制 (例如，外部代码可以 clearTimeout(timer))
  return timer;
}

// 移除弹窗的函数
function removeToast(toastElement) {
  // 1. 添加一个类来触发动画（例如，淡出和滑动）
  toastElement.classList.remove('show'); // 移除 'show' 类，触发动画回退

  // 2. 等待动画完成后再真正从DOM中移除
  toastElement.addEventListener('transitionend', function handler() {
    this.removeEventListener('transitionend', handler); // 移除事件监听器，防止内存泄漏
    if (this.parentNode) { // 检查父节点是否存在，以防元素已被移除
      this.parentNode.removeChild(this);
    }
  });
}

// 示例：按钮点击事件处理
// document.getElementById('showSuccessBtn').addEventListener('click', () => {
//     showToast('操作成功！', 'success', 2500); // 成功消息，显示2.5秒
// });

// document.getElementById('showErrorBtn').addEventListener('click', () => {
//     showToast('发生了一个错误！', 'error', 3000); // 错误消息，显示3秒
// });

// document.getElementById('showInfoBtn').addEventListener('click', () => {
//     showToast('这是一条提示信息。', 'info', 4000); // 提示消息，显示4秒
// });

// (可选) 如果你想让外部代码也能方便地调用，可以将函数挂载到全局对象
// window.showToast = showToast; // 这样可以在其他地方调用 window.showToast(...)

// 自定义对话框相关函数
function closeCustomDialog() {
  document.getElementById('customInputDialog').classList.remove('show');
  // 重置状态
  currentOperation = null;
  currentItemId = null;
}

function confirmCustomDialog() {
  const inputValue = document.getElementById('dialogInput').value.trim();
  
  if (inputValue === '') {
    showToast('请输入内容', 'error', 1500);
    return;
  }
  
  if (currentOperation === 'edit' && currentItemId !== null) {
    // 处理修改操作
    var context = currentItemId + ',' + inputValue;
    sendPostUpdateRequest(context);
  } else if (currentOperation === 'add') {
    // 处理添加操作
    const newId = nextItemId;
    var context = newId + ',' + inputValue;
    sendPostUpdateRequest(context);
    // 更新 nextItemId 以便下次使用
    nextItemId++;
  }
  
  // 关闭对话框
  closeCustomDialog();
}