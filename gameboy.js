import { Cpu } from "./cpu.js";
import { Gpu } from "./gpu.js"

export class Gameboy {
    constructor() {
        this.cpu = null;
        this.gpu = null;
    }

    initialize(romArray){
        this.cpu = new Cpu(romArray);
        this.gpu = new Gpu();

        this.testTile();
    }

    mainLoop() {
        while(this.cpu.opcodeTicks < 17556){
            this.cpu.execute();
        }
        document.getElementById("frames-elapsed").stepUp(1);

        this.cpu.opcodeTicks = 0;
    }

    testTile(){
        let tile = [0x3c, 0x7e, 0x42, 0x42, 0x42, 0x42, 0x42, 0x42, 0x7e, 0x5e, 0x7e, 0x0a, 0x7c, 0x56, 0x38, 0x7c]
        let decodedTile = this.gpu.decodeTile(tile)
        this.gpu.drawTile(decodedTile);
    }
}