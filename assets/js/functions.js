'use strict'

//======================================================================================================

function uxFillSettingsElements() {
    document.getElementById("grid-width-field").value = appState.grid.width;
    document.getElementById("grid-height-field").value = appState.grid.height;
    // document.getElementById("grid-size-field").value = appState.grid.size;
    document.getElementById("grid-divider-field").value = appState.grid.subDivide;
}



//======================================================================================================

function helperGetWorkspaceOffset(e) {
    let x = e.offsetX;
    let y = e.offsetY;
    if (e.target.id != "workspace") {
        x = e.offsetX + e.target.offsetLeft;
        y = e.offsetY + e.target.offsetTop;
    }
    return [x, y];
}

//======================================================================================================

function helperDeSelectGroup() {
    console.log("helperDeSelectGroup()");
    var pixels = document.getElementById("main-workspace-pixels").children;
    for (let i = 0; i < pixels.length; i++) {
        pixels[i].classList.remove("pixelSelected");
    }
    appState.groupSelected = [];
}

//======================================================================================================
function messagePush(msg) {
    document.getElementById("message-terminal").innerHTML = msg + "<br>" + document.getElementById("message-terminal").innerHTML;
}

//======================================================================================================

function generationWizard() {
    let mode = document.getElementById("modal-genwizard-input-mode").options[document.getElementById("modal-genwizard-input-mode").selectedIndex].getAttribute("data-val");;
    let w = Number(document.getElementById("modal-genwizard-input-width").value);
    let h = Number(document.getElementById("modal-genwizard-input-height").value);

    console.log("generationWizard()", mode, w, h)
    helperDeSelectGroup();
    //if(ADD or RESET)

    w--; //base 0
    h--;

    let genX = 0;
    let genY = 0;

    let idList = [];

    const addPixel = function (x, y) {
        let nextPixelID = pixelMap.iconGetNextSlot();
        if (nextPixelID == (appState.pixelArray.length - 1)) {
            appState.pixelArray.push({ x: x, y: y });
        }
        else appState.pixelArray[nextPixelID] = { x: x, y: y }; //temp values until the pixelIcons are dropped into the grid
        idList.push(nextPixelID);
    }


    // const addPixel = function (x, y) {
    //     let nextPixelID = pixelMap.iconGetNextSlot();
    //     if (nextPixelID == (appState.pixelArray.length - 1)) {
    //         appState.pixelArray.push({ x: x, y: y });
    //         appState.groupSelected.push({id:nextPixelID,x:x,y:y});
    //     }
    //     else {
    //         appState.pixelArray[nextPixelID] = { x: x, y: y }; //temp values until the pixelIcons are dropped into the grid
    //         appState.groupSelected[nextPixelID] = {id:nextPixelID,x:x,y:y};
    //     }
    // }

    // const addPixel = function (x, y) {
    //     let nextPixelID = pixelMap.iconGetNextSlot();
    //     if (nextPixelID == (appState.pixelArray.length - 1)) {
    //         appState.copyBuffer.push({ x: x, y: y, elem: undefined  });
    //     }
    //     else appState.copyBuffer[nextPixelID] = { x: x, y: y, elem: undefined }; //temp values until the pixelIcons are dropped into the grid
    // }


    appState.groupSelected = [];
    appState.copyBuffer = [];

    switch (mode) {
        case 'snake-b-ltor':
            genX = 0;//left
            genY = h; //bottom

            for (let i = 0; i < ((w + 1) * (h + 1)); i++) {
                addPixel(genX, genY);

                if (genY % 2 == 1) {
                    genX++;
                    if (genX > w) {
                        genX = w;
                        genY--;
                    }
                }
                else {
                    genX--;
                    if (genX == -1) {
                        genX = 0;
                        genY--;
                    }
                }
            }
            break;
        case 'snake-b-rtol':


            break;
    }

    // pixelMap.iconMerge();

    pixelWorkspaceRender();

    for (const i in idList) {
        let obj = {
            id: idList[i],
            x: appState.pixelArray[idList[i]].x,
            y: appState.pixelArray[idList[i]].y,
            elem: document.getElementById("pixel-" + idList[i])
        }

        appState.copyBuffer.push(obj);
        appState.groupSelected.push(obj);
        obj.elem.classList.add('pixelSelected');
    }
    let fakeEvent = {
        target: {
            id: appState.copyBuffer[0].elem.id
        }
    }
    workspaceActionDragGroup(fakeEvent);
    uxModalClose();
    console.log(appState.copyBuffer)
    console.log(appState.groupSelected)
}

//======================================================================================================

