<template>
    <transition
        name="loading"
        @afterLeave="loadingDone"
    >
        <div
            v-show="loadingConfig.type === 'default' && isLoading"
            v-lock="loadingConfig.type === 'default' && isLoading"
            class="loading-default"
        />
    </transition>
</template>

<script>
import { computed } from '@vue/composition-api'

export default {
    name: 'LoadingDefault',
    setup (props, { root }) {
        const loadingConfig = computed(() => root.$store.state.loadingConfig)
        const isLoading = computed(() => root.$store.getters.isLoading)

        const loadingDone = () => {
        }

        return {
            loadingConfig,
            isLoading,
            loadingDone,
        }
    },
}
</script>

<style lang="scss">
.loading-default {
    @include size(100%);

    position: fixed;
    top: 0;
    left: 0;
    background-color: map-get($colors, black);
    pointer-events: none;
    z-index: 999;
}
</style>
