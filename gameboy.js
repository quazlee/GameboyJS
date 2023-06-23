import { Cpu } from "./cpu.js";

export class Gameboy {
    constructor() {
        this.cpu = null;
        this.gpu = null;
        let currentOpcode = null;
        let lastLoopEnd = 0;
    }

    initialize(romArray){
        this.cpu = new Cpu(romArray);
        // this.testTile();
    }

    mainLoop() {
        var start = (performance.now() + performance.timeOrigin);
        let breakpoint = false;
        while(this.cpu.frameReady == false){
            this.currentOpcode = this.cpu.decode();
            this.cpu.execute(this.currentOpcode);
        }
        this.cpu.opcodeTicks -= 70223;
        var duration= (performance.now() + performance.timeOrigin) - start;
        this.cpu.frameReady = false;
        document.getElementById("frames-elapsed").stepUp(1);
        console.log("A".concat(" ", duration));
        console.log((performance.now() + performance.timeOrigin) - this.lastLoopEnd - duration);
        this.lastLoopEnd = (performance.now() + performance.timeOrigin);
    }

    // testTile(){
    //     let tile = [0x3c, 0x7e, 0x42, 0x42, 0x42, 0x42, 0x42, 0x42, 0x7e, 0x5e, 0x7e, 0x0a, 0x7c, 0x56, 0x38, 0x7c]
    //     let decodedTile = this.gpu.decodeTile(tile)
    //     this.gpu.drawTile(decodedTile);
    // }
}