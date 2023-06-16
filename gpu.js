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

        // this.colorPalette = ["red",
        //     "green",
        //     "blue",
        //     "yellow"];
    }

    decodeTile(tile) {
        let tileA = [];
        let tileB = [];
        for (let i = 0; i < tile.length; i++) {
            if (i % 2 == 0) {
                tileA.push(tile[i]);
            }
            else {
                tileB.push(tile[i]);
            }
        }
        let generatedTile = [...Array(8)].map(() => Array(8));

        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                let low = (tileA[y] & (1 << 7 - x)) >> (7 - x);
                let high = (tileB[y] & (1 << 7 - x)) >> (7 - x);
                generatedTile[y][x] = (high << 1) | low;
            }
        }
        return generatedTile;
    }

    drawTile(tile) {
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                let color = tile[y][x];
                this.drawToCanvas(10 + x, 10 + y, this.colorPalette[color]);
            }
        }
    }

    drawToCanvas(x, y, color) {
        this.ctx.strokeStyle = color;
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, 1, 1);
    }
}