<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

const showModal = ref(false)
const showDeleteConfirm = ref(false)
const showEditModal = ref(false)
const error = ref(null)
const isLoading = ref(false)
const isDeleting = ref(false)
const schedule = ref([]) // Локальное состояние для расписания
const newItem = ref({
  identificator: '',
  finish: ''
})

const editItem = ref({
  id: null,
  identificator: '',
  start: '',
  finish: ''
})

// Вычисляем время окончания последнего цикла
const lastCycleFinish = computed(() => {
  if (schedule.value.length === 0) return '00:00'
  return schedule.value[schedule.value.length - 1].finish
})

// Проверяем, можно ли удалять элементы
const canDelete = computed(() => {
  return schedule.value.length > 0 && !isLoading.value && !isDeleting.value
})

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
// Подтверждение удаления
const confirmDelete = () => {
  showDeleteConfirm.value = true
}

// Функция удаления последнего пункта
const deleteLastItem = async () => {
  if (!canDelete.value) return
  
  try {
    isDeleting.value = true
    error.value = null
    const lastItem = schedule.value[schedule.value.length - 1]
    
    await axios.patch(
      `${import.meta.env.VITE_PROXY}/game_parameters/delete_schedule_item`,
      { request: { id: lastItem.id } }
    )
    
    // После успешного удаления обновляем расписание
    await fetchSchedule()
    showDeleteConfirm.value = false
  } catch (err) {
    console.error('Ошибка при удалении:', err)
    error.value = 'Не удалось удалить последний цикл'
  } finally {
    isDeleting.value = false
  }
}

const addNewItem = async () => {
  // Валидация
  error.value = null
  if (!newItem.value.identificator.trim()) {
    error.value = 'Введите название цикла'
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
          start: lastCycleFinish.value,
          finish: newItem.value.finish
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
    finish: ''
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
    finish: item.finish
  }
  showEditModal.value = true
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
          finish: editItem.value.finish
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
})
</script>

<template>
  <div class="card-fullwidth">
    <div class="card-header-wrapper">
      <h3 class="card-header">Расписание циклов</h3>
      <div class="header-actions">
        <button 
          class="delete-button"
          @click="confirmDelete"
          :disabled="!canDelete"
        >
          Удалить последний
        </button>
        <button 
          class="add-button" 
          @click="showModal = true"
          :disabled="isLoading"
        >
          <span v-if="!isLoading">+ Добавить</span>
          <span v-else>Загрузка...</span>
        </button>
      </div>
    </div>
    
    <div class="table-container">
      <table class="schedule-table">
        <thead>
          <tr>
            <th>№ Цикла</th>
            <th>Начало</th>
            <th>Окончание</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in schedule" :key="item.id">
            <td>{{ item.identificator }}</td>
            <td>{{ item.start }}</td>
            <td>{{ item.finish }}</td>
            <td>
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
          <label for="cycle-time">Время окончания (текущее начало: {{ lastCycleFinish }}):</label>
          <input 
            id="cycle-time" 
            v-model="newItem.finish" 
            type="time" 
            placeholder="HH:MM"
            :disabled="isLoading"
          >
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
    
    <!-- Модальное окно подтверждения удаления -->
    <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="showDeleteConfirm = false">
      <div class="modal-content">
        <h3>Подтверждение удаления</h3>
        
        <p>Вы действительно хотите удалить последний пункт расписания?</p>
        
        <div class="modal-actions">
          <button 
            class="cancel-button" 
            @click="showDeleteConfirm = false"
            :disabled="isDeleting"
          >
            Отмена
          </button>
          <button 
            class="delete-confirm-button" 
            @click="deleteLastItem"
            :disabled="isDeleting"
          >
            <span v-if="!isDeleting">Удалить</span>
            <span v-else>Удаление...</span>
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

.delete-button {
  background-color: #f44336;
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

.edit-button {
  background-color: #ff9800;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 0.85rem;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.add-button:hover:not(:disabled),
.delete-button:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.add-button:disabled,
.delete-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
  opacity: 0.7;
}

.table-container {
  overflow-x: auto;
  padding: 0 16px 16px;
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

.schedule-table th {
  background-color: #f5f5f5;
  padding: 12px 16px;
  text-align: left;
  font-weight: 500;
  color: #424242;
  border-bottom: 2px solid #e0e0e0;
}

.schedule-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  color: #616161;
}

.schedule-table tr:last-child td {
  border-bottom: none;
}

.schedule-table tr:hover td {
  background-color: #f5f5f5;
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

.cancel-button:hover:not(:disabled),
.confirm-button:hover:not(:disabled),
.delete-confirm-button:hover:not(:disabled) {
  opacity: 0.9;
}

.cancel-button:disabled,
.confirm-button:disabled,
.delete-confirm-button:disabled {
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
  
  .delete-button,
  .add-button {
    flex: 1;
    min-width: 120px;
    margin-bottom: 8px;
  }
}
</style>