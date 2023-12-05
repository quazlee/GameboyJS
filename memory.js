import { errorHandler } from "./errorhandler.js";
import { Cpu } from "./cpu.js";
class MemoryBlock {
    constructor(size) {
        this.size = size
        this.data = new Array(this.size);
        for (let i = 0; i < this.data.length; i++) {
            this.data[i] = 0;
        }
    }

    setData(location, value) {
        try {
            if (value > 255 || value < 0) {
                throw new Error("Value Must Be Between 0x00 and 0xFF");
            }
            else if (location > this.size || location < 0) {
                throw new Error("Location Must Be Between 0 and " + String(this.size - 1));
            }
            else {
                this.data[location] = value;
            }
        }
        catch (e) {
            errorHandler(e);
        }
    }

    getData(location) {
        try {
            if (location > this.size || location < 0) {
                throw new Error("Location Must Be Between 0 and " + String(this.size - 1));
            }
            else {
                return this.data[location];
            }
        }
        catch (e) {
            errorHandler(e);
        }
    }

    loadState(state){
        for (let i = 0; i < this.size; i++) {
            this.data[i] = state.data[i];
        }
    }
}

class RomBank {
    constructor(numBanks) {
        this.selectedRomBank = 0;
        this.numBanks = numBanks;
        this.banks = new Array()
        for (let i = 0; i < this.numBanks; i++) {
            this.banks.push(new MemoryBlock(16384));
        }
    }

    changeBank(bank) {
        this.selectedRomBank = bank;
    }

    setData(location, value) {
        try {
            if (value > 255 || value < 0) {
                throw new Error("Value Must Be Between 0x00 and 0xFF");
            }
            else if (location > 16384 || location < 0) {
                throw new Error("Location Must Be Between 0 and " + String(16384 - 1));
            }
            else {
                this.banks[this.selectedRomBank].data[location] = value;
            }
        }
        catch (e) {
            errorHandler(e);
        }
    }

    getData(location) {
        try {
            if (location > this.size || location < 0) {
                throw new Error("Location Must Be Between 0 and " + String(this.size - 1));
            }
            else {
                return this.banks[this.selectedRomBank].data[location];
            }
        }
        catch (e) {
            errorHandler(e);
        }
    }

    loadState(state){
        this.numBanks = state.numBanks;
        this.currentBank = state.currentBank;
        for (let i = 0; i < this.numBanks; i++) {
            this.banks[i] =  state.banks[i];
        }
    }
}

class RamBank {
    constructor(numBanks) {
        this.selectedRamBank = 0;
        this.numBanks = numBanks;
        this.banks = new Array()
        for (let i = 0; i < this.numBanks; i++) {
            this.banks.push(new MemoryBlock(8192));
        }
    }

    changeBank(bank) {
        this.selectedRamBank = bank;
    }

    setData(location, value) {
        try {
            if (value > 255 || value < 0) {
                throw new Error("Value Must Be Between 0x00 and 0xFF");
            }
            else if (location > 8192 || location < 0) {
                throw new Error("Location Must Be Between 0 and " + String(8192 - 1));
            }
            else {
                this.banks[this.selectedRamBank].data[location] = value;
            }
        }
        catch (e) {
            errorHandler(e);
        }
    }

    getData(location) {
        try {
            if (location > this.size || location < 0) {
                throw new Error("Location Must Be Between 0 and " + String(this.size - 1));
            }
            else {
                return this.banks[this.selectedRamBank].data[location];
            }
        }
        catch (e) {
            errorHandler(e);
        }
    }

    loadState(state){
        this.numBanks = state.numBanks;
        this.currentBank = state.currentBank;
        for (let i = 0; i < this.numBanks; i++) {
            this.banks[i] =  state.banks[i];
        }
    }
}

class Memory {

