// index.js
let allData = [];
let isSingleColumn = true;
let isRequesting = false; // 请求节流标志
const DATA_EXPIRY_TIME = 10 * 1000; // 过期时间
const apiUrl = ServerConfig.get('baseUrl');

// 根据编号筛选
function filterById() {
  const input = document.getElementById("idFilterInput").value.trim();
  controlIcpFiling();

  if (!input) {
    // 输入为空时恢复当前范围的数据
    const rangeButtons = document.querySelectorAll(".btn-range");
    for (let btn of rangeButtons) {
      if (btn.textContent.includes("1-50")) {
        showRange(1, 50);
        break;
      } else if (btn.textContent.includes("51-100")) {
        showRange(51, 100);
        break;
      }
    }
    return;
  }

  const idsToInclude = new Set();

  const entries = input.split(/\s+/); // 分割空格
  entries.forEach(part => {
    if (/^\d+$/.test(part)) {
      // 单个数字，如 "1"
      idsToInclude.add(parseInt(part));
    } else if (/^\d+-\d+$/.test(part)) {
      // 范围，如 "2-6"
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr);
      const end = parseInt(endStr);
      if (start <= end) {
        for (let i = start; i <= end; i++) {
          idsToInclude.add(i);
        }
      }
    }
  });

  const filtered = allData.filter(item => idsToInclude.has(parseInt(item.id)));
  renderData(filtered);
}

// 提示组件
function tatol(status, text, timer = 1) {
  const toast = document.createElement("div");
  toast.className = "tatol";
  toast.innerHTML = `<div class="tatol-text">${text}</div>`;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("tatol-show");
  });

  setTimeout(() => {
    toast.classList.remove("tatol-show");
    setTimeout(() => toast.remove(), 300);
  }, timer * 1000);
}

/**
 * Copy text to clipboard.
 * @param {number} number
 * @param {string} text
 * @returns {Promise<void>}
 */
async function copyTxt(number, text) {
  try {
    await navigator.clipboard.writeText(text);
    tatol(0, `已复制第：${number} 条`, 1);
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

    tatol(0, `已复制第：${number} 条`, 1);
  }

  try {
    await fetch(`${apiUrl}/fang3/copy?code=${number}`, {
      method: 'GET',
      headers: {
        'Authorization': localStorage.getItem('token') || '',
        'Content-Type': 'application/json',
      },
    });
  } catch (e) {
    console.error("日志发送失败:", e);
  }
}

// 渲染数据
function renderData(data) {
  // 获取列表容器
  const container = document.getElementById("listBox");
  // 清空容器内容
  container.innerHTML = '';

  // 如果没有数据，显示“暂无数据”提示
  if (!data || data.length === 0) {
    container.innerHTML = `<p style="text-align:center;">暂无数据</p>`;
    return;
  }

  // 根据 isSingleColumn（是否单列布局）设置容器 class
  container.className = isSingleColumn ? 'single-column' : 'multi-column';

  // 使用DocumentFragment减少DOM操作次数
  const fragment = document.createDocumentFragment();

  // 遍历数据，创建项目
  for (let i = 0; i < data.length; i++) {
    // 创建单个项目元素
    const item = createItem(data[i]);
    // 将项目添加到fragment中
    fragment.appendChild(item);
  }

  // 一次性添加所有元素到容器
  container.appendChild(fragment);
}

function createItem(item) {
  const div = document.createElement('div');
  div.className = 'item';

  if (item.context == 'mzamusement.cn') {
    div.classList.add('text-color');
  }
  if (item.context == 'yumifang3.site') {
    div.classList.add('text-color');
  }
  div.textContent = `${item.id}. ${item.context}`;
  div.dataset.id = item.id;
  div.dataset.context = item.context;

  return div;
}

