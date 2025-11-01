<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import axios from 'axios'

const showModal = ref(false)
const createScheduleModal = ref(false)
const showEditModal = ref(false)
const error = ref(null)
const isLoading = ref(false)
const isDeleting = ref(false)
const schedule = ref([]) // Локальное состояние для расписания
const newItem = ref({
  identificator: '',
  start: '',
  finish: '',
  type: 'play'
})
const newItemDuration = computed(() => {
  const dur = getItemDuration({ start: newItem.value.start, finish: newItem.value.finish })
  if (!dur || dur === '—') return '—'
  const parts = String(dur).split(':')
  const hh = parts[0] ?? '00'
  const mm = parts[1] ?? '00'
  return `${hh}:${mm}`
})

// Текущее время в секундах от начала суток и подсветка активного пункта
const nowSeconds = ref(0)
const nowTicker = ref(null)
const updateNowSeconds = () => {
  const now = new Date()
  nowSeconds.value = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()
}

const isItemActive = (item) => {
  if (!item || !item.start || !item.finish) return false
  const toSeconds = (timeStr) => {
    const [h, m, s = 0] = String(timeStr).split(':').map(v => parseInt(v, 10))
    if ([h, m, s].some(v => Number.isNaN(v))) return null
    return h * 3600 + m * 60 + s
  }
  const start = toSeconds(item.start)
  const finish = toSeconds(item.finish)
  if (start === null || finish === null) return false

  if (finish >= start) {
    return start <= nowSeconds.value && nowSeconds.value < finish
  }
  // Интервал через полночь
  return nowSeconds.value >= start || nowSeconds.value < finish
}

const editItem = ref({
  id: null,
  identificator: '',
  start: '',
  finish: '',
  type: 'play'
})

// Вычисляем время окончания последнего цикла
const lastCycleFinish = computed(() => {
  if (schedule.value.length === 0) return '00:00'
  return schedule.value[schedule.value.length - 1].finish
})

const createStandardSchedule = async ()  => {
  try {
    isLoading.value = true
    const response = await axios.patch(
      `${import.meta.env.VITE_PROXY}/game_parameters/create_schedule`
    )
    await fetchSchedule()
    createScheduleModal.value = false
  } catch (err) {
    console.error('Ошибка при создании расписания:', err)
    error.value = 'Не удалось создать расписание'
  } finally {
    isLoading.value = false
  }
}

const emptySchedule = ref(false)

// Функция для получения расписания с сервера
const fetchSchedule = async () => {
  try {
    isLoading.value = true
    error.value = null
    const response = await axios.get(
      `${import.meta.env.VITE_PROXY}/game_parameters/show_schedule.json`
    )
    
    // Правильный доступ к данным - response.data.timer.schedule
    schedule.value = response.data.timer.schedule || []
  } catch (err) {
    console.error('Ошибка при получении расписания:', err)
    error.value = 'Не удалось загрузить расписание'
  } finally {
    isLoading.value = false
  }
}

const addNewItem = async () => {
  // Валидация
  error.value = null
  if (!newItem.value.identificator.trim()) {
    error.value = 'Введите название цикла'
    return
  }
  if (!newItem.value.start) {
    error.value = 'Укажите время начала'
    return
  }
  if (!newItem.value.finish) {
    error.value = 'Укажите время окончания'
    return
  }

  isLoading.value = true

  try {
    await axios.patch(
      `${import.meta.env.VITE_PROXY}/game_parameters/add_schedule_item`, 
      { 
        request: {
          identificator: newItem.value.identificator,
          start: newItem.value.start,
          finish: newItem.value.finish,
          type: newItem.value.type
        }
      }
    )
    
    // После успешного добавления обновляем расписание
    await fetchSchedule()
    
    showModal.value = false
    resetForm()
  } catch (err) {
    console.error('Ошибка при добавлении:', err)
    error.value = 'Не удалось добавить цикл. Попробуйте снова.'
  } finally {
    isLoading.value = false
  }
}

