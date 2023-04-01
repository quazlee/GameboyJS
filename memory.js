class MemoryBlock {
    constructor(size) {
        this.size = size
        this.data = new Array(this.size);
        for(let i = 0; i < this.data.length; i++){
            this.data[i] = 0;
        }
    }

    setData(location, value) {
        try{
            if(value > 255 || value < 0){
                throw new Error("Value Must Be Between 0x00 and 0xFF");
            }
            else if(location > this.size || location < 0){
                throw new Error("Location Must Be Between 0 and " + String(this.size - 1));
            }
            else{
                this.data[location] = value;
            }
        }
        catch (e){
            errorHandler(e);
        }
    }

    getData(location){
        try{
            if(location > 7 || location < 0){
                throw new Error("Location Must Be Between 0 and " + String(this.size - 1));
            }
            else{
                return this.data[location];
            }
        }
        catch (e){
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

    changeBank(bank){
        this.selectedRomBank = bank;
    }

    setData(location, value) {
        try{
            if(value > 255 || value < 0){
                throw new Error("Value Must Be Between 0x00 and 0xFF");
            }
            else if(location > this.size || location < 0){
                throw new Error("Location Must Be Between 0 and " + String(this.size - 1));
            }
            else{
                this.banks[this.selectedRomBank].data[location] = value;
            }
        }
        catch (e){
            errorHandler(e);
        }
    }

    getData(location){
        try{
            if(location > 7 || location < 0){
                throw new Error("Location Must Be Between 0 and " + String(this.size - 1));
            }
            else{
                return thisbanks[this.selectedRomBank].data[location];
            }
        }
        catch (e){
            errorHandler(e);
        }
    }

}



export class Memory {
    constructor() {
        this.ramEnabled = false;
        this.bankMode = false;

        /** 0x0000-0x3FFF */
        this.romZero = new MemoryBlock(16384);

        /** 0x4000-0x7FFF */
        this.romBank = new RomBank();

        /** 0x8000-0x9FFF */
        this.vram = new MemoryBlock(8192);

        /** 0xA000-0xBFFF */
        this.ram = new MemoryBlock(4096);

        /** 0xC000-0xDFFF */
        this.wram = new MemoryBlock(4096);

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
    }

    readMemory(location) {

    }

    writeMemory(location, value) {

    }
}