<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useTimerStore } from '@/stores/timer'

// Импортируем картинки как модули (Vite сам подставит правильные пути)
 import previewTimer from '@/assets/images/preview_timer.jpg'
import previewPlaceholder from '@/assets/images/preview_placeholder.jpg'
 import previewResults from '@/assets/images/preview_results.jpg'

const timerStore = useTimerStore()
const isFullscreen = ref(false)
const selectedScreen = ref('timer') // timer | placeholder | results

const enterFullscreen = () => {
  const element = document.getElementById('fullscreen-content')
  if (!element) return
  if (element.requestFullscreen) {
    element.requestFullscreen()
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen()
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen()
  }
}

const exitFullscreen = () => {
  if (document.exitFullscreen) {
    document.exitFullscreen()
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen()
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen()
  }
}

const handleKeyDown = (e) => {
  if (e.key === 'Escape' && isFullscreen.value) {
    exitFullscreen()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement
  })
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <!-- Обычный режим -->
  <div v-if="!isFullscreen" class="preview-selector">
    <div class="preview-item" @click="selectedScreen = 'timer'">
      <img :src="previewTimer" alt="Таймер">
      <p>Таймер</p>
    </div>
    <div class="preview-item" @click="selectedScreen = 'placeholder'">
      <img :src="previewPlaceholder" alt="Заглушка">
      <p>Заглушка</p>
    </div>
    <div class="preview-item" @click="selectedScreen = 'results'">
      <img :src="previewResults" alt="Результаты">
      <p>Результаты</p>
    </div>

    <button @click="enterFullscreen">Полный экран</button>
  </div>

  <!-- Полноэкранный режим -->
  <div id="fullscreen-content" class="fullscreen">
    <template v-if="selectedScreen === 'timer'">
      <div class="fullscreen-timer">
        <p>{{ timerStore.currentScheduleItemName }}</p>
        <p>{{ timerStore.formattedRemainingTime }}</p>
      </div>
    </template>

    <template v-else-if="selectedScreen === 'placeholder'">
      <img :src="previewPlaceholder" alt="Заглушка">
    </template>

    <template v-else-if="selectedScreen === 'results'">
      <ul>
        <li v-for="(player, index) in timerStore.players" :key="player.id">
          {{ index + 1 }}. {{ player.name }} — {{ player.score }}
        </li>
      </ul>
    </template>
  </div>
</template>

<style scoped>
.preview-selector {
  display: flex;
  gap: 1rem;
}

.preview-item {
  width: 200px;
  text-align: center;
  cursor: pointer;
}

.preview-item img {
  width: 100%;
  height: auto;
  border-radius: 8px;
}

.fullscreen {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: #121212 url('@/assets/images/background/back.jpg') no-repeat center center;
  color: white;
}


.fullscreen-timer p {
  font-family: 'Beryozki', sans-serif;
  font-size: 12rem;
  font-weight: 500;
  font-weight: bold;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  margin-bottom: 1rem;;
}
</style>

