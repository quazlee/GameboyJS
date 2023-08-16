import { Cpu } from "./cpu.js";
import { Debug } from "./debug.js";
import { Gpu } from "./gpu.js";
import { Memory } from "./memory.js";

export class Gameboy {
    constructor() {
        this.memory = new Memory();
        this.cpu = new Cpu();
        this.gpu = new Gpu();
        this.debug = new Debug(this.cpu, this.memory);
        this.currentOpcode = null;
        this.lastLoopEnd = 0;
        this.numLoops = 0;
    }

    /**
     * Sets the ROM. Sets various references.
     * @param {*} romInput 
     */
    initialize(romInput){
        this.memory.setMemory(this.cpu);
        this.memory.initialize(romInput)
        this.cpu.setMemory(this.memory);
        this.cpu.setDebug(this.debug);
        this.cpu.setGpu(this.gpu);
        this.gpu.setMemory(this.memory);
        
        this.testTile();
    }

    mainLoop() {
        while(this.cpu.frameReady == false){
            this.cpu.interrupt();
            this.debug.logger(); 
            this.currentOpcode = this.cpu.decode();
            this.cpu.execute(this.currentOpcode);
        }
        this.numLoops++;
        if(this.numLoops == 35){
            this.debug.download("Log", this.debug.logString);
            this.debug.logString = "";
            // this.debug.download("serial", this.debug.blarggString);
        }
        // if(this.numLoops == 200){
        //     this.debug.download("Log2", this.debug.logString);
        //     this.debug.logString = "";
        // }
        // if(this.numLoops == 300){
        //     this.debug.download("Log3", this.debug.logString);
        //     this.debug.logString = "";
        // }
        // if(this.numLoops == 400){
        //     this.debug.download("Log4", this.debug.logString);
        //     this.debug.logString = "";
        // }
        this.cpu.frameReady = false;

        // this.gpu.drawTileMaps();
        this.gpu.drawBackgroundMaps();
        // document.getElementById("log").value = this.debug.logString;
        document.getElementById("frames-elapsed").stepUp(1);

        this.debug.debugRomOutput(this.cpu);
        // this.debug.debugClock(this.cpu);
        // this.debug.debugMemoryWatch(this.cpu);
        // this.debug.registerViewer(this.cpu.registers);
    }

    /**
     * Draws a test sprite on the canvas to test gpu functions.
     */
    testTile(){
        let tile = [0x3c, 0x7e, 0x42, 0x42, 0x42, 0x42, 0x42, 0x42, 0x7e, 0x5e, 0x7e, 0x0a, 0x7c, 0x56, 0x38, 0x7c]
        let decodedTile = this.gpu.decodeTile(tile)
        this.gpu.drawTile(decodedTile, 0, 0, this.gpu.ctx);
    }
}