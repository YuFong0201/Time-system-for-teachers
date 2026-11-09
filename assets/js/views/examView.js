import { soundEngine } from '../core/sound.js';

let timerId = null;
let currentEditingId = null;

// 極簡 SVG Icon 庫
const icons = {
  clock: `<svg class="w-7 h-7 fill-none stroke-current stroke-2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  add: `<svg class="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  edit: `<svg class="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  trash: `<svg class="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
  close: `<svg class="w-6 h-6 fill-none stroke-current stroke-2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
};

export function renderExamView(container, state, onUpdate) {
  if (!container) return;

  if (Array.isArray(state.examSchedule)) {
    state.examSchedule = state.examSchedule.filter(item => item && item.subject && item.startTime);
  } else {
    state.examSchedule = [];
  }

  const examTimeDisplay = container.querySelector('#examCountdownDisplay');

  if (!examTimeDisplay) {
    container.innerHTML = `
      <div class="w-full max-w-4xl h-full flex flex-col items-center justify-center p-4 select-none my-auto">
        
        <!-- 主卡片區域 -->
        <div class="w-full bg-slate-200/90 dark:bg-slate-800/90 rounded-3xl border-2 border-slate-300 dark:border-slate-700 p-6 sm:p-8 flex flex-col items-center shadow-2xl transition-colors relative">
          
          <!-- 上方標題與新增科目按鈕 -->
          <div class="w-full flex justify-between items-center mb-4 flex-wrap gap-3 border-b-2 border-slate-300 dark:border-slate-700 pb-3">
            <div class="flex items-center gap-3">
              <span class="text-cyan-600 dark:text-cyan-400">
                ${icons.clock}
              </span>
              <h2 class="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-wider">
                段考行程與考試倒數
              </h2>
            </div>

            <div class="flex items-center gap-2">
              <button id="addSubjectBtn" class="touch-btn bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-xl shadow cursor-pointer font-bold flex items-center gap-1 text-sm transition-all">
                ${icons.add}
                <span>新增考試科目</span>
              </button>
            </div>
          </div>

          <!-- 當前考程狀態標籤與科目名稱 -->
          <div class="flex flex-col items-center my-2 text-center">
            <span id="examStatusBadge" class="px-4 py-1.5 rounded-2xl text-base font-bold text-white bg-slate-500 mb-2 shadow-sm">
              尚無設定考程
            </span>
            <h3 id="currentSubjectTitle" class="text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-wide min-h-[40px]">
              
            </h3>
            <span id="currentSubjectTimeRange" class="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1 min-h-[20px]">
              
            </span>
          </div>

          <!-- SVG 動態圓環倒數圖形 -->
          <div id="examTimerWrapper" class="relative flex items-center justify-center my-3 transition-all duration-300">
            <svg class="w-64 h-64 sm:w-72 sm:h-72 transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" stroke-width="8" class="stroke-slate-300 dark:stroke-slate-700 fill-none" />
              <circle 
                id="examProgressRing" 
                cx="50" cy="50" r="42" 
                stroke-width="8" 
                stroke-dasharray="263.89" 
                stroke-dashoffset="0" 
                stroke-linecap="round"
                class="stroke-cyan-500 transition-all duration-300 fill-none" 
              />
            </svg>

            <!-- 中央剩餘時間倒數 -->
            <div class="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
              <span class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">剩餘時間</span>
              <div 
                id="examCountdownDisplay" 
                class="text-6xl sm:text-7xl font-extrabold font-mono text-slate-900 dark:text-slate-100 tracking-tight"
              >
                00:00
              </div>
            </div>
          </div>

          <!-- 時鐘正下方 + 置中：時間延後 1 分鐘按鈕 -->
          <div class="w-full flex justify-center my-2">
            <button id="delay1MinBtn" class="touch-btn bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 rounded-xl shadow cursor-pointer font-bold flex items-center gap-1.5 text-sm transition-all active:scale-95" title="延後本節考試結束時間 1 分鐘">
              ⏱️ 時間延後 1 分鐘
            </button>
          </div>

          <!-- 下方當日考程總覽與清空行程按鈕 -->
          <div class="w-full max-w-2xl bg-slate-100/70 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-300/60 dark:border-slate-700/60 mt-2 flex flex-col gap-2">
            <div class="text-sm font-bold text-slate-600 dark:text-slate-300 border-b border-slate-300/60 dark:border-slate-700/60 pb-2 flex justify-between items-center">
              <span>📋 當日考程總覽</span>
              
              <div class="flex items-center gap-3">
                <button id="clearAllScheduleBtn" class="text-xs font-bold text-rose-500 hover:text-rose-600 hover:underline flex items-center gap-0.5 cursor-pointer">
                  ${icons.trash}
                  <span>清除所有行程</span>
                </button>
              </div>
            </div>

            <div id="scheduleTimelineList" class="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1 min-h-[60px]">
              ${renderScheduleList(state.examSchedule)}
            </div>
          </div>

        </div>

      </div>

      <!-- Modal 彈窗 -->
      <div id="subjectModal" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 hidden">
        <div class="bg-slate-200 dark:bg-slate-800 rounded-3xl border-2 border-slate-300 dark:border-slate-700 p-6 w-full max-w-md shadow-2xl flex flex-col gap-5">
          
          <div class="flex justify-between items-center border-b border-slate-400/40 pb-3">
            <h3 id="modalTitle" class="text-2xl font-bold text-slate-900 dark:text-slate-100">
              新增考試科目
            </h3>
            <button id="closeModalBtn" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer">
              ${icons.close}
            </button>
          </div>

          <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-bold text-slate-700 dark:text-slate-300">科目名稱</label>
              <input type="text" id="modalSubject" class="w-full bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-4 py-2.5 rounded-xl border border-slate-400 dark:border-slate-600 outline-none font-bold text-lg" placeholder="例：國語、數學">
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="flex flex-col gap-1.5">
                <label class="text-sm font-bold text-slate-700 dark:text-slate-300">開始時間</label>
                <input type="time" id="modalStartTime" class="w-full bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2.5 rounded-xl border border-slate-400 dark:border-slate-600 outline-none font-bold text-base">
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-sm font-bold text-slate-700 dark:text-slate-300">結束時間</label>
                <input type="time" id="modalEndTime" class="w-full bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2.5 rounded-xl border border-slate-400 dark:border-slate-600 outline-none font-bold text-base">
              </div>
            </div>
          </div>

          <div class="flex justify-between items-center mt-2 pt-3 border-t border-slate-400/40">
            <button id="modalDeleteBtn" class="touch-btn bg-rose-500 hover:bg-rose-600 text-white font-bold px-4 py-2 rounded-xl text-sm shadow cursor-pointer flex items-center gap-1 transition-all">
              ${icons.trash}
              <span>刪除此科目</span>
            </button>

            <div class="flex items-center gap-2">
              <button id="cancelModalBtn" class="px-4 py-2 bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl shadow cursor-pointer text-sm">
                取消
              </button>
              <button id="saveSubjectBtn" class="touch-btn bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-5 py-2 rounded-xl shadow cursor-pointer text-sm transition-all">
                保存
              </button>
            </div>
          </div>

        </div>
      </div>
    `;

    bindExamEvents(container, state, onUpdate);
  }

  updateExamScheduleUI(container, state);

  if (!timerId) {
    timerId = setInterval(() => {
      updateExamScheduleUI(container, state);
    }, 1000);
  }
}


