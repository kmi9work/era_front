import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const STORAGE_KEY = 'wallet_player'

function readStoredPlayer() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (error) {
    console.error('Error reading wallet player from localStorage:', error)
    return null
  }
}

export const useWalletPlayerStore = defineStore('walletPlayer', () => {
  const player = ref(readStoredPlayer())

  const hasPlayer = computed(() => !!player.value)

  function setPlayer(newPlayer) {
    player.value = newPlayer
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPlayer))
  }

  return {
    player,
    hasPlayer,
    setPlayer
  }
})
