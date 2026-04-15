let RISO_INKS = [
    { name: "金", hex: "#c99c65", active: true }, { name: "黑", hex: "#000000", active: true },
    { name: "鈍灰", hex: "#3d3d3f", active: true }, { name: "灰", hex: "#272727", active: true },
    { name: "白", hex: "#ffffff", active: true }, { name: "茶", hex: "#5c281a", active: true },
    { name: "黃土", hex: "#754a15", active: true }, { name: "水", hex: "#5196d5", active: true },
    { name: "天空", hex: "#68c7eb", active: true }, { name: "青", hex: "#1c6cb1", active: true },
    { name: "濃紺", hex: "#283a7f", active: true }, { name: "紫", hex: "#3c2657", active: true },
    { name: "酒紅", hex: "#671f2f", active: true }, { name: "薰衣紫", hex: "#7259c4", active: true },
    { name: "桃粉", hex: "#ea6d87", active: true }, { name: "赤紅", hex: "#b3181e", active: true },
    { name: "朱紅", hex: "#ea390e", active: true }, { name: "橙", hex: "#f19a38", active: true },
    { name: "黃", hex: "#fef104", active: true }, { name: "黄綠", hex: "#dae000", active: true },
    { name: "若葉綠", hex: "#009140", active: true }, { name: "濃綠", hex: "#0e525d", active: true },
    { name: "湖水綠", hex: "#008982", active: true }, { name: "薄荷綠", hex: "#5ebfc7", active: true },
    { name: "珊瑚粉", hex: "#f5b4b1", active: true }, { name: "螢光紅", hex: "#fe3741", active: true },
    { name: "螢光粉", hex: "#fd59aa", active: true }, { name: "螢光橘", hex: "#fc5938", active: true },
    { name: "螢光綠", hex: "#79fd83", active: true }, { name: "螢光黃", hex: "#fdff78", active: true }
];

// 效能優化 1: 預先計算所有油墨的 RGB 與 CMY 值，避免在迴圈內重複 Parse
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
let targetColorStates = [
    { hex: "#005b4b", limit: 0, forceInk: "" }, { hex: "#a52a2a", limit: 0, forceInk: "" },
    { hex: "#4682b4", limit: 0, forceInk: "" }, { hex: "#32cd32", limit: 0, forceInk: "" },
    { hex: "#ffa500", limit: 0, forceInk: "" }
];

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
    if(extractBtn) extractBtn.innerHTML = `<i class="bi bi-magic"></i> 擷取 ${targetColorStates.length} 個目標色`;
}

function addTargetColor() {
    if (targetColorStates.length >= 20) return alert("最多只能設定 20 個目標色！");
    saveTargetStates();
    targetColorStates.push({ hex: "#000000", limit: 0, forceInk: "" });
    renderTargetBoxes();
    updateExtractBtnText();
}

function removeTargetColor(index) {
    if (targetColorStates.length <= 1) return alert("最少需要保留 1 個目標色！");
    saveTargetStates(); 
    targetColorStates.splice(index, 1);
    renderTargetBoxes();
    updateExtractBtnText();
}

function getLimitText(val) {
    if (val === 1) return '限制單色';
    if (val === 2) return '最多兩色混合';
    return '不限混合數';
}

