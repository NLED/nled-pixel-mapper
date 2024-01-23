'use strict'

//======================================================================================================

function eventMouseMove(event) {
    if (eventThrottle(15)) return;
    if (appState.contextOpen) return;
    appState.coord.x = helperGetWorkspaceOffset(event)[0];
    appState.coord.y = helperGetWorkspaceOffset(event)[1];

    appState.coord.gridX = (Math.floor(appState.coord.x / appState.grid.size));
    appState.coord.gridY = (Math.floor(appState.coord.y / appState.grid.size));

    appState.coord.snapX = (Math.floor(appState.coord.x / appState.grid.size) * appState.grid.size);
    appState.coord.snapY = (Math.floor(appState.coord.y / appState.grid.size) * appState.grid.size);

    if (typeof appState.mouseMoveEvent === 'function') appState.mouseMoveEvent(event);

    appState.coord.xPrev = appState.coord.x;
    appState.coord.yPrev = appState.coord.y;
}

//======================================================================================================

function eventMouseDown(event) {
    // console.log("MOUSE DOWN", appState.contextOpen);
    if (appState.contextOpen) return;
    if (typeof appState.mouseDownEvent === 'function') appState.mouseDownEvent(event);
}

//======================================================================================================

function eventMouseUp(event) {
    // console.log("MOUSE UP", appState.contextOpen);
    if (appState.contextOpen) return;
    if (typeof appState.mouseUpEvent === 'function') appState.mouseUpEvent(event);
}

//======================================================================================================

// function eventMouseClick(event) {
//     console.log("MOUSE CLICK");
//     if (appState.contextOpen) return;
//     if (typeof appState.mouseClickEvent === 'function') appState.mouseClickEvent(event);
// }

//======================================================================================================

function eventWorkspaceDefaultEvents() {
    appState.mouseMoveEvent = eventWorkspaceMouseMoveDefault;
    // appState.mouseClickEvent = eventWorkspaceMouseClickDefault;
    appState.mouseDownEvent = eventWorkspaceMouseDownDefault;
    appState.mouseUpEvent = eventWorkspaceMouseUpDefault;
}

//======================================================================================================

function eventWorkspaceMouseMoveDefault(event) {
    pixelMap.setIndicator(appState.coord.gridX, appState.coord.gridY, pixelMap.iconCheckOverlap(appState.coord.gridX, appState.coord.gridY, []))
    if (appState.coord.startX != appState.coord.gridX || appState.coord.startY != appState.coord.gridY) {
        if (event.buttons == 1) workspaceActionGroupSelection(event);//primary mouse button helpd pressed, start icon goup selection
    }
}

//======================================================================================================

function eventWorkspaceMouseUpDefault(event) {
    // console.log("UP DEFAULT")
    if (appState.coord.startX == appState.coord.gridX && appState.coord.startY == appState.coord.gridY) pixelMap.iconPlace(appState.coord.gridX, appState.coord.gridY);
    document.getElementById("tools-button-enable-placedrag").classList.remove('selected')
    eventWorkspaceDefaultEvents();
}

//======================================================================================================

function eventWorkspaceMouseDownDefault(event) {
    if (event.button == 0 || event.button == 1) {
        //should be button 1, but it is reporting button 0
        // console.log("DOWN DEFAULT-PRIMARY", event.button)
        appState.coord.startX = appState.coord.gridX;
        appState.coord.startY = appState.coord.gridY;

        // console.log(event)
        if (event.target.classList.contains('pixelIcon')) {
            if (event.ctrlKey) {
                //console.log("icon click with ctrl")
                pixelMap.iconAddToGroup(event.target);
            }
            else {
                if (appState.groupSelected.some((e) => e.elem.id == event.target.id)) {
                    workspaceActionDragGroup(event);
                }
                else {
                    //Start Dragging Pixel Icon
                    //console.log("ICON ", event.target);
                    event.stopPropagation();
                    event.preventDefault();
                    workspaceActionDragIcon(event);
                }
            }
        }
    }
}
//======================================================================================================

