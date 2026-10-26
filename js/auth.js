document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("tokenInput").value = localStorage.getItem("token");
});

document.addEventListener('DOMContentLoaded', function() {
    const getCookieBtn = document.getElementById('getCookieBtn');
    const tokenInput = document.getElementById('tokenInput');
    const resultDiv = document.getElementById('result');

    getCookieBtn.addEventListener('click', async function() {
        
        var token = tokenInput.value.trim();
        
        if (!token) {
            showResult('请输入Token', 'error');
            return;
        }

        try {
            showResult('正在获取Cookie...', 'info');
            
            const apiUrl = ServerConfig.get('baseUrl');
            const url = apiUrl + '/api/ip/login';
            
            const response = await fetch(url, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // 检查响应数据
            if (data.code === '200') {
                localStorage.setItem("token", token);
                showResult('获取Cookie成功！', 'success');
                // 存储cookie数据
                if (data.data && typeof data.data === 'object') {
                   
                    showResult('Cookie已存储到浏览器！', 'success');
                }
                console.log('Response data:', data);
            } else {
                showResult(`获取失败: ${data.msg || '未知错误'}`, 'error');
            }
        } catch (error) {
            showResult(`错误: ${error.message}`, 'error');
            console.error('Error:', error);
        }
    });

    function showResult(message, type) {
        resultDiv.textContent = message;
        resultDiv.className = `result ${type}`;
    }
});