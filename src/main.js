import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

// plugin
import VueLazyload from 'vue-lazyload'
import VueCompositionAPI from '@vue/composition-api'
import VueMeta from 'vue-meta'
import directive from '@/plugins/directives/index'
import prototype from '@/plugins/prototype/index'
import globalComponent from '@/plugins/globalComponent'

Vue.use(VueLazyload, {
    observer: true,
    attempt: 1,
    silent: process.env.NODE_ENV === 'production',
})
Vue.use(VueCompositionAPI)
Vue.use(VueMeta)
Vue.use(directive)
Vue.use(prototype)
Vue.use(globalComponent)

Vue.config.productionTip = false

new Vue({
    router,
    store,
    mounted () {
        document.dispatchEvent(new Event('render-event'))
    },
    render: (h) => h(App),
}).$mount('#app')
