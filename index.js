import { Gameboy } from "./gameboy.js"

const selectedRom = document.getElementById("romInput");
selectedRom.addEventListener("change", startGameboy, false);

async function readRom(rom) {
  let fileReader = new FileReader();
  
  let result = null;
  fileReader.onload = (e) => {
    result = e.target.result;
  }
  fileReader.readAsArrayBuffer(rom);
  return new Uint8Array(result);
}

function startGameboy(){
    const rom = this.files[0];
    const romData = readRom(rom).then();
    const gameboy = new Gameboy(romData);
}
