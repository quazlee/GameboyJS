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
    }

    mainLoop() {
        while(this.cpu.opcodeTicks < 17556){
            this.cpu.execute();
        }
        this.cpu.opcodeTicks = 0;
    }
}