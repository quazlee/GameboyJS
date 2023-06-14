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

export class RegisterCollection {
    constructor() {
        this.data = new Array(9)
        for (let i = 0; i < this.data.length; i++) {
            this.data[i] = 0;
        }
    }

    sum(value1, value2) {
        let sum = value1 + value2;
        if (sum > 255) {
            sum -= 255;
        }
        return sum;
    }

    difference(value1, value2) {
        let difference = value1 - value2;
        if (difference < 0) {
            difference += 255;
        }
        return difference;
    }

    sumDouble(value1, value2) {
        let sum = value1 + value2;
        if (sum > 65535) {
            sum -= 65536;
        }
        return sum;
    }

    differenceDouble(value1, value2) {
        let difference = value1 - value2;
        if (difference < 0) {
            difference += 65536;
        }
        return difference;
    }


    /**Register is a value 0-8 corresponding to {B, C, D, E, H, L, (HL), A, F}.
     * Value is an unsigned int 0-255 or 0x00-0xFF.
    */
    setRegister(register, value) {
        try {
            if (value > 255 || value < 0) {
                throw new Error("Value Must Be Between 0x00 and 0xFF");
            }
            else {
                this.data[register] = value;
            }
        }
        catch (e) {
            errorHandler(e);
        }
    }

    /**Register is a value 0-8 corresponding to {B, C, D, E, H, L, (HL), A, F}.
     * Value is an unsigned int 0-255 or 0x00-0xFF.
    */
    setRegisterDouble(registerHigh, registerLow, valueHigh, valueLow) {
        try {
            if (valueLow > 255 || valueLow < 0) {
                throw new Error("Value Must Be Between 0x00 and 0xFF");
            }
            else if (valueHigh > 255 || valueHigh < 0) {
                throw new Error("Value Must Be Between 0x00 and 0xFF");
            }
            else {
                this.data[registerHigh] = valueHigh;
                this.data[registerLow] = valueLow;
            }
        }
        catch (e) {
            errorHandler(e);
        }
    }

    /**Register is a value 0-7 corresponding to {B, C, D, E, H, L, A, F}.
     * Returns an unsigned int.
    */
    getRegister(register) {
        try {
            if (this.data[register] > 255 || this.data[register] < 0) {
                throw new Error("Value Must Be Between 0x00 and 0xFF");
            }
            else {
                return this.data[register];
            }
        }
        catch (e) {
            errorHandler(e);
        }
    }

    getRegisterDouble(registerHigh, registerLow) {
        try {
            if (this.data[registerHigh] > 255 || this.data[registerHigh] < 0) {
                throw new Error("Value Must Be Between 0x00 and 0xFF");
            }
            else if (this.data[registerLow] > 255 || this.data[registerLow] < 0) {
                throw new Error("Value Must Be Between 0x00 and 0xFF");
            }
            else {
                return (this.data[registerHigh] << 8) | this.data[registerLow];
            }
        }
        catch (e) {
            errorHandler(e);
        }
    }

    addA(targetRegister) {
        let oldValue = this.data[registerID.A]
        this.data[registerID.A] = this.sum(oldValue, this.data[targetRegister]);
        this.assignZero(this.data[registerID.A]);
        this.clearFlag(6);
        this.assignHalfcarryAdd(oldValue, this.data[registerID.A]);
        this.assignCarry(oldValue, this.data[registerID.A]);
    }

    adcA(targetRegister){

    }

    subA(){

    }

    sbcA(){

    }

    xorA(){

    }

    orA(){

    }

    cpA(){
        
    }

    addHL(value) {
        let oldValue = this.getRegisterDouble(registerID.H, registerID.L)
        this.data[registerID.HL] = this.sum(oldValue, value)
        this.clearFlag(6);
        this.assignHalfcarryAddDouble(oldValue, value);
        this.assignCarry(oldValue, value);
    }

    incRegister(register) {
        let oldValue = this.data[register];
        let newValue = this.sum(oldValue, 1);
        this.data[register] = newValue;
        this.assignZero(newValue);
        this.clearFlag(7);
        this.assignHalfcarryAdd(oldValue, newValue);
    }

    incRegisterDouble(registerHigh, registerLow) {
        let high = this.data[registerHigh];
        let low = this.data[registerLow];
        let combined = (high << 8) | low;
        combined = this.sumDouble(combined, 1);
        this.data[registerHigh] = (combined & 0xFF00) >> 8;
        this.data[registerLow] = combined & 0x00FF;
    }

    decRegister(register) {
        let oldValue = this.data[register];
        let newValue = this.difference(this.data[register], 1);
        this.data[register] = newValue;
        this.assignZero(newValue);
        this.clearFlag(7);
        this.assignHalfcarrySub(oldValue, newValue);
    }