function loadMapFile(data, method, extension) {
    console.log("loadMapFile()", method, extension)

    let arr;
    let settings;
    if (extension == "pixelmap" || extension == "txt") {

        arr = data.split("\n").map(function (row) { return row.split("\t"); }); //make 2D array from file
        settings = data.slice(0, data.indexOf("\n")).split("\t");
        settings = settings.map(Number);
        console.log(settings)
        //not porting the header info, not consistent
        // try {
        // appState.grid.length = settings[0];
        // if(!isNaN(settings[1])) appState.grid.size = 32;// set to default //settings[1];
        // if(!isNaN(settings[2]))  appState.grid.width =  settings[2];
        // if(!isNaN(settings[3]))  appState.grid.height =  settings[3];
        // }
        // catch(e) {}

        if (method == 'load') {
            appState.pixelArray = [];

            arr.forEach(function (val, index) {
                if (val.length == 1 || val.length > 2) {
                    console.log("either first line or error with coordinate entry");
                }
                else {
                    appState.pixelArray.push({ x: (parseInt(val[0]) - 1), y: (parseInt(val[1]) - 1) }); //build the coordinates as string, and trim any CR/LF/etc
                }
            });

            //since settings are not applied, calculate and set the grid width/height so it properly the loaded data fits
            pixelMap.getGroupSize(appState.pixelArray);
            appState.grid.width = appState.groupW;
            appState.grid.height = appState.groupH;

            pixelWorkspaceRender();
        }
        else if (method == 'merge') {
            appState.copyBuffer = [];
            arr.forEach(function (val, index) {
                if (val.length == 1 || val.length > 2) {
                    console.log("either first line or error with coordinate entry");
                }
                else {
                    appState.copyBuffer.push({ x: parseInt(val[0]) - 1, y: parseInt(val[1]) - 1, elem: undefined }); //convert from base 1 to base 0
                }
            });
            pixelMap.iconMerge();
        }
    }
    else if (extension == "json") {
        let jsonParsed = JSON.parse(data);

        if (jsonParsed.hasOwnProperty('settings')) {
            appState.grid.size = 32;//set to default //jsonParsed.settings.size;
            appState.grid.width = jsonParsed.settings.width;
            appState.grid.height = jsonParsed.settings.height;
            appState.grid.length = jsonParsed.settings.length;
        }

        if (method == 'load') {
            appState.pixelArray = JSON.parse(JSON.stringify(jsonParsed.map)); //deep copy
            pixelWorkspaceRender();
        }
        else if (method == "merge") {
            appState.copyBuffer = JSON.parse(JSON.stringify(jsonParsed.map)); //deep copy
            pixelMap.iconMerge();
        }
    }

    uxFillSettingsElements();
}

//======================================================================================================

function pixelWorkspaceRender(renderPixels = true) {
    console.log("pixelWorkspaceRender()");
    document.getElementById("workspace-dividers").innerHTML = "";
    document.getElementById("main-workspace-topbar").innerHTML = `<div class="topAxisLabel spacer" style=""></div>`; //start with shim div
    document.getElementById("main-workspace-sidebar").innerHTML = "";
    //document.getElementById("workspace-container").style.width = (appState.grid.size * appState.grid.width) + 50 + 50+ "px"; //50 is the width of the sidebar
    // document.getElementById("workspace-container").style.height = (appState.grid.size * appState.grid.height) + 50 + "px";

    if (renderPixels) {
        document.getElementById("main-workspace-pixels").innerHTML = "";
        let pixelsCont = document.getElementById("main-workspace-pixels");

        for (let i = 0; i < appState.pixelArray.length; i++) {
            if (!isNaN(appState.pixelArray[i].x) && !isNaN(appState.pixelArray[i].y)) {
                let pixElem = pixelMap.iconCreate(i);
                pixelsCont.insertAdjacentElement('beforeend', pixElem);
            }
        }
    }
    for (let i = 0; i < appState.grid.width; i++) {
        if ((i % appState.grid.subDivide) == 0) document.getElementById("workspace-dividers").innerHTML += `<div class="columnLine" style="left: ${(i * appState.grid.size)}px;"></div>`;
        let labelElem = document.createElement('div');
        labelElem.classList = "topAxisLabel";
        labelElem.innerText = (i + 1);
        document.getElementById("main-workspace-topbar").insertAdjacentElement('beforeend', labelElem);

    }
    for (let i = 0; i < appState.grid.height; i++) {
        if ((i % appState.grid.subDivide) == 0) document.getElementById("workspace-dividers").innerHTML += `<div class="rowLine" style="top: ${(i * appState.grid.size)}px;"></div>`
        let labelElem = document.createElement('div');
        labelElem.classList = "sideAxisLabel";
        labelElem.innerText = (i + 1);
        document.getElementById("main-workspace-sidebar").insertAdjacentElement('beforeend', labelElem);
    }

    document.getElementById("workspace-dividers").innerHTML += `<div class="columnLine" style="left: ${(appState.grid.width * appState.grid.size)}px;"></div>`;
    document.getElementById("workspace-dividers").innerHTML += `<div class="rowLine" style="top: ${(appState.grid.height * appState.grid.size)}px;"></div>`

    pixelWorkspaceUpdate();
}

//======================================================================================================

function pixelWorkspaceUpdate() {
    console.log("pixelWorkspaceUpdate()");

    for (let i = 0; i < appState.pixelArray.length; i++) {
        if (!isNaN(appState.pixelArray[i].x) && !isNaN(appState.pixelArray[i].y)) {
            document.getElementById("pixel-" + i).style.left = ((appState.pixelArray[i].x) * appState.grid.size) + "px";
            document.getElementById("pixel-" + i).style.top = ((appState.pixelArray[i].y) * appState.grid.size) + "px";
        }
    }
    document.getElementById("pixel-quantity-value").innerText = appState.pixelArray.length; //may not be accurate if coordinate slots are empty



}

//======================================================================================================


//should add setter function for appState.pixelArray but this is easier
function stateUndoRedo() {
    let current = JSON.stringify(appState.pixelArray);

    if (current != appState.undoStack[appState.undoStackIndex]) {
        console.log("pushing undo stack")
        appState.undoStack.push(JSON.stringify(appState.pixelArray));
        if (appState.undoStack.length > 25) {
            appState.undoStack.shift(); //remove the oldest
        }
        appState.undoStackIndex = appState.undoStack.length - 1;
        console.log("UndoStack:", appState.undoStack.length)
    }
}


//======================================================================================================
