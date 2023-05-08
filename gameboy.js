import { Cpu } from "./cpu.js";

export class Gameboy {
    constructor() {
        this.cpu = new Cpu();
    }
}