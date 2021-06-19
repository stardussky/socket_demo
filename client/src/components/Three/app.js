import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'
import { Geometry } from 'three/examples/jsm/deprecated/Geometry'
import * as CANNON from 'cannon-es'
import { threeToCannon, ShapeType } from 'three-to-cannon'
import Controls from './controls/app'
import Basic from './basic'
import vertexShader from './glsl/vertexShader.glsl'
import fragmentShader from './glsl/fragmentShader.glsl'
import postprocessingVertexShader from './glsl/postprocessing/vertexShader.glsl'
import postprocessingFragmentShader from './glsl/postprocessing/fragmentShader.glsl'

export default class extends Basic {
    constructor (el = document.body) {
        super(el)
    }

    async init () {
        await super.init()

        const envMap = this.getResource('envMap').resource
        this.scene.environment = envMap
        this.scene.background = envMap
        this.scene.fog = new THREE.Fog(0xe1e1e1, 0.1, 200)

        // this.dev(true)
        this.dev(false)

        // this.createPostprocessing()
        this.createControl()
        // this.createRaycaster()
        // this.createLight()
        // this.createPlayer()
        // this.createAudio()
        this.createSceneObject()

        this.reqRenders.push((d, t) => {
            if (this.effectComposer) {
                this.effectComposer.render()
            } else {
                this.renderer.render(this.scene, this.camera)
            }
            this.physicalWorld.step(1 / 60, d)
        })
    }

    createPostprocessing () {
        const { width, height, dpr } = this.viewport

        const renderTargetOptions = {
            encoding: THREE.sRGBEncoding,
        }
        const renderTarget =
        dpr <= 1 && this.renderer.capabilities.isWebGL2
            ? new THREE.WebGLMultisampleRenderTarget(width, height, renderTargetOptions)
            : new THREE.WebGLRenderTarget(width, height, renderTargetOptions)

        this.effectComposer = new EffectComposer(this.renderer, renderTarget)

        const renderPass = new RenderPass(this.scene, this.camera)
        this.effectComposer.addPass(renderPass)

        const uniforms = {
            tDiffuse: new THREE.Uniform(),
            uTime: new THREE.Uniform(0),
        }
        const shader = {
            uniforms,
            vertexShader: postprocessingVertexShader,
            fragmentShader: postprocessingFragmentShader,
        }
        const shaderPass = new ShaderPass(shader)
        this.effectComposer.addPass(shaderPass)

        this.reqRenders.push((d, t) => {
            shaderPass.material.uniforms.uTime.value = t
        })
        this.resizes.push(() => {
            const { width, height } = this.viewport
            renderTarget.setSize(width, height)
        })
    }

    createControl () {
        const playerBody = new CANNON.Body({
            mass: 60,
            position: new CANNON.Vec3(100, -3, 0),
            shape: new CANNON.Sphere(2),
            linearDamping: 0.98,
        })
        this.physicalWorld.addBody(playerBody)

        // const playerCamera = new THREE.Object3D().add(this.camera)
        const playerCamera = this.camera
        this.controls = new Controls('touch', playerCamera, playerBody, this.el, {
            jumpVelocity: 40,
            velocityFactor: 80,
            personHeight: 10,
        })
        this.scene.add(this.controls.getObject())

        this.reqRenders.push((d, t) => {
            this.controls.update(d)
        })
    }

    createRaycaster () {
        this.mouse = new THREE.Vector3()
        this.raycaster = new THREE.Raycaster()
        let target

        this.addEvent(
            ({ clientX, clientY }) => {
                const { width, height } = this.viewport
                this.mouse.set((clientX / width) * 2 - 1, -(clientY / height) * 2 + 1)
            },
            this.el,
            'mousemove'
        )
        this.addEvent(
            () => {
                if (target) {
                    this.onEvents.clickObject?.(target)
                }
            },
            this.el,
            'mousedown'
        )

        this.reqRenders.push(() => {
            this.raycaster.setFromCamera(this.mouse, this.camera)
            const [intersect] = this.raycaster.intersectObjects(this.scene.children, true)

            if (intersect) {
                target = intersect.object
                if (target.name === 'socketButton') {
                    this.el.style.cursor = 'pointer'
                } else {
                    this.el.style.cursor = 'auto'
                }
            }
        })
    }

