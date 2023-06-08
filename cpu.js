import { RegisterCollection } from "./registercollection.js"
import { Memory } from "./memory.js";

const registerNames = {
    B: 0,
    C: 1,
    D: 2,
    E: 3,
    H: 4,
    L: 5,
    A: 7,
    F: 8
}

export class Cpu {
    constructor(romArray) {
        this.registers = new RegisterCollection();
        this.opcodeTicks = 0;
        this.memory = new Memory(romArray);
        this.programCounter = 0x0100;
        this.stackPointer = 0;

    }

    fetch() {
        let currentOpcode = this.memory.readMemory(this.programCounter);
        this.programCounter++;
        return currentOpcode;
    }

    decodeAndExecute() {
        let currentOpcode = 0;
        try {
            if (currentOpcode > 255 || currentOpcode < 0) {
                throw new Error("Value Must Be Between 0x00 and 0xFF");
            }
            else {
                currentOpcode = this.fetch();
            }
        }
        catch (e) {
            errorHandler(e);
        }

        let high = currentOpcode >> 4;
        let low = currentOpcode & 0xF;

        //get the (HL) value
        this.registers.setRegister(6, this.memory.readMemory(this.registers.getRegisterDouble(H, L)));

        switch (high) {
            case 0x0:
                switch (low) {
                    case 0x0:
                        {
                            this.tickClock(4);
                            break;
                        }
                    case 0x1:
                        {
                            let low = this.fetch();
                            let high = this.fetch();
                            this.registers.setRegisterDouble(B, C, high, low);
                            this.tickClock(12);
                            break;
                        }
                    case 0x2:
                        {
                            let location = this.registers.getRegisterDouble(B, C);
                            let value = this.registers.getRegister(A);
                            this.memory.writeMemory(location, value)
                            this.tickClock(8);
                            break;
                        }
                    case 0x3:
                        {
                            this.registers.incRegisterDouble(B, C);
                            this.tickClock(8);
                            break;
                        }
                    case 0x4:
                        {
                            this.registers.incRegister(B);
                            this.tickClock(4);
                            break;
                        }
                    case 0x5:
                        {
                            this.registers.decRegister(B);
                            this.tickClock(4);
                            break;
                        }
                    case 0x6:
                        {
                            this.registers.setRegister(B, this.fetch());
                            this.tickClock(4);
                            break;
                        }
                    case 0x7:
                        {
                            this.registers.rotateLeftCircularA();
                            this.tickClock(4);
                            break;
                        }
                    case 0x8:
                        {
                            let location = (this.fetch() << 8) | this.fetch();
                            this.memory.writeMemory(location, this.stackPointer);
                            this.tickClock(20);
                            break;
                        }
                    case 0x9:
                        {
                            this.registers.addHL(this.registers.getRegisterDouble(B, C));
                            this.tickClock(8);
                            break;
                        }
                    case 0xA:
                        {
                            let value = this.memory.readMemory(this.registers.getRegisterDouble(B, C));
                            this.registers.setRegister(A, value);
                            this.tickClock(8);
                            break;
                        }
                    case 0xB:
                        this.registers.decRegisterDouble(B, C);
                        this.tickClock(8);
                        break;
                    case 0xC:
                        this.registers.incRegister(C);
                        this.tickClock(4);
                        break;
                    case 0xD:
                        this.registers.decRegister(C);
                        this.tickClock(4);
                        break;
                    case 0xE:
                        this.registers.setRegister(C, this.fetch());
                        this.tickClock(4);
                        break;
                    case 0xF:
                        this.registers.rotateRightCircularA();
                        this.tickClock(4);
                        break;
                }
            case 0x1:
                switch (low) {
                    case 0x0:
                        {   //TODO: STOP
                            this.tickClock(4);
                            break;
                        }
                    case 0x1:
                        {
                            let low = this.fetch();
                            let high = this.fetch();
                            this.registers.setRegisterDouble(D, E, high, low);
                            this.tickClock(12);
                            break;
                        }
                    case 0x2:
                        {
                            let location = this.registers.getRegisterDouble(D, E);
                            let value = this.registers.getRegister(A);
                            this.memory.writeMemory(location, value)
                            this.tickClock(8);
                            break;
                        }
                    case 0x3:
                        {
                            this.registers.incRegisterDouble(D, E);
                            this.tickClock(8);
                            break;
                        }
                    case 0x4:
                        {
                            this.registers.incRegister(D);
                            this.tickClock(4);
                            break;
                        }
                    case 0x5:
                        {
                            this.registers.decRegister(D);
                            this.tickClock(4);
                            break;
                        }
                    case 0x6:
                        {
                            this.registers.setRegister(D, this.fetch());
                            this.tickClock(4);
                            break;
                        }
                    case 0x7:
                        {
                            this.registers.rotateLeftA();
                            this.tickClock(4);
                            break;
                        }
                    case 0x8:
                        {//TODO: JUMP RELATIVE
                            break;
                        }
                    //         case 0x9:
                    //             this.registers.addHL(this.registers.getRegisterDouble(2, 3));
                    //             this.tickClock(8);
                    //             break;
                    //         case 0xA:
                    //             this.registers.setRegister(6, this.memory.readMemory(this.registers.getRegisterDouble(2, 3)))
                    //             this.tickClock(8);
                    //             break;
                    //         case 0xB:
                    //             this.registers.decRegisterDouble(2, 3);
                    //             this.tickClock(8);
                    //             break;
                    //         case 0xC:
                    //             this.registers.incRegister(3);
                    //             this.tickClock(4);
                    //             break;
                    //         case 0xD:
                    //             this.registers.decRegister(3);
                    //             this.tickClock(4);
                    //             break;
                    //         case 0xE:
                    //             this.registers.setRegister(3, this.fetch());
                    //             this.tickClock(4);
                    //             break;
                    //         case 0xF:
                    //             this.registers.rotateRightA();
                    //             this.tickClock(4);
                    //             break;
                }
            // case 0x2:
            //     switch (low) {
            //         case 0x0:
            //             //TODO: JUMP RELATIVE
            //             break;
            //         case 0x1:
            //             this.registers.setRegister(4, 5, this.fetch(), this.fetch());
            //             this.tickClock(12);
            //             break;
            //         case 0x2:
            //             this.memory.writeMemory(this.registers.getRegisterDouble(5, 6), this.registers.getRegister(6))
            //             this.registers.incRegisterDouble(4, 5);
            //             this.tickClock(8);
            //             break;
            //         case 0x3:
            //             this.registers.incRegisterDouble(4, 5);
            //             this.tickClock(8);
            //             break;
            //         case 0x4:
            //             this.registers.incRegister(4);
            //             this.tickClock(4);
            //             break;
            //         case 0x5:
            //             this.registers.decRegister(4);
            //             this.tickClock(4);
            //             break;
            //         case 0x6:
            //             this.registers.setRegister(4, this.fetch());
            //             this.tickClock(4);
            //             break;
            //         case 0x7:
            //             //TODO: DAA
            //             break;
            //         case 0x8:
            //             //TODO: JUMP RELATIVE
            //             break;
            //         case 0x9:
            //             this.registers.addHL(this.registers.getRegisterDouble(4, 5));
            //             this.tickClock(8);
            //             break;
            //         case 0xA:
            //             this.registers.setRegister(5, this.memory.readMemory(this.registers.getRegisterDouble(5, 6)))
            //             this.tickClock(8);
            //             break;
            //         case 0xB:
            //             this.registers.decRegisterDouble(4, 5);
            //             this.tickClock(8);
            //             break;
            //         case 0xC:
            //             this.registers.incRegister(5);
            //             this.tickClock(4);
            //             break;
            //         case 0xD:
            //             this.registers.decRegister(5);
            //             this.tickClock(4);
            //             break;
            //         case 0xE:
            //             this.registers.setRegister(5, this.fetch());
            //             this.tickClock(4);
            //             break;
            //         case 0xF:
            //             //TODO: CPL
            //             break;
            //     }
            // case 0x3:
            //     switch (low) {
            //         case 0x0:
            //             //TODO: JUMP RELATIVE
            //             break;
            //         case 0x1:
            //             {
            //                 let low = this.fetch();
            //                 let high = this.fetch();
            //                 this.stackPointer = (high << 8) | low;
            //                 this.tickClock(12);
            //                 break;
            //             }
            //         case 0x2:
            //             this.memory.writeMemory(this.registers.getRegisterDouble(4, 5), this.registers.getRegister(6))
            //             this.registers.decRegisterDouble(4, 5);
            //             this.tickClock(8);
            //             break;
            //         case 0x3:
            //             this.stackPointer++;
            //             this.tickClock(8);
            //             break;
            //         case 0x4:
            //             {
            //                 let oldValue = this.memory.readMemory(this.registers.getRegisterDouble(4, 5));
            //                 this.registers.assignZero(oldValue);
            //                 this.registers.clearFlag(6);
            //                 this.registers.assignHalfcarryAddDouble(oldValue, 1);
            //                 let newValue = oldValue++;
            //                 if (newValue > 65535) {
            //                     newValue -= 65536;
            //                 }
            //                 this.memory.writeMemory(this.registers.getRegisterDouble(4, 5), newValue);
            //                 this.tickClock(12);
            //                 break;
            //             }
            //         case 0x5:
            //             {
            //                 let oldValue = this.memory.readMemory(this.registers.getRegisterDouble(4, 5));
            //                 this.registers.assignZero(oldValue);
            //                 this.registers.clearFlag(6);
            //                 this.registers.assignHalfcarrySubDouble(oldValue, 1);
            //                 let newValue = oldValue--;
            //                 if (newValue < 0) {
            //                     newValue += 65536;
            //                 }
            //                 this.memory.writeMemory(this.registers.getRegisterDouble(4, 5), newValue);
            //                 this.tickClock(12);
            //                 break;
            //             }
            //         case 0x6:

            //             break;
            //         case 0x7:
            //             //TODO: SCF
            //             break;
            //         case 0x8:
            //             //TODO: JUMP RELATIVE
            //             break;
            //         case 0x9:
            //             break;
            //         case 0xA:
            //             break;
            //         case 0xB:
            //             break;
            //         case 0xC:
            //             break;
            //         case 0xD:
            //             break;
            //         case 0xE:
            //             break;
            //         case 0xF:
            //             //TODO: CCF
            //             break;
            //     }
            case 0x4:
                if (low < 8) {
                    this.registers.setRegister(B, low);
                    if (low == 0x6) {
                        this.tickClock(8);
                    }
                    else {
                        this.tickClock(4);
                    }
                }
                else {
                    this.registers.setRegister(C, low - 8);
                    if (low == 0xE) {
                        this.tickClock(8);
                    }
                    else {
                        this.tickClock(4);
                    }
                }
                break;
            case 0x5:
                if (low < 8) {
                    this.registers.setRegister(D, low);
                    if (low == 0x6) {
                        this.tickClock(8);
                    }
                    else {
                        this.tickClock(4);
                    }
                }
                else {
                    this.registers.setRegister(E, low - 8);
                    if (low == 0xE) {
                        this.tickClock(8);
                    }
                    else {
                        this.tickClock(4);
                    }
                }
                break;
            case 0x6:
                if (low < 8) {
                    this.registers.setRegister(H, low);
                    if (low == 0x6) {
                        this.tickClock(8);
                    }
                    else {
                        this.tickClock(4);
                    }
                }
                else {
                    this.registers.setRegister(L, low - 8);
                    if (low == 0xE) {
                        this.tickClock(8);
                    }
                    else {
                        this.tickClock(4);
                    }
                }
                break;
            case 0x7:
                if (low == 0x6) {
                    //TODO: HALT
                }
                else if (low < 8) {
                    this.registers.setRegister(HL, low);
                    this.tickClock(8);
                }
                else {
                    this.registers.setRegister(A, low - 8);
                    if (low == 0xE) {
                        this.tickClock(8);
                    }
                    else {
                        this.tickClock(4);
                    }
                }
                break;
            case 0x8:
                this.registers.add
                if (low < 8) {
                    if (low == 0x6) {
                        this.tickClock(8);
                    }
                    else {
                        this.tickClock(4);
                    }
                }
                else {
                    if (low == 0xE) {
                        this.tickClock(8);
                    }
                    else {
                        this.tickClock(4);
                    }
                }
                break;
            case 0x9:
                if (low < 8) {
                    if (low == 0x6) {
                        this.tickClock(8);
                    }
                    else {
                        this.tickClock(4);
                    }
                }
                else {
                    if (low == 0xE) {
                        this.tickClock(8);
                    }
                    else {
                        this.tickClock(4);
                    }
                }
                break;

        }
        this.memory.writeMemory()//Assign the new HL value back to register
        this.debugRomOutput();
    }

    tickClock(cycles) {

    }

    debugRomOutput(){
        if(this.memory.readMemory(0xFF02) == 0x0081)
        {
            console.log(this.memory.readMemory(0xFF01));
        }
    }

}