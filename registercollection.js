import { errorHandler } from "./errorhandler.js";
export class RegisterCollection {
    constructor() {
        this.values = new ArrayBuffer(8);
        this.accessor = new Uint8Array(this.values);
    }

    setRegister(register, value) {
        try{
            if (typeof value != "number") {
                throw new Error("Invalid Type");
            }
            else if(value > 255 || value < 0){
                throw new Error("Value Must Be Between 0x00 and 0xFF");
            }
            else if(register > 7 || register < 0){
                throw new Error("Register Must Be Between 0 and 7");
            }
            else{
                this.accessor[register] = value;
            }
        }
        catch (e){
            errorHandler(e);
        }
    }

    getRegister(register){
        try{
            if(register > 7 || register < 0){
                throw new Error("Register Must Be Between 0 and 7");
            }
            else{
                return this.accessor;
            }
        }
        catch (e){
            errorHandler(e);
        }
        
    }
}