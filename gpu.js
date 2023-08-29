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
            "rgba(86, 86, 86, 1)",
            "rgba(0, 0, 0, 1)"];

        // this.colorPalette = ["rgba(255, 255, 255, 1)",
        //     "rgba(255, 0, 0, 1)",
        //     "rgba(0, 255, 0 1)",
        //     "rgba(0, 0, 255, 1)"];

        this.mode = 2;
        this.scanLine = 0;
        this.scanLineTicks = 0;

        this.tileMapOne = document.getElementById("tile-map-one");
        this.tileMapOneCtx = this.tileMapOne.getContext("2d");
        this.tileMapTwo = document.getElementById("tile-map-two");
        this.tileMapTwoCtx = this.tileMapTwo.getContext("2d");
        this.tileMapThree = document.getElementById("tile-map-three");
        this.tileMapThreeCtx = this.tileMapThree.getContext("2d");

        this.backgroundOne = document.getElementById("background-one");
        this.backgroundOneCtx = this.backgroundOne.getContext("2d");
        this.backgroundTwo = document.getElementById("background-two");
        this.backgroundTwoCtx = this.backgroundTwo.getContext("2d");

        this.oamLocation = 0xFE00;
        this.oamBuffer = [];
        this.bgPriority = false;
        this.isFetchingSprite = false;
        this.oamTileNumber = null;


        this.fetcherXPos = 0; //0-31 tilewise
        this.fetcherYPos = 0; //0-255 pixelwise

        this.renderX = 0; //current x tile coordinate of the renderer 

        this.windowEnable = 0;
        this.hasWyEqualedLy = false; //if wy == ly, true for the rest of the frame
        this.renderWindow = false;

        this.windowXOffset = 0; //X coordinate of the current window tile
        this.windowYOffset = 0;

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

    /**
     * Generates a 8x1 tile from 2 bytes of data
     * @param {*} tileHigh 
     * @param {*} tileLow 
     * @returns 
     */
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
        try {
            color = tile[0];
            if (color === undefined) {
                throw new Error("WHY?????");
            }
        }
        catch {
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

    /**
     * General cycle that drives the ppu.
     * One pass of each mode lasts 2 ticks.
     */
    cycle() {
        if (this.mode == 2) {
            this.modeTwo();
        }
        else if (this.mode == 3) {
            this.modeThree();
        }
        else if (this.mode == 0) {
            this.modeZero();
        }
        else if (this.mode == 1) {
            this.modeOne();
        }
    }


    modeZero() {
        this.scanLineTicks += 2;
        if (this.scanLineTicks == 456 && this.memory.io.getData(0x44) < 143) {
            this.mode = 2;
            this.scanLineTicks = 0;
            this.memory.io.setData(0x44, this.memory.io.getData(0x44) + 1);
            this.oamLocation = 0xFE00;
            this.oamBuffer = [];
        }
        else if (this.scanLineTicks == 456 && this.memory.io.getData(0x44) == 143) {
            this.mode = 1;
            this.scanLineTicks = 0;
            this.windowYOffset = 0;
            this.memory.io.setData(0x44, this.memory.io.getData(0x44) + 1);
            this.memory.io.setData(0xF, this.memory.io.getData(0xF) | 1);
            this.oamLocation = 0xFE00;
            this.oamBuffer = [];
        }
    }

    /**
     * This mode is the VBlank period.
     * It lasts from scanlines 144-153.
     */
    modeOne() {
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

    /**
     * This mode is the OAM scan.
     * It looks for up to 40 sprites.
     */
    modeTwo() {
        this.oamScan();
        this.scanLineTicks += 2;
        if (this.scanLineTicks == 80) {
            this.fetcherXPos = 0;
            this.mode = 3;
        }
    }

    /**
     * This mode is where pixels are pushed to the screen.
     */
    modeThree() {

        if (!this.isFetchingSprite) {
            this.backgroundFetchCycle();

            if (this.spriteFetchBuffer.length == 0) {
                let i = 0;
                while (i < this.oamBuffer.length && !this.isFetchingSprite) {
                    let spriteX = this.oamBuffer[i].xPos;
                    let pixelX = ((this.renderX * 8) + (8 - this.backgroundFetchBuffer.length));
                    if (spriteX <= pixelX + 8) {
                        this.backgroundFetchStep = 1;
                        if (this.oamBuffer[i].attributes >> 7) {
                            this.bgPriority = true;
                        }
                        else {
                            this.bgPriority = false;
                        }
                        this.oamTileNumber = this.oamBuffer[i].tileIndex;
                        this.isFetchingSprite = true;
                        this.oamBuffer.splice(i, 1);
                    }
                    i++;
                }
            }
        }
        else if (this.isFetchingSprite) {
            this.spriteFetchCycle();
        }

        if (!this.isFetchingSprite && this.backgroundFetchBuffer.length > 0 && this.renderX * 8 < 160) {
            for (let i = 0; i < 2; i++) {
                if (this.spriteFetchBuffer.length != 0 && this.spriteFetchBuffer[0] == 0) {
                    this.backgroundFetchBuffer = this.drawTile2(this.backgroundFetchBuffer, this.renderX * 8, (this.memory.io.getData(0x44)), this.viewportCtx);
                    this.spriteFetchBuffer.shift();
                }
                else if (this.spriteFetchBuffer.length != 0 && 
                    this.backgroundFetchBuffer[0] != 0 && this.spriteFetchBuffer[0] != 0 && this.bgPriority) {
                    this.backgroundFetchBuffer = this.drawTile2(this.backgroundFetchBuffer, this.renderX * 8, (this.memory.io.getData(0x44)), this.viewportCtx);
                    this.spriteFetchBuffer.shift();
                }
                else if (this.spriteFetchBuffer.length != 0) {
                    this.spriteFetchBuffer = this.drawTile2(this.spriteFetchBuffer, this.renderX * 8, (this.memory.io.getData(0x44)), this.viewportCtx);
                    this.backgroundFetchBuffer.shift();
                }
                else if (this.spriteFetchBuffer.length == 0) {
                    this.backgroundFetchBuffer = this.drawTile2(this.backgroundFetchBuffer, this.renderX * 8, (this.memory.io.getData(0x44)), this.viewportCtx);
                }
            }

            this.checkRenderWindow();
            if (this.backgroundFetchBuffer.length == 0) {
                this.renderX += 1;
            }
        }

        this.scanLineTicks += 2;
    }

    backgroundFetchCycle() {
        if (this.backgroundFetchStep == 1) {
            let scy = this.memory.io.getData(0x42);
            let scx = this.memory.io.getData(0x43);

            let lcdc = this.memory.io.getData(0x40);
            this.windowEnable = (lcdc & 0x20) >> 4;

            let ly = this.memory.io.getData(0x44);
            let wy = this.memory.io.getData(0x4A);

            if (wy == ly) {
                this.hasWyEqualedLy = true;
            }

            let tileMapBase = 0x9800;


            //Get the base address for the region of memory to fetch tile data from. Depends on lcdc bit 4.
            let base = 0x9000;
            if (((lcdc & 0x16) >> 4)) {
                base = 0x8000;
            }

            if (!this.renderWindow) {
                if ((lcdc & 0x8) >> 3) {
                    tileMapBase = 0x9C00;
                }
                let tileMapXOffset = ((scx / 8) + this.renderX) & 0x1F;
                let tileMapYOffset = ((scy + ly) & 0xFF);

                this.tileNumber = this.memory.readMemory(tileMapBase + tileMapXOffset + (32 * Math.floor(tileMapYOffset / 8)));

                if (base == 0x8000) {
                    let address = base + (16 * this.tileNumber);
                    this.fetchAddress = address + (2 * (tileMapYOffset % 8));
                }
                else {
                    let address = base + (16 * twosComplement(this.tileNumber));
                    this.fetchAddress = address + (2 * (tileMapYOffset % 8));
                }
            }
            else if (this.renderWindow) {
                if ((lcdc & 0x40) >> 6) {
                    tileMapBase = 0x9C00;
                }
                this.tileNumber = this.memory.readMemory(tileMapBase + this.windowXOffset + (32 * this.windowYOffset));
                this.windowXOffset++;

                this.tileNumber = this.memory.readMemory(tileMapBase + this.windowXOffset + (32 * Math.floor(this.windowYOffset / 8)));

                if (base == 0x8000) {
                    let address = base + (16 * this.tileNumber);
                    this.fetchAddress = address + (2 * (this.windowYOffset % 8));
                }
                else {
                    let address = base + (16 * twosComplement(this.tileNumber));
                    this.fetchAddress = address + (2 * (this.windowYOffset % 8));
                }
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
                this.windowXOffset = 0;
            }
            else if (this.renderX == 20 && this.backgroundFetchBuffer.length == 0) {
                this.renderX = 0;
                this.mode = 0;
                if (this.renderWindow) {
                    this.windowYOffset++;
                }
            }
        }
    }

    spriteFetchCycle() {
        switch (this.spriteFetchStep) {
            case 1: {
                let scy = this.memory.io.getData(0x42);
                let ly = this.memory.io.getData(0x44);
                let tileMapYOffset = ((scy + ly) & 0xFF);
                let address = 0x8000 + (16 * this.oamTileNumber);
                this.fetchAddress = address + (2 * (tileMapYOffset % 8));
                this.spriteFetchStep = 2;
                break;
            }
            case 2:
                this.fetchLow = this.memory.readMemory(this.fetchAddress);
                this.spriteFetchStep = 3;
                break;
            case 3:
                this.fetchHigh = this.memory.readMemory(this.fetchAddress + 1);
                this.spriteFetchStep = 4;
                break;
            case 4:
                if (this.renderX < 20 && this.spriteFetchBuffer.length == 0) {
                    this.spriteFetchBuffer = this.decodeTile2(this.fetchHigh, this.fetchLow);
                }
                this.isFetchingSprite = false;
                this.spriteFetchStep = 1;
                break;
        }
    }
    /**
     * Checks if the window should be rendered for the rest of the current scanline
     */
    checkRenderWindow() {
        let wx = this.memory.io.getData(0x4B);
        if (!this.renderWindow && this.windowEnable && this.hasWyEqualedLy && (this.renderX - (8 - this.backgroundFetchBuffer)) >= (wx - 7)) {
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
        if ((spriteX > 0) && (ly + 16 >= spriteY) && (ly + 16 < spriteY + this.getSpriteHeight()) && (this.oamBuffer.length < 10)) {
            this.oamBuffer.push(new Sprite(spriteY,
                spriteX,
                this.memory.readMemory(this.oamLocation + 2),
                this.memory.readMemory(this.oamLocation + 3)));
        }
        this.oamLocation += 4;
    }
}

class Sprite {
    constructor(yPos, xPos, tileIndex, attributes) {
        this.yPos = yPos;
        this.xPos = xPos;
        this.tileIndex = tileIndex;
        this.attributes = attributes;
    }
}