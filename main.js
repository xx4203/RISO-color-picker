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

let editingIndex = -1;

// 使用 Array 來管理目標色票的狀態，上限 20 個
let targetColorStates = [
    { hex: "#005b4b", limit: 0, forceInk: "" },
    { hex: "#a52a2a", limit: 0, forceInk: "" },
    { hex: "#4682b4", limit: 0, forceInk: "" },
    { hex: "#32cd32", limit: 0, forceInk: "" },
    { hex: "#ffa500", limit: 0, forceInk: "" }
];

// 把當前 DOM 的設定存回 Array，避免重新渲染時資料遺失
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
    if(extractBtn) extractBtn.innerText = `擷取 ${targetColorStates.length} 個目標色`;
}

function addTargetColor() {
    if (targetColorStates.length >= 20) return alert("最多只能設定 20 個目標色！");
    saveTargetStates(); // 先存檔
    targetColorStates.push({ hex: "#000000", limit: 0, forceInk: "" });
    renderTargetBoxes();
    updateExtractBtnText();
}

function removeTargetColor(index) {
    if (targetColorStates.length <= 1) return alert("最少需要保留 1 個目標色！");
    saveTargetStates(); // 先存檔
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
                <button class="btn-delete-box" onclick="removeTargetColor(${i})" title="刪除此色票">✖</button>
                <input type="color" value="${t.hex}" class="target-hex">
                <label style="font-weight:bold; font-size:0.9rem;">色票 ${i+1}</label>
                
                <div class="custom-dropdown" id="limit-cd-${i}">
                    <div class="cd-selected" onclick="toggleDropdown('limit-panel-${i}')">
                        <span id="limit-text-${i}" style="flex-grow:1; text-align:left;">${getLimitText(t.limit)}</span>
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
                        <span id="ink-text-${i}" style="flex-grow:1; text-align:left; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">（不指定）</span>
                    </div>
                    <div class="cd-panel" id="ink-panel-${i}">
                        <div class="cd-search-box">
                            <input type="text" placeholder="搜尋油墨..." onkeyup="filterDropdown(${i}, this.value)" onclick="event.stopPropagation()">
                        </div>
                        <div class="cd-options" id="ink-options-${i}">
                            </div>
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
    panel.classList.toggle('show');
    
    if(panel.classList.contains('show') && focusSearch) {
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
                <button class="btn-icon" onclick="editInk(${index})" title="編輯">✎</button>
                <button class="btn-icon" onclick="toggleInk(${index})" title="${ink.active ? '移入倉庫' : '啟用'}">
                    ${ink.active ? '✖' : '＋'}
                </button>
            </div>
        `;
        if (ink.active) {
            activeContainer.innerHTML += badgeHTML;
        } else {
            archivedContainer.innerHTML += badgeHTML;
        }
    });
    
    updateTargetDropdowns();
}

function updateTargetDropdowns() {
    const activeInks = RISO_INKS.filter(ink => ink.active);
    
    for(let i=0; i < targetColorStates.length; i++) {
        const optionsContainer = document.getElementById(`ink-options-${i}`);
        if(!optionsContainer) continue; 

        const currentVal = document.getElementById(`ink-val-${i}`).value;
        
        let html = `
            <div class="cd-option" onclick="selectInk(${i}, '', '')">
                <span>（不指定）</span>
            </div>
        `;
        
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
    document.getElementById('form-btn-cancel').style.display = 'inline-block';
}

function cancelEdit() {
    editingIndex = -1;
    document.getElementById('form-ink-name').value = '';
    document.getElementById('form-title').innerText = '新增油墨：';
    const submitBtn = document.getElementById('form-btn-submit');
    submitBtn.innerText = '加入';
    submitBtn.classList.remove('btn-save');
    document.getElementById('form-btn-cancel').style.display = 'none';
}

function submitInkForm() {
    const name = document.getElementById('form-ink-name').value.trim();
    const hex = document.getElementById('form-ink-color').value;

    if (!name) return alert("請輸入油墨名稱！");

    if (editingIndex >= 0) {
        RISO_INKS[editingIndex].name = name;
        RISO_INKS[editingIndex].hex = hex;
        cancelEdit();
    } else {
        RISO_INKS.push({ name: name, hex: hex, active: true });
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

// 亮度對比度演算法 (YIQ)，決定長條圖上的文字該用黑色還是白色
function getContrastYIQ(hexcolor){
    hexcolor = hexcolor.replace("#", "");
    if(hexcolor.length === 3) {
        hexcolor = hexcolor.split('').map(x => x+x).join('');
    }
    let r = parseInt(hexcolor.substr(0,2),16);
    let g = parseInt(hexcolor.substr(2,2),16);
    let b = parseInt(hexcolor.substr(4,2),16);
    let yiq = ((r*299)+(g*587)+(b*114))/1000;
    return (yiq >= 128) ? 'black' : 'white';
}

function mixInks(inks, weights) {
    let c=0, m=0, y=0;
    for(let i=0; i<inks.length; i++) {
        let rgb = hexToRgb(inks[i].hex);
        let ic = 1 - rgb.r/255, im = 1 - rgb.g/255, iy = 1 - rgb.b/255;
        c += ic * weights[i]; m += im * weights[i]; y += iy * weights[i];
    }
    return {
        r: Math.round(Math.max(0, 1 - Math.min(1, c)) * 255),
        g: Math.round(Math.max(0, 1 - Math.min(1, m)) * 255),
        b: Math.round(Math.max(0, 1 - Math.min(1, y)) * 255)
    };
}

function colorDistance(c1, c2) {
    return Math.sqrt(Math.pow(c1.r - c2.r, 2) + Math.pow(c1.g - c2.g, 2) + Math.pow(c1.b - c2.b, 2));
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
                let mixed = mixInks(inkCombo, currentWeights);
                let dist = colorDistance(target.rgb, mixed);
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
    const originalText = btn.innerText;
    btn.innerText = "運算中... (請耐心等候)";
    btn.disabled = true;
    
    // 計算前存檔，確保最新設定生效
    saveTargetStates();

    setTimeout(() => {
        const targets = [];
        for(let i=0; i < targetColorStates.length; i++) {
            const box = document.getElementById(`target-box-${i}`);
            targets.push({
                rgb: hexToRgb(box.querySelector('.target-hex').value),
                limit: parseInt(box.querySelector('.target-limit-val').value),
                forceInk: box.querySelector('.target-force-val').value 
            });
        }

        const maxInks = parseInt(document.getElementById('max-inks').value);
        const activeInksData = RISO_INKS.filter(ink => ink.active);

        const forcedInksSet = new Set(targets.map(t => t.forceInk).filter(name => name !== ""));
        if (forcedInksSet.size > maxInks) {
            alert(`衝突：你總共允許 ${maxInks} 色，但各色票卻強制綁定了 ${forcedInksSet.size} 種不同油墨。`);
            btn.innerText = originalText;
            btn.disabled = false;
            return;
        }

        const combos = getCombinations(activeInksData, maxInks);
        let globalBestScore = Infinity;
        let globalBestCombo = null;
        let globalBestResults = null;

        for (let combo of combos) {
            let totalDist = 0;
            let comboResults = [];
            let isValidCombo = true;
            
            for (let target of targets) {
                let res = findBestWeightsForTarget(target, combo);
                if (res.dist === Infinity) {
                    isValidCombo = false; 
                    break; 
                }
                totalDist += res.dist;
                comboResults.push(res);
            }
            
            if (isValidCombo && totalDist < globalBestScore) {
                globalBestScore = totalDist;
                globalBestCombo = combo;
                globalBestResults = comboResults;
            }
        }

        if (globalBestCombo) {
            renderResults(targets, globalBestCombo, globalBestResults);
        } else {
            alert("找不到符合所有限制條件的油墨組合。");
        }
        
        btn.innerText = originalText;
        btn.disabled = false;
    }, 50); 
}

function renderResults(targets, combo, results) {
    document.getElementById('result-container').style.display = 'block';
    
    // 更新選用油墨標籤 (採用 Badge 樣式)
    const container = document.getElementById('chosen-inks-container');
    let badgesHTML = '<strong style="display:block; margin-bottom:0.8rem; color:#475569;">選用油墨組合：</strong>';
    badgesHTML += '<div style="display:flex; gap:0.5rem; flex-wrap:wrap;">';
    badgesHTML += combo.map(i => `
        <div class="ink-badge" style="background:white; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
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
                        <div style="font-size: 0.8rem; text-align:center; margin-top:6px; font-weight:600;">目標色 ${index+1} <br><span style="color:#64748b; font-size:0.75rem; font-weight:normal;">${constraintText}</span></div>
                    </div>
                    <div>
                        <div class="preview-swatch" style="background: ${mixedHex};"></div>
                        <div style="font-size: 0.8rem; text-align:center; margin-top:6px; font-weight:600;">模擬疊印</div>
                    </div>
                    <div style="flex-grow: 1; padding-left: 1rem;">
        `;

        combo.forEach((ink, idx) => {
            let pct = Math.round(r.weights[idx] * 100);
            if(pct > 0) {
                // 自動判斷長條圖文字顏色對比
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
                document.getElementById('img-preview-container').style.display = 'none';
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
                    document.getElementById('img-preview-container').style.display = 'flex';
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
    }
});

function extractDominantColors() {
    const btn = document.getElementById('extract-btn');
    const originalText = btn.innerText;
    btn.innerText = "分析中...";
    btn.disabled = true;

    // 動態讀取當前的目標色彩數量 (Max 20)
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

            if (colorMap.has(key)) {
                colorMap.get(key).count++;
            } else {
                colorMap.set(key, { r: rBin, g: gBin, b: bBin, count: 1 });
            }
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
                    const sqDist = Math.pow(candidate.r - selected.r, 2) + 
                                   Math.pow(candidate.g - selected.g, 2) + 
                                   Math.pow(candidate.b - selected.b, 2);
                    
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

        // 更新色票並存入 State Array
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
                setTimeout(() => box.style.backgroundColor = "#f8fafc", 300);
            }
        });
        
        // 將分析結果同步存入陣列，避免被其他操作洗掉
        saveTargetStates();

        btn.innerText = originalText;
        btn.disabled = false;
    }, 50);
}