<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { useEndGameResultsStore } from '@/stores/end_game_results'
import { useGameConfig } from '@/composables/useGameConfig'

const { isGameActive } = useGameConfig()
const isArtel = computed(() => isGameActive('artel'))

const favorLabel = computed(() => {
  return isArtel.value ? 'Знаки отличия' : 'Боярские милости'
})

// Состояния UI
const isLoading = ref(false);
const errorMessage = ref(null);
const successMessage = ref(null);
const editingGuild = ref(null);
const endGameResultsStore = useEndGameResultsStore()

const merchants = computed(() => {
  return endGameResultsStore.merchantsList
})

// Функция для обновления данных
const refreshData = async () => {
  try {
    await endGameResultsStore.fetchScreenBundle()
  } catch (error) {
    errorMessage.value = 'Ошибка обновления данных'
  }
}

const editGuild = (guild) => {
  editingGuild.value = { ...guild };
  if (editingGuild.value.boyar_favor == null || !Number.isFinite(Number(editingGuild.value.boyar_favor))) {
    editingGuild.value.boyar_favor = 0;
  }
  if (editingGuild.value.money == null || !Number.isFinite(Number(editingGuild.value.money))) {
    editingGuild.value.money = 0;
  }
  if (
    editingGuild.value.number_of_players == null ||
    !Number.isFinite(Number(editingGuild.value.number_of_players)) ||
    Number(editingGuild.value.number_of_players) <= 0
  ) {
    editingGuild.value.number_of_players = 1
  }
};

const cancelEdit = () => {
  editingGuild.value = null;
};

const updateGuild = async () => {
  if (!editingGuild.value) return;
  
  isLoading.value = true;
  errorMessage.value = null;
  successMessage.value = null;
  
  try {
    const requestData = {
      guild_id: editingGuild.value.guild_id,
      money: editingGuild.value.money || 0,
      boyar_favor: Number.isFinite(Number(editingGuild.value.boyar_favor)) ? Number(editingGuild.value.boyar_favor) : 0,
      number_of_players: Math.max(1, Number(editingGuild.value.number_of_players) || 1),
    };

    await axios.patch(
      `${import.meta.env.VITE_PROXY}/game_parameters/update_results`, 
      { request: requestData }
    );
    
    successMessage.value = 'Данные гильдии обновлены!';
    editingGuild.value = null;
    await refreshData(); // Обновляем данные после успеха
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Ошибка при обновлении данных';
  } finally {
    isLoading.value = false;
  }
};

const clearGuildData = async (guild) => {
  if (!confirm(`Обнулить деньги и боярскую милость для гильдии ${guild.player}?`)) return;
  
  isLoading.value = true;
  errorMessage.value = null;
  
  try {
    const requestData = {
      guild_id: guild.guild_id
    };

    await axios.patch(`${import.meta.env.VITE_PROXY}/game_parameters/delete_result`, { request: requestData });
    
    successMessage.value = 'Данные гильдии обнулены!';
    await refreshData(); // Обновляем данные после удаления
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Ошибка при обнулении данных';
  } finally {
    isLoading.value = false;
  }
};

const handleToggleCapPerPlayer = async (event) => {
  const checked = event.target.checked
  isLoading.value = true
  try {
    await endGameResultsStore.updateShowCapPerPlayer(checked)
  } catch (error) {
    errorMessage.value = 'Ошибка обновления настройки'
  } finally {
    isLoading.value = false
  }
};

const handleToggleIntelligenceStatus = async (key, event) => {
  const checked = event.target.checked
  isLoading.value = true
  errorMessage.value = null
  try {
    await endGameResultsStore.updateIntelligenceDataStatus({
      ...endGameResultsStore.intelligenceDataStatus,
      [key]: checked,
    })
    successMessage.value = 'Статус разведданных обновлён'
  } catch (error) {
    errorMessage.value = 'Ошибка обновления статуса разведданных'
  } finally {
    isLoading.value = false
  }
}

