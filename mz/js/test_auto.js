/* test_auto.js */
// 全局变量
let blessingDataT = [];
let originalblessingDataT = [];
let currentIndex = 0;
let isRequesting = false;
let isFocus = false;
const apiUrl = ServerConfig.get('baseUrl');
const DATA_EXPIRY_TIME_T = 5 * 1000; // 

// DOM元素
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const contentEl = document.getElementById('content');
const blessingTextEl = document.getElementById('blessingText');
const idDisplayEl = document.getElementById('idDisplay');
const displayBoxEl = document.getElementById('displayBox');
const copyMessageEl = document.getElementById('copyMessage');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const jumpInput = document.getElementById('jumpInput');
const jumpBtn = document.getElementById('jumpBtn');
const excludeInput = document.getElementById('excludeInput');
const toastEl = document.createElement('div');


toastEl.className = 'toast-message';
document.body.appendChild(toastEl);



// 初始化
document.addEventListener('DOMContentLoaded', init);

function init() {
    // 直接从API获取数据，不使用任何存储
    fetchData();
}

function fetchData() {
    // 防止重复请求
    if (isRequesting) {
        return;
    }

    // 检查本地存储
    if (checkLocalData()) {
        return;
    }

    isRequesting = true;
    loadingEl.textContent = `正在加载数据...`;
    loadingEl.style.display = 'block';
    contentEl.style.display = 'none';

    fetch(`${apiUrl}/fang3/t_zfy`, {
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
            blessingDataT = res.data || [];
            originalblessingDataT = [...blessingDataT];
            localStorage.setItem('blessingDataT', JSON.stringify(blessingDataT));
            localStorage.setItem('blessingDataTime', Date.now().toString());
            setupUI();
            isRequesting = false;
        })
        .catch(error => {
            console.error("请求失败:", error);
            loadingEl.style.display = 'none';
            errorEl.textContent = `请求失败: ${error.message}`;
            errorEl.style.display = 'block';
            isRequesting = false;
        });
}

function setupUI() {
    if (blessingDataT.length === 0) {
        loadingEl.style.display = 'none';
        errorEl.textContent = '没有可用的祝福语数据，请稍后刷新';
        errorEl.style.display = 'block';
        return;
    }

    errorEl.textContent = '';
    loadingEl.style.display = 'none';
    contentEl.style.display = 'block';

    updateDisplay();

    displayBoxEl.addEventListener('click', copyAndNext);
    prevBtn.addEventListener('click', showPrevious);
    nextBtn.addEventListener('click', showNext);

    jumpInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
        if (e.target.value.length > 0) {
            const inputId = parseInt(e.target.value);
            jumpToId(inputId);
        }
    });

    excludeInput.addEventListener('blur', applyExclusions);
    excludeInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            applyExclusions();
            excludeInput.blur();
        }
    });

    displayBoxEl.style.userSelect = 'none';
    displayBoxEl.style.cursor = 'pointer';
    blessingTextEl.contentEditable = false;
    if (document.activeElement !== jumpInput) {
        jumpInput.value = '';
    }
}

function jumpToId(inputId) {
    if (isNaN(inputId)) return;

    const targetIndex = blessingDataT.findIndex(item => item.id === inputId);
    if (targetIndex !== -1) {
        currentIndex = targetIndex;
        updateDisplay();
        showToast(`已跳转到编号: ${inputId}`, 'success');
    } else {
        showToast(`未找到编号为${inputId}的数据`, 'error');
    }
}

jumpInput.addEventListener('blur', function () {
    jumpInput.value = '';
});

function updateDisplay() {
    if (blessingDataT.length === 0) return;
    if (blessingDataT[currentIndex].context.trim().length <= 2) {
        // console.log(`删除编号${blessingDataT[currentIndex].id}的祝福语`+`长度为${blessingDataT[currentIndex].context.length}`);
        blessingDataT.splice(currentIndex, 1);

        if (blessingDataT.length === 0) {
            setupUI();
            return;
        }

        if (currentIndex >= blessingDataT.length) {
            currentIndex = blessingDataT.length - 1;
        }

        updateDisplay();
        return;
    }

    blessingTextEl.textContent = blessingDataT[currentIndex].context;
    idDisplayEl.textContent = `当前编号: ${blessingDataT[currentIndex].id}`;
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === blessingDataT.length - 1;
}


/**
 * 复制当前祝福语到剪贴板，并如果不是最后一条祝福语，显示下一条祝福语
 * @returns {undefined}
 */
function copyAndNext() {
    // 如果祝福语数据为空，则直接返回
    if (blessingDataT.length === 0) return;

    const textToCopy = blessingDataT[currentIndex].context;
    const textCode = blessingDataT[currentIndex].id;

    // 封装复制操作
    const copyText = async (text) => {
        // 方案1: 尝试使用现代 Clipboard API
        if (navigator.clipboard && window.isSecureContext) {
            try {
                await navigator.clipboard.writeText(text);
                console.log('复制成功 (Clipboard API)');
                return true;
            } catch (err) {
                console.warn('Clipboard API 失败，降级到传统方法:', err);
                // 方案2: 降级到传统的 document.execCommand 方法
                try {

                    // 创建一个临时的 textarea 元素
                    const textArea = document.createElement('textarea');
                    textArea.value = text;
                    // 关键修复：添加readonly属性防止键盘弹出
                    textArea.setAttribute('readonly', 'true');
                    textArea.style.position = 'fixed';
                    textArea.style.top = '0';
                    textArea.style.left = '0';
                    textArea.style.width = '1px';
                    textArea.style.height = '1px';
                    textArea.style.padding = '0';
                    textArea.style.border = 'none';
                    textArea.style.outline = 'none';
                    textArea.style.opacity = '0';
                    textArea.style.pointerEvents = 'none';

                    document.body.appendChild(textArea);

                    // 选择文本 (兼容iOS有时无法选中contenteditable或input的问题)
                    textArea.focus();
                    textArea.select();
                    textArea.setSelectionRange(0, 99999); // 对于移动设备的额外支持

                    const successful = document.execCommand('copy');
                    document.body.removeChild(textArea); // 清理DOM

                    if (successful) {
                        console.log('复制成功 (传统方法)');
                        return true;
                    } else {
                        throw new Error('execCommand 返回失败');
                    }
                } catch (err) {
                    console.error('传统复制方法也失败了:', err);
                    alert('请更换浏览器或使用手动复制');
                    // 方案3: 如果全部失败，提示用户手动复制
                    return false;
                }
            }
        }
    };

    // 执行复制
    copyText(textToCopy).then(success => {
        if (success) {
            // 复制成功后的UI反馈
            displayBoxEl.classList.add('copied');
            copyMessageEl.classList.add('show');

            // 发送日志（无论成功失败都尝试）
            try {
                fetch(`${apiUrl}/fang3/copy?code=${textCode}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': localStorage.getItem('token') || '',
                        'Content-Type': 'application/json',
                    },
                });
            } catch (e) {
                console.error("日志发送失败:", e);
            }

            setTimeout(() => {
                displayBoxEl.classList.remove('copied');
                copyMessageEl.classList.remove('show');
            }, 1000);

            if (currentIndex < blessingDataT.length - 1) {
                currentIndex++;
                updateDisplay();
            }
        }
    });
}


function showPrevious() {
    if (currentIndex > 0) {
        currentIndex--;
        updateDisplay();
    }
}

function showNext() {
    if (currentIndex < blessingDataT.length - 1) {
        currentIndex++;
        updateDisplay();
    }
}

function toShowNext(context_id) {
    currentIndex = context_id;
    updateDisplay();
}

function showToast(message, type = 'info') {
    toastEl.textContent = message;
    toastEl.className = `toast-message toast-${type}`;
    toastEl.style.display = 'block';
    toastEl.style.opacity = '1';

    setTimeout(() => {
        toastEl.style.opacity = '0';
        setTimeout(() => {
            toastEl.style.display = 'none';
        }, 300);
    }, 1000);
}

function applyExclusions() {
    const input = excludeInput.value.trim();

    if (!input) {
        if (originalblessingDataT.length > 0) {
            blessingDataT = [...originalblessingDataT];
            currentIndex = Math.min(currentIndex, blessingDataT.length - 1);
            updateDisplay();
            showToast('已恢复所有被排除的数据', 'success');
        } else {
            showToast('没有可恢复的原始数据', 'warning');
        }
        return;
    }

    const patterns = input.split(/\s+/);
    const excludeIds = new Set();
    let hasInvalidInput = false;
    let errorMessage = '';

    for (const pattern of patterns) {
        if (pattern.includes('-')) {
            const [startStr, endStr] = pattern.split('-');
            const start = Number(startStr);
            const end = Number(endStr);

            if (isNaN(start) || isNaN(end) || start > end) {
                hasInvalidInput = true;
                errorMessage = `无效范围: ${pattern}`;
                break;
            }
            for (let i = start; i <= end; i++) {
                excludeIds.add(i);
            }
        } else {
            const id = Number(pattern);
            if (isNaN(id)) {
                hasInvalidInput = true;
                errorMessage = `无效编号: ${pattern}`;
                break;
            }
            excludeIds.add(id);
        }
    }

    if (hasInvalidInput) {
        showToast(errorMessage, 'error');
        excludeInput.value = '';
        excludeInput.focus();
        return;
    }

    if (originalblessingDataT.length === 0) {
        originalblessingDataT = [...blessingDataT];
    }

    blessingDataT = originalblessingDataT.filter(item => !excludeIds.has(item.id));

    if (currentIndex >= blessingDataT.length) {
        currentIndex = Math.max(0, blessingDataT.length - 1);
    }

    updateDisplay();
    showToast(`已排除 ${originalblessingDataT.length - blessingDataT.length} 条数据`, 'success');
}

// 检查本地存储的数据是否有效
function checkLocalData() {
    const savedData = localStorage.getItem('blessingDataT');
    const savedTime = localStorage.getItem('blessingDataTime');

    if (savedData && savedTime) {
        const currentTime = new Date().getTime();
        const timeDiff = currentTime - parseInt(savedTime);

        if (timeDiff < DATA_EXPIRY_TIME_T) {
            // 数据未过期，使用本地数据
            try {
                blessingDataT = JSON.parse(savedData);
                setupUI();
                return true;
            } catch (e) {
                console.error('解析本地数据失败', e);
                localStorage.removeItem('blessingDataT');
                localStorage.removeItem('blessingDataTime');
            }
        } else {
            // 数据已过期，清除
            localStorage.removeItem('blessingDataT');
            localStorage.removeItem('blessingDataTime');
        }
    }
    return false;
}

function getZfyDataALl() {

    if (blessingDataT.length === 0) {
        showToast('没有数据', 'info', 1000);
        return;
    }
    var text = '';
    for (var i = 0; i < blessingDataT.length; ++i) {
        if (blessingDataT[i].context.trim().length <= 2) continue;
        text += blessingDataT[i].id + ',' + blessingDataT[i].context + '\n';
    }
    try {
        navigator.clipboard.writeText(text);
        showToast('全部复制！', 'success', 1000);
    } catch (err) {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = 0;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        showToast('全部复制！', 'success', 1000);
    }
}

function getZfyDataRange1To50() {
    if (blessingDataT.length === 0) {
        showToast('没有数据', 'info', 1000);
        return;
    }
    var text = '';
    for (var i = 0; i < blessingDataT.length; ++i) {
        if (blessingDataT[i].context.trim().length <= 2) continue;
        if (blessingDataT[i].id >= 1 && blessingDataT[i].id <= 50) {
            text += blessingDataT[i].id + ',' + blessingDataT[i].context + '\n';
        }
    }
    if (text === '') {
        showToast('1-50范围内没有数据', 'info', 1000);
        return;
    }
    try {
        navigator.clipboard.writeText(text);
        showToast('已复制1-50条数据！', 'success', 1000);
    } catch (err) {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = 0;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        showToast('已复制1-50条数据！', 'success', 1000);
    } finally {
        sendPostRequestExport(text);
    }
}

function getZfyDataRange51To100() {
    if (blessingDataT.length === 0) {
        showToast('没有数据', 'info', 1000);
        return;
    }
    var text = '';
    for (var i = 0; i < blessingDataT.length; ++i) {
        if (blessingDataT[i].context.trim().length <= 2) continue;
        if (blessingDataT[i].id >= 51 && blessingDataT[i].id <= 100) {
            text += blessingDataT[i].id + ',' + blessingDataT[i].context + '\n';
        }
    }
    if (text === '') {
        showToast('51-100范围内没有数据', 'info', 1000);
        return;
    }
    try {
        navigator.clipboard.writeText(text);
        showToast('已复制51-100条数据！', 'success', 1000);
    } catch (err) {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = 0;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        showToast('已复制51-100条数据！', 'success', 1000);
    } finally {
        sendPostRequestExport(text);
    }
}

// 获取弹窗容器
const toastContainer = document.getElementById('toastContainer');

// 创建并显示弹窗的函数
function showToast(message, type = 'info', duration = 3000) { // type: 'success', 'error', 'info'; duration: 毫秒
    // 1. 创建弹窗元素
    const toast = document.createElement('div');
    toast.className = `toast ${type}`; // 添加基本类和类型类
    toast.textContent = message;

    // 2. (可选) 添加进度条指示器
    const progressDiv = document.createElement('div');
    progressDiv.className = 'toast-progress';
    toast.appendChild(progressDiv);

    // 3. 将弹窗添加到容器中
    toastContainer.appendChild(toast);

    // 4. 强制浏览器重绘，确保初始样式（opacity: 0, transform: translateY(-20px)）应用后再添加 show 类
    // 这样可以触发动画
    toast.offsetHeight;

    // 5. 添加 'show' 类，触发动画效果
    toast.classList.add('show');

    // 6. 设置定时器，用于自动移除弹窗
    const timer = setTimeout(() => {
        removeToast(toast);
    }, duration);

    // 7. (可选) 添加进度条动画效果 (需要额外的 JS)
    // 启动一个动画循环来更新进度条宽度
    const startTime = Date.now();
    const updateProgress = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / duration) * 100, 100);
        progressDiv.style.width = `${100 - progress}%`; // 从右到左减少宽度

        if (progress < 100) {
            requestAnimationFrame(updateProgress); // 继续动画
        }
    };
    updateProgress(); // 开始动画

    // 8. (可选) 允许用户点击弹窗来提前关闭
    toast.addEventListener('click', () => {
        clearTimeout(timer); // 清除自动移除的定时器
        removeToast(toast);
    });

    // 9. 返回定时器ID，以便外部可以控制 (例如，外部代码可以 clearTimeout(timer))
    return timer;
}

// 移除弹窗的函数
function removeToast(toastElement) {
    // 1. 添加一个类来触发动画（例如，淡出和滑动）
    toastElement.classList.remove('show'); // 移除 'show' 类，触发动画回退

    // 2. 等待动画完成后再真正从DOM中移除
    toastElement.addEventListener('transitionend', function handler() {
        this.removeEventListener('transitionend', handler); // 移除事件监听器，防止内存泄漏
        if (this.parentNode) { // 检查父节点是否存在，以防元素已被移除
            this.parentNode.removeChild(this);
        }
    });
}

function sendPostRequestExport(text) {

    var status = status || 0;
    var content = text;
    var token = localStorage.getItem("token");

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
                showToast('更新成功！', 'success', 1000);

            } else {
                showToast(`更新失败！${data.code} ${data.msg}`, 'error', 1000);
            }
            return;
        })
        .catch(error => {
            showToast(`更新失败: ${error.message}`, 'error', 1000);
            console.error('Error:', error);
        });
}

// 示例：按钮点击事件处理
// document.getElementById('showSuccessBtn').addEventListener('click', () => {
//     showToast('操作成功！', 'success', 2500); // 成功消息，显示2.5秒
// });

// document.getElementById('showErrorBtn').addEventListener('click', () => {
//     showToast('发生了一个错误！', 'error', 3000); // 错误消息，显示3秒
// });

// document.getElementById('showInfoBtn').addEventListener('click', () => {
//     showToast('这是一条提示信息。', 'info', 4000); // 提示消息，显示4秒
// });

// (可选) 如果你想让外部代码也能方便地调用，可以将函数挂载到全局对象
// window.showToast = showToast; // 这样可以在其他地方调用 window.showToast(...)