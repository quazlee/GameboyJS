import { RegisterCollection } from "./registerCollection.js";

let test = new RegisterCollection()
test.setRegister(0, 0xF)

console.log(test.getRegister(0))