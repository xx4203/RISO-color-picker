let originalFullImage = null;

// 1. 建立 Footer 元素 (改為 div 較符合語意)
const footerDiv = document.createElement("div");
footerDiv.className = "footer";
footerDiv.innerHTML = `
    <div id="copyright">
        <p>Dan Lo © </p>
        <p id="copyright-year"></p>
        <p>All rights reserved.</p>
    </div>
    <div class="footer-social-link">
        <a href="http://xx4203.com"><i class="bi bi-globe2 icon-btn sec-color"></i></a>
        <a href="https://www.instagram.com/x_x4203/"><i class="bi bi-instagram icon-btn sec-color"></i></a>
        <i class="bi bi-envelope icon-btn sec-color" id="copyEmail" style="cursor:pointer;"></i>
    </div>
    <i id="back-top" class="bi bi-arrow-up-circle icon-btn sec-color" style="cursor:pointer;"></i>
`;

// 2. 將 Footer 安全地加入到網頁最下方 (body 的末端)
document.body.appendChild(footerDiv);


let defaultActives = ["黑", "金", "青", "螢光粉", "赤紅", "黃", "若葉綠", "薄荷綠"];

let RISO_INKS = [
    { name: "金", hex: "#c99c65", active: defaultActives.includes("金") }, 
    { name: "黑", hex: "#000000", active: defaultActives.includes("黑") },
    { name: "鈍灰", hex: "#3d3d3f", active: defaultActives.includes("鈍灰") }, 
    { name: "灰", hex: "#272727", active: defaultActives.includes("灰") },
    { name: "白", hex: "#ffffff", active: defaultActives.includes("白") }, 
    { name: "茶", hex: "#5c281a", active: defaultActives.includes("茶") },
    { name: "黃土", hex: "#754a15", active: defaultActives.includes("黃土") }, 
    { name: "水", hex: "#5196d5", active: defaultActives.includes("水") },
    { name: "天空", hex: "#30afe4", active: defaultActives.includes("天空") }, 
    { name: "青", hex: "#0368b8", active: defaultActives.includes("青") },
    { name: "濃紺", hex: "#2a3a5b", active: defaultActives.includes("濃紺") }, 
    { name: "紫", hex: "#3c2657", active: defaultActives.includes("紫") },
    { name: "酒紅", hex: "#671f2f", active: defaultActives.includes("酒紅") }, 
    { name: "薰衣紫", hex: "#7259c4", active: defaultActives.includes("薰衣紫") },
    { name: "桃粉", hex: "#ea6d87", active: defaultActives.includes("桃粉") }, 
    { name: "赤紅", hex: "#b3181e", active: defaultActives.includes("赤紅") },
    { name: "朱紅", hex: "#ea390e", active: defaultActives.includes("朱紅") }, 
    { name: "橙", hex: "#f19a38", active: defaultActives.includes("橙") },
    { name: "黃", hex: "#fef104", active: defaultActives.includes("黃") }, 
    { name: "黄綠", hex: "#c5d110", active: defaultActives.includes("黄綠") },
    { name: "若葉綠", hex: "#00A95C", active: defaultActives.includes("若葉綠") }, 
    { name: "濃綠", hex: "#0e525d", active: defaultActives.includes("濃綠") },
    { name: "湖水綠", hex: "#008982", active: defaultActives.includes("湖水綠") }, 
    { name: "薄荷綠", hex: "#5ebfc7", active: defaultActives.includes("薄荷綠") },
    { name: "珊瑚粉", hex: "#f5b4b1", active: defaultActives.includes("珊瑚粉") }, 
    { name: "螢光紅", hex: "#e6383a", active: defaultActives.includes("螢光紅") },
    { name: "螢光粉", hex: "#fd59aa", active: defaultActives.includes("螢光粉") }, 
    { name: "螢光橘", hex: "#ff5c3b", active: defaultActives.includes("螢光橘") },
    { name: "螢光綠", hex: "#79fd83", active: defaultActives.includes("螢光綠") }, 
    { name: "螢光黃", hex: "#fdff78", active: defaultActives.includes("螢光黃") }
];

function computeInkProperties(ink) {
    let bigint = parseInt(ink.hex.replace('#', ''), 16);
    ink.r = (bigint >> 16) & 255;
    ink.g = (bigint >> 8) & 255;
    ink.b = bigint & 255;
    ink.c = 1 - ink.r / 255;
    ink.m = 1 - ink.g / 255;
    ink.y = 1 - ink.b / 255;
}
RISO_INKS.forEach(computeInkProperties);

let editingIndex = -1;
let archiveSearchKeyword = "";
let targetColorStates = [
    { hex: "#005b4b", limit: 0, forceInk: "" }, { hex: "#a52a2a", limit: 0, forceInk: "" },
    { hex: "#4682b4", limit: 0, forceInk: "" }, { hex: "#32cd32", limit: 0, forceInk: "" },
    { hex: "#ffa500", limit: 0, forceInk: "" }
];

// ==================== ★新增的手機版「偵測高度並撐寬」演算法★ ====================
function adjustMobileGridWidth() {
    const grid = document.getElementById('active-inks-display');
    if (!grid) return;

    // 大於 860px 時清除強制設定，讓它正常排版
    if (window.innerWidth > 860) {
        grid.style.minWidth = '100%';
        return;
    }

    // 先重置為 100% 寬度以測量自然向下排列時的高度
    grid.style.minWidth = '100%';
    
    // 找出第一個標籤的高度，做為每行的高度基準
    const firstItem = grid.children[0];
    if (!firstItem) return;
    
    const itemHeight = firstItem.offsetHeight || 36;
    const gap = 8; // 0.5rem CSS間距

    // 計算 4 行的「極限容許高度」(元素高度 + 間距) * 4，並加一點容錯空間
    const maxAllowedHeight = (itemHeight + gap) * 4 + 2; 

    // 核心邏輯：如果目前高度「超過 4 行」，代表它已經往下折到第 5 行了。
    // 我們開始逐漸增加容器寬度 (強迫內部元素往右搬移)，直到它縮回 4 行內！
    if (grid.offsetHeight > maxAllowedHeight) {
        let testWidth = grid.offsetWidth;
        // 加入 testWidth < 3000 防呆，避免無窮迴圈
        while (grid.offsetHeight > maxAllowedHeight && testWidth < 3000) {
            testWidth += 30; // 每次撐寬 30px
            grid.style.minWidth = testWidth + 'px';
        }
    }
}
// =====================================================================


function saveTargetStates() {
    targetColorStates.forEach((t, i) => {
        const box = document.getElementById(`target-box-${i}`);
        if (box) {
            t.hex = box.querySelector('.target-hex').value;
            t.limit = parseInt(box.querySelector('.target-limit-val').value);
            t.forceInk = box.querySelector('.target-force-val').value;
        }
    });
}

function updateExtractBtnText() {
    const extractBtn = document.getElementById('extract-btn');
    if(extractBtn) extractBtn.innerHTML = `<i class="bi bi-eyedropper"></i> 取樣 ${targetColorStates.length} 個顏色`;
}

function addTargetColor() {
    if (targetColorStates.length >= 20) return alert("最多只能設定 20 個目標色！");
    saveTargetStates();
    targetColorStates.push({ hex: "#000000", limit: 0, forceInk: "" });
    renderTargetBoxes();
    updateExtractBtnText();
    
    setTimeout(() => {
        const newIndex = targetColorStates.length - 1;
        const newBox = document.getElementById(`target-box-${newIndex}`);
        if (newBox) {
            const colorRow = document.getElementById('target-colors');
            if (colorRow) colorRow.scrollLeft = colorRow.scrollWidth;
            newBox.classList.add('flash-anim');
            setTimeout(() => newBox.classList.remove('flash-anim'), 600);
        }
    }, 50);
}

