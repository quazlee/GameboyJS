export class Gpu {
    constructor(memory) {
        this.memory = memory;
        this.canvas = document.getElementById("gameboyCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.screenWidth = 160;
        this.screenHeight = 144;
        this.colorPalette = ["rgba(255, 255, 255, 1)",
            "rgba(172, 172, 172, 1)",
            "rgba(86, 86, 86 1)",
            "rgba(0, 0, 0, 1)"];

        this.tileMapA = [...Array(32)].map(() => Array(32));
        this.tileMapB = [...Array(32)].map(() => Array(32));
        this.viewport = [...Array(18)].map(() => Array(20));

        this.mode = 2;
        this.scanLine = 0;
        this.scanLineTicks;
    }

    populateViewPort(){
        for (let y = 0; y < 18; y++) {
            for (let x = 0; x < 20; x++) {
                this.viewport[y][x] = this.tileMapA[y][x];
            }
        }
    }

    populateTileMaps(){
        let mapLocation = 0x9800;
        for (let y = 0; y < 32; y++) {
            for (let x = 0; x < 32; x++) {
                this.tileMapA[y][x] = this.memory.readMemory(mapLocation);
                mapLocation++;
            }
        }

        for (let y = 0; y < 32; y++) {
            for (let x = 0; x < 32; x++) {
                this.tileMapB[y][x] = this.memory.readMemory(mapLocation);
                mapLocation++;
            }
        }

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
    
    oamScan(){
        
    }
}


class pixelFetcher{
    constructor(){
        this.data = Array(8);
        this.pushIndex;
        this.popIndex;
        this.nextPixel;
    }

    push(){

    }

    pop(){

    }
}