    createLight () {
        const hemisphereLight = new THREE.HemisphereLight(0xe1e1e1, 0x02040B, 1)
        this.scene.add(hemisphereLight)

        const directionLight = new THREE.DirectionalLight(0xe1e1e1, 4)
        directionLight.castShadow = true
        directionLight.shadow.mapSize.set(512, 512)
        directionLight.shadow.radius = 5
        directionLight.shadow.camera.near = 0.1
        directionLight.shadow.camera.far = 50
        directionLight.shadow.camera.top = 20
        directionLight.shadow.camera.right = 20
        directionLight.shadow.camera.left = -20
        directionLight.shadow.camera.bottom = -20
        directionLight.position.set(0, 5, 20)
        this.scene.add(directionLight)
        this.renderer.shadowMap.needsUpdate = true
        // this.scene.add(new THREE.DirectionalLightHelper(directionLight))
        // this.scene.add(new THREE.CameraHelper(directionLight.shadow.camera))
    }

    createPlayer () {
        const controlsObject = this.controls.getObject()
        const { scene: playerModel, animations } = this.getResource('player').resource
        this.centerObject(playerModel)
        playerModel.position.y += 0.5
        const player = new THREE.Group()
        player.add(playerModel)

        const playerShadow = new THREE.Mesh(
            new THREE.PlaneBufferGeometry(1, 1),
            new THREE.MeshBasicMaterial({
                color: 0x000000,
                opacity: 0.6,
                transparent: true,
                alphaMap: this.getResource('shadow').resource,
            })
        )
        playerShadow.rotation.x = -Math.PI / 2
        playerShadow.scale.set(4, 4, 4)
        playerShadow.position.set(0, -2, 0)
        // player.add(playerShadow)
        this.scene.add(player)

        const mixer = new THREE.AnimationMixer(player)
        this.actions = {}
        this.activeAction = null

        const noLoop = ['jump', 'yes', 'no', 'wave', 'punch', 'thumbsUp']
        const actionsDuration = {
            dance: null,
            death: null,
            idle: null,
            jump: 1,
            no: null,
            punch: null,
            running: null,
            sitting: null,
            standing: null,
            thumbsup: null,
            walking: 0.7,
            walkjump: null,
            wave: null,
            yes: null,
        }
        for (let i = 0; i < animations.length; i++) {
            const clip = animations[i]
            const name = clip.name.toLowerCase()
            const action = mixer.clipAction(clip)

            if (actionsDuration[name]) {
                action.setDuration(actionsDuration[name])
            }

            if (~noLoop.indexOf(name)) {
                action.clampWhenFinished = true
                action.loop = THREE.LoopOnce
            }
            this.actions[name] = action
        }
        this.playAction('idle')

        const walking = (e, { moveForward, moveLeft, moveBackward, moveRight }) => {
            if (moveForward || moveLeft || moveBackward || moveRight) {
                this.fadeToAction('walking')
                return
            }
            this.fadeToAction('idle')
        }
        this.controls.on('moveForward', walking)
        this.controls.on('moveLeft', walking)
        this.controls.on('moveBackward', walking)
        this.controls.on('moveRight', walking)
        this.controls.on('jump', () => {
            this.fadeToAction('jump')
        })
        mixer.addEventListener('finished', () => {
            walking(null, this.controls)
        })

        this.reqRenders.push((d, t) => {
            mixer.update(d)
            player.position.copy(controlsObject.position)
            player.quaternion.setFromEuler(new THREE.Euler(0, this.controls.euler.y + Math.PI, 0), 'YXZ')
        })
    }

