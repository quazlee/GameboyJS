import { Gameboy } from "./gameboy.js"
let gameboy = new Gameboy();

let selectedRom = document.getElementById("romInput");
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
    let rom = this.files[0];
    let romInput = await readRom(rom);
    gameboy.initialize(romInput);
    gameboy.setGameName(rom.name.replace(".gb", ""))

    setInterval(gameboy.mainLoop.bind(gameboy), 17);
}

window.addEventListener("keydown", function(e) {
    if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
        e.preventDefault();
    }
}, false);




