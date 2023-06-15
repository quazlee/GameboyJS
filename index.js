import { Gameboy } from "./gameboy.js"

let selectedRom = document.getElementById("romInput");
let gameboy = new Gameboy();
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

let framesSinceLastCheck = 0;
async function startGameboy() {
    let rom = this.files[0];
    let romData = await readRom(rom);
    gameboy.initialize(romData);
    setInterval(gameboy.mainLoop.bind(gameboy), 16);
    setInterval(() => {
        document.getElementById("fps").textContent = document.getElementById("frames-elapsed").value - framesSinceLastCheck;
        framesSinceLastCheck = document.getElementById("frames-elapsed").value;
    }, 1000);
}
