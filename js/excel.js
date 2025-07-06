// API 端点配置
const API_BASE_URL = "http://127.0.0.1:9111";
let authToken = localStorage.getItem('excelManagerToken') || null;

// 页面加载完成后显示弹窗（如果没有token）
document.addEventListener('DOMContentLoaded', function() {
  const modal = document.getElementById('tokenModal');
  const tokenInput = document.getElementById('tokenInput');
  const submitBtn = document.getElementById('submitToken');
  const tokenStatus = document.getElementById('tokenStatus');
  const closeBtn = document.querySelector('.close');

  // 如果没有token，显示弹窗
  if (!authToken) {
    modal.style.display = 'block';
  } else {
    // 如果有token，验证它是否仍然有效
    verifyToken(authToken).then(isValid => {
      if (!isValid) {
        modal.style.display = 'block';
        authToken = null;
        localStorage.removeItem('excelManagerToken');
      } else {
        loadFileList();
      }
    });
  }

  // 关闭弹窗
  closeBtn.onclick = function() {
    modal.style.display = 'none';
  }

  // 提交token
  submitBtn.onclick = async function() {
    const token = tokenInput.value.trim();
    if (!token) {
      tokenStatus.textContent = 'Please enter a token';
      tokenStatus.className = 'error';
      return;
    }

    try {
      tokenStatus.textContent = 'Verifying token...';
      tokenStatus.className = '';

      const isValid = await verifyToken(token);
      if (isValid) {
        authToken = token;
        localStorage.setItem('excelManagerToken', token);
        modal.style.display = 'none';
        loadFileList();
      } else {
        tokenStatus.textContent = 'Invalid token';
        tokenStatus.className = 'error';
      }
    } catch (error) {
      tokenStatus.textContent = 'Error verifying token';
      tokenStatus.className = 'error';
      console.error('Token verification error:', error);
    }
  }

  // 点击弹窗外部关闭弹窗
  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = 'none';
    }
  }
});

// 验证token是否有效
async function verifyToken(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return response.ok;
  } catch (error) {
    console.error('Token verification failed:', error);
    return false;
  }
}

// 通用的带Token的fetch请求
async function fetchWithToken(url, options = {}) {
  if (!authToken) {
    throw new Error('No authentication token available');
  }

  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${authToken}`
  };

  return fetch(url, {
    ...options,
    headers
  });
}

// 上传表单处理
document.getElementById('uploadForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  if (!authToken) {
    document.getElementById('uploadStatus').textContent = 'Please authenticate first';
    document.getElementById('uploadStatus').className = 'error';
    document.getElementById('tokenModal').style.display = 'block';
    return;
  }

  const fileInput = document.getElementById('fileInput');
  const uploadStatus = document.getElementById('uploadStatus');

  if (!fileInput.files.length) {
    uploadStatus.textContent = 'Please select a file first.';
    uploadStatus.className = 'error';
    return;
  }

  const formData = new FormData();
  formData.append('file', fileInput.files[0]);

  try {
    uploadStatus.textContent = 'Uploading...';
    uploadStatus.className = '';

    const response = await fetchWithToken(`${API_BASE_URL}/api/excel/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    uploadStatus.textContent = `Upload successful: ${result.message || 'File uploaded'}`;

    // 刷新文件列表
    loadFileList();

    // 清空文件输入
    fileInput.value = '';
  } catch (error) {
    uploadStatus.textContent = `Error: ${error.message}`;
    uploadStatus.className = 'error';
    console.error('Upload error:', error);
  }
});

// 加载文件列表
async function loadFileList() {
  const ul = document.getElementById('fileList');

  if (!authToken) {
    ul.innerHTML = '<li>Please authenticate to view files</li>';
    return;
  }

  try {
    ul.innerHTML = '<li>Loading...</li>';

    const response = await fetchWithToken(`${API_BASE_URL}/api/excel/list`);

    if (!response.ok) {
      throw new Error('Failed to load file list');
    }

    const data = await response.json();

    if (data.length === 0) {
      ul.innerHTML = '<li>No files uploaded yet</li>';
      return;
    }

    ul.innerHTML = '';
    data.forEach(filename => {
      const li = document.createElement('li');
      li.textContent = filename;

      const downloadLink = document.createElement('a');
      downloadLink.href = `${API_BASE_URL}/api/excel/download/${filename}`;
      downloadLink.textContent = 'Download';
      downloadLink.className = 'download-btn';

      // 为下载链接添加点击事件处理，以便添加Token
      downloadLink.addEventListener('click', async (e) => {
        e.preventDefault();
        if (!authToken) {
          alert('Please authenticate first');
          document.getElementById('tokenModal').style.display = 'block';
          return;
        }

        // 创建临时表单提交下载请求
        const form = document.createElement('form');
        form.method = 'GET';
        form.action = downloadLink.href;

        const tokenInput = document.createElement('input');
        tokenInput.type = 'hidden';
        tokenInput.name = 'token';
        tokenInput.value = authToken;

        form.appendChild(tokenInput);
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
      });

      li.appendChild(downloadLink);
      ul.appendChild(li);
    });
  } catch (error) {
    ul.innerHTML = '<li class="error">Error loading file list</li>';
    console.error('Error loading file list:', error);

    // 如果token无效，清除本地存储的token并显示认证弹窗
    if (error.message.includes('401')) {
      authToken = null;
      localStorage.removeItem('excelManagerToken');
      document.getElementById('tokenModal').style.display = 'block';
    }
  }
}