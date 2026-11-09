import { soundEngine } from '../core/sound.js';

export function renderClockView(container, state, onUpdate) {
  if (!container) return;

  // 1. 初始化資料狀態
  if (state.is12Hour === undefined) state.is12Hour = true;
  if (state.showNotebook === undefined) state.showNotebook = false;
  if (state.showBulletin === undefined) state.showBulletin = false;
  if (state.notebookFontSize === undefined) state.notebookFontSize = 28;
  if (state.bulletinFontSize === undefined) state.bulletinFontSize = 32;
  if (!state.bulletinText) state.bulletinText = '';
  if (!state.notebookLines || state.notebookLines.length === 0) {
    state.notebookLines = [''];
  }

  // 2. 時間與 AM/PM 計算
  const now = new Date();
  const hours24 = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  let displayHours = hours24;
  let ampmStr = '';
  if (state.is12Hour) {
    ampmStr = hours24 >= 12 ? 'PM' : 'AM';
    displayHours = hours24 % 12 || 12;
  }

  const hoursStr = String(displayHours).padStart(2, '0');
  const timeStr = `${hoursStr}:${minutes}:${seconds}`;
  const dateStr = `${now.getFullYear()} 年 ${String(now.getMonth() + 1).padStart(2, '0')} 月 ${String(now.getDate()).padStart(2, '0')} 日 (${['星期日','星期一','星期二','星期三','星期四','星期五','星期六'][now.getDay()]})`;

  // 3. 首次繪製 UI 結構
  const clockEl = container.querySelector('#clockDisplay');
  if (!clockEl) {
    container.innerHTML = `
      <div class="w-full h-full flex items-center justify-center p-2 sm:p-4">
        <div id="mainLayout" class="w-full max-w-7xl h-[84vh] flex items-stretch justify-between gap-6 transition-all duration-300">
          
          <!-- 左側區域 (時鐘 + 控制鈕 + 向上擴展的小公佈欄) -->
          <div id="leftSection" class="flex-1 flex flex-col items-center justify-end transition-all duration-300 py-2 relative">
            
            <!-- 上半部：時鐘與日期 -->
            <div class="flex-1 flex flex-col items-center justify-center text-center my-auto">
              <div class="flex items-baseline justify-center gap-3 whitespace-nowrap mb-2">
                <div id="clockDisplay" class="${state.showNotebook ? 'text-5xl lg:text-7xl' : 'text-8xl sm:text-9xl'} font-extrabold tracking-tight text-slate-900 dark:text-slate-100 font-mono select-none transition-all duration-300">
                  ${timeStr}
                </div>
                <div id="ampmDisplay" class="${state.is12Hour ? 'inline-block' : 'hidden'} ${state.showNotebook ? 'text-2xl lg:text-3xl' : 'text-4xl sm:text-5xl'} font-bold text-cyan-600 dark:text-cyan-400 font-mono">
                  ${ampmStr}
                </div>
              </div>

              <div id="dateDisplay" class="${state.showNotebook ? 'text-lg lg:text-xl' : 'text-2xl sm:text-3xl'} text-slate-700 dark:text-slate-300 mb-6 font-medium transition-all duration-300">
                ${dateStr}
              </div>
              
              <!-- 控制按鈕組 (12hr | 公佈欄 | 聯絡簿) -->
              <div class="flex items-center gap-3 sm:gap-4">
                <button id="toggleFormatBtn" class="touch-btn bg-slate-300 hover:bg-slate-400 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 text-base sm:text-lg px-5 py-2.5 rounded-2xl shadow cursor-pointer font-bold transition-all">
                  ${state.is12Hour ? '12hr' : '24hr'}
                </button>
                <button id="toggleBulletinBtn" class="touch-btn ${state.showBulletin ? 'bg-amber-600 text-white' : 'bg-slate-300 hover:bg-slate-400 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100'} text-base sm:text-lg px-5 py-2.5 rounded-2xl shadow cursor-pointer font-bold transition-all">
                  公佈欄
                </button>
                <button id="toggleNotebookBtn" class="touch-btn ${state.showNotebook ? 'bg-cyan-600 text-white' : 'bg-slate-300 hover:bg-slate-400 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100'} text-base sm:text-lg px-5 py-2.5 rounded-2xl shadow cursor-pointer font-bold transition-all">
                  聯絡簿
                </button>
              </div>
            </div>

            <!-- 下半部：小公佈欄卡片 -->
            <div id="bulletinCard" class="${state.showBulletin ? 'flex' : 'hidden'} w-full max-w-xl bg-slate-600/95 dark:bg-slate-700/95 text-white p-6 rounded-3xl shadow-xl flex-col gap-3 mt-4 border-2 border-slate-500/50 transition-all duration-300 shrink-0">
              
              <div class="flex justify-between items-center border-b border-slate-400/40 pb-3 shrink-0">
                <span class="text-xl font-bold tracking-wider flex items-center gap-2">公佈欄</span>
                
                <div class="flex items-center gap-2 bg-slate-700/60 px-3 py-1.5 rounded-xl border border-slate-500/40">
                  <span class="text-xs font-bold text-slate-300">字體大小</span>
                  <input type="range" id="bulletinFontSlider" min="20" max="60" value="${state.bulletinFontSize}" class="w-28 accent-amber-400 cursor-pointer">
                </div>
              </div>

              <textarea 
                id="bulletinInput" 
                class="w-full bg-transparent border-none outline-none font-bold leading-relaxed tracking-wide placeholder-slate-300 resize-none overflow-hidden"
                style="font-size: ${state.bulletinFontSize}px;"
                placeholder="請在此輸入..."
              >${state.bulletinText}</textarea>
            </div>

          </div>

          <!-- 右側聯絡簿區域 -->
          <div id="notebookSection" class="${state.showNotebook ? 'flex' : 'hidden'} flex-1 h-full bg-slate-200/95 dark:bg-slate-800/95 rounded-3xl border-2 border-slate-300 dark:border-slate-700 p-6 flex-col items-center shadow-2xl transition-all duration-300 overflow-hidden relative">
            
            <!-- 標題與字體調節桿 -->
            <div class="w-full flex justify-between items-center border-b-2 border-slate-400 dark:border-slate-600 pb-3 mb-4 shrink-0">
              <h2 class="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-widest">
                今日聯絡簿
              </h2>

              <div class="flex items-center gap-2 bg-slate-300/80 dark:bg-slate-700/80 px-3 py-1.5 rounded-xl border border-slate-400/50">
                <span class="text-xs font-bold text-slate-700 dark:text-slate-300">字體大小</span>
                <input type="range" id="nbFontSlider" min="20" max="60" value="${state.notebookFontSize}" class="w-28 accent-cyan-600 cursor-pointer">
              </div>
            </div>

            <!-- 動態聯絡簿列表區 -->
            <div id="notebookScrollArea" class="w-full flex-1 flex flex-col gap-4 overflow-hidden relative">
              <div id="notebookContainer" class="w-full flex flex-col gap-4">
                ${renderNotebookItems(state.notebookLines, state.notebookFontSize)}
              </div>
            </div>

          </div>

        </div>
      </div>
    `;

    // 4. 事件綁定：12/24 小時制切換
    const toggleFormatBtn = container.querySelector('#toggleFormatBtn');
    if (toggleFormatBtn) {
      toggleFormatBtn.addEventListener('click', () => {
        soundEngine.playBeep(600);
        state.is12Hour = !state.is12Hour;
        toggleFormatBtn.textContent = state.is12Hour ? '12hr' : '24hr';
        
        const ampmDisplay = container.querySelector('#ampmDisplay');
        if (ampmDisplay) {
          ampmDisplay.classList.toggle('hidden', !state.is12Hour);
          ampmDisplay.classList.toggle('inline-block', state.is12Hour);
        }
        onUpdate(state);
      });
    }

    // 5. 事件綁定：小公佈欄開啟/關閉切換
    const toggleBulletinBtn = container.querySelector('#toggleBulletinBtn');
    const bulletinCard = container.querySelector('#bulletinCard');
    if (toggleBulletinBtn && bulletinCard) {
      toggleBulletinBtn.addEventListener('click', () => {
        soundEngine.playBeep(520);
        state.showBulletin = !state.showBulletin;
        bulletinCard.classList.toggle('hidden', !state.showBulletin);
        bulletinCard.classList.toggle('flex', state.showBulletin);
        toggleBulletinBtn.className = `touch-btn ${state.showBulletin ? 'bg-amber-600 text-white' : 'bg-slate-300 hover:bg-slate-400 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100'} text-base sm:text-lg px-5 py-2.5 rounded-2xl shadow cursor-pointer font-bold transition-all`;
        
        const bInput = container.querySelector('#bulletinInput');
        if (bInput && state.showBulletin) {
          bInput.style.height = 'auto';
          bInput.style.height = Math.max(140, bInput.scrollHeight) + 'px';
        }
        onUpdate(state);
      });
    }

    // 6. 公佈欄自動撐高高度
    const bulletinFontSlider = container.querySelector('#bulletinFontSlider');
    const bulletinInput = container.querySelector('#bulletinInput');
    if (bulletinFontSlider && bulletinInput) {
      const resizeBulletin = () => {
        bulletinInput.style.height = 'auto';
        bulletinInput.style.height = Math.max(140, bulletinInput.scrollHeight) + 'px';
      };

      bulletinFontSlider.addEventListener('input', (e) => {
        const size = parseInt(e.target.value, 10);
        state.bulletinFontSize = size;
        bulletinInput.style.fontSize = `${size}px`;
        resizeBulletin();
        onUpdate(state);
      });

      bulletinInput.addEventListener('input', (e) => {
        state.bulletinText = e.target.value;
        resizeBulletin();
        onUpdate(state);
      });
      
      setTimeout(resizeBulletin, 50);
    }

    // 7. 事件綁定：聯絡簿開啟/關閉切換
    const toggleNotebookBtn = container.querySelector('#toggleNotebookBtn');
    const notebookSection = container.querySelector('#notebookSection');
    if (toggleNotebookBtn && notebookSection) {
      toggleNotebookBtn.addEventListener('click', () => {
        soundEngine.playBeep(480);
        state.showNotebook = !state.showNotebook;
        
        const clockDisplay = container.querySelector('#clockDisplay');
        const ampmDisplay = container.querySelector('#ampmDisplay');
        const dateDisplay = container.querySelector('#dateDisplay');

        if (state.showNotebook) {
          notebookSection.classList.remove('hidden');
          notebookSection.classList.add('flex');
          if (clockDisplay) clockDisplay.className = 'text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 font-mono select-none transition-all duration-300';
          if (ampmDisplay) ampmDisplay.className = `${state.is12Hour ? 'inline-block' : 'hidden'} text-2xl lg:text-3xl font-bold text-cyan-600 dark:text-cyan-400 font-mono`;
          if (dateDisplay) dateDisplay.className = 'text-lg lg:text-xl text-slate-700 dark:text-slate-300 mb-6 font-medium transition-all duration-300';
        } else {
          notebookSection.classList.add('hidden');
          notebookSection.classList.remove('flex');
          if (clockDisplay) clockDisplay.className = 'text-8xl sm:text-9xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 font-mono select-none transition-all duration-300';
          if (ampmDisplay) ampmDisplay.className = `${state.is12Hour ? 'inline-block' : 'hidden'} text-4xl sm:text-5xl font-bold text-cyan-400 font-mono`;
          if (dateDisplay) dateDisplay.className = 'text-2xl sm:text-3xl text-slate-700 dark:text-slate-300 mb-6 font-medium transition-all duration-300';
        }
        toggleNotebookBtn.className = `touch-btn ${state.showNotebook ? 'bg-cyan-600 text-white' : 'bg-slate-300 hover:bg-slate-400 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100'} text-base sm:text-lg px-5 py-2.5 rounded-2xl shadow cursor-pointer font-bold transition-all`;
        
        // 點開聯絡簿時立即強制執行一次事件綁定與高度/按鈕檢查
        bindNotebookEvents(container, state, onUpdate);
        onUpdate(state);
      });
    }

    // 8. 事件綁定：聯絡簿字體 Slider
    const nbFontSlider = container.querySelector('#nbFontSlider');
    if (nbFontSlider) {
      nbFontSlider.addEventListener('input', (e) => {
        const size = parseInt(e.target.value, 10);
        state.notebookFontSize = size;
        
        container.querySelectorAll('.nb-line').forEach(input => {
          input.style.fontSize = `${size}px`;
          input.style.height = 'auto';
          input.style.height = input.scrollHeight + 'px';
        });
        container.querySelectorAll('.nb-num').forEach(num => {
          num.style.fontSize = `${size}px`;
        });
        checkNotebookLimit(container);
        onUpdate(state);
      });
    }

    // 9. 關鍵修正：首次建立 DOM 時，立刻綁定事件並強制計算撐高與限制
    bindNotebookEvents(container, state, onUpdate);

  } else {
    // 10. 每秒增量更新時間與 AM/PM
    clockEl.textContent = timeStr;
    const ampmEl = container.querySelector('#ampmDisplay');
    if (ampmEl) ampmEl.textContent = ampmStr;
    const dateEl = container.querySelector('#dateDisplay');
    if (dateEl) dateEl.textContent = dateStr;
  }
}

