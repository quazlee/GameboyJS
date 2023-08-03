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
        this.scanLineTicks = 0;

        this.tileMapOne = document.getElementById("tile-map-one");
        this.tileMapOneCtx = this.tileMapOne.getContext("2d");
        this.tileMapTwo = document.getElementById("tile-map-two");
        this.tileMapTwoCtx = this.tileMapTwo.getContext("2d");
    }


    // populateViewPort(){
    //     for (let y = 0; y < 18; y++) {
    //         for (let x = 0; x < 20; x++) {
    //             this.viewport[y][x] = this.tileMapA[y][x];
    //         }
    //     }
    // }

    // populateTileMaps(){
    //     let mapLocation = 0x9800;
    //     for (let y = 0; y < 32; y++) {
    //         for (let x = 0; x < 32; x++) {
    //             this.tileMapA[y][x] = this.memory.readMemory(mapLocation);
    //             mapLocation++;
    //         }
    //     }

    //     for (let y = 0; y < 32; y++) {
    //         for (let x = 0; x < 32; x++) {
    //             this.tileMapB[y][x] = this.memory.readMemory(mapLocation);
    //             mapLocation++;
    //         }
    //     }
    // }

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

    drawTile(tile, xOffset, yOffset, ctx) {
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                let color = tile[y][x];
                this.drawToCanvas(x + xOffset, y + yOffset, this.colorPalette[color], ctx);
            }
        }
    }

    drawToCanvas(x, y, color, ctx) {
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
    }

    oamScan() {

    }

    drawTileMaps() {
        this.tileMapOneCtx.clearRect(0, 0, this.tileMapOne.width, this.tileMapOne.height);
        for (let y = 0; y < 11; y++) {
            for (let x = 0; x < 12; x++) {
                let base = 0x8000 + (x * 16) + (y * 192);
                let tileSet = [];
                for (let i = 0; i < 16; i++) {
                    tileSet.push(this.memory.readMemory(base + i));
                }
                let decodedTile = this.decodeTile(tileSet);
                this.drawTile(decodedTile, x * 8, y * 8, this.tileMapOneCtx);
            }
        }
        this.tileMapTwoCtx.clearRect(0, 0, this.tileMapTwo.width, this.tileMapTwo.height);
        for (let y = 0; y < 11; y++) {
            for (let x = 0; x < 12; x++) {
                let base = 0x8800 + (x * 16) + (y * 192);
                let tileSet = [];
                for (let i = 0; i < 16; i++) {
                    tileSet.push(this.memory.readMemory(base + i));
                }
                let decodedTile = this.decodeTile(tileSet);
                this.drawTile(decodedTile, x * 8, y * 8, this.tileMapTwoCtx);
            }
        }
    }
}


class pixelFetcher {
    constructor() {
        this.data = Array(8);
        this.pushIndex;
        this.popIndex;
        this.nextPixel;
    }

    push() {

    }

    pop() {

    }
}