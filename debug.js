export class Debug {
    constructor(cpu, memory) {
        this.memory = memory;
        this.cpu = cpu;
        this.breakpoint = false;

        // Enable Debug Tools
        this.viewDebug = document.getElementById("is-debug");
        this.viewDebug.addEventListener("change", this.viewDebugChange.bind(this));

        this.dropdown = document.getElementById("selectBox");
        this.dropdownCheckboxes = document.getElementById("dropdown-options");
        this.dropdownExpanded = false;
        this.dropdown.addEventListener("click", this.dropdownClick.bind(this));

        this.programCounter = document.getElementById("program-counter");
        this.currentOpcode = document.getElementById("current-opcode");

        this.cpuClock = document.getElementById("clock");

        
        this.breakpointSubmit = document.getElementById("breakpoint-input-submit");
        this.breakpointSubmit.addEventListener("click", this.addBreakpoint.bind(this));
        this.breakPoints = [];
        this.breakpointControls = document.getElementById("breakpoint-controls");

    }

    viewDebugChange() {
        if (this.viewDebug.checked) {
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
    }

    dropdownClick() {
        if (!this.dropdownExpanded) {
            this.dropdownCheckboxes.style.display = "block";
            this.dropdownExpanded = true;
        } else {
            this.dropdownCheckboxes.style.display = "none";
            this.dropdownExpanded = false;
        }
    }

    updateProgramCounter() {
        this.programCounter.textContent = "0x".concat((this.programCounter - 1).toString(16));
    }
    updateCurrentOpcode() {
        this.currentOpcode.textContent = "0x".concat(currentOpcode.toString(16));
    }

    // debugRomOutput(cpu) {
    //     if (cpu.memory.readMemory(0xFF02) == 0x0081) {
    //         let debugElement = document.getElementById("debug");
    //         let debugText = debugElement.textContent;
    //         let nextCharacter = cpu.memory.readMemory(0xFF01);
    //         debugText.concat("", nextCharacter)
    //         console.log(nextCharacter);
    //     }
    // }

    debugClock(cpu) {
        this.cpuClock.textContent = this.cpu.opcodeTicks.toString();
    }

    // debugMemoryWatch(cpu) {
    //     let elements = document.getElementsByClassName("memory-watch");
    //     for (let index = 0; index < elements.length; index++) {
    //         elements[index].textContent = cpu.memory.readMemory(Number(elements[index].id));
    //     }
    // }

    registerViewer(registers) {
        let format = function (input) {
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


    addBreakpoint() {
        
        this.breakpointControls.style.backgroundColor = "";

        let breakpointType = this.breakpointControls.getElementById("breakpoint-type").value;
        let breakpointOperator = this.breakpointControls.getElementById("breakpoint-comparison").value;
        let breakpointInputComparator = this.breakpointControls.getElementById("breakpoint-input-comparator").value;
        let breakpointInputValue = this.breakpointControls.getElementById("breakpoint-input-value").value;
        
        let breakpointController = this.breakpointControls.getElementById("breakpoint-controller-body");

        let valid = false;
        if ((breakpointType == "opcode" | breakpointType == "program-counter") &&
            ((Number(breakpointInputValue) >= 0 && Number(breakpointInputValue) <= 0xFF))) {
            valid = true;
        }
        else if (breakpointType == "memory" &&
            ((Number(breakpointInputValue) >= 0 && Number(breakpointInputValue) <= 0xFFFF)) &&
            ((Number(breakpointInputComparator) >= 0 && Number(breakpointInputComparator) <= 0xFF))) {
            valid = true;
        }

        if (valid) {
            let newRow = document.createElement("tr");

            let newItem = document.createElement("td");
            let newSubItem = document.createElement("input");
            newSubItem.type = "checkbox";
            newItem.appendChild(newSubItem);
            newRow.appendChild(newItem);

            newItem = document.createElement("td");
            newItem.textContent = breakpointType;
            newRow.appendChild(newItem);

            newItem = document.createElement("td");
            newItem.textContent = breakpointInputValue.concat(" ", breakpointOperator.concat(" ", breakpointInputComparator));
            newRow.appendChild(newItem);

            newItem = document.createElement("td");
            newSubItem = document.createElement("i");
            newSubItem.classList.add()
            newSubItem.classList.add("fa-solid");
            newSubItem.classList.add("fa-trash");
            newItem.appendChild(newSubItem);
            newRow.appendChild(newItem);

            newSubItem.addEventListener("click", () => { newRow.remove() });

            breakpointController.appendChild(newRow);
        }
        else {
            breakpointControls.style.backgroundColor = "red";
        }
    }
}

// Memory Watch
// let memoryViewerSubmit = document.getElementById("memory-viewer-submit");
// memoryViewerSubmit.addEventListener("click", () => {
//     let memoryViewerInput = document.getElementById("memory-viewer-input");
//     let memoryViewer = document.getElementById("memory-viewer");
//     let newWatch = document.createElement("div");
//     memoryViewer.appendChild(newWatch);
//     newWatch.id = "0x".concat(memoryViewerInput.value, "");
//     // newWatch.classList.add("debug-tool");
//     newWatch.classList.add("memory-watch");
//     newWatch.textContent = "null";
//     memoryViewerInput.value = "";
// });

// FPS Counter
let framesSinceLastCheck = 0;
setInterval(() => {
    document.getElementById("fps").textContent = document.getElementById("frames-elapsed").value - framesSinceLastCheck;
    framesSinceLastCheck = document.getElementById("frames-elapsed").value;
}, 1000);



let breakpointType = document.getElementById("breakpoint-type");
breakpointType.addEventListener("change", changeBreakpointType)

function changeBreakpointType() {
    let breakpointType = document.getElementById("breakpoint-type").value;
    if (breakpointType == "opcode" | breakpointType == "program-counter") {
        document.getElementById("breakpoint-comparison").style.display = "none";
        document.getElementById("breakpoint-input-comparator").style.display = "none";
    }
    else if (breakpointType == "memory") {
        document.getElementById("breakpoint-comparison").style.display = "inline";
        document.getElementById("breakpoint-input-comparator").style.display = "inline";
    }
}


