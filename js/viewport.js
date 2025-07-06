const token = localStorage.getItem("token");
const apiUrl = 'http://localhost/api/ip/queryByPage';
let currentPage = 1;
const pageSize = 10;

// console.log(token)

async function fetchData(page = 1) {
  try {
    currentPage = page;
    const start = (page - 1) * pageSize;

    const urlWithParams = new URL(apiUrl);
    urlWithParams.searchParams.append('start', start);
    urlWithParams.searchParams.append('pageSize', pageSize);

    const response = await fetch(urlWithParams, {
      method: 'GET',
      headers: {
        'Authorization': `${token}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    // console.log(data.data.data)
    renderData(data.data);
    renderPagination(data.data.total);
  } catch (error) {
    console.error('Fetch error:', error);
    alert('无法获取数据，请检查控制台获取详细信息');
  }
}

function renderData(data) {
  const dataTable = document.getElementById('data-table');
  // 清空并添加表头
  dataTable.innerHTML = `
        <tr>
            <th>IP</th>
            <th>Address</th>
            <th>Province</th>
            <th>City</th>
            <th>Times</th>
            <th>Update Time</th>
        </tr>
    `;

  // 添加数据行
  data.data.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
            <td>${item.ip}</td>
            <td>${item.address}</td>
            <td>${item.province}</td>
            <td>${item.city}</td>
            <td>${item.times}</td>
            <td>${new Date(item.updateTime).toLocaleString()}</td>
        `;
    dataTable.appendChild(row);
  });
}

function renderPagination(totalItems) {
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginationDiv = document.getElementById('pagination');

  paginationDiv.innerHTML = '';

  // 上一页按钮
  const prevButton = document.createElement('button');
  prevButton.textContent = '上一页';
  prevButton.disabled = currentPage === 1;
  prevButton.addEventListener('click', () => fetchData(currentPage - 1));
  paginationDiv.appendChild(prevButton);

  // 页码显示
  const pageInfo = document.createElement('span');
  pageInfo.textContent = ` 第 ${currentPage} 页 / 共 ${totalPages} 页 `;
  paginationDiv.appendChild(pageInfo);

  // 下一页按钮
  const nextButton = document.createElement('button');
  nextButton.textContent = '下一页';
  nextButton.disabled = currentPage >= totalPages;
  nextButton.addEventListener('click', () => fetchData(currentPage + 1));
  paginationDiv.appendChild(nextButton);
}

// 初始化加载数据
document.addEventListener('DOMContentLoaded', () => {
  fetchData(1);
});