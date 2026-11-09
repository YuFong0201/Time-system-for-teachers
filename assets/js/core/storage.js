const STORAGE_KEY = 'CLASSROOM_TIMER_DATA_V1';

const defaultState = {
  theme: 'dark',
  homework: ['閱讀國語課本 L5', '數學習作 P.32-35'],
  bringItems: ['彩色筆', '游泳用品'],
  groups: [
    { id: 1, name: '第一組', score: 5, color: '#EF4444' },
    { id: 2, name: '第二組', score: 8, color: '#3B82F6' },
    { id: 3, name: '第三組', score: 3, color: '#10B981' },
    { id: 4, name: '第四組', score: 6, color: '#F59E0B' }
  ],
  pomodoro: { focusMin: 25, breakMin: 5 },
  examSchedule: [
    { name: '早自修', type: 'study', start: '08:00', end: '08:40' },
    { name: '國文段考', type: 'exam', start: '08:50', end: '09:40' },
    { name: '下課休息', type: 'break', start: '09:40', end: '10:00' },
    { name: '數學段考', type: 'exam', start: '10:00', end: '10:50' }
  ]
};

export function loadState() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : defaultState;
  } catch(e) {
    return defaultState;
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch(e) {}
}

export function exportJSON(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `教室時間管理大師_備份.json`;
  a.click();
}