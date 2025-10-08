import { boot } from 'quasar/wrappers'
import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
})

export default boot(({ app }) => {
  api.interceptors.request.use((config) => {
    config.headers['X-Requested-With'] = 'XMLHttpRequest'
    return config
  })
  app.config.globalProperties.$api = api
})