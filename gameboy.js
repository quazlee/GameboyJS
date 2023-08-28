import { Cpu } from "./cpu.js";
import { Debug } from "./debug.js";
import { Gpu } from "./gpu.js";
import { Memory } from "./memory.js";
import { Controls } from "./controls.js";

export class Gameboy {
    constructor() {
        this.memory = new Memory();
        this.cpu = new Cpu();
        this.gpu = new Gpu();
        this.debug = new Debug();
        this.controls = new Controls();

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

        this.debug.setMemory(this.memory);
        this.debug.setCpu(this.cpu);
        this.debug.setGpu(this.gpu);

        this.controls.setMemory(this.memory);
        
        this.testTile();
    }

    mainLoop() {
        while(this.gpu.frameReady == false){
            this.cpu.interrupt();

            this.debug.logger(); 

            this.currentOpcode = this.cpu.decode();
            this.cpu.execute(this.currentOpcode);
            this.controls.updateInputState();
        }
        console.log(this.memory.readMemory(0xFF00).toString(2));
        this.numLoops++;
        if(this.numLoops == 50){
            this.debug.downloadLog();
            this.debug.logString = "";
        }
        this.gpu.frameReady = false;

        this.debug.drawTileMaps();
        this.debug.drawBackgroundMaps();
        document.getElementById("frames-elapsed").stepUp(1);
        this.debug.debugRomOutput(this.cpu);
    }

    /**
     * Draws a test sprite on the canvas to test gpu functions.
     */
    testTile(){
        let tile = [0x3c, 0x7e, 0x42, 0x42, 0x42, 0x42, 0x42, 0x42, 0x7e, 0x5e, 0x7e, 0x0a, 0x7c, 0x56, 0x38, 0x7c]
        let decodedTile = this.gpu.decodeTile(tile)
        this.gpu.drawTile(decodedTile, 0, 0, this.gpu.viewportCtx);
    }
}