    constructor(){
        this.mbcType = null;
        this.numRomBanks = null;
        this.ramEnabled = null;
        this.bankMode = null;

        /** 0x0000-0x3FFF */
        this.romZero = null;

        /** 0x4000-0x7FFF */
        this.romBank = null;

        /** 0x8000-0x9FFF */
        this.vram = null;

        /** 0xA000-0xBFFF */
        this.ram = null;

        /** 0xC000-0xDFFF */
        this.wram = null;

        /** 0xE000-0xFDFF
         * ECHO RAM SO IGNORE IT
        */

        /** 0xFE00-0xFE9F */
        this.oam = null;

        /** 0xFEA0-0xFEFF
         * NOT USABLE SO IGNORE IT
        */

        /** 0xFF00-0xFF7F */
        this.io = null;

        /** 0xFF80-0xFFFE */
        this.hram = null;

        /** 0xFFFF */
        this.ie = null;
    }

    loadState(state){
        this.mbcType = state.mbcType;
        this.numRomBanks = state.numRomBanks;
        this.ramEnabled = state.ramEnabled;
        this.bankMode = state.bankMode;
        this.romZero.loadState(state.romZero);
        this.romBank.loadState(state.romBank);
        this.vram.loadState(state.vram);
        this.ram.loadState(state.ram);
        this.wram.loadState(state.wram);
        this.oam.loadState(state.oam);
        this.io.loadState(state.io);
        this.hram.loadState(state.hram);
        this.ie.loadState(state.ie);
    }
}

export class MemoryManager {
    constructor(romInput) {
        this.cpu = null;
        this.romInput = null;
        this.memory = new Memory();

    }

    setMemory(cpu) {
        this.cpu = cpu;
    }