function checkLocalData() {
  const savedData = localStorage.getItem('blessingData');
  const savedTime = localStorage.getItem('blessingDataTime');

  if (savedData && savedTime) {
    const currentTime = new Date().getTime();
    const timeDiff = currentTime - parseInt(savedTime);

    if (timeDiff < DATA_EXPIRY_TIME) {
      try {
        allData = JSON.parse(savedData);
        return true;
      } catch (e) {
        console.error('解析本地数据失败', e);
        localStorage.removeItem('blessingData');
        localStorage.removeItem('blessingDataTime');
      }
    } else {
      localStorage.removeItem('blessingData');
      localStorage.removeItem('blessingDataTime');
    }
  }
  return false;
}

// 获取全部数据
// 存储请求Promise，用于处理并发请求
let loadDataPromise = null;

function loadData() {
  // 如果已经有正在进行的请求，返回同一个Promise
  if (loadDataPromise) {
    return loadDataPromise;
  }

  loadDataPromise = new Promise((resolve, reject) => {
    if (allData.length > 0) {
      showRange(1, 50);
      resolve(allData);
      loadDataPromise = null;
      return;
    }

    if (checkLocalData()) {
      showRange(1, 50);
      resolve(allData);
      loadDataPromise = null;
      return;
    }

    const container = document.getElementById("listBox");
    container.innerHTML = '<p style="text-align:center;">加载中...</p>';

    isRequesting = true;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

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
        allData = res.data || [];
        localStorage.setItem('blessingData', JSON.stringify(allData));
        localStorage.setItem('blessingDataTime', Date.now().toString());
        showRange(1, 50);
        isRequesting = false;
        loadDataPromise = null;
        resolve(allData);
      })
      .catch(error => {
        clearTimeout(timeoutId);
        const errorMsg = error.name === 'AbortError' ? '请求超时，请重试' : error.message;
        console.error("请求失败完整日志:", error);
        console.log(errorMsg);
        document.getElementById("listBox").innerHTML = `
       <p style="text-align:center; color: red;">
         维护中......<br>
       </p>
     `;
        isRequesting = false;
        loadDataPromise = null;
        reject(error);
      });
  });

  return loadDataPromise;
}

// 显示指定范围的数据
function showRange(start, end) {
  if (allData.length === 0) {
    tatol(1, "数据尚未加载完成", 1);
    return;
  }

  const filtered = allData.filter(item => {
    const id = parseInt(item.id);
    return id >= start && id <= end;
  });
  renderData(filtered);
}

function toggleLayout() {
  isSingleColumn = !isSingleColumn;
  const toggleBtn = document.getElementById('toggleLayoutBtn');
  toggleBtn.textContent = isSingleColumn ? '双列显示' : '单列显示';

  const container = document.getElementById('listBox');
  const items = container.querySelectorAll('.item');
  if (items.length > 0 && allData.length > 0) {
    const currentIds = Array.from(items).map(item => parseInt(item.dataset.id));
    const currentData = allData.filter(item => currentIds.includes(parseInt(item.id)));
    renderData(currentData);
  }
}

if (document.readyState === 'loading') {
  localStorage.removeItem('originalBlessingData');
  document.addEventListener('DOMContentLoaded', initPage);
} else {
  controlIcpFiling(); // 页面初始化时控制 ICP 备案信息
  loadData();
}

// 控制 ICP 备案信息的显示/隐藏
function controlIcpFiling() {
  const icpFiling = document.getElementById('ICPFiling');
  if (!icpFiling) return;

  const hostname = window.location.hostname;
  // 仅当域名包含 mzamusement 时才显示 ICP 备案信息
  if (hostname.includes('mzamusement')) {
    icpFiling.style.display = 'block';
  } else {
    icpFiling.style.display = 'none';
  }
}

