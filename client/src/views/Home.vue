<template>
    <div class="home">
        <Socket />
    </div>
</template>

<script>
import { onMounted } from '@vue/composition-api'
import functions from '@/compositions/functions'
import Socket from '@/components/Socket/Socket'

export default {
    name: 'Home',
    sockets: {
        connect () {
            // console.log('socket connected')
        },
    },
    components: {
        Socket,
    },
    setup (props, { root }) {
        const { loadImage } = functions()

        onMounted(() => {
            root.$store.dispatch('ADD_LOADING_STACK', loadImage())
        })
    },
}
</script>

<style lang="scss">

.home {
    @include size(100%, calc(var(--vh) * 100));
}
</style>
