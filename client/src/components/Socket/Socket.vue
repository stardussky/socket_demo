<template>
    <div class="socket">
        <div
            ref="socket"
            class="socket__canvas"
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
    </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount } from '@vue/composition-api'
import App from './app'

export default {
    name: 'Socket',
    setup (props, { refs, root }) {
        let app
        const ID = ref(null)
        const colors = ref(null)
        const name = ref(null)
        const chats = ref(null)
        const hiddenChats = ref(true)
        const chatInput = ref(null)

        const changeColor = (color) => {
            app.changeColor(color)
        }
        const changeName = () => {
            if (name.value) {
                app.changeName(name.value)
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

        root.sockets.subscribe('client-id', (payload) => {
            ID.value = payload
        })
        root.sockets.subscribe('get-colors', (payload) => {
            colors.value = payload
        })
        root.sockets.subscribe('get-user', (user) => {
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

        onMounted(() => {
            app = new App(
                refs.socket,
                root.$socket,
                root.sockets
            )
        })
        onBeforeUnmount(() => {
            app.destroy()
            root.sockets.unsubscribe('client-id')
            root.sockets.unsubscribe('get-colors')
            root.sockets.unsubscribe('get-user')
            root.sockets.unsubscribe('get-chats')
            root.sockets.unsubscribe('updated-chats')
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
    // cursor: none;

    &__canvas {
        @include size(100%);

        pointer-events: none;
    }

    &__colors {
        position: absolute;
        bottom: 0;
        left: 50%;
        padding: 15px 20px;
        text-align: center;
        background-color: map-get($colors, white);
        border-radius: 100px;
        box-shadow: 5px 5px 10px rgba(map-get($colors, dark), 0.5);
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
        box-shadow: 5px 5px 10px rgba(map-get($colors, dark), 0.5);
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
}
</style>
