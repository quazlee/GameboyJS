import { twosComplement } from "./utility.js";
import { Memory } from "./memory.js";

export class Gpu {
    constructor() {
        this.memory = null;
        this.canvas = document.getElementById("gameboyCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.screenWidth = 160;
        this.screenHeight = 144;
        this.colorPalette = ["rgba(255, 255, 255, 1)",
            "rgba(172, 172, 172, 1)",
            "rgba(86, 86, 86 1)",
            "rgba(0, 0, 0, 1)"];

        this.mode = 2;
        this.scanLine = 0;
        this.scanLineTicks = 0;

        this.tileMapOne = document.getElementById("tile-map-one");
        this.tileMapOneCtx = this.tileMapOne.getContext("2d");
        this.tileMapTwo = document.getElementById("tile-map-two");
        this.tileMapTwoCtx = this.tileMapTwo.getContext("2d");

        this.backgroundOne = document.getElementById("background-one");
        this.backgroundOneCtx = this.backgroundOne.getContext("2d");
        this.backgroundTwo = document.getElementById("background-two");
        this.backgroundTwoCtx = this.backgroundTwo.getContext("2d");

        this.oamLocation = 0xFE00;
        this.oamBuffer = [];

        this.xPos = 0;

        this.backgroundFetchStep = 1;
        this.backgroundFetchBuffer = [];

        this.spriteFetchStep = 1;
        this.spriteFetchBuffer = [];

        this.backgroundOneBase = 0x9800;
        this.backgroundTwoBase = 0x9C00;
    }

    /**
     * Sets memory reference.
     * @param {*} memory 
     */
    setMemory(memory) {
        this.memory = memory;
    }

    /**
     * Generates an 8x8 tile from 16 bytes of sequential data.
     * @param {*} tile - array of 16 bytes of data.
     * @returns 
     */
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

    /**
     * Draws a pixel to a given canvas at an (x,y) location in a given color
     * @param {*} x 
     * @param {*} y 
     * @param {*} color 
     * @param {*} ctx 
     */
    drawToCanvas(x, y, color, ctx) {
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
    }

    /**
     * Checks what sprite height should be used.
     * @returns sprite height
     */
    getSpriteHeight() {
        let spriteSize = ((this.memory.io.getData(0x44) & 0x4) >> 2);
        if (spriteSize) {
            return 16;
        }
        else {
            return 8;
        }
    }

    cycle() {
        if (this.mode == 2) {
            this.oamScan();
            this.scanLineTicks += 2;
            if (this.scanLineTicks == 80) {
                this.mode = 3;
            }
        }
        else if (this.mode == 3) {
            if (this.backgroundFetchStep == 1) {
                let scy = this.memory.io.getData(0x42);
                let scx = this.memory.io.getData(0x43);
                let wy = this.memory.io.getData(0x4A);
                let wx = this.memory.io.getData(0x4B);
                let lcdc = this.memory.io.getData(0x40);
                let windowEnable = (lcdc & 0x20) >> 4;

                let backgroundMapBase = 0;
                if ((lcdc & 0x8) >> 3) {
                    backgroundMapBase = 0x9C00;
                }
                else {
                    backgroundMapBase = 0x9800;
                }
                let windowMapBase = 0;
                if ((lcdc & 0x40) >> 6) {
                    windowMapBase = 0x9C00;
                }
                else {
                    windowMapBase = 0x9800;
                }


                if (windowEnable && (scx + this.xPos) > wx && (scy + this.yPos) > wy) {

                }
                else {

                }
                // let currentMap = ;
                // let tileNumber = a;
            }
            else if (this.backgroundFetchStep == 2) {

            }
            else if (this.backgroundFetchStep == 3) {

            }
            else if (this.backgroundFetchStep == 4) {

            }
            this.scanLineTicks += 2;
        }
        else if (this.mode == 0) {
            this.scanLineTicks += 2;
            if (this.scanLineTicks == 456 && this.memory.io.getData(0x44) < 143) {
                this.mode = 2;
                this.scanLineTicks = 0;
                this.memory.io.setData(0x44, this.memory.io.getData(0x44) + 1);
            }
            else if (this.scanLineTicks == 456 && this.memory.io.getData(0x44) == 143) {
                this.mode = 1;
                this.scanLineTicks = 0;
                this.memory.io.setData(0x44, this.memory.io.getData(0x44) + 1);
            }
        }
        else if (this.mode == 1) {
            this.scanLineTicks += 2;
            if (this.scanLineTicks == 456 && this.memory.io.getData(0x44) < 153) {
                this.scanLineTicks = 0;
                this.memory.io.setData(0x44, this.memory.io.getData(0x44) + 1);
            }
            else if (this.scanLineTicks == 456 && this.memory.io.getData(0x44) == 153) {
                this.scanLineTicks = 0;
                this.mode = 2;
                this.memory.io.setData(0x44, this.memory.io.getData(0x44) + 1);
            }
        }
    }

    /**
     * Checks if the next OAM sprite should be pushed to the buffer.
     */
    oamScan() {
        let ly = this.memory.readMemory(0xFF44);
        let spriteX = this.memory.readMemory(this.oamLocation + 1);
        let spriteY = this.memory.readMemory(this.oamLocation);
        if (spriteX > 0 && ly + 16 >= spriteY && ly + 16 < spriteY + this.getSpriteHeight() && this.oamBuffer.length < 10) {
            this.oamBuffer.push(this.oamLocation);
        }
        this.oamLocation += 4;
    }

    /**
     * Used to draw tile maps for the debug tools.
     */
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

    /**
     * Used to draw background and window maps for the debug tools.
     */
    drawBackgroundMaps() {
        this.backgroundOneCtx.clearRect(0, 0, this.backgroundOne.width, this.backgroundOne.height);
        for (let y = 0; y < 32; y++) {
            for (let x = 0; x < 32; x++) {
                let tileNumber = this.memory.readMemory(this.backgroundOneBase + (x) + (y * 32));
                let tileSet = [];
                for (let i = 0; i < 16; i++) {
                    tileSet.push(this.memory.readMemory(0x8000 + (tileNumber * 16) + i));
                }
                let decodedTile = this.decodeTile(tileSet);
                this.drawTile(decodedTile, x * 8, y * 8, this.backgroundOneCtx);
            }
        }

        this.backgroundTwoCtx.clearRect(0, 0, this.backgroundTwo.width, this.backgroundTwo.height);
        for (let y = 0; y < 32; y++) {
            for (let x = 0; x < 32; x++) {
                let tileNumber = this.memory.readMemory(this.backgroundTwoBase + (x) + (y * 32));
                let tileSet = [];
                for (let i = 0; i < 16; i++) {
                    tileSet.push(this.memory.readMemory(0x8000 + (twosComplement(tileNumber) * 16) + i));
                }
                let decodedTile = this.decodeTile(tileSet);
                this.drawTile(decodedTile, x * 8, y * 8, this.backgroundTwoCtx);
            }
        }
    }
}