function renderTargetBoxes() {
    const container = document.getElementById('target-colors');
    container.innerHTML = '';
    
    targetColorStates.forEach((t, i) => {
        container.innerHTML += `
            <div class="color-box" id="target-box-${i}">
                <button class="btn-delete-box" onclick="removeTargetColor(${i})" title="刪除此色票"><i class="bi bi-x"></i></button>
                <input type="color" value="${t.hex}" class="target-hex">
                <label style="font-weight:bold; font-size:0.9rem;">色票 ${i+1}</label>
                
                <div class="custom-dropdown" id="limit-cd-${i}">
                    <div class="cd-selected" onclick="toggleDropdown('limit-panel-${i}')">
                        <span id="limit-text-${i}" class="cd-text-grow">${getLimitText(t.limit)}</span>
                    </div>
                    <div class="cd-panel" id="limit-panel-${i}">
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
                        <span id="ink-text-${i}" class="cd-text-truncate">（不指定）</span>
                    </div>
                    <div class="cd-panel" id="ink-panel-${i}">
                        <div class="cd-search-box">
                            <input type="text" placeholder="搜尋油墨..." onkeyup="filterDropdown(${i}, this.value)" onclick="event.stopPropagation()">
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

function toggleDropdown(panelId, focusSearch = false) {
    document.querySelectorAll('.cd-panel').forEach(p => {
        if(p.id !== panelId) p.classList.remove('show');
    });
    const panel = document.getElementById(panelId);
    if(panel) panel.classList.toggle('show');
    
    if(panel && panel.classList.contains('show') && focusSearch) {
        const searchInput = panel.querySelector('input[type="text"]');
        if (searchInput) {
            searchInput.value = '';
            const idx = panelId.split('-').pop();
            filterDropdown(idx, '');
            setTimeout(() => searchInput.focus(), 50);
        }
    }
}

function selectLimit(boxIndex, value, text) {
    document.getElementById(`limit-val-${boxIndex}`).value = value;
    document.getElementById(`limit-text-${boxIndex}`).innerText = text;
    document.getElementById(`limit-panel-${boxIndex}`).classList.remove('show');
}

function selectInk(boxIndex, inkName, inkHex) {
    const valInput = document.getElementById(`ink-val-${boxIndex}`);
    const textSpan = document.getElementById(`ink-text-${boxIndex}`);
    const swatchDiv = document.getElementById(`ink-swatch-${boxIndex}`);
    
    valInput.value = inkName;
    textSpan.innerText = inkName || '（不指定）';
    
    if (inkName) {
        swatchDiv.style.background = inkHex;
        swatchDiv.classList.remove('cd-none-swatch');
    } else {
        swatchDiv.style.background = 'transparent';
        swatchDiv.classList.add('cd-none-swatch');
    }
    document.getElementById(`ink-panel-${boxIndex}`).classList.remove('show');
}

function selectMaxInks(val, text) {
    document.getElementById('max-inks-val').value = val;
    document.getElementById('max-inks-text').innerText = text;
    document.getElementById('max-inks-panel').classList.remove('show');
}

function filterDropdown(boxIndex, keyword) {
    const options = document.querySelectorAll(`#ink-options-${boxIndex} .cd-option`);
    keyword = keyword.toLowerCase();
    options.forEach(opt => {
        const text = opt.innerText.toLowerCase();
        opt.style.display = text.includes(keyword) ? 'flex' : 'none';
    });
}

window.onclick = function(event) {
    if (!event.target.closest('.custom-dropdown')) {
        document.querySelectorAll('.cd-panel').forEach(p => p.classList.remove('show'));
    }
}

function renderInkLibrary() {
    const activeContainer = document.getElementById('active-inks-display');
    const archivedContainer = document.getElementById('archived-inks-display');
    activeContainer.innerHTML = '';
    archivedContainer.innerHTML = '';

    RISO_INKS.forEach((ink, index) => {
        const badgeHTML = `
            <div class="ink-badge ${ink.active ? '' : 'archived'}">
                <div class="ink-badge-color" style="background: ${ink.hex};"></div>
                <span style="font-weight:500;">${ink.name}</span>
                <button class="btn-icon" onclick="editInk(${index})" title="編輯"><i class="bi bi-pencil-fill"></i></button>
                <button class="btn-icon" onclick="toggleInk(${index})" title="${ink.active ? '移入倉庫' : '啟用'}">
                    <i class="bi ${ink.active ? 'bi-x-lg' : 'bi-plus-lg'}"></i>
                </button>
            </div>
        `;
        if (ink.active) activeContainer.innerHTML += badgeHTML;
        else archivedContainer.innerHTML += badgeHTML;
    });
    updateTargetDropdowns();
}

function updateTargetDropdowns() {
    const activeInks = RISO_INKS.filter(ink => ink.active);
    
    for(let i=0; i < targetColorStates.length; i++) {
        const optionsContainer = document.getElementById(`ink-options-${i}`);
        if(!optionsContainer) continue; 

        const currentVal = document.getElementById(`ink-val-${i}`).value;
        let html = `<div class="cd-option" onclick="selectInk(${i}, '', '')"><span>（不指定）</span></div>`;
        
        activeInks.forEach(ink => {
            html += `
                <div class="cd-option" onclick="selectInk(${i}, '${ink.name}', '${ink.hex}')">
                    <div class="cd-swatch" style="background: ${ink.hex};"></div>
                    <span>${ink.name}</span>
                </div>
            `;
        });
        optionsContainer.innerHTML = html;

        if (currentVal && !activeInks.find(ink => ink.name === currentVal)) {
            selectInk(i, '', ''); 
        } else if (currentVal) {
             const updatedInk = activeInks.find(ink => ink.name === currentVal);
             selectInk(i, updatedInk.name, updatedInk.hex);
        }
    }
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
}

function cancelEdit() {
    editingIndex = -1;
    document.getElementById('form-ink-name').value = '';
    document.getElementById('form-title').innerText = '新增油墨：';
    const submitBtn = document.getElementById('form-btn-submit');
    submitBtn.innerText = '加入';
    submitBtn.classList.remove('btn-save');
    document.getElementById('form-btn-cancel').classList.add('hidden');
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

// 效能優化 2: 採用預先算好的 CMY 值，避免數學轉換
function mixInksOptimized(inks, weights) {
    let c=0, m=0, y=0;
    for(let i=0; i<inks.length; i++) {
        let w = weights[i];
        c += inks[i].c * w;
        m += inks[i].m * w;
        y += inks[i].y * w;
    }
    return {
        r: Math.round(Math.max(0, 1 - Math.min(1, c)) * 255),
        g: Math.round(Math.max(0, 1 - Math.min(1, m)) * 255),
        b: Math.round(Math.max(0, 1 - Math.min(1, y)) * 255)
    };
}

// 效能優化 3: 採用平方差比較，省去耗時的 Math.sqrt
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

// 效能優化 4: 異步分塊運算 (Chunking) 防止畫面卡死並支援動畫
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
        return alert(`衝突：你總共允許 ${maxInks} 色，但各色票卻強制綁定了 ${forcedInksSet.size} 種不同油墨。`);
    }

    const combos = getCombinations(activeInksData, maxInks);
    let globalBestScore = Infinity;
    let globalBestCombo = null;
    let globalBestResults = null;

    // UI 動畫啟動
    btn.innerHTML = `<i class="bi bi-arrow-repeat spin-anim"></i> 運算中... (0%)`;
    btn.disabled = true;

    let comboIndex = 0;
    const CHUNK_SIZE = 500; // 每處理 500 個組合，休息一次讓 UI 更新

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
            // 還沒算完，更新進度並排程下一批
            let pct = Math.floor((comboIndex / combos.length) * 100);
            btn.innerHTML = `<i class="bi bi-arrow-repeat spin-anim"></i> 運算中... (${pct}%)`;
            requestAnimationFrame(() => setTimeout(processChunk, 0));
        } else {
            // 算完了
            if (globalBestCombo) {
                renderResults(targets, globalBestCombo, globalBestResults);
            } else {
                alert("找不到符合所有限制條件的油墨組合。");
            }
            
            // 完成動畫
            btn.innerHTML = `<i class="bi bi-check-lg"></i> 已完成`;
            btn.classList.add('btn-success');
            
            setTimeout(() => {
                btn.innerHTML = `<i class="bi bi-cpu"></i> 分析 RISO 油墨組合`;
                btn.classList.remove('btn-success');
                btn.disabled = false;
            }, 1500);
        }
    }
    
    // 開始第一批運算
    processChunk();
}