const resetForm = () => {
  newItem.value = {
    identificator: '',
    start: '',
    finish: '',
    type: 'play'
  }
  error.value = null
}

// Открыть модал редактирования
const openEdit = (item) => {
  error.value = null
  editItem.value = {
    id: item.id,
    identificator: item.identificator,
    start: item.start,
    finish: item.finish,
    type: item.type || 'play'
  }
  showEditModal.value = true
}

// Вычисление длительности цикла в формате HH:MM:SS
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

// Сохранить изменения пункта расписания
const saveEdit = async () => {
  if (!editItem.value.id) return
  error.value = null
  isLoading.value = true
  try {
    await axios.patch(
      `${import.meta.env.VITE_PROXY}/game_parameters/update_schedule_item`,
      {
        request: {
          id: editItem.value.id,
          identificator: editItem.value.identificator,
          start: editItem.value.start,
          finish: editItem.value.finish,
          type: editItem.value.type
        }
      }
    )
    await fetchSchedule()
    showEditModal.value = false
  } catch (err) {
    console.error('Ошибка при сохранении изменений:', err)
    error.value = 'Не удалось сохранить изменения. Попробуйте снова.'
  } finally {
    isLoading.value = false
  }
}

// Удалить выбранный пункт расписания
const deleteItem = async (id) => {
  if (!id) return
  isDeleting.value = true
  error.value = null
  try {
    await axios.patch(
      `${import.meta.env.VITE_PROXY}/game_parameters/delete_schedule_item`,
      { request: { id } }
    )
    await fetchSchedule()
    showEditModal.value = false
  } catch (err) {
    console.error('Ошибка при удалении пункта:', err)
    error.value = 'Не удалось удалить пункт расписания'
  } finally {
    isDeleting.value = false
  }
}

// Получаем расписание при монтировании компонента
onMounted(() => {
  fetchSchedule()
  updateNowSeconds()
  nowTicker.value = setInterval(updateNowSeconds, 1000)
})
onUnmounted(() => {
  if (nowTicker.value) clearInterval(nowTicker.value)
})
</script>

