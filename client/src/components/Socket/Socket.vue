<template>
    <transition
        name="fade"
        @enter="transitionEnter"
        @after-leave="transitionLeave"
    >
        <div class="socket">
            <div
                ref="socket"
                class="socket__canvas -cursor"
            />
            <div
                ref="sketch"
                class="socket__canvas -sketch"
            />
            <div class="socket__colors">
                <ul class="socket__colors-list">
                    <li
                        v-for="color in colors"
                        :key="color"
                        class="socket__colors-color"
                        :style="{ backgroundColor: color }"
                        @click="changeColor(color)"
                    />
                </ul>
                <div class="socket__name">
                    <input
                        v-model.trim="name"
                        type="text"
                        @keydown.enter="changeName"
                    >
                    <button @click="changeName">
                        更改
                    </button>
                </div>
            </div>
            <div
                class="socket__chat"
                :class="{'-hide': hiddenChats}"
            >
                <div class="socket__chat-control">
                    <div
                        class="socket__chat-control-smaller"
                        @click="hiddenChats = !hiddenChats"
                    >
                        <Icon
                            v-show="!hiddenChats"
                            name="small-window"
                        />
                        <Icon
                            v-show="hiddenChats"
                            name="big-window"
                        />
                    </div>
                </div>
                <ul
                    ref="talks"
                    class="socket__chat-talks"
                >
                    <li
                        v-for="{ id, name, color, time, value } in chats"
                        :key="id + time"
                        class="socket__chat-talk"
                        :class="{'-self': ID === id}"
                        :style="{ color }"
                    >
                        <p>
                            <span>{{ name }} : </span>
                            <span>{{ value }}</span>
                        </p>
                    </li>
                </ul>
                <div class="socket__chat-input">
                    <input
                        v-model.trim="chatInput"
                        type="text"
                        @keydown.enter="submitChat"
                    >
                    <button @click="submitChat">
                        送出
                    </button>
                </div>
            </div>
            <div
                class="socket__close"
                @click="$emit('close-socket')"
            >
                <Icon name="cancel" />
            </div>
            <Portal to="loading-ajax">
                <div
                    class="socket__loading"
                >
                    <svg
                        id="loader-1"
                        version="1.1"
                        xmlns="http://www.w3.org/2000/svg"
                        xmlns:xlink="http://www.w3.org/1999/xlink"
                        x="0px"
                        y="0px"
                        width="40px"
                        height="40px"
                        viewBox="0 0 50 50"
                        style="enable-background: new 0 0 50 50;"
                        xml:space="preserve"
                    >
                        <path
                            fill="#fff"
                            d="M25.251,6.461c-10.318,0-18.683,8.365-18.683,18.683h4.068c0-8.071,6.543-14.615,14.615-14.615V6.461z"
                        >
                            <animateTransform
                                attributeType="xml"
                                attributeName="transform"
                                type="rotate"
                                from="0 25 25"
                                to="360 25 25"
                                dur="0.6s"
                                repeatCount="indefinite"
                            />
                        </path>
                    </svg>
                </div>
            </Portal>
        </div>
    </transition>
</template>

<script>
import { ref, onMounted, onBeforeUnmount } from '@vue/composition-api'
import CursorApp from './cursorApp'
import Sketch from './sketch'

export default {
    name: 'Socket',
    setup (props, { refs, root }) {
        let cursorApp, sketch
        const ID = ref(null)
        const colors = ref(null)
        const name = ref(null)
        const chats = ref(null)
        const hiddenChats = ref(true)
        const chatInput = ref(null)

        root.sockets.subscribe('get-colors', (payload) => {
            colors.value = payload
        })
        const socketEvents = () => {
            root.sockets.subscribe('get-user', (user) => {
                ID.value = user.ID
                name.value = user.name
            })
            root.sockets.subscribe('get-chats', (payload) => {
                chats.value = payload
                scrollTalksBottom()
            })
            root.sockets.subscribe('updated-chats', (chat) => {
                chats.value.push(chat)
                scrollTalksBottom()
            })
        }
        const unSubSocketEvents = () => {
            root.sockets.unsubscribe('get-user')
            root.sockets.unsubscribe('get-chats')
            root.sockets.unsubscribe('updated-chats')
        }
        const changeColor = (color) => {
            cursorApp.changeColor(color)
        }
        const changeName = () => {
            if (name.value) {
                cursorApp.changeName(name.value)
            }
        }
        const submitChat = () => {
            if (chatInput.value) {
                root.$socket.emit('submit-chat', chatInput.value)
            }
            chatInput.value = null
        }
        const scrollTalksBottom = () => {
            requestAnimationFrame(() => {
                refs.talks.scrollTop = refs.talks.scrollHeight
            })
        }
        const transitionEnter = () => {
            root.$bus.$emit('connect-socket')
            window.dispatchEvent(new Event('resize'))
            socketEvents()
            root.$socket.emit('join')
            cursorApp.start()
            sketch.start()
        }
        const transitionLeave = () => {
            root.$bus.$emit('disconnect-socket')
            unSubSocketEvents()
            root.$socket.emit('leave')
            cursorApp.stop()
            sketch.stop()
        }

        onMounted(() => {
            cursorApp = new CursorApp(
                refs.socket,
                root.$socket,
                root.sockets
            )
            sketch = new Sketch(
                refs.sketch,
                root.$socket,
                root.sockets
            )

            sketch.on('loadHistory', () => {
                root.$store.commit('CHANGE_LOADING_TYPE', 'LOADING_TYPE_AJAX')
                root.$store.dispatch('ADD_LOADING_STACK', new Promise(resolve => {
                    requestAnimationFrame(() => {
                        resolve()
                    })
                }))
            })
            sketch.on('loadedHistory', () => {
                root.$store.dispatch('WAIT_LOADING')
            })
        })
        onBeforeUnmount(() => {
            cursorApp.destroy()
            sketch.destroy()
            root.sockets.unsubscribe('get-colors')
            unSubSocketEvents()
        })

        return {
            ID,
            colors,
            changeColor,
            name,
            changeName,
            chats,
            hiddenChats,
            chatInput,
            submitChat,
            transitionEnter,
            transitionLeave,
        }
    },
}
</script>

