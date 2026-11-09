import { soundEngine } from '../core/sound.js';

let timerId = null;
let remainingSeconds = 0; // 當前時間 (秒)
let totalDuration = 0;     // 倒數時的總時間
let isRunning = false;
let isCountUp = false;      // 是否為正計時模式

// 極簡 SVG Icon 庫
const icons = {
  play: `<svg class="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`,
  pause: `<svg class="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`,
  reset: `<svg class="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`
};

// 插入動畫樣式
if (!document.getElementById('timer-animation-styles')) {
  const styleEl = document.createElement('style');
  styleEl.id = 'timer-animation-styles';
  styleEl.innerHTML = `
    @keyframes timerShake {
      0% { transform: scale(1.05) translate(0, 0) rotate(0deg); }
      20% { transform: scale(1.07) translate(-3px, 2px) rotate(-1deg); }
      40% { transform: scale(1.09) translate(3px, -2px) rotate(1deg); }
      60% { transform: scale(1.11) translate(-3px, -2px) rotate(-1deg); }
      80% { transform: scale(1.13) translate(3px, 2px) rotate(1deg); }
      100% { transform: scale(1.15) translate(0, 0) rotate(0deg); }
    }
    @keyframes timerExplodeInstant {
      0% { transform: scale(1); }
      30% { transform: scale(1.45); filter: brightness(1.3); }
      60% { transform: scale(0.92); }
      100% { transform: scale(1); }
    }
    .animate-timer-shake {
      animation: timerShake 0.4s infinite ease-in-out alternate;
    }
    .animate-timer-explode {
      animation: timerExplodeInstant 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    }
  `;
  document.head.appendChild(styleEl);
}