    initialize(romInput) {
        this.romInput = romInput;

        this.memory.mbcType = this.romInput[0x147]

        let romSize = this.romInput[0x148];
        this.memory.numRomBanks = (2 ** (romSize + 1));

        let ramSize = this.romInput[0x149];
        switch (ramSize) {
            case 0:
                this.memory.numRamBanks = 0;
                break;
            case 2:
                this.memory.numRamBanks = 1;
                break;
            case 3:
                this.memory.numRamBanks = 4;
                break;
            case 4:
                this.memory.numRamBanks = 16;
                break;
            case 5:
                this.memory.numRamBanks = 8;
                break;
        }

        this.memory.ramEnabled = false;
        this.memory.bankMode = false;

        /** 0x0000-0x3FFF */
        this.memory.romZero = new MemoryBlock(16384);

        /** 0x4000-0x7FFF */
        this.memory.romBank = new RomBank(this.memory.numRomBanks);

        /** 0x8000-0x9FFF */
        this.memory.vram = new MemoryBlock(8192);

        /** 0xA000-0xBFFF */
        this.memory.ram = new RamBank(this.memory.numRamBanks);

        /** 0xC000-0xDFFF */
        this.memory.wram = new MemoryBlock(8192);

        /** 0xE000-0xFDFF
         * ECHO RAM SO IGNORE IT
        */
        this.memory.echoRam = new MemoryBlock(7680);

        /** 0xFE00-0xFE9F */
        this.memory.oam = new MemoryBlock(160);

        /** 0xFEA0-0xFEFF
         * NOT USABLE SO IGNORE IT
        */
        this.memory.prohibited = new MemoryBlock(96)

        /** 0xFF00-0xFF7F */
        this.memory.io = new MemoryBlock(128);

        /** 0xFF80-0xFFFE */
        this.memory.hram = new MemoryBlock(127);

        /** 0xFFFF */
        this.memory.ie = new MemoryBlock(1);

        this.readRom();

        this.writeMemory(0xFF00, 0xCF);
        this.writeMemory(0xFF01, 0x00);
        this.writeMemory(0xFF02, 0x7E);
        this.memory.io.setData(4, 0xAB);
        this.writeMemory(0xFF05, 0x00);
        this.writeMemory(0xFF06, 0x00);
        this.writeMemory(0xFF07, 0xF8);
        this.writeMemory(0xFF0F, 0xE1);
        this.writeMemory(0xFF10, 0x80);
        this.writeMemory(0xFF11, 0xBF);
        this.writeMemory(0xFF12, 0xF3);
        this.writeMemory(0xFF13, 0xFF);
        this.writeMemory(0xFF14, 0xBF);
        this.writeMemory(0xFF16, 0x3F);
        this.writeMemory(0xFF17, 0x00);
        this.writeMemory(0xFF18, 0xFF);
        this.writeMemory(0xFF19, 0xBF);
        this.writeMemory(0xFF1A, 0x7F);
        this.writeMemory(0xFF1B, 0xFF);
        this.writeMemory(0xFF1C, 0x9F);
        this.writeMemory(0xFF1D, 0xFF);
        this.writeMemory(0xFF1E, 0xBF);
        this.writeMemory(0xFF20, 0xFF);
        this.writeMemory(0xFF21, 0x00);
        this.writeMemory(0xFF22, 0x00);
        this.writeMemory(0xFF23, 0xBF);
        this.writeMemory(0xFF24, 0x77);
        this.writeMemory(0xFF25, 0xF3);
        this.writeMemory(0xFF26, 0xF1);
        this.writeMemory(0xFF40, 0x91);
        this.writeMemory(0xFF41, 0x85);
        this.writeMemory(0xFF42, 0x00);
        this.writeMemory(0xFF43, 0x00);
        this.writeMemory(0xFF44, 0x00);
        this.writeMemory(0xFF45, 0x00);
        // this.writeMemory(0xFF46, 0xFF);
        this.memory.io.setData(0x46, 0xFF)
        this.writeMemory(0xFF47, 0xFC);
        this.writeMemory(0xFF48, 0x00);
        this.writeMemory(0xFF49, 0x00);
        this.writeMemory(0xFF4A, 0x00);
        this.writeMemory(0xFF4B, 0x00);
        this.writeMemory(0xFF4D, 0xFF);
        this.writeMemory(0xFF4F, 0xFF);
        this.writeMemory(0xFF51, 0xFF);
        this.writeMemory(0xFF52, 0xFF);
        this.writeMemory(0xFF53, 0xFF);
        this.writeMemory(0xFF54, 0xFF);
        this.writeMemory(0xFF55, 0xFF);
        this.writeMemory(0xFF56, 0xFF);
        this.writeMemory(0xFF68, 0xFF);
        this.writeMemory(0xFF69, 0xFF);
        this.writeMemory(0xFF6A, 0xFF);
        this.writeMemory(0xFF6B, 0xFF);
        this.writeMemory(0xFF70, 0xFF);
        this.writeMemory(0xFFFF, 0x00);
    }

    readMemory(location) {
        try {
            if (location < 0x4000)
                return this.memory.romZero.getData(location);
            else if (location < 0x8000)
                return this.memory.romBank.getData(location - 0x4000)
            else if (location < 0xA000)
                return this.memory.vram.getData(location - 0x8000);
            else if (location < 0xC000)
                return this.memory.ram.getData(location - 0xA000);
            else if (location < 0xE000)
                return this.memory.wram.getData(location - 0xC000);
            else if (location < 0xFE00)
                return this.memory.echoRam.getData(location - 0xE000);
            else if (location < 0xFEA0)
                return this.memory.oam.getData(location - 0xFE00);
            else if (location < 0xFF00)
                return this.memory.prohibited.getData(location - 0xFEA0);
            else if (location < 0xFF80)
                return this.memory.io.getData(location - 0xFF00);
            else if (location < 0xFFFF)
                return this.memory.hram.getData(location - 0xFF80);
            else if (location == 0xFFFF)
                return this.memory.ie.getData(0);
            else
                return 0;
        }
        catch (e) {
            errorHandler(e);
        }
    }

