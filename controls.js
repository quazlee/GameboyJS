export class Controls{
    constructor(){
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

    keyDownHandler(event){
        switch(event.keycode){
            // case 
        }
    }

    keyUpHandler(){

    }
}