function renderScheduleList(schedule) {
  const validItems = Array.isArray(schedule) ? schedule.filter(item => item && item.subject && item.startTime) : [];
  if (validItems.length === 0) {
    return '';
  }
  const sorted = [...validItems].sort((a, b) => a.startTime.localeCompare(b.startTime));
  return sorted.map(item => `
    <div class="flex items-center justify-between bg-slate-200/70 dark:bg-slate-800/70 px-4 py-2 rounded-xl border border-slate-300/40 dark:border-slate-700/40">
      <div class="flex items-center gap-3">
        <span class="font-mono font-bold text-cyan-600 dark:text-cyan-400 text-sm">
          ${item.startTime} ~ ${item.endTime || ''}
        </span>
        <span class="font-bold text-slate-800 dark:text-slate-100 text-base">
          ${item.subject}
        </span>
      </div>

      <div class="flex items-center gap-1">
        <button data-edit-id="${item.id}" class="hover:bg-black/10 dark:hover:bg-white/10 p-1.5 rounded-lg text-slate-500 hover:text-cyan-600 transition-colors cursor-pointer" title="編輯">
          ${icons.edit}
        </button>
        <button data-del-id="${item.id}" class="hover:bg-black/10 dark:hover:bg-white/10 p-1.5 rounded-lg text-slate-500 hover:text-rose-500 transition-colors cursor-pointer" title="刪除">
          ${icons.trash}
        </button>
      </div>
    </div>
  `).join('');
}


