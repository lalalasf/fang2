let currentData = {
    page: 1,
    pageSize: 10,
    total: 0
};

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
        const page = parseInt(document.getElementById('pageInput').value) || 1;
        const pageSize = parseInt(document.getElementById('pageSizeInput').value) || 10;
        // 获取当前日期
        const localDate = document.getElementById('createTime');
        const createTimeInput = localDate.value;
        // if (localDate.validationMessage.length > 0) {

        //   console.log(createTimeInput)
        // }
        // 更新当前页码（确保是数字）
        currentData.page = page;
        currentData.pageSize = pageSize;

        const apiUrl = ServerConfig.get('baseUrl');
        console.log("URL:",apiUrl);

        let url = apiUrl + `/api/ip/url?page=${page}&pageSize=${pageSize}`;
        if (createTimeInput) {
            url += `&createTime=${encodeURIComponent(createTimeInput)}`;
        }

        const response = await fetch(url, {
            headers: {
                'Authorization': localStorage.getItem('token') || ''
            }
        });

        // 检查Token是否有效
        if (response.status === 401) {
            throw new Error('Token无效或已过期');
        }

        if (!response.ok) {
            throw new Error('网络响应不正常');
        }

        const jsonData = await response.json();
        currentData.total = jsonData.data.total;
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
              <td>${item.ip}</td>
              <td>${item.url}</td>
              <td>${item.times}</td>
              <td>${formatDate(item.updateTime)}</td>
              <td>${formatDate(item.createTime)}</td>
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
    console.log(savedToken);
    if (savedToken && savedToken.length >= 16) {
        // 直接显示主界面，但首次请求时会验证Token有效性
        document.getElementById('authModal').style.display = 'none';
        document.getElementById('mainContainer').style.display = 'block';
        fetchData();
    } else {
        window.location.href = "https://mzamusement.cn";
    }
};