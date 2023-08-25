export class Controls {
    constructor() {
        document.addEventListener("keydown", this.keyDownHandler, false);
        document.addEventListener("keyup", this.keyUpHandler, false);

        this.up = false;
        this.down = false;
        this.left = false;
        this.right = false;
        this.a = false;
        this.b = false;
        this.start = false;
        this.select = false;
    }

    keyDownHandler(event) {
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

    keyUpHandler(event) {
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
}