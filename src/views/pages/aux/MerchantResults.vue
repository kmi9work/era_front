<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { useEndGameResultsStore } from '@/stores/end_game_results'

// Состояния формы
const formData = ref({
  player: '',
  capital: 0,
  number_of_players: 1,
  boyar_favor: 0,
});

// Состояния UI
const isLoading = ref(false);
const isFormVisible = ref(false);
const errorMessage = ref(null);
const successMessage = ref(null);
const editingMerchant = ref(null);
const endGameResultsStore = useEndGameResultsStore()

const merchants = computed(() => {
  return endGameResultsStore.merchantsList
})

// Функция для обновления данных
const refreshData = async () => {
  try {
    await endGameResultsStore.fetchMerchantResults()
  } catch (error) {
    errorMessage.value = 'Ошибка обновления данных'
  }
}

const editPlayer = (player) => {
  editingMerchant.value = { ...player };
  if (editingMerchant.value.boyar_favor == null || !Number.isFinite(Number(editingMerchant.value.boyar_favor))) {
    editingMerchant.value.boyar_favor = 0;
  }
};

const cancelEdit = () => {
  editingMerchant.value = null;
};

const updatePlayer = async () => {
  if (!editingMerchant.value) return;
  
  isLoading.value = true;
  errorMessage.value = null;
  successMessage.value = null;
  
  try {
    const requestData = {
      player_id: editingMerchant.value.player_id,
      player: editingMerchant.value.player,
      capital: editingMerchant.value.capital,
      number_of_players: editingMerchant.value.number_of_players,
      boyar_favor: Number.isFinite(Number(editingMerchant.value.boyar_favor)) ? Number(editingMerchant.value.boyar_favor) : 0,
    };

    await axios.patch(
      `${import.meta.env.VITE_PROXY}/game_parameters/update_results`, 
      { request: requestData }
    );
    
    successMessage.value = 'Данные игрока обновлены!';
    editingMerchant.value = null;
    await refreshData(); // Обновляем данные после успеха
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Ошибка при обновлении данных';
  } finally {
    isLoading.value = false;
  }
};

const deleteResult = async (player) => {
  if (!confirm(`Удалить игрока ${player.player}?`)) return;
  
  isLoading.value = true;
  errorMessage.value = null;
  
  try {
    const requestData = {
      player_id: player.player_id
    };

    await axios.patch(`${import.meta.env.VITE_PROXY}/game_parameters/delete_result`, { request: requestData });
    
    successMessage.value = 'Игрок удален!';
    await refreshData(); // Обновляем данные после удаления
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Ошибка при удалении игрока';
  } finally {
    isLoading.value = false;
  }
};

const addResult = async () => {
  errorMessage.value = null;
  successMessage.value = null;
  isLoading.value = true;
  
  try {
    const requestData = {
      player: formData.value.player,
      capital: formData.value.capital,
      number_of_players: formData.value.number_of_players,
      boyar_favor: Number.isFinite(Number(formData.value.boyar_favor)) ? Number(formData.value.boyar_favor) : 0,
    };
    
    await axios.patch(
      `${import.meta.env.VITE_PROXY}/game_parameters/save_sorted_results`, 
      { request: requestData }
    );
    
    successMessage.value = 'Данные успешно сохранены!';
    formData.value = { player: '', capital: 0, number_of_players: 1, boyar_favor: 0 };
    isFormVisible.value = false;
    await refreshData(); // Обновляем данные после добавления
    
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Произошла ошибка при отправке данных';
  } finally {
    isLoading.value = false;
  }
};

// Загружаем игроков при монтировании
onMounted(() => {
  refreshData();
  endGameResultsStore.startPolling(); // Запускаем polling если нужно
});

// Helpers
const formatNumber = (val) => {
  if (val === null || val === undefined || val === '') return '—';
  try {
    return new Intl.NumberFormat('ru-RU').format(Number(val));
  } catch {
    return String(val);
  }
};
</script>


