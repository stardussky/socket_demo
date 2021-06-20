import * as dat from 'dat.gui'
import * as THREE from 'three'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import * as CANNON from 'cannon-es'
import cannonDebugger from 'cannon-es-debugger'

const defaultResources = [
    {
        type: 'model',
        name: 'scene',
        src: 'scene.glb',
    },
    {
        type: 'model',
        name: 'player',
        src: 'player.glb',
    },
    {
        type: 'cubeTexture',
        name: 'envMap',
        src: 'env/px.png',
        options: {
            encoding: THREE.sRGBEncoding,
        },
    },
    {
        type: 'cubeTexture',
        name: 'envMap',
        src: 'env/nx.png',
        options: {
            encoding: THREE.sRGBEncoding,
        },
    },
    {
        type: 'cubeTexture',
        name: 'envMap',
        src: 'env/py.png',
        options: {
            encoding: THREE.sRGBEncoding,
        },
    },
    {
        type: 'cubeTexture',
        name: 'envMap',
        src: 'env/ny.png',
        options: {
            encoding: THREE.sRGBEncoding,
        },
    },
    {
        type: 'cubeTexture',
        name: 'envMap',
        src: 'env/pz.png',
        options: {
            encoding: THREE.sRGBEncoding,
        },
    },
    {
        type: 'cubeTexture',
        name: 'envMap',
        src: 'env/nz.png',
        options: {
            encoding: THREE.sRGBEncoding,
        },
    },
    { type: 'texture', name: 'shadow', src: 'shadow.jpg' },
    { type: 'audio', name: 'bgm', src: 'bgm.mp3' },
]

export default class Basic {
    constructor (el) {
        if (el instanceof Element) {
            this.el = el
            this.reqRenders = []
            this.resizes = []
            this.resources = []
            this.events = []
            this.onEvents = {}
            this.clock = new THREE.Clock()
            this.render = this.render.bind(this)

            this.loadStatus = {
                total: 0,
                progress: 0,
                isDone: false,
            }
            this.loaderManager = new THREE.LoadingManager()
            this.loaderManager.onProgress = (url, itemsLoaded, itemsTotal) => {
                this.loadStatus.total = itemsTotal
                this.loadStatus.progress = itemsLoaded / this.loadStatus.total
                this.onEvents.loadProgress?.(this.loadStatus.progress, this.loadStatus.total)
            }
            this.loaderManager.onLoad = () => {
                this.loadStatus.isDone = true
                this.onEvents.loaded?.()
            }
            this.textureLoader = new THREE.TextureLoader(this.loaderManager)
            this.cubeTextureLoader = new THREE.CubeTextureLoader(this.loaderManager)
            this.gltfLoader = new GLTFLoader(this.loaderManager).setDRACOLoader(
                new DRACOLoader(this.loaderManager).setDecoderPath('/draco/')
            )
            this.audioLoader = new THREE.AudioLoader(this.loaderManager)
        }
    }

    dev (control) {
        if (control) {
            new OrbitControls(this.camera, this.el)
        }
        this.gui = new dat.GUI()
        this.scene.add(new THREE.AxesHelper(1, 1))

        cannonDebugger(this.scene, this.physicalWorld.bodies, {})
    }

    async init () {
        await Promise.all([this.loadDefaultResources()])
        const { width, height, aspect, dpr } = this.viewport
        this.scene = new THREE.Scene()

        this.renderer = new THREE.WebGLRenderer({
            powerPreference: 'high-performance',
            antialias: dpr <= 1,
            // alpha: true,
        })
        this.renderer.setSize(width, height)
        this.renderer.setPixelRatio(dpr)
        this.renderer.physicallyCorrectLights = true
        this.renderer.outputEncoding = THREE.sRGBEncoding
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping
        this.renderer.toneMappingExposure = 1
        // this.renderer.shadowMap.enabled = true
        this.renderer.shadowMap.type = THREE.VSMShadowMap
        this.renderer.shadowMap.autoUpdate = false
        this.el.appendChild(this.renderer.domElement)

        this.camera = new THREE.PerspectiveCamera(45, aspect, 0.01, 1000)
        this.camera.position.set(0, 5, 20)

        this.physicalWorld = new CANNON.World({
            gravity: new CANNON.Vec3(0, -25, 0),
        })
        const physicalDefaultMaterial = new CANNON.Material('default')
        const physicalDefaultContactMaterial = new CANNON.ContactMaterial(
            physicalDefaultMaterial,
            physicalDefaultMaterial,
            {
                friction: 1,
                restitution: 0,
            }
        )
        this.physicalWorld.addContactMaterial(physicalDefaultContactMaterial)
        this.physicalWorld.defaultContactMaterial = physicalDefaultContactMaterial

        this.addEvent(this.resize.bind(this), window, 'resize')
        this.render()

        this.resizes.push(() => {
            const { width, height, aspect } = this.viewport
            this.renderer.setSize(width, height)

            this.camera.aspect = aspect
            this.camera.updateProjectionMatrix()
        })
    }

    resize () {
        for (let i = 0, len = this.resizes.length; i < len; i++) {
            this.resizes[i]()
        }
        this.onEvents.resize?.()
    }

