<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import axios from 'axios'

const API = import.meta.env.VITE_PROXY

const schedules = ref([])
const nowSeconds = ref(0)
const ticker = ref(null)

const toSeconds = (timeStr) => {
  if (!timeStr) return null
  const parts = String(timeStr).split(':').map(v => parseInt(v, 10))
  if (parts.length < 2 || parts.some(n => Number.isNaN(n))) return null
  const [h, m, s = 0] = parts
  return h * 3600 + m * 60 + s
}

const findActiveItem = (items) => {
  if (!items || items.length === 0) return null
  const now = nowSeconds.value
  for (const item of items) {
    const start = toSeconds(item.start)
    const finish = toSeconds(item.finish)
    if (start === null || finish === null) continue
    if (finish >= start) {
      if (start <= now && now < finish) return item
    } else {
      // через полночь
      if (now >= start || now < finish) return item
    }
  }
  return null
}

const computeRemaining = (item) => {
  if (!item) return null
  const finish = toSeconds(item.finish)
  if (finish === null) return null
  const now = nowSeconds.value
  let remaining = finish - now
  if (remaining < 0) remaining += 86400
  const hh = String(Math.floor(remaining / 3600)).padStart(2, '0')
  const mm = String(Math.floor((remaining % 3600) / 60)).padStart(2, '0')
  const ss = String(remaining % 60).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

const scheduleInfo = computed(() => {
  return schedules.value.map(s => {
    const active = findActiveItem(s.items || [])
    return {
      name: s.name || '—',
      activeItem: active,
      remaining: computeRemaining(active)
    }
  })
})

const fetchData = async () => {
  try {
    const res = await axios.get(`${API}/game_parameters/show_sovereign_schedule`)
    schedules.value = res.data.schedules || []
  } catch (err) {
    console.error('Ошибка загрузки расписания Государя:', err)
  }
}

onMounted(() => {
  fetchData()
  // Обновляем счётчик каждые 5 сек с сервера, каждую секунду локально
  setInterval(fetchData, 5000)
  const updateSeconds = () => {
    const d = new Date()
    nowSeconds.value = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds()
  }
  updateSeconds()
  ticker.value = setInterval(updateSeconds, 1000)
})

onUnmounted(() => {
  if (ticker.value) clearInterval(ticker.value)
})
</script>

<template>
  <div class="sovereign-fullscreen">
    <!-- Верхний таймер: Общее расписание -->
    <div class="sovereign-top">
      <div class="timer-block timer-block--top">
        <p class="sovereign-name sovereign-name--top">
          {{ scheduleInfo[0]?.name || 'Общее расписание' }}
        </p>
        <p class="sovereign-item-name sovereign-item-name--top">
          {{ scheduleInfo[0]?.activeItem?.identificator || '—' }}
        </p>
        <p class="sovereign-timer-value">
          {{ scheduleInfo[0]?.remaining || '00:00:00' }}
        </p>
      </div>
    </div>

    <!-- Нижний ряд: два таймера -->
    <div class="sovereign-bottom">
      <div class="timer-block timer-block--bottom timer-block--left">
        <p class="sovereign-name">
          {{ scheduleInfo[1]?.name || 'Команда №1' }}
        </p>
        <p class="sovereign-item-name">
          {{ scheduleInfo[1]?.activeItem?.identificator || '—' }}
        </p>
        <p class="sovereign-timer-value sovereign-timer-value--bottom">
          {{ scheduleInfo[1]?.remaining || '00:00:00' }}
        </p>
      </div>

      <div class="timer-divider" />

      <div class="timer-block timer-block--bottom timer-block--right">
        <p class="sovereign-name">
          {{ scheduleInfo[2]?.name || 'Команда №2' }}
        </p>
        <p class="sovereign-item-name">
          {{ scheduleInfo[2]?.activeItem?.identificator || '—' }}
        </p>
        <p class="sovereign-timer-value sovereign-timer-value--bottom">
          {{ scheduleInfo[2]?.remaining || '00:00:00' }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import './Screen.style.scss';

.sovereign-fullscreen {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  color: white;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.7);
  font-family: var(--game-font, 'Beryozki', sans-serif);
}

/* Верхняя часть — 30% */
.sovereign-top {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  border-bottom: 2px solid rgba(255, 255, 255, 0.15);
}

/* Нижняя часть — 70% */
.sovereign-bottom {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.timer-block {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 20px;
}

.timer-block--top {
  width: 100%;
}

.timer-block--bottom {
  flex: 1;
  max-width: 50%;
}

.timer-divider {
  width: 2px;
  height: 60%;
  background: linear-gradient(
    180deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
}

/* Имя расписания */
.sovereign-name {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  opacity: 0.85;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.sovereign-name--top {
  font-size: 3rem;
  margin-bottom: 1rem;
}

/* Имя активного события */
.sovereign-item-name {
  font-size: 2.8rem;
  margin-bottom: 0.5rem;
  opacity: 0.7;
  font-family: var(--game-font, 'Beryozki', sans-serif);
}

.sovereign-item-name--top {
  font-size: 3.2rem;
  margin-bottom: 1rem;
}

/* Значение таймера */
.sovereign-timer-value {
  font-size: 7rem;
  font-weight: bold;
  line-height: 0.9;
  font-feature-settings: "tnum";
  text-rendering: optimizeLegibility;
  font-family: var(--game-font, 'Beryozki', monospace);
}

.sovereign-timer-value--bottom {
  font-size: 10rem;
}
</style>