function renderResults(targets, combo, results) {
    const resultContainer = document.getElementById('result-container');
    resultContainer.classList.remove('hidden');
    
    const container = document.getElementById('chosen-inks-container');
    let badgesHTML = '<strong class="result-summary-title">選用油墨組合：</strong>';
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

        let constraintText = "";
        if (target.limit > 0) constraintText += ` [限${target.limit}色]`;
        if (target.forceInk) constraintText += ` [定:${target.forceInk}]`;

        let itemHTML = `
            <div class="result-item">
                <div class="compare-row">
                    <div>
                        <div class="preview-swatch" style="background: ${targetHex};"></div>
                        <div class="preview-label">目標色 ${index+1} <br><span class="preview-sub-label">${constraintText}</span></div>
                    </div>
                    <div>
                        <div class="preview-swatch" style="background: ${mixedHex};"></div>
                        <div class="preview-label">模擬疊印</div>
                    </div>
                    <div class="bar-chart-container">
        `;

        combo.forEach((ink, idx) => {
            let pct = Math.round(r.weights[idx] * 100);
            if(pct > 0) {
                let textColor = getContrastYIQ(ink.hex);
                itemHTML += `
                    <div class="result-bar-row">
                        <div class="result-bar-label">${ink.name}</div>
                        <div class="result-bar-track">
                            <div class="result-bar-fill" style="background: ${ink.hex}; width: ${pct}%; color: ${textColor};">
                                ${pct}%
                            </div>
                        </div>
                    </div>
                `;
            }
        });

        itemHTML += `</div></div></div>`;
        resDiv.innerHTML += itemHTML;
    });
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

            const reader = new FileReader();
            reader.onload = function(event) {
                const img = new Image();
                img.onload = function() {
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
    }, 50);
}