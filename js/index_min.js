// index_min.js
let allData = [];
let isSingleColumn = true;
const DATA_EXPIRY_TIME = 10 * 1000; // 过期时间
const apiUrl = ServerConfig.get('baseUrl');

// 获取所有数据
function getALlTemplateData() {
    const allData = localStorage.getItem('templateData');
    if (!allData) {
        tatol(1, "暂无本地数据", 1);
        return;
    }

    try {
        const data = JSON.parse(allData);
        // 将 allData 转换为 id.context 的形式，每个数据项占一行
        const text = data.map(item => `@${item.id}.${item.context}`).join('\n');
        copyAllTxt(text);
        tatol(1, "复制成功", 1);
    } catch (error) {
        console.error('解析数据失败', error);
        tatol(1, "数据解析失败", 1);
    }
}
async function copyAllTxt(text) {
    try {
        await navigator.clipboard.writeText(text);
        tatol(0, `复制成功`, 1);
    } catch (err) {
        // 回退到老方法
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = 0;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);

        tatol(0, `复制成功`, 1);
    }

    // 1. 将字符串转为 Uint8Array (UTF-8)
    const utf8Bytes = new TextEncoder().encode(text.replace(/[\n\r]/g, ''));
    // 2. 使用 pako 进行 gzip 压缩
    //    注意：选择 gzip 而不是 deflate，以便 Java 的 GZIPInputStream 能够识别
    // level 1-9，6是默认平衡点
    const compressed = pako.gzip(utf8Bytes, { level: 6 });
    // 3. 为了传输安全（比如放入 JSON 或 URL），通常将二进制转为 Base64
    const base64String = btoa(String.fromCharCode.apply(null, compressed));
    // 4. 发送这个 base64String 到后端
    const encodedCompressed = encodeURIComponent(base64String);
    // console.log("压缩后 Base64 字符串:", encodedCompressed);
    console.log("压缩后 Base64 长度:", encodedCompressed.length);
    try {
        await fetch(`${apiUrl}/fang3/copy?code=999&context=${encodedCompressed}`, {
            method: 'GET',
            headers: {
                'Authorization': localStorage.getItem('token') || '',
                'Content-Type': 'application/json',
            },
        });
    } catch (e) {
        console.error("日志发送失败:", e);
    }
}
// 清空 TemplateData数据
function clearTemplateData() {
    if (confirm('确定要清空所有数据吗？')) {
        localStorage.removeItem('templateData');
        loadData();
    }
}
// 打开 TemplateData 存储弹框
function openTemplateDataModal() {
    document.getElementById('templateDataModal').style.display = 'block';
}

// 关闭 TemplateData 存储弹框
function closeTemplateDataModal() {
    const responseDiv = document.getElementById('templateDataResponse');
    responseDiv.innerHTML = '';
    responseDiv.className = '';
    document.getElementById('templateDataModal').style.display = 'none';
}

// 清空输入框
document.getElementById('clearTemplateDataButton').addEventListener('click', function () {
    document.getElementById('templateDataInput').value = '';
});

// 保存到本地存储
document.getElementById('saveTemplateDataButton').addEventListener('click', function () {
    const input = document.getElementById('templateDataInput').value.trim();
    const responseDiv = document.getElementById('templateDataResponse');

    if (!input) {
        responseDiv.innerHTML = '请输入数据';
        responseDiv.className = 'error';
        return;
    }

    try {
        // 处理用户输入的格式，支持空格、逗号、中文逗号作为分割符，同时移除方括号
        let processedInput = input.trim().replace(/^\[|\]$/g, ''); // 移除首尾的方括号

        // 先将逗号、中文逗号、中文句号、顿号替换为空格，保留点号用于分割id和context
        processedInput = processedInput.replace(/[,，。、]+/g, '.');
        const items = processedInput.split(/\s+/).filter(item => item.trim() !== '');

        // 去重，只保留相同id的第一条记录
        const idSet = new Set();
        const newData = [];

        items.forEach(item => {
            // 匹配 "数字.内容" 格式
            const match = item.match(/^(\d+)\.(.+)$/);
            if (match) {
                const id = match[1];
                const context = match[2].trim();

                // 验证id是否>0
                if (parseInt(id) <= 0) {
                    return; // 跳过id≤0的数据
                }

                // 去重，只保留相同id的第一条记录
                if (!idSet.has(id)) {
                    idSet.add(id);
                    newData.push({ id, context });
                }
            }
        });

        if (newData.length === 0) {
            tatol(0, `未解析到有效数据`, 1);
            throw new Error('未解析到有效数据');
        }

        // 获取现有数据
        let existingData = [];
        const savedData = localStorage.getItem('templateData');
        if (savedData) {
            try {
                existingData = JSON.parse(savedData);
            } catch (e) {
                tatol(0, `解析现有数据失败`, 1);
                console.error('解析现有数据失败', e);
            }
        }

        // 合并数据，替换相同id的记录
        const mergedData = [];
        const existingIdSet = new Set();

        // 先添加新数据
        newData.forEach(item => {
            mergedData.push(item);
            existingIdSet.add(item.id);
        });

        // 再添加现有数据中不冲突的记录
        existingData.forEach(item => {
            if (!existingIdSet.has(item.id)) {
                mergedData.push(item);
            }
        });

        // 按id大小升序排序
        mergedData.sort((a, b) => parseInt(a.id) - parseInt(b.id));

        localStorage.setItem('templateData', JSON.stringify(mergedData));
        responseDiv.innerHTML = `数据保存成功！共解析 ${newData.length} 条数据，合并后共 ${mergedData.length} 条数据`;
        responseDiv.className = 'success';
        tatol(0, "数据保存成功", 1);
        loadData();

    } catch (error) {
        responseDiv.innerHTML = '数据格式错误，请输入有效的格式，如 "1.xxxx 2.xxxx 3.xxxx"';
        responseDiv.className = 'error';
        tatol(1, "数据格式错误", 1);
    }
});

