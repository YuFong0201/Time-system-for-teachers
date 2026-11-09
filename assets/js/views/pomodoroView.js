import { soundEngine } from '../core/sound.js';

let timerId = null;
let toastTimeoutId = null;

// 專屬動畫與極簡 Icon 樣式
if (!document.getElementById('pomo-animation-styles')) {
  const styleEl = document.createElement('style');
  styleEl.id = 'pomo-animation-styles';
  styleEl.innerHTML = `
    @keyframes pomoShake {
      0% { transform: scale(1.05) translate(0, 0) rotate(0deg); }
      20% { transform: scale(1.07) translate(-3px, 2px) rotate(-1deg); }
      40% { transform: scale(1.09) translate(3px, -2px) rotate(1deg); }
      60% { transform: scale(1.11) translate(-3px, -2px) rotate(-1deg); }
      80% { transform: scale(1.13) translate(3px, 2px) rotate(1deg); }
      100% { transform: scale(1.15) translate(0, 0) rotate(0deg); }
    }
    @keyframes pomoExplodeInstant {
      0% { transform: scale(1); }
      30% { transform: scale(1.45); filter: brightness(1.3); }
      60% { transform: scale(0.92); }
      100% { transform: scale(1); }
    }
    .animate-pomo-shake {
      animation: pomoShake 0.4s infinite ease-in-out alternate;
    }
    .animate-pomo-explode {
      animation: pomoExplodeInstant 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    }
  `;
  document.head.appendChild(styleEl);
}

// SVG 極簡 Icon 庫
const icons = {
  play: `<svg class="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`,
  pause: `<svg class="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`,
  reset: `<svg class="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`,
  focus: `<svg class="w-7 h-7 fill-none stroke-current stroke-2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
  break: `<svg class="w-7 h-7 fill-none stroke-current stroke-2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/></svg>`,
  rounds: `<svg class="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`
};

