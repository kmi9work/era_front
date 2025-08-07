import { createApp } from 'vue'
import App from '@/App.vue'
import { registerPlugins } from '@core/utils/plugins'
import axios from 'axios'

// Styles
import '@core/scss/template/index.scss'
import '@layouts/styles/index.scss'
import '@/assets/fonts/fonts.css'

// Create vue app
const app = createApp(App)

axios.defaults.xsrfCookieName = "CSRF-TOKEN";
axios.defaults.xsrfHeaderName = "X-CSRF-Token";
axios.defaults.withCredentials = true;

// Register plugins
registerPlugins(app)

// app.config.globalProperties.$http = axios; // Allow axios in all componenets this.$http.get

// Mount vue app
app.mount('#app')