// 点击弹框外部关闭
window.addEventListener('click', function (event) {
    const modal = document.getElementById('templateDataModal');
    if (event.target === modal) {
        closeTemplateDataModal();
    }
});

/**
 * 提示组件 - 显示通知消息
 * @param {number} status - 状态码（0表示成功，1表示失败）
 * @param {string} text - 提示文本
}
*/
function tatol(status, text, timer = 1) {
    const toast = document.createElement("div");
    toast.className = "tatol";
    toast.innerHTML = `<div class="tatol-text">${text}</div>`;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add("tatol-show");
    });

    setTimeout(() => {
        toast.classList.remove("tatol-show");
        setTimeout(() => toast.remove(), 300);
    }, timer * 1000);
}


/**
 * 复制文本到剪贴板
 * @param {number} number - 数据项的ID
 * @param {string} text - 要复制的文本内容
 * @returns {Promise<void>} - 返回一个Promise，表示复制操作的完成状态
 * @description 首先尝试使用现代的 Clipboard API，如果失败则回退到传统的 textarea 方法
 *              复制成功后会显示提示信息，并发送复制日志到服务器
 */
async function copyTxt(number, text) {
    copyAllTxt(text);
}

/**
 * 渲染数据到页面
 * @param {Array} data - 要渲染的数据数组
 * @description 清空容器内容，根据 isSingleColumn 变量设置布局，使用 DocumentFragment 优化 DOM 操作
 *              如果数据为空，显示"暂无数据"提示
 */
function renderData(data) {
    // 获取列表容器
    const container = document.getElementById("listBox");
    // 清空容器内容
    container.innerHTML = '';

    // 如果没有数据，显示“暂无数据”提示
    if (!data || data.length === 0) {
        container.innerHTML = `<p style="text-align:center;">暂无数据</p>`;
        return;
    }

    // 根据 isSingleColumn（是否单列布局）设置容器 class
    container.className = isSingleColumn ? 'single-column' : 'multi-column';

    // 使用DocumentFragment减少DOM操作次数
    const fragment = document.createDocumentFragment();

    // 遍历数据，创建项目
    for (let i = 0; i < data.length; i++) {
        // 创建单个项目元素
        const item = createItem(data[i]);
        // 将项目添加到fragment中
        fragment.appendChild(item);
    }

    // 一次性添加所有元素到容器
    container.appendChild(fragment);
}

/**
 * 创建单个数据项的 DOM 元素
 * @param {Object} item - 数据项对象，包含 id 和 context 属性
 * @returns {HTMLElement} - 创建的 div 元素
 * @description 创建一个带有 item 类的 div 元素，如果 context 是 'mzamusement.cn'，则添加 text-color 类
 *              设置元素的文本内容为 "{id}. {context}"，并存储 id 和 context 到 data-* 属性中
 */
function createItem(item) {
    const div = document.createElement('div');
    div.className = 'item';

    if (item.context == 'mzamusement.cn') {
        div.classList.add('text-color');
    }
    div.textContent = `${item.id}. ${item.context}`;
    div.dataset.id = item.id;
    div.dataset.context = item.context;

    return div;
}

/**
 * 检查本地存储中是否有有效的数据
 * @returns {boolean} - 如果本地存储中有有效的数据，返回 true；否则返回 false
 * @description 检查 localStorage 中是否存在 templateData 和 templateDataTime
 *              如果存在且数据未过期，则解析数据并赋值给 allData，返回 true
 *              如果数据过期或解析失败，则删除本地存储中的数据，返回 false
 */
function checkLocalData() {
    const savedData = localStorage.getItem('templateData');

    if (savedData) {
        try {
            allData = JSON.parse(savedData);
            showRange(1, 50);
            return true;
        } catch (e) {
            console.error('解析本地数据失败', e);
        }
    } else {
        const container = document.getElementById("listBox");
        container.innerHTML = '<p style="text-align:center; color: red;">暂无本地数据</p>';
    }
    return false;
}

