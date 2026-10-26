
let fristView = true;

let currentData = {
    page: 1,
    pageSize: 10,
    total: 0
};

let totalCopyTimes = 0;

// 检查Token
function checkToken() {
    const inputToken = document.getElementById('tokenInput').value.trim();
    const savedToken = localStorage.getItem('token');
    const errorElement = document.getElementById('tokenError');

    if (!inputToken) {
        errorElement.textContent = "请输入Token";
        errorElement.style.display = 'block';
        return;
    }

    // 严格验证：输入token必须与本地存储的token完全一致
    if (inputToken === savedToken) {
        document.getElementById('authModal').style.display = 'none';
        document.getElementById('mainContainer').style.display = 'block';
        errorElement.style.display = 'none';
        fetchData();
    } else {
        errorElement.textContent = "Token验证失败，请重新输入";
        errorElement.style.display = 'block';
    }
}

// 加载数据
async function fetchData() {
    try {
        // 确保 page 和 pageSize 是数字类型
        const page = parseInt(document.getElementById('pageInput').value) || currentData.page;
        const pageSize = parseInt(document.getElementById('pageSizeInput').value) || currentData.pageSize;
        // 获取当前日期
        // 获取创建时间
        const createTimeInput = document.getElementById('createTime');
        let createTime;

        if (fristView) {
            const now = new Date();
            const localDate = now.toLocaleDateString('en-CA'); // 'en-CA' 强制格式为 YYYY-MM-DD
            createTime = now.toLocaleDateString('en-CA'); // 本地日期，格式 YYYY-MM-DD
            // console.log("now:", now);
            console.log("createTime:", createTime);
            createTimeInput.value = createTime;
        } else {
            createTime = createTimeInput.value;
        }
        fristView = false;

        currentData.page = page;
        currentData.pageSize = pageSize;

        const apiUrl = ServerConfig.get('baseUrl');

        let url = apiUrl + `/api/ip/url?page=${page}&pageSize=${pageSize}`;
        if (createTime) {
            url += `&createTime=${encodeURIComponent(createTime)}`;
        }
        console.log(url);

        const response = await fetch(url, {
            headers: {
                'Authorization': localStorage.getItem('token') || ''
            }
        });

        // 检查Token是否有效
        if (response.status === 401) {
            throw new Error('Token无效或已过期');
        }

        let jsonData = {};

        if (window.location.hostname == 'localhost') {
            jsonData = {
                "code": "200",
                "data": {
                    "page": 0,
                    "pageSize": 11,
                    "offset": null,
                    "total": 11,
                    "data": [
                        {
                            "id": 1,
                            "ip": "666.666.666",
                            "url": "/test/test/test",
                            "times": 1,
                            "updateTime": "2025-08-11 01:11:56",
                            "createTime": "2011-01-11 11:11:11",
                            "province": "测试省",
                            "viewTotal": 1,
                            "totalCopyTimesByIp": "11"
                        }
                    ],
                    "totalCopyTimes": "1111",
                    "uv": "1111",
                    "pv": "1111",
                    "preDataDto": {
                        "preTotalCopyTimes": "1111",
                        "preUv": "1111",
                        "prePv": "1111"
                    },
                    "createTime": "2011-01-11",
                    "lastId": 0,
                    "ip": null
                },
                "msg": "success",
                "dateTime": "2011-11-11 11:11:11"
            }
        } else {
            if (!response.ok) {
                throw new Error('网络响应不正常');
            } else {
                jsonData = await response.json();
            }
        }

        const preDataDto = jsonData.data.preDataDto || {
            preTotalCopyTimes: 0,
            preUv: 0,
            prePv: 0
        };

        const nowDataDto = jsonData.data.nowDataDto || {
            nowTotalCopyTimes: 0,
            nowUv: 0,
            nowPv: 0
        };

        let preTotalCopyTimes = (preDataDto.preTotalCopyTimes || 0) + " / " + (nowDataDto.nowTotalCopyTimes || 0);
        let preUv = (preDataDto.preUv || 0) + " / " + (nowDataDto.nowUv || 0);
        let prePv = (preDataDto.prePv || 0) + " / " + (nowDataDto.nowPv || 0);

        document.getElementById('preCopyCount').textContent = preTotalCopyTimes || 0;
        document.getElementById('preUv').textContent = preUv || 0;
        document.getElementById('prePv').textContent = prePv || 0;

        currentData.total = jsonData.data.total;
        document.getElementById('copyCount').textContent = jsonData.data.totalCopyTimes || 0;
        document.getElementById('uv').textContent = jsonData.data.uv || 0;
        document.getElementById('pv').textContent = jsonData.data.pv || 0;
        renderTable(jsonData);
        updatePagination();
    } catch (error) {
        console.error('获取数据失败:', error);
        if (error.message.includes('Token')) {
            // Token无效时返回登录界面
            localStorage.removeItem('token');
            document.getElementById('authModal').style.display = 'flex';
            document.getElementById('mainContainer').style.display = 'none';
            document.getElementById('tokenError').textContent = error.message;
            document.getElementById('tokenError').style.display = 'block';
        }
    }
}

