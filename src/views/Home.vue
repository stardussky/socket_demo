<template>
    <div class="home">
        <img
            alt="Vue logo"
            src="../assets/logo.png"
        >
        <HelloWorld msg="Welcome to Your Vue.js App" />
    </div>
</template>

<script>
import { onMounted } from '@vue/composition-api'
import functions from '@/compositions/functions'
import HelloWorld from '@/components/HelloWorld.vue'

export default {
    name: 'Home',
    components: {
        HelloWorld,
    },
    setup (props, { root }) {
        const { loadImage } = functions()

        onMounted(() => {
            root.$store.dispatch('ADD_LOADING_STACK', loadImage())
        })
    },
}
</script>
