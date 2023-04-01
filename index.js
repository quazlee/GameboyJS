import { RegisterCollection } from "./registerCollection.js";
import { Cpu } from "./cpu.js";

let test = new RegisterCollection()
test.setRegister(0, 0xF)

let cpu = new Cpu()

cpu.memory.romZero.data[0] = 5;


console.log(cpu.memory.romZero.data[0])