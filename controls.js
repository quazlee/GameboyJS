export class Controls {
    constructor() {
        document.addEventListener("keydown", this.keyDownHandler, false);
        document.addEventListener("keyup", this.keyUpHandler, false);

        //True = not pressed. False = pressed.
        this.up = true;
        this.down = true;
        this.left = true;
        this.right = true;
        this.a = true;
        this.b = true;
        this.start = true;
        this.select = true;

        this.memory = null;
    }

    setMemory(memory) {
        this.memory = memory;
    }

    keyDownHandler(event) {
        switch (event.keyCode) {
            case 37:
                this.left = false;
                break;
            case 38:
                this.up = false;
                break;
            case 39:
                this.right = false;
                break;
            case 40:
                this.down = false;
                break;
            case 88:
                this.b = false;
                break;
            case 90:
                this.a = false;
                break;
        }
    }

    keyUpHandler(event) {
        switch (event.keyCode) {
            case 37:
                this.left = true;
                break;
            case 38:
                this.up = true;
                break;
            case 39:
                this.right = true;
                break;
            case 40:
                this.down = true;
                break;
            case 88:
                this.b = true;
                break;
            case 90:
                this.a = true;
                break;
        }
    }

    updateInputState() {
        let selectAction = (this.memory.readMemory(0xFF00) >> 5) & 1;
        let selectDirection = (this.memory.readMemory(0xFF00) >> 4) & 1;

        if (selectAction) {
            let low = (this.start << 3) | (this.select << 2) | (this.b << 1) | this.a;
            let high = this.memory.readMemory(0xFF00) >> 4;
            this.memory.writeMemory(0xFF00, (high << 4) | low);
        }
        else if (selectDirection) {
            let low = (this.down << 3) | (this.up << 2) | (this.left << 1) | this.right;
            let high = this.memory.readMemory(0xFF00) >> 4;
            this.memory.writeMemory(0xFF00, (high << 4) | low);
        }
    }
}