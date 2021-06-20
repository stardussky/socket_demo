<template>
    <transition
        name="loading-ajax"
        @afterLeave="loadingDone"
    >
        <div
            v-show="loadingConfig.type === 'ajax' && isLoading"
            v-lock="loadingConfig.type === 'ajax' && isLoading"
            class="loading-ajax"
        >
            <Portal-target name="loading-ajax" />
        </div>
    </transition>
</template>

<script>
import { computed } from '@vue/composition-api'

export default {
    name: 'LoadingAjax',
    setup (props, { root }) {
        const loadingConfig = computed(() => root.$store.state.loadingConfig)
        const isLoading = computed(() => root.$store.getters.isLoading)

        const loadingDone = () => {
            root.$store.commit('CHANGE_LOADING_TYPE', 'LOADING_TYPE_DEFAULT')
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
.loading-ajax {
    @include size(100%);

    position: fixed;
    top: 0;
    left: 0;
    z-index: 999;
    cursor: wait;

    > * {
        pointer-events: none;
    }
}
</style>
