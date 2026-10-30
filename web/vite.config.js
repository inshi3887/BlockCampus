import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
export default defineConfig({plugins:[vue()],resolve:{alias:{vue:'vue/dist/vue.esm-bundler.js'}},server:{host:'127.0.0.1',proxy:{'/api':'http://127.0.0.1:3001'}},build:{rollupOptions:{input:{game:'index.html',admin:'admin.html'}}}})
