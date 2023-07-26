import { RegisterCollection } from "./registercollection.js"
import { Memory } from "./memory.js";
import { twosComplement } from "./utility.js";
import { Gpu } from "./gpu.js";
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
        this.opcodeTicks = 0;
        this.memory = null;
        this.programCounter = 0x0100;
        this.stackPointer = 0xFFFE;
        this.gpu = new Gpu(this.memory);
        this.frameReady = false;
        this.debug = null;
        this.sysClock = 0xAB00;
    }

    setMemory(memory) {
        this.memory = memory;
    }

    setDebug(debug) {
        this.debug = debug;
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

    interrupt() {
        if (this.memory.readMemory(0xFFFF)) {
            if (this.memory.readMemory(0xFFFF) & 1 && this.memory.readMemory(0xFF0F) & 1) {
                this.stackPointer = this.registers.differenceDouble(this.stackPointer, 1);
                this.memory.writeMemory(this.stackPointer, (this.programCounter >> 8));
                this.stackPointer = this.registers.differenceDouble(this.stackPointer, 1);
                this.memory.writeMemory(this.stackPointer, (this.programCounter & 0xf));
                this.programCounter = 0x40;
                this.memory.writeMemory(0xFF0F, this.memory.readMemory(0xFF0F) & ~(1 << 0));
                this.tickClock(20);
            }
            if (this.memory.readMemory(0xFFFF) & 2 && this.memory.readMemory(0xFF0F) & 2) {
                this.stackPointer = this.registers.differenceDouble(this.stackPointer, 1);
                this.memory.writeMemory(this.stackPointer, (this.programCounter >> 8));
                this.stackPointer = this.registers.differenceDouble(this.stackPointer, 1);
                this.memory.writeMemory(this.stackPointer, (this.programCounter & 0xf));
                this.programCounter = 0x48;
                this.memory.writeMemory(0xFF0F, this.memory.readMemory(0xFF0F) & ~(1 << 1));
                this.tickClock(20);
            }
            if (this.memory.readMemory(0xFFFF) & 4 && this.memory.readMemory(0xFF0F) & 4) {
                this.stackPointer = this.registers.differenceDouble(this.stackPointer, 1);
                this.memory.writeMemory(this.stackPointer, (this.programCounter >> 8));
                this.stackPointer = this.registers.differenceDouble(this.stackPointer, 1);
                this.memory.writeMemory(this.stackPointer, (this.programCounter & 0xf));
                this.programCounter = 0x50;
                this.memory.writeMemory(0xFF0F, this.memory.readMemory(0xFF0F) & ~(1 << 2));
                this.tickClock(20);
            }
            if (this.memory.readMemory(0xFFFF) & 8 && this.memory.readMemory(0xFF0F) & 8) {
                this.stackPointer = this.registers.differenceDouble(this.stackPointer, 1);
                this.memory.writeMemory(this.stackPointer, (this.programCounter >> 8));
                this.stackPointer = this.registers.differenceDouble(this.stackPointer, 1);
                this.memory.writeMemory(this.stackPointer, (this.programCounter & 0xf));
                this.programCounter = 0x58;
                this.memory.writeMemory(0xFF0F, this.memory.readMemory(0xFF0F) & ~(1 << 3));
                this.tickClock(20);
            }
            if (this.memory.readMemory(0xFFFF) & 16 && this.memory.readMemory(0xFF0F) & 16) {
                this.stackPointer = this.registers.differenceDouble(this.stackPointer, 1);
                this.memory.writeMemory(this.stackPointer, (this.programCounter >> 8));
                this.stackPointer = this.registers.differenceDouble(this.stackPointer, 1);
                this.memory.writeMemory(this.stackPointer, (this.programCounter & 0xf));
                this.programCounter = 0x60;
                this.memory.writeMemory(0xFF0F, this.memory.readMemory(0xFF0F) & ~(1 << 4));
                this.tickClock(20);
            }
        }
    }

    execute([high, low]) {
        // let [high, low] = this.decode();

        //get the (HL) value
        let tempHLLocation = this.registers.getRegisterDouble(registerID.H, registerID.L);
        this.registers.setRegister(registerID.HL, this.memory.readMemory(tempHLLocation));
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
                            try {
                                throw new Error("TODO");
                            }
                            catch (e) {
                                errorHandler(e);
                            }
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
                            try {
                                throw new Error("TODO");
                            }
                            catch (e) {
                                errorHandler(e);
                            }
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
                            try {
                                throw new Error("TODO");
                            }
                            catch (e) {
                                errorHandler(e);
                            }
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
                            try {
                                throw new Error("TODO");
                            }
                            catch (e) {
                                errorHandler(e);
                            }
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
                        try {
                            throw new Error("TODO");
                        }
                        catch (e) {
                            errorHandler(e);
                        }
                    }
                    else if (low < 8) {
                        this.memory.writeMemory(registerID.HL, low);
                        this.tickClock(8);
                    }
                    else {
                        this.ldXY(registerID.A, low - 8);
                    }
                    break;
                case 0x8:
                    if (low < 8) {
                        this.registers.addA(this.registers.getRegister(low));
                        if (low == 0x6) {
                            this.tickClock(8);
                        }
                        else {
                            this.tickClock(4);
                        }
                    }
                    else {
                        this.registers.adcA(this.registers.getRegister(low - 8));
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
                        this.registers.subA(this.registers.getRegister(low));
                        if (low == 0x6) {
                            this.tickClock(8);
                        }
                        else {
                            this.tickClock(4);
                        }
                    }
                    else {
                        this.registers.sbcA(this.registers.getRegister(low - 8));
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
                        this.registers.andA(this.registers.getRegister(low));
                        if (low == 0x6) {
                            this.tickClock(8);
                        }
                        else {
                            this.tickClock(4);
                        }
                    }
                    else {
                        this.registers.xorA(this.registers.getRegister(low - 8));
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
                        this.registers.orA(this.registers.getRegister(low));
                        if (low == 0x6) {
                            this.tickClock(8);
                        }
                        else {
                            this.tickClock(4);
                        }
                    }
                    else {
                        this.registers.cpA(this.registers.getRegister(low - 8));
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
                            let low = this.memory.readMemory(this.stackPointer);
                            this.stackPointer = this.registers.sumDouble(this.stackPointer, 1);
                            let high = this.memory.readMemory(this.stackPointer);
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
                            this.programCounter = this.memory.readMemory(this.stackPointer);
                            this.stackPointer = this.registers.sumDouble(this.stackPointer, 2);
                            this.memory.writeMemory(0xFFFF, 1);
                            this.tickClock(16);
                            break;
                        case 0xA:
                            this.jumpConditional(this.registers.getFlag(4));
                            break;
                        case 0xC:
                            this.callConditional(this.registers.getFlag(4));
                            break;
                        case 0xE:
                            this.registers.sbcA(this.fetch);
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
                            this.memory.writeMemory((0xFF00 + this.fetch()), this.registers.getRegister(registerID.A));
                            this.tickClock(12);
                            break;
                        case 0x1:
                            this.pop(registerID.H, registerID.L);
                            break;
                        case 0x2:
                            this.memory.writeMemory((0xFF00 + this.registers.getRegister(registerID.C)), this.registers.getRegister(registerID.A));
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
                        case 0x8://TODO
                            try {
                                throw new Error("TODO");
                            }
                            catch (e) {
                                errorHandler(e);
                            }

                            break;
                        case 0x9:
                            this.programCounter = this.registers.getRegisterDouble(registerID.H, registerID.L);
                            this.tickClock(4);
                            break;
                        case 0xA:
                            {
                                let low = this.fetch();
                                let high = this.fetch()
                                this.memory.writeMemory(((high << 8) | low), this.registers.getRegister(registerID.A));
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
                            this.registers.setRegister(registerID.A, this.memory.readMemory(0xFF00 + this.fetch()));
                            this.tickClock(12);
                            break;
                        case 0x1://TODO FLAGS
                            this.pop(registerID.A, registerID.F);
                            try {
                                throw new Error("TODO");
                            }
                            catch (e) {
                                errorHandler(e);
                            }
                            break;
                        case 0x2:
                            this.registers.setRegister(registerID.A, this.memory.readMemory(0xFF00 + this.registers.getRegister(registerID.C)));
                            this.tickClock(8);
                            break;
                        case 0x3:
                            this.memory.writeMemory(0xFFFF, 0);
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
                        case 0x8://TODO
                            try {
                                throw new Error("TODO");
                            }
                            catch (e) {
                                errorHandler(e);
                            }
                            break;
                        case 0x9://TODO
                            try {
                                throw new Error("TODO");
                            }
                            catch (e) {
                                errorHandler(e);
                            }
                            break;
                        case 0xA:
                            {
                                let low = this.fetch();
                                let high = this.fetch();
                                let value = this.memory.readMemory((high << 8) | low);
                                this.registers.setRegister(registerID.A, value);
                                this.tickClock(16);
                                break;
                            }
                        case 0xB:
                            this.memory.writeMemory(0xFFFF, 1);
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

        this.memory.writeMemory(tempHLLocation, this.registers.getRegister(registerID.HL))//Assign the new HL value back to register


    }

    tickClock(cycles) {
        // this.opcodeTicks += cycles;
        // if(this.opcodeTicks > 70223){
        //     this.frameReady = true;
        // }
        for (let i = 0; i < cycles; i++) {
            if (this.opcodeTicks == 70224) {
                this.opcodeTicks = 0;
                this.frameReady = true;
            }

            

            this.opcodeTicks++;

            if(this.opcodeTicks % 4 == 0){
                this.sysClock = this.registers.sumDouble(this.sysClock, 1);
                this.memory.io.setData(0x4, this.sysClock >> 8);
            }

            if(this.opcodeTicks % 456 == 0){
                if(this.memory.io.getData(0x44) == 153){
                    this.memory.io.setData(0x44, 0);
                }
                this.memory.io.setData(0x44, this.memory.io.getData(0x44) + 1);
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
            this.memory.writeMemory(this.stackPointer, (this.programCounter >> 8));
            this.stackPointer = this.registers.differenceDouble(this.stackPointer, 1);
            this.memory.writeMemory(this.stackPointer, (this.programCounter & 0xff));
            this.programCounter = (high << 8) | low;
            this.tickClock(24);
        }
        else {
            this.tickClock(12);
        }
    }

    returnConditional(condition) {
        if (condition) {
            let low = this.memory.readMemory(this.stackPointer);
            this.stackPointer = this.registers.sumDouble(this.stackPointer, 1);
            let high = this.memory.readMemory(this.stackPointer);
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
        this.memory.writeMemory(this.stackPointer, (this.programCounter >> 8));
        this.stackPointer = this.registers.differenceDouble(this.stackPointer, 1);
        this.memory.writeMemory(this.stackPointer, (this.programCounter & 0xff));
        this.programCounter = location;
        this.tickClock(16);
    }

    push(register1, register2) {
        let high = this.registers.getRegister(register1);
        this.stackPointer = this.registers.differenceDouble(this.stackPointer, 1);
        this.memory.writeMemory(this.stackPointer, high)
        let low = this.registers.getRegister(register2);
        this.stackPointer = this.registers.differenceDouble(this.stackPointer, 1);
        this.memory.writeMemory(this.stackPointer, low)
        this.tickClock(16);
    }

    pop(register1, register2) {
        let low = this.memory.readMemory(this.stackPointer);
        this.stackPointer = this.registers.sumDouble(this.stackPointer, 1);
        let high = this.memory.readMemory(this.stackPointer);
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
        if (register == 0x6) {
            this.tickClock(16);
        }
        else {
            this.tickClock(8);
        }
    }
}

