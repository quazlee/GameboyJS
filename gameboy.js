import { Cpu } from "./cpu.js";
import { Debug } from "./debug.js";
import { Gpu } from "./gpu.js";
import { Memory } from "./memory.js";

export class Gameboy {
    constructor() {
        this.memory = new Memory();
        this.cpu = new Cpu();
        this.gpu = null;
        this.debug = new Debug(this.cpu, this.memory);
        let currentOpcode = null;
        let lastLoopEnd = 0;
    }

    initialize(romInput){
        this.memory.initialize(romInput)
        this.cpu.setMemory(this.memory);
        this.cpu.setDebug(this.debug);

        this.gpu = new Gpu(this.memory)
        this.testTile();
    }

    mainLoop() {
        while(this.cpu.frameReady == false){
            this.currentOpcode = this.cpu.decode();
            this.cpu.execute(this.currentOpcode);
        }
        this.cpu.frameReady = false;

        document.getElementById("frames-elapsed").stepUp(1);

        // this.debug.debugRomOutput(this.cpu);
        this.debug.debugClock(this.cpu);
        // this.debug.debugMemoryWatch(this.cpu);
        this.debug.registerViewer(this.cpu.registers);
    }

    testTile(){
        let tile = [0x3c, 0x7e, 0x42, 0x42, 0x42, 0x42, 0x42, 0x42, 0x7e, 0x5e, 0x7e, 0x0a, 0x7c, 0x56, 0x38, 0x7c]
        let decodedTile = this.gpu.decodeTile(tile)
        this.gpu.drawTile(decodedTile);
    }
}