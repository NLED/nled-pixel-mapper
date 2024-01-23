


class pixelMapClass {
    constructor(indicatorElem, indicatorElemV, indicatorElemH) {
        this.indicator = indicatorElem;
        this.indicatorVert = indicatorElemV;
        this.indicatorHoriz = indicatorElemH;
        // this.appState.pixelArray = [];
    }

    iconCreate(i) {
        let pixElem = document.createElement('div')
        pixElem.id = "pixel-" + i;
        pixElem.classList = 'pixelIcon'
        pixElem.innerText = (i + 1);
        //gotta be a smarter way, but this works fine.
        let fontsz = pixElem.innerText.toString().length;
        pixElem.setAttribute("style", `font-size:${(appState.grid.size * (0.7 -  (fontsz*0.1)))}px;`);
        return pixElem;
    }

    iconPlace(x, y) {
        console.log(" iconPlace()", x, y, this.iconCheckOverlap(x, y, []))
        if (this.iconCheckOverlap(x, y, [])) return;
        if (x > appState.grid.width || y > appState.grid.height) return; //keep icons in bounds
        let nextPixelID = this.iconGetNextSlot();
        appState.pixelArray[nextPixelID] = { x: x, y: y }; //coordinates are base 0
        let pixElem = this.iconCreate(nextPixelID);
        document.getElementById("main-workspace-pixels").insertAdjacentElement('beforeend', pixElem);
        pixelWorkspaceUpdate();
    }

    iconMerge() {
        let pixelsCont = document.getElementById("main-workspace-pixels");
        helperDeSelectGroup();
        appState.groupSelected = [...appState.copyBuffer];
        for (let i = 0; i < appState.copyBuffer.length; i++) {
            let nextPixelID = this.iconGetNextSlot();
            // console.log(nextPixelID, appState.pixelArray.length)
            let pixElem = this.iconCreate(nextPixelID);
            pixelsCont.insertAdjacentElement('beforeend', pixElem);
            if (nextPixelID == (appState.pixelArray.length - 1)) appState.pixelArray.push({ x: 99999, y: 99999 });
            else appState.pixelArray[nextPixelID] = { x: 99999, y: 99999 }; //temp values until the pixelIcons are dropped into the grid
            appState.groupSelected[i].id = Number(nextPixelID);
            appState.groupSelected[i].elem = pixElem;
            pixElem.classList.add("pixelSelected");
        } //end for()
        let fakeEvent = {
            target: {
                id: appState.copyBuffer[0].elem.id
            }
        }

        appState.merging = true;
        workspaceActionDragGroup(fakeEvent);
        this.setIndicatorGroupSize(appState.copyBuffer);
    }

    iconCheckOverlapGroup(arr) {
        // console.log(arr)
        let mask = arr.map(value => value.id);
        //console.log("mask:",mask)
        for (let i = 0; i < arr.length; i++) {
            let xElem = parseInt(arr[i].elem.style.left, 10); //snap elment to grid
            let yElem = parseInt(arr[i].elem.style.top, 10);
            let xCoord = ((xElem / appState.grid.size));
            let yCoord = ((yElem / appState.grid.size));
            if (this.iconCheckOverlap(xCoord, yCoord, mask)) return true;
        }
        return false;
    }

    iconCheckOverlap(x, y, pixMask) {
        if (x < 0 || y < 0 || x > appState.grid.width || y > appState.grid.height) return true; //out of bounds
        for (let i = 0; i < appState.pixelArray.length; i++) {
            if (appState.pixelArray[i].x == x && appState.pixelArray[i].y == y && pixMask.indexOf(i) == -1) return true;
        }
        return false;
    }


    iconGetNextSlot() {
        if (appState.pixelArray.length == 0) return 0;
        for (let i = 0; i < appState.pixelArray.length; i++) {
            if (isNaN(appState.pixelArray[i].x) && isNaN(appState.pixelArray[i].y)) return i;
        }
        return appState.pixelArray.length;     //if no empty slot is found, add to the end
    }

    iconAddToGroup(elem) {
        let pixID = Number(elem.id.split("-")[1]);
        let obj = {
            id: pixID,
            x: appState.pixelArray[pixID].x,
            y: appState.pixelArray[pixID].y,
            elem: elem
        }
        appState.groupSelected.push(obj)
        elem.classList.add("pixelSelected");
        // appState.minX = 100000;
        // appState.minY = 100000;
        // for (let i = 0; i < appState.groupSelected.length; i++) {
        //     if (appState.pixelArray[appState.groupSelected[i].id].x < appState.minX) appState.minX = appState.pixelArray[appState.groupSelected[i].id].x;
        //     if (appState.pixelArray[appState.groupSelected[i].id].y < appState.minY) appState.minY = appState.pixelArray[appState.groupSelected[i].id].y;
        // }

        this.getGroupMinimums(appState.groupSelected);
        for (let i = 0; i < appState.groupSelected.length; i++) {
            appState.groupSelected[i].x = appState.pixelArray[appState.groupSelected[i].id].x - appState.minX;
            appState.groupSelected[i].y = appState.pixelArray[appState.groupSelected[i].id].y - appState.minY;
        }
    }

