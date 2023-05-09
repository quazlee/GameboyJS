import { Cpu } from "./cpu.js";
import { Gpu } from "./gpu.js"
 
export class Gameboy {
    constructor() {
        this.cpu = new Cpu();
        this.gpu = new Gpu();
    }
}