    writeMemory(location, value) {
        switch (this.memory.mbcType) {
            case 0://No MBC
                this.writeMemoryMbcZero(location, value);
                break;
            case 1://MBC1
                this.writeMemoryMbcOne(location, value);
                break;
            case 0x13://MBC3+RAM+BATTERY
                this.writeMemoryMbcThree(location, value);
                break;
            default:
                throw new Error("Invalid MBC Type: This MBC Chip is not Implemented");
        }

    }

    writeMemoryMbcZero(location, value) {
        try {
            if (location < 0x8000) {
                throw new Error("Invalid Location: Tried Writing to ROM");
            }
            else if (location < 0xA000) {
                this.memory.vram.setData(location - 0x8000, value);
            }
            else if (location < 0xC000) {
                this.memory.ram.setData(location - 0xA000, value);
            }
            else if (location < 0xE000) {
                this.memory.wram.setData(location - 0xC000, value);
            }
            else if (location < 0xFE00)
                return this.memory.echoRam.setData(location - 0xE000, value);
            else if (location < 0xFEA0) {
                this.memory.oam.setData(location - 0xFE00, value);
            }
            else if (location < 0xFF00)
                return this.memory.prohibited.setData(location - 0xFEA0, value);
            else if (location < 0xFF80) {
                if (location == 0xFF04) { //RESET TIMA
                    this.memory.io.setData(location - 0xFF00, 0);
                }
                else if (location == 0xFF46) { //OAM DMA
                    this.memory.io.setData(location - 0xFF00, value);
                    for (let i = 0; i < 160; i++) {
                        this.memory.oam.setData(i, this.readMemory((value << 8) | i));
                        this.cpu.tickClock(1)
                    }
                }
                else {
                    this.memory.io.setData(location - 0xFF00, value);
                }
            }
            else if (location < 0xFFFF) {
                this.memory.hram.setData(location - 0xFF80, value);
            }
            else if (location == 0xFFFF) {
                this.memory.ie.setData(0, value);
            }
            else {
                throw new Error("Invalid Location: OUT OF BOUNDS");
            }
        }
        catch (e) {
            errorHandler(e);
        }
    }

    writeMemoryMbcOne(location, value) { //TODO
        try {
            if (location < 0x2000) { //Any write to here will enable RAM if the value has a lower nibble of 0xA                let low = value | 0xF;
                let low = value | 0xF;
                if (low == 0xA) {
                    this.memory.ramEnabled = true;
                }
                else {
                    this.memory.ramEnabled = false;
                }
            }
            else if (location < 0x4000) { //Writing to here will change the active ROM Bank 
                //TODO
                let maskedValue = value & 0x1F;
                switch (maskedValue) {
                    case 0:
                        maskedValue = 1;
                        break;
                }
                this.memory.romBank.changeBank(value - 1);
            }
            else if (location < 0x6000) {
                //TODO
                //need to figure out ram if need bank or not
                if (this.memory.ramEnabled) {

                }
            }
            else if (location < 0x8000) {
                if (value == 0) {
                    this.memory.bankMode = false;
                }
                else if (value == 1) {
                    this.memory.bankMode = true;
                }
            }
            else if (location < 0xA000) {
                this.memory.vram.setData(location - 0x8000, value);
            }
            else if (location < 0xC000) {
                if (this.memory.ramEnabled) {
                    this.memory.ram.setData(location - 0xA000, value);
                }
            }
            else if (location < 0xE000) {
                this.memory.wram.setData(location - 0xC000, value);
            }
            else if (location < 0xFE00)
                return this.memory.echoRam.setData(location - 0xE000, value);
            else if (location < 0xFEA0) {
                this.memory.oam.setData(location - 0xFE00, value);
            }
            else if (location < 0xFF00)
                return this.memory.prohibited.setData(location - 0xFEA0, value);
            else if (location < 0xFF80) {
                if (location == 0xFF04) {
                    this.memory.io.setData(location - 0xFF00, 0);
                }
                else if (location == 0xFF46) { //OAM DMA
                    this.memory.io.setData(location - 0xFF00, value);
                    for (let i = 0; i < 160; i++) {
                        this.memory.oam.setData(i, this.readMemory((value << 8) | i));
                        this.cpu.tickClock(1)
                    }
                }
                else {
                    this.memory.io.setData(location - 0xFF00, value);
                }
            }
            else if (location < 0xFFFF) {
                this.memory.hram.setData(location - 0xFF80, value);
            }
            else if (location == 0xFFFF) {
                this.memory.ie.setData(0, value);
            }
            else {
                throw new Error("Invalid Location: OUT OF BOUNDS");
            }
        }
        catch (e) {
            errorHandler(e);
        }
    }

