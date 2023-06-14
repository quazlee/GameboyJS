export class Gpu {
    constructor() {
        this.canvas = document.getElementById("gameboyCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.screenWidth = 160;
        this.screenHeight = 144;
        this.colorPalette = ["rgba(255, 255, 255, 1)",
            "rgba(172, 172, 172, 1)",
            "rgba(86, 86, 86 1)",
            "rgba(0, 0, 0, 1)"];
    }
    drawTile(){

    }
}