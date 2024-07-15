/*组件的封装*/
/**
 * @tatol 封装弹窗组件
 * @status 状态 1！ 0√
 * @text string 提示文本
 * @timer number 提示框显示时间
 */
tatol = function(status, text, timer = 1) {
  let tatol = document.createElement("div");
  tatol.className = 'tatol';
  let html = `
              <div class="infoText">${text}</div>
          `;
  tatol.innerHTML = html;
  document.querySelector("body").appendChild(tatol);
  setTimeout(function() {
    tatol.remove();
  }, timer * 1000)
}

//原生js实现复制内容到剪切板，兼容pc、移动端（支持Safari浏览器）
function copyTxt(number, text) {

  // 参数1   0：√  1：！
  // 参数2   提示信息
  // 参数3   显示的秒数，结束自动隐藏
  if (typeof document.execCommand !== "function") {
    alert("复制失败，请长按复制");
    return;
  }
  var dom = document.createElement("textarea");
  dom.value = text;
  dom.setAttribute('style', 'display: block;width: 1px;height: 1px;');
  document.body.appendChild(dom);
  dom.select();
  var result = document.execCommand('copy');
  document.body.removeChild(dom);
  if (result) {
    tatol(0, "已复制第：" + number + " 条", 1);
    // alert("复制成功");
    return;
  }
  if (typeof document.createRange !== "function") {
    alert("复制失败，请长按复制");
    return;
  }
  var range = document.createRange();
  var div = document.createElement('div');
  div.innerHTML = text;
  div.setAttribute('style', 'height: 1px;fontSize: 1px;overflow: hidden;');
  document.body.appendChild(div);
  range.selectNode(div);
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    selection.removeAllRanges();
  }
  selection.addRange(range);
  document.execCommand('copy');

  tatol(0, "已复制第：" + number + " 条", 1);
  // alert("复制成功")
}

// 祝福语编号
function zhuzhi(event) {
  var text = event.target.innerText;
  var innerHTML = event.target.innerHTML;
  var number = "";
  for (var i = 0; i < innerHTML.length; ++i) {
    if (innerHTML[i] == ',') break;
    if (innerHTML[i] >= "0" && innerHTML[i] <= "9") {
      number += innerHTML[i];
    }
  }
  // console.log(event);
  // console.log(number)
  copyTxt(number, text)
}

// 只可点击一次
function _clickRequest() {
  document.getElementById("getRequest").disabled = true;
  appLoad();
}

// 获取祝福语数据
function appLoad() {
  //1.创建对象
  const xhr = new XMLHttpRequest()
  //2.初始化 设置请求方法和url
  var test_url = "http://127.0.0.1:9111";
  var dev_url = "http://yu5te4.natappfree.cc";
  xhr.open("GET", test_url + "/fang3/zfy");
  xhr.send()
  //4.事件绑定 处理服务端返回的结果 
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      if (xhr.status == 200) {
        /**
         * 获取祝福语数据
         * 可以写死为json数据，祝福语编号为 id，内容为 contet
         */
        var data = JSON.parse(xhr.response);
        data = data.data;
        var i;
        var html = ''; //用一个变量来存储json中的数据
        for (i = 0; i < data.length; i++) { //用for循环遍历数组将数据存入html变量中
          html += `<tr class="line_data">
                            <td>${data[i].id}</td>
                            <td><button class="btnn" onclick="zhuzhi(event)"><font style="display:none">${data[i].id},</font>${data[i].context}</button></td>
                        </tr>`;
        }
        // console.log(html)
        document.getElementById("box").innerHTML += html;
        // result.innerHTML = data; //把响应结果给div盒子
      } else {
        alert("请求异常")
      }
    }
  }
}