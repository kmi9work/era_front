<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

const API = import.meta.env.VITE_PROXY

const schedules = ref([])
const isLoading = ref(false)
const error = ref(null)

// Активная вкладка (под-расписание)
const activeScheduleTab = ref(0)

// Состояние модалок
const showAddModal = ref(false)
const showEditModal = ref(false)
const showRenameModal = ref(false)
const showResetModal = ref(false)
const showShiftModal = ref(false)
const isDeleting = ref(false)
const shiftMinutes = ref(0)

// Данные для новой/редактируемой записи
const newItem = ref({ identificator: '', start: '', finish: '', type: 'play' })
const editItem = ref({ id: null, identificator: '', start: '', finish: '', type: 'play' })
const renameValue = ref('')

// Ссылка на id расписания, с которым сейчас работаем
const activeScheduleId = computed(() => {
  const s = schedules.value[activeScheduleTab.value]
  return s ? s.id : null
})

// Последнее время окончания в активном расписании
const lastCycleFinish = computed(() => {
  const s = schedules.value[activeScheduleTab.value]
  if (!s || !s.items || s.items.length === 0) return '00:00'
  return s.items[s.items.length - 1].finish
})

const newItemDuration = computed(() => {
  const dur = getItemDuration({ start: newItem.value.start, finish: newItem.value.finish })
  if (!dur || dur === '—') return '—'
  const parts = String(dur).split(':')
  return `${parts[0] ?? '00'}:${parts[1] ?? '00'}`
})

