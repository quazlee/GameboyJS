import { RegisterCollection } from "./registercollection.js"
import { MemoryManager } from "./memory.js";
import { twosComplement } from "./utility.js";
import { Ppu } from "./ppu.js";
import { errorHandler } from "./errorhandler.js";

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
    constructor() {
        this.registers = new RegisterCollection();
        this.memoryController = null;
        this.programCounter = 0x0100;
        this.stackPointer = 0xFFFE;
        this.ppu = null;
        this.debug = null;
        this.sysClock = 0xAB00;
        this.halt = false;
        this.ime = 0;
    }

    setMemory(memory) {
        this.memoryController = memory;
    }

    setDebug(debug) {
        this.debug = debug;
    }

    setPpu(ppu) {
        this.ppu = ppu;
    }

    /**
     * 
     * @returns the next byte of data from the ROM at the location of the programcounter.
     */
    fetch() {
        let currentOpcode = this.memoryController.readMemory(this.programCounter);
        this.programCounter++;
        return currentOpcode;
    }

    /**
     * 
     * @returns the next byte of data from the ROM at the location of the programcounter. The data is split into [high, low] nibbles.
     */
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

    /**
     * Checks for requested Interrupts at the start of every CPU cycle.
     */
    interrupt() {
        if (this.ime && this.memoryController.readMemory(0xFFFF)) {
            if (this.memoryController.readMemory(0xFFFF) & 1 && this.memoryController.readMemory(0xFF0F) & 1) {
                this.interruptJump(0x40, 0);
            }
            if (this.memoryController.readMemory(0xFFFF) & 2 && this.memoryController.readMemory(0xFF0F) & 2) {
                this.interruptJump(0x48, 1);
            }
            if (this.memoryController.readMemory(0xFFFF) & 4 && this.memoryController.readMemory(0xFF0F) & 4) {
                this.interruptJump(0x50, 2);
            }
            if (this.memoryController.readMemory(0xFFFF) & 8 && this.memoryController.readMemory(0xFF0F) & 8) {
                this.interruptJump(0x58, 3);
            }
            if (this.memoryController.readMemory(0xFFFF) & 16 && this.memoryController.readMemory(0xFF0F) & 16) {
                this.interruptJump(0x60, 4);
            }
        }
    }

    interruptJump (location, bit){
        this.stackPointer = this.registers.differenceDouble(this.stackPointer, 1);
        this.memoryController.writeMemory(this.stackPointer, (this.programCounter >> 8));
        this.stackPointer = this.registers.differenceDouble(this.stackPointer, 1);
        this.memoryController.writeMemory(this.stackPointer, (this.programCounter & 0xff));
        this.programCounter = location;
        this.memoryController.writeMemory(0xFF0F, this.memoryController.readMemory(0xFF0F) & ~(1 << bit));
        this.tickClock(20);
    }

    /**
     * 
     * @param {[high, low]} param0 usually from cpu.decode().
     */
    execute([high, low]) {
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
                                this.memoryController.writeMemory(location, value);
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
                                this.tickClock(8);
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
                                let low = this.fetch();
                                let high = this.fetch();
                                let location = (high << 8) | low;
                                let lowStack = this.stackPointer & 0xFF;
                                let highStack = this.stackPointer >> 8;
                                this.memoryController.writeMemory(location, lowStack);
                                this.memoryController.writeMemory(location + 1, highStack);
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
                                let value = this.memoryController.readMemory(this.registers.getRegisterDouble(registerID.B, registerID.C));
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
                            this.tickClock(8);
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
                                try {
                                    throw new Error("TODO");
                                }
                                catch (e) {
                                    errorHandler(e);
                                }
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
                                this.memoryController.writeMemory(location, value);
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
                                this.tickClock(8);
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
                                this.programCounter += twosComplement(jumpOffset);
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
                                let value = this.memoryController.readMemory(this.registers.getRegisterDouble(registerID.D, registerID.E));
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
                            this.tickClock(8);
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
                                let tempHLLocation = this.registers.getRegisterDouble(registerID.H, registerID.L);
                                this.registers.setRegister(registerID.HL, this.memoryController.readMemory(tempHLLocation));
                                let value = this.registers.getRegister(registerID.A);
                                this.registers.setRegister(registerID.HL, value);
                                this.memoryController.writeMemory(tempHLLocation, this.registers.getRegister(registerID.HL));
                                this.registers.incRegisterDouble(registerID.H, registerID.L);
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
                        case 0x7:
                            {
                                let carry = this.registers.getFlag(4);
                                let halfcarry = this.registers.getFlag(5);
                                let negative = this.registers.getFlag(6);



                                let currentValue = this.registers.getRegister(registerID.A);
                                this.registers.clearFlag(4);
                                if (!negative) {

                                    let low = currentValue & 0xF;

                                    if (low > 0x9 || halfcarry) {
                                        currentValue += 0x06;
                                    }

                                    let high = currentValue >> 4;

                                    if (high > 0x9 || carry) {
                                        currentValue = this.registers.sum(currentValue, 0x60);
                                        this.registers.setFlag(4);
                                    }
                                }
                                else {
                                    if (carry) {
                                        currentValue = this.registers.difference(currentValue, 0x60);
                                        this.registers.setFlag(4);
                                    }

                                    if (halfcarry) {
                                        currentValue = this.registers.difference(currentValue, 0x06);
                                    }
                                }
                                this.registers.setRegister(registerID.A, currentValue);

                                this.registers.clearFlag(5);
                                this.registers.assignZero(this.registers.getRegister(registerID.A));
                                break;
                            }

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
                                let tempHLLocation = this.registers.getRegisterDouble(registerID.H, registerID.L);
                                this.registers.setRegister(registerID.HL, this.memoryController.readMemory(tempHLLocation));
                                let value = this.registers.getRegister(registerID.HL);
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
                        case 0xF:
                            this.registers.setRegister(registerID.A, (this.registers.getRegister(registerID.A) ^ 0xFF));
                            this.registers.setFlag(6);
                            this.registers.setFlag(5);
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
                            this.stackPointer = ((high << 8) | low);
                            this.tickClock(12)
                            break;
                        case 0x2:
                            {
                                let tempHLLocation = this.registers.getRegisterDouble(registerID.H, registerID.L);
                                this.registers.setRegister(registerID.HL, this.memoryController.readMemory(tempHLLocation));
                                let value = this.registers.getRegister(registerID.A);
                                this.registers.setRegister(registerID.HL, value);
                                this.memoryController.writeMemory(tempHLLocation, this.registers.getRegister(registerID.HL));
                                this.registers.decRegisterDouble(registerID.H, registerID.L);
                                this.tickClock(8);
                                break;
                            }
                        case 0x3:
                            this.stackPointer = this.registers.sumDouble(this.stackPointer, 1);
                            this.tickClock(8);
                            break;
                        case 0x4:
                            {
                                let tempHLLocation = this.registers.getRegisterDouble(registerID.H, registerID.L);
                                this.registers.setRegister(registerID.HL, this.memoryController.readMemory(tempHLLocation));
                                this.registers.incRegister(registerID.HL);
                                this.memoryController.writeMemory(tempHLLocation, this.registers.getRegister(registerID.HL));
                                this.tickClock(12);
                                break;
                            }
                        case 0x5:
                            {
                                let tempHLLocation = this.registers.getRegisterDouble(registerID.H, registerID.L);
                                this.registers.setRegister(registerID.HL, this.memoryController.readMemory(tempHLLocation));
                                this.registers.decRegister(registerID.HL);
                                this.memoryController.writeMemory(tempHLLocation, this.registers.getRegister(registerID.HL));
                                this.tickClock(12);
                                break;
                            }
                        case 0x6:
                            {
                                let tempHLLocation = this.registers.getRegisterDouble(registerID.H, registerID.L);
                                this.registers.setRegister(registerID.HL, this.fetch());
                                this.memoryController.writeMemory(tempHLLocation, this.registers.getRegister(registerID.HL));
                                this.tickClock(12);
                                break;
                            }
                        case 0x7:
                            this.registers.clearFlag(6);
                            this.registers.clearFlag(5);
                            this.registers.setFlag(4);
                            this.tickClock(4);
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
                                let tempHLLocation = this.registers.getRegisterDouble(registerID.H, registerID.L);
                                this.registers.setRegister(registerID.HL, this.memoryController.readMemory(tempHLLocation));
                                let value = this.registers.getRegister(registerID.HL);
                                this.registers.decRegisterDouble(registerID.H, registerID.L);
                                this.registers.setRegister(registerID.A, value);
                                this.tickClock(8);
                                break;
                            }
                        case 0xB:
                            this.stackPointer = this.registers.differenceDouble(this.stackPointer, 1);
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
                        case 0xF:
                            let carry = this.registers.getFlag(4);
                            if (carry ^ 1) {
                                this.registers.setFlag(4);
                            }
                            else {
                                this.registers.clearFlag(4);
                            }
                            this.registers.clearFlag(6);
                            this.registers.clearFlag(5);
                            this.tickClock(4);
                            break;
                    }
                    break;
                case 0x4:
                    if (low == 0x6) {
                        let tempHLLocation = this.registers.getRegisterDouble(registerID.H, registerID.L);
                        this.registers.setRegister(registerID.HL, this.memoryController.readMemory(tempHLLocation));
                        this.ldXY(registerID.B, low);

                    }
                    else if (low == 0xE) {
                        let tempHLLocation = this.registers.getRegisterDouble(registerID.H, registerID.L);
                        this.registers.setRegister(registerID.HL, this.memoryController.readMemory(tempHLLocation));
                        this.ldXY(registerID.C, low - 8);
                    }
                    else if (low < 8) {
                        this.ldXY(registerID.B, low);
                    }
                    else {
                        this.ldXY(registerID.C, low - 8);
                    }
                    break;
                case 0x5:
                    if (low == 0x6) {
                        let tempHLLocation = this.registers.getRegisterDouble(registerID.H, registerID.L);
                        this.registers.setRegister(registerID.HL, this.memoryController.readMemory(tempHLLocation));
                        this.ldXY(registerID.D, low);
                    }
                    else if (low == 0xE) {
                        let tempHLLocation = this.registers.getRegisterDouble(registerID.H, registerID.L);
                        this.registers.setRegister(registerID.HL, this.memoryController.readMemory(tempHLLocation));
                        this.ldXY(registerID.E, low - 8);
                    }
                    else if (low < 8) {
                        this.ldXY(registerID.D, low);
                    }
                    else {
                        this.ldXY(registerID.E, low - 8);
                    }
                    break;
                case 0x6:
                    if (low == 0x6) {
                        let tempHLLocation = this.registers.getRegisterDouble(registerID.H, registerID.L);
                        this.registers.setRegister(registerID.HL, this.memoryController.readMemory(tempHLLocation));
                        this.ldXY(registerID.H, low);
                    }
                    else if (low == 0xE) {
                        let tempHLLocation = this.registers.getRegisterDouble(registerID.H, registerID.L);
                        this.registers.setRegister(registerID.HL, this.memoryController.readMemory(tempHLLocation));
                        this.ldXY(registerID.L, low - 8);
                    }
                    else if (low < 8) {
                        this.ldXY(registerID.H, low);
                    }
                    else {
                        this.ldXY(registerID.L, low - 8);
                    }
                    break;
                case 0x7:
                    if (low == 0x6) {
                        //This is the Halt Bug. Causes the next instruction to repeat.
                        if(this.ime == 0 && (this.memoryController.readMemory(0xFFFF) & this.memoryController.readMemory(0xFF0F)) != 0){
                            this.tickClock(4);
                            let nextPC = this.programCounter;

                            this.currentOpcode = this.decode();
                            this.execute(this.currentOpcode);

                            this.programCounter = nextPC;
                        }
                        else{
                            this.halt = true;
                        }

                        //This is true Halt Behavior. 
                        while(this.halt){
                            if((this.memoryController.readMemory(0xFFFF) & this.memoryController.readMemory(0xFF0F)) != 0){
                                this.halt = false;
                            }
                            this.tickClock(4);
                        }
                    }
                    else if (low == 0xE) {
                        let tempHLLocation = this.registers.getRegisterDouble(registerID.H, registerID.L);
                        this.registers.setRegister(registerID.HL, this.memoryController.readMemory(tempHLLocation));
                        this.ldXY(registerID.A, low - 8);
                    }
                    else if (low < 8) {
                        let tempHLLocation = this.registers.getRegisterDouble(registerID.H, registerID.L);
                        this.registers.setRegister(registerID.HL, this.memoryController.readMemory(tempHLLocation));
                        this.registers.setRegister(registerID.HL, this.registers.getRegister(low));
                        this.memoryController.writeMemory(tempHLLocation, this.registers.getRegister(registerID.HL));
                        this.tickClock(8);
                    }
                    else {
                        this.ldXY(registerID.A, low - 8);
                    }
                    break;
                case 0x8:
                    if (low == 0x6) {
                        let tempHLLocation = this.registers.getRegisterDouble(registerID.H, registerID.L);
                        this.registers.setRegister(registerID.HL, this.memoryController.readMemory(tempHLLocation));
                        this.registers.addA(this.registers.getRegister(low));
                        this.tickClock(8);
                    }
                    else if (low == 0xE) {
                        let tempHLLocation = this.registers.getRegisterDouble(registerID.H, registerID.L);
                        this.registers.setRegister(registerID.HL, this.memoryController.readMemory(tempHLLocation));
                        this.registers.adcA(this.registers.getRegister(low - 8));
                        this.tickClock(8);
                    }
                    else if (low < 8) {
                        this.registers.addA(this.registers.getRegister(low));
                        this.tickClock(4);
                    }
                    else {
                        this.registers.adcA(this.registers.getRegister(low - 8));
                        this.tickClock(4);
                    }
                    break;
                case 0x9:
                    if (low == 0x6) {
                        let tempHLLocation = this.registers.getRegisterDouble(registerID.H, registerID.L);
                        this.registers.setRegister(registerID.HL, this.memoryController.readMemory(tempHLLocation));
                        this.registers.subA(this.registers.getRegister(low));
                        this.tickClock(8);
                    }
                    else if (low == 0xE) {
                        let tempHLLocation = this.registers.getRegisterDouble(registerID.H, registerID.L);
                        this.registers.setRegister(registerID.HL, this.memoryController.readMemory(tempHLLocation));
                        this.registers.sbcA(this.registers.getRegister(low - 8));
                        this.tickClock(8);
                    }
                    else if (low < 8) {
                        this.registers.subA(this.registers.getRegister(low));
                        this.tickClock(4);
                    }
                    else {
                        this.registers.sbcA(this.registers.getRegister(low - 8));
                        this.tickClock(4);
                    }
                    break;
                case 0xA:
                    if (low == 0x6) {
                        let tempHLLocation = this.registers.getRegisterDouble(registerID.H, registerID.L);
                        this.registers.setRegister(registerID.HL, this.memoryController.readMemory(tempHLLocation));
                        this.registers.andA(this.registers.getRegister(low));
                        this.tickClock(8);
                    }
                    else if (low == 0xE) {
                        let tempHLLocation = this.registers.getRegisterDouble(registerID.H, registerID.L);
                        this.registers.setRegister(registerID.HL, this.memoryController.readMemory(tempHLLocation));
                        this.registers.xorA(this.registers.getRegister(low - 8));
                        this.tickClock(8);
                    }
                    else if (low < 8) {
                        this.registers.andA(this.registers.getRegister(low));
                        this.tickClock(4);
                    }
                    else {
                        this.registers.xorA(this.registers.getRegister(low - 8));
                        this.tickClock(4);
                    }
                    break;
                case 0xB:
                    if (low == 0x6) {
                        let tempHLLocation = this.registers.getRegisterDouble(registerID.H, registerID.L);
                        this.registers.setRegister(registerID.HL, this.memoryController.readMemory(tempHLLocation));
                        this.registers.orA(this.registers.getRegister(low));
                        this.tickClock(8);
                    }
                    else if (low == 0xE) {
                        let tempHLLocation = this.registers.getRegisterDouble(registerID.H, registerID.L);
                        this.registers.setRegister(registerID.HL, this.memoryController.readMemory(tempHLLocation));
                        this.registers.cpA(this.registers.getRegister(low - 8));
                        this.tickClock(8);
                    }
                    else if (low < 8) {
                        this.registers.orA(this.registers.getRegister(low));
                        this.tickClock(4);
                    }
                    else {
                        this.registers.cpA(this.registers.getRegister(low - 8));
                        this.tickClock(4);
                    }
                    break;
                case 0xC:
                    switch (low) {
                        case 0x0:
                            this.returnConditional(!this.registers.getFlag(7));
                            break;
                        case 0x1:
                            this.pop(registerID.B, registerID.C);
                            break;
                        case 0x2:
                            this.jumpConditional(!this.registers.getFlag(7));
                            break;
                        case 0x3:
                            this.jumpConditional(true);
                            break;
                        case 0x4:
                            this.callConditional(!this.registers.getFlag(7));
                            break;
                        case 0x5:
                            this.push(registerID.B, registerID.C);
                            break;
                        case 0x6:
                            this.registers.addA(this.fetch());
                            this.tickClock(8);
                            break;
                        case 0x7:
                            this.rst(0x00);
                            break;
                        case 0x8:
                            this.returnConditional(this.registers.getFlag(7));
                            break;
                        case 0x9:
                            let low = this.memoryController.readMemory(this.stackPointer);
                            this.stackPointer = this.registers.sumDouble(this.stackPointer, 1);
                            let high = this.memoryController.readMemory(this.stackPointer);
                            this.stackPointer = this.registers.sumDouble(this.stackPointer, 1);
                            this.programCounter = (high << 8) | low;
                            this.tickClock(16);
                            break;
                        case 0xA:
                            this.jumpConditional(this.registers.getFlag(7));
                            break;
                        case 0xC:
                            this.callConditional(this.registers.getFlag(7));
                            break;
                        case 0xD:
                            this.callConditional(true);
                            break;
                        case 0xE:
                            this.registers.adcA(this.fetch());
                            this.tickClock(8);
                            break;
                        case 0xF:
                            this.rst(0x08);
                            break;
                    }
                    break;
                case 0xD:
                    switch (low) {
                        case 0x0:
                            this.returnConditional(!this.registers.getFlag(4));
                            break;
                        case 0x1:
                            this.pop(registerID.D, registerID.E);
                            break;
                        case 0x2:
                            this.jumpConditional(!this.registers.getFlag(4));
                            break;
                        case 0x4:
                            this.callConditional(!this.registers.getFlag(4));
                            break;
                        case 0x5:
                            this.push(registerID.D, registerID.E);
                            break;
                        case 0x6:
                            this.registers.subA(this.fetch());
                            this.tickClock(8);
                            break;
                        case 0x7:
                            this.rst(0x10);
                            break;
                        case 0x8:
                            this.returnConditional(this.registers.getFlag(4));
                            break;
                        case 0x9:
                            {
                                let low = this.memoryController.readMemory(this.stackPointer);
                                this.stackPointer = this.registers.sumDouble(this.stackPointer, 1);
                                let high = this.memoryController.readMemory(this.stackPointer);
                                this.stackPointer = this.registers.sumDouble(this.stackPointer, 1);
                                this.programCounter = (high << 8) | low;
                                this.memoryController.writeMemory(0xFFFF, 1);
                                this.tickClock(16);
                                break;
                            }
                        case 0xA:
                            this.jumpConditional(this.registers.getFlag(4));
                            break;
                        case 0xC:
                            this.callConditional(this.registers.getFlag(4));
                            break;
                        case 0xE:
                            this.registers.sbcA(this.fetch());
                            this.tickClock(8);
                            break;
                        case 0xF:
                            this.rst(0x18);
                            break;
                    }
                    break;
                case 0xE:
                    switch (low) {
                        case 0x0:
                            this.memoryController.writeMemory((0xFF00 + this.fetch()), this.registers.getRegister(registerID.A));
                            this.tickClock(12);
                            break;
                        case 0x1:
                            this.pop(registerID.H, registerID.L);
                            break;
                        case 0x2:
                            this.memoryController.writeMemory((0xFF00 + this.registers.getRegister(registerID.C)), this.registers.getRegister(registerID.A));
                            this.tickClock(12);
                            break;
                        case 0x5:
                            this.push(registerID.H, registerID.L);
                            break;
                        case 0x6:
                            this.registers.andA(this.fetch());
                            this.tickClock(8);
                            break;
                        case 0x7:
                            this.rst(0x20);
                            break;
                        case 0x8:
                            {
                                let value = this.fetch();
                                let signedValue = twosComplement(value);
                                let oldStack = this.stackPointer
                                if (signedValue > 0) {
                                    this.stackPointer = this.registers.sumDouble(oldStack, signedValue);
                                }
                                else {
                                    this.stackPointer = this.registers.differenceDouble(oldStack, signedValue * -1);
                                }
                                this.registers.assignHalfcarryAdd(oldStack & 0xFF, value);
                                this.registers.assignCarry(oldStack & 0xFF, value);
                                this.registers.clearFlag(7);
                                this.registers.clearFlag(6);
                                this.tickClock(16);
                                break;
                            }
                        case 0x9:
                            this.programCounter = this.registers.getRegisterDouble(registerID.H, registerID.L);
                            this.tickClock(4);
                            break;
                        case 0xA:
                            {
                                let low = this.fetch();
                                let high = this.fetch()
                                this.memoryController.writeMemory(((high << 8) | low), this.registers.getRegister(registerID.A));
                                this.tickClock(16);
                                break;
                            }
                        case 0xE:
                            this.registers.xorA(this.fetch());
                            this.tickClock(8);
                            break;
                        case 0xF:
                            this.rst(0x28);
                            break;
                    }
                    break;
                case 0xF:
                    switch (low) {
                        case 0x0:
                            this.registers.setRegister(registerID.A, this.memoryController.readMemory(0xFF00 + this.fetch()));
                            this.tickClock(12);
                            break;
                        case 0x1:
                            this.pop(registerID.A, registerID.F);
                            break;
                        case 0x2:
                            this.registers.setRegister(registerID.A, this.memoryController.readMemory(0xFF00 + this.registers.getRegister(registerID.C)));
                            this.tickClock(8);
                            break;
                        case 0x3:
                            this.ime = 0;
                            break;
                        case 0x5:
                            this.push(registerID.A, registerID.F);
                            this.tickClock(4);
                            break;
                        case 0x6:
                            this.registers.orA(this.fetch());
                            this.tickClock(8);
                            break;
                        case 0x7:
                            this.rst(0x30);
                            break;
                        case 0x8:
                            {
                                let value = this.fetch();
                                let signedValue = twosComplement(value);
                                let newValue = 0;
                                if (signedValue > 0) {
                                    newValue = this.registers.sumDouble(this.stackPointer, signedValue)
                                }
                                else {
                                    newValue = this.registers.differenceDouble(this.stackPointer, signedValue * -1)
                                }
                                this.registers.setRegisterDouble(registerID.H, registerID.L, newValue >> 8, newValue & 0xFF);
                                this.registers.assignHalfcarryAdd(this.stackPointer & 0xFF, value);
                                this.registers.assignCarry(this.stackPointer & 0xFF, value);
                                this.registers.clearFlag(7);
                                this.registers.clearFlag(6);
                                this.tickClock(16);
                                break;
                            }

                        case 0x9:
                            this.stackPointer = this.registers.getRegisterDouble(registerID.H, registerID.L);
                            this.tickClock(8);
                            break;
                        case 0xA:
                            {
                                let low = this.fetch();
                                let high = this.fetch();
                                let value = this.memoryController.readMemory((high << 8) | low);
                                this.registers.setRegister(registerID.A, value);
                                this.tickClock(16);
                                break;
                            }
                        case 0xB:
                            this.ime = 1;
                            break;
                        case 0xE:
                            this.registers.cpA(this.fetch());
                            this.tickClock(8);
                            break;
                        case 0xF:
                            this.rst(0x38);
                            break;
                    }
                    break;
            }
        }
        else {
            [high, low] = this.decode();
            switch (high) {
                case 0x0:
                    if (low == 0x6) {
                        let tempHLLocation = this.registers.getRegisterDouble(registerID.H, registerID.L);
                        this.registers.setRegister(registerID.HL, this.memoryController.readMemory(tempHLLocation));
                        this.registers.rotateLeftCircular(low);
                        this.memoryController.writeMemory(tempHLLocation, this.registers.getRegister(registerID.HL));
                        this.tickClock(16);
                    }
                    else if (low == 0xE) {
                        let tempHLLocation = this.registers.getRegisterDouble(registerID.H, registerID.L);
                        this.registers.setRegister(registerID.HL, this.memoryController.readMemory(tempHLLocation));
                        this.registers.rotateRightCircular(low - 8);
                        this.memoryController.writeMemory(tempHLLocation, this.registers.getRegister(registerID.HL));
                        this.tickClock(16);
                    }
                    else if (low < 8) {
                        this.registers.rotateLeftCircular(low);
                        this.tickClock(8);

                    }
                    else {
                        this.registers.rotateRightCircular(low - 8);
                        this.tickClock(8);
                    }
                    break
                case 0x1:
                    if (low == 0x6) {
                        let tempHLLocation = this.registers.getRegisterDouble(registerID.H, registerID.L);
                        this.registers.setRegister(registerID.HL, this.memoryController.readMemory(tempHLLocation));
                        this.registers.rotateLeft(low);
                        this.memoryController.writeMemory(tempHLLocation, this.registers.getRegister(registerID.HL));
                        this.tickClock(16);
                    }
                    else if (low == 0xE) {
                        let tempHLLocation = this.registers.getRegisterDouble(registerID.H, registerID.L);
                        this.registers.setRegister(registerID.HL, this.memoryController.readMemory(tempHLLocation));
                        this.registers.rotateRight(low - 8);
                        this.memoryController.writeMemory(tempHLLocation, this.registers.getRegister(registerID.HL));
                        this.tickClock(16);
                    }
                    else if (low < 8) {
                        this.registers.rotateLeft(low);
                        this.tickClock(8);
                    }
                    else {
                        this.registers.rotateRight(low - 8);
                        this.tickClock(8);
                    }
                    break;
                case 0x2:
                    if (low == 0x6) {
                        let tempHLLocation = this.registers.getRegisterDouble(registerID.H, registerID.L);
                        this.registers.setRegister(registerID.HL, this.memoryController.readMemory(tempHLLocation));
                        this.registers.SLA(low);
                        this.memoryController.writeMemory(tempHLLocation, this.registers.getRegister(registerID.HL));
                        this.tickClock(16);
                    }
                    else if (low == 0xE) {
                        let tempHLLocation = this.registers.getRegisterDouble(registerID.H, registerID.L);
                        this.registers.setRegister(registerID.HL, this.memoryController.readMemory(tempHLLocation));
                        this.registers.SRA(low - 8);
                        this.memoryController.writeMemory(tempHLLocation, this.registers.getRegister(registerID.HL));
                        this.tickClock(16);
                    }
                    else if (low < 8) {
                        this.registers.SLA(low);
                        this.tickClock(8);
                    }
                    else {
                        this.registers.SRA(low - 8);
                        this.tickClock(8);
                    }
                    break;
                case 0x3:
                    if (low == 0x6) {
                        let tempHLLocation = this.registers.getRegisterDouble(registerID.H, registerID.L);
                        this.registers.setRegister(registerID.HL, this.memoryController.readMemory(tempHLLocation));
                        this.registers.swap(low);
                        this.memoryController.writeMemory(tempHLLocation, this.registers.getRegister(registerID.HL));
                        this.tickClock(16);
                    }
                    else if (low == 0xE) {
                        let tempHLLocation = this.registers.getRegisterDouble(registerID.H, registerID.L);
                        this.registers.setRegister(registerID.HL, this.memoryController.readMemory(tempHLLocation));
                        this.registers.SRL(low - 8);
                        this.memoryController.writeMemory(tempHLLocation, this.registers.getRegister(registerID.HL));
                        this.tickClock(16);
                    }
                    else if (low < 8) {
                        this.registers.swap(low);
                        this.tickClock(8);

                    }
                    else {
                        this.registers.SRL(low - 8);
                        this.tickClock(8);
                    }
                    break;
                case 0x4:
                    if (low == 0x6) {
                        let tempHLLocation = this.registers.getRegisterDouble(registerID.H, registerID.L);
                        this.registers.setRegister(registerID.HL, this.memoryController.readMemory(tempHLLocation));
                        this.bit(0, low);
                    }
                    else if (low == 0xE) {
                        let tempHLLocation = this.registers.getRegisterDouble(registerID.H, registerID.L);
                        this.registers.setRegister(registerID.HL, this.memoryController.readMemory(tempHLLocation));
                        this.bit(1, low - 8);
                    }
                    else if (low < 8) {
                        this.bit(0, low);
                    }
                    else {
                        this.bit(1, low - 8);
                    }
                    break;
                case 0x5:
                    if (low == 0x6) {
                        let tempHLLocation = this.registers.getRegisterDouble(registerID.H, registerID.L);
                        this.registers.setRegister(registerID.HL, this.memoryController.readMemory(tempHLLocation));
                        this.bit(2, low);
                    }
                    else if (low == 0xE) {
                        let tempHLLocation = this.registers.getRegisterDouble(registerID.H, registerID.L);
                        this.registers.setRegister(registerID.HL, this.memoryController.readMemory(tempHLLocation));
                        this.bit(3, low - 8);
                    }
                    else if (low < 8) {
                        this.bit(2, low);
                    }
                    else {
                        this.bit(3, low - 8);
                    }
                    break;
                case 0x6:
                    if (low == 0x6) {
                        let tempHLLocation = this.registers.getRegisterDouble(registerID.H, registerID.L);
                        this.registers.setRegister(registerID.HL, this.memoryController.readMemory(tempHLLocation));
                        this.bit(4, low);
                    }
                    else if (low == 0xE) {
                        let tempHLLocation = this.registers.getRegisterDouble(registerID.H, registerID.L);
                        this.registers.setRegister(registerID.HL, this.memoryController.readMemory(tempHLLocation));
                        this.bit(5, low - 8);
                    }
                    else if (low < 8) {
                        this.bit(4, low);
                    }
                    else {
                        this.bit(5, low - 8);
                    }
                    break;
                case 0x7:
                    if (low == 0x6) {
                        let tempHLLocation = this.registers.getRegisterDouble(registerID.H, registerID.L);
                        this.registers.setRegister(registerID.HL, this.memoryController.readMemory(tempHLLocation));
                        this.bit(6, low);
                    }
                    else if (low == 0xE) {
                        let tempHLLocation = this.registers.getRegisterDouble(registerID.H, registerID.L);
                        this.registers.setRegister(registerID.HL, this.memoryController.readMemory(tempHLLocation));
                        this.bit(7, low - 8);
                    }
                    else if (low < 8) {
                        this.bit(6, low);
                    }
                    else {
                        this.bit(7, low - 8);
                    }
                    break;
                case 0x8:
                    if (low == 0x6) {
                        let tempHLLocation = this.registers.getRegisterDouble(registerID.H, registerID.L);
                        this.registers.setRegister(registerID.HL, this.memoryController.readMemory(tempHLLocation));
                        this.res(0, low);
                        this.memoryController.writeMemory(tempHLLocation, this.registers.getRegister(registerID.HL));
                    }
                    else if (low == 0xE) {
                        let tempHLLocation = this.registers.getRegisterDouble(registerID.H, registerID.L);
                        this.registers.setRegister(registerID.HL, this.memoryController.readMemory(tempHLLocation));
                        this.res(1, low - 8);
                        this.memoryController.writeMemory(tempHLLocation, this.registers.getRegister(registerID.HL));
                    }
                    else if (low < 8) {
                        this.res(0, low);
                    }
                    else {
                        this.res(1, low - 8);
                    }
                    break;
                case 0x9:
                    if (low == 0x6) {
                        let tempHLLocation = this.registers.getRegisterDouble(registerID.H, registerID.L);
                        this.registers.setRegister(registerID.HL, this.memoryController.readMemory(tempHLLocation));
                        this.res(2, low);
                        this.memoryController.writeMemory(tempHLLocation, this.registers.getRegister(registerID.HL));
                    }
                    else if (low == 0xE) {
                        let tempHLLocation = this.registers.getRegisterDouble(registerID.H, registerID.L);
                        this.registers.setRegister(registerID.HL, this.memoryController.readMemory(tempHLLocation));
                        this.res(3, low - 8);
                        this.memoryController.writeMemory(tempHLLocation, this.registers.getRegister(registerID.HL));
                    }
                    else if (low < 8) {
                        this.res(2, low);
                    }
                    else {
                        this.res(3, low - 8);
                    }
                    break;
                case 0xA:
                    if (low == 0x6) {
                        let tempHLLocation = this.registers.getRegisterDouble(registerID.H, registerID.L);
                        this.registers.setRegister(registerID.HL, this.memoryController.readMemory(tempHLLocation));
                        this.res(4, low);
                        this.memoryController.writeMemory(tempHLLocation, this.registers.getRegister(registerID.HL));
                    }
                    else if (low == 0xE) {
                        let tempHLLocation = this.registers.getRegisterDouble(registerID.H, registerID.L);
                        this.registers.setRegister(registerID.HL, this.memoryController.readMemory(tempHLLocation));
                        this.res(5, low - 8);
                        this.memoryController.writeMemory(tempHLLocation, this.registers.getRegister(registerID.HL));
                    }
                    else if (low < 8) {
                        this.res(4, low);
                    }
                    else {
                        this.res(5, low - 8);
                    }
                    break;
                case 0xB:
                    if (low == 0x6) {
                        let tempHLLocation = this.registers.getRegisterDouble(registerID.H, registerID.L);
                        this.registers.setRegister(registerID.HL, this.memoryController.readMemory(tempHLLocation));
                        this.res(6, low);
                        this.memoryController.writeMemory(tempHLLocation, this.registers.getRegister(registerID.HL));
                    }
                    else if (low == 0xE) {
                        let tempHLLocation = this.registers.getRegisterDouble(registerID.H, registerID.L);
                        this.registers.setRegister(registerID.HL, this.memoryController.readMemory(tempHLLocation));
                        this.res(7, low - 8);
                        this.memoryController.writeMemory(tempHLLocation, this.registers.getRegister(registerID.HL));
                    }
                    else if (low < 8) {
                        this.res(6, low);
                    }
                    else {
                        this.res(7, low - 8);
                    }
                    break;
                case 0xC:
                    if (low == 0x6) {
                        let tempHLLocation = this.registers.getRegisterDouble(registerID.H, registerID.L);
                        this.registers.setRegister(registerID.HL, this.memoryController.readMemory(tempHLLocation));
                        this.set(0, low);
                        this.memoryController.writeMemory(tempHLLocation, this.registers.getRegister(registerID.HL));
                    }
                    else if (low == 0xE) {
                        let tempHLLocation = this.registers.getRegisterDouble(registerID.H, registerID.L);
                        this.registers.setRegister(registerID.HL, this.memoryController.readMemory(tempHLLocation));
                        this.set(1, low - 8);
                        this.memoryController.writeMemory(tempHLLocation, this.registers.getRegister(registerID.HL));
                    }
                    else if (low < 8) {
                        this.set(0, low);
                    }
                    else {
                        this.set(1, low - 8);
                    }
                    break;
                case 0xD:
                    if (low == 0x6) {
                        let tempHLLocation = this.registers.getRegisterDouble(registerID.H, registerID.L);
                        this.registers.setRegister(registerID.HL, this.memoryController.readMemory(tempHLLocation));
                        this.set(2, low);
                        this.memoryController.writeMemory(tempHLLocation, this.registers.getRegister(registerID.HL));
                    }
                    else if (low == 0xE) {
                        let tempHLLocation = this.registers.getRegisterDouble(registerID.H, registerID.L);
                        this.registers.setRegister(registerID.HL, this.memoryController.readMemory(tempHLLocation));
                        this.set(3, low - 8);
                        this.memoryController.writeMemory(tempHLLocation, this.registers.getRegister(registerID.HL));
                    }
                    else if (low < 8) {
                        this.set(2, low);
                    }
                    else {
                        this.set(3, low - 8);
                    }
                    break;
                case 0xE:
                    if (low == 0x6) {
                        let tempHLLocation = this.registers.getRegisterDouble(registerID.H, registerID.L);
                        this.registers.setRegister(registerID.HL, this.memoryController.readMemory(tempHLLocation));
                        this.set(4, low);
                        this.memoryController.writeMemory(tempHLLocation, this.registers.getRegister(registerID.HL));
                    }
                    else if (low == 0xE) {
                        let tempHLLocation = this.registers.getRegisterDouble(registerID.H, registerID.L);
                        this.registers.setRegister(registerID.HL, this.memoryController.readMemory(tempHLLocation));
                        this.set(5, low - 8);
                        this.memoryController.writeMemory(tempHLLocation, this.registers.getRegister(registerID.HL));
                    }
                    else if (low < 8) {
                        this.set(4, low);
                    }
                    else {
                        this.set(5, low - 8);
                    }
                    break;
                case 0xF:
                    if (low == 0x6) {
                        let tempHLLocation = this.registers.getRegisterDouble(registerID.H, registerID.L);
                        this.registers.setRegister(registerID.HL, this.memoryController.readMemory(tempHLLocation));
                        this.set(6, low);
                        this.memoryController.writeMemory(tempHLLocation, this.registers.getRegister(registerID.HL));
                    }
                    else if (low == 0xE) {
                        let tempHLLocation = this.registers.getRegisterDouble(registerID.H, registerID.L);
                        this.registers.setRegister(registerID.HL, this.memoryController.readMemory(tempHLLocation));
                        this.set(7, low - 8);
                        this.memoryController.writeMemory(tempHLLocation, this.registers.getRegister(registerID.HL));
                    }
                    else if (low < 8) {
                        this.set(6, low);
                    }
                    else {
                        this.set(7, low - 8);
                    }
                    break;
            }
        }
    }

    tickClock(cycles) {
        for (let i = 0; i < cycles; i++) {
            if(i % 2 == 1){
                this.ppu.cycle();
            }

            //DIV Timer
            this.sysClock = this.registers.sumDouble(this.sysClock, 1);
            let upperSysClock = this.sysClock >> 8;
            if (this.memoryController.memory.io.getData(0x4) != upperSysClock) {
                this.memoryController.memory.io.setData(0x4, upperSysClock);

                //TIMA Timer
                let bit = 0;
                switch (this.memoryController.memory.io.getData(0x7) & 0x3) { //determines the bit to check against in DIV
                    case 0:
                        bit = 9;
                        break;
                    case 1:
                        bit = 3;
                        break;
                    case 2:
                        bit = 5;
                        break;
                    case 3:
                        bit = 7;
                        break;
                }
                let timerEnable = (this.memoryController.memory.io.getData(0x7) & 0x4) >> 2;
                let andResultPrevious = ((this.registers.differenceDouble(this.sysClock, 1) >> bit) & 1) & timerEnable;
                let andResult = ((this.sysClock >> bit) & 1) & timerEnable;
                let TIMA = 0;
                if (andResultPrevious == 1 && andResult == 0) {
                    TIMA = this.memoryController.memory.io.getData(0x5);
                    TIMA++;
                    if (TIMA > 0xFF) {//if TIMA overflows past 0xFF, request TIMA Interrupt and reset value to TIMA Modulo (0xFF07)
                        this.memoryController.memory.io.setData(0x5, this.memoryController.memory.io.getData(0x6));
                        this.memoryController.memory.io.setData(0xF, this.memoryController.memory.io.getData(0xF) | (1 << 2)); //Request Interrupt
                    }
                    else {
                        this.memoryController.memory.io.setData(0x5, TIMA);
                    }
                }

            }



        }
    }

    jumpConditional(condition) {
        let low = this.fetch();
        let high = this.fetch();
        if (condition) {
            this.programCounter = (high << 8) | low;
            this.tickClock(16);
        }
        else {
            this.tickClock(12);
        }
    }

    jumpRelativeConditional(condition) {
        let location = this.fetch();
        if (condition) {
            this.programCounter += twosComplement(location);
            this.tickClock(12);
        }
        else {
            this.tickClock(8);
        }
    }

    callConditional(condition) {
        let low = this.fetch();
        let high = this.fetch();
        if (condition) {
            this.stackPointer = this.registers.differenceDouble(this.stackPointer, 1);
            this.memoryController.writeMemory(this.stackPointer, (this.programCounter >> 8));
            this.stackPointer = this.registers.differenceDouble(this.stackPointer, 1);
            this.memoryController.writeMemory(this.stackPointer, (this.programCounter & 0xff));
            this.programCounter = (high << 8) | low;
            this.tickClock(24);
        }
        else {
            this.tickClock(12);
        }
    }

    returnConditional(condition) {
        if (condition) {
            let low = this.memoryController.readMemory(this.stackPointer);
            this.stackPointer = this.registers.sumDouble(this.stackPointer, 1);
            let high = this.memoryController.readMemory(this.stackPointer);
            this.stackPointer = this.registers.sumDouble(this.stackPointer, 1);
            this.programCounter = (high << 8) | low;
            this.tickClock(20);
        }
        else {
            this.tickClock(8);
        }
    }

    rst(location) {
        // this.stackPointer = this.registers.differenceDouble(this.stackPointer, 2);
        // this.memory.writeMemory(this.stackPointer, this.programCounter);
        // this.programCounter = location;

        this.stackPointer = this.registers.differenceDouble(this.stackPointer, 1);
        this.memoryController.writeMemory(this.stackPointer, (this.programCounter >> 8));
        this.stackPointer = this.registers.differenceDouble(this.stackPointer, 1);
        this.memoryController.writeMemory(this.stackPointer, (this.programCounter & 0xff));
        this.programCounter = location;
        this.tickClock(16);
    }

    push(register1, register2) {
        let high = this.registers.getRegister(register1);
        this.stackPointer = this.registers.differenceDouble(this.stackPointer, 1);
        this.memoryController.writeMemory(this.stackPointer, high)
        let low = this.registers.getRegister(register2);
        this.stackPointer = this.registers.differenceDouble(this.stackPointer, 1);
        this.memoryController.writeMemory(this.stackPointer, low)
        this.tickClock(16);
    }

    pop(register1, register2) {
        let low = this.memoryController.readMemory(this.stackPointer);
        this.stackPointer = this.registers.sumDouble(this.stackPointer, 1);
        let high = this.memoryController.readMemory(this.stackPointer);
        if (register2 == registerID.F) {
            low = low & 0xF0;
        }
        this.stackPointer = this.registers.sumDouble(this.stackPointer, 1);
        this.registers.setRegisterDouble(register1, register2, high, low);
        this.tickClock(12);
    }

    ldXY(registerX, registerY) {
        this.registers.setRegister(registerX, this.registers.getRegister(registerY));
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
        if (register == 0x6) {
            this.tickClock(12);
        }
        else {
            this.tickClock(8);
        }
    }

    res(bit, register) {
        let registerValue = this.registers.getRegister(register);
        registerValue &= ~(1 << bit);
        this.registers.setRegister(register, registerValue);
        if (register == 0x6) {
            this.tickClock(16);
        }
        else {
            this.tickClock(8);
        }
    }
    set(bit, register) {
        let registerValue = this.registers.getRegister(register);
        registerValue |= (1 << bit);
        this.registers.setRegister(register, registerValue);
        if (register == 0x6) {
            this.tickClock(16);
        }
        else {
            this.tickClock(8);
        }
    }
}

