import { ref } from 'vue'
import axios from 'axios'

export function useGuilds() {
  const guilds = ref([])
  const selectedGuildId = ref(null)

  async function loadGuilds() {
    try {
      const response = await axios.get(`${import.meta.env.VITE_PROXY}/guilds.json`)
      guilds.value = response.data
      if (guilds.value.length > 0) {
        selectedGuildId.value = guilds.value[0].id
      }
    } catch (error) {
      console.error('Failed to load guilds:', error)
    }
  }

  return {
    guilds,
    selectedGuildId,
    loadGuilds
  }
}