const getItemDuration = (item) => {
  if (!item || !item.start || !item.finish) return '—'
  const toSeconds = (timeStr) => {
    const parts = String(timeStr).split(':').map(p => parseInt(p, 10))
    if (parts.length < 2 || parts.some(n => Number.isNaN(n))) return null
    const [h, m, s = 0] = parts
    return h * 3600 + m * 60 + s
  }
  let startSeconds = toSeconds(item.start)
  let finishSeconds = toSeconds(item.finish)
  if (startSeconds === null || finishSeconds === null) return '—'
  if (finishSeconds < startSeconds) finishSeconds += 24 * 3600
  const diff = Math.max(0, finishSeconds - startSeconds)
  const hh = String(Math.floor(diff / 3600)).padStart(2, '0')
  const mm = String(Math.floor((diff % 3600) / 60)).padStart(2, '0')
  const ss = String(diff % 60).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

const fetchSchedules = async () => {
  isLoading.value = true
  error.value = null
  try {
    const res = await axios.get(`${API}/game_parameters/show_sovereign_schedule`)
    schedules.value = res.data.schedules || []
  } catch (err) {
    console.error('Ошибка загрузки расписания Государя:', err)
    error.value = 'Не удалось загрузить расписание Государя'
  } finally {
    isLoading.value = false
  }
}

const resetSchedules = async () => {
  isLoading.value = true
  error.value = null
  try {
    await axios.patch(`${API}/game_parameters/create_sovereign_schedule`)
    await fetchSchedules()
    showResetModal.value = false
  } catch (err) {
    console.error('Ошибка сброса расписания:', err)
    error.value = 'Не удалось сбросить расписание'
  } finally {
    isLoading.value = false
  }
}

const shiftAllSchedules = async () => {
  error.value = null
  const minutes = Number(shiftMinutes.value)
  if (!Number.isFinite(minutes) || !Number.isInteger(minutes) || minutes === 0) {
    error.value = 'Введите целое число минут (не 0)'
    return
  }
  isLoading.value = true
  try {
    const res = await axios.patch(`${API}/game_parameters/shift_sovereign_schedule`, {
      request: { minutes }
    })
    if (res.data?.success !== true) {
      throw new Error(res.data?.error || 'Не удалось сдвинуть расписание')
    }
    await fetchSchedules()
    showShiftModal.value = false
    shiftMinutes.value = 0
  } catch (err) {
    console.error('Ошибка при сдвиге:', err)
    error.value = err?.response?.data?.error || err?.message || 'Не удалось сдвинуть расписание'
  } finally {
    isLoading.value = false
  }
}

const openRename = () => {
  const s = schedules.value[activeScheduleTab.value]
  if (!s) return
  renameValue.value = s.name || ''
  showRenameModal.value = true
}

const saveRename = async () => {
  const name = renameValue.value.trim()
  if (!name || !activeScheduleId.value) return
  isLoading.value = true
  error.value = null
  try {
    await axios.patch(`${API}/game_parameters/update_sovereign_schedule_name`, {
      request: { schedule_id: activeScheduleId.value, name }
    })
    await fetchSchedules()
    showRenameModal.value = false
  } catch (err) {
    console.error('Ошибка переименования:', err)
    error.value = 'Не удалось переименовать расписание'
  } finally {
    isLoading.value = false
  }
}

const openAddModal = () => {
  newItem.value = {
    identificator: '',
    start: lastCycleFinish.value,
    finish: '',
    type: 'play'
  }
  showAddModal.value = true
}

const addItem = async () => {
  error.value = null
  if (!newItem.value.identificator.trim()) { error.value = 'Введите название'; return }
  if (!newItem.value.start) { error.value = 'Укажите время начала'; return }
  if (!newItem.value.finish) { error.value = 'Укажите время окончания'; return }
  if (!activeScheduleId.value) return

  isLoading.value = true
  try {
    await axios.patch(`${API}/game_parameters/add_sovereign_schedule_item`, {
      request: {
        schedule_id: activeScheduleId.value,
        identificator: newItem.value.identificator,
        start: newItem.value.start,
        finish: newItem.value.finish,
        type: newItem.value.type
      }
    })
    await fetchSchedules()
    showAddModal.value = false
  } catch (err) {
    console.error('Ошибка добавления:', err)
    error.value = 'Не удалось добавить пункт'
  } finally {
    isLoading.value = false
  }
}

const openEditModal = (item) => {
  editItem.value = {
    id: item.id,
    identificator: item.identificator,
    start: item.start,
    finish: item.finish,
    type: item.type || 'play'
  }
  showEditModal.value = true
}

const saveEdit = async () => {
  if (!editItem.value.id || !activeScheduleId.value) return
  isLoading.value = true
  error.value = null
  try {
    await axios.patch(`${API}/game_parameters/update_sovereign_schedule_item`, {
      request: {
        schedule_id: activeScheduleId.value,
        item: {
          id: editItem.value.id,
          identificator: editItem.value.identificator,
          start: editItem.value.start,
          finish: editItem.value.finish,
          type: editItem.value.type
        }
      }
    })
    await fetchSchedules()
    showEditModal.value = false
  } catch (err) {
    console.error('Ошибка сохранения:', err)
    error.value = 'Не удалось сохранить изменения'
  } finally {
    isLoading.value = false
  }
}

const deleteItem = async (itemId) => {
  if (!itemId || !activeScheduleId.value) return
  isDeleting.value = true
  error.value = null
  try {
    await axios.patch(`${API}/game_parameters/delete_sovereign_schedule_item`, {
      request: { schedule_id: activeScheduleId.value, id: itemId }
    })
    await fetchSchedules()
    showEditModal.value = false
  } catch (err) {
    console.error('Ошибка удаления:', err)
    error.value = 'Не удалось удалить пункт'
  } finally {
    isDeleting.value = false
  }
}

const shiftItem = async (item, minutes) => {
  if (!item || !item.id || !activeScheduleId.value) return
  const [sh, sm] = item.start.split(':').map(Number)
  const [fh, fm] = item.finish.split(':').map(Number)
  const startTotal = sh * 60 + sm + minutes
  const finishTotal = fh * 60 + fm + minutes
  const norm = (m) => { if (m < 0) return m + 1440; if (m >= 1440) return m - 1440; return m }
  const ns = norm(startTotal); const nf = norm(finishTotal)
  const pad = (n) => String(n).padStart(2, '0')
  isLoading.value = true
  error.value = null
  try {
    await axios.patch(`${API}/game_parameters/update_sovereign_schedule_item`, {
      request: {
        schedule_id: activeScheduleId.value,
        item: {
          id: item.id,
          identificator: item.identificator,
          start: `${pad(Math.floor(ns / 60))}:${pad(ns % 60)}`,
          finish: `${pad(Math.floor(nf / 60))}:${pad(nf % 60)}`,
          type: item.type
        }
      }
    })
    await fetchSchedules()
  } catch (err) {
    console.error('Ошибка сдвига:', err)
    error.value = 'Не удалось сдвинуть пункт'
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchSchedules)
</script>

<template>
  <div class="card-fullwidth">
    <div class="card-header-wrapper">
      <h3 class="card-header">Расписание Государя</h3>
      <div class="header-actions">
        <button class="secondary-button" @click="showShiftModal = true" :disabled="isLoading">
          Сдвинуть всё
        </button>
        <button class="create_schedule_button" @click="showResetModal = true" :disabled="isLoading">
          Сбросить на стандартное
        </button>
      </div>
    </div>

    <!-- Под-вкладки трёх расписаний -->
    <VTabs v-model="activeScheduleTab" show-arrows class="v-tabs-pill mt-3" density="compact">
      <VTab v-for="(s, i) in schedules" :key="s.id" :value="i">
        {{ s.name || `Расписание ${i + 1}` }}
      </VTab>
    </VTabs>

    <VWindow v-model="activeScheduleTab" class="mt-3" :touch="false">
      <VWindowItem v-for="(s, si) in schedules" :key="s.id" :value="si">
        <div class="schedule-subheader">
          <h4 class="schedule-subtitle">{{ s.name || `Расписание ${si + 1}` }}</h4>
          <div class="subheader-actions">
            <button class="secondary-button" @click="openRename()" :disabled="isLoading">
              ✎ Переименовать
            </button>
            <button class="add-button" @click="openAddModal()" :disabled="isLoading">
              + Добавить
            </button>
          </div>
        </div>

        <div class="table-container">
          <table class="schedule-table">
            <colgroup>
              <col style="width: 35%;">
              <col style="width: 12%;">
              <col style="width: 12%;">
              <col style="width: 12%;">
              <col style="width: 12%;">
              <col style="width: 17%;">
            </colgroup>
            <thead>
              <tr>
                <th class="ident-cell">Событие</th>
                <th class="time-cell">Начало</th>
                <th class="time-cell">Окончание</th>
                <th class="duration-cell">Длительность</th>
                <th class="type-cell">Тип</th>
                <th class="actions-col">Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in (s.items || [])" :key="item.id">
                <td class="ident-cell">{{ item.identificator }}</td>
                <td class="time-cell">{{ item.start }}</td>
                <td class="time-cell">{{ item.finish }}</td>
                <td class="duration-cell">
                  <span class="duration-badge">{{ getItemDuration(item) }}</span>
                </td>
                <td class="type-cell">
                  <span class="type-badge" :class="{ 'type-play': item.type === 'play', 'type-pause': item.type === 'pause' }">
                    {{ item.type === 'pause' ? 'Пауза' : 'Игра' }}
                  </span>
                </td>
                <td class="actions-cell">
                  <div style="display: flex; gap: 4px; justify-content: flex-end; align-items: center;">
                    <button class="shift-btn shift-btn--minus" @click="shiftItem(item, -5)" :disabled="isLoading" title="−5 мин">−5</button>
                    <button class="shift-btn shift-btn--plus" @click="shiftItem(item, +5)" :disabled="isLoading" title="+5 мин">+5</button>
                    <button class="edit-button" @click="openEditModal(item)" :disabled="isLoading">Редактировать</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div v-if="!isLoading && (!s.items || s.items.length === 0)" class="loading-message">
            Расписание пустое
          </div>
        </div>
      </VWindowItem>
    </VWindow>

    <!-- Ошибки -->
    <div v-if="error" class="error-message" style="margin:12px 16px;">{{ error }}</div>

    <div v-if="isLoading && schedules.length === 0" class="loading-message">Загрузка...</div>

    <!-- Модалка: сброс -->
    <div v-if="showResetModal" class="modal-overlay" @click.self="showResetModal = false">
      <div class="modal-content">
        <h3>Сбросить расписание</h3>
        <p>Вы уверены? Все текущие изменения будут потеряны.</p>
        <div class="modal-actions">
          <button class="cancel-button" @click="showResetModal = false" :disabled="isLoading">Отмена</button>
          <button class="confirm-button" @click="resetSchedules" :disabled="isLoading">
            {{ isLoading ? 'Сброс...' : 'Выполнить' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Модалка: сдвиг всех трёх расписаний -->
    <div v-if="showShiftModal" class="modal-overlay" @click.self="showShiftModal = false">
      <div class="modal-content">
        <h3>Сдвинуть все расписания</h3>
        <div v-if="error" class="error-message">{{ error }}</div>
        <div class="form-group">
          <label>На сколько минут сдвинуть?</label>
          <input
            v-model.number="shiftMinutes"
            type="number"
            step="1"
            placeholder="Например: 15 или -10"
            :disabled="isLoading"
          >
          <small class="form-hint">Положительное — вперёд, отрицательное — назад.</small>
        </div>
        <div class="modal-actions">
          <button class="cancel-button" @click="showShiftModal = false" :disabled="isLoading">Отмена</button>
          <button class="confirm-button" @click="shiftAllSchedules" :disabled="isLoading">Сдвинуть</button>
        </div>
      </div>
    </div>

    <!-- Модалка: переименовать -->
    <div v-if="showRenameModal" class="modal-overlay" @click.self="showRenameModal = false">
      <div class="modal-content">
        <h3>Переименовать расписание</h3>
        <div class="form-group">
          <label>Название:</label>
          <input v-model="renameValue" type="text" :disabled="isLoading" @keyup.enter="saveRename">
        </div>
        <div class="modal-actions">
          <button class="cancel-button" @click="showRenameModal = false" :disabled="isLoading">Отмена</button>
          <button class="confirm-button" @click="saveRename" :disabled="isLoading || !renameValue.trim()">Сохранить</button>
        </div>
      </div>
    </div>

    <!-- Модалка: добавить -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal-content">
        <h3>Добавить пункт</h3>
        <div class="form-group">
          <label>Название:</label>
          <input v-model="newItem.identificator" type="text" placeholder="Событие" :disabled="isLoading">
        </div>
        <div class="form-group">
          <label>Начало:</label>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <button class="secondary-button" type="button" @click="newItem.start = lastCycleFinish" :disabled="isLoading">
              Подставить конец предыдущего ({{ lastCycleFinish }})
            </button>
            <input v-model="newItem.start" type="time" :disabled="isLoading" style="min-width:160px;">
          </div>
        </div>
        <div class="form-group">
          <label>Окончание:</label>
          <input v-model="newItem.finish" type="time" :disabled="isLoading">
        </div>
        <div class="form-group">
          <label>Длительность:</label>
          <div>{{ newItemDuration }}</div>
        </div>
        <div class="form-group">
          <label>Тип:</label>
          <select v-model="newItem.type" :disabled="isLoading">
            <option value="play">Игра</option>
            <option value="pause">Пауза</option>
          </select>
        </div>
        <div class="modal-actions">
          <button class="cancel-button" @click="showAddModal = false" :disabled="isLoading">Отмена</button>
          <button class="confirm-button" @click="addItem" :disabled="isLoading">Добавить</button>
        </div>
      </div>
    </div>

    <!-- Модалка: редактировать -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
      <div class="modal-content">
        <h3>Редактировать пункт</h3>
        <div class="form-group">
          <label>Название:</label>
          <input v-model="editItem.identificator" type="text" :disabled="isLoading || isDeleting">
        </div>
        <div class="form-group">
          <label>Начало:</label>
          <input v-model="editItem.start" type="time" :disabled="isLoading || isDeleting">
        </div>
        <div class="form-group">
          <label>Окончание:</label>
          <input v-model="editItem.finish" type="time" :disabled="isLoading || isDeleting">
        </div>
        <div class="form-group">
          <label>Тип:</label>
          <select v-model="editItem.type" :disabled="isLoading || isDeleting">
            <option value="play">Игра</option>
            <option value="pause">Пауза</option>
          </select>
        </div>
        <div class="modal-actions">
          <button class="cancel-button" @click="showEditModal = false" :disabled="isLoading || isDeleting">Отмена</button>
          <button class="delete-confirm-button" @click="deleteItem(editItem.id)" :disabled="isDeleting || isLoading">
            <span v-if="!isDeleting">Удалить</span>
            <span v-else>Удаление...</span>
          </button>
          <button class="confirm-button" @click="saveEdit" :disabled="isLoading || isDeleting">Сохранить</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-fullwidth {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  width: 100%;
  margin: 20px 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
}

.card-header-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #1976d2;
  padding: 0 16px;
}

.card-header {
  color: white;
  padding: 16px 0;
  margin: 0;
  font-size: 1.25rem;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.schedule-subheader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
}

.schedule-subtitle {
  margin: 0;
  font-size: 1.1rem;
  color: #1f2937;
}

.subheader-actions {
  display: flex;
  gap: 8px;
}

.add-button {
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.create_schedule_button {
  background-color: #9c27b0;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.add-button:hover:not(:disabled),
.create_schedule_button:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.add-button:disabled,
.create_schedule_button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
  opacity: 0.7;
}

.edit-button {
  background-color: #ff9800;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 14px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.edit-button:hover:not(:disabled) { opacity: 0.9; }
.edit-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
  opacity: 0.7;
}

.table-container {
  overflow-x: auto;
  padding: 0;
  min-height: 60px;
}

.loading-message {
  padding: 20px;
  text-align: center;
  color: #666;
}

.schedule-table {
  width: 100%;
  border-collapse: collapse;
}

.schedule-table thead th {
  background-color: #f5f5f5;
  padding: 14px 18px;
  text-align: left;
  font-weight: 700;
  color: #1f2937;
  border-bottom: 2px solid #e0e0e0;
  position: sticky;
  top: 0;
  z-index: 1;
}

.schedule-table td {
  padding: 14px 18px;
  border-bottom: 1px solid #e0e0e0;
  color: #374151;
  vertical-align: middle;
  font-size: 0.975rem;
}

.schedule-table tbody tr:nth-child(odd) td { background-color: #fafafa; }
.schedule-table tbody tr:nth-child(even) td { background-color: #ffffff; }
.schedule-table tbody tr:hover td { background-color: #f5f5f5; }
.schedule-table .time-cell { text-align: center; font-feature-settings: "tnum" 1; font-variant-numeric: tabular-nums; font-size: 1rem; }
.schedule-table .duration-cell { text-align: center; }
.schedule-table .ident-cell { font-weight: 600; color: #111827; }
.schedule-table .actions-col { text-align: right; }
.schedule-table .actions-cell { text-align: right; }

.type-cell { text-align: center; }

.type-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.type-badge.type-play { background-color: #4CAF50; color: white; }
.type-badge.type-pause { background-color: #FF9800; color: white; }

.duration-badge {
  display: inline-block;
  padding: 6px 10px;
  background-color: #e8f5e9;
  color: #2e7d32;
  border: 1px solid #c8e6c9;
  border-radius: 9999px;
  font-size: 0.9rem;
}

.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 24px;
  border-radius: 8px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.modal-content h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #1976d2;
}

.modal-content p {
  margin-bottom: 16px;
}

.error-message {
  color: #d32f2f;
  padding: 12px;
  background-color: #ffebee;
  border-radius: 4px;
  margin-bottom: 16px;
  font-size: 0.9rem;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #424242;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group input:disabled,
.form-group select:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.cancel-button {
  padding: 8px 16px;
  background-color: #f5f5f5;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.confirm-button {
  padding: 8px 16px;
  background-color: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.delete-confirm-button {
  padding: 8px 16px;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.secondary-button {
  padding: 8px 12px;
  background-color: #eeeeee;
  color: #333;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.shift-btn {
  padding: 6px 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.2s;
  min-width: 40px;
}

.shift-btn--plus { background-color: #4CAF50; color: white; }
.shift-btn--minus { background-color: #FF9800; color: white; }
.shift-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
.shift-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
  opacity: 0.7;
}

.cancel-button:hover:not(:disabled),
.confirm-button:hover:not(:disabled),
.delete-confirm-button:hover:not(:disabled),
.secondary-button:hover:not(:disabled) { opacity: 0.9; }

.cancel-button:disabled,
.confirm-button:disabled,
.delete-confirm-button:disabled,
.secondary-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.form-hint {
  display: block;
  margin-top: 4px;
  font-size: 0.85rem;
  color: #888;
}
</style>
