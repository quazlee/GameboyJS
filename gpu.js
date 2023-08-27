import { twosComplement } from "./utility.js";
import { errorHandler } from "./errorhandler.js";
import { Memory } from "./memory.js";

export class Gpu {
    constructor() {
        this.memory = null;

        this.frameReady = false;

        this.viewport = document.getElementById("gameboyCanvas");
        this.viewportCtx = this.viewport.getContext("2d");
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

        this.fetcherXPos = 0; //0-31 tilewise
        this.fetcherYPos = 0; //0-255 pixelwise

        this.renderX = 0;

        this.hasWyEqualedLy = false;
        this.renderWindow = false;

        this.tileNumber = 0;
        this.fetchAddress = 0;
        this.fetchLow = 0;
        this.fetchHigh = 0;

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

    decodeTile2(tileHigh, tileLow) {
        let generatedTile = Array(8);

        for (let i = 0; i < 8; i++) {
            let low = (tileHigh & (1 << 7 - i)) >> (7 - i);
            let high = (tileLow & (1 << 7 - i)) >> (7 - i);
            generatedTile[i] = (high << 1) | low;
        }
        return generatedTile;
    }

    /**
     * Draws an 8*8 tile to the canvas
     * @param {*} tile 
     * @param {*} xOffset 
     * @param {*} yOffset 
     * @param {*} ctx 
     */
    drawTile(tile, xOffset, yOffset, ctx) {
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                let color = tile[y][x];
                this.drawToCanvas(x + xOffset, y + yOffset, this.colorPalette[color], ctx);
            }
        }
    }

    /**
     * Draws an 8*1 tile to the canvas
     * @param {*} tile 
     * @param {*} xOffset 
     * @param {*} yOffset 
     * @param {*} ctx 
     */
    drawTile2(tile, xOffset, yOffset, ctx) {
        let color = 0;
        try{
            color = tile[0];
            if(color === undefined){
                throw new Error("WHY?????");
            } 
        }
        catch{
            errorHandler(e);
        }
        
        this.drawToCanvas(((8 - tile.length) + xOffset), yOffset, this.colorPalette[color], ctx);
        tile.shift();
        return tile;
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
        let spriteSize = ((this.memory.io.getData(0x40) & 0x4) >> 2);
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
                this.fetcherXPos = 0;
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

                let ly = this.memory.io.getData(0x44);

                if(wy == ly){
                    this.hasWyEqualedLy = true;
                }

                //Determine if the current tile is a background tile or a window tile
                      

                let tileMapBase = 0x9800;
                if ((((lcdc & 0x8) >> 3) && (scx + this.fetcherXPos) < wx) ||
                    (((lcdc & 0x40) >> 6) && (scx + this.fetcherXPos) > wx)) {
                    tileMapBase = 0x9C00;
                }

                let tileMapXOffset = ((scx / 8) + this.renderX) & 0x1F;
                let tileMapYOffset = ((scy + ly) & 0xFF);                

                this.tileNumber = this.memory.readMemory(tileMapBase + tileMapXOffset + (32 * Math.floor(tileMapYOffset / 8)));

                let base = 0x8800;
                if (((lcdc & 0x16) >> 4)) {
                    base = 0x8000;
                }
                let address = base + (16 * this.tileNumber);;
                if (base == 0x8000) {
                    this.fetchAddress = address + (2 * (tileMapYOffset % 8));
                }
                else {
                    this.fetchAddress = address + twosComplement((2 * ((scy + (this.memory.io.getData(0x44))) & 0xFF) % 8));
                }
                this.backgroundFetchStep = 2;

            }
            else if (this.backgroundFetchStep == 2) {
                this.fetchLow = this.memory.readMemory(this.fetchAddress);
                this.backgroundFetchStep = 3;
            }
            else if (this.backgroundFetchStep == 3) {
                this.fetchHigh = this.memory.readMemory(this.fetchAddress + 1);
                this.backgroundFetchStep = 4;
            }
            else if (this.backgroundFetchStep == 4) {
                if (this.renderX < 20 && this.backgroundFetchBuffer.length == 0) {
                    this.backgroundFetchBuffer = this.decodeTile2(this.fetchHigh, this.fetchLow);
                    this.backgroundFetchStep = 1;
                }
                else if (this.renderX == 20 && this.backgroundFetchBuffer.length == 0) {
                    this.renderX = 0;
                    this.mode = 0;
                }
            }
            if (this.backgroundFetchBuffer.length > 0 && this.renderX * 8 < 160) {
                this.backgroundFetchBuffer = this.drawTile2(this.backgroundFetchBuffer, this.renderX * 8, (this.memory.io.getData(0x44)), this.viewportCtx);
                this.backgroundFetchBuffer = this.drawTile2(this.backgroundFetchBuffer, this.renderX * 8, (this.memory.io.getData(0x44)), this.viewportCtx);
                this.checkRenderWindow(windowEnable);
                if (this.backgroundFetchBuffer.length == 0) {
                    this.renderX += 1;
                }
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
                this.memory.io.setData(0xF, this.memory.io.getData(0xF) | 1); 
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
                this.memory.io.setData(0x44, 0);
                this.frameReady = true;
                this.hasWyEqualedLy = false;
                this.renderWindow = false;
            }
        }
    }

    /**
     * Checks if the window should be rendered for the rest of the current scanline
     * @param {*} windowEnable 
     */
    checkRenderWindow(windowEnable){
        if(!this.renderWindow && windowEnable && this.hasWyEqualedLy && (this.renderX - (8 - this.backgroundFetchBuffer)) >= (wx - 7)){
            this.renderWindow = true;
            this.backgroundFetchStep = 1;
            this.backgroundFetchBuffer = [];
            this.renderX -= 1;
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


}