function workspaceActionDragGroup(event) {
    appState.dragging = true;
    pixelMap.getGroupSize(appState.groupSelected);

    for (let i = 0; i < appState.groupSelected.length; i++) {
        appState.groupSelected[i].restoreX = appState.groupSelected[i].elem.style.left;
        appState.groupSelected[i].restoreY = appState.groupSelected[i].elem.style.top;
    }

    let tarID = event.target.id.split("-")[1];
    let id = appState.groupSelected.findIndex((e) => e.id == tarID);
    // console.log(tarID, id)
    let handleX = (appState.groupSelected[id].x);
    let handleY = (appState.groupSelected[id].y);

    pixelMap.setIndicatorGroupSize(appState.groupSelected);

    appState.mouseMoveEvent = function () {
        // console.log("drag:");
        let outOfBoundsX = false;
        let outOfBoundsY = false;

        //parse all icons to check if any will end up out of bounds of the workspace
        for (const i in appState.groupSelected) {
            let xSnap = ((((appState.groupSelected[i].x + appState.coord.gridX)) - handleX) * appState.grid.size);
            let ySnap = ((((appState.groupSelected[i].y + appState.coord.gridY)) - handleY) * appState.grid.size);
            if (xSnap >= (appState.grid.width * appState.grid.size) || xSnap < 0) { outOfBoundsX = true; break; }
            if (ySnap >= (appState.grid.height * appState.grid.size) || ySnap < 0) { outOfBoundsY = true; break; }
        }
        //if any icons are out of bounds do not move them
        // if (outOfBoundsX == false) {
        let xSnap, ySnap;
        for (const i in appState.groupSelected) {
            xSnap = ((((appState.groupSelected[i].x + appState.coord.gridX)) - handleX) * appState.grid.size);
            ySnap = ((((appState.groupSelected[i].y + appState.coord.gridY)) - handleY) * appState.grid.size);
            appState.groupSelected[i].elem.style.left = xSnap + "px";
            appState.groupSelected[i].elem.style.top = ySnap + "px";
            //console.log("SNAP:", appState.groupSelected[i], xSnap, ySnap);
        }
        pixelMap.setIndicator((appState.coord.gridX - handleX), (appState.coord.gridY - handleY), pixelMap.iconCheckOverlapGroup(appState.groupSelected));
        // }
    } //end mouseMove

    appState.mouseUpEvent = function () {
        console.log("Dragging Group released");
        if (appState.merging) {
            if (pixelMap.iconCheckOverlapGroup(appState.groupSelected)) return;
        }

        appState.merging = false;
        appState.dragging = false;

        pixelMap.setIndicatorGridSize(); //restore pixel indicator size

        if (!pixelMap.iconCheckOverlapGroup(appState.groupSelected)) {
            //update coordinates to appState.pixelArray[]
            for (let i = 0; i < appState.groupSelected.length; i++) {
                let xDrag = Math.floor(parseInt(appState.groupSelected[i].elem.style.left, 10) / appState.grid.size);
                let yDrag = Math.floor(parseInt(appState.groupSelected[i].elem.style.top, 10) / appState.grid.size);
                let pixID = appState.groupSelected[i].elem.id.split('-')[1];
                appState.pixelArray[pixID] = { x: xDrag, y: yDrag };
            }
        }
        else {
            //overlap detected, restore group positions and cancel move
            console.log("Group Drag overlaps");
            messagePush("A Pixel Icon In The Group Overlaps")

            for (let i = 0; i < appState.groupSelected.length; i++) {
                appState.groupSelected[i].elem.style.left = appState.groupSelected[i].restoreX;// + "px";
                appState.groupSelected[i].elem.style.top = appState.groupSelected[i].restoreY;//yRestore[i] + "px";
                appState.groupSelected[i].elem.classList.add('pixelIconTransition');
            }
            pixelWorkspaceUpdate();

            setTimeout(function () {
                for (let i = 0; i < appState.groupSelected.length; i++)  appState.groupSelected[i].elem.classList.remove('pixelIconTransition');
            }, 600)
        }
        eventWorkspaceDefaultEvents();
    }
    appState.mouseMoveEvent();
}

//======================================================================================================

