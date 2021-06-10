import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '@/views/Home.vue'

Vue.use(VueRouter)

const routes = [
    {
        path: '/index.html',
        name: 'Home',
        component: Home,
    },
    {
        path: '/about.html',
        name: 'About',
        component: () => import(/* webpackChunkName: "About" */ '@/views/About.vue'),
    },
    {
        path: '*',
        redirect: '/index.html',
    },
]

const router = new VueRouter({
    mode: 'history',
    base: process.env.BASE_URL,
    routes,
})

export default router