<style lang="scss">
.socket {
    @include size(100%);

    position: fixed;
    top: 0;
    left: 0;
    background-color: rgba(map-get($colors, black), 0.8);
    backdrop-filter: blur(5px);
    z-index: 1;
    // cursor: none;

    &__canvas {
        @include size(100%);

        position: absolute;
        top: 0;
        left: 0;

        > * {
            position: absolute;
            top: 0;
            left: 0;
        }
    }

    &__colors {
        position: absolute;
        bottom: 0;
        left: 50%;
        padding: 15px 20px;
        text-align: center;
        background-color: map-get($colors, white);
        border-radius: 100px;
        box-shadow: 5px 5px 10px rgba(map-get($colors, black), 0.5);
        transform: translate(-50%, -50px);
        cursor: auto;

        &-list {
            display: flex;
            align-self: center;
            margin: 5px 0 10px;
        }

        &-color {
            @include size(30px);

            margin: 0 10px;
            border: 2px solid map-get($colors, deep);
            border-radius: 50%;
            cursor: pointer;
        }
    }

    &__name {
        input {
            @include typo('list', 1);

            padding: 5px 10px;
            background-color: map-get($colors, grey);
            border-radius: 20px;
        }

        button {
            @include typo('list', 1);

            margin-left: 5px;
            transition: opacity .4s;
            @media (hover: hover) and (pointer: fine) {
                &:hover {
                    opacity: 0.5;
                }
            }
        }
    }

    &__chat {
        @include typo('list', 1);
        @include size(350px, 500px);

        position: absolute;
        bottom: 50px;
        right: 20px;
        display: flex;
        padding: 10px 15px;
        background-color: map-get($colors, white);
        border-radius: 10px;
        z-index: 1;
        box-shadow: 5px 5px 10px rgba(map-get($colors, black), 0.5);
        transition: width .4s, height .4s .2s, border-radius .4s;
        flex-direction: column;
        cursor: auto;
        transform-origin: bottom-right;

        &.-hide {
            @include size(55px);

            overflow: hidden;
            border-radius: 50%;
            transition: width .4s .2s, height .4s, border-radius .4s .4s;
        }

        &-control {
            display: flex;
            justify-content: flex-end;

            &-smaller {
                padding: 5px;
                transition: opacity .4s;
                cursor: pointer;
                @media (hover: hover) and (pointer: fine) {
                    &:hover {
                        opacity: 0.5;
                    }
                }
            }
        }

        &-talks {
            flex: 1 1 auto;
            overflow: auto;
            padding: 10px 0;
            margin-bottom: 10px;
            transition: opacity .3s .3s;

            .-hide & {
                opacity: 0;
                transition: opacity .1s .1s;
            }
        }

        &-talk {
            &.-self {
                display: flex;

                p {
                    margin-left: auto;
                }
            }
        }

        &-input {
            display: flex;
            align-items: center;
            transition: opacity .3s .3s;

            .-hide & {
                opacity: 0;
                transition: opacity .1s;
            }

            input {
                @include typo('list', 1);

                padding: 5px 10px;
                background-color: map-get($colors, grey);
                border-radius: 20px;
                flex: 1 1 auto;
            }

            button {
                @include typo('list', 1);

                margin-left: 5px;
            }
        }
    }

    &__close {
        @include size(40px);

        position: fixed;
        top: 40px;
        right: 40px;
        color: map-get($colors, white);
        cursor: pointer;
    }

    &__loading {
        @include size(100%);

        position: absolute;
        top: 0;
        left: 0;
        display: grid;
        place-content: center;
    }
}
</style>
