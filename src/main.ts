/**
 * 应用入口文件
 */

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './router/guards' // Import guards
import 'ant-design-vue/dist/reset.css'

// 导入 Tailwind CSS
import './assets/styles/main.css'
import { permissionDirective } from '@/directives/permission'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

app.directive('permission', permissionDirective)

app.mount('#app')
