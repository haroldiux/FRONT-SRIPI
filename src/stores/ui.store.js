import { defineStore } from 'pinia'
export const useUiStore = defineStore('ui', {
  state: () => ({ loading: false, toast: null }),
  actions: {
    setLoading(v) {
      this.loading = v
    },
    notify(msg, color = 'primary') {
      this.toast = { msg, color, ts: Date.now() }
    },
  },
})
