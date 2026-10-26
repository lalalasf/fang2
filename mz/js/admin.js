// 管理页面逻辑

// 管理员验证
function checkAdmin() {
  // 从localStorage获取管理员令牌
  const adminToken = localStorage.getItem('adminToken');
  
  // 简单的令牌验证（实际项目中应该使用更安全的验证方式）
  if (!adminToken || adminToken !== 'admin123') {
    // 显示登录表单
    document.getElementById('adminContent').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
    return false;
  } else {
    // 显示管理内容
    document.getElementById('adminContent').style.display = 'block';
    document.getElementById('loginForm').style.display = 'none';
    return true;
  }
}

// 登录功能
function login() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const errorElement = document.getElementById('loginError');
  
  // 简单的登录验证（实际项目中应该使用后端API验证）
  if (username === 'admin' && password === 'admin123') {
    // 存储管理员令牌
    localStorage.setItem('adminToken', 'admin123');
    // 重新检查管理员状态
    checkAdmin();
    errorElement.textContent = '';
  } else {
    // 显示错误信息
    errorElement.textContent = '用户名或密码错误';
  }
}

// 登出功能
function logout() {
  // 移除管理员令牌
  localStorage.removeItem('adminToken');
  // 重新检查管理员状态
  checkAdmin();
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

// 页面加载时检查管理员状态
window.addEventListener('DOMContentLoaded', function() {
  checkAdmin();
});