export function renderGroupView(container, state, onUpdate) {
  if (!container) return;

  const formatTime = (secs) => {
    const m = String(Math.floor(secs / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  container.innerHTML = `
    <div class="w-full max-w-4xl h-full flex flex-col items-center justify-center p-4 select-none my-auto">
      
      <!-- 主計時器卡片 -->
      <div class="w-full bg-slate-200/90 dark:bg-slate-800/90 rounded-3xl border-2 border-slate-300 dark:border-slate-700 p-8 flex flex-col items-center shadow-2xl transition-colors">
        
        <h2 class="text-3xl font-bold text-slate-700 dark:text-slate-300 mb-4 tracking-wider flex items-center gap-2">
          課堂計時器
        </h2>

        <!-- 圖形化圓形進度條 + 時間顯示區域 -->
        <div id="timerWrapper" class="relative flex items-center justify-center my-6 transition-all duration-300">
          
          <!-- SVG 圓環進度圖形 -->
          <svg class="w-72 h-72 sm:w-80 sm:h-80 transform -rotate-90" viewBox="0 0 100 100">
            <!-- 底環 -->
            <circle cx="50" cy="50" r="42" stroke-width="8" class="stroke-slate-300 dark:stroke-slate-700 fill-none" />
            <!-- 動態進度環 -->
            <circle 
              id="progressRing" 
              cx="50" cy="50" r="42" 
              stroke-width="8" 
              stroke-dasharray="263.89" 
              stroke-dashoffset="0" 
              stroke-linecap="round"
              class="stroke-cyan-500 transition-all duration-300 fill-none" 
            />
          </svg>

          <!-- 中央時間數字 -->
          <div class="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <div 
              id="simpleTimerDisplay" 
              class="text-6xl sm:text-7xl font-extrabold font-mono text-slate-900 dark:text-slate-100 tracking-tight"
            >
              ${formatTime(remainingSeconds)}
            </div>
          </div>

        </div>

        <!-- 快捷累加時間按鈕組 -->
        <div id="addTimeBtnGroup" class="flex items-center justify-center gap-2 sm:gap-3 my-4 flex-wrap">
          <button data-add-sec="10" class="add-time-btn px-4 py-2.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold rounded-xl shadow-sm transition-all cursor-pointer active:scale-95 text-base sm:text-lg">
            +10秒
          </button>
          <button data-add-sec="30" class="add-time-btn px-4 py-2.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold rounded-xl shadow-sm transition-all cursor-pointer active:scale-95 text-base sm:text-lg">
            +30秒
          </button>
          <button data-add-sec="60" class="add-time-btn px-4 py-2.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold rounded-xl shadow-sm transition-all cursor-pointer active:scale-95 text-base sm:text-lg">
            +1分
          </button>
          <button data-add-sec="300" class="add-time-btn px-4 py-2.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold rounded-xl shadow-sm transition-all cursor-pointer active:scale-95 text-base sm:text-lg">
            +5分
          </button>
          <button data-add-sec="600" class="add-time-btn px-4 py-2.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold rounded-xl shadow-sm transition-all cursor-pointer active:scale-95 text-base sm:text-lg">
            +10分
          </button>
        </div>

        <!-- 極簡 Icon 控制按鈕組 (開始/暫停、重設) -->
        <div class="flex items-center gap-4 mt-2">
          <button id="startTimerBtn" class="touch-btn ${isRunning ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500'} text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg cursor-pointer text-2xl transition-all min-w-[150px] flex items-center justify-center gap-2">
            ${isRunning ? icons.pause : icons.play}
            <span>${isRunning ? '暫停' : '開始'}</span>
          </button>
          
          <button id="resetTimerBtn" class="touch-btn bg-slate-400 hover:bg-slate-500 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 font-bold px-6 py-3.5 rounded-2xl shadow cursor-pointer text-xl transition-all flex items-center justify-center gap-2">
            ${icons.reset}
            <span>重設</span>
          </button>
        </div>

      </div>

    </div>
  `;

  // UI 元素參考
  const startTimerBtn = container.querySelector('#startTimerBtn');
  const resetTimerBtn = container.querySelector('#resetTimerBtn');
  const timerDisplay = container.querySelector('#simpleTimerDisplay');
  const progressRing = container.querySelector('#progressRing');
  const timerWrapper = container.querySelector('#timerWrapper');
  const addTimeBtnGroup = container.querySelector('#addTimeBtnGroup');

  const circumference = 263.89;

  // 動態視覺更新
  const updateVisuals = () => {
    if (timerDisplay) timerDisplay.textContent = formatTime(remainingSeconds);

    // 控制「加算時間按鈕區塊」顯示與隱藏
    if (addTimeBtnGroup) {
      if (isCountUp) {
        addTimeBtnGroup.style.display = 'none'; // 正計時模式下隱藏
      } else {
        addTimeBtnGroup.style.display = 'flex'; // 倒數或重設狀態下顯示
      }
    }

    if (progressRing) {
      if (isCountUp) {
        // 【正計時模式】：固定全載藍綠色圓環，停用所有變色
        progressRing.style.strokeDashoffset = 0;
        progressRing.setAttribute('class', 'stroke-cyan-500 transition-all duration-300 fill-none');
        if (timerDisplay) timerDisplay.className = 'text-6xl sm:text-7xl font-extrabold font-mono text-slate-900 dark:text-slate-100 tracking-tight';
      } else {
        // 【倒數模式】：依照比例動態減少與變色
        const ratio = totalDuration > 0 ? remainingSeconds / totalDuration : 0;
        const offset = circumference - ratio * circumference;
        progressRing.style.strokeDashoffset = offset;

        if (ratio > 0.3) {
          progressRing.setAttribute('class', 'stroke-cyan-500 transition-all duration-300 fill-none');
          if (timerDisplay) timerDisplay.className = 'text-6xl sm:text-7xl font-extrabold font-mono text-slate-900 dark:text-slate-100 tracking-tight';
        } else if (ratio > 0.15) {
          progressRing.setAttribute('class', 'stroke-amber-500 transition-all duration-300 fill-none');
          if (timerDisplay) timerDisplay.className = 'text-6xl sm:text-7xl font-extrabold font-mono text-amber-600 dark:text-amber-400 tracking-tight';
        } else {
          progressRing.setAttribute('class', 'stroke-rose-500 transition-all duration-300 fill-none');
          if (timerDisplay) timerDisplay.className = 'text-6xl sm:text-7xl font-extrabold font-mono text-rose-600 dark:text-rose-400 tracking-tight';
        }
      }
    }

    // 正計時時停用抖動特效
    if (timerWrapper) {
      if (!isCountUp && isRunning && remainingSeconds <= 10 && remainingSeconds > 0) {
        timerWrapper.classList.add('animate-timer-shake');
      } else {
        timerWrapper.classList.remove('animate-timer-shake');
      }
    }
  };

  // 倒數歸零觸發即時彈跳爆發與音效
  const triggerTimeUpExplosion = () => {
    if (timerWrapper) {
      timerWrapper.classList.remove('animate-timer-shake');
      void timerWrapper.offsetWidth;
      timerWrapper.classList.add('animate-timer-explode');
      setTimeout(() => {
        timerWrapper.classList.remove('animate-timer-explode');
      }, 650);
    }
    soundEngine.playBeep(880, 'sine', 0.8);
  };

  // 開始 / 暫停 控制
  if (startTimerBtn) {
    startTimerBtn.addEventListener('click', () => {
      soundEngine.playBeep(520);
      isRunning = !isRunning;

      if (isRunning) {
        // 如果點開始時時間為 0，自動判定開啟「正計時模式」
        if (remainingSeconds === 0) {
          isCountUp = true;
        }

        startTimerBtn.innerHTML = `${icons.pause}<span>暫停</span>`;
        startTimerBtn.className = 'touch-btn bg-amber-600 hover:bg-amber-500 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg cursor-pointer text-2xl transition-all min-w-[150px] flex items-center justify-center gap-2';

        updateVisuals(); // 即時套用按鈕隱藏狀態

        timerId = setInterval(() => {
          if (isCountUp) {
            // 【正計時邏輯】：遞增，無震動與彈跳
            remainingSeconds++;
            if (remainingSeconds >= 5999) remainingSeconds = 5999; // 99:59 上限
            updateVisuals();
          } else {
            // 【倒數計時邏輯】：遞減
            if (remainingSeconds > 0) {
              remainingSeconds--;
              updateVisuals();

              if (remainingSeconds === 0) {
                clearInterval(timerId);
                isRunning = false;
                triggerTimeUpExplosion();
                if (startTimerBtn) {
                  startTimerBtn.innerHTML = `${icons.play}<span>開始</span>`;
                  startTimerBtn.className = 'touch-btn bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg cursor-pointer text-2xl transition-all min-w-[150px] flex items-center justify-center gap-2';
                }
              } else if (remainingSeconds <= 5) {
                soundEngine.playBeep(700, 'sine', 0.15);
              }
            }
          }
        }, 1000);

      } else {
        clearInterval(timerId);
        startTimerBtn.innerHTML = `${icons.play}<span>開始</span>`;
        startTimerBtn.className = 'touch-btn bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg cursor-pointer text-2xl transition-all min-w-[150px] flex items-center justify-center gap-2';
        updateVisuals();
      }
    });
  }

  // 重設控制
  if (resetTimerBtn) {
    resetTimerBtn.addEventListener('click', () => {
      soundEngine.playBeep(400);
      clearInterval(timerId);
      isRunning = false;
      isCountUp = false; // 恢復為預設狀態
      remainingSeconds = 0;
      totalDuration = 0;

      if (timerWrapper) {
        timerWrapper.classList.remove('animate-timer-shake', 'animate-timer-explode');
      }
      if (startTimerBtn) {
        startTimerBtn.innerHTML = `${icons.play}<span>開始</span>`;
        startTimerBtn.className = 'touch-btn bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg cursor-pointer text-2xl transition-all min-w-[150px] flex items-center justify-center gap-2';
      }
      updateVisuals(); // 恢復累加按鈕區塊顯示
    });
  }

  // 加算時間按鈕 (+10秒, +30秒...)
  container.querySelectorAll('[data-add-sec]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      soundEngine.playBeep(600);
      const secs = parseInt(e.currentTarget.dataset.addSec, 10);
      
      // 按了加算時間後自動切回「倒數模式」
      isCountUp = false;
      remainingSeconds += secs;

      if (!isRunning) {
        totalDuration = remainingSeconds;
      } else {
        totalDuration = Math.max(totalDuration, remainingSeconds);
      }
      
      updateVisuals();
    });
  });

  // 初始繪製
  updateVisuals();
}