/**
 * 显示指定范围的数据
 * @param {number} start - 起始ID
 * @param {number} end - 结束ID
 * @description 过滤 allData 中 ID 在 [start, end] 范围内的数据，并调用 renderData 方法渲染
 *              如果 allData 为空，显示提示信息
 */
function showRange(start, end) {
    if (!allData) {
        tatol(1, "暂无本地数据", 1);
        return;
    }
    if (allData.length === 0) {
        tatol(1, "数据尚未加载完成", 1);
        return;
    }

    const filtered = allData.filter(item => {
        const id = parseInt(item.id);
        return id >= start && id <= end;
    });
    renderData(filtered);
}

/**
 * 切换布局模式（单列/多列）
 * @description 切换 isSingleColumn 变量的值，更新切换按钮的文本
 *              如果当前有显示的数据，则重新渲染数据以应用新的布局
 */
function toggleLayout() {
    isSingleColumn = !isSingleColumn;
    const toggleBtn = document.getElementById('toggleLayoutBtn');
    toggleBtn.textContent = isSingleColumn ? '双列显示' : '单列显示';

    const container = document.getElementById('listBox');
    const items = container.querySelectorAll('.item');
    if (items.length > 0 && allData.length > 0) {
        const currentIds = Array.from(items).map(item => parseInt(item.dataset.id));
        const currentData = allData.filter(item => currentIds.includes(parseInt(item.id)));
        renderData(currentData);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPage);
} else {
    loadData();
}

/**
 * 初始化页面
 * @description 加载数据并为列表项添加点击事件监听器
 *              点击列表项时，调用 copyTxt 方法复制文本到剪贴板
 */
function initPage() {
    loadData();

    document.getElementById('listBox').addEventListener('click', (e) => {
        const item = e.target.closest('.item');
        if (item) {
            copyTxt(item.dataset.id, item.dataset.context);
        }
    });
}

/**
 * 回到顶部功能
 * @description 使用 smooth 行为将页面滚动到顶部
 */
function backToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

/**
 * 使用 GZIP 压缩字符串，并返回 Base64 编码的字符串 (用于传输)
 * 与 Java 的 GZIPInputStream 兼容
 * @param {string} str 原始字符串
 * @returns {string} Base64 编码的压缩后数据
 */
async function compressToBase64(str) {
    if (!str) return '';

    try {
        const inputBytes = new TextEncoder().encode(str);

        if (typeof CompressionStream === 'undefined') {
            return btoa(unescape(encodeURIComponent(str)));
        }

        const cs = new CompressionStream('gzip');
        const writer = cs.writable.getWriter();
        writer.write(inputBytes);
        writer.close();

        const reader = cs.readable.getReader();
        const chunks = [];
        let totalLength = 0;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            totalLength += value.length;
        }

        const compressedBytes = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
            compressedBytes.set(chunk, offset);
            offset += chunk.length;
        }

        let binary = '';
        for (let i = 0; i < compressedBytes.length; i++) {
            binary += String.fromCharCode(compressedBytes[i]);
        }
        return btoa(binary);
    } catch (error) {
        console.error('压缩失败:', error);
        return btoa(unescape(encodeURIComponent(str)));
    }
}

/**
 * 加载数据
 * @returns {void}
 * @description 处理数据加载逻辑
 *              首先检查 allData 是否有数据，如果有则直接返回
 *              然后检查本地存储中是否有有效的数据
 *              获取成功后，将数据存储到本地存储并显示前50条数据
 *              获取失败后，显示错误信息
 */

function loadData() {

    if (checkLocalData()) {
        return;
    }
    allData = localStorage.getItem('templateData');
    if (!allData) {
        tatol(1, "暂无本地数据", 1);
        return;
    }
    if (allData.length > 0) {
        showRange(1, 50);
        return;
    }

    // 从本地 localStorage 获取数据，不通过 API 请求
    const container = document.getElementById("listBox");
    container.innerHTML = '<p style="text-align:center; color: red;">暂无本地数据</p>';
}

/**
 * 滚动事件监听器，控制回到顶部按钮的显示/隐藏
 * @description 当页面滚动超过 300px 时，显示回到顶部按钮
 *              当页面滚动小于等于 300px 时，隐藏回到顶部按钮
 */
window.addEventListener('scroll', function () {
    const backToTopBtn = document.getElementById('backToTop');
    if (window.scrollY > 300) {
        backToTopBtn.classList.add('show');
    } else {
        backToTopBtn.classList.remove('show');
    }
});

// 暴露到全局
window.loadData = loadData;
window.tatol = tatol;
window.copyTxt = copyTxt; window.compressToBase64 = compressToBase64;