function removeTargetColor(index) {
    if (targetColorStates.length <= 1) return alert("最少需要保留 1 個目標色！");
    saveTargetStates(); 
    targetColorStates.splice(index, 1);
    renderTargetBoxes();
    updateExtractBtnText();
}

function resetAllSettings() {
    targetColorStates.forEach(t => {
        t.limit = 0;
        t.forceInk = "";
    });
    renderTargetBoxes();
}

function clearLimit(boxIndex, event) {
    event.stopPropagation();
    selectLimit(boxIndex, 0, '不限混合數');
}

function clearInk(boxIndex, event) {
    event.stopPropagation();
    selectInk(boxIndex, '', '');
}

function getLimitText(val) {
    if (val === 1) return '限制單色';
    if (val === 2) return '最多兩色混合';
    return '不限混合數';
}

function renderTargetBoxes() {
    document.querySelectorAll('body > .cd-panel').forEach(p => p.remove());
    const container = document.getElementById('target-colors');
    container.innerHTML = '';
    
    targetColorStates.forEach((t, i) => {
        container.innerHTML += `
            <div class="color-box" id="target-box-${i}">
                <button class="btn-delete-box" onclick="removeTargetColor(${i})" title="刪除此色票"><i class="bi bi-x"></i></button>
                <input type="color" value="${t.hex}" class="target-hex">
                <label style="font-weight:bold; font-size:1.2rem;">色票 ${i+1}</label>
                
                <div class="custom-dropdown" id="limit-cd-${i}">
                    <div class="cd-selected" onclick="toggleDropdown('limit-panel-${i}')">
                        <span id="limit-text-${i}" class="cd-text-grow">${getLimitText(t.limit)}</span>
                        <i class="bi bi-x-circle-fill cd-clear-btn ${t.limit !== 0 ? '' : 'hidden'}" id="limit-clear-icon-${i}" onclick="clearLimit(${i}, event)" title="重置為不限"></i>
                        <span class="cd-arrow ${t.limit === 0 ? '' : 'hidden'}" id="limit-arrow-${i}">▼</span>
                    </div>
                    <div class="cd-panel" id="limit-panel-${i}">
                        <div style="display:flex; justify-content:space-between; align-items:center; padding: 1.5rem; border-bottom: 0.1rem solid var(--bg-hover);">
                            <strong style="color:var(--text-muted); font-size: 1.3rem;">色彩限制</strong>
                            <i class="bi bi-x-lg" style="cursor:pointer; color:var(--text-muted); font-size: 1.5rem;" onclick="closePanel('limit-panel-${i}')"></i>
                        </div>
                        <div class="cd-options">
                            <div class="cd-option" onclick="selectLimit(${i}, 0, '不限混合數')"><span>不限混合數</span></div>
                            <div class="cd-option" onclick="selectLimit(${i}, 1, '限制單色')"><span>限制單色</span></div>
                            <div class="cd-option" onclick="selectLimit(${i}, 2, '最多兩色混合')"><span>最多兩色混合</span></div>
                        </div>
                    </div>
                    <input type="hidden" class="target-limit-val" id="limit-val-${i}" value="${t.limit}">
                </div>

                <div class="custom-dropdown" id="ink-cd-${i}">
                    <div class="cd-selected" onclick="toggleDropdown('ink-panel-${i}', true)">
                        <div class="cd-swatch cd-none-swatch" id="ink-swatch-${i}"></div>
                        <span id="ink-text-${i}" class="cd-text-truncate">不指定</span>
                        <i class="bi bi-x-circle-fill cd-clear-btn ${t.forceInk !== '' ? '' : 'hidden'}" id="ink-clear-icon-${i}" onclick="clearInk(${i}, event)" title="重置為不指定"></i>
                        <span class="cd-arrow ${t.forceInk === '' ? '' : 'hidden'}" id="ink-arrow-${i}">▼</span>
                    </div>
                    <div class="cd-panel" id="ink-panel-${i}">
                        <div class="cd-search-box" style="display:flex; align-items:center; gap: 1rem;">
                            <input type="text" placeholder="搜尋油墨..." style="flex-grow:1;" onkeyup="filterDropdown(${i}, this.value)" onclick="event.stopPropagation()">
                            <i class="bi bi-x-lg" style="cursor:pointer; color:var(--text-muted); font-size: 1.5rem;" onclick="closePanel('ink-panel-${i}')"></i>
                        </div>
                        <div class="cd-options" id="ink-options-${i}"></div>
                    </div>
                    <input type="hidden" class="target-force-val" id="ink-val-${i}" value="${t.forceInk}">
                </div>
            </div>
        `;
    });
    updateTargetDropdowns();
}

function closePanel(panelId) {
    const panel = document.getElementById(panelId);
    if (!panel) return;
    panel.classList.remove('show');
    if (panel.dataset.originalParent) {
        const parent = document.getElementById(panel.dataset.originalParent);
        if (parent) parent.appendChild(panel);
    }
}

function selectLimit(boxIndex, value, text) {
    document.getElementById(`limit-val-${boxIndex}`).value = value;
    document.getElementById(`limit-text-${boxIndex}`).innerText = text;
    
    closePanel(`limit-panel-${boxIndex}`);
    
    const clearIcon = document.getElementById(`limit-clear-icon-${boxIndex}`);
    const arrowIcon = document.getElementById(`limit-arrow-${boxIndex}`);
    if (value === 0) {
        clearIcon.classList.add('hidden');
        arrowIcon.classList.remove('hidden');
    } else {
        clearIcon.classList.remove('hidden');
        arrowIcon.classList.add('hidden');
    }
    saveTargetStates();
}

function selectInk(boxIndex, inkName, inkHex) {
    const valInput = document.getElementById(`ink-val-${boxIndex}`);
    const textSpan = document.getElementById(`ink-text-${boxIndex}`);
    const swatchDiv = document.getElementById(`ink-swatch-${boxIndex}`);
    const clearIcon = document.getElementById(`ink-clear-icon-${boxIndex}`);
    const arrowIcon = document.getElementById(`ink-arrow-${boxIndex}`);
    
    valInput.value = inkName;
    textSpan.innerText = inkName || '不指定';
    
    if (inkName) {
        swatchDiv.style.background = inkHex;
        swatchDiv.classList.remove('cd-none-swatch');
        clearIcon.classList.remove('hidden');
        arrowIcon.classList.add('hidden');
    } else {
        swatchDiv.style.background = 'transparent';
        swatchDiv.classList.add('cd-none-swatch');
        clearIcon.classList.add('hidden');
        arrowIcon.classList.remove('hidden');
    }
    
    closePanel(`ink-panel-${boxIndex}`);
    
    saveTargetStates();
}

function selectMaxInks(val, text) {
    document.getElementById('max-inks-val').value = val;
    document.getElementById('max-inks-text').innerText = text;
    
    closePanel('max-inks-panel');
}

function filterDropdown(boxIndex, keyword) {
    const options = document.querySelectorAll(`#ink-options-${boxIndex} .cd-option`);
    keyword = keyword.toLowerCase();
    options.forEach(opt => {
        const text = opt.innerText.toLowerCase();
        opt.style.display = text.includes(keyword) ? 'flex' : 'none';
    });
}

// ==================== 手機版顯示控制與視窗點擊事件 ====================
function toggleMobileMore(e) {
    e.stopPropagation();
    const menu = document.getElementById('mobile-more-menu');
    if(menu) menu.classList.toggle('hidden');
}

function toggleMobileArchive() {
    const sidebar = document.getElementById('mobile-archive-section');
    sidebar.classList.toggle('show-mobile-flex');
    if (sidebar.classList.contains('show-mobile-flex')) {
        document.querySelector('.add-ink-form').classList.remove('show-mobile-flex');
    }
}