    decRegisterDouble(registerHigh, registerLow) {
        let high = this.data[registerHigh];
        let low = this.data[registerLow];
        let combined = (high << 8) | low;
        combined - 1;
        if (combined < 0) {
            combined += 65536;
        }
        this.data[registerHigh] = (combined & 0xFF00) >> 8;
        this.data[registerLow] = combined & 0x00FF;

    }

    rotateRightA() {
        let carry = getCarry();
        if (this.data[registerID.A] & 1)
            setCarry();
        else
            clearCarry();
        this.data[registerID.A] = (this.data[registerID.A] >> 1 | (carry << 7));
        this.clearFlag(7);
        this.clearFlag(6);
        this.clearFlag(5);
    }

    rotateLeftA() {
        let carry = getCarry();
        if (this.data[registerID.A] & 1)
            setCarry();
        else
            clearCarry();
        this.data[registerID.A] = (this.data[registerID.A] << 1 | (carry));
        this.clearFlag(7);
        this.clearFlag(6);
        this.clearFlag(5);
    }

    rotateRightCircularA() {
        this.data[registerID.A] = ((this.data[registerID.A] >> 1) | (this.data[registerID.A] << 7));
        this.clearFlag(7);
        this.clearFlag(6);
        this.clearFlag(5);
        assignCarryShiftRight(this.data[registerID.A]);
    }

    rotateLeftCircularA() {
        this.data[registerID.A] = ((this.data[registerID.A] << 1) | (this.data[registerID.A] >> 7));
        this.clearFlag(7);
        this.clearFlag(6);
        this.clearFlag(5);
        assignCarryShiftRight(this.data[registerID.A]);
    }

    rotateRight(register) {
        let registerValue = this.data[register]; 
        let carry = getCarry();
        if (registerValue & 1)
            setCarry();
        else
            clearCarry();
        registerValue = (registerValue >> 1 | (carry << 7));
        this.data[register] = registerValue;
        this.assignZero(registerValue);
        this.clearFlag(6);
        this.clearFlag(5);
    }

    rotateLeft(register) {
        let registerValue = this.data[register]; 
        let carry = getCarry();
        if (registerValue & 1)
            setCarry();
        else
            clearCarry();
        this.registerValue = (this.registerValue << 1 | (carry));
        this.data[register] = registerValue;
        this.assignZero(registerValue);
        this.clearFlag(6);
        this.clearFlag(5);
    }

    rotateRightCircular(register) {
        let registerValue = this.data[register]; 
        registerValue = ((registerValue >> 1) | (registerValue << 7));
        this.data[register] = registerValue;
        this.clearFlag(7);
        this.clearFlag(6);
        this.clearFlag(5);
        assignCarryShiftRight(registerValue);
    }

    rotateLeftCircular(register) {
        let registerValue = this.data[register]; 
        registerValue = ((registerValue << 1) | (registerValue >> 7));
        this.data[register] = registerValue;
        this.clearFlag(7);
        this.clearFlag(6);
        this.clearFlag(5);
        assignCarryShiftRight(registerValue);
    }

    // //FLAG FUCNTIONS START
    setFlag(flag) {
        this.data[8] |= 1 << flag;
    }

    clearFlag(flag) {
        this.data[8] &= ~(1 << flag);
    }

    getFlag(flag) {
        return (this.data[8] >> flag) & 1;
    }

    assignZero(value) {
        if (value == 0)
            this.setFlag(7);
        else
            this.clearFlag(7);
    }

    assignHalfcarryAdd(value1, value2) {
        if (((value1 & 0xf) + (value2 & 0xf)) & 0x10)
            this.setFlag(5);
        else
            this.clearFlag(5);
    }

    assignHalfcarryAddDouble(value1, value2) {
        if (((value1 & 0xff) + (value2 & 0xff)) & 0x0100)
            this.setFlag(5);
        else
            this.clearFlag(5);
    }

    assignHalfcarrySub(value1, value2) {
        if (((value1 & 0xf) - (value2 & 0xf)) & 0x10)
            this.setFlag(5);
        else
            this.clearFlag(5);
    }
    assignHalfcarrySubDouble(value1, value2) {
        if (((value1 & 0xff) - (value2 & 0xff)) & 0x0100)
            this.setFlag(5);
        else
            this.clearFlag(5);
    }

    assignCarry(value1, value2) {
        if (value1 < value2)
            this.setFlag(4);
        else
            this.clearFlag(4);
    }

    assignCarryShiftLeft(value) {
        if (value & 0x01)
            this.setFlag(4);
        else
            this.clearFlag(4);
    }
    assignCarryShiftRight(value) {
        if (value & 0x80)
            this.setFlag(4);
        else
            this.clearFlag(4);
    }
    //FLAG FUCNTIONS END

}