    writeMemoryMbcThree(location, value) {//TODO 
        try {
            if (location < 0x2000) {//RAM enable and Timer Enable
                let low = value | 0xF;
                if (low == 0xA) {
                    this.memory.ramEnabled = true;
                }
                else {
                    this.memory.ramEnabled = false;
                }
            }
            else if (location < 0x4000) {//TODO
                let maskedValue = value & 0x1F;
                switch (maskedValue) {
                    case 0:
                        maskedValue = 1;
                        break;
                }
                this.memory.romBank.changeBank(value - 1);
            }
            else if (location < 0x6000) {//TODO
                if (value <= 3) {
                    this.memory.ram.changeBank(value);
                }
                else if (value <= 0xC) {

                }
            }
            else if (location < 0x8000) {//TODO
            }
            else if (location < 0xA000) {
                this.memory.vram.setData(location - 0x8000, value);
            }
            else if (location < 0xC000) {//TODO
                if (this.memory.ramEnabled) {
                    this.memory.ram.setData(location - 0xA000, value);
                }
            }
            else if (location < 0xE000) {
                this.memory.wram.setData(location - 0xC000, value);
            }
            else if (location < 0xFE00)
                return this.memory.echoRam.setData(location - 0xE000, value);
            else if (location < 0xFEA0) {
                this.memory.oam.setData(location - 0xFE00, value);
            }
            else if (location < 0xFF00)
                return this.memory.prohibited.setData(location - 0xFEA0, value);
            else if (location < 0xFF80) {
                if (location == 0xFF04) {
                    this.memory.io.setData(location - 0xFF00, 0);
                }
                else if (location == 0xFF46) { //OAM DMA
                    this.memory.io.setData(location - 0xFF00, value);
                    for (let i = 0; i < 160; i++) {
                        this.memory.oam.setData(i, this.readMemory((value << 8) | i));
                        this.cpu.tickClock(1)
                    }
                }
                else {
                    this.memory.io.setData(location - 0xFF00, value);
                }
            }
            else if (location < 0xFFFF) {
                this.memory.hram.setData(location - 0xFF80, value);
            }
            else if (location == 0xFFFF) {
                this.memory.ie.setData(0, value);
            }
            else {
                throw new Error("Invalid Location: OUT OF BOUNDS");
            }
        }
        catch (e) {
            errorHandler(e);
        }
    }

    readRom() {
        let romArrayIndex = 0;
        let currentBankIndex = 0;
        let currentBank = 0;
        while (romArrayIndex < 16384) {
            this.memory.romZero.setData(romArrayIndex, this.romInput[romArrayIndex]);
            romArrayIndex++;
        }
        while (romArrayIndex < this.romInput.length - 1) {
            if (currentBankIndex == 16384) {
                currentBankIndex = 0;
                currentBank++;
                this.memory.romBank.changeBank(currentBank);
            }
            this.memory.romBank.setData(currentBankIndex, this.romInput[romArrayIndex]);
            currentBankIndex++;

            romArrayIndex++;


        }
        this.memory.romBank.changeBank(0);
    }
}