function showMobileAddInk() {
    document.querySelector('.add-ink-form').classList.add('show-mobile-flex');
    document.getElementById('mobile-archive-section').classList.remove('show-mobile-flex');
    document.getElementById('form-btn-cancel').classList.remove('hidden'); 
    document.getElementById('form-btn-cancel').style.display = 'block'; // 確保顯示取消按鈕
    setTimeout(() => document.getElementById('form-ink-name').focus(), 100);
}

function jumpToAddInkFromArchive() {
    showMobileAddInk();
}

function toggleDropdown(panelId, focusSearch = false) {
    const panel = document.getElementById(panelId);
    
    document.querySelectorAll('.cd-panel').forEach(p => {
        if(p.id !== panelId && p.classList.contains('show')) closePanel(p.id);
    });

    if (!panel) return;

    if (panel.classList.contains('show')) {
        closePanel(panelId);
    } else {
        panel.classList.add('show');
        
        // 手機版直接移入 body 脫離裁切限制
        if (window.innerWidth <= 860) {
            if (!panel.dataset.originalParent) {
                if (!panel.parentElement.id) {
                    panel.parentElement.id = 'cd-parent-' + Math.random().toString(36).substr(2, 9);
                }
                panel.dataset.originalParent = panel.parentElement.id;
            }
            document.body.appendChild(panel);
        }
        
        if(focusSearch) {
            const searchInput = panel.querySelector('input[type="text"]');
            if (searchInput) {
                searchInput.value = '';
                const idx = panelId.split('-').pop();
                filterDropdown(idx, '');
                setTimeout(() => searchInput.focus(), 50);
            }
        }
    }
}

// ==================== 視窗點擊事件 (支援手機觸控關閉 & 防誤觸) ====================
function closeAllOutside(event) {
    let wasOpen = false;

    // 1. 處理所有自訂下拉選單 (色彩限制、油墨指定)
    const openPanels = document.querySelectorAll('.cd-panel.show');
    if (openPanels.length > 0 && !event.target.closest('.custom-dropdown') && !event.target.closest('.cd-panel')) {
        openPanels.forEach(p => closePanel(p.id));
        wasOpen = true;
    }
    
    // 2. 處理手機版「更多」(三個點) 選單
    const menu = document.getElementById('mobile-more-menu');
    if (menu && !menu.classList.contains('hidden') && !event.target.closest('#mobile-more-menu') && !event.target.closest('#mobile-more-btn')) {
        menu.classList.add('hidden');
        wasOpen = true;
    }

    // 3. 處理匯入/匯出 Modal 點擊外部關閉 (點擊到半透明遮罩本身)
    if (event.target.classList.contains('modal-overlay')) {
        event.target.classList.add('hidden');
        wasOpen = true;
    }

    // ⭐️ 如果這次點擊剛好關閉了任何選單/視窗，就攔截這次點擊，避免誤觸底下的按鈕
    if (wasOpen) {
        event.stopPropagation();
        event.preventDefault();
    }
}

// 使用 { capture: true } 讓事件在最外層 (捕獲階段) 優先執行，這樣才能成功攔截
document.addEventListener('click', closeAllOutside, { capture: true });
document.addEventListener('touchstart', closeAllOutside, { passive: false, capture: true });

// 同時綁定 click 與 touchstart，確保在 iOS 等手機瀏覽器點擊空白處也能順利觸發
document.addEventListener('click', closeAllOutside);
document.addEventListener('touchstart', closeAllOutside, { passive: true });

// ==================== 油墨庫渲染與批次管理 ====================
function toggleAllInks() {
    const allActive = RISO_INKS.every(ink => ink.active);
    const archivedCount = RISO_INKS.filter(ink => !ink.active).length;
    
    // 如果全部都在使用中，或者倉庫為空，就執行「全部停用」
    if (allActive || archivedCount === 0) {
        RISO_INKS.forEach(ink => ink.active = false);
    } else {
        // 否則執行「全部啟用」
        RISO_INKS.forEach(ink => ink.active = true);
    }
    renderInkLibrary();
}

function moveAllToArchive() {
    // 將所有油墨狀態設為非啟用
    RISO_INKS.forEach(ink => ink.active = false);
    renderInkLibrary();
    
    // 執行完畢後自動關閉手機版的更多選單
    const menu = document.getElementById('mobile-more-menu');
    if(menu) menu.classList.add('hidden');
}

function addDefaultInks() {
    const coreInks = [
        { name: "黑", hex: "#000000" }, { name: "金", hex: "#c99c65" },
        { name: "青", hex: "#1c6cb1" }, { name: "螢光粉", hex: "#fd59aa" },
        { name: "赤紅", hex: "#b3181e" }, { name: "黃", hex: "#fef104" },
        { name: "若葉綠", hex: "#00A95C" }, { name: "薄荷綠", hex: "#5ebfc7" }
    ];

    const coreNames = coreInks.map(c => c.name);
    
    // 取得目前「使用中」的油墨名稱
    const currentActiveNames = RISO_INKS.filter(ink => ink.active).map(ink => ink.name);

    // 判斷是否「剛好」只啟用這些常用油墨
    const isExactlyCore = currentActiveNames.length === coreNames.length && 
                          coreNames.every(name => currentActiveNames.includes(name));

    if (isExactlyCore) {
        // 如果已經是純常用油墨狀態，閃爍提示即可
        const badges = document.querySelectorAll('#active-inks-display .ink-badge');
        badges.forEach(badge => {
            badge.classList.remove('flash-anim');
            void badge.offsetWidth; 
            badge.classList.add('flash-anim');
        });
        return;
    }

    // 核心邏輯：將常用名單內的設為啟用，其他的設為停用 (移回倉庫)
    RISO_INKS.forEach(ink => {
        if (coreNames.includes(ink.name)) {
            ink.active = true;
        } else {
            ink.active = false;
        }
    });

    // 防呆：如果常用油墨曾經被使用者永久刪除，就把它重新補回來
    coreInks.forEach(coreInk => {
        let existingInk = RISO_INKS.find(ink => ink.name === coreInk.name);
        if (!existingInk) {
            let newInk = { name: coreInk.name, hex: coreInk.hex, active: true };
            computeInkProperties(newInk);
            RISO_INKS.push(newInk);
        }
    });

    renderInkLibrary();
}

function filterArchiveInks(keyword) {
    archiveSearchKeyword = keyword.toLowerCase();
    const archivedContainer = document.getElementById('archived-inks-display');
    renderInkLibrary(); 
    
    // 新增：如果全部被過濾掉，顯示空狀態與跳轉按鈕
    if (archivedContainer.innerHTML.trim() === '') {
        archivedContainer.innerHTML = `
            <div style="color:var(--text-muted); font-size:0.85rem; text-align:center; padding: 1.5rem 0; width: 100%;">
                <i class="bi bi-droplet-half" style="font-size:1.5rem; display:block; margin-bottom:0.5rem; opacity:0.5;"></i>
                沒有找到符合的油墨<br><br>
                <button class="btn-secondary" style="margin: 0 auto;" onclick="goToAddInk()"><i class="bi bi-plus-lg"></i> 自訂油墨</button>
            </div>
        `;
    }
}