<template>
  <div class="card-fullwidth">
    <div class="card-header-wrapper">
      <h3 class="card-header">Расписание циклов</h3>
      <div class="header-actions">
        <button 
          class="add-button" 
          @click="showModal = true"
          :disabled="isLoading"
        >
          <span v-if="!isLoading">+ Добавить</span>
          <span v-else>Загрузка...</span>
        </button>
        <button 
          class="create_schedule_button" 
          @click="createScheduleModal = true"
          :disabled="isLoading || schedule.length > 0"
        >
          <span v-if="!isLoading">+ Создать расписание</span>
          <span v-else>Загрузка...</span>
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
            <th class="ident-cell">№ Цикла</th>
            <th class="time-cell">Начало</th>
            <th class="time-cell">Окончание</th>
            <th class="duration-cell">Длительность</th>
            <th class="type-cell">Тип</th>
            <th class="actions-col">Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in schedule" :key="item.id" :class="{ 'active-row': isItemActive(item) }">
            <td class="ident-cell">{{ item.identificator }}</td>
            <td class="time-cell">{{ item.start }}</td>
            <td class="time-cell">{{ item.finish }}</td>
            <td class="duration-cell"><span class="duration-badge" :class="{ 'duration-badge--active': isItemActive(item) }">{{ getItemDuration(item) }}</span></td>
            <td class="type-cell">
              <span class="type-badge" :class="{ 'type-play': item.type === 'play', 'type-pause': item.type === 'pause' }">
                {{ item.type === 'pause' ? 'Пауза' : 'Игра' }}
              </span>
            </td>
            <td class="actions-cell">
              <button class="edit-button" @click="openEdit(item)" :disabled="isLoading || isDeleting">
                Редактировать
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="isLoading && schedule.length === 0" class="loading-message">
        Загрузка расписания...
      </div>
      <div v-if="!isLoading && schedule.length === 0" class="loading-message">
        Расписание пустое
      </div>
    </div>
    
    <!-- Модальное окно добавления -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-content">
        <h3>Добавить новый цикл</h3>
        
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
        
        <div class="form-group">
          <label for="cycle-name">Название цикла:</label>
          <input 
            id="cycle-name" 
            v-model="newItem.identificator" 
            type="text" 
            placeholder="Например: Цикл 31"
            :disabled="isLoading"
          >
        </div>
        
        <div class="form-group">
          <label>Начало нового цикла:</label>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <button class="secondary-button" type="button" @click="newItem.start = lastCycleFinish" :disabled="isLoading">
              Подставить конец предыдущего ({{ lastCycleFinish }})
            </button>
            <input 
              id="cycle-start" 
              v-model="newItem.start" 
              type="time" 
              placeholder="HH:MM"
              :disabled="isLoading"
              style="min-width:160px;"
            >
          </div>
        </div>

        <div class="form-group">
          <label for="cycle-time">Время окончания:</label>
          <input 
            id="cycle-time" 
            v-model="newItem.finish" 
            type="time" 
            placeholder="HH:MM"
            :disabled="isLoading"
          >
        </div>

        <div class="form-group">
          <label>Длительность:</label>
          <div>{{ newItemDuration }}</div>
        </div>

        <div class="form-group">
          <label for="cycle-type">Тип:</label>
          <select 
            id="cycle-type" 
            v-model="newItem.type" 
            :disabled="isLoading"
          >
            <option value="play">Игра (play)</option>
            <option value="pause">Пауза (pause)</option>
          </select>
        </div>
        
        <div class="modal-actions">
          <button 
            class="cancel-button" 
            @click="showModal = false"
            :disabled="isLoading"
          >
            Отмена
          </button>
          <button 
            class="confirm-button" 
            @click="addNewItem"
            :disabled="isLoading"
          >
            <span v-if="!isLoading">Добавить</span>
            <span v-else>Добавление...</span>
          </button>
        </div>
      </div>
    </div>
    
    <!-- Модальное окно создания стандартного расписания -->
    <div v-if="createScheduleModal" class="modal-overlay" @click.self="createScheduleModal = false">
      <div class="modal-content">
        <h3>Создать стандартное расписание</h3>
        
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
        
        <div class="simple-message">
          <p>Вы уверены, что хотите создать стандартное расписание?</p>
        </div>
        
        <div class="modal-actions">
          <button 
            class="btn-cancel" 
            @click="createScheduleModal = false"
            :disabled="isLoading"
          >
            Отменить
          </button>
          <button 
            class="btn-confirm" 
            @click="createStandardSchedule"
            :disabled="isLoading"
          >
            {{ isLoading ? 'Создание...' : 'Выполнить' }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- Модальное окно редактирования -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
      <div class="modal-content">
        <h3>Редактировать пункт расписания</h3>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <div class="form-group">
          <label for="edit-cycle-name">Название цикла:</label>
          <input
            id="edit-cycle-name"
            v-model="editItem.identificator"
            type="text"
            placeholder="Например: Цикл 31"
            :disabled="isLoading || isDeleting"
          >
        </div>

        <div class="form-group">
          <label for="edit-cycle-start">Время начала:</label>
          <input
            id="edit-cycle-start"
            v-model="editItem.start"
            type="time"
            placeholder="HH:MM"
            :disabled="isLoading || isDeleting"
          >
        </div>

        <div class="form-group">
          <label for="edit-cycle-finish">Время окончания:</label>
          <input
            id="edit-cycle-finish"
            v-model="editItem.finish"
            type="time"
            placeholder="HH:MM"
            :disabled="isLoading || isDeleting"
          >
        </div>

        <div class="form-group">
          <label for="edit-type">Тип:</label>
          <select 
            id="edit-type" 
            v-model="editItem.type" 
            :disabled="isLoading || isDeleting"
          >
            <option value="play">Игра (play)</option>
            <option value="pause">Пауза (pause)</option>
          </select>
        </div>

        <div class="modal-actions">
          <button
            class="cancel-button"
            @click="showEditModal = false"
            :disabled="isLoading || isDeleting"
          >
            Отмена
          </button>
          <button
            class="delete-confirm-button"
            @click="deleteItem(editItem.id)"
            :disabled="isDeleting || isLoading"
          >
            <span v-if="!isDeleting">Удалить</span>
            <span v-else>Удаление...</span>
          </button>
          <button
            class="confirm-button"
            @click="saveEdit"
            :disabled="isLoading || isDeleting"
          >
            <span v-if="!isLoading">Сохранить</span>
            <span v-else>Сохранение...</span>
          </button>
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
  position: relative;
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

.add-button {
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 8px;
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
  display: flex;
  align-items: center;
  gap: 8px;
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
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.edit-button:hover:not(:disabled) {
  opacity: 0.9;
}

.edit-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
  opacity: 0.7;
}

.simple-message {
  text-align: center;
  margin: 2rem 0;
  font-size: 1.1rem;
  color: #333;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}

.btn-cancel, .btn-confirm {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
}

.btn-cancel {
  background: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
}

.btn-cancel:hover:not(:disabled) {
  background: #e0e0e0;
}

.btn-confirm {
  background: #42b983;
  color: white;
}

.btn-confirm:hover:not(:disabled) {
  background: #3aa876;
}

.btn-cancel:disabled, .btn-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.table-container {
  overflow-x: auto;
  padding: 0;
  min-height: 100px;
  position: relative;
}

.loading-message {
  padding: 20px;
  text-align: center;
  color: #666;
}

.schedule-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
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

.schedule-table tr:last-child td {
  border-bottom: none;
}

.schedule-table tr:hover td {
  background-color: #f5f5f5;
}

.schedule-table tr.active-row td {
  background-color: #e3f2fd;
  font-weight: 600;
}

.schedule-table .time-cell { text-align: center; font-feature-settings: "tnum" 1; font-variant-numeric: tabular-nums; font-size: 1rem; }
.schedule-table .duration-cell { text-align: center; }
.schedule-table .ident-cell { font-weight: 600; color: #111827; }
.schedule-table .actions-col { text-align: right; }
.schedule-table .actions-cell { text-align: right; }

.type-cell {
  text-align: center;
}

.type-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.type-badge.type-play {
  background-color: #4CAF50;
  color: white;
}

.type-badge.type-pause {
  background-color: #FF9800;
  color: white;
}

.duration-badge {
  display: inline-block;
  padding: 6px 10px;
  background-color: #e8f5e9;
  color: #2e7d32;
  border: 1px solid #c8e6c9;
  border-radius: 9999px;
  font-size: 0.9rem;
}

.duration-badge.duration-badge--active {
  background-color: #ffebee;
  color: #b71c1c;
  border-color: #ffcdd2;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
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

.form-group input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group input:disabled {
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

.cancel-button:hover:not(:disabled),
.confirm-button:hover:not(:disabled),
.delete-confirm-button:hover:not(:disabled),
.secondary-button:hover:not(:disabled) {
  opacity: 0.9;
}

.cancel-button:disabled,
.confirm-button:disabled,
.delete-confirm-button:disabled,
.secondary-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@media (max-width: 600px) {
  .modal-content {
    width: 90%;
    padding: 16px;
  }
  
  .card-header-wrapper {
    flex-direction: column;
    align-items: flex-start;
    padding: 8px 16px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-end;
    margin-top: 8px;
    flex-wrap: wrap;
  }
  
  .add-button,
  .create_schedule_button {
    flex: 1;
    min-width: 120px;
    margin-bottom: 8px;
  }
}
</style>