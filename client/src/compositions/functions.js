import { } from '@vue/composition-api'
import ImagesLoaded from 'imagesloaded'

export default () => {
    const loadImage = () => {
        return new Promise(resolve => {
            new ImagesLoaded('#app', { background: '[data-background]' }, (instance) => {
                resolve()
            })
        })
    }
    return {
        loadImage,
    }
}
