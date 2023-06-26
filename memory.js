import { errorHandler } from "./errorhandler.js";
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

}

export class Memory {
    constructor(romInput) {
        this.romInput = null;
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

    initialize(romInput){
        this.romInput = romInput;
        let exponent = this.romInput[0x0148];
        this.numRomBanks = (2 ^ exponent);
        this.ramEnabled = false;
        this.bankMode = false;

        /** 0x0000-0x3FFF */
        this.romZero = new MemoryBlock(16384);

        /** 0x4000-0x7FFF */
        this.romBank = new RomBank(this.numRomBanks);

        /** 0x8000-0x9FFF */
        this.vram = new MemoryBlock(8192);

        /** 0xA000-0xBFFF */
        this.ram = new MemoryBlock(8192);

        /** 0xC000-0xDFFF */
        this.wram = new MemoryBlock(8192);

        /** 0xE000-0xFDFF
         * ECHO RAM SO IGNORE IT
        */

        /** 0xFE00-0xFE9F */
        this.oam = new MemoryBlock(160);

        /** 0xFEA0-0xFEFF
         * NOT USABLE SO IGNORE IT
        */

        /** 0xFF00-0xFF7F */
        this.io = new MemoryBlock(128);

        /** 0xFF80-0xFFFE */
        this.hram = new MemoryBlock(127);

        /** 0xFFFF */
        this.ie = new MemoryBlock(1);

        this.readRom();
    }

    readMemory(location) {
        try {
            if (location < 0x4000)
                return this.romZero.getData(location);
            else if (location < 0x8000)
                return this.romBank.getData(location - 0x4000)
            else if (location < 0xA000)
                return this.vram.getData(location - 0x8000);
            else if (location < 0xC000)
                return this.ram.getData(location - 0xA000);
            else if (location < 0xE000)
                return this.wram.getData(location - 0xC000);
            else if (location < 0xFE00)
                // return this.ram.getData(location - 0x9F00);
                throw new Error("Invalid Location: ECHO RAM");
            else if (location < 0xFEA0)
                return this.oam.getData(location - 0xFE00);
            else if (location < 0xFF00)
                throw new Error("Invalid Location: PROHIBITED");
            else if (location < 0xFF80)
                return this.io.getData(location - 0xFF00);
            else if (location < 0xFFFF)
                return this.hram.getData(location - 0xFF80);
            else if (location == 0xFFFF)
                return this.ie.getData(0);
            else
                throw new Error("Invalid Location: OUT OF BOUNDS")
        }
        catch (e) {
            errorHandler(e);
        }
    }

    writeMemory(location, value) {
        try {
            if (location < 0x2000) {
                let low = value | 0xF;
                if (low == 0xA) {
                    this.ramEnabled = true;
                }
                else {
                    this.ramEnabled = false;
                }
            }
            else if (location < 0x4000) {
                this.romBank.changeBank(value - 1);
            }
            else if (location < 0x6000) {
                //need to figure out ram if need bank or not
            }
            else if (location < 0x8000) {
                //see pandocs to figure out later
            }
            else if (location < 0xA000) {
                this.vram.setData(location - 0x8000, value);
            }
            else if (location < 0xC000 ){
                if(this.ramEnabled){
                    this.ram.setData(location - 0xA000, value);
                }
            }
            else if (location < 0xE000) {
                this.wram.setData(location - 0xC000, value);
            }
            else if (location < 0xFE00)
                throw new Error("Invalid Location: ECHO RAM");
            else if (location < 0xFEA0) {
                this.oam.setData(location - 0xFE00);
            }
            else if (location < 0xFF00)
                throw new Error("Invalid Location: PROHIBITED");
            else if (location < 0xFF80){
                this.io.setData(location - 0xFF00, value);
            }
            else if (location < 0xFFFF){
                this.hram.setData(location - 0xFF80, value);
            }
            else if (location == 0xFFFF){
                this.ie.setData(0, 1);
            }
            else{
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
            this.romZero.setData(romArrayIndex, this.romInput[romArrayIndex]);
            romArrayIndex++;
        }
        while (romArrayIndex < this.romInput.length - 1) {
            if (currentBankIndex == 16384) {
                currentBankIndex = 0;
                currentBank++;
                this.romBank.changeBank(currentBank);
            }
            this.romBank.setData(currentBankIndex, this.romInput[romArrayIndex]);
            currentBankIndex++;

            romArrayIndex++;

            
        }
        this.romBank.changeBank(0);
    }
}