function renderInkLibrary() {
    const activeContainer = document.getElementById('active-inks-display');
    const archivedContainer = document.getElementById('archived-inks-display');
    activeContainer.innerHTML = '';
    archivedContainer.innerHTML = '';

    let archivedCount = 0;

    RISO_INKS.forEach((ink, index) => {
        let actionButtons = `
            <div style="display:flex; gap:4px; margin-left:auto;">
                <button class="btn-icon" onclick="editInk(${index})" title="編輯"><i class="bi bi-pencil-fill"></i></button>
                <button class="btn-icon" onclick="toggleInk(${index})" title="${ink.active ? '移入倉庫' : '啟用'}">
                    <i class="bi ${ink.active ? 'bi-x-lg' : 'bi-plus-lg'}"></i>
                </button>
            </div>
        `;
        
        if (!ink.active) {
            archivedCount++;
            if (archiveSearchKeyword && !ink.name.toLowerCase().includes(archiveSearchKeyword)) return; 
            actionButtons = actionButtons.replace('</div>', `<button class="btn-icon btn-icon-danger" onclick="deleteInk(${index})" title="永久刪除"><i class="bi bi-trash-fill"></i></button></div>`);
        }

        const badgeHTML = `
            <div class="ink-badge ${ink.active ? '' : 'archived'}">
                <div class="ink-badge-color" style="background: ${ink.hex};"></div>
                <span style="font-weight:500; padding-right: 0.5rem;">${ink.name}</span>
                ${actionButtons}
            </div>
        `;
        
        if (ink.active) activeContainer.innerHTML += badgeHTML;
        else archivedContainer.innerHTML += badgeHTML;
    });

    const allActive = RISO_INKS.every(ink => ink.active);
    const toggleBtn = document.getElementById('btn-toggle-all-inks');
    if (toggleBtn) {
        if (allActive || archivedCount === 0) {
            toggleBtn.innerHTML = '<i class="bi bi-archive-fill"></i> 全部停用';
        } else {
            toggleBtn.innerHTML = '<i class="bi bi-check-all"></i> 全部啟用';
        }
    }

    if (archivedCount === 0) {
        archivedContainer.innerHTML = '<div style="color:var(--text-muted); font-size:1.2rem; text-align:center; padding: 1rem 0; width: 100%;">所有油墨啟用中</div>';
    }
    
    const searchInput = document.getElementById('archive-search');
    if (searchInput) searchInput.style.display = archivedCount < 7 ? 'none' : 'block';

    activeContainer.innerHTML += `
        <div class="ink-badge mobile-add-badge" onclick="showMobileAddInk()">
            <i class="bi bi-plus-lg"></i> <span style="font-weight:500;">自訂油墨</span>
        </div>
    `;

    updateTargetDropdowns();
    adjustMobileGridWidth();
}

function deleteInk(index) {
    const inkName = RISO_INKS[index].name;
    if (confirm(`確定要永久刪除「${inkName}」嗎？這個動作無法復原。`)) {
        RISO_INKS.splice(index, 1);
        if (editingIndex === index) {
            cancelEdit();
        } else if (editingIndex > index) {
            editingIndex--;
        }
        renderInkLibrary();
    }
}

// ==================== 匯出與匯入功能 ====================
function openExportModal() {
    document.getElementById('export-modal').classList.remove('hidden');
    document.getElementById('export-textarea').value = '';
    const copyBtn = document.getElementById('btn-copy-export');
    copyBtn.innerHTML = '<i class="bi bi-copy"></i> 複製內容';
    copyBtn.classList.remove('btn-success');
}

function closeExportModal() {
    document.getElementById('export-modal').classList.add('hidden');
}

function doExport(type) {
    const list = type === 'active' ? RISO_INKS.filter(i => i.active) : RISO_INKS;
    const str = list.map(i => `${i.name}, ${i.hex}`).join('\n');
    document.getElementById('export-textarea').value = str;
}

function copyExport() {
    const textarea = document.getElementById('export-textarea');
    if (!textarea.value) return alert("沒有內容可以複製！請先點擊上方按鈕產生清單。");
    navigator.clipboard.writeText(textarea.value).then(() => {
        const copyBtn = document.getElementById('btn-copy-export');
        copyBtn.innerHTML = '<i class="bi bi-check-lg"></i> 已複製';
        copyBtn.classList.add('btn-success');
    });
}

function openImportModal() {
    document.getElementById('import-modal').classList.remove('hidden');
    document.getElementById('import-textarea').value = '';
}

function closeImportModal() {
    document.getElementById('import-modal').classList.add('hidden');
}

