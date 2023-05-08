import { Gameboy } from "./gameboy.js"

let gameboy = new Gameboy();

gameboy.cpu.registers.data[0] = 0
gameboy.cpu.registers.data[1] = 34
gameboy.cpu.registers.decRegister(0);
console.log(gameboy.cpu.registers.data[0]);
console.log(gameboy.cpu.registers.data[1]);