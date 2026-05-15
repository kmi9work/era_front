<template>
  <div class="management-mode">
    <div class="preview-container">
      <div class="preview-selector">
        <div 
          v-for="screen in screens"
          :key="screen.id"
          class="preview-card"
          :class="{ active: selectedScreen === screen.id }"
          @click="$emit('change-screen', screen.id)"
        >
          <div class="preview-title">
            <strong>{{ screen.label }}</strong>
          </div>
          
          <div class="preview-content">
            <!-- Заглушка -->
            <div v-if="screen.id === 'placeholder'" class="screen-preview">
              <img class="preview-image" :src="previewPlaceholder" alt="Заглушка">
            </div>
            
            <!-- Таймер -->
            <div v-else-if="screen.id === 'timer'" class="timer-preview">
              <div v-if="timerStore.isOutOfRange" class="preview-message">
                {{ timerMessage }}
              </div>
              <div v-else>
                <p class="preview-schedule-name">{{ timerStore.currentScheduleItemName }}</p>
                <p class="preview-timer-value">{{ timerStore.formattedRemainingTime }}</p>
              </div>
            </div>

            <!-- Товарооборот -->
            <div v-else-if="screen.id === 'trade_turnover'" class="timer-preview">
              <div class="preview-message">
                <p style="font-size: 1.2rem; margin-bottom: 8px;">Товарооборот</p>
                <p style="font-size: 0.9rem; opacity: 0.8;">Торговля с иностранными государствами</p>
              </div>
            </div>

            <!-- Артель -->
            <div v-else-if="screen.id === 'artel'" class="timer-preview">
              <div class="preview-message">
                <p style="font-size: 1.2rem; margin-bottom: 8px;">Артель</p>
                <p style="font-size: 0.9rem; opacity: 0.8;">Время и результаты</p>
              </div>
            </div>

            <!-- Государь -->
            <div v-else-if="screen.id === 'sovereign'" class="timer-preview">
              <div class="preview-message">
                <p style="font-size: 1.2rem; margin-bottom: 8px;">Государь</p>
                <p style="font-size: 0.9rem; opacity: 0.8;">Общее расписание + две команды</p>
              </div>
            </div>

            <!-- Результаты знати -->
            <div v-else-if="screen.id === 'noble_results'" class="results-preview">
              <div class="preview-message"></div>
              <div class="merchant-controls-compact">
                <button 
                  @click.stop="handleFilterClick('noblePlaceholder')"
                  :class="{ active: activeScreen === 'noblePlaceholder'}"
                  class="compact-button all-btn"
                  :disabled="endGameResultsStore.isLoading"
                  title="Показать все результаты"
                >
                  Заглушка
                </button>
                <button 
                  @click.stop="handleFilterClick( 'thirdPlaceNoble')"
                  :class="{ active: activeScreen === 'thirdPlaceNoble' }"
                  class="compact-button third-btn"
                  :disabled="endGameResultsStore.isLoading"
                  title="Только третье место"
                >
                  3.1
                </button>
                <button 
                  @click.stop="handleFilterClick({ screen: 'thirdNoble', place: 3 })"
                  :class="{ active: activeScreen === 'thirdNoble' }"
                  class="compact-button third-btn"
                  :disabled="endGameResultsStore.isLoading"
                  title="Только третье место"
                >
                  3
                </button>
                <button 
                  @click.stop="handleFilterClick( 'secondPlaceNoble')"
                  :class="{ active: activeScreen === 'secondPlaceNoble' }"
                  class="compact-button third-btn"
                  :disabled="endGameResultsStore.isLoading"
                  title="Только третье место"
                >
                  2.1
                </button>
                <button 
                  @click.stop="handleFilterClick({ screen: 'secondNoble', place: 2 })"
                  :class="{ active: activeScreen === 'secondNoble' }"
                  class="compact-button second-third-btn"
                  :disabled="endGameResultsStore.isLoading"
                  title="Второе и третье места"
                >
                  2
                </button>
                <button 
                  @click.stop="handleFilterClick( 'firstPlaceNoble')"
                  :class="{ active: activeScreen === 'firstPlaceNoble' }"
                  class="compact-button third-btn"
                  :disabled="endGameResultsStore.isLoading"
                  title="Только третье место"
                >
                  1.1
                </button>
                <button 
                  @click.stop="handleFilterClick({ screen: 'firstNoble', place: 1 })"
                  :class="{ active: activeScreen === 'firstNoble' }"
                  class="compact-button top-three-btn"
                  :disabled="endGameResultsStore.isLoading"
                  title="Топ 3 места"
                >
                  1
                </button>
                <button 
                  @click.stop="handleFilterClick({ screen: 'allNoble', place: 0 })"
                  :class="{ active: activeScreen === 'allNoble' }"
                  class="compact-button third-btn"
                  :disabled="endGameResultsStore.isLoading"
                  title="Только третье место"
                >
                  Вся знать
                </button>
              </div>
            </div>

            <!-- Результаты купцов -->
            <div v-else-if="screen.id === 'merchant_results'" class="results-preview">
              <div class="preview-message">
                <div class="sort-type-selector">
                  <button 
                    @click.stop="handleFilterClick( 'merchPlaceholder')"
                    :class="{ active: (activeScreen.startsWith('merch') && !activeScreen.includes('Boyar')) || activeScreen === 'merchPlaceholder' || activeScreen === 'allMerch' || activeScreen === 'firstMerch' || activeScreen === 'secondMerch' || activeScreen === 'thirdMerch' || activeScreen === 'firstPlaceMerch' || activeScreen === 'secondPlaceMerch' || activeScreen === 'thirdPlaceMerch' }"
                    class="sort-type-btn"
                    :disabled="endGameResultsStore.isLoading"
                    title="Сортировка по капиталу"
                  >
                    По капиталу
                  </button>
                  <button 
                    @click.stop="handleFilterClick( 'merchBoyarPlaceholder')"
                    :class="{ active: (activeScreen.includes('Boyar') && !activeScreen.includes('WithCapital')) || activeScreen === 'merchBoyarPlaceholder' || activeScreen === 'allMerchBoyar' || activeScreen === 'firstMerchBoyar' || activeScreen === 'secondMerchBoyar' || activeScreen === 'thirdMerchBoyar' || activeScreen === 'firstPlaceMerchBoyar' || activeScreen === 'secondPlaceMerchBoyar' || activeScreen === 'thirdPlaceMerchBoyar' }"
                    class="sort-type-btn"
                    :disabled="endGameResultsStore.isLoading"
                    title="Сортировка по боярским милостям"
                  >
                    По милостям
                  </button>
                  <button 
                    @click.stop="handleFilterClick( 'allMerchBoyarWithCapital')"
                    :class="{ active: activeScreen === 'allMerchBoyarWithCapital' }"
                    class="sort-type-btn"
                    :disabled="endGameResultsStore.isLoading"
                    title="Комбинированный (милости + капитал)"
                  >
                    Милости + Капитал
                  </button>
                </div>
              </div>
              
              <!-- По капиталу -->
              <div v-if="(activeScreen.includes('Merch') || activeScreen.startsWith('merch')) && !activeScreen.includes('Boyar') && activeScreen !== 'allMerchBoyarWithCapital'" class="merchant-controls-compact">
                <button 
                  @click.stop="handleFilterClick( 'merchPlaceholder')"
                  :class="{ active: activeScreen === 'merchPlaceholder'}"
                  class="compact-button all-btn"
                  :disabled="endGameResultsStore.isLoading"
                  title="Заглушка"
                >
                  Заглушка
                </button>
                <button 
                  @click.stop="handleFilterClick( 'thirdPlaceMerch')"
                  :class="{ active: activeScreen === 'thirdPlaceMerch' }"
                  class="compact-button third-btn"
                  :disabled="endGameResultsStore.isLoading"
                  title="Третье место"
                >
                  3.1
                </button>
                <button 
                  @click.stop="handleFilterClick({ screen: 'thirdMerch', place: 3 })"
                  :class="{ active: activeScreen === 'thirdMerch' }"
                  class="compact-button third-btn"
                  :disabled="endGameResultsStore.isLoading"
                  title="Третье место"
                >
                  3
                </button>
                <button 
                  @click.stop="handleFilterClick( 'secondPlaceMerch')"
                  :class="{ active: activeScreen === 'secondPlaceMerch' }"
                  class="compact-button third-btn"
                  :disabled="endGameResultsStore.isLoading"
                  title="Второе место"
                >
                  2.1
                </button>
                <button 
                  @click.stop="handleFilterClick({ screen: 'secondMerch', place: 2 })"
                  :class="{ active: activeScreen === 'secondMerch' }"
                  class="compact-button second-third-btn"
                  :disabled="endGameResultsStore.isLoading"
                  title="Второе место"
                >
                  2
                </button>
                <button 
                  @click.stop="handleFilterClick( 'firstPlaceMerch')"
                  :class="{ active: activeScreen === 'firstPlaceMerch' }"
                  class="compact-button third-btn"
                  :disabled="endGameResultsStore.isLoading"
                  title="Первое место"
                >
                  1.1
                </button>
                <button 
                  @click.stop="handleFilterClick({ screen: 'firstMerch', place: 1 })"
                  :class="{ active: activeScreen === 'firstMerch' }"
                  class="compact-button top-three-btn"
                  :disabled="endGameResultsStore.isLoading"
                  title="Первое место"
                >
                  1
                </button>
                <button 
                  @click.stop="handleFilterClick({ screen: 'allMerch', place: 0 })"
                  :class="{ active: activeScreen === 'allMerch' }"
                  class="compact-button third-btn"
                  :disabled="endGameResultsStore.isLoading"
                  title="Все купцы"
                >
                  Все
                </button>
              </div>

              <!-- По боярским милостям -->
              <div v-else-if="(activeScreen.includes('Boyar') || activeScreen.includes('MerchBoyar')) && !activeScreen.includes('WithCapital')" class="merchant-controls-compact">
                <button 
                  @click.stop="handleFilterClick( 'merchBoyarPlaceholder')"
                  :class="{ active: activeScreen === 'merchBoyarPlaceholder'}"
                  class="compact-button all-btn"
                  :disabled="endGameResultsStore.isLoading"
                  title="Заглушка"
                >
                  Заглушка
                </button>
                <button 
                  @click.stop="handleFilterClick( 'thirdPlaceMerchBoyar')"
                  :class="{ active: activeScreen === 'thirdPlaceMerchBoyar' }"
                  class="compact-button third-btn"
                  :disabled="endGameResultsStore.isLoading"
                  title="Третье место"
                >
                  3.1
                </button>
                <button 
                  @click.stop="handleFilterClick({ screen: 'thirdMerchBoyar', place: 3 })"
                  :class="{ active: activeScreen === 'thirdMerchBoyar' }"
                  class="compact-button third-btn"
                  :disabled="endGameResultsStore.isLoading"
                  title="Третье место"
                >
                  3
                </button>
                <button 
                  @click.stop="handleFilterClick( 'secondPlaceMerchBoyar')"
                  :class="{ active: activeScreen === 'secondPlaceMerchBoyar' }"
                  class="compact-button third-btn"
                  :disabled="endGameResultsStore.isLoading"
                  title="Второе место"
                >
                  2.1
                </button>
                <button 
                  @click.stop="handleFilterClick({ screen: 'secondMerchBoyar', place: 2 })"
                  :class="{ active: activeScreen === 'secondMerchBoyar' }"
                  class="compact-button second-third-btn"
                  :disabled="endGameResultsStore.isLoading"
                  title="Второе место"
                >
                  2
                </button>
                <button 
                  @click.stop="handleFilterClick( 'firstPlaceMerchBoyar')"
                  :class="{ active: activeScreen === 'firstPlaceMerchBoyar' }"
                  class="compact-button third-btn"
                  :disabled="endGameResultsStore.isLoading"
                  title="Первое место"
                >
                  1.1
                </button>
                <button 
                  @click.stop="handleFilterClick({ screen: 'firstMerchBoyar', place: 1 })"
                  :class="{ active: activeScreen === 'firstMerchBoyar' }"
                  class="compact-button top-three-btn"
                  :disabled="endGameResultsStore.isLoading"
                  title="Первое место"
                >
                  1
                </button>
                <button 
                  @click.stop="handleFilterClick({ screen: 'allMerchBoyar', place: 0 })"
                  :class="{ active: activeScreen === 'allMerchBoyar' }"
                  class="compact-button third-btn"
                  :disabled="endGameResultsStore.isLoading"
                  title="Все купцы"
                >
                  Все
                </button>
              </div>

              <!-- Комбинированный вывод -->
              <div v-else-if="activeScreen === 'allMerchBoyarWithCapital'" class="merchant-controls-compact">
                <div style="text-align: center; padding: 20px; color: #666;">
                  Комбинированный вывод (сортировка по боярским милостям)
                </div>
              </div>
            </div>
          </div>

          <!-- Кнопки управления для таймера -->
          <div 
            v-if="screen.id === 'timer'" 
            class="preview-controls"
            @click.stop
          >
            <button 
              v-if="!timerStore.autoStartNextCycle"
              @click="$emit('toggle-timer')"
              :disabled="timerStore.isLoading"
              class="timer-button"
              :class="{ 
                'active': !timerStore.isPaused,
                'loading': timerStore.isLoading,
                'paused': timerStore.isPaused && !timerStore.isLoading
              }"
            >
              <span v-if="!timerStore.isLoading">
                {{ timerStore.isPaused ? 'Запустить таймер' : 'Остановить таймер' }}
              </span>
              <span v-else class="loader">
                <svg class="spinner" viewBox="0 0 50 50">
                  <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
                </svg>
                Загрузка...
              </span>
            </button>
            
            <div v-else class="auto-mode-info">
              <span class="auto-mode-badge">🔄 Автоматический режим</span>
              <span class="auto-mode-text">Следующий цикл запустится автоматически</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="fullscreen-control">
      <button class="fullscreen-button" @click="$emit('toggle-fullscreen')">
        <span>Вывести на экран</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import previewPlaceholder from '@/assets/images/preview_placeholder.jpg'

const props = defineProps({
  selectedScreen: {
    type: String,
    required: true
  },
  activeScreen: {
    type: String,
    required: true
  },
  timerStore: {
    type: Object,
    required: true
  },
  endGameResultsStore: {
    type: Object,
    required: true
  },
  timerMessage: {
    type: String,
    default: 'Проверьте расписание. Либо его нет, либо циклы еще не начались, либо уже закончились'
  }
})

const emit = defineEmits(['change-screen', 'toggle-fullscreen', 'toggle-timer', 'filter-results'])

const handleFilterClick = (filter) => {
  emit('filter-results', filter)
}

const screens = [
  { id: 'placeholder', label: 'Заглушка' },
  { id: 'timer', label: 'Таймер' },
  { id: 'trade_turnover', label: 'Товарооборот' },
  { id: 'artel', label: 'Артель' },
  { id: 'merchant_results', label: 'Результаты купцов' },
  { id: 'noble_results', label: 'Результаты знати' },
  { id: 'sovereign', label: 'Государь' }
]
</script>

<style scoped lang="scss">
@import './Screen.style.scss';
</style>