let currentActiveItemId = null;


function updateExamScheduleUI(container, state) {
  const countdownDisplay = container.querySelector('#examCountdownDisplay');
  const statusBadge = container.querySelector('#examStatusBadge');
  const subjectTitle = container.querySelector('#currentSubjectTitle');
  const subjectTimeRange = container.querySelector('#currentSubjectTimeRange');
  const progressRing = container.querySelector('#examProgressRing');
  const delay1MinBtn = container.querySelector('#delay1MinBtn');
  const circumference = 263.89;

  const validItems = Array.isArray(state.examSchedule) ? state.examSchedule.filter(item => item && item.subject && item.startTime) : [];

  if (validItems.length === 0) {
    if (statusBadge) {
      statusBadge.textContent = '尚無設定考程';
      statusBadge.className = 'px-4 py-1.5 rounded-2xl text-base font-bold text-white bg-slate-500 mb-2 shadow-sm';
    }
    if (subjectTitle) subjectTitle.textContent = '';
    if (subjectTimeRange) subjectTimeRange.textContent = '';
    if (countdownDisplay) countdownDisplay.textContent = '00:00';
    if (progressRing) progressRing.style.strokeDashoffset = circumference;
    if (delay1MinBtn) delay1MinBtn.style.display = 'none';
    currentActiveItemId = null;
    return;
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentSeconds = now.getSeconds();
  const totalCurrentSecs = currentMinutes * 60 + currentSeconds;

  const items = validItems.map(item => {
    const [sh, sm] = item.startTime.split(':').map(Number);
    const [eh, em] = (item.endTime || '00:00').split(':').map(Number);
    return {
      ...item,
      startSecs: (sh * 60 + sm) * 60,
      endSecs: (eh * 60 + em) * 60
    };
  }).sort((a, b) => a.startSecs - b.startSecs);

  let activeItem = items.find(i => totalCurrentSecs >= i.startSecs && totalCurrentSecs < i.endSecs);
  let isTesting = true;

  if (!activeItem) {
    activeItem = items.find(i => totalCurrentSecs < i.startSecs);
    isTesting = false;
  }

  if (activeItem) {
    currentActiveItemId = activeItem.id;
    if (subjectTitle) subjectTitle.textContent = activeItem.subject;
    if (subjectTimeRange) subjectTimeRange.textContent = `${activeItem.startTime} ~ ${activeItem.endTime}`;

    if (isTesting) {
      if (statusBadge) {
        statusBadge.textContent = '📝 考試進行中';
        statusBadge.className = 'px-4 py-1.5 rounded-2xl text-base font-bold text-white bg-cyan-600 mb-2 shadow-sm';
      }

      if (delay1MinBtn) delay1MinBtn.style.display = 'inline-flex';

      const remSecs = activeItem.endSecs - totalCurrentSecs;
      const totalSecs = activeItem.endSecs - activeItem.startSecs;
      const ratio = totalSecs > 0 ? remSecs / totalSecs : 0;

      const m = String(Math.floor(remSecs / 60)).padStart(2, '0');
      const s = String(remSecs % 60).padStart(2, '0');
      if (countdownDisplay) countdownDisplay.textContent = `${m}:${s}`;

      if (progressRing) {
        progressRing.style.strokeDashoffset = circumference - ratio * circumference;
        if (ratio <= 0.15) {
          progressRing.setAttribute('class', 'stroke-rose-500 transition-all duration-300 fill-none');
        } else if (ratio <= 0.3) {
          progressRing.setAttribute('class', 'stroke-amber-500 transition-all duration-300 fill-none');
        } else {
          progressRing.setAttribute('class', 'stroke-cyan-500 transition-all duration-300 fill-none');
        }
      }

    } else {
      if (statusBadge) {
        statusBadge.textContent = '下一科準備倒數';
        statusBadge.className = 'px-4 py-1.5 rounded-2xl text-base font-bold text-white bg-amber-600 mb-2 shadow-sm';
      }

      if (delay1MinBtn) delay1MinBtn.style.display = 'none';

      const remSecs = activeItem.startSecs - totalCurrentSecs;
      const m = String(Math.floor(remSecs / 60)).padStart(2, '0');
      const s = String(remSecs % 60).padStart(2, '0');
      if (countdownDisplay) countdownDisplay.textContent = `${m}:${s}`;

      if (progressRing) {
        progressRing.style.strokeDashoffset = 0;
        progressRing.setAttribute('class', 'stroke-amber-500 transition-all duration-300 fill-none');
      }
    }

  } else {
    currentActiveItemId = null;
    if (statusBadge) {
      statusBadge.textContent = '🎉 今日考試已全部結束';
      statusBadge.className = 'px-4 py-1.5 rounded-2xl text-base font-bold text-white bg-emerald-600 mb-2 shadow-sm';
    }
    if (subjectTitle) subjectTitle.textContent = '今日考試完成';
    if (subjectTimeRange) subjectTimeRange.textContent = '';
    if (countdownDisplay) countdownDisplay.textContent = '00:00';
    if (progressRing) progressRing.style.strokeDashoffset = circumference;
    if (delay1MinBtn) delay1MinBtn.style.display = 'none';
  }
}

// 綁定事件
function bindExamEvents(container, state, onUpdate) {
  const addSubjectBtn = container.querySelector('#addSubjectBtn');
  const clearAllScheduleBtn = container.querySelector('#clearAllScheduleBtn');
  const delay1MinBtn = container.querySelector('#delay1MinBtn');

  const subjectModal = container.querySelector('#subjectModal');
  const modalTitle = container.querySelector('#modalTitle');
  const modalSubject = container.querySelector('#modalSubject');
  const modalStartTime = container.querySelector('#modalStartTime');
  const modalEndTime = container.querySelector('#modalEndTime');
  const modalDeleteBtn = container.querySelector('#modalDeleteBtn');
  
  const closeModalBtn = container.querySelector('#closeModalBtn');
  const cancelModalBtn = container.querySelector('#cancelModalBtn');
  const saveSubjectBtn = container.querySelector('#saveSubjectBtn');
  const scheduleListContainer = container.querySelector('#scheduleTimelineList');

  const hideModal = () => {
    soundEngine.playBeep(400);
    currentEditingId = null;
    subjectModal.classList.add('hidden');
  };

  if (closeModalBtn) closeModalBtn.onclick = hideModal;
  if (cancelModalBtn) cancelModalBtn.onclick = hideModal;

  // 按下「新增考試科目」
  if (addSubjectBtn) {
    addSubjectBtn.onclick = () => {
      soundEngine.playBeep(640);
      currentEditingId = null;
      modalTitle.textContent = '新增考試科目';
      modalSubject.value = '';
      modalStartTime.value = '08:40';
      modalEndTime.value = '09:40';
      if (modalDeleteBtn) modalDeleteBtn.style.display = 'none';
      subjectModal.classList.remove('hidden');
    };
  }

  // 按下「清除所有行程」
  if (clearAllScheduleBtn) {
    clearAllScheduleBtn.onclick = () => {
      soundEngine.playBeep(300);
      if (confirm('確定要清除今天的「所有」考試行程嗎？')) {
        state.examSchedule = [];
        if (scheduleListContainer) {
          scheduleListContainer.innerHTML = renderScheduleList(state.examSchedule);
        }
        updateExamScheduleUI(container, state);
        onUpdate(state);
      }
    };
  }

  // 按下「時間延後 1 分鐘」
  if (delay1MinBtn) {
    delay1MinBtn.onclick = () => {
      if (!currentActiveItemId) return;
      soundEngine.playBeep(600);

      const activeItem = state.examSchedule.find(i => i.id === currentActiveItemId);
      if (activeItem && activeItem.endTime) {
        const [eh, em] = activeItem.endTime.split(':').map(Number);
        let endMins = eh * 60 + em + 1;

        const newH = String(Math.floor(endMins / 60) % 24).padStart(2, '0');
        const newM = String(endMins % 60).padStart(2, '0');
        activeItem.endTime = `${newH}:${newM}`;

        if (scheduleListContainer) {
          scheduleListContainer.innerHTML = renderScheduleList(state.examSchedule);
          bindListEvents(container, state, onUpdate, modalTitle, modalSubject, modalStartTime, modalEndTime, subjectModal, modalDeleteBtn);
        }

        updateExamScheduleUI(container, state);
        onUpdate(state);
      }
    };
  }

  // 按下 Modal 的「保存」
  if (saveSubjectBtn) {
    saveSubjectBtn.onclick = () => {
      soundEngine.playBeep(520);
      const subject = modalSubject.value.trim();
      const startTime = modalStartTime.value;
      const endTime = modalEndTime.value;

      if (!subject || !startTime || !endTime) {
        alert('請完整填寫科目名稱與考試時間！');
        return;
      }

      if (currentEditingId) {
        const item = state.examSchedule.find(i => i.id === currentEditingId);
        if (item) {
          item.subject = subject;
          item.startTime = startTime;
          item.endTime = endTime;
        }
      } else {
        state.examSchedule.push({
          id: String(Date.now()),
          subject,
          startTime,
          endTime
        });
      }

      state.examSchedule = state.examSchedule.filter(item => item && item.subject && item.startTime);

      if (scheduleListContainer) {
        scheduleListContainer.innerHTML = renderScheduleList(state.examSchedule);
        bindListEvents(container, state, onUpdate, modalTitle, modalSubject, modalStartTime, modalEndTime, subjectModal, modalDeleteBtn);
      }

      hideModal();
      updateExamScheduleUI(container, state);
      onUpdate(state);
    };
  }

  // 按下 Modal 裡面的「刪除」
  if (modalDeleteBtn) {
    modalDeleteBtn.onclick = () => {
      if (!currentEditingId) return;
      soundEngine.playBeep(300);
      if (confirm('確定要刪除這個考試科目嗎？')) {
        state.examSchedule = state.examSchedule.filter(i => i.id !== currentEditingId);
        if (scheduleListContainer) {
          scheduleListContainer.innerHTML = renderScheduleList(state.examSchedule);
          bindListEvents(container, state, onUpdate, modalTitle, modalSubject, modalStartTime, modalEndTime, subjectModal, modalDeleteBtn);
        }
        hideModal();
        updateExamScheduleUI(container, state);
        onUpdate(state);
      }
    };
  }

  bindListEvents(container, state, onUpdate, modalTitle, modalSubject, modalStartTime, modalEndTime, subjectModal, modalDeleteBtn);
}

// 綁定列表事件
function bindListEvents(container, state, onUpdate, modalTitle, modalSubject, modalStartTime, modalEndTime, subjectModal, modalDeleteBtn) {
  const scheduleListContainer = container.querySelector('#scheduleTimelineList');
  if (!scheduleListContainer) return;

  scheduleListContainer.querySelectorAll('[data-edit-id]').forEach(btn => {
    btn.onclick = (e) => {
      soundEngine.playBeep(600);
      const id = e.currentTarget.dataset.editId;
      const item = state.examSchedule.find(i => i.id === id);
      if (!item) return;

      currentEditingId = id;
      modalTitle.textContent = '編輯考試科目';
      modalSubject.value = item.subject || '';
      modalStartTime.value = item.startTime || '08:40';
      modalEndTime.value = item.endTime || '09:40';
      
      if (modalDeleteBtn) modalDeleteBtn.style.display = 'flex';
      subjectModal.classList.remove('hidden');
    };
  });

  scheduleListContainer.querySelectorAll('[data-del-id]').forEach(btn => {
    btn.onclick = (e) => {
      soundEngine.playBeep(300);
      const id = e.currentTarget.dataset.delId;
      if (confirm('確定要刪除這個考試科目嗎？')) {
        state.examSchedule = state.examSchedule.filter(i => i.id !== id);
        scheduleListContainer.innerHTML = renderScheduleList(state.examSchedule);
        bindListEvents(container, state, onUpdate, modalTitle, modalSubject, modalStartTime, modalEndTime, subjectModal, modalDeleteBtn);
        updateExamScheduleUI(container, state);
        onUpdate(state);
      }
    };
  });
}