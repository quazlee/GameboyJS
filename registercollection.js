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
        this.data[registerID.B] = 0x00;
        this.data[registerID.C] = 0x13;
        this.data[registerID.D] = 0x00;
        this.data[registerID.E] = 0xD8;
        this.data[registerID.H] = 0x01;
        this.data[registerID.L] = 0x4D;
        this.data[registerID.A] = 0x01;
        this.data[registerID.F] = 0xB0;
    }

    sum(value1, value2) {
        let sum = value1 + value2;
        if (sum > 255) {
            sum -= 256;
        }
        return sum;
    }

    difference(value1, value2) {
        let difference = value1 - value2;
        if (difference < 0) {
            difference += 256;
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
            else if(value === undefined){
                throw new Error("UNDEFINED VALUE")
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
            if (register != registerID.HL && (this.data[register] > 255 || this.data[register] < 0)) {
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

    addA(targetValue) {
        let oldValue = this.data[registerID.A]
        this.data[registerID.A] = this.sum(oldValue, targetValue);
        this.assignZero(this.data[registerID.A]);
        this.clearFlag(6);
        this.assignHalfcarryAdd(oldValue, targetValue);
        this.assignCarry(oldValue, targetValue);
    }

    adcA(targetValue) {
        let carry = this.getFlag(4);
        let oldValue = this.data[registerID.A];
        this.data[registerID.A] = this.sum(this.data[registerID.A], targetValue);
        this.data[registerID.A] = this.sum(this.data[registerID.A], carry);
        this.assignZero(this.data[registerID.A]);
        this.clearFlag(6);
        this.assignHalfcarryAdc(oldValue, targetValue, carry);
        this.assignCarryAdc(oldValue, targetValue, carry);
    }

    subA(targetValue) {
        let oldValue = this.data[registerID.A]
        this.data[registerID.A] = this.difference(oldValue, targetValue);
        this.assignZero(this.data[registerID.A]);
        this.setFlag(6);
        this.assignHalfcarrySub(oldValue, targetValue);
        this.assignCarrySub(oldValue, targetValue);
    }

    sbcA(targetValue) {
        let carry = this.getFlag(4);
        let oldValue = this.data[registerID.A];
        this.data[registerID.A] = this.difference(this.data[registerID.A], targetValue);
        this.data[registerID.A] = this.difference(this.data[registerID.A], this.getFlag(4));
        this.assignZero(this.data[registerID.A]);
        this.setFlag(6);
        this.assignHalfcarrySbc(oldValue, targetValue, carry);
        this.assignCarrySbc(oldValue, targetValue, carry);
    }

    andA(targetValue) {
        let oldValue = this.data[registerID.A];
        this.data[registerID.A] = oldValue & targetValue;
        this.assignZero(this.data[registerID.A]);
        this.clearFlag(6);
        this.setFlag(5);
        this.clearFlag(4);
    }

    xorA(targetValue) {
        let oldValue = this.data[registerID.A];
        this.data[registerID.A] = oldValue ^ targetValue;
        this.assignZero(this.data[registerID.A]);
        this.clearFlag(6);
        this.clearFlag(5);
        this.clearFlag(4);
    }

    orA(targetValue) {
        let oldValue = this.data[registerID.A];
        this.data[registerID.A] = oldValue | targetValue;
        this.assignZero(this.data[registerID.A]);
        this.clearFlag(6);
        this.clearFlag(5);
        this.clearFlag(4);
    }

    cpA(targetValue) {
        let comparison = this.data[registerID.A];
        comparison = this.difference(comparison, targetValue);
        this.assignZero(comparison);
        this.setFlag(6);
        this.assignHalfcarrySub(this.data[registerID.A], targetValue);
        this.assignCarrySub(this.data[registerID.A], targetValue);
    }

    addHL(value) {
        let oldValue = this.getRegisterDouble(registerID.H, registerID.L)
        let sum = this.sumDouble(oldValue, value);
        this.setRegisterDouble(registerID.H, registerID.L, sum >> 8, sum & 0xFF);
        this.clearFlag(6);
        this.assignHalfcarryAddDouble(oldValue, value);
        this.assignCarryDouble(oldValue, value);
    }

    incRegister(register) {
        let oldValue = this.data[register];
        let newValue = this.sum(oldValue, 1);
        this.data[register] = newValue;
        this.assignZero(newValue);
        this.clearFlag(6);
        this.assignHalfcarryAdd(oldValue, 1);
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
        this.setFlag(6);
        this.assignHalfcarrySub(oldValue, 1);
    }

    decRegisterDouble(registerHigh, registerLow) {
        let high = this.data[registerHigh];
        let low = this.data[registerLow];
        let combined = (high << 8) | low;
        combined = this.differenceDouble(combined, 1);
        if (combined < 0) {
            combined += 65536;
        }
        this.data[registerHigh] = (combined & 0xFF00) >> 8;
        this.data[registerLow] = combined & 0x00FF;

    }

    rotateRightA() {
        let carry = this.getFlag(4);
        if (this.data[registerID.A] & 1)
            this.setFlag(4);
        else
            this.clearFlag(4);
        this.data[registerID.A] = ((this.data[registerID.A] >> 1 | (carry << 7)) & 0xFF);
        this.clearFlag(7);
        this.clearFlag(6);
        this.clearFlag(5);
    }

    rotateLeftA() {
        let carry = this.getFlag(4);
        if (this.data[registerID.A] & 0x80)
            this.setFlag(4);
        else
            this.clearFlag(4);
        this.data[registerID.A] = ((this.data[registerID.A] << 1 | (carry)) & 0xFF);
        this.clearFlag(7);
        this.clearFlag(6);
        this.clearFlag(5);
    }

    rotateRightCircularA() {
        this.data[registerID.A] = (((this.data[registerID.A] >> 1) | (this.data[registerID.A] << 7)) & 0xFF);
        this.clearFlag(7);
        this.clearFlag(6);
        this.clearFlag(5);
        this.assignCarryShiftRight(this.data[registerID.A]);
    }

    rotateLeftCircularA() {
        this.data[registerID.A] = (((this.data[registerID.A] << 1) | (this.data[registerID.A] >> 7)) & 0xFF);
        this.clearFlag(7);
        this.clearFlag(6);
        this.clearFlag(5);
        this.assignCarryShiftLeft(this.data[registerID.A]);
    }

    rotateRight(register) {
        let registerValue = this.data[register];
        let carry = this.getFlag(4);
        if (registerValue & 1)
            this.setFlag(4);
        else
            this.clearFlag(4);
        registerValue = ((registerValue >> 1 | (carry << 7)) & 0xFF);
        this.data[register] = registerValue;
        this.assignZero(registerValue);
        this.clearFlag(6);
        this.clearFlag(5);
    }

    rotateLeft(register) {
        let registerValue = this.data[register];
        let carry = this.getFlag(4);
        if (registerValue & 0x80)
            this.setFlag(4);
        else
            this.clearFlag(4);
        registerValue = ((registerValue << 1 | (carry)) & 0xFF);
        this.data[register] = registerValue;
        this.assignZero(registerValue);
        this.clearFlag(6);
        this.clearFlag(5);
    }

    rotateRightCircular(register) {
        let registerValue = this.data[register];
        registerValue = (((registerValue >> 1) | (registerValue << 7)) & 0xFF);
        this.data[register] = registerValue;
        this.assignZero(registerValue);
        this.clearFlag(6);
        this.clearFlag(5);
        this.assignCarryShiftRight(registerValue);
    }

    rotateLeftCircular(register) {
        let registerValue = this.data[register];
        registerValue = (((registerValue << 1) | (registerValue >> 7)) & 0xFF);
        this.data[register] = registerValue;
        this.assignZero(registerValue);
        this.clearFlag(6);
        this.clearFlag(5);
        this.assignCarryShiftLeft(registerValue);
    }
    SLA(register) {
        let registerValue = this.getRegister(register);
        if (registerValue & 0x80){
            this.setFlag(4);
        }
        else{
            this.clearFlag(4);
        }
        registerValue = (registerValue << 1) & 0xFF;
        this.data[register] = registerValue;
        this.assignZero(registerValue);
        this.clearFlag(6);
        this.clearFlag(5);
    }

    SRA(register) {
        let registerValue = this.data[register];
        if (registerValue & 0x01){
            this.setFlag(4);
        }
        else{
            this.clearFlag(4);
        }
        let bitSeven = (registerValue & 0x80);
        registerValue = registerValue >> 1;
        registerValue |= bitSeven;
        this.data[register] = registerValue;
        this.assignZero(registerValue);
        this.clearFlag(6);
        this.clearFlag(5);
    }

    SRL(register) {
        let registerValue = this.data[register];
        if (registerValue & 0x01 == 0x01){
            this.setFlag(4);
        }
        else{
            this.clearFlag(4);
        }
        registerValue = registerValue >> 1;
        this.assignZero(registerValue);
        this.clearFlag(6);
        this.clearFlag(5);
        this.setRegister(register, registerValue);
    }

    swap(register) {
        let registerValue = this.data[register];
        let high = registerValue >> 4;
        let low = registerValue & 0xF;
        registerValue = (low << 4) | high;
        this.assignZero(registerValue);
        this.clearFlag(6);
        this.clearFlag(5);
        this.clearFlag(4);
        this.setRegister(register, registerValue);
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
        if ((((value1 & 0xf) + (value2 & 0xf)) & 0x10) == 0x10)
            this.setFlag(5);
        else
            this.clearFlag(5);
    }

    assignHalfcarryAddDouble(value1, value2) {
        if ((((value1 & 0xfff) + (value2 & 0xfff)) & 0x1000) == 0x1000)
            this.setFlag(5);
        else
            this.clearFlag(5);
    }

    assignHalfcarryAdc(value1, value2, value3) {
        let flag = 0;
        if((((value1 & 0xf) + (value2 & 0xf)) & 0x10) == 0x10){
            flag |= 1;
        }
        let temp = this.sum(value1, value2);
        if((((temp & 0xf) + (value3 & 0xf)) & 0x10) == 0x10){
            flag |= 1;
        }
        if (flag)
            this.setFlag(5);
        else
            this.clearFlag(5);
    }

    assignHalfcarrySub(value1, value2) {
        if ((((value1 & 0xf) - (value2 & 0xf)) & 0x10) == 0x10)
            this.setFlag(5);
        else
            this.clearFlag(5);
    }
    assignHalfcarrySubDouble(value1, value2) {
        if ((((value1 & 0xfff) - (value2 & 0xfff)) & 0x1000) == 0x1000)
            this.setFlag(5);
        else
            this.clearFlag(5);
    }

    assignHalfcarrySbc(value1, value2, value3) {
        let flag = 0;
        if((((value1 & 0xf) - (value2 & 0xf)) & 0x10) == 0x10){
            flag |= 1;
        }
        let temp = this.difference(value1, value2);
        if((((temp & 0xf) - (value3 & 0xf)) & 0x10) == 0x10){
            flag |= 1;
        }
        if (flag)
            this.setFlag(5);
        else
            this.clearFlag(5);
    }

    assignCarry(value1, value2) {
        if ((value1 + value2) > 255)
            this.setFlag(4);
        else
            this.clearFlag(4);
    }

    assignCarryDouble(value1, value2) {
        if ((value1 + value2) > 65535)
            this.setFlag(4);
        else
            this.clearFlag(4);
    }

    assignCarryAdc(value1, value2, value3) {
        let flag = 0;
        if((value1 + value2) > 255){
            flag |= 1;
        }
        let temp = (value1 + value2);
        if((temp + value3) > 255){
            flag |= 1;
        }
        if (flag)
            this.setFlag(4);
        else
            this.clearFlag(4);
    }

    assignCarrySub(value1, value2) {
        if ((value1 - value2) < 0)
            this.setFlag(4);
        else
            this.clearFlag(4);
    }

    assignCarrySbc(value1, value2, value3) {
        let flag = 0;
        if((value1 - value2) < 0){
            flag |= 1;
        }
        let temp = (value1 - value2);
        if((temp - value3) < 0){
            flag |= 1;
        }
        if (flag)
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

    loadState(state){
        for (let i = 0; i < 9; i++) {
            this.data[i] = state.data[i];
        }
    }
}