// 輔助函式：產生聯絡簿 HTML 結構
function renderNotebookItems(lines, fontSize) {
  let html = lines.map((text, idx) => `
    <div class="w-full flex items-start gap-3 border-b-2 border-dashed border-slate-400 dark:border-slate-500 pb-3 shrink-0">
      <span class="nb-num font-black text-cyan-700 dark:text-cyan-400 font-mono text-right shrink-0 pt-0.5" style="font-size: ${fontSize}px;">
        ${idx + 1}.
      </span>
      <textarea 
        data-idx="${idx}"
        rows="1"
        class="nb-line flex-1 bg-transparent border-none outline-none font-bold text-slate-900 dark:text-slate-100 font-sans tracking-wide placeholder-slate-400 dark:placeholder-slate-500 resize-none overflow-hidden leading-snug"
        style="font-size: ${fontSize}px;"
        placeholder="點擊輸入第 ${idx + 1} 項..."
      >${text || ''}</textarea>
      ${lines.length > 1 ? `
        <button data-delete-idx="${idx}" class="del-btn text-slate-400 hover:text-rose-500 p-1 font-bold transition-colors cursor-pointer text-xl" title="刪除此項">
          ✕
        </button>
      ` : ''}
    </div>
  `).join('');

  html += `
    <button id="addNotebookItemBtn" class="w-full py-3 mt-1 rounded-2xl border-2 border-dashed border-cyan-500/60 dark:border-cyan-400/50 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-bold text-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm shrink-0">
      ➕ 新增事項
    </button>
  `;
  return html;
}

