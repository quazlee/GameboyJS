export class Controls {
    constructor() {
        document.addEventListener("keydown", this.keyDownHandler.bind(this), false);
        document.addEventListener("keyup", this.keyUpHandler.bind(this), false);

        //True = not pressed. False = pressed.
        this.up = 1;
        this.down = 1;
        this.left = 1;
        this.right = 1;
        this.a = 1;
        this.b = 1;
        this.start = 1;
        this.select = 1;

        this.memory = null;
    }

    setMemory(memory) {
        this.memory = memory;
    }

    keyDownHandler(event) {
        switch (event.keyCode) {
            case 8:
                this.select = 0;
                break;
            case 13:
                this.start = 0;
                break;
            case 37:
                this.left = 0;
                break;
            case 38:
                this.up = 0;
                break;
            case 39:
                this.right = 0;
                break;
            case 40:
                this.down = 0;
                break;
            case 88:
                this.b = 0;
                break;
            case 90:
                this.a = 0;
                break;
        }
    }

    keyUpHandler(event) {
        switch (event.keyCode) {
            case 8:
                this.select = 1;
                break;
            case 13:
                this.start = 1;
                break;
            case 37:
                this.left = 1;
                break;
            case 38:
                this.up = 1;
                break;
            case 39:
                this.right = 1;
                break;
            case 40:
                this.down = 1;
                break;
            case 88:
                this.b = 1;
                break;
            case 90:
                this.a = 1;
                break;
        }
    }

    updateInputState() {
        let selectAction = (this.memory.readMemory(0xFF00) >> 5) & 1;
        let selectDirection = (this.memory.readMemory(0xFF00) >> 4) & 1;

        if (!selectAction) {
            let low = (this.start << 3) | (this.select << 2) | (this.b << 1) | this.a;
            let high = this.memory.readMemory(0xFF00) >> 4;
            this.memory.writeMemory(0xFF00, (high << 4) | low);
        }
        else if (!selectDirection) {
            let low = (this.down << 3) | (this.up << 2) | (this.left << 1) | this.right;
            let high = this.memory.readMemory(0xFF00) >> 4;
            this.memory.writeMemory(0xFF00, (high << 4) | low);
        }
    }
}