export function renderPomodoroView(container, state, onUpdate) {
  if (!container) return;

  // 1. 初始化預設資料
  if (state.pomoFocusMins === undefined) state.pomoFocusMins = 25;
  if (state.pomoBreakMins === undefined) state.pomoBreakMins = 5;
  if (state.pomoTotalRounds === undefined) state.pomoTotalRounds = 4;
  if (state.pomoCurrentRound === undefined) state.pomoCurrentRound = 1;
  if (state.pomoMode === undefined) state.pomoMode = 'focus';
  if (state.pomoIsRunning === undefined) state.pomoIsRunning = false;
  if (state.pomoRemainingSecs === undefined) {
    state.pomoRemainingSecs = state.pomoFocusMins * 60;
  }

  const formatTime = (secs) => {
    const m = String(Math.floor(secs / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  const getTargetSecs = () => {
    return (state.pomoMode === 'focus' ? state.pomoFocusMins : state.pomoBreakMins) * 60;
  };

  const pomoTimeDisplay = container.querySelector('#pomoTimeDisplay');

  // 2. 首次載入 DOM 結構
  if (!pomoTimeDisplay) {
    container.innerHTML = `
      <div class="w-full max-w-4xl h-full flex flex-col items-center justify-center p-4 select-none my-auto">
        
        <!-- 主卡片區域 -->
        <div class="w-full bg-slate-200/90 dark:bg-slate-800/90 rounded-3xl border-2 border-slate-300 dark:border-slate-700 p-6 sm:p-8 flex flex-col items-center shadow-2xl transition-colors relative">
          
          <!-- 上方極簡標題與輪次標籤 -->
          <div class="flex items-center gap-3 mb-6">
            <span id="pomoHeaderIcon" class="${state.pomoMode === 'focus' ? 'text-cyan-600 dark:text-cyan-400' : 'text-amber-600 dark:text-amber-400'}">
              ${state.pomoMode === 'focus' ? icons.focus : icons.break}
            </span>
            <h2 id="pomoHeaderTitle" class="text-4xl font-extrabold tracking-wider ${state.pomoMode === 'focus' ? 'text-cyan-600 dark:text-cyan-400' : 'text-amber-600 dark:text-amber-400'}">
              ${state.pomoMode === 'focus' ? '專注中' : '放鬆一下'}
            </h2>
            <span id="pomoModeBadge" class="px-4 py-1.5 rounded-2xl text-base font-bold text-white shadow-sm ${state.pomoMode === 'focus' ? 'bg-cyan-600' : 'bg-amber-600'}">
              第 ${state.pomoCurrentRound} / ${state.pomoTotalRounds} 輪
            </span>
          </div>

          <!-- 全輪次進度條 -->
          <div class="w-full max-w-2xl bg-slate-300 dark:bg-slate-700/80 p-3 rounded-2xl mb-6 shadow-inner flex flex-col gap-2">
            <div class="flex justify-between items-center text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 px-1">
              <span>輪次總進度</span>
              <span id="roundProgressText">第 ${state.pomoCurrentRound} / ${state.pomoTotalRounds} 輪</span>
            </div>
            <div id="roundsProgressBar" class="w-full flex items-center gap-1.5 h-4">
              ${renderRoundsProgressBar(state)}
            </div>
          </div>

          <!-- 圓形 SVG 進度圖形區域 + 5秒極簡文字氣泡通知 -->
          <div id="pomoTimerWrapper" class="relative flex items-center justify-center my-2 transition-all duration-300">
            
            <!-- 5 秒無障礙文字通知氣泡 (頂部淡入淡出) -->
            <div 
              id="pomoNotificationToast" 
              class="absolute -top-12 z-20 opacity-0 pointer-events-none transition-all duration-300 bg-slate-900/90 text-white px-5 py-2 rounded-2xl text-base font-bold shadow-xl border border-slate-700/50 flex items-center gap-2 whitespace-nowrap backdrop-blur-sm"
            >
              <span id="toastMsg">時間到！</span>
            </div>

            <svg class="w-64 h-64 sm:w-72 sm:h-72 transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" stroke-width="8" class="stroke-slate-300 dark:stroke-slate-700 fill-none" />
              <circle 
                id="pomoProgressRing" 
                cx="50" cy="50" r="42" 
                stroke-width="8" 
                stroke-dasharray="263.89" 
                stroke-dashoffset="0" 
                stroke-linecap="round"
                class="stroke-cyan-500 transition-all duration-300 fill-none" 
              />
            </svg>

            <div class="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
              <div 
                id="pomoTimeDisplay" 
                class="text-6xl sm:text-7xl font-extrabold font-mono text-slate-900 dark:text-slate-100 tracking-tight"
              >
                ${formatTime(state.pomoRemainingSecs)}
              </div>
            </div>
          </div>

          <!-- 3 組滑塊控制項 -->
          <div class="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-3 gap-4 my-6 bg-slate-100/70 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-300/60 dark:border-slate-700/60">
            
            <!-- 專注時間 -->
            <div class="flex flex-col gap-1.5">
              <div class="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span class="flex items-center gap-1">專注時間</span>
                <span id="focusVal" class="text-cyan-600 dark:text-cyan-400 font-mono">${state.pomoFocusMins} 分</span>
              </div>
              <input type="range" id="focusSlider" min="5" max="60" step="5" value="${state.pomoFocusMins}" class="w-full accent-cyan-600 cursor-pointer">
            </div>

            <!-- 休息時間 -->
            <div class="flex flex-col gap-1.5">
              <div class="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span class="flex items-center gap-1">休息時間</span>
                <span id="breakVal" class="text-amber-600 dark:text-amber-400 font-mono">${state.pomoBreakMins} 分</span>
              </div>
              <input type="range" id="breakSlider" min="1" max="30" step="1" value="${state.pomoBreakMins}" class="w-full accent-amber-500 cursor-pointer">
            </div>

            <!-- 總輪次 -->
            <div class="flex flex-col gap-1.5">
              <div class="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span class="flex items-center gap-1">總輪次</span>
                <span id="roundsVal" class="text-emerald-600 dark:text-emerald-400 font-mono">${state.pomoTotalRounds} 輪</span>
              </div>
              <input type="range" id="roundsSlider" min="1" max="10" step="1" value="${state.pomoTotalRounds}" class="w-full accent-emerald-500 cursor-pointer">
            </div>

          </div>

          <!-- 極簡 Icon 控制按鈕組 -->
          <div class="flex items-center gap-4">
            <button id="pomoStartBtn" class="touch-btn ${state.pomoIsRunning ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500'} text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg cursor-pointer text-2xl transition-all min-w-[150px] flex items-center justify-center gap-2">
              ${state.pomoIsRunning ? icons.pause : icons.play}
              <span>${state.pomoIsRunning ? '暫停' : '開始'}</span>
            </button>
            
            <button id="pomoResetBtn" class="touch-btn bg-slate-400 hover:bg-slate-500 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 font-bold px-6 py-3.5 rounded-2xl shadow cursor-pointer text-xl transition-all flex items-center justify-center gap-2">
              ${icons.reset}
              <span>重設</span>
            </button>
          </div>

        </div>

      </div>
    `;

    bindPomoEvents(container, state, onUpdate, getTargetSecs, formatTime);
  }

  // 3. UI 更新
  updatePomoUI(container, state, getTargetSecs, formatTime);

  // 4. 背景倒數銜接
  if (state.pomoIsRunning && !timerId) {
    startPomoTimer(container, state, onUpdate, getTargetSecs, formatTime);
  }
}

// 顯示時鐘正上方 5 秒自動消失的簡潔文字 Toast 通知
function showNotificationToast(container, message) {
  const toast = container.querySelector('#pomoNotificationToast');
  const msgEl = container.querySelector('#toastMsg');
  if (!toast || !msgEl) return;

  if (toastTimeoutId) clearTimeout(toastTimeoutId);

  msgEl.textContent = message;
  toast.classList.remove('opacity-0', '-top-12');
  toast.classList.add('opacity-100', '-top-14');

  toastTimeoutId = setTimeout(() => {
    toast.classList.remove('opacity-100', '-top-14');
    toast.classList.add('opacity-0', '-top-12');
  }, 5000);
}

// 畫面 UI 更新主函式
function updatePomoUI(container, state, getTargetSecs, formatTime) {
  const timeDisplay = container.querySelector('#pomoTimeDisplay');
  const progressRing = container.querySelector('#pomoProgressRing');
  const timerWrapper = container.querySelector('#pomoTimerWrapper');
  const roundsProgressBar = container.querySelector('#roundsProgressBar');
  const roundProgressText = container.querySelector('#roundProgressText');
  const pomoHeaderTitle = container.querySelector('#pomoHeaderTitle');
  const pomoHeaderIcon = container.querySelector('#pomoHeaderIcon');
  const pomoModeBadge = container.querySelector('#pomoModeBadge');

  if (timeDisplay) timeDisplay.textContent = formatTime(state.pomoRemainingSecs);

  const totalSecs = getTargetSecs();
  const ratio = totalSecs > 0 ? state.pomoRemainingSecs / totalSecs : 0;
  const circumference = 263.89;

  if (progressRing) {
    const offset = circumference - ratio * circumference;
    progressRing.style.strokeDashoffset = offset;

    if (state.pomoMode === 'focus') {
      if (ratio > 0.3) {
        progressRing.setAttribute('class', 'stroke-cyan-500 transition-all duration-300 fill-none');
        if (timeDisplay) timeDisplay.className = 'text-6xl sm:text-7xl font-extrabold font-mono text-slate-900 dark:text-slate-100 tracking-tight';
      } else if (ratio > 0.15) {
        progressRing.setAttribute('class', 'stroke-amber-500 transition-all duration-300 fill-none');
        if (timeDisplay) timeDisplay.className = 'text-6xl sm:text-7xl font-extrabold font-mono text-amber-600 dark:text-amber-400 tracking-tight';
      } else {
        progressRing.setAttribute('class', 'stroke-rose-500 transition-all duration-300 fill-none');
        if (timeDisplay) timeDisplay.className = 'text-6xl sm:text-7xl font-extrabold font-mono text-rose-600 dark:text-rose-400 tracking-tight';
      }
    } else {
      progressRing.setAttribute('class', 'stroke-amber-500 transition-all duration-300 fill-none');
      if (timeDisplay) timeDisplay.className = 'text-6xl sm:text-7xl font-extrabold font-mono text-amber-600 dark:text-amber-400 tracking-tight';
    }
  }

  if (timerWrapper) {
    if (state.pomoIsRunning && state.pomoRemainingSecs <= 10 && state.pomoRemainingSecs > 0) {
      timerWrapper.classList.add('animate-pomo-shake');
    } else {
      timerWrapper.classList.remove('animate-pomo-shake');
    }
  }

  if (roundsProgressBar) {
    roundsProgressBar.innerHTML = renderRoundsProgressBar(state);
  }
  if (roundProgressText) {
    roundProgressText.textContent = `第 ${state.pomoCurrentRound} / ${state.pomoTotalRounds} 輪`;
  }

  if (pomoHeaderTitle) {
    pomoHeaderTitle.textContent = state.pomoMode === 'focus' ? '專注中' : '放鬆一下';
    pomoHeaderTitle.className = `text-4xl font-extrabold tracking-wider ${state.pomoMode === 'focus' ? 'text-cyan-600 dark:text-cyan-400' : 'text-amber-600 dark:text-amber-400'}`;
  }
  if (pomoHeaderIcon) {
    pomoHeaderIcon.innerHTML = state.pomoMode === 'focus' ? icons.focus : icons.break;
    pomoHeaderIcon.className = state.pomoMode === 'focus' ? 'text-cyan-600 dark:text-cyan-400' : 'text-amber-600 dark:text-amber-400';
  }
  if (pomoModeBadge) {
    pomoModeBadge.className = `px-4 py-1.5 rounded-2xl text-base font-bold text-white shadow-sm ${state.pomoMode === 'focus' ? 'bg-cyan-600' : 'bg-amber-600'}`;
    pomoModeBadge.textContent = `第 ${state.pomoCurrentRound} / ${state.pomoTotalRounds} 輪`;
  }
}

// 開始計時邏輯 (使用 Toast 文字取代彈窗)
function startPomoTimer(container, state, onUpdate, getTargetSecs, formatTime) {
  if (timerId) clearInterval(timerId);

  timerId = setInterval(() => {
    if (state.pomoIsRunning) {
      if (state.pomoRemainingSecs > 0) {
        state.pomoRemainingSecs--;
        updatePomoUI(container, state, getTargetSecs, formatTime);
        if (state.pomoRemainingSecs <= 5) soundEngine.playBeep(700, 'sine', 0.15);
      } else {
        // 歸零爆發動畫
        const timerWrapper = container.querySelector('#pomoTimerWrapper');
        if (timerWrapper) {
          timerWrapper.classList.remove('animate-pomo-shake');
          void timerWrapper.offsetWidth;
          timerWrapper.classList.add('animate-pomo-explode');
          setTimeout(() => timerWrapper.classList.remove('animate-pomo-explode'), 650);
        }
        soundEngine.playBeep(880, 'sine', 0.8);

        // 輪次與模式切換
        if (state.pomoMode === 'focus') {
          state.pomoMode = 'break';
          state.pomoRemainingSecs = state.pomoBreakMins * 60;
          showNotificationToast(container, `✨ 第 ${state.pomoCurrentRound} 輪專注結束！請好好休息一下`);
        } else {
          if (state.pomoCurrentRound < state.pomoTotalRounds) {
            state.pomoCurrentRound++;
            state.pomoMode = 'focus';
            state.pomoRemainingSecs = state.pomoFocusMins * 60;
            showNotificationToast(container, `🔔 休息結束！準備開始第 ${state.pomoCurrentRound} 輪專注`);
          } else {
            state.pomoIsRunning = false;
            clearInterval(timerId);
            timerId = null;
            const startBtn = container.querySelector('#pomoStartBtn');
            if (startBtn) {
              startBtn.innerHTML = `${icons.play}<span>開始</span>`;
              startBtn.className = 'touch-btn bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg cursor-pointer text-2xl transition-all min-w-[150px] flex items-center justify-center gap-2';
            }
            showNotificationToast(container, '🏆 恭喜您完成了全套番茄鐘專注計畫！');
          }
        }
        updatePomoUI(container, state, getTargetSecs, formatTime);
      }
      onUpdate(state);
    }
  }, 1000);
}

// 綁定事件
function bindPomoEvents(container, state, onUpdate, getTargetSecs, formatTime) {
  const pomoStartBtn = container.querySelector('#pomoStartBtn');
  const pomoResetBtn = container.querySelector('#pomoResetBtn');

  const focusSlider = container.querySelector('#focusSlider');
  const breakSlider = container.querySelector('#breakSlider');
  const roundsSlider = container.querySelector('#roundsSlider');

  if (pomoStartBtn) {
    pomoStartBtn.addEventListener('click', () => {
      soundEngine.playBeep(520);
      state.pomoIsRunning = !state.pomoIsRunning;

      if (state.pomoIsRunning) {
        pomoStartBtn.innerHTML = `${icons.pause}<span>暫停</span>`;
        pomoStartBtn.className = 'touch-btn bg-amber-600 hover:bg-amber-500 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg cursor-pointer text-2xl transition-all min-w-[150px] flex items-center justify-center gap-2';
        startPomoTimer(container, state, onUpdate, getTargetSecs, formatTime);
      } else {
        if (timerId) {
          clearInterval(timerId);
          timerId = null;
        }
        pomoStartBtn.innerHTML = `${icons.play}<span>開始</span>`;
        pomoStartBtn.className = 'touch-btn bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg cursor-pointer text-2xl transition-all min-w-[150px] flex items-center justify-center gap-2';
        updatePomoUI(container, state, getTargetSecs, formatTime);
      }
      onUpdate(state);
    });
  }

  if (pomoResetBtn) {
    pomoResetBtn.addEventListener('click', () => {
      soundEngine.playBeep(400);
      if (timerId) {
        clearInterval(timerId);
        timerId = null;
      }
      state.pomoIsRunning = false;
      state.pomoCurrentRound = 1;
      state.pomoMode = 'focus';
      state.pomoRemainingSecs = state.pomoFocusMins * 60;

      if (pomoStartBtn) {
        pomoStartBtn.innerHTML = `${icons.play}<span>開始</span>`;
        pomoStartBtn.className = 'touch-btn bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg cursor-pointer text-2xl transition-all min-w-[150px] flex items-center justify-center gap-2';
      }

      updatePomoUI(container, state, getTargetSecs, formatTime);
      onUpdate(state);
    });
  }

  if (focusSlider) {
    focusSlider.addEventListener('input', (e) => {
      state.pomoFocusMins = parseInt(e.target.value, 10);
      container.querySelector('#focusVal').textContent = `${state.pomoFocusMins} 分`;
      if (!state.pomoIsRunning && state.pomoMode === 'focus') {
        state.pomoRemainingSecs = state.pomoFocusMins * 60;
        updatePomoUI(container, state, getTargetSecs, formatTime);
      }
      onUpdate(state);
    });
  }

  if (breakSlider) {
    breakSlider.addEventListener('input', (e) => {
      state.pomoBreakMins = parseInt(e.target.value, 10);
      container.querySelector('#breakVal').textContent = `${state.pomoBreakMins} 分`;
      if (!state.pomoIsRunning && state.pomoMode === 'break') {
        state.pomoRemainingSecs = state.pomoBreakMins * 60;
        updatePomoUI(container, state, getTargetSecs, formatTime);
      }
      onUpdate(state);
    });
  }

  if (roundsSlider) {
    roundsSlider.addEventListener('input', (e) => {
      state.pomoTotalRounds = parseInt(e.target.value, 10);
      state.pomoCurrentRound = Math.min(state.pomoCurrentRound, state.pomoTotalRounds);
      container.querySelector('#roundsVal').textContent = `${state.pomoTotalRounds} 輪`;
      updatePomoUI(container, state, getTargetSecs, formatTime);
      onUpdate(state);
    });
  }
}

// 產生輪次進度條
function renderRoundsProgressBar(state) {
  const total = state.pomoTotalRounds;
  const curr = state.pomoCurrentRound;
  
  let html = '';
  for (let i = 1; i <= total; i++) {
    if (i < curr) {
      html += `<div class="flex-1 h-full bg-slate-400/50 dark:bg-slate-600/50 rounded-full transition-all" title="第 ${i} 輪已完成 (反灰)"></div>`;
    } else if (i === curr) {
      const activeColor = state.pomoMode === 'focus' ? 'bg-cyan-500 shadow-sm shadow-cyan-500/50' : 'bg-amber-500 shadow-sm shadow-amber-500/50';
      html += `<div class="flex-1 h-full ${activeColor} rounded-full transition-all ring-2 ring-cyan-300 dark:ring-cyan-600" title="第 ${i} 輪進行中"></div>`;
    } else {
      html += `<div class="flex-1 h-full bg-slate-100 dark:bg-slate-900/60 rounded-full transition-all" title="第 ${i} 輪未開始"></div>`;
    }
  }
  return html;
}