// 檢測聯絡簿高度是否碰觸/超過底邊
function checkNotebookLimit(container) {
  const scrollArea = container.querySelector('#notebookScrollArea');
  const nbContainer = container.querySelector('#notebookContainer');
  const addBtn = container.querySelector('#addNotebookItemBtn');
  if (!scrollArea || !nbContainer || !addBtn) return;

  const availableHeight = scrollArea.clientHeight;
  const contentHeight = nbContainer.scrollHeight;

  if (contentHeight >= availableHeight - 10) {
    addBtn.style.display = 'none';
  } else {
    addBtn.style.display = 'flex';
  }
}

// 輔助函式：動態綁定聯絡簿事件
function bindNotebookEvents(container, state, onUpdate) {
  const nbContainer = container.querySelector('#notebookContainer');
  if (!nbContainer) return;

  const autoResize = (el) => {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  };

  nbContainer.querySelectorAll('.nb-line').forEach(textarea => {
    autoResize(textarea);
    textarea.addEventListener('input', (e) => {
      autoResize(e.target);
      const idx = parseInt(e.target.dataset.idx, 10);
      state.notebookLines[idx] = e.target.value;
      checkNotebookLimit(container);
      onUpdate(state);
    });
  });

  const addBtn = nbContainer.querySelector('#addNotebookItemBtn');
  if (addBtn) {
    addBtn.onclick = () => {
      soundEngine.playBeep(640);
      state.notebookLines.push('');
      nbContainer.innerHTML = renderNotebookItems(state.notebookLines, state.notebookFontSize);
      bindNotebookEvents(container, state, onUpdate);
      onUpdate(state);
    };
  }

  nbContainer.querySelectorAll('.del-btn').forEach(btn => {
    btn.onclick = (e) => {
      soundEngine.playBeep(300);
      const delIdx = parseInt(e.currentTarget.dataset.deleteIdx, 10);
      state.notebookLines.splice(delIdx, 1);
      nbContainer.innerHTML = renderNotebookItems(state.notebookLines, state.notebookFontSize);
      bindNotebookEvents(container, state, onUpdate);
      onUpdate(state);
    };
  });

  setTimeout(() => checkNotebookLimit(container), 50);
}