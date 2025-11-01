import { ref, onMounted, onUnmounted } from 'vue'

export function useFullscreen() {
  const isFullscreen = ref(false)

  // Функция для переключения полноэкранного режима
  const toggleFullscreen = () => {
    const element = document.getElementById('fullscreen-content')
    if (!element) return

    if (!isFullscreen.value) {
      if (element.requestFullscreen) {
        element.requestFullscreen()
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen()
      } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen()
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen()
      }
    }
  }

  // Обработчик клавиш
  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && isFullscreen.value) {
      isFullscreen.value = false
    }
  }

  // Обработчик изменения полноэкранного режима
  const handleFullscreenChange = () => {
    isFullscreen.value = !!document.fullscreenElement
  }

  // Настройка слушателей
  onMounted(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('msfullscreenchange', handleFullscreenChange)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown)
    document.removeEventListener('fullscreenchange', handleFullscreenChange)
    document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.removeEventListener('msfullscreenchange', handleFullscreenChange)
  })

  return {
    isFullscreen,
    toggleFullscreen
  }
}

