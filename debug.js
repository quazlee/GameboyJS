// Enable Debug Tools
let checkbox = document.getElementById("is-debug");
checkbox.addEventListener("change", () => {
    if (checkbox.checked) {
        let elements = document.getElementsByClassName("debug-tool");
        for (let index = 0; index < elements.length; index++) {
            elements[index].style.display = "block";
        }
    }
    else {
        let elements = document.getElementsByClassName("debug-tool");
        for (let index = 0; index < elements.length; index++) {
            elements[index].style.display = "none";
        }
    }
});

let dropdown = document.getElementById("selectBox");
var expanded = false;
dropdown.addEventListener("click", () => {
    var checkboxes = document.getElementById("dropdown-options");
    if (!expanded) {
        checkboxes.style.display = "block";
        expanded = true;
    } else {
        checkboxes.style.display = "none";
        expanded = false;
    }
})

// Memory Watch
let memoryViewerSubmit = document.getElementById("memory-viewer-submit");
memoryViewerSubmit.addEventListener("click", () => {
    let memoryViewerInput = document.getElementById("memory-viewer-input");
    let memoryViewer = document.getElementById("memory-viewer");
    let newWatch = document.createElement("div");
    memoryViewer.appendChild(newWatch);
    newWatch.id = "0x".concat(memoryViewerInput.value, "");
    // newWatch.classList.add("debug-tool");
    newWatch.classList.add("memory-watch");
    newWatch.textContent = "null";
    memoryViewerInput.value = "";
});

// FPS Counter
let framesSinceLastCheck = 0;
setInterval(() => {
    document.getElementById("fps").textContent = document.getElementById("frames-elapsed").value - framesSinceLastCheck;
    framesSinceLastCheck = document.getElementById("frames-elapsed").value;
}, 1000);

export function stepMode(gameboy){
    let stepMode = document.getElementById("step-mode");
    if (stepMode.value == "none") {
        setInterval(gameboy.mainLoop.bind(gameboy), 1000 / 60);
    }
    else if (stepMode.value == "opcode") {
        let stepOpcode = document.getElementById("step-opcode");
        stepOpcode.addEventListener("click", () => { gameboy.singleOpcode(); });
        stepOpcode.disabled = false;

        
    }
    else if (stepMode.value == "breakpoint") {
        setInterval(gameboy.breakpoint.bind(gameboy), 1000 / 60);
    }
    else if (stepMode.value)
    stepMode.disabled = true;
}

export function registerViewer(registers){
    let format = function(input){
        let number = input.toString(16);
        let digits = 4 - number.length;
        for (let i = 0; i < digits; i++) {
            number = "0".concat(number);
        }
        return ("0x".concat(number)).toUpperCase();
    }

    document.getElementById("register-BC").textContent = "BC: ".concat(format(registers.getRegisterDouble(0, 1)));
    document.getElementById("register-DE").textContent = "DE: ".concat(format(registers.getRegisterDouble(2, 3)));
    document.getElementById("register-HL").textContent = "HL: ".concat(format(registers.getRegisterDouble(4, 5)));
    document.getElementById("register-AF").textContent = "AF: ".concat(format(registers.getRegisterDouble(7, 8)));

    let flags = registers.getRegister(8);
    document.getElementById("flag-z").textContent = "z: ".concat(((flags & (1 << 7)) >> 7));
    document.getElementById("flag-n").textContent = "n: ".concat(((flags & (1 << 6)) >> 6));
    document.getElementById("flag-h").textContent = "h: ".concat(((flags & (1 << 5)) >> 5));
    document.getElementById("flag-c").textContent = "c: ".concat(((flags & (1 << 4)) >> 4));
}