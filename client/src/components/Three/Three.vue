<template>
    <div class="three">
        <div ref="three" />
    </div>
</template>

<script>
import { onMounted, onBeforeUnmount } from '@vue/composition-api'
import App from './app'

export default {
    name: 'Three',
    setup (props, { root, refs, emit }) {
        let app
        onMounted(() => {
            app = new App(refs.three)
            root.$store.dispatch('ADD_LOADING_STACK', app.init())

            app.on('clickObject', (target) => {
                if (target.name === 'socketButton') {
                    emit('open-socket')
                }
            })
        })
        onBeforeUnmount(() => {
            app.destroy()
        })
    },
}
</script>

<style lang="scss">
.three {

}
</style>
