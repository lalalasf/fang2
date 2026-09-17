// update.js
function sendPostRequestExport(status, content, token, responseDiv) {

  // 请求参数
  const requestData = {
    context: content,
    token: token,
    status: status
  };

  // API 端点
  const apiUrl = ServerConfig.get('baseUrl');
  const api_url = apiUrl + "/fang3/a/update";

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
        throw new Error(` 状态码: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      localStorage.setItem("token", token);
      if (data.code === "200") {
        if (responseDiv !== null) {
          responseDiv.innerHTML = `<p style='color:green'>更新成功！${data.dateTime}</p>`;
        }
      } else {
        if (responseDiv !== null) {
          responseDiv.innerHTML = `<p style='color:green'>更新失败！` + `<p style='color:red'>${data.code} ${data.msg}</p>` + `更新失败</p>`;
        }
      }
      return;
    })
    .catch(error => {
      if (responseDiv !== null) {
        responseDiv.innerHTML = `<p style='color:red'>更新失败: ${error.message}</p>`;
      }
      console.error('Error:', error);
    });
}

const context = "1. 当期祝福语正在准备中……\n" +
  "3. -\n" +
  "2. mzamusement.cn\n" +
  "4. -\n" +
  "5. -\n" +
  "6. -\n" +
  "7. -\n" +
  "8. -\n" +
  "9. -\n" +
  "10. -\n" +
  "11. -\n" +
  "12. -\n" +
  "13. -\n" +
  "14. -\n" +
  "15. -\n" +
  "16. -\n" +
  "17. -\n" +
  "18. -\n" +
  "19. -\n" +
  "20. -\n" +
  "21. -\n" +
  "22. -\n" +
  "23. -\n" +
  "24. -\n" +
  "25. -\n" +
  "26. -\n" +
  "27. -\n" +
  "28. -\n" +
  "29. -\n" +
  "30. -\n" +
  "31. -\n" +
  "32. -\n" +
  "33. -\n" +
  "34. -\n" +
  "35. -\n" +
  "36. -\n" +
  "37. -\n" +
  "38. -\n" +
  "39. -\n" +
  "40. -\n" +
  "41. -\n" +
  "42. -\n" +
  "43. -\n" +
  "44. -\n" +
  "45. -\n" +
  "46. -\n" +
  "47. -\n" +
  "48. -\n" +
  "49. -\n" +
  "50. -\n" +
  "51. 当期祝福语正在准备中……\n" +
  "52.mzamusement.cn\n" +
  "53. -\n" +
  "54. -\n" +
  "55. -\n" +
  "56. -\n" +
  "57. -\n" +
  "58. -\n" +
  "59. -\n" +
  "60. -\n" +
  "61. -\n" +
  "62. -\n" +
  "63. -\n" +
  "64. -\n" +
  "65. -\n" +
  "66. -\n" +
  "66. -\n" +
  "67. -\n" +
  "68. -\n" +
  "69. -\n" +
  "70. -\n" +
  "71. -\n" +
  "72. -\n" +
  "73. -\n" +
  "74. -\n" +
  "75. -\n" +
  "76. -\n" +
  "77. -\n" +
  "78. -\n" +
  "79. -\n" +
  "80. -\n" +
  "81. -\n" +
  "82. -\n" +
  "83. -\n" +
  "84. -\n" +
  "85. -\n" +
  "86. -\n" +
  "87. -\n" +
  "88. -\n" +
  "89. -\n" +
  "90. -\n" +
  "91. -\n" +
  "92. -\n" +
  "93. -\n" +
  "94. -\n" +
  "95. -\n" +
  "96. -\n" +
  "97. -\n" +
  "98. -\n" +
  "99. -\n" +
  "100. -\n";

const noticeInit =
  "102. -\n" +
  "103. -\n" +
  "104. -\n" +
  "105. -\n" +
  "106. -\n" +
  "107. -\n" +
  "108. -\n" +
  "109. -\n" +
  "110. -\n" +
  "111. -\n" +
  "112. -\n" +
  "113. -\n" +
  "114. -\n" +
  "115. -\n" +
  "116. -\n" +
  "117. -\n" +
  "118. -\n" +
  "119. -\n" +
  "120. -\n" +
  "121. -\n" +
  "122. -\n" +
  "123. -\n" +
  "124. -\n" +
  "125. -\n" +
  "126. -\n" +
  "127. -\n" +
  "128. -\n" +
  "129. -\n" +
  "130. -\n" +
  "131. -\n" +
  "132. -\n" +
  "133. -\n" +
  "134. -\n" +
  "135. -\n" +
  "136. -\n" +
  "137. -\n" +
  "138. -\n" +
  "139. -\n" +
  "140. -\n" +
  "141. -\n" +
  "142. -\n" +
  "143. -\n" +
  "144. -\n" +
  "145. -\n" +
  "146. -\n" +
  "147. -\n" +
  "148. -\n" +
  "149. -\n" +
  "150. -\n";

document.getElementById('sendButton').addEventListener('click', () => sendPostRequest(0));
document.getElementById('sendButtonTest').addEventListener('click', () => sendPostRequest(1));
document.getElementById('initDataButton').addEventListener('click', () => sendPostRequest(2));
document.getElementById('initDataButtonTest').addEventListener('click', () => sendPostRequest(3));
document.getElementById('noticeButton').addEventListener('click', () => sendPostRequest(4));
document.getElementById('noticeButtonInit').addEventListener('click', () => sendPostRequest(5));

document.getElementById('clearButton').addEventListener('click', () => {
  document.getElementById('contentInput').value = '';
});

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("tokenInput").value = localStorage.getItem("token");
});

function sendPostRequest(type) {

  var content = document.getElementById('contentInput').value.trim();
  const token = document.getElementById('tokenInput').value.trim();
  const responseDiv = document.getElementById('response');

  if (type === 2 || type === 3) {
    if (!confirm("确定初始化数据？")) {
      return;
    }
    content = context;
  } else if (type === 5) {
    if (!confirm("确定初始化公告数据？")) {
      return;
    }
    content = noticeInit;
  }

  if (!content) {
    responseDiv.innerHTML = "<p style='color:red'>请输入内容</p>";
    return;
  }

  if (!token) {
    responseDiv.innerHTML = "<p style='color:red'>请输入token</p>";
    return;
  }

  // status 0:实际更新， 1测试更新,  2:初始化, 3:初始化测试, 4:公告更新, 5:公告测试
  var status;
  if (type === 0 || type === 2 || type === 4 || type === 5) {
    status = 0;
  } else if (type === 1 || type === 3) {
    status = 1;
  }
  sendPostRequestExport(status, content, token, responseDiv);
}