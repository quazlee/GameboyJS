import { RegisterCollection } from "./registerCollection.js"
import { Memory } from "./memory.js";

export class Cpu {
    constructor() {
        this.registers = new RegisterCollection();
        this.currentOpcode = 0x0000;
        this.opcodeTicks = 0;
        this.memory = new Memory();

    }

    fetch() {
        
    }

    decode(opcode) {

    }

    tickClock(){
        
    }
}