// 渲染表格
function renderTable(jsonData) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';

    // 更新总条数和页码显示
    document.getElementById('totalCount').textContent = `共 ${jsonData.data.total} 条`;
    document.getElementById('pageInfo').textContent = `第 ${parseInt(document.getElementById('pageInput').value)} 页`;

    // 确保 pageInput.value 是数字（避免字符串问题）
    document.getElementById('pageInput').value = parseInt(document.getElementById('pageInput').value);

    // 渲染表格数据...  
    jsonData.data.data.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
              <td>${index + 1}</td>
              <td>${item.province}</td>
              <td>${item.ip}</td>
              <td>${item.url}</td>
              <td>${item.viewTotal}</td>
              <td>${item.totalCopyTimesByIp}</td>
              <td>${item.nowCopyTimes}</td>
              <td>${formatDate(item.updateTime)}</td>
          `;
        tableBody.appendChild(row);
    });
}
// 更新分页按钮状态
function updatePagination() {
    const firstPageBtn = document.getElementById('firstPage');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const lastPageBtn = document.getElementById('lastPage');

    const totalPages = Math.ceil(currentData.total / currentData.pageSize);
    const currentPage = parseInt(document.getElementById('pageInput').value) || 1;

    firstPageBtn.disabled = currentPage <= 1;
    prevPageBtn.disabled = currentPage <= 1;
    nextPageBtn.disabled = currentPage >= totalPages;
    lastPageBtn.disabled = currentPage >= totalPages;

    if (firstPageBtn.disabled) {
        firstPageBtn.classList.add('disabled');
    } else {
        firstPageBtn.classList.remove('disabled');
    }

    if (prevPageBtn.disabled) {
        prevPageBtn.classList.add('disabled');
    } else {
        prevPageBtn.classList.remove('disabled');
    }

    if (nextPageBtn.disabled) {
        nextPageBtn.classList.add('disabled');
    } else {
        nextPageBtn.classList.remove('disabled');
    }

    if (lastPageBtn.disabled) {
        lastPageBtn.classList.add('disabled');
    } else {
        lastPageBtn.classList.remove('disabled');
    }
}

// 上一页
function prevPage() {
    const currentPage = parseInt(document.getElementById('pageInput').value) || 1;
    if (currentPage > 1) {
        document.getElementById('pageInput').value = currentPage - 1; // 直接减 1
        fetchData();
    }
}

// 下一页
function nextPage() {
    const currentPage = parseInt(document.getElementById('pageInput').value) || 1;
    const totalPages = Math.ceil(currentData.total / currentData.pageSize);
    if (currentPage < totalPages) {
        document.getElementById('pageInput').value = currentPage + 1; // 直接加 1
        fetchData();
    }
}

// 跳转到指定页
function goToPage(page) {
    document.getElementById('pageInput').value = page;
    fetchData();
}

// 跳转到最后一页
function goToLastPage() {
    const totalPages = Math.ceil(currentData.total / currentData.pageSize);
    document.getElementById('pageInput').value = totalPages;
    fetchData();
}

// 格式化日期
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString();
}

// 初始化检查Token
window.onload = function () {
    const savedToken = localStorage.getItem('token');
    // console.log(savedToken);
    if (savedToken && savedToken.length >= 16) {
        // 直接显示主界面，但首次请求时会验证Token有效性
        document.getElementById('authModal').style.display = 'none';
        document.getElementById('mainContainer').style.display = 'block';
        // 设置当前日期为今天
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        document.getElementById('createTime').value = formattedDate;
        fetchData();
    } else {
        window.location.href = "https://mzamusement.cn";
    }
};


/**
 * 计算数值百分比
 * @param {number} newValue - 新值
 * @param {number} oldValue - 旧值
 * @param {object} [options] - 选项
 * @param {number} [options.precision=2] - 保留小数位数，默认为2
 * @returns {string} 百分比字符串
 */
function calculateGrowthPercentage(oldValue, newValue, options = {}) {
    // 设置默认选项
    const { precision = 2 } = options;

    // 检查除数是否为0
    if (oldValue === 0) {
        return '0%'; // 或者其他你认为合适的处理方式，比如返回'∞%'或'--%'
    }

    // 计算百分比
    const percentage = ((newValue - oldValue) / oldValue) * 100;

    // 四舍五入到指定小数位数
    const roundedPercentage = percentage.toFixed(precision);

    return `${roundedPercentage}%`;
}