    createAudio () {
        const controlsObject = this.controls.getObject()

        const listener = new THREE.AudioListener()
        // this.camera.add(listener)

        const sound = new THREE.Audio(listener)
        sound.setBuffer(this.getResource('bgm').resource)
        sound.setLoop(true)
        sound.setVolume(0.5)
        sound.play()

        const soundPosition = new THREE.Vector3()

        const { clamp, mapLinear } = THREE.MathUtils
        this.reqRenders.push(() => {
            let playerToSoundLength = controlsObject.position.distanceTo(soundPosition)
            playerToSoundLength = clamp(mapLinear(playerToSoundLength, 0, 30, 0.5, 0), 0, 0.5)
            sound.setVolume(playerToSoundLength)
        })
    }

    createSceneObject () {
        const groundBody = new CANNON.Body({
            type: CANNON.Body.STATIC,
            shape: new CANNON.Plane(),
        })
        groundBody.position.set(0, -7.5, 0)
        groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
        this.physicalWorld.addBody(groundBody)

        const { scene: sceneModel } = this.getResource('scene').resource
        const scale = 0.01
        sceneModel.scale.set(scale, scale, scale)
        sceneModel.position.set(0, -7.5, 0)

        sceneModel.traverse((o) => {
            if (o.isMesh) {
                // o.material.envMapIntensity = 2
                // o.castShadow = true
                // o.receiveShadow = true

                // if (~o.name.indexOf('cannon')) {
                //     const object = o.clone()
                //     const geometry = o.geometry.clone()
                //     geometry.rotateX(-Math.PI / 2)
                //     geometry.scale(scale, scale, scale)
                //     geometry.translate(sceneModel.position.x, sceneModel.position.y, sceneModel.position.z)
                //     object.geometry = geometry
                //     const { shape } = threeToCannon(object, { type: ShapeType.HULL })
                //     const body = new CANNON.Body({
                //         type: CANNON.Body.STATIC,
                //         shape,
                //     })
                //     this.physicalWorld.addBody(body)
                // }

                if (~o.name.indexOf('cannon')) {
                    const shape = o.geometry.clone()
                    shape.rotateX(-Math.PI / 2)
                    shape.scale(scale, scale, scale)
                    shape.translate(sceneModel.position.x, sceneModel.position.y, sceneModel.position.z)
                    const { vertices, faces } = new Geometry().fromBufferGeometry(shape)
                    const v = []
                    const f = []
                    for (let i = 0; i < vertices.length; i++) {
                        v.push(new CANNON.Vec3(vertices[i].x, vertices[i].y, vertices[i].z))
                    }
                    for (let i = 0; i < faces.length; i++) {
                        f.push([faces[i].a, faces[i].b, faces[i].c])
                    }
                    // const body = new CANNON.Body({
                    //     type: CANNON.Body.STATIC,
                    //     shape: new CANNON.ConvexPolyhedron({ vertices: v, faces: f }),
                    // })
                    // this.physicalWorld.addBody(body)
                    // console.clear()
                }
            }
        })
        this.scene.add(sceneModel)

        const uniforms = {
            uTime: new THREE.Uniform(0),
        }
        const socketButton = new THREE.Mesh(
            new THREE.SphereBufferGeometry(1),
            new THREE.ShaderMaterial({
                uniforms,
                fragmentShader,
                vertexShader,
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
            })
        )
        socketButton.name = 'socketButton'
        socketButton.position.set(-4, -2, 2)
        // this.scene.add(socketButton)

        this.reqRenders.push((d, t) => {
            uniforms.uTime.value = t
        })
    }

    playAction (name, duration = 0.3) {
        const action = this.actions[name]
        if (action) {
            action.reset().setEffectiveWeight(1).fadeIn(duration).play()
            this.activeAction = name
        }
    }

    fadeToAction (name, duration = 0.3) {
        const previousAction = this.actions[this.activeAction]
        const activeAction = this.actions[name]

        if (previousAction !== activeAction) {
            previousAction?.fadeOut(duration)
            this.playAction(name, duration)
        }
    }
}
