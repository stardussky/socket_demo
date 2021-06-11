class Letter {
    constructor (ctx, letter, options) {
        this.ctx = ctx
        this.letter = letter
        this.options = {
            ...options,
        }
    }

    update (position, letterSpacing) {
        const { font, fontSize, position: lerpPosition } = this.options
        lerpPosition.lerp(position, 0.2)

        this.ctx.font = `${fontSize}px ${font}`
        this.ctx.fillText(this.letter, lerpPosition.x + letterSpacing, lerpPosition.y + 25)

        return lerpPosition
    }
}

export default class {
    constructor (ctx, text, options) {
        this.ctx = ctx
        this.text = text
        this.letters = []
        this.options = {
            font: 'Arial',
            fontSize: 12,
            letterSpacing: 10,
            ...options,
        }

        const { font, fontSize, letterSpacing, position } = this.options

        for (let i = 0; i < text.length; i++) {
            const letter = text[i]
            this.letters.push(new Letter(this.ctx, letter, {
                font,
                fontSize,
                letterSpacing,
                position: position.clone(),
            }))
        }
    }

    update () {
        const { position, letterSpacing } = this.options

        let letterPosition = position
        for (let i = 0; i < this.letters.length; i++) {
            const letter = this.letters[i]
            letterPosition = letter.update(letterPosition, (i + 1) * letterSpacing)
        }
    }
}
