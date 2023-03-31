export class RegisterCollection {
    constructor() {
        this.values = new ArrayBuffer(8);
    }

    setRegister(register, value) {
        try{
            if (typeof value != "number") {
                throw new Error("Invalid Type");
            }
            else if(value > 255 || value < 0){
                throw new Error("Value Must Be Between 0x00 and 0xFF");
            }
            else{
                let accessor = new Uint8Array(this.values);
                accessor[register] = value;
                console.log(accessor[register]);
            }
        }
        catch (e){
            console.log(e)
        }
    }
}