import { Cpu } from "./cpu.js";
import { Debug } from "./debug.js";
import { Ppu } from "./ppu.js";
import { MemoryManager } from "./memory.js";
import { Controls } from "./controls.js";

export class Gameboy {
    constructor() {
        this.gameName = "";

        this.memory = new MemoryManager();
        this.cpu = new Cpu();
        this.ppu = new Ppu();
        this.debug = new Debug();
        this.controls = new Controls();

        this.currentOpcode = null;
        this.lastLoopEnd = 0;
        this.numLoops = 0;


        this.saveStateButton = document.getElementById("save-state");
        this.saveStateButton.addEventListener("click", this.saveState.bind(this));

        this.loadStateButton = document.getElementById("load-state");
        this.loadStateButton.addEventListener("click", this.loadState.bind(this));

        this.saveStateNumber = document.getElementById("save-state-number");
    }

    /**
     * Sets the ROM. Sets various references.
     * @param {*} romInput 
     */
    initialize(romInput) {
        this.memory.setMemory(this.cpu);
        this.memory.initialize(romInput)

        this.cpu.setMemory(this.memory);
        this.cpu.setDebug(this.debug);
        this.cpu.setPpu(this.ppu);

        this.ppu.setMemory(this.memory);

        this.debug.setMemory(this.memory);
        this.debug.setCpu(this.cpu);
        this.debug.setPpu(this.ppu);

        this.controls.setMemory(this.memory);

        this.testTile();
    }

    mainLoop() {
        while (this.ppu.frameReady == false) {
            this.cpu.interrupt();

            this.debug.logger();

            this.currentOpcode = this.cpu.decode();
            this.cpu.execute(this.currentOpcode);
            this.controls.updateInputState();
        }
        this.numLoops++;
        if (this.numLoops == 50) {
            this.debug.downloadLog();
            this.debug.logString = "";
        }
        this.ppu.frameReady = false;

        this.debug.drawTileMaps();
        this.debug.drawBackgroundMaps();
        document.getElementById("frames-elapsed").stepUp(1);
        this.debug.debugRomOutput(this.cpu);
        // this.loadState();
    }

    /**
     * Draws a test sprite on the canvas to test gpu functions.
     */
    testTile() {
        let tile = [0x3c, 0x7e, 0x42, 0x42, 0x42, 0x42, 0x42, 0x42, 0x7e, 0x5e, 0x7e, 0x0a, 0x7c, 0x56, 0x38, 0x7c]
        let decodedTile = this.ppu.decodeTile(tile)
        this.ppu.drawTile(decodedTile, 0, 0, this.ppu.viewportCtx);
    }

    saveState() {
        let state = {
            "programCounter": JSON.stringify(this.cpu.programCounter),
            "stackPointer": JSON.stringify(this.cpu.stackPointer),
            "registers": JSON.stringify(this.cpu.registers),
            "memory": JSON.stringify(this.memory.memory)
        }

        localStorage.setItem(this.gameName + " - " + this.saveStateNumber.value, JSON.stringify(state));
    }
    loadState() {
        if(localStorage.getItem(this.gameName + " - " + this.saveStateNumber.value) != null)
        {
            let state = JSON.parse(localStorage.getItem(this.gameName + " - " + this.saveStateNumber.value));
            this.cpu.programCounter = Number(state.programCounter);
            this.cpu.stackPointer = Number(state.stackPointer);
            this.cpu.registers.loadState(JSON.parse(state.registers));
            this.memory.memory.loadState(JSON.parse(state.memory));
        }
        
    }

    setGameName(name) {
        this.gameName = name;
    }
}
