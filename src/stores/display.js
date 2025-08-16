import { defineStore } from 'pinia'

export const useDisplayStore = defineStore('display', {
  state: () => ({
    selectedView: 'timer', // timer | placeholder | results
    players: []
  }),
  actions: {
    setView(view) {
      this.selectedView = view
    },
    setPlayers(list) {
      this.players = list
    }
  }
})