import Vue from 'vue'
import Vuex from 'vuex'
import socketModule from './socket'

Vue.use(Vuex)

const LOADING = Object.freeze({
    MIN_LOAD_TIME: 500,
    LOADING_TYPE_DEFAULT: 'default',
    LOADING_TYPE_AJAX: 'ajax',
})
let maxLoadingStack = 0

export default new Vuex.Store({
    strict: process.env.NODE_ENV === 'development',
    modules: {
        socketModule,
    },
    state: {
        loadingConfig: {
            minTime: LOADING.MIN_LOAD_TIME,
            type: LOADING.LOADING_TYPE_DEFAULT,
        },
        loadingStack: [],
    },
    getters: {
        isLoading (state) {
            return !!state.loadingStack.length
        },
        loadingProgress (state) {
            return 1 - state.loadingStack.length / maxLoadingStack
        },
    },
    mutations: {
        CHANGE_LOADING_TYPE (state, payload) {
            const type = LOADING[payload]
            if (type && typeof type === 'string') {
                state.loadingConfig.type = type
            }
        },
        SET_LOADING_STACK (state, payload) {
            state.loadingStack.push(payload)
            maxLoadingStack = Math.max(state.loadingStack.length, maxLoadingStack)
        },
        DEL_LOADING_STACK (state, payload) {
            state.loadingStack.shift()
        },
    },
    actions: {
        AJAX (context, options) {
            return new Promise((resolve, reject) => {
                this._vm.$axios({
                    ...options,
                }).then(({ data, ...res }) => {
                    resolve(data)
                }).catch(e => {
                    reject(e)
                })
            })
        },
        ADD_LOADING_STACK ({ state, commit }, payload) {
            if (Array.isArray(payload)) {
                const promise = Promise.all(payload.filter(p => p instanceof Promise))
                commit('SET_LOADING_STACK', promise)
                return promise
            }
            if (payload instanceof Promise) {
                commit('SET_LOADING_STACK', payload)
                return payload
            }
        },
        WAIT_LOADING ({ state, commit }) {
            const startTime = Date.now()
            return Promise.all(state.loadingStack).then(results => {
                const endTime = Date.now()
                setTimeout(() => {
                    results.forEach(result => commit('DEL_LOADING_STACK'))
                    maxLoadingStack = 0
                }, state.loadingConfig.minTime - (endTime - startTime))
            })
        },
    },
})
