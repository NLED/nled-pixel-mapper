'use strict'

document.addEventListener('keydown', userinputKeydown)
document.addEventListener('mousewheel', userinputMouseWheel, { passive: false });

function userinputKeydown(e) {
    // console.log(e);
    // console.log(String.fromCharCode(e.charCode));
    // console.log(e.altKey);
}

function userinputMouseWheel(e) {
    // console.log(e)
    if (appState.modalOpen) return;
    e.stopPropagation();
    e.preventDefault();

    let ctrl = e.ctrlKey || e.metaKey; //should catch ctrl and mac cmd

    if (ctrl) {
        if (e.wheelDeltaY == -180) document.getElementById("main-workspace").scrollLeft += appState.grid.size;
        else document.getElementById("main-workspace").scrollLeft -= appState.grid.size;
    }
    else if (e.altKey) {

        if (e.wheelDeltaY == -180) document.getElementById("main-workspace").scrollTop += appState.grid.size;
        else document.getElementById("main-workspace").scrollTop -= appState.grid.size;
    }
    else {
        //console.log(e.altKey);
        if (e.wheelDeltaY == -180) appState.zoomValue -= 0.1;
        else appState.zoomValue += 0.1;
        eventSetZoom();
    }
}

//===============================================================================

document.body.addEventListener('keydown', function (event) {
    let key = event.key.toLowerCase();
    let ctrl = event.ctrlKey || event.metaKey; //should catch ctrl and mac cmd
    // console.log("down",event)
    if (ctrl && key == 's') {
        console.log("SAVE");
        event.preventDefault();
    }
    else if (ctrl && key == 'c') {
        console.log("COPY");
        event.preventDefault();
        appState.copyBuffer = [];
        //Deep copy array
        // console.log(appState.groupSelected)
        appState.groupSelected.forEach(function (v, i) {
            let obj = {
                id: v.id,
                x: v.x,
                y: v.y,
                elem: document.getElementById(v.id)
            }
            appState.copyBuffer.push(obj);
        });

        messagePush("Copied " + appState.groupSelected.length + " icons.")

        // console.log(appState.copyBuffer)
    }
    else if (ctrl && key == 'v') {
        console.log("PASTE");
        // console.log(appState.copyBuffer)
        event.preventDefault();

        if (appState.copyBuffer.length > 0 && appState.dragging == false) pixelMap.iconMerge();

    }
    else if (ctrl && key == 'z') {
        console.log("UNDO");
        //save and restore a rolling backup of appState.pixelArray
        console.log("stack:", appState.undoStack.length, appState.undoStackIndex)

        if (appState.undoStackIndex > 0) {
            appState.pixelArray = JSON.parse(appState.undoStack[--appState.undoStackIndex]);
            // appState.undoStack.shift();

            pixelWorkspaceRender();
        }

    }
    else if (ctrl && key == 'y') {
        console.log("REDO");
        //save and restore a rolling backup of appState.pixelArray

        // if(appState.undoStack.length > 1) {
        // appState.pixelArray = JSON.parse(appState.undoStack[1]);
        // appState.undoStack.shift();
        if (appState.undoStackIndex < appState.undoStack.length - 1) {
            appState.pixelArray = JSON.parse(appState.undoStack[++appState.undoStackIndex]);
            console.log("stack:", appState.undoStack.length, "pixelArray:", appState.pixelArray.length)
            pixelWorkspaceRender();
        }
        else console.log("At top of stack")

    }
    else if (ctrl) {
        for (let i = 0; i < appState.pixelArray.length; i++) {
            try {
                document.getElementById('pixel-' + i).classList.add('cursorAdd');
            }
            catch (e) { }
        }
    }
    else if (event.key == 'Delete') {
        event.preventDefault();
        pixelMap.actionDeleteSelection();
    }
});

//===============================================================================

document.body.addEventListener('keyup', function (event) {
    let ctrl = event.ctrlKey || event.metaKey; //should catch cntrl and mac cmd
    // console.log("up", event)
    //this needs improvement, event runs every key stroke, and ctrl will almost always be false
    if (!ctrl) {
        for (let i = 0; i < appState.pixelArray.length; i++) {
            try {
                document.getElementById('pixel-' + i).classList.remove('cursorAdd');
            }
            catch (e) { }
        }
    }
});
//===============================================================================

document.addEventListener('contextmenu', contextMenuOpen);

function contextMenuHide() {
    document.getElementById("context-menu").style.display = "none"
    setTimeout(function () { appState.contextOpen = false; }, 200);
}

function contextMenuOpen(e) {
    e.preventDefault();
    // console.log(e)

    if (document.getElementById("context-menu").style.display == "block") contextMenuHide();
    else {
        var menu = document.getElementById("context-menu")
        document.getElementById("context-menu-title").innerText = "Pixel Icon #" + (Number(e.target.id.split("-")[1]) + 1);
        if (e.target.id.includes("pixel-")) {
            appState.contextOpen = true;
            menu.style.display = 'block';
            document.addEventListener('click', contextMenuHide, { once: true })

            let bounds = e.target.parentElement.parentElement.getBoundingClientRect();
            let menuBounds = menu.getBoundingClientRect();
            let menuX = (e.clientX - bounds.x);
            let menuY = (e.clientY - bounds.y);

            //detect if context menu will extend out of container, reposition it so it stays within
            if (menuX + menuBounds.width > bounds.width) menuX = bounds.width - menuBounds.width;
            if (menuY + menuBounds.height > bounds.height) menuY = bounds.height - menuBounds.height;

            menu.style.left = menuX + "px";//e.target.style.left;
            menu.style.top = menuY + "px";//e.target.style.top;
            appState.actionTargetID = e.target.id.split("-")[1];
        }
    }
}

//======================================================================================================
