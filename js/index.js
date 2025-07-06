// 根据编号筛选
function filterById() {
  const input = document.getElementById("idFilterInput").value.trim();
  const icpFiling = document.getElementById('ICPFiling');
  if (!allData || allData.length === 0) {
    icpFiling.style.display = 'block';
    return;
  }
  icpFiling.style.display = 'none';

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
  toast.innerHTML = `<div class="infoText">${text}</div>`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), timer * 1000);
}

// 复制文本到剪贴板
function copyTxt(number, text) {
  if (!document.execCommand) {
    tatol(1, "复制失败，请长按复制", 1);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = 0;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
  tatol(0, "已复制第：" + number + " 条", 1);
}

let allData = [];
let isSingleColumn = true;
let isRequesting = false; // 请求节流标志
const DATA_EXPIRY_TIME = 60 * 1000; // 1分钟过期时间

// 渲染数据
function renderData(data) {
  const container = document.getElementById("listBox");
  container.innerHTML = '';

  if (!data || data.length === 0) {
    container.innerHTML = `<p style="text-align:center;">暂无数据</p>`;
    return;
  }

  container.className = isSingleColumn ? 'single-column' : '';

  // 创建行和项目
  for (let i = 0; i < data.length; i++) {
    if (i % 2 === 0 || isSingleColumn) {
      const row = document.createElement('div');
      row.className = 'list-row';
      container.appendChild(row);
    }

    const lastRow = container.lastChild;
    const item = createItem(data[i]);
    lastRow.appendChild(item);
  }
}

// 创建单个条目
function createItem(item) {
  const div = document.createElement('div');
  div.className = 'item';
  div.setAttribute('onclick', `copyTxt('${item.id}', '${item.context.replace(/'/g, "\\'")}')`);
  div.innerHTML = `<div class="text-part">${item.id}. ${item.context}</div>`;
  return div;
}

// 检查本地存储的数据是否有效
function checkLocalData() {
  const savedData = localStorage.getItem('blessingData');
  const savedTime = localStorage.getItem('blessingDataTime');

  if (savedData && savedTime) {
    const currentTime = new Date().getTime();
    const timeDiff = currentTime - parseInt(savedTime);

    if (timeDiff < DATA_EXPIRY_TIME) {
      // 数据未过期，使用本地数据
      try {
        allData = JSON.parse(savedData);
        showRange(1, 50);
        return true;
      } catch (e) {
        console.error('解析本地数据失败', e);
        localStorage.removeItem('blessingData');
        localStorage.removeItem('blessingDataTime');
      }
    } else {
      // 数据已过期，清除
      localStorage.removeItem('blessingData');
      localStorage.removeItem('blessingDataTime');
    }
  }
  return false;
}

// 获取全部数据
function loadData() {
  // 如果已经有数据，直接显示
  if (allData.length > 0) {
    showRange(1, 50);
    return;
  }

  // 检查本地存储
  if (checkLocalData()) {
    return;
  }

  // 防止重复请求
  if (isRequesting) {
    return;
  }

  // 显示加载中状态
  const container = document.getElementById("listBox");
  container.innerHTML = '<p style="text-align:center;">加载中...</p>';

  isRequesting = true;

  const apiUrl = ServerConfig.get('baseUrl');
  console.log("URL:", apiUrl);

  fetch(`${apiUrl}/fang3/zfy`, {
    method: 'GET',
    headers: {
      'Authorization': localStorage.getItem('token') || '',
      'Content-Type': 'application/json',
    },
  })
    .then(response => {
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
      // console.log("API 响应数据:", res);
      allData = res.data || []; // 注意这里去掉了 const，更新全局变量
      localStorage.setItem('blessingDataTime', Date.now().toString());
      showRange(1, 50);
      isRequesting = false;
    })
    .catch(error => {
      console.error("请求失败完整日志:", error);
      document.getElementById("listBox").innerHTML = `
       <p style="text-align:center; color: red;">
         请求失败: ${error.message}<br>
         ......
       </p>
     `;
      isRequesting = false;

      // 3秒后自动重试
      // setTimeout(() => {
      //   if (allData.length === 0) {
      //     loadData();
      //   }
      // }, 3000);
    });
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

// 切换布局
function toggleLayout() {
  isSingleColumn = !isSingleColumn;
  const toggleBtn = document.getElementById('toggleLayoutBtn');
  toggleBtn.textContent = isSingleColumn ? '双列显示' : '单列显示';

  // 重新渲染当前显示的数据
  const container = document.getElementById('listBox');
  const items = container.querySelectorAll('.item');
  if (items.length > 0) {
    const currentData = Array.from(items).map(item => {
      const text = item.querySelector('.text-part').textContent;
      const [id, ...contextParts] = text.split('. ');
      return {
        id: id.replace('.', '').trim(),
        context: contextParts.join('. ')
      };
    });
    renderData(currentData);
  }
}

// 页面加载时直接加载数据
document.addEventListener('DOMContentLoaded', function () {
  // 初始化加载数据
  loadData();
  // 清空筛选输入框
  document.getElementById("idFilterInput").value = "";

  // 获取当前环境
  // console.log('当前环境:', ServerConfig.getCurrentEnv());
  // // 获取API基础地址
  // const apiUrl = ServerConfig.get('baseUrl');
  // console.log(apiUrl);
});

// 立即执行加载，不等待DOMContentLoaded
// 这样可以更早开始请求
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadData);
} else {
  loadData();
}