function initPage() {
  controlIcpFiling(); // 页面初始化时控制 ICP 备案信息
  loadData();
  document.getElementById("idFilterInput").value = "";

  document.getElementById('listBox').addEventListener('click', (e) => {
    const item = e.target.closest('.item');
    if (item) {
      item.classList.add('item-gray');
      copyTxt(item.dataset.id, item.dataset.context);
    }
  });

  // 在页面初始化时调用 checkNotice，用于触发弹窗
  checkNotice();

  // 点击遮罩层关闭弹窗（带防抖处理）
  let isClosing = false;
  document.getElementById('noticeModal').addEventListener('click', function (e) {
    if (e.target === this && !isClosing) {
      isClosing = true;
      closeNotice();
      setTimeout(() => {
        isClosing = false;
      }, 300);
    }
  });

  document.getElementById('noticeList').addEventListener('click', function (e) {
    const item = e.target.closest('.item');
    if (item) {
      copyTxt(item.dataset.id, item.dataset.context);
    }
  });
}

function checkNotice() {
  const hideUntil = localStorage.getItem('noticeHideUntil');
  const today = new Date();
  const checkbox = document.getElementById('dontShowToday');

  if (hideUntil && new Date(hideUntil) > today) {
    checkbox.checked = true;
  } else {
    checkbox.checked = false;
    localStorage.removeItem('noticeHideUntil');
    renderNoticeList().then(() => {
      document.getElementById('noticeModal').classList.add('show');
    });
  }
}

// 渲染公告列表
async function renderNoticeList() {
  const noticeList = document.getElementById('noticeList');

  // 显示加载状态
  noticeList.innerHTML = '<div class="notice-loading"><span class="loading-spinner"></span>加载中...</div>';

  // 等待数据加载完成
  try {
    await loadData();
  } catch (error) {
    console.error('加载数据失败:', error);
    noticeList.innerHTML = '<div class="notice-empty"><span class="empty-icon">⚠️</span><p>加载失败，请稍后重试</p><button onclick="renderNoticeList()" class="retry-btn">重新加载</button></div>';
    throw error;
  }

  noticeList.innerHTML = '';

  if (!allData || allData.length === 0) {
    noticeList.innerHTML = '<div class="notice-empty"><span class="empty-icon">📭</span><p>暂无公告</p></div>';
    return;
  }

  const filteredData = allData.filter(item => parseInt(item.id) > 100 && item.context && item.context.length > 1);

  if (filteredData.length === 0) {
    noticeList.innerHTML = '<div class="notice-empty"><span class="empty-icon">📭</span><p>暂无公告</p></div>';
    return;
  }

  // 使用DocumentFragment减少DOM操作次数
  const fragment = document.createDocumentFragment();
  filteredData.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'item';
    div.dataset.id = item.id;
    div.dataset.context = item.context;
    div.textContent = `${item.context}`;
    div.style.animationDelay = `${index * 0.03}s`;
    fragment.appendChild(div);
  });
  noticeList.appendChild(fragment);
}

function showNoticeModal() {
  const hideUntil = localStorage.getItem('noticeHideUntil');
  const today = new Date();
  const checkbox = document.getElementById('dontShowToday');

  checkbox.checked = (hideUntil && new Date(hideUntil) > today);
  renderNoticeList().then(() => {
    document.getElementById('noticeModal').classList.add('show');
  });
}

function updateNoticeHideStatus() {
  const checkbox = document.getElementById('dontShowToday');
  if (checkbox.checked) {
    const hideUntil = new Date();
    hideUntil.setHours(23, 59, 59, 999);
    localStorage.setItem('noticeHideUntil', hideUntil.toISOString());
  } else {
    localStorage.removeItem('noticeHideUntil');
  }
}

function closeNotice() {
  updateNoticeHideStatus();
  document.getElementById('noticeModal').classList.remove('show');
}

function toggleDontShowToday() {
  updateNoticeHideStatus();
}

// 回到顶部功能
function backToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

// 滚动事件监听，控制回到顶部按钮的显示/隐藏
window.addEventListener('scroll', function() {
  const backToTopBtn = document.getElementById('backToTop');
  if (window.scrollY > 300) {
    backToTopBtn.classList.add('show');
  } else {
    backToTopBtn.classList.remove('show');
  }
});