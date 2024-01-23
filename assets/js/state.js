'use strict'

var pixelMap = new pixelMapClass(document.getElementById("selection-drop-indicator"), document.getElementById("selection-drop-indicator-vert"), document.getElementById("selection-drop-indicator-horiz"))

var appState = {

    inputThrottleTimer: null,
    mouseMode: 0,
    mouseMoveEvent: eventWorkspaceMouseMoveDefault,
    mouseDownEvent: eventWorkspaceMouseDownDefault,
    mouseUpEvent: eventWorkspaceMouseUpDefault,
    mouseClickEvent: null,
    pixelArray: [],
    copyBuffer: [],
    groupSelected: [], //html collection
    groupW: 0,
    groupH: 0,
    dragging: false,
    merging: false,
    modalCallback: {},
    loadFileName: "map-file",
    loadFileFullName: "none",
    zoomValue: 1,
    contextOpen: false,
    actionTargetID: undefined,
    undoStack: [],
    undoStackIndex: 0,
    saveCount: 0,
    prevPixelArray: [],
    modalOpen: false,
    queryAllMatrix: false,
    grid: {
        size: 32, //in pixels
        width: 32, //in cells
        height: 32, //in cells
        subDivide: 4 //in cells
    },
    coord: {
        x: 0,
        y: 0,
        prevX: 0,
        prevY: 0,
        yGrid: 0,
        xGrid: 0,
        startX: 0,
        startY: 0
    }
}


//Init
document.getElementById("workspace").addEventListener('mousemove', eventMouseMove);
document.getElementById("workspace").addEventListener("mousedown", eventMouseDown);
// document.getElementById("workspace").addEventListener("click", eventMouseClick);

document.addEventListener("mouseup", function (event) {
    // console.log("MOUSE UP")
    if (typeof appState.mouseUpEvent === 'function') appState.mouseUpEvent(event);
});

uxFillSettingsElements();
pixelWorkspaceRender(); //run after initialization

//=================================================================================================================================

function stateSavePixelMapFile() {
    console.log("stateSavePixelMapFile()")
    var a = document.createElement("a");
    // console.log(appState.pixelArray)

    let format = document.getElementById("tools-dropdown-format").options[document.getElementById("tools-dropdown-format").selectedIndex].getAttribute('data-val');

    let saveStr;
    let extension;
    console.log(format)
    if (format == "nledlegacy") {
        saveStr = appState.pixelArray.length + "\t" + appState.grid.size + "\t" + appState.grid.width + "\t" + appState.grid.height + "\n";
        for (let i = 0; i < appState.pixelArray.length; i++) {
            saveStr += (Number(appState.pixelArray[i].x) + 1) + "\t" + (Number(appState.pixelArray[i].y) + 1) + "\n"; //convert from base 0 to base 1
        }
        extension = ".pixelmap";
    }
    else if (format == "json") {
        let jsonMap = JSON.parse(JSON.stringify(appState.pixelArray)); //deep copy
        let jsonArr = []; //better to store the coordinates as an array rather than objects
        for (const i in jsonMap) {
            jsonMap[i].x++; //convert from base 0 to base 1
            jsonMap[i].y++;
            jsonArr.push([jsonMap[i].x, jsonMap[i].y]);
        }
        let saveObj = {
            settings: {
                gridWidth: appState.grid.width,
                gridHeight: appState.grid.height,
                gridSize: appState.grid.size,
                length: appState.pixelArray.length
            },
            map: jsonArr
        }

        saveStr = JSON.stringify(saveObj);
        extension = ".json";
    }

    let userFileName = document.getElementById("field-file-name").value;
    if (userFileName === "") userFileName = "pixel-map-" + appState.saveCount;

    a.href = window.URL.createObjectURL(new Blob([saveStr], { type: "text/plain" }));
    a.download = userFileName + extension;

    appState.saveCount++;

    if (appState.queryAllMatrix) {
        let socketCMD = new WebSocket('ws://localhost:8092'); //static port number of NLED AllMatrix node server

        socketCMD.addEventListener('error', (event) => {
            console.log('Node Command Server Error')
            messagePush("Map file save failed. AllMatrix server not found.");
            uxModalOpen("modal-allmatrixfail");
        });

        socketCMD.addEventListener('open', (event) => {
            console.log('Node Command Server Connected')
            let msgObj = { cmdID: 8, name: userFileName, extension: extension, data: saveStr }
            socketCMD.send(JSON.stringify(msgObj));
        });

        socketCMD.addEventListener('message', (event) => {
            console.log(event)
            if (event.data == "SAVESUCCESS") messagePush("Map file save successful")
        });
    }
    else a.click();
}

//=================================================================================================================================




window.addEventListener('DOMContentLoaded', (event) => {
    uxModalInit();

    let contextActions = document.getElementById("context-menu-action-list").querySelectorAll('li');
    //  console.log(contextActions)
    for (const elem of contextActions) {
        // console.log(i,contextActions[i])
        elem.addEventListener('click', function (e) {
            e.stopPropagation();
            e.preventDefault();
            console.log("Context-menu ITEM clicked", this.getAttribute('data-val'))
            eventExecuteContextAction(this.getAttribute('data-val'));
        });
    }

    setInterval(stateUndoRedo, 30); //rather than run each action, run timer to log state changes for undo/redo

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    console.log("queryString:", queryString);
    if (urlParams.get("allmatrix") == 'true') {
        console.log("Launched from NLED AllMatrix")
        appState.queryAllMatrix = true;

    }
});

appState.modalCallback.genwizard = function () {
    console.log("render gen wizard")
}

appState.grid.size = 32; //set to default of 32px