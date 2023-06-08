import { Gameboy } from "./gameboy.js"

const selectedRom = document.getElementById("romInput");
selectedRom.addEventListener("change", startGameboy, false);

async function readRom(rom) {
    let fileReader = new FileReader();

    return new Promise((resolve, reject) => {
        let result = null;
        fileReader.onload = (e) => {
            result = e.target.result;
            resolve(new Uint8Array(result));
        }
        fileReader.readAsArrayBuffer(rom);
    });
}

async function startGameboy() {
    const rom = this.files[0];
    const romData = await readRom(rom);
    const gameboy = new Gameboy(romData);
}