// Загружаем данные при монтировании
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
      
      <!-- Настройка показа капитала на игрока -->
      <div class="merchant-settings" style="margin-bottom: 20px; padding: 12px; background-color: #f8f9fa; border-radius: 6px;">
        <label class="settings-checkbox" style="display: flex; align-items: center; gap: 8px; cursor: pointer; color: #2c3e50; font-size: 14px;">
          <input 
            type="checkbox" 
            :checked="endGameResultsStore.showCapPerPlayer"
            @change="handleToggleCapPerPlayer"
            style="cursor: pointer;"
            :disabled="isLoading"
          />
          <span>Считать ли результаты на игрока?</span>
        </label>
      </div>

      <div class="merchant-settings" style="margin-bottom: 20px; padding: 12px; background-color: #f8f9fa; border-radius: 6px;">
        <div style="font-weight: 600; color: #2c3e50; margin-bottom: 8px;">Разведданные Артели</div>
        <label class="settings-checkbox" style="display: flex; align-items: center; gap: 8px; cursor: pointer; color: #2c3e50; font-size: 14px; margin-bottom: 6px;">
          <input
            type="checkbox"
            :checked="endGameResultsStore.intelligenceDataStatus.military_recruitment"
            :disabled="isLoading"
            @change="handleToggleIntelligenceStatus('military_recruitment', $event)"
          />
          <span>Вербовка военных</span>
        </label>
        <label class="settings-checkbox" style="display: flex; align-items: center; gap: 8px; cursor: pointer; color: #2c3e50; font-size: 14px; margin-bottom: 6px;">
          <input
            type="checkbox"
            :checked="endGameResultsStore.intelligenceDataStatus.scientists_recruitment"
            :disabled="isLoading"
            @change="handleToggleIntelligenceStatus('scientists_recruitment', $event)"
          />
          <span>Вербовка учёных</span>
        </label>
        <label class="settings-checkbox" style="display: flex; align-items: center; gap: 8px; cursor: pointer; color: #2c3e50; font-size: 14px;">
          <input
            type="checkbox"
            :checked="endGameResultsStore.intelligenceDataStatus.teaching_staff_recruitment"
            :disabled="isLoading"
            @change="handleToggleIntelligenceStatus('teaching_staff_recruitment', $event)"
          />
          <span>Вербовка пед. состава</span>
        </label>
      </div>
      
      <div v-if="errorMessage" class="message error">
        {{ errorMessage }}
      </div>
      <div v-if="successMessage" class="message success">
        {{ successMessage }}
      </div>

      <!-- Список гильдий -->
      <div class="players-list">
        <h4>Список гильдий</h4>
        
        <div v-if="merchants.length === 0" class="empty-list">
          Нет данных о гильдиях
        </div>

        <div v-else class="player-items">
          <div v-for="(guild, index) in merchants" :key="guild.guild_id || index" class="player-item">
            <div class="player-info">
              <span class="place-badge" :class="{ 'place-1': guild.place === 1, 'place-2': guild.place === 2, 'place-3': guild.place === 3 }">
                {{ guild.place || '—' }}
              </span>
              <div class="player-meta">
                <div class="player-name">{{ guild.player }}</div>
                <div class="player-stats">
                  <span class="stat">Итоговый капитал: <strong>{{ formatNumber(guild.capital) }}</strong>💰</span>
                  <span class="stat">Стоимость предприятий: <strong>{{ formatNumber(guild.plants_value) }}</strong>💰</span>
                  <span class="stat">Деньги: <strong>{{ formatNumber(guild.money || 0) }}</strong>💰</span>
                  <span class="stat" v-if="guild.cap_per_pl">Капитал на игрока: <strong>{{ formatNumber(guild.cap_per_pl) }}</strong>💰</span>
                  <span class="stat">Игроков: <strong>{{ guild.number_of_players }}</strong>👥</span>
                  <span class="stat">{{ favorLabel }}: <strong>{{ formatNumber(guild.boyar_favor ?? 0) }}</strong>⚜️</span>
                </div>
              </div>
              <button 
                @click="editGuild(guild)"
                class="edit-btn"
                :disabled="isLoading"
              >
                Изменить
              </button>
            </div>

            <!-- Форма редактирования -->
            <div v-if="editingGuild && editingGuild.guild_id === guild.guild_id" class="edit-form">
              <div class="form-group">
                <label>Гильдия:</label>
                <input :value="guild.player" type="text" disabled class="disabled-input">
              </div>
              <div class="form-group">
                <label>Стоимость предприятий (вычисляется автоматически):</label>
                <input :value="formatNumber(guild.plants_value)" type="text" disabled class="disabled-input">
              </div>
              <div class="form-group">
                <label>Количество игроков:</label>
                <input v-model.number="editingGuild.number_of_players" type="number" min="1" required>
              </div>
              <div class="form-group">
                <label>Деньги:</label>
                <input v-model.number="editingGuild.money" type="number" min="0" required>
                <small class="form-hint">Добавляются к стоимости предприятий для расчета итогового капитала</small>
              </div>
              <div class="form-group">
                <label>{{ favorLabel }}:</label>
                <input v-model.number="editingGuild.boyar_favor" type="number" min="0">
              </div>
              <div class="form-actions">
                <button @click="updateGuild" class="save-btn" :disabled="isLoading">
                  Сохранить
                </button>
                <button @click="cancelEdit" class="cancel-btn" :disabled="isLoading">
                  Отмена
                </button>
                <button @click="clearGuildData(guild)" class="delete-btn" :disabled="isLoading">
                  Обнулить
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

.form-group input.disabled-input {
  background-color: #e9ecef;
  cursor: not-allowed;
}

.form-hint {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #666;
  font-style: italic;
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
