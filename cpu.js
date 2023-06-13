import { RegisterCollection } from "./registercollection.js"
import { Memory } from "./memory.js";

const registerID = {
    B: 0,
    C: 1,
    D: 2,
    E: 3,
    H: 4,
    L: 5,
    HL: 6,
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

    decode() {
        let currentOpcode = this.fetch();
        try {
            if (currentOpcode > 255 || currentOpcode < 0) {
                throw new Error("Value Must Be Between 0x00 and 0xFF");
            }
        }
        catch (e) {
            errorHandler(e);
        }

        let high = currentOpcode >> 4;
        let low = currentOpcode & 0xF;

        return [high, low];
    }

    execute() {
        let [high, low] = this.decode();

        //get the (HL) value
        this.registers.setRegister(6, this.memory.readMemory(this.registers.getRegisterDouble(H, L)));
        if (((high << 4) | low) != 0xCB) {
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
                                this.registers.setRegisterDouble(registerID.B, registerID.C, high, low);
                                this.tickClock(12);
                                break;
                            }
                        case 0x2:
                            {
                                let location = this.registers.getRegisterDouble(registerID.B, registerID.C);
                                let value = this.registers.getRegister(registerID.A);
                                this.memory.writeMemory(location, value)
                                this.tickClock(8);
                                break;
                            }
                        case 0x3:
                            {
                                this.registers.incRegisterDouble(registerID.B, registerID.C);
                                this.tickClock(8);
                                break;
                            }
                        case 0x4:
                            {
                                this.registers.incRegister(registerID.B);
                                this.tickClock(4);
                                break;
                            }
                        case 0x5:
                            {
                                this.registers.decRegister(registerID.B);
                                this.tickClock(4);
                                break;
                            }
                        case 0x6:
                            {
                                this.registers.setRegister(registerID.B, this.fetch());
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
                                this.registers.addHL(this.registers.getRegisterDouble(registerID.B, registerID.C));
                                this.tickClock(8);
                                break;
                            }
                        case 0xA:
                            {
                                let value = this.memory.readMemory(this.registers.getRegisterDouble(registerID.B, registerID.C));
                                this.registers.setRegister(registerID.A, value);
                                this.tickClock(8);
                                break;
                            }
                        case 0xB:
                            this.registers.decRegisterDouble(registerID.B, registerID.C);
                            this.tickClock(8);
                            break;
                        case 0xC:
                            this.registers.incRegister(registerID.C);
                            this.tickClock(4);
                            break;
                        case 0xD:
                            this.registers.decRegister(registerID.C);
                            this.tickClock(4);
                            break;
                        case 0xE:
                            this.registers.setRegister(registerID.C, this.fetch());
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
                                this.registers.setRegisterDouble(registerID.D, registerID.E, high, low);
                                this.tickClock(12);
                                break;
                            }
                        case 0x2:
                            {
                                let location = this.registers.getRegisterDouble(registerID.D, registerID.E);
                                let value = this.registers.getRegister(registerID.A);
                                this.memory.writeMemory(location, value)
                                this.tickClock(8);
                                break;
                            }
                        case 0x3:
                            {
                                this.registers.incRegisterDouble(registerID.D, registerID.E);
                                this.tickClock(8);
                                break;
                            }
                        case 0x4:
                            {
                                this.registers.incRegister(registerID.D);
                                this.tickClock(4);
                                break;
                            }
                        case 0x5:
                            {
                                this.registers.decRegister(registerID.D);
                                this.tickClock(4);
                                break;
                            }
                        case 0x6:
                            {
                                this.registers.setRegister(registerID.D, this.fetch());
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
                        this.ldXY(registerID.B, low);
                    }
                    else {
                        this.ldXY(registerID.C, low - 8);
                    }
                    break;
                case 0x5:
                    if (low < 8) {
                        this.ldXY(registerID.D, low);
                    }
                    else {
                        this.ldXY(registerID.E, low - 8);
                    }
                    break;
                case 0x6:
                    if (low < 8) {
                        this.ldXY(registerID.H, low);
                    }
                    else {
                        this.ldXY(registerID.L, low - 8);
                    }
                    break;
                case 0x7:
                    if (low == 0x6) {
                        //TODO: HALT
                    }
                    else if (low < 8) {
                        this.registers.setRegister(registerID.HL, low);
                        this.tickClock(8);
                    }
                    else {
                        this.ldXY(registerID.A, low - 8);
                    }
                    break;
                case 0x8:
                    if (low < 8) {
                        this.registers.addA(low);
                        if (low == 0x6) {
                            this.tickClock(8);
                        }
                        else {
                            this.tickClock(4);
                        }
                    }
                    else {
                        this.registers.adcA(low - 8);//TODO
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
                        this.registers.subA(low);//TODO
                        if (low == 0x6) {
                            this.tickClock(8);
                        }
                        else {
                            this.tickClock(4);
                        }
                    }
                    else {
                        this.registers.sbcA(low - 8);//TODO
                        if (low == 0xE) {
                            this.tickClock(8);
                        }
                        else {
                            this.tickClock(4);
                        }
                    }
                    break;
                case 0xA:
                    if (low < 8) {
                        this.registers.andA(low);//TODO
                        if (low == 0x6) {
                            this.tickClock(8);
                        }
                        else {
                            this.tickClock(4);
                        }
                    }
                    else {
                        this.registers.xorA(low - 8);//TODO
                        if (low == 0xE) {
                            this.tickClock(8);
                        }
                        else {
                            this.tickClock(4);
                        }
                    }
                    break;
                case 0xB:
                    if (low < 8) {
                        this.registers.orA(low);//TODO
                        if (low == 0x6) {
                            this.tickClock(8);
                        }
                        else {
                            this.tickClock(4);
                        }
                    }
                    else {
                        this.registers.cpA(low - 8);//TODO
                        if (low == 0x6) {
                            this.tickClock(8);
                        }
                        else {
                            this.tickClock(4);
                        }
                    }
                    break;
                case 0xC:
                    break

            }
        }
        else {
            [high, low] = this.decode();
            switch (high) {
                case 0x0:
                    this.registers.rotateLeftCircular(low);
                    if (low == 0x6) {
                        this.tickClock(16);
                    }
                    else {
                        this.tickClock(8);
                    }
                    break
                case 0x1:
                    if (low == 0x6) {
                        this.tickClock(16);
                    }
                    else {
                        this.tickClock(8);
                    }
                    break
                case 0x2:
                    if (low == 0x6) {
                        this.tickClock(16);
                    }
                    else {
                        this.tickClock(8);
                    }
                    break
                case 0x3:
                    if (low == 0x6) {
                        this.tickClock(16);
                    }
                    else {
                        this.tickClock(8);
                    }
                    break
                case 0x4:
                    if (low < 8) {
                        this.bit(0, low);
                    }
                    else {
                        this.bit(1, low - 8);
                    }
                    break
                case 0x5:
                    if (low < 8) {
                        this.bit(2, low);
                    }
                    else {
                        this.bit(3, low - 8);
                    }
                    break
                case 0x6:
                    if (low < 8) {
                        this.bit(4, low);
                    }
                    else {
                        this.bit(5, low - 8);
                    }
                    break
                case 0x7:
                    if (low < 8) {
                        this.bit(6, low);
                    }
                    else {
                        this.bit(7, low - 8);
                    }
                    break
                case 0x8:
                    if (low < 8) {
                        this.res(0, low);
                    }
                    else {
                        this.res(1, low - 8);
                    }
                    break
                case 0x9:
                    if (low < 8) {
                        this.res(2, low);
                    }
                    else {
                        this.res(3, low - 8);
                    }
                    break
                case 0xA:
                    if (low < 8) {
                        this.res(4, low);
                    }
                    else {
                        this.res(5, low - 8);
                    }
                    break
                case 0xB:
                    if (low < 8) {
                        this.res(6, low);
                    }
                    else {
                        this.res(7, low - 8);
                    }
                    break
                case 0xC:
                    if (low < 8) {
                        this.set(0, low);
                    }
                    else {
                        this.set(1, low - 8);
                    }
                    break
                case 0xD:
                    if (low < 8) {
                        this.set(2, low);
                    }
                    else {
                        this.set(3, low - 8);
                    }
                    break
                case 0xE:
                    if (low < 8) {
                        this.set(4, low);
                    }
                    else {
                        this.set(5, low - 8);
                    }
                    break
                case 0xF:
                    if (low < 8) {
                        this.set(6, low);
                    }
                    else {
                        this.set(7, low - 8);
                    }
                    break
            }
        }

        this.memory.writeMemory(this.getRegisterDouble(H, L), this.getRegister(6))//Assign the new HL value back to register
        this.debugRomOutput();
    }

    tickClock(cycles) {

    }

    ldXY(registerX, registerY) {
        this.registers.setRegister(registerX, registerY);
        if (low == 0x6) {
            this.tickClock(8);
        }
        else {
            this.tickClock(4);
        }
    }

    bit(bit, register) {
        let registerValue = this.registers.getRegister(register);
        let bitValue = registerValue & (1 << bit);
        this.registers.assignZero(bitValue);
        this.registers.clearFlag(6);
        this.registers.setFlag(5);
        if (low == 0x6) {
            this.tickClock(12);
        }
        else {
            this.tickClock(8);
        }
    }

    res(bit, register){
        let registerValue = this.registers.getRegister(register);
        registerValue &=  ~(1 << bit);
        if (low == 0x6) {
            this.tickClock(16);
        }
        else {
            this.tickClock(8);
        }
    }
    set(bit, register){
        let registerValue = this.registers.getRegister(register);
        registerValue |=  (1 << bit);
        if (low == 0x6) {
            this.tickClock(16);
        }
        else {
            this.tickClock(8);
        }
    }

    debugRomOutput() {
        if (this.memory.readMemory(0xFF02) == 0x0081) {
            let debugElement = document.getElementById("debug");
            let debugText = debugElement.textContent;
            let nextCharacter = this.memory.readMemory(0xFF01);
            debugText.concat("", nextCharacter)
            console.log(nextCharacter);
        }
    }

}