<template>
    <div class="about">
        <h1>This is an about page</h1>
        <button @click="getApi">
            Ajax Loading Test
        </button>
    </div>
</template>

<script>
import { onMounted } from '@vue/composition-api'
import functions from '@/compositions/functions'

export default {
    name: 'About',
    setup (props, { root }) {
        const { loadImage } = functions()

        const getApi = () => {
            root.$store.commit('CHANGE_LOADING_TYPE', 'LOADING_TYPE_AJAX')
            root.$store.dispatch('ADD_LOADING_STACK', new Promise(resolve => {
                setTimeout(() => {
                    resolve()
                }, 1000)
            }))
            root.$store.dispatch('WAIT_LOADING')
        }

        onMounted(() => {
            root.$store.dispatch('ADD_LOADING_STACK', loadImage())
        })

        return {
            getApi,
        }
    },
}
</script>

<style lang="scss">
.about {
    button {
        margin-top: 20px;
        padding: 5px 10px;
        border: 1px solid;
    }
}
</style>