<template>
  <div class="players-container">
    <!-- Основная карточка -->
    <div class="card main-card">
      <h3 class="card-title">Результаты торговцев</h3>
      
      <button 
        @click="isFormVisible = !isFormVisible"
        class="toggle-form-btn"
        :disabled="isLoading"
      >
        {{ isFormVisible ? 'Скрыть форму' : 'Добавить результат' }}
      </button>
      
      <!-- Форма добавления игрока -->
      <div v-if="isFormVisible" class="card form-card">
        <h4 class="form-title">Данные игрока</h4>
        
        <form @submit.prevent="addResult" class="form">
          <div v-if="errorMessage" class="message error">
            {{ errorMessage }}
          </div>
          <div v-if="successMessage" class="message success">
            {{ successMessage }}
          </div>
          
          <div class="form-group">
            <label for="player">Имя игрока:</label>
            <input
              id="player"
              v-model="formData.player"
              type="text"
              class="form-input"
              required
              :disabled="isLoading"
            >
          </div>
         
          <div class="form-group">
            <label for="capital">Капитал:</label>
            <input
              id="capital"
              v-model.number="formData.capital"
              type="number"
              class="form-input"
              required
              min="0"
              :disabled="isLoading"
            >
          </div>
          
          <div class="form-group">
            <label for="number_of_players">Количество игроков:</label>
            <input
              id="number_of_players"
              v-model.number="formData.number_of_players"
              type="number"
              class="form-input"
              required
              min="1"
              :disabled="isLoading"
            >
          </div>
          
          <div class="form-group">
            <label for="boyar_favor">Боярская милость:</label>
            <input
              id="boyar_favor"
              v-model.number="formData.boyar_favor"
              type="number"
              class="form-input"
              min="0"
              :disabled="isLoading"
            >
          </div>

          <button 
            type="submit" 
            class="submit-btn"
            :disabled="isLoading"
          >
            <span v-if="!isLoading">Сохранить</span>
            <span v-else class="loader">Сохранение...</span>
          </button>
        </form>
      </div>

      
      <!-- Список игроков -->
      <div class="players-list">
        <h4>Список игроков</h4>
        
        <div v-if="merchants.length === 0" class="empty-list">
          Нет данных об игроках
        </div>

        <div v-else class="player-items">
          <div v-for="(player, index) in merchants" :key="player.player_id || index" class="player-item">
            <div class="player-info">
              <span class="place-badge" :class="{ 'place-1': player.place === 1, 'place-2': player.place === 2, 'place-3': player.place === 3 }">
                {{ player.place || '—' }}
              </span>
              <div class="player-meta">
                <div class="player-name">{{ player.player }}</div>
                <div class="player-stats">
                  <span class="stat">Капитал: <strong>{{ formatNumber(player.capital) }}</strong></span>
                  <span class="stat" v-if="player.cap_per_pl">Капитал на игрока: <strong>{{ formatNumber(player.cap_per_pl) }}</strong></span>
                  <span class="stat">Игроков: <strong>{{ player.number_of_players }}</strong></span>
                  <span class="stat">Боярская милость: <strong>{{ formatNumber(player.boyar_favor ?? 0) }}</strong></span>
                </div>
              </div>
              <button 
                @click="editPlayer(player)"
                class="edit-btn"
                :disabled="isLoading"
              >
                Изменить
              </button>
            </div>

            <!-- Форма редактирования -->
            <div v-if="editingMerchant && editingMerchant.player_id === player.player_id" class="edit-form">
              <div class="form-group">
                <label>Имя:</label>
                <input v-model="editingMerchant.player" type="text" required>
              </div>
              <div class="form-group">
                <label>Капитал:</label>
                <input v-model.number="editingMerchant.capital" type="number" min="0" required>
              </div>
              <div class="form-group">
                <label>Игроков:</label>
                <input v-model.number="editingMerchant.number_of_players" type="number" min="1" required>
              </div>
              <div class="form-group">
                <label>Боярская милость:</label>
                <input v-model.number="editingMerchant.boyar_favor" type="number" min="0">
              </div>
              <div class="form-actions">
                <button @click="updatePlayer" class="save-btn" :disabled="isLoading">
                  Сохранить
                </button>
                <button @click="cancelEdit" class="cancel-btn" :disabled="isLoading">
                  Отмена
                </button>
                <button @click="deleteResult(player)" class="delete-btn" :disabled="isLoading">
                  Удалить
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<style scoped>
.players-container {
  max-width: 100%;
  width: 100%;
  margin: 0;
  padding: 20px;
}

