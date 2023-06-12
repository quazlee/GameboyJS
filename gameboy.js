import { Cpu } from "./cpu.js";
import { Gpu } from "./gpu.js"
 
export class Gameboy {
    constructor(romArray) {
        this.cpu = new Cpu(romArray);
        this.gpu = new Gpu();
    }

    mainLoop(){
        
    }
}