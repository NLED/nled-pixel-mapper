'use strict'

//==============================================================================================================

function uxModalInit() {
    //Ran after DOM has finished loading
    document.getElementById('modal-fog').addEventListener('click', function (e) {
        e.stopPropagation();
        uxModalClose();
    });

    //capture events from bubbling to elements under the modal
    document.getElementById('modals').addEventListener('mousedown', function (e) {
        e.stopPropagation();
    });
    document.getElementById('modals').addEventListener('mouseup', function (e) {
        e.stopPropagation();
    });
}

//==============================================================================================================

function uxModalOpen(modalID, msgTime = false) {
    console.log("uxModalOpen()", modalID);
    document.getElementById("modals").classList.remove("hide");

    uxRenderModal(modalID);
    document.getElementById(modalID).classList.remove("hide");
    if (msgTime) {
        setTimeout(function () {
            uxModalClose();
        }, 1000)
    }

    appState.modalOpen = true;
}

function uxModalClose() {
    console.log("uxModalClose()");
    setTimeout(function () {
        let modals = document.getElementById("modals").querySelectorAll(".modalMenu");
        //console.log(modals)
        modals.forEach(function (e, i, a) {
            e.classList.add("hide");
        });
        document.getElementById("modals").classList.add("hide");
    }, 100);

    appState.modalOpen = false;
    //specific to a modal, but run close actions anyway
    clearInterval(appState.modalFeedPreview);
}

//==============================================================================================================

function uxRenderModal(modalID) {
    let trimmedID = modalID.split("-");
    console.log("Modal Render Callback for ", trimmedID[1]);
    // console.log(appState.modalCallback);

    if (typeof appState.modalCallback[trimmedID[1]] === 'function') appState.modalCallback[trimmedID[1]]();
}

//==============================================================================================================

window.addEventListener('DOMContentLoaded', () => {
    //collect list of all the modal close icons/buttons, and all modal -cancel buttons
    let closeIcons = document.querySelectorAll(".modalClose, [id^=modal-][id$=-cancel]");
    // console.log(closeIcons)
    for (const elem of closeIcons) elem.addEventListener('click', uxModalClose);
});

//==============================================================================================================