.main-card {
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-title {
  margin-top: 0;
  margin-bottom: 20px;
  color: #2c3e50;
  text-align: center;
}

.toggle-form-btn {
  display: block;
  width: 100%;
  padding: 12px;
  margin-bottom: 20px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.toggle-form-btn:hover {
  background-color: #3aa876;
}

.form-card {
  margin-bottom: 25px;
  padding: 20px;
  background-color: #f9f9f9;
}

.form-title {
  margin-top: 0;
  margin-bottom: 15px;
  color: #2c3e50;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-input {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 16px;
}

.submit-btn {
  padding: 12px;
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.submit-btn:hover:not(:disabled) {
  background-color: #0b7dda;
}

.players-list { margin-top: 25px; }

.players-list h4 {
  margin-bottom: 15px;
  color: #2c3e50;
}

.empty-list {
  padding: 15px;
  text-align: center;
  color: #666;
  background-color: #f5f5f5;
  border-radius: 6px;
}

.debug-box {
  margin-top: 16px;
  padding: 12px;
  border: 1px dashed #aaa;
  border-radius: 8px;
  background: #fcfcfc;
}

.player-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.player-item {
  padding: 15px;
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.player-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.08);
}

.player-info {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 12px;
}

.player-meta { flex: 1; }
.player-name { font-weight: 600; font-size: 16px; margin-bottom: 4px; }
.player-stats { display: flex; gap: 16px; flex-wrap: wrap; color: #555; font-size: 14px; }
.player-stats .stat strong { color: #111; }

.place-badge {
  min-width: 36px;
  height: 36px;
  padding: 0 8px;
  border-radius: 9999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #eef2f7;
  color: #111827;
  font-weight: 700;
}
.place-badge.place-1 { background: #fff7e6; color: #b45309; }
.place-badge.place-2 { background: #edf2ff; color: #1e40af; }
.place-badge.place-3 { background: #f3e8ff; color: #6d28d9; }

.message {
  padding: 10px;
  border-radius: 5px;
  margin-bottom: 15px;
  text-align: center;
}

.message.error {
  background-color: #ffebee;
  color: #c62828;
  border: 1px solid #ef9a9a;
}

.message.success {
  background-color: #e8f5e9;
  color: #2e7d32;
  border: 1px solid #a5d6a7;
}

.loader {
  display: inline-flex;
  align-items: center;
}

.loader::after {
  content: "";
  width: 16px;
  height: 16px;
  border: 2px solid #fff;
  border-bottom-color: transparent;
  border-radius: 50%;
  display: inline-block;
  animation: rotation 1s linear infinite;
  margin-left: 8px;
}

@keyframes rotation {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.edit-btn {
  padding: 5px 10px;
  background-color: #ffc107;
  color: #212529;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.edit-btn:hover:not(:disabled) {
  background-color: #e0a800;
}

.edit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.edit-form {
  margin-top: 10px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.form-group {
  margin-bottom: 10px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.save-btn {
  padding: 8px 15px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.cancel-btn {
  padding: 8px 15px;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.delete-btn {
  padding: 8px 15px;
  background-color: #ff4444;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.delete-btn:hover:not(:disabled) {
  background-color: #cc0000;
}
</style>
