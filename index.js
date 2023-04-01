import { RegisterCollection } from "./registerCollection.js";
import { Cpu } from "./cpu.js";

let test = new RegisterCollection()
test.setRegister(0, 0xF)

let cpu = new Cpu()

cpu.memory.io.data[0] = 111;

console.log(cpu.memory.readMemory(0xFF00))