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
        this.registers.setRegister(registerID.HL, this.memory.readMemory(this.registers.getRegisterDouble(registerID.H, registerID.L)));
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
                    break;
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
                            {
                                let jumpOffset = this.fetch();
                                this.programCounter += jumpOffset;
                                this.tickClock(12);
                                break;
                            }
                        case 0x9:
                            {
                                this.registers.addHL(this.registers.getRegisterDouble(registerID.D, registerID.E));
                                this.tickClock(8);
                                break;
                            }
                        case 0xA:
                            {
                                let value = this.memory.readMemory(this.registers.getRegisterDouble(registerID.D, registerID.E));
                                this.registers.setRegister(registerID.A, value);
                                this.tickClock(8);
                                break;
                            }
                        case 0xB:
                            this.registers.decRegisterDouble(registerID.D, registerID.E);
                            this.tickClock(8);
                            break;
                        case 0xC:
                            this.registers.incRegister(registerID.E);
                            this.tickClock(4);
                            break;
                        case 0xD:
                            this.registers.decRegister(registerID.E);
                            this.tickClock(4);
                            break;
                        case 0xE:
                            this.registers.setRegister(registerID.E, this.fetch());
                            this.tickClock(4);
                            break;
                        case 0xF:
                            this.registers.rotateRightA();
                            this.tickClock(4);
                            break;
                    }
                    break;
                case 0x2:
                    switch (low) {
                        case 0x0:
                            this.jumpRelativeConditional(!this.registers.getFlag(7));
                            break;
                        case 0x1:
                            {
                                let low = this.fetch();
                                let high = this.fetch();
                                this.registers.setRegisterDouble(registerID.H, registerID.L, high, low);
                                this.tickClock(12);
                                break;
                            }
                        case 0x2:
                            {
                                let location = this.registers.getRegisterDouble(registerID.H, registerID.L);
                                this.registers.incRegisterDouble(registerID.H, registerID.L);
                                let value = this.registers.getRegister(registerID.A);
                                this.memory.writeMemory(location, value)
                                this.tickClock(8);
                                break;
                            }
                        case 0x3:
                            {
                                this.registers.incRegisterDouble(registerID.H, registerID.L);
                                this.tickClock(8);
                                break;
                            }
                        case 0x4:
                            {
                                this.registers.incRegister(registerID.H);
                                this.tickClock(4);
                                break;
                            }
                        case 0x5:
                            {
                                this.registers.decRegister(registerID.H);
                                this.tickClock(4);
                                break;
                            }
                        case 0x6:
                            {
                                this.registers.setRegister(registerID.H, this.fetch());
                                this.tickClock(8);
                                break;
                            }
                        case 0x7://TODO DAA
                            break;
                        case 0x8:
                            this.jumpRelativeConditional(this.registers.getFlag(7));
                            break;
                        case 0x9:
                            {
                                this.registers.addHL(this.registers.getRegisterDouble(registerID.H, registerID.L));
                                this.tickClock(8);
                                break;
                            }
                        case 0xA:
                            {
                                let value = this.memory.readMemory(this.registers.getRegisterDouble(registerID.H, registerID.L));
                                this.registers.incRegisterDouble(registerID.H, registerID.L);
                                this.registers.setRegister(registerID.A, value);
                                this.tickClock(8);
                                break;
                            }
                        case 0xB:
                            {
                                this.registers.decRegisterDouble(registerID.H, registerID.L);
                                this.tickClock(8);
                                break;
                            }
                        case 0xC:
                            {
                                this.registers.incRegister(registerID.L);
                                this.tickClock(4);
                                break;
                            }
                        case 0xD:
                            {
                                this.registers.decRegister(registerID.L);
                                this.tickClock(4);
                                break;
                            }
                        case 0xE:
                            {
                                this.registers.setRegister(registerID.L, this.fetch());
                                this.tickClock(8);
                                break;
                            }
                        case 0xF://TODO CPL
                            break;
                    }
                    break;
                case 0x3:
                    switch (low) {
                        case 0x0:
                            this.jumpRelativeConditional(!this.registers.getFlag(4));
                            break;
                        case 0x1:
                            let low = this.fetch();
                            let high = this.fetch();
                            this.stackPointer = ((high << 4) | low);
                            this.tickClock(12)
                            break;
                        case 0x2:
                            {
                                let location = this.registers.getRegisterDouble(registerID.H, registerID.L);
                                this.registers.decRegisterDouble(registerID.H, registerID.L);
                                let value = this.registers.getRegister(registerID.A);
                                this.memory.writeMemory(location, value)
                                this.tickClock(8);
                                break;
                            }
                        case 0x3:
                            this.stackPointer = this.registers.sum(this.stackPointer, 1);
                            this.tickClock(8);
                            break;
                        case 0x4:
                            this.registers.incRegister(registerID.HL);
                            this.tickClock(12);
                            break;
                        case 0x5:
                            this.registers.decRegister(registerID.HL);
                            this.tickClock(12);
                            break;
                        case 0x6:
                            {
                                this.registers.setRegister(registerID.HL, this.fetch());
                                this.tickClock(12);
                                break;
                            }
                        case 0x7://TODO SCF
                            break;
                        case 0x8:
                            this.jumpRelativeConditional(this.registers.getFlag(4));
                            break;
                        case 0x9:
                            {
                                this.registers.addHL(this.stackPointer);
                                this.tickClock(8);
                                break;
                            }
                        case 0xA:
                            {
                                let value = this.memory.readMemory(this.registers.getRegisterDouble(registerID.H, registerID.L));
                                this.registers.decRegisterDouble(registerID.H, registerID.L);
                                this.registers.setRegister(registerID.A, value);
                                this.tickClock(8);
                                break;
                            }
                        case 0xB:
                            this.stackPointer = this.registers.difference(this.stackPointer, 1);
                            this.tickClock(8);
                            break;
                        case 0xC:
                            {
                                this.registers.incRegister(registerID.A);
                                this.tickClock(4);
                                break;
                            }
                        case 0xD:
                            {
                                this.registers.decRegister(registerID.A);
                                this.tickClock(4);
                                break;
                            }
                        case 0xE:
                            {
                                this.registers.setRegister(registerID.A, this.fetch());
                                this.tickClock(8);
                                break;
                            }
                        case 0xF://TODO CCF
                            break;
                    }
                    break;
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
                        if (low == 0xE) {
                            this.tickClock(8);
                        }
                        else {
                            this.tickClock(4);
                        }
                    }
                    break;
                case 0xC:
                    switch (low) {
                        case 0x0:
                            break;
                        case 0x1:
                            break;
                        case 0x2:
                            break;
                        case 0x3:
                            break;
                        case 0x4:
                            break;
                        case 0x5:
                            break;
                        case 0x6:
                            break;
                        case 0x7:
                            break;
                        case 0x8:
                            break;
                        case 0x9:
                            break;
                        case 0xA:
                            break;
                        case 0xB:
                            break;
                        case 0xC:
                            break;
                        case 0xD:
                            break;
                        case 0xE:
                            break;
                        case 0xF:
                            break;
                    }
                    break;

            }
        }
        else {
            [high, low] = this.decode();
            switch (high) {
                case 0x0:
                    if (low < 8) {
                        this.registers.rotateLeftCircular(low);
                        if (low == 0x6) {
                            this.tickClock(16);
                        }
                        else {
                            this.tickClock(8);
                        }
                    }
                    else {
                        this.registers.rotateRightCircular(low - 8);
                        if (low == 0xE) {
                            this.tickClock(16);
                        }
                        else {
                            this.tickClock(8);
                        }
                    }
                    break
                case 0x1:
                    if (low < 8) {
                        this.registers.rotateLeft(low);
                        if (low == 0x6) {
                            this.tickClock(16);
                        }
                        else {
                            this.tickClock(8);
                        }
                    }
                    else {
                        this.registers.rotateRight(low - 8);
                        if (low == 0xE) {
                            this.tickClock(16);
                        }
                        else {
                            this.tickClock(8);
                        }
                    }
                    break;
                case 0x2:
                    break;
                case 0x3:
                    break;
                case 0x4:
                    break;
                case 0x5:
                    if (low < 8) {
                        this.bit(2, low);
                    }
                    else {
                        this.bit(3, low - 8);
                    }
                    break;
                case 0x6:
                    if (low < 8) {
                        this.bit(4, low);
                    }
                    else {
                        this.bit(5, low - 8);
                    }
                    break;
                case 0x7:
                    if (low < 8) {
                        this.bit(6, low);
                    }
                    else {
                        this.bit(7, low - 8);
                    }
                    break;
                case 0x8:
                    if (low < 8) {
                        this.res(0, low);
                    }
                    else {
                        this.res(1, low - 8);
                    }
                    break;
                case 0x9:
                    if (low < 8) {
                        this.res(2, low);
                    }
                    else {
                        this.res(3, low - 8);
                    }
                    break;
                case 0xA:
                    if (low < 8) {
                        this.res(4, low);
                    }
                    else {
                        this.res(5, low - 8);
                    }
                    break;
                case 0xB:
                    if (low < 8) {
                        this.res(6, low);
                    }
                    else {
                        this.res(7, low - 8);
                    }
                    break;
                case 0xC:
                    if (low < 8) {
                        this.set(0, low);
                    }
                    else {
                        this.set(1, low - 8);
                    }
                    break;
                case 0xD:
                    if (low < 8) {
                        this.set(2, low);
                    }
                    else {
                        this.set(3, low - 8);
                    }
                    break;
                case 0xE:
                    if (low < 8) {
                        this.set(4, low);
                    }
                    else {
                        this.set(5, low - 8);
                    }
                    break;
                case 0xF:
                    if (low < 8) {
                        this.set(6, low);
                    }
                    else {
                        this.set(7, low - 8);
                    }
                    break;
            }
        }

        this.memory.writeMemory(this.registers.getRegisterDouble(registerID.H, registerID.L), this.registers.getRegister(registerID.HL))//Assign the new HL value back to register
        this.debugRomOutput();
        this.debugClock();
    }

    tickClock(cycles) {
        this.opcodeTicks += cycles;
    }

    jumpRelativeConditional(condition) {
        let location = this.fetch();
        if (condition) {
            this.programCounter += location;
            this.tickClock(12);
        }
        else {
            this.tickClock(8);
        }
    }
    callConditional(){
        
    }
    returnConditional(){

    }

    ldXY(registerX, registerY) {
        this.registers.setRegister(registerX, registerY);
        if (registerY == 0x6) {
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

    res(bit, register) {
        let registerValue = this.registers.getRegister(register);
        registerValue &= ~(1 << bit);
        if (low == 0x6) {
            this.tickClock(16);
        }
        else {
            this.tickClock(8);
        }
    }
    set(bit, register) {
        let registerValue = this.registers.getRegister(register);
        registerValue |= (1 << bit);
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

    debugClock() {
        let debugElement = document.getElementById("clock");
        debugElement.textContent = this.opcodeTicks.toString();
    }

}