function workspaceActionGroupSelection(event) {
    helperDeSelectGroup();
    let box = document.getElementById("workspace-selectionbox")

    let x1 = (appState.coord.startX) * appState.grid.size;//Set the initial X in pixels
    let y1 = (appState.coord.startY) * appState.grid.size;//Set the initial Y in pixels

    let x2, y2 = 0;
    pixelMap.indicator.style.display = 'none';

    appState.mouseMoveEvent = function () {
        if (x1 < appState.coord.x) {
            box.style.left = x1 + 'px';
            box.style.width = (appState.coord.snapX - x1) + appState.grid.size + 'px';
        }
        else {
            box.style.left = appState.coord.snapX + 'px';
            box.style.width = (x1 - appState.coord.snapX) + appState.grid.size + 'px';
        }

        if (y1 < appState.coord.y) {
            box.style.top = y1 + 'px';
            box.style.height = (appState.coord.snapY - y1) + appState.grid.size + 'px';
        }
        else {
            box.style.top = appState.coord.snapY + 'px';
            box.style.height = (y1 - appState.coord.snapY) + appState.grid.size + 'px';
        }
        box.hidden = false;
    }

    appState.mouseUpEvent = function () {
        var inputElements = document.getElementById("main-workspace-pixels");
        var bounding = box.getBoundingClientRect();
        appState.groupSelected = [];
        const snap = (val) => (Math.floor(val / appState.grid.size) * appState.grid.size);

        for (let i = 0; i < inputElements.children.length; i++) {
            var element = inputElements.children[i];
            var elementBox = element.getBoundingClientRect();
            //console.log(snap(bounding.left, snap(elementBox.left), snap(bounding.top),snap(elementBox.top), snap(bounding.right),snap(elementBox.right),snap(bounding.bottom),snap(elementBox.bottom)))

            if (snap(bounding.left) <= snap(elementBox.left) && snap(bounding.top) <= snap(elementBox.top)) {
                if (snap(bounding.right) >= snap(elementBox.right) && snap(bounding.bottom) >= snap(elementBox.bottom)) {
                    pixelMap.iconAddToGroup(element);
                }
            }
        } //end for()

        // console.log(appState.groupSelected)
        eventWorkspaceDefaultEvents();
        pixelMap.indicator.style.removeProperty('display');
        box.hidden = true;
    }
}

//======================================================================================================

function workspaceActionDragIcon(event) {
    helperDeSelectGroup();
    appState.dragging = true;
    let pixID = event.target.id.split('-')[1];

    appState.mouseMoveEvent = function () {
        //console.log("Dragging icon ", event.target.id, appState.coord.gridX, appState.coord.gridY);
        pixelMap.setIndicator(appState.coord.gridX, appState.coord.gridY, pixelMap.iconCheckOverlap(appState.coord.gridX, appState.coord.gridY, [pixID]))
        event.target.style.left = appState.coord.snapX + "px";
        event.target.style.top = appState.coord.snapY + "px";
    }

    appState.mouseUpEvent = function () {
        // console.log("Dragging Icon released");
        appState.dragging = false;
        if (pixelMap.iconCheckOverlap(appState.coord.gridX, appState.coord.gridY, [pixID])) {
            //invald drop
            messagePush("Pixel Icon Overlaps")
            event.target.classList.add('pixelIconTransition');
            event.target.addEventListener("transitionend", () => { event.target.classList.remove('pixelIconTransition'); });
            pixelWorkspaceUpdate();
        }
        else {
            //valid drop, apply change
            appState.pixelArray[pixID] = { x: appState.coord.gridX, y: appState.coord.gridY };
            pixelWorkspaceUpdate();
        }
        eventWorkspaceDefaultEvents();
    }
}

//======================================================================================================

function eventThrottle(time = 25) {
    if (appState.inputThrottleTimer == null) {
        appState.inputThrottleTimer = setTimeout(function () {
            clearTimeout(appState.inputThrottleTimer);
            appState.inputThrottleTimer = null;
        }, time);
        return false;
    }
    else return true;
}

function eventToggleSelected(elem) {
    if (elem.classList.contains("selected")) elem.classList.remove("selected");
    else elem.classList.add("selected");
}

//======================================================================================================

document.getElementById("tools-button-help").addEventListener('click', function (event) {
    uxModalOpen('modal-help');
});

document.getElementById("tools-button-secondaryhelp").addEventListener('click', function (event) {
    uxModalOpen('modal-help');
});

document.getElementById("tools-button-reset").addEventListener('click', function (event) {
    console.log("Reset")
    uxModalOpen("modal-reseticons")
});

document.getElementById("modal-reseticons-confirm").addEventListener('click', function (event) {
    appState.pixelArray = [];
    pixelWorkspaceRender();
    uxModalClose();
});

document.getElementById("tools-button-load-merge").addEventListener('click', function (event) {
    console.log("Load map file to merge")
    document.getElementById('input-load-mergefile').click()

});
document.getElementById("tools-button-enable-placedrag").addEventListener('click', function () {
    console.log("Enable Drag to Place")
    eventToggleSelected(this);

    if (this.classList.contains("selected")) {
        appState.mouseMoveEvent = function (event) {
            // if (eventThrottle(15)) return;
            pixelMap.setIndicator(appState.coord.gridX, appState.coord.gridY, pixelMap.iconCheckOverlap(appState.coord.gridX, appState.coord.gridY, []))
            if (event.buttons == 1) {
                //primary mouse button is pressed
                // if (event.shiftKey) console.log("SHIFT") //want to stay aligned to X or Y if shift is held
                pixelMap.iconPlace(appState.coord.gridX, appState.coord.gridY); //will return if icon is already in grid coordinates
            }
        }
    }
    else eventWorkspaceDefaultEvents();
});

document.getElementById("tools-button-generation-wizard").addEventListener('click', function (e) {
    console.log("Open Map Generation Modal")
    uxModalOpen('modal-genwizard')
});

document.getElementById("modal-allmatrixfail-confirm").addEventListener('click', function (e) {
    appState.queryAllMatrix = false;
    uxModalClose();
});



//======================================================================================================

document.getElementById("modal-genwizard-input-generate").addEventListener('click', generationWizard);

document.getElementById("grid-width-field").addEventListener('change', function (e) {
    appState.grid.width = this.value;
    pixelWorkspaceRender(false);
});

document.getElementById("grid-height-field").addEventListener('change', function (e) {
    appState.grid.height = this.value;
    pixelWorkspaceRender(false);
});
document.getElementById("grid-divider-field").addEventListener('change', function (e) {
    appState.grid.subDivide = this.value;
    pixelWorkspaceRender(false);
});

//======================================================================================================
/*
static default size
document.getElementById("grid-size-field").addEventListener('input', function () {
    appState.grid.size = this.value;
    document.getElementById("workspace").style.width = (appState.grid.size * appState.grid.width) + "px";
    document.getElementById("workspace").style.height = (appState.grid.size * appState.grid.height) + "px";
    document.getElementById("main-workspace-pixels").style.fontSize = (appState.grid.size / 2.5) + "px"
    var r = document.querySelector(':root');
    r.style.setProperty('--gridSize', (appState.grid.size + "px"));
    r.style.setProperty('--gridSizePx', ((appState.grid.size - 6) + "px"));
    r.style.setProperty('--pixelBorderSz', (appState.grid.size / 2) + "px");
    pixelWorkspaceRender();
});
*/
//======================================================================================================

document.getElementById("input-load-file").addEventListener('change', function (event) {
    var file = document.getElementById("input-load-file").files[0]
    appState.loadFileFullName = file.name;
    appState.loadFileExtension = file.name.split(".")[1];
    appState.loadFileName = appState.loadFileFullName.split('.').slice(0, -1).join('.');
    document.getElementById("field-file-name").value = appState.loadFileName
    console.log(appState.loadFileFullName, appState.loadFileName); appState.loadFileExtension = file.name.split(".")[1];
    const reader = new FileReader();
    reader.onload = function (e) {
        loadMapFile(e.target.result, 'load', appState.loadFileExtension);
        document.getElementById("tools-loaded-file-path").innerText = file.name;
    };
    reader.readAsText(file);
});

//======================================================================================================