function processImport() {
    const text = document.getElementById('import-textarea').value;
    const lines = text.split('\n');
    let importedCount = 0;
    
    lines.forEach(line => {
        let str = line.trim();
        if (!str) return;
        
        let hexMatch = str.match(/(#[0-9A-Fa-f]{6})/);
        if (!hexMatch) return;
        
        let hex = hexMatch[1];
        let name = str.replace(hex, '').replace(/,/g, '').trim();
        
        if (name && hex) {
            let existing = RISO_INKS.find(i => i.name === name);
            if (existing) {
                existing.hex = hex;
                computeInkProperties(existing);
            } else {
                let newInk = { name: name, hex: hex, active: true };
                computeInkProperties(newInk);
                RISO_INKS.push(newInk);
            }
            importedCount++;
        }
    });
    
    alert(`成功匯入/更新了 ${importedCount} 筆油墨！\n(新匯入的油墨將加入候選油墨列表)`);
    closeImportModal();
    renderInkLibrary();
}

// ==================== 油墨更新與選單同步 ====================
function updateTargetDropdowns() {
    const activeInks = RISO_INKS.filter(ink => ink.active);

    targetColorStates.forEach((state, idx) => {
        const inkPanel = document.getElementById(`ink-panel-${idx}`);
        if (inkPanel) {
            let optionsHTML = `
                <div class="cd-header">
                    <div class="cd-swatch" style="background: ${state.hex}"></div> 色票 ${idx + 1}
                </div>
                <div class="cd-search-box">
                    <input type="text" placeholder="搜尋油墨..." oninput="filterDropdown('${idx}', this.value)" onclick="event.stopPropagation()">
                </div>
                <div class="cd-options dropdown-list-${idx}">
            `;

            // 新增：防呆，如果沒有油墨的畫面
            if (activeInks.length === 0) {
                optionsHTML += `</div>`; 
                optionsHTML += `
                    <div class="cd-footer" style="padding: 0.8rem; text-align: center; border-top: 1px solid var(--border-light);">
                        <p style="font-size: 0.8rem; color: var(--danger); margin: 0 0 0.5rem 0;">無可用油墨，請先在上方加入</p>
                        <button class="btn-secondary" style="font-size: 0.75rem; width: 100%; justify-content:center;" onclick="goToAddInk(); closePanel('ink-panel-${idx}')">前往新增</button>
                    </div>
                `;
            } else {
                optionsHTML += `
                    <div class="cd-option" onclick="selectInk(${idx}, '', event)">
                        <div class="cd-swatch cd-none-swatch"></div><span>不指定油墨</span>
                    </div>
                `;
                activeInks.forEach(ink => {
                    optionsHTML += `
                        <div class="cd-option dropdown-item-${idx}" data-name="${ink.name}">
                            <div class="cd-swatch" style="background: ${ink.hex};"></div>
                            <span onclick="selectInk(${idx}, '${ink.name}', event)" style="flex-grow:1;">${ink.name}</span>
                        </div>
                    `;
                });
                optionsHTML += `</div>`; 
                // 新增：選單最底下的提示區塊
                optionsHTML += `
                    <div class="cd-footer" style="padding: 0.8rem; text-align: center; border-top: 1px solid var(--border-light); background: var(--bg-hover);">
                        <p style="font-size: 0.75rem; color: var(--text-muted); margin: 0 0 0.5rem 0;">找不到需要的油墨顏色嗎？</p>
                        <button class="btn-secondary" style="font-size: 0.75rem; width:100%; justify-content:center;" onclick="goToAddInk(); closePanel('ink-panel-${idx}')">前往上方加入</button>
                    </div>
                `;
            }
            inkPanel.innerHTML = optionsHTML;
        }
    });
}

function toggleInk(index) {
    RISO_INKS[index].active = !RISO_INKS[index].active;
    renderInkLibrary();
}

function editInk(index) {
    editingIndex = index;
    const ink = RISO_INKS[index];
    document.getElementById('form-ink-name').value = ink.name;
    document.getElementById('form-ink-color').value = ink.hex;
    document.getElementById('form-title').innerText = '編輯：';
    const submitBtn = document.getElementById('form-btn-submit');
    submitBtn.innerText = '儲存';
    submitBtn.classList.add('btn-save');
    document.getElementById('form-btn-cancel').classList.remove('hidden');
    
    if (window.innerWidth <= 860) showMobileAddInk();
}

function cancelEdit() {
    editingIndex = -1;
    document.getElementById('form-ink-name').value = '';
    document.getElementById('form-title').innerText = '自訂油墨：';
    const submitBtn = document.getElementById('form-btn-submit');
    submitBtn.innerText = '加入';
    submitBtn.classList.remove('btn-save');
    
    document.querySelector('.add-ink-form').classList.remove('show-mobile-flex');
    if (window.innerWidth > 860) {
        document.getElementById('form-btn-cancel').style.display = 'none';
    }
}

function submitInkForm() {
    const name = document.getElementById('form-ink-name').value.trim();
    const hex = document.getElementById('form-ink-color').value;

    if (!name) return alert("請輸入油墨名稱！");

    if (editingIndex >= 0) {
        RISO_INKS[editingIndex].name = name;
        RISO_INKS[editingIndex].hex = hex;
        computeInkProperties(RISO_INKS[editingIndex]);
        cancelEdit();
    } else {
        let newInk = { name: name, hex: hex, active: true };
        computeInkProperties(newInk);
        RISO_INKS.push(newInk);
        document.getElementById('form-ink-name').value = '';
    }
    renderInkLibrary();
}

window.onload = function() {
    updateExtractBtnText();
    renderTargetBoxes(); 
    renderInkLibrary();  
};

// 視窗縮放時也重新計算寬度
window.addEventListener('resize', adjustMobileGridWidth);

// ==================== 核心運算邏輯 ====================
function hexToRgb(hex) {
    let bigint = parseInt(hex.replace('#', ''), 16);
    return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

function getContrastYIQ(hexcolor){
    hexcolor = hexcolor.replace("#", "");
    if(hexcolor.length === 3) hexcolor = hexcolor.split('').map(x => x+x).join('');
    let r = parseInt(hexcolor.substr(0,2),16);
    let g = parseInt(hexcolor.substr(2,2),16);
    let b = parseInt(hexcolor.substr(4,2),16);
    let yiq = ((r*299)+(g*587)+(b*114))/1000;
    return (yiq >= 128) ? 'black' : 'white';
}

function mixInksOptimized(inks, weights) {
    let c = 0, m = 0, y = 0;
    let goldWeight = 0;
    let goldInk = null;

    // 1. 先計算所有「非金色」（透明）油墨的 CMY 疊加
    for(let i = 0; i < inks.length; i++) {
        let w = weights[i];
        if (inks[i].name === "金") {
            // 遇到金色先記下來，不加入一般透明疊加計算
            goldWeight = w;
            goldInk = inks[i];
        } else {
            c += inks[i].c * w;
            m += inks[i].m * w;
            y += inks[i].y * w;
        }
    }

    // 2. 將底層透明油墨的 CMY 轉換回 RGB
    let baseR = Math.max(0, 1 - Math.min(1, c)) * 255;
    let baseG = Math.max(0, 1 - Math.min(1, m)) * 255;
    let baseB = Math.max(0, 1 - Math.min(1, y)) * 255;

    // 3. 處理「金色」的覆蓋物理特性 (Alpha Blending)
    if (goldWeight > 0 && goldInk) {
        // 設定金色的最高覆蓋率為 95% (0.95)，隨油墨濃度遞增
        let alpha = goldWeight * 0.95; 
        
        // 還原金色本身的 RGB 顏色
        let gR = (1 - goldInk.c) * 255;
        let gG = (1 - goldInk.m) * 255;
        let gB = (1 - goldInk.y) * 255;

        // 圖層混合公式：(頂層顏色 * 頂層不透明度) + (底層顏色 * (1 - 頂層不透明度))
        baseR = gR * alpha + baseR * (1 - alpha);
        baseG = gG * alpha + baseG * (1 - alpha);
        baseB = gB * alpha + baseB * (1 - alpha);
    }

    return {
        r: Math.round(baseR),
        g: Math.round(baseG),
        b: Math.round(baseB)
    };
}

function colorDistSq(c1, c2) {
    let dr = c1.r - c2.r;
    let dg = c1.g - c2.g;
    let db = c1.b - c2.b;
    return dr*dr + dg*dg + db*db;
}

function getCombinations(arr, k) {
    if (k === 1) return arr.map(e => [e]);
    const result = [];
    arr.forEach((e, i) => {
        const smallerCombos = getCombinations(arr.slice(i + 1), k - 1);
        smallerCombos.forEach(combo => result.push([e].concat(combo)));
    });
    return result;
}

function findBestWeightsForTarget(target, inkCombo) {
    if (target.forceInk && !inkCombo.some(ink => ink.name === target.forceInk)) {
        return { weights: [], mixed: {r:255, g:255, b:255}, dist: Infinity };
    }

    function runSearchPhase(stepOptionsArrays) {
        let bestDist = Infinity;
        let bestWeights = null;
        let bestMixed = null;

        function searchPhase(currentWeights, depth) {
            let activeInkCount = currentWeights.filter(w => w > 0).length;
            if (target.limit > 0 && activeInkCount > target.limit) return;

            if (depth === inkCombo.length) {
                if (target.forceInk) {
                    const forceInkIndex = inkCombo.findIndex(i => i.name === target.forceInk);
                    if (currentWeights[forceInkIndex] === 0) return;
                }
                let mixed = mixInksOptimized(inkCombo, currentWeights);
                let dist = colorDistSq(target.rgb, mixed);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestWeights = [...currentWeights];
                    bestMixed = mixed;
                }
                return;
            }
            
            for (let w of stepOptionsArrays[depth]) {
                currentWeights.push(w);
                searchPhase(currentWeights, depth + 1);
                currentWeights.pop();
            }
        }
        searchPhase([], 0);
        return { weights: bestWeights, mixed: bestMixed, dist: bestDist };
    }

    const coarseSteps = [0, 0.2, 0.4, 0.6, 0.8, 1.0];
    const coarseStepArrays = Array(inkCombo.length).fill(coarseSteps);
    let coarseResult = runSearchPhase(coarseStepArrays);

    if (!coarseResult.weights) return { weights: [], mixed: {r:255, g:255, b:255}, dist: Infinity };

    const fineStepArrays = [];
    for (let i = 0; i < inkCombo.length; i++) {
        let centerWeight = coarseResult.weights[i];
        let fineOptions = [];
        for (let diff = -0.15; diff <= 0.1501; diff += 0.05) { 
            let val = Math.round((centerWeight + diff) * 100) / 100;
            if (val >= 0 && val <= 1.0) fineOptions.push(val);
        }
        fineStepArrays.push([...new Set(fineOptions)]);
    }

    return runSearchPhase(fineStepArrays);
}

function calculateColors() {
    const btn = document.getElementById('calc-btn');
    saveTargetStates();

    const targets = [];
    for(let i=0; i < targetColorStates.length; i++) {
        const box = document.getElementById(`target-box-${i}`);
        targets.push({
            rgb: hexToRgb(box.querySelector('.target-hex').value),
            limit: parseInt(box.querySelector('.target-limit-val').value),
            forceInk: box.querySelector('.target-force-val').value 
        });
    }

    const maxInks = parseInt(document.getElementById('max-inks-val').value);
    const activeInksData = RISO_INKS.filter(ink => ink.active);

    const forcedInksSet = new Set(targets.map(t => t.forceInk).filter(name => name !== ""));
    if (forcedInksSet.size > maxInks) {
        return alert(`指定了 ${forcedInksSet.size} 種不同油墨，請減少至 ${maxInks} 種以下。`);
    }

    const combos = getCombinations(activeInksData, maxInks);
    let globalBestScore = Infinity;
    let globalBestCombo = null;
    let globalBestResults = null;

    btn.innerHTML = `<i class="bi bi-arrow-repeat spin-anim"></i> 運算中... (0%)`;
    btn.disabled = true;

    let comboIndex = 0;
    const CHUNK_SIZE = 500; 

    function processChunk() {
        let end = Math.min(comboIndex + CHUNK_SIZE, combos.length);
        
        for (; comboIndex < end; comboIndex++) {
            let combo = combos[comboIndex];
            let totalDist = 0;
            let comboResults = [];
            let isValidCombo = true;
            
            for (let target of targets) {
                let res = findBestWeightsForTarget(target, combo);
                if (res.dist === Infinity) { isValidCombo = false; break; }
                totalDist += res.dist;
                comboResults.push(res);
            }
            
            if (isValidCombo && totalDist < globalBestScore) {
                globalBestScore = totalDist;
                globalBestCombo = combo;
                globalBestResults = comboResults;
            }
        }

        if (comboIndex < combos.length) {
            let pct = Math.floor((comboIndex / combos.length) * 100);
            btn.innerHTML = `<i class="bi bi-arrow-repeat spin-anim"></i> 運算中... (${pct}%)`;
            requestAnimationFrame(() => setTimeout(processChunk, 0));
        } else {
            if (globalBestCombo) {
                renderResults(targets, globalBestCombo, globalBestResults);

                const calcBtn = document.getElementById('calc-btn');
                if (calcBtn) {
                    calcBtn.innerHTML = '<i class="bi bi-clipboard-data"></i> 分析 RISO 油墨組合';
                    calcBtn.classList.remove('loading');
                    calcBtn.disabled = false;
                }
                
                btn.innerHTML = `<i class="bi bi-check-lg"></i> 已完成`;
                btn.classList.add('btn-success');
                
                setTimeout(() => {
                    document.getElementById('result-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);

            } else {
                alert("找不到符合所有限制條件的油墨組成。");
                btn.innerHTML = `<i class="bi bi-exclamation-triangle"></i> 無法運算`;
            }
            
            setTimeout(() => {
                btn.innerHTML = `<i class="bi bi-clipboard-data"></i> 輸出 RISO 配色方案`;
                btn.classList.remove('btn-success');
                btn.disabled = false;
            }, 1500);
        }
    }
    processChunk();
}

function renderResults(targets, combo, results) {
    const resultContainer = document.getElementById('result-container');
    resultContainer.classList.remove('hidden');
    
    const container = document.getElementById('chosen-inks-container');
    let badgesHTML = '<strong class="result-summary-title">選用油墨：</strong>';
    badgesHTML += '<div class="result-badge-container">';
    badgesHTML += combo.map(i => `
        <div class="ink-badge result-ink-badge">
            <div class="ink-badge-color" style="background: ${i.hex};"></div>
            <span style="font-weight:600;">${i.name}</span>
        </div>`).join('');
    badgesHTML += '</div>';
    container.innerHTML = badgesHTML;

    const resDiv = document.getElementById('results');
    resDiv.innerHTML = '';

    targets.forEach((target, index) => {
        const r = results[index];
        const targetHex = `#${(1 << 24 | target.rgb.r << 16 | target.rgb.g << 8 | target.rgb.b).toString(16).slice(1)}`;
        const mixedHex = `#${(1 << 24 | r.mixed.r << 16 | r.mixed.g << 8 | r.mixed.b).toString(16).slice(1)}`;

        let tagsHeaderHTML = '';
        let limitTagHTML = '';
        let forceTagHTML = '';

        if (target.limit > 0) {
            limitTagHTML = `<span class="r-tag tag-limit">限 ${target.limit} 色</span>`;
        }

        if (target.forceInk) {
            const forcedInkData = RISO_INKS.find(i => i.name === target.forceInk);
            if (forcedInkData) {
                let textColor = getContrastYIQ(forcedInkData.hex);
                forceTagHTML = `<span class="r-tag tag-ink" style="background: ${forcedInkData.hex}; color: ${textColor}; padding: 3px 8px;">指定 ${target.forceInk}</span>`;
            }
        }

        if (limitTagHTML || forceTagHTML) {
            tagsHeaderHTML = `
                <div style="display: flex; justify-content: flex-end; gap: 8px; margin-bottom: 8px;">
                    ${limitTagHTML}
                    ${forceTagHTML}
                </div>
            `;
        }

        let itemHTML = `
            <div class="result-item">
                <div class="compare-row">
                    <div class="swatches-group">
                        <div class="preview-label-container">
                            <div class="preview-swatch" style="background: ${targetHex};"></div>
                            <div class="preview-label">目標色 ${index+1}</div>
                        </div>
                        <div class="preview-label-container">
                            <div class="preview-swatch" style="background: ${mixedHex};"></div>
                            <div class="preview-label">模擬疊印</div>
                        </div>
                    </div>
                    <div class="bar-chart-container">
                        ${tagsHeaderHTML} `;

        combo.forEach((ink, idx) => {
            let pct = Math.round(r.weights[idx] * 100);
            if(pct > 0) {
                let textColor = getContrastYIQ(ink.hex);
                
                itemHTML += `
                    <div class="result-bar-row">
                        <div class="result-bar-label">${ink.name}</div>
                        <div class="result-bar-pct">${pct}%</div>
                        
                        <div class="result-bar-track">
                            <div class="result-bar-fill" style="background: ${ink.hex}; width: ${pct}%; color: ${textColor};">
                                <span class="desktop-pct">${pct}%</span>
                            </div>
                        </div>
                    </div>
                `;
            }
        });

        itemHTML += `</div></div></div>`;
        resDiv.innerHTML += itemHTML;
    });

    window.currentBestCombo = combo;
    window.currentBestResults = results;

    if (originalFullImage) {
        // 假設你的結果是裝在 result-container 或類似 ID 的區塊內，請替換成你實際的 ID (例如 'result-summary' 或 'results')
        const container = document.getElementById('result-display') || document.querySelector('.result-item').parentElement; 
        
        container.innerHTML += `
            <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px dashed var(--border-color); text-align: center;">
                <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.8rem;">已偵測到上傳的參考圖片，是否依照此配色方案進行分色？</p>
                <button class="primary" id="start-sep-btn" onclick="startSeparationPreview()">
                    <i class="bi bi-layers"></i> 開始縮圖分色預覽
                </button>
            </div>
        `;
    }
}

// ==================== 圖片色彩擷取功能 ====================
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('image-upload');
    const fileNameDisplay = document.getElementById('file-name-display');
    
    if(fileInput) {
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) {
                fileNameDisplay.innerText = "尚未選擇檔案";
                document.getElementById('img-preview-container').classList.add('hidden');
                return;
            }
            
            fileNameDisplay.innerText = file.name;
            resetAllSettings();

            const reader = new FileReader();
            reader.onload = function(event) {
                const img = new Image();
                img.onload = function() {
                    originalFullImage = img;
                    const canvas = document.getElementById('img-canvas');
                    const ctx = canvas.getContext('2d');
                    
                    const maxSize = 150; 
                    let width = img.width;
                    let height = img.height;
                    if (width > height) {
                        if (width > maxSize) { height *= maxSize / width; width = maxSize; }
                    } else {
                        if (height > maxSize) { width *= maxSize / height; height = maxSize; }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    document.getElementById('img-preview-container').classList.remove('hidden');
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
    }
});

function extractDominantColors() {
    resetAllSettings(); //每次點擊取樣時，先重置所有目標色的限制與油墨設定

    const btn = document.getElementById('extract-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = `<i class="bi bi-arrow-repeat spin-anim"></i> 分析中...`;
    btn.disabled = true;

    const k = targetColorStates.length; 

    setTimeout(() => {
        const canvas = document.getElementById('img-canvas');
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const pixels = [];

        for (let i = 0; i < imageData.length; i += 4) {
            if (imageData[i + 3] >= 128) { 
                pixels.push({ r: imageData[i], g: imageData[i + 1], b: imageData[i + 2] });
            }
        }

        const colorMap = new Map();
        const binSize = 20; 

        for (let p of pixels) {
            const rBin = Math.floor(p.r / binSize) * binSize + Math.floor(binSize/2);
            const gBin = Math.floor(p.g / binSize) * binSize + Math.floor(binSize/2);
            const bBin = Math.floor(p.b / binSize) * binSize + Math.floor(binSize/2);
            const key = `${rBin},${gBin},${bBin}`;

            if (colorMap.has(key)) colorMap.get(key).count++;
            else colorMap.set(key, { r: rBin, g: gBin, b: bBin, count: 1 });
        }

        const sortedColors = Array.from(colorMap.values()).sort((a, b) => b.count - a.count);
        let centroids = [];
        let minDistThreshold = 12000; 

        while (centroids.length < k && minDistThreshold > 100) {
            centroids = [];
            if (sortedColors.length > 0) centroids.push(sortedColors[0]); 

            for (let i = 1; i < sortedColors.length && centroids.length < k; i++) {
                const candidate = sortedColors[i];
                let isDistinct = true;

                for (let selected of centroids) {
                    let dr = candidate.r - selected.r;
                    let dg = candidate.g - selected.g;
                    let db = candidate.b - selected.b;
                    let sqDist = dr*dr + dg*dg + db*db;
                    
                    if (sqDist < minDistThreshold) {
                        isDistinct = false; 
                        break;
                    }
                }
                if (isDistinct) centroids.push(candidate);
            }
            minDistThreshold -= 1500; 
        }

        if (centroids.length < k) {
           for (let i = 0; i < sortedColors.length && centroids.length < k; i++) {
               if (!centroids.some(c => c.r === sortedColors[i].r && c.g === sortedColors[i].g && c.b === sortedColors[i].b)) {
                   centroids.push(sortedColors[i]);
               }
           }
        }

        centroids.forEach((c, index) => {
            const r = Math.min(255, Math.max(0, Math.round(c.r)));
            const g = Math.min(255, Math.max(0, Math.round(c.g)));
            const b = Math.min(255, Math.max(0, Math.round(c.b)));

            const hex = "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
            const box = document.getElementById(`target-box-${index}`);
            if (box) {
                box.querySelector('.target-hex').value = hex;
                box.style.transition = "background-color 0.3s";
                box.style.backgroundColor = "#dcfce7"; 
                setTimeout(() => box.style.backgroundColor = "", 300);
            }
        });
        
        saveTargetStates();
        btn.innerHTML = originalText;
        btn.disabled = false;

        setTimeout(() => {
            document.getElementById('target-colors').scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);

    }, 50);
}

// 將整份程式碼用 IIFE 包起來，保護內部變數不與其他 JS 衝突
(() => {
    // =========================
    // copy-email-btn
    // =========================
    const copyEmailBtn = document.getElementById("copyEmail");
    
    if (copyEmailBtn) { // 防呆：確認按鈕存在才綁定事件
        copyEmailBtn.addEventListener("click", function () {
            const textToCopy = "xox4203@gmail.com"; 
            const icon = this;

            // 複製文字到剪貼簿
            navigator.clipboard.writeText(textToCopy).then(() => {
                // 變更 icon 為 copy icon
                icon.classList.remove("bi-envelope");
                icon.classList.add("bi-copy");

                // 延長至 1.5 秒後變回 envelope icon，讓使用者有足夠時間看清回饋
                setTimeout(() => {
                    icon.classList.remove("bi-copy");
                    icon.classList.add("bi-envelope");
                }, 1500); 
            }).catch(err => {
                console.error("複製失敗:", err);
            });
        });
    }

    // =========================
    // back-top-btn
    // =========================
    const backTopBtn = document.getElementById('back-top');
    
    if (backTopBtn) {
        backTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // =========================
    // 網站年份
    // =========================
    const yearSpan = document.getElementById("copyright-year");
    
    if (yearSpan) {
        const startYear = 2019;
        const currentYear = new Date().getFullYear();

        const yearText = startYear === currentYear
            ? `${currentYear}`
            : `${startYear}-${currentYear}`;

        yearSpan.textContent = yearText;
    }
})();

// 跳轉到上方自訂油墨區塊的輔助函式
function goToAddInk() {
    document.querySelector('.add-ink-form').classList.add('show-mobile-flex');
    document.getElementById('form-ink-name').focus();
    window.scrollTo({ top: document.querySelector('.add-ink-form').offsetTop - 50, behavior: 'smooth' });
}

// =================================================================
// 以下為全新加入的功能：圖片點擊取樣編輯器 & PSD 分色黑稿匯出
// =================================================================

let currentSamplerTarget = 0;

function openSamplerModal() {
    if(!originalFullImage) return;
    document.getElementById('sampler-modal').classList.remove('hidden');
    const canvas = document.getElementById('sampler-canvas');
    canvas.width = originalFullImage.width;
    canvas.height = originalFullImage.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(originalFullImage, 0, 0);

    renderSamplerToolbar();
    selectSamplerTarget(0); 
}

function renderSamplerToolbar() {
    const toolbar = document.getElementById('sampler-toolbar');
    toolbar.innerHTML = '';
    targetColorStates.forEach((tc, idx) => {
        const btn = document.createElement('button');
        btn.className = `sampler-target-btn ${currentSamplerTarget === idx ? 'active' : ''}`;
        btn.style = `border: 2px solid ${currentSamplerTarget === idx ? '#10b981' : 'transparent'}; border-radius: 6px; padding: 6px; cursor: pointer; background: var(--bg-card); box-shadow: 0 1px 3px rgba(0,0,0,0.1); display:flex; flex-direction:column; align-items:center; min-width:60px;`;
        btn.innerHTML = `<div style="width: 30px; height: 30px; background: ${tc.hex}; border-radius: 4px; border: 1px solid rgba(0,0,0,0.1);"></div><div style="font-size: 0.75rem; margin-top:4px; font-weight:600;">色票 ${idx+1}</div>`;
        btn.onclick = () => selectSamplerTarget(idx);
        toolbar.appendChild(btn);
    });
}

function selectSamplerTarget(idx) {
    currentSamplerTarget = idx;
    renderSamplerToolbar();
}

// 點擊圖片取樣功能
document.getElementById('sampler-canvas').addEventListener('click', function(e) {
    if(!originalFullImage) return;
    const rect = this.getBoundingClientRect();
    const scaleX = this.width / rect.width;
    const scaleY = this.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const ctx = this.getContext('2d');
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const hex = "#" + (1 << 24 | pixel[0] << 16 | pixel[1] << 8 | pixel[2]).toString(16).slice(1);
    
    // 更新指定色票，並清空該色票的油墨限制
    targetColorStates[currentSamplerTarget].hex = hex;
    targetColorStates[currentSamplerTarget].limit = 0;
    targetColorStates[currentSamplerTarget].forceInk = "";

    renderTargetBoxes();
    renderSamplerToolbar();

    // 觸發外部色票閃爍 Focus 提示
    const box = document.getElementById(`target-box-${currentSamplerTarget}`);
    if(box) {
        box.classList.remove('flash-anim');
        void box.offsetWidth;
        box.classList.add('flash-anim');
    }
});

function closeSamplerModal() { document.getElementById('sampler-modal').classList.add('hidden'); }


// =================================================================
// 全新分色邏輯：縮圖預覽 ＆ 高畫質原尺寸下載
// =================================================================

// 1. 點擊按鈕後，觸發預覽分色
function startSeparationPreview() {
    const btn = document.getElementById('start-sep-btn');
    btn.innerHTML = '<i class="bi bi-hourglass-split spin-anim"></i> 分色運算中...';
    btn.disabled = true;

    // 延遲 50ms 讓畫面有時間更新 Loading 按鈕
    setTimeout(() => {
        // 傳入 true 代表是預覽，會強制把圖片寬度縮小到 800px 以內運算
        generateSeparations(window.currentBestCombo, window.currentBestResults, true); 
        btn.style.display = 'none'; // 算完就隱藏按鈕
    }, 50);
}

// 2. 核心分色演算法（供預覽與高畫質下載共用）
function processImageSeparation(imgSource, combo, results, maxWidth = null) {
    let w = imgSource.width;
    let h = imgSource.height;

    // 如果有設定最大寬度（預覽用），則等比例縮小以節省效能
    if (maxWidth && w > maxWidth) {
        h = Math.round((h * maxWidth) / w);
        w = maxWidth;
    }

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = w; tempCanvas.height = h;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(imgSource, 0, 0, w, h);
    const imgData = tempCtx.getImageData(0, 0, w, h);
    const pixels = imgData.data;

    const inkData = combo.map(() => new Uint8Array(w * h));

    for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i], g = pixels[i+1], b = pixels[i+2], a = pixels[i+3];
        if (a === 0) continue; 
        
        let minDist = Infinity;
        let targetIndex = 0;
        for (let k = 0; k < targetColorStates.length; k++) {
            const tcHex = targetColorStates[k].hex;
            const dist = Math.pow(r - parseInt(tcHex.slice(1,3),16), 2) + Math.pow(g - parseInt(tcHex.slice(3,5),16), 2) + Math.pow(b - parseInt(tcHex.slice(5,7),16), 2);
            if (dist < minDist) { minDist = dist; targetIndex = k; }
        }

        const weights = results[targetIndex].weights;
        const pLum = 255 - (r + g + b) / 3;
        const tcHex = targetColorStates[targetIndex].hex;
        const tLum = 255 - (parseInt(tcHex.slice(1,3),16) + parseInt(tcHex.slice(3,5),16) + parseInt(tcHex.slice(5,7),16)) / 3;
        const ratio = tLum === 0 ? 0 : (pLum / tLum);

        const pixelIndex = i / 4;
        for (let j = 0; j < combo.length; j++) {
            let val = weights[j] * ratio * 255;
            inkData[j][pixelIndex] = Math.min(255, Math.max(0, val));
        }
    }

    const canvases = [];
    combo.forEach((ink, idx) => {
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const ctx = c.getContext('2d');
        const outData = ctx.createImageData(w, h);
        
        for(let p=0; p<w*h; p++) {
            outData.data[p*4] = 0;
            outData.data[p*4+1] = 0;
            outData.data[p*4+2] = 0;
            outData.data[p*4+3] = inkData[idx][p]; 
        }
        ctx.putImageData(outData, 0, 0);
        canvases.push({ ink: ink, canvas: c, w: w, h: h });
    });

    return canvases;
}

// 3. 將縮圖預覽繪製到畫面上
function generateSeparations(combo, results, isPreview = true) {
    if (!originalFullImage) return;
    const step3 = document.getElementById('step3-section');
    step3.classList.remove('hidden');
    const container = document.getElementById('separation-previews');
    
    // 呼叫演算法，並強制將寬度縮放到 800px 以下
    window.previewCanvases = processImageSeparation(originalFullImage, combo, results, 800);
    container.innerHTML = '';

    window.previewCanvases.forEach((sep, idx) => {
        container.innerHTML += `
            <div class="sep-preview-item">
                <div style="background:${sep.ink.hex}; height:10px; width:100%; border-radius:4px 4px 0 0;"></div>
                <canvas class="sep-canvas" id="preview-cvs-${idx}"></canvas>
                <p style="font-weight:600; margin:0.8rem 0 0.5rem;">${sep.ink.name} 版</p>
                <div style="display:flex; gap:0.5rem; width:100%;">
                    <button class="btn-secondary" style="flex:1; font-size:0.8rem; justify-content:center;" onclick="downloadSeparation(${idx}, 'png', this)">原圖 PNG</button>
                    <button class="btn-secondary" style="flex:1; font-size:0.8rem; justify-content:center;" onclick="downloadSeparation(${idx}, 'jpg', this)">原圖 JPG</button>
                </div>
            </div>
        `;
    });

    window.previewCanvases.forEach((sep, idx) => {
        const pc = document.getElementById(`preview-cvs-${idx}`);
        pc.width = sep.w; pc.height = sep.h;
        pc.getContext('2d').drawImage(sep.canvas, 0, 0);
    });
}

// 4. 下載圖片：點擊時才使用原圖運算
function downloadSeparation(idx, type, btnElement) {
    const originalText = btnElement.innerHTML;
    btnElement.innerHTML = '<i class="bi bi-hourglass spin-anim"></i> 運算中...';
    btnElement.disabled = true;

    setTimeout(() => {
        // 傳入 null 代表不縮圖，使用原圖高畫質運算
        const highResCanvases = processImageSeparation(originalFullImage, window.currentBestCombo, window.currentBestResults, null);
        const sep = highResCanvases[idx];
        
        const a = document.createElement('a');
        if(type === 'png') {
            a.href = sep.canvas.toDataURL('image/png');
            a.download = `RISO_K_${sep.ink.name}_HighRes.png`;
        } else {
            const temp = document.createElement('canvas');
            temp.width = sep.w; temp.height = sep.h;
            const ctx = temp.getContext('2d');
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0,0,sep.w,sep.h);
            ctx.drawImage(sep.canvas, 0, 0);
            a.href = temp.toDataURL('image/jpeg', 0.9);
            a.download = `RISO_K_${sep.ink.name}_HighRes.jpg`;
        }
        a.click();

        btnElement.innerHTML = originalText;
        btnElement.disabled = false;
    }, 50);
}

// 5. 下載 PSD：同樣點擊時才使用原圖運算
function downloadPSD() {
    if(!window.agPsd) return alert('缺少分色模組，請確認網路連線。');
    
    const btnElement = document.querySelector('.btn-psd');
    const originalText = btnElement.innerHTML;
    btnElement.innerHTML = '<i class="bi bi-hourglass spin-anim"></i> 產生高畫質 PSD 中...';
    btnElement.disabled = true;

    setTimeout(() => {
        // 使用原圖高畫質運算 PSD 圖層
        const highResCanvases = processImageSeparation(originalFullImage, window.currentBestCombo, window.currentBestResults, null);
        
        const layers = highResCanvases.map(sep => {
            const c = document.createElement('canvas');
            c.width = sep.w; c.height = sep.h;
            c.getContext('2d').drawImage(sep.canvas, 0, 0);
            return { name: `${sep.ink.name} K版`, canvas: c, blendMode: 'multiply' };
        });

        const bg = document.createElement('canvas');
        bg.width = highResCanvases[0].w; bg.height = highResCanvases[0].h;
        const bgCtx = bg.getContext('2d');
        bgCtx.fillStyle = '#ffffff'; bgCtx.fillRect(0,0,bg.width,bg.height);
        layers.push({ name: '白紙底色', canvas: bg });

        const psd = { width: highResCanvases[0].w, height: highResCanvases[0].h, children: layers.reverse() };
        const buffer = window.agPsd.writePsd(psd);
        const blob = new Blob([buffer], { type: 'application/octet-stream' });
        
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `RISO_分離輸出_HighRes.psd`;
        a.click();

        btnElement.innerHTML = originalText;
        btnElement.disabled = false;
    }, 50);
}