<template>
    <div class="three">
        <div ref="three" />
        <transition name="fade">
            <div
                v-if="isTutorial"
                class="three__tutorial"
                @click="closeTutorial"
            >
                Click, Drag to turn the view. <br>
                Use " W, A, S, D " or " Up, Down, Right, Left " to move.
            </div>
        </transition>
        <Portal to="loading-default">
            <div class="three__loading">
                <div class="three__loading-loading">
                    <p
                        v-for="text in 'GNIDAOL'"
                        :key="text"
                    >
                        {{ text }}
                    </p>
                </div>
                <div class="three__loading-progress">
                    {{ lodingProgress }}
                </div>
            </div>
        </Portal>
    </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount } from '@vue/composition-api'
import App from './app'

export default {
    name: 'Three',
    setup (props, { root, refs, emit }) {
        const lodingProgress = ref(0)
        const isTutorial = ref(false)
        let app

        const closeTutorial = () => {
            isTutorial.value = false
            app.createAudio()
        }

        onMounted(() => {
            app = new App(refs.three)
            root.$store.dispatch('ADD_LOADING_STACK', app.init())

            app.on('loadProgress', (itemsLoaded, itemsTotal) => {
                lodingProgress.value = itemsLoaded * 100 >> 0
            })
            app.on('clickObject', (target) => {
                if (target.name === 'socketButton') {
                    emit('open-socket')
                }
            })

            root.$bus.$on('connect-socket', () => {
                app.stop()
            })
            root.$bus.$on('disconnect-socket', () => {
                app.start()
            })
        })
        onBeforeUnmount(() => {
            app.destroy()
            root.$bus.$off('connect-socket')
            root.$bus.$off('disconnect-socket')
        })

        return {
            lodingProgress,
            isTutorial,
            closeTutorial,
        }
    },
}
</script>

<style lang="scss">
.three {
    &__loading {
        @include size(100%);

        position: absolute;
        top: 0;
        left: 0;
        color: map-get($colors, white);
        background-color: map-get($colors, black);

        &-progress {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) translateY(100px);
        }

        &-loading {
            @include size(600px, 50px);

            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);

            > p {
                @include size(20px, 50px);

                position: absolute;
                opacity: 0;
                transform: rotate(180deg);
                animation: move 2s linear infinite;
                @for $i from 1 through 7 {
                    &:nth-of-type(#{$i}) {
                        animation-delay: ($i - 1) * 0.2s;
                    }
                }
            }
        }

        @keyframes move {
            0% {
                left: 0;
                opacity: 0;
            }

            35% {
                left: 41%;
                opacity: 1;
                transform: rotate(0deg);
            }

            65% {
                left: 59%;
                opacity: 1;
                transform: rotate(0deg);
            }

            100% {
                left: 100%;
                opacity: 0;
                transform: rotate(-180deg);
            }
        }
    }

    &__tutorial {
        @include size(100%);

        position: absolute;
        top: 0;
        left: 0;
        display: grid;
        text-align: center;
        color: map-get($colors, white);
        background-color: rgba(map-get($colors, black), 0.8);
        backdrop-filter: blur(5px);
        place-content: center;
    }

    .touch-controls {
        @include size(150px);

        position: fixed;
        bottom: 0;
        left: 50%;
        background-color: rgba(map-get($colors, black), 0.3);
        border-radius: 50%;
        transform: translate(-50%, -20px);

        &__btn {
            @include size(50px);

            position: absolute;
            top: 50%;
            left: 50%;
            background-color: rgba(map-get($colors, black), 0.3);
            border: 1px solid map-get($colors, white);
            border-radius: 50%;
            transform: translate(-50%, -50%);
        }
    }
}
</style>
