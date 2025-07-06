document.getElementById('sendButton').addEventListener('click', sendPostRequest);

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("tokenInput").value = localStorage.getItem("token");
});

function sendPostRequest() {
  const content = document.getElementById('contentInput').value.trim();
  const token = document.getElementById('tokenInput').value.trim();
  const responseDiv = document.getElementById('response');

  console.log(token);

  if (!content) {
    responseDiv.innerHTML = "<p style='color:red'>请输入内容</p>";
    return;
  }

  if (!token) {
    responseDiv.innerHTML = "<p style='color:red'>请输入token</p>";
    return;
  }

  // 请求参数
  const requestData = {
    context: content,
    token: token
  };

  // API 端点
  const apiUrl = ServerConfig.get('baseUrl');
  console.log("URL:", apiUrl);
  const api_url = apiUrl + "/fang3/a/update";

  console.log(JSON.stringify(requestData));

  fetch(api_url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestData)
  })
    .then(response => {
      // console.log(response)
      if (!response.ok) {
        throw new Error(`HTTP 错误！状态码: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      localStorage.setItem("token", token);
      responseDiv.innerHTML = `<p style='color:green'>请求成功！</p><pre>${JSON.stringify(data, null, 2)}</pre>`;
    })
    .catch(error => {
      responseDiv.innerHTML = `<p style='color:red'>请求失败: ${error.message}</p>`;
      console.error('Error:', error);
    });

}