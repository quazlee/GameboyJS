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
        this.breakpointTable = document.getElementById("breakpoint-table");

        this.debugLog = document.getElementById("log");

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

    debugRomOutput(cpu) {
        if (cpu.memory.readMemory(0xFF02) == 0x0081) {
            let debugElement = document.getElementById("debug");
            let debugText = debugElement.textContent;
            let nextCharacter = cpu.memory.readMemory(0xFF01);
            debugText.concat("", nextCharacter)
            console.log(nextCharacter);
        }
    }

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
        let pattern = /[0-9A-F]/g;

        this.breakpointControls.style.backgroundColor = "";

        let breakpointType = document.getElementById("breakpoint-type").value;
        let breakpointOperation = document.getElementById("breakpoint-comparison").value;
        let breakpointValueTwo = document.getElementById("breakpoint-value-two").value.toUpperCase();
        let breakpointValueOne = document.getElementById("breakpoint-value-one").value.toUpperCase();

        let breakpointController = document.getElementById("breakpoint-table-body");

        let validOne = true;
        let validTwo = true
        if ((breakpointType == "opcode" || breakpointType == "program-counter") &&
            (breakpointValueTwo == "" ||
                breakpointValueTwo.length != breakpointValueTwo.match(pattern).length ||
                breakpointValueTwo.length > 4)) {
            validTwo = false;
        }
        if (breakpointType == "memory" &&
            (breakpointValueOne == "" ||
                breakpointValueOne.length != breakpointValueOne.match(pattern).length ||
                breakpointValueOne.length > 4)) {
            validOne = false;
        }
        if (breakpointType == "memory" &&
            (breakpointValueTwo == "" ||
                breakpointValueTwo.length != breakpointValueTwo.match(pattern).length ||
                breakpointValueTwo.length > 2)) {
            validTwo = false;
        }

        if (validOne && validTwo) {
            let newRow = document.createElement("tr");
            newRow.setAttribute("type", breakpointType);
            newRow.setAttribute("valueTwo", breakpointValueTwo);
            newRow.setAttribute("operation", breakpointOperation);
            if (breakpointType == "memory") {
                newRow.setAttribute("valueOne", breakpointValueOne);
            }

            let newItem = document.createElement("td");
            let newSubItem = document.createElement("input");
            newSubItem.type = "checkbox";
            newItem.appendChild(newSubItem);
            newRow.appendChild(newItem);

            newItem = document.createElement("td");
            newItem.classList.add("breakpoint-type");
            newItem.textContent = breakpointType;
            newRow.appendChild(newItem);

            newItem = document.createElement("td");
            newItem.classList.add("breakpoint-value");
            if (breakpointType == "opcode") {
                newItem.textContent = breakpointValueOne.concat(" ", breakpointOperation.concat(" ", breakpointValueTwo));
            }
            else if (breakpointType == "program-counter") {
                newItem.textContent = breakpointValueOne.concat(" ", breakpointOperation.concat(" ", breakpointValueTwo));
            }
            else if (breakpointType == "memory") {
                newItem.textContent = breakpointValueOne.concat(" ", breakpointOperation.concat(" ", breakpointValueTwo));
            }
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
    }

    getBreakpoints() {
        this.breakPoints = [];
        let breakpointValues = this.breakpointTable.getElementsByClassName("breakpoint-value");
        let breakpointTypes = this.breakpointTable.getElementsByClassName("breakpoint-type");
        for (let i = 0; i < breakpointValues.length; i++) {
            // this.breakPoints.push({
            //     "type" = 
            // });

        }
    }

    checkBreakpointsOpcode() {
        let opcode = this.cpu.currentOpcode;
        this.breakpointTable.querySelectorAll("tr[type='opcode']")

    }

    checkBreakpointsProgramCounter() {
        let programCounter = this.cpu.programCounter;
        this.breakpointTable.getElementsByClassName("breakpoint-entry");
    }

    checkBreakpointsOpcodeMemory() {
        this.breakpointTable.getElementsByClassName("breakpoint-entry");
    }

    logger(){
        let format2 = function (input) {
            let number = input.toString(16);
            let digits = 2 - number.length;
            for (let i = 0; i < digits; i++) {
                number = "0".concat(number);
            }
            return number.toUpperCase();
        }

        let format4 = function (input) {
            let number = input.toString(16);
            let digits = 4 - number.length;
            for (let i = 0; i < digits; i++) {
                number = "0".concat(number);
            }
            return number.toUpperCase();
        }

        let output = this.debugLog.value;
        output += 
        "A: " + format2(this.cpu.registers.getRegister(registerID.A)) + 
        " F: " + format2(this.cpu.registers.getRegister(registerID.F)) + 
        " B: " + format2(this.cpu.registers.getRegister(registerID.B)) + 
        " C: " + format2(this.cpu.registers.getRegister(registerID.C)) + 
        " D: " + format2(this.cpu.registers.getRegister(registerID.D)) + 
        " E: " + format2(this.cpu.registers.getRegister(registerID.E)) + 
        " H: " + format2(this.cpu.registers.getRegister(registerID.H)) + 
        " L: " + format2(this.cpu.registers.getRegister(registerID.L)) + 
        " SP: " + format4(this.cpu.stackPointer) + 
        " PC: 00:" + format4(this.cpu.programCounter) + " (" + 
        format2(this.memory.readMemory(this.cpu.programCounter)) + " " +
        format2(this.memory.readMemory(this.cpu.programCounter + 1)) + " " +
        format2(this.memory.readMemory(this.cpu.programCounter + 2)) + " " +
        format2(this.memory.readMemory(this.cpu.programCounter + 3)) + ")" + 
        "\r\n";

        this.debugLog.value = output;

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
        document.getElementById("breakpoint-value-one").style.display = "none";
    }
    else if (breakpointType == "memory") {
        document.getElementById("breakpoint-value-one").style.display = "inline";
    }
}




