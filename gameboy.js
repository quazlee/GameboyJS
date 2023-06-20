import { Cpu } from "./cpu.js";

export class Gameboy {
    constructor() {
        this.cpu = null;
        this.gpu = null;
        let currentOpcode = null;
    }

    initialize(romArray){
        this.cpu = new Cpu(romArray);
        // this.testTile();
    }

    mainLoop() {
        let breakpoint = false;
        
        while(this.cpu.frameReady == false){
            this.currentOpcode = this.cpu.decode();
            this.cpu.execute(this.currentOpcode);
        }
        this.cpu.frameReady = false;
        document.getElementById("frames-elapsed").stepUp(1);
    }

    // singleOpcode(){

    //     this.cpu.execute();
    // }

    // breakpoint(){
        
    //     while(this.cpu.programCounter != breakpoint){
    //         let [high, low] = this.decode();
    //         this.cpu.execute([high, low]);
    //     }
    // }

    // testTile(){
    //     let tile = [0x3c, 0x7e, 0x42, 0x42, 0x42, 0x42, 0x42, 0x42, 0x7e, 0x5e, 0x7e, 0x0a, 0x7c, 0x56, 0x38, 0x7c]
    //     let decodedTile = this.gpu.decodeTile(tile)
    //     this.gpu.drawTile(decodedTile);
    // }
}