    getGroupMinimums(arrArg) {
        let arr = arrArg.map((e) => appState.pixelArray[e.id])
        appState.minX = Math.min(...arr.map(o => o.x));
        appState.minY = Math.min(...arr.map(o => o.y));
    }

    setIndicatorGroupSize() {
        //console.log("setIndicatorGroupSize()", (appState.groupW + appState.grid.size))
        this.indicator.style.width = (appState.groupW * appState.grid.size) + "px";
        this.indicator.style.height = (appState.groupH * appState.grid.size) + "px";
        //console.log(this.indicator.style.width, this.indicator.style.height)
    }

    setIndicatorGridSize() {
        document.getElementById("selection-drop-indicator").style.width = appState.grid.size + "px";
        document.getElementById("selection-drop-indicator").style.height = appState.grid.size + "px";
    }

    getGroupSize(arr) {
        appState.groupW = Math.max(...arr.map(o => o.x), 0) + 1;
        appState.groupH = Math.max(...arr.map(o => o.y), 0) + 1;
        // console.log("MEASURE:",appState.groupW,appState.groupH)
    }

    setIndicator(x, y, state) {
        this.indicator.style.left = ((x) * appState.grid.size) + "px"
        this.indicator.style.top = ((y) * appState.grid.size) + "px"
        if (state) this.indicator.style.backgroundColor = "#f00";
        else this.indicator.style.backgroundColor = "#0F0";
        this.indicatorVert.style.left = ((x) * appState.grid.size) + (appState.grid.size / 2) + "px"
        this.indicatorHoriz.style.top = ((y) * appState.grid.size) + (appState.grid.size / 2) + "px"
    }

    actionDeleteIcon(id) {
        appState.pixelArray[id].x = undefined;
        appState.pixelArray[id].y = undefined;
        pixelWorkspaceRender();
    }

    actionDeleteIconShift(id) {
        console.log("actionDeleteIconShift()", id)
        appState.pixelArray.splice(id, 1);
        pixelWorkspaceRender();
    }

    actionDeleteAfter(start) {
        console.log("actionDeleteAfter()", Number(start) + 1)
        appState.pixelArray.splice(Number(start) + 1, appState.pixelArray.length)
        pixelWorkspaceRender();
    }

    actionDeleteBeforeAndShift(end) {
        console.log("actionDeleteBefore()", end)
        appState.pixelArray.splice(0, end)
        pixelWorkspaceRender();
    }

    actionDeleteBefore(end) {
        console.log("actionDeleteBefore()", end)
        for (let i = 0; i < end; i++) {
            appState.pixelArray[i].x = undefined;
            appState.pixelArray[i].y = undefined;
        }
        pixelWorkspaceRender();
    }

    actionInsertAfter(index, amount) {
        index++;
        let insert = [];
        for (let i = 0; i < amount; i++) insert.push({ x: undefined, y: undefined });
        console.log(insert)
        appState.pixelArray.splice(index, 0, ...insert);
        pixelWorkspaceRender();
    }

    actionDeleteSelection() {
        for (const i in appState.groupSelected) {
            appState.pixelArray[appState.groupSelected[i].id] = { x: undefined, y: undefined };
        }
        pixelWorkspaceRender();
    }

    actionDeleteSelectionAndShift() {
        for (const i in appState.groupSelected) {
            appState.pixelArray[appState.groupSelected[i].id] = null;
        }
        appState.pixelArray = appState.pixelArray.filter((e) => e != null);
        pixelWorkspaceRender();
    }

    actionMirrorSelectionHoriz() {
        this.getGroupSize(appState.groupSelected);
        this.getGroupMinimums(appState.groupSelected);
        for (const i in appState.groupSelected) {
            appState.pixelArray[appState.groupSelected[i].id].x = (appState.groupSelected[i].x * -1) + appState.minX + appState.groupW - 1;
        }
        pixelWorkspaceRender();
        helperDeSelectGroup();
    }

    actionMirrorSelectionVert() {
        this.getGroupSize(appState.groupSelected);
        this.getGroupMinimums(appState.groupSelected);
        for (const i in appState.groupSelected) {
            appState.pixelArray[appState.groupSelected[i].id].y = (appState.groupSelected[i].y * -1) + appState.minY + appState.groupH - 1;
        }
        pixelWorkspaceRender();
        helperDeSelectGroup();
    }


}