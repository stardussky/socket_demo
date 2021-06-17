<template>
    <div class="home">
        <Three
            @open-socket="isSocket = true"
        />
        <Socket
            v-show="isSocket"
            @close-socket="isSocket = false"
        />
    </div>
</template>

<script>
import { ref, onMounted } from '@vue/composition-api'
import functions from '@/compositions/functions'
import Socket from '@/components/Socket/Socket'
import Three from '@/components/Three/Three'

export default {
    name: 'Home',
    sockets: {
        connect () {
            // console.log('socket connected')
        },
    },
    components: {
        Socket,
        Three,
    },
    setup (props, { root }) {
        const { loadImage } = functions()
        const isSocket = ref(false)

        onMounted(() => {
            root.$store.dispatch('ADD_LOADING_STACK', loadImage())
        })

        return {
            isSocket,
        }
    },
}
</script>

<style lang="scss">

.home {
    @include size(100%, calc(var(--vh) * 100));
}
</style>