    render () {
        this.reqID = requestAnimationFrame(this.render)

        const d = this.clock.getDelta()
        for (let i = 0, len = this.reqRenders.length; i < len; i++) {
            this.reqRenders[i](d, this.clock.elapsedTime)
        }
    }

    start () {
        this.render()
        this.clock.start()
    }

    stop () {
        window.cancelAnimationFrame(this.reqID)
        this.clock.stop()
    }

    destroy () {
        this.stop()
        this.renderer.domElement.addEventListener('dblclick', null, false)

        this.gui?.destroy()
        this.removeEvents()
        this.disposeObject(this.scene)
        this.renderer.forceContextLoss()
        this.scene = null
        this.camera = null
        this.renderer = null
        while (this.el.lastChild) {
            this.el.removeChild(this.el.lastChild)
        }
    }

    async loadDefaultResources () {
        return await this.addResources(defaultResources)
    }

    async addResource (payload) {
        let { type, src, name, options } = payload

        if (!src.match(/^(http|https):\/\//)) {
            src = require(`@/assets/${src}`)
        }

        let resource
        if (type === 'texture') {
            resource = await this.loadTexture(src, options)
        }
        if (type === 'cubeTexture') {
            resource = await this.loadCubeTexture(name, src, options)
        }
        if (type === 'model') {
            resource = await this.loadGltf(src, options)
        }
        if (type === 'audio') {
            resource = await this.loadAudio(src, options)
        }
        if (resource) {
            this.resources.push({
                type,
                name: name || src,
                resource,
            })
        }
        return resource
    }

    async addResources (payload) {
        const promises = payload.map((resource) => this.addResource(resource))

        return await Promise.all(promises).then((result) => result)
    }

    getResource = (() => {
        const memo = {}
        return (string, type = 'name') => {
            if (memo[string]) return memo[string]
            const target = this.resources.find((resource) => resource[type] === string)
            memo[string] = target
            return target
        }
    })()

    getResources (payload, type = 'name') {
        if (typeof payload === 'function') {
            return this.resources.filter(payload)
        }
        return this.resources.filter((resource) => resource[type] === payload)
    }

    loadTexture (url, options) {
        return new Promise((resolve) => {
            this.textureLoader.load(url, (texture) => {
                for (const key in options) {
                    texture[key] = options[key]
                }
                resolve(texture)
            })
        })
    }

    loadCubeTexture = (() => {
        const memo = {}
        return function (name, url, options) {
            const mats = memo[name]
            mats ? mats.push(url) : (memo[name] = [url])

            if (mats && mats.length === 6) {
                return new Promise((resolve) => {
                    this.cubeTextureLoader.load(mats, (texture) => {
                        delete memo[name]
                        for (const key in options) {
                            texture[key] = options[key]
                        }
                        resolve(texture)
                    })
                })
            }
        }
    })()

    loadGltf (url, options) {
        return new Promise((resolve) => {
            this.gltfLoader.load(url, (gltf) => {
                for (const key in options) {
                    gltf[key] = options[key]
                }

                resolve(gltf)
            })
        })
    }

    loadAudio (url, options) {
        return new Promise((resolve) => {
            this.audioLoader.load(url, (audio) => {
                for (const key in options) {
                    audio[key] = options[key]
                }

                resolve(audio)
            })
        })
    }

    disposeObject (obj) {
        while (obj.children.length > 0) {
            this.disposeObject.bind(this)(obj.children[0])
            obj.remove(obj.children[0])
        }
        if (obj.geometry) {
            obj.geometry.dispose()
        }

        if (obj.material) {
            Object.keys(obj.material).forEach((prop) => {
                if (!obj.material[prop]) {
                    return
                }
                if (typeof obj.material[prop].dispose === 'function') {
                    obj.material[prop].dispose()
                }
            })
            obj.material.dispose()
        }
    }

    addEvent (event, object, type) {
        const instance = {
            event,
            object,
            type,
        }
        this.events.push(instance)
        object.addEventListener(type, event)
        return instance
    }

    removeEvent (instance) {
        const { event, object, type } = instance
        const index = this.events.findIndex((item) => item === instance)
        if (~index) {
            object.removeEventListener(type, event)
            this.events.splice(index, 1)
        }
    }

    removeEvents () {
        while (this.events.length) {
            const { event, object, type } = this.events.pop()
            object.removeEventListener(type, event)
        }
    }

    on (name, callback) {
        if (typeof name === 'string' && typeof callback === 'function') {
            this.onEvents[name] = callback
        }
    }

    centerObject (object) {
        if (object instanceof THREE.Object3D) {
            const box = new THREE.Box3().setFromObject(object)
            const center = box.getCenter(new THREE.Vector3())
            object.position.sub(center)
        }
    }

    get viewport () {
        return {
            width: window.innerWidth,
            height: window.innerHeight,
            aspect: window.innerWidth / window.innerHeight,
            dpr: Math.min(window.devicePixelRatio, 1),
        }
    }

    get viewSize () {
        const distance = this.camera.position.z
        const vFov = THREE.Math.degToRad(this.camera.fov)
        const height = 2 * Math.tan(vFov / 2) * distance
        const width = height * this.viewport.aspect
        return { width, height, vFov }
    }
}