document.getElementById("input-load-mergefile").addEventListener('input', function (event) {
    //console.log(document.getElementById("input-load-file").files);
    var file = document.getElementById("input-load-mergefile").files[0]
    appState.loadFileFullName = file.name;
    appState.loadFileExtension = file.name.split(".")[1];
    appState.loadFileName = appState.loadFileFullName.split('.').slice(0, -1).join('.')
    document.getElementById("input-load-mergefile").innerText = appState.loadFileFullName;
    console.log("Merge:", appState.loadFileFullName, appState.loadFileName);
    const reader = new FileReader();
    reader.onload = function (e) {
        loadMapFile(e.target.result, 'merge', appState.loadFileExtension);
    };
    reader.readAsText(file);
    this.value = null; //reset the file input element or it won't fire again if the same file is loaded
});

//======================================================================================================

document.getElementById("tools-button-load-file").addEventListener('click', function (event) {
    document.getElementById('input-load-file').click()
});

//======================================================================================================

// document.getElementById("main-tools").addEventListener('click', function (event) {
//console.log(appState.pixelArray)
//document.getElementById("pixel-quantity-field").innerText = appState.pixelArray.length;
// });

//======================================================================================================

document.getElementById("tools-button-save-file").addEventListener('click', () => stateSavePixelMapFile());

//======================================================================================================

document.getElementById("modal-insertamount-confirm").addEventListener('click', function () {
    let input = document.getElementById("modal-insertamount-value");
    // console.log(input.value)
    if (isNaN(input.value) || input.value == "" || input.value < 1) {
        console.log("Invalid number")
        input.type = "text"
        input.value = "Invalid, enter a positive number."
        setTimeout(function () {
            input.type = "number"
            input.value = 0;
        }, 500)
    }
    else {
        pixelMap.actionInsertAfter(appState.actionTargetID, Math.floor(input.value)); //index, amount  - floor inputed value incase a decimal value was entered
        uxModalClose();
    }
});

//======================================================================================================

document.getElementById("tools-zoom-reset").addEventListener('click', function () {
    appState.zoomValue = 1;
    eventSetZoom();
});

document.getElementById("slider-zoom-scale").addEventListener('input', function () {
    appState.zoomValue = this.value;
    eventSetZoom();
});

//======================================================================================================

function eventSetZoom() {
    document.getElementById("workspace-container").style.transform = `scale(${appState.zoomValue})`;
    document.getElementById("slider-zoom-scale").value = appState.zoomValue;
    //console.log(document.getElementById("workspace-container").getBoundingClientRect())
    //console.log("Zoom:", appState.zoomValue);
    //document.getElementById("main-workspace-topbar").scrollIntoView({ behavior: "smooth", block: "start", inline: "start" })
    document.getElementById("selection-drop-indicator").scrollIntoView({ behavior: "smooth", block: "center", inline: "center" })
    //document.getElementById("main-workspace-sidebar").scrollIntoView()
}

//======================================================================================================

document.getElementById("context-menu").addEventListener('click', function (e) {
    e.stopPropagation();
    e.preventDefault();
    console.log("Context-menu clicked");
});

function eventExecuteContextAction(type) {
    switch (type) {
        case 'deleteicon':
            pixelMap.actionDeleteIcon(appState.actionTargetID)
            break;
        case 'deleteiconshift':
            pixelMap.actionDeleteIconShift(appState.actionTargetID)
            break;
        case 'deleteafter':
            pixelMap.actionDeleteAfter(appState.actionTargetID);
            break;
        case 'deletebefore':
            pixelMap.actionDeleteBefore(appState.actionTargetID);
            break;
        case 'deletebeforeshift':
            pixelMap.actionDeleteBeforeAndShift(appState.actionTargetID);
            break;
        case 'deleteselection':
            pixelMap.actionDeleteSelection();
            break;
        case 'deleteselectionshift':
            pixelMap.actionDeleteSelectionAndShift();
            break;
        case 'insertafter':
            uxModalOpen('modal-insertamount')
            break;
        case 'mirrorselectionhoriz':
            pixelMap.actionMirrorSelectionHoriz();
            break;
        case 'mirrorselectionvert':
            pixelMap.actionMirrorSelectionVert();
            break;
    } //end switch
    contextMenuHide();
}

//======================================================================================================

