import { loadState, saveState, exportJSON } from './core/storage.js';
import { soundEngine } from './core/sound.js'; // 1. 補上 soundEngine 引入
import { renderClockView } from './views/clockView.js';
import { renderGroupView } from './views/groupView.js';
import { renderPomodoroView } from './views/pomodoroView.js';
import { renderExamView } from './views/examView.js';

let state = loadState();
let currentView = 'clock';

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('appContainer');
  if (!container) return;

  // 初始化套用主題狀態 (若 state 中有紀錄)
  if (state.theme === 'light') {
    document.documentElement.classList.remove('dark');
  } else {
    document.documentElement.classList.add('dark');
  }

  function render() {
    saveState(state);
    
    switch(currentView) {
      case 'clock': 
        renderClockView(container, state, onStateChange); 
        break;
      case 'group': 
        container.innerHTML = '';
        renderGroupView(container, state, onStateChange); 
        break;
      case 'pomodoro': 
        container.innerHTML = '';
        renderPomodoroView(container, state, onStateChange); 
        break;
      case 'exam': 
        container.innerHTML = '';
        renderExamView(container, state, onStateChange); 
        break;
    }
  }

  function onStateChange(newState) {
    state = newState;
    saveState(state);
  }

  // 2. 補上「白晝/黑夜模式切換按鈕」監聽事件
  const toggleThemeBtn = document.getElementById('toggleThemeBtn');
  if (toggleThemeBtn) {
    toggleThemeBtn.addEventListener('click', () => {
      soundEngine.playBeep(520);
      const isDark = document.documentElement.classList.toggle('dark');
      state.theme = isDark ? 'dark' : 'light';
      saveState(state);
    });
  }

  // 導覽列切換綁定
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      soundEngine.playBeep(480);
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      currentView = e.currentTarget.dataset.view;
      container.innerHTML = '';
      render();
    });
  });

  // 備份與還原按鈕
  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) exportBtn.addEventListener('click', () => exportJSON(state));

  const importBtn = document.getElementById('importBtn');
  const importFile = document.getElementById('importFile');
  if (importBtn && importFile) {
    importBtn.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          state = JSON.parse(evt.target.result);
          
          // 還原主題狀態
          if (state.theme === 'light') {
            document.documentElement.classList.remove('dark');
          } else {
            document.documentElement.classList.add('dark');
          }

          container.innerHTML = '';
          render();
          alert('資料成功還原！');
        } catch(err) {
          alert('檔案格式錯誤！');
        }
      };
      reader.readAsText(file);
    });
  }

  // 初始渲染與時鐘定時更新
  render();
  setInterval(() => {
    if (currentView === 'clock') {
      renderClockView(container, state, onStateChange);
    }
  }, 1000);
});