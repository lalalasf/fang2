/* auto.js */
// 全局变量
let blessingData = [];
let originalBlessingData = [];
let currentIndex = 0;
let isRequesting = false;
let isFocus = false;
const apiUrl = ServerConfig.get('baseUrl');
const DATA_EXPIRY_TIME = 10 * 1000; // 过期时间

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

    fetch(`${apiUrl}/fang3/zfy`, {
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
            blessingData = res.data || [];
            originalBlessingData = [...blessingData];
            localStorage.setItem('blessingData', JSON.stringify(blessingData));
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
    if (blessingData.length === 0) {
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

    const targetIndex = blessingData.findIndex(item => item.id === inputId);
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
    if (blessingData.length === 0) return;
    if (blessingData[currentIndex].context.trim().length <= 2) {
        // console.log(`删除编号${blessingData[currentIndex].id}的祝福语`+`长度为${blessingData[currentIndex].context.length}`);
        blessingData.splice(currentIndex, 1);

        if (blessingData.length === 0) {
            setupUI();
            return;
        }

        if (currentIndex >= blessingData.length) {
            currentIndex = blessingData.length - 1;
        }

        updateDisplay();
        return;
    }

    blessingTextEl.textContent = blessingData[currentIndex].context;
    idDisplayEl.textContent = `当前编号: ${blessingData[currentIndex].id}`;
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === blessingData.length - 1;
}


/**
 * 复制当前祝福语到剪贴板，并如果不是最后一条祝福语，显示下一条祝福语
 * @returns {undefined}
 */
function copyAndNext() {
    // 如果祝福语数据为空，则直接返回
    if (blessingData.length === 0) return;

    const textToCopy = blessingData[currentIndex].context;
    const textCode = blessingData[currentIndex].id;

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

            if (currentIndex < blessingData.length - 1) {
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
    if (currentIndex < blessingData.length - 1) {
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
        if (originalBlessingData.length > 0) {
            blessingData = [...originalBlessingData];
            currentIndex = Math.min(currentIndex, blessingData.length - 1);
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

    if (originalBlessingData.length === 0) {
        originalBlessingData = [...blessingData];
    }

    blessingData = originalBlessingData.filter(item => !excludeIds.has(item.id));

    if (currentIndex >= blessingData.length) {
        currentIndex = Math.max(0, blessingData.length - 1);
    }

    updateDisplay();
    showToast(`已排除 ${originalBlessingData.length - blessingData.length} 条数据`, 'success');
}

// 检查本地存储的数据是否有效
function checkLocalData() {
    const savedData = localStorage.getItem('blessingData');
    const savedTime = localStorage.getItem('blessingDataTime');

    if (savedData && savedTime) {
        const currentTime = new Date().getTime();
        const timeDiff = currentTime - parseInt(savedTime);

        if (timeDiff < DATA_EXPIRY_TIME) {
            // 数据未过期，使用本地数据
            try {
                blessingData = JSON.parse(savedData);
                setupUI();
                return true;
            } catch (e) {
                console.error('解析本地数据失败', e);
                localStorage.removeItem('blessingData');
                localStorage.removeItem('blessingDataTime');
            }
        } else {
            // 数据已过期，清除
            localStorage.removeItem('blessingData');
            localStorage.removeItem('blessingDataTime');
        }
    }
    return false;
}
