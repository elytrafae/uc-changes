
const DT_VIDEO_PREFIX = "https://github.com/elytrafae/uc-changes/raw/main/test_video/";//"/video/dtanims/";
const DT_VIDEO_SUFFIX = ".webm";

const DTAnimationLayer = {
    BOTTOM: "DTAnimationLayer_Bottom",
    TOP: "DTAnimationLayer_Top"
}

class DTAnimationData {

    static DEFAULT = new DTAnimationData();

    constructor() {
        this._backgroundColor = "#000";
        this._layer = DTAnimationLayer.TOP;
    }

    backgroundColor(color) {
        this._backgroundColor = color;
        return this;
    }

    layer(layer) {
        this._layer = layer;
        return this;
    }

}

/**@type {Object.<string,DTAnimationData>} */
var dtAnimationData = {

    "Meta_Flowey": DTAnimationData.DEFAULT,
    "The_Heroine": DTAnimationData.DEFAULT

};

/**@type {Object.<string,HTMLVideoElement>} */
var cachedDTAnimations = {};

var DTAnimationContainer = document.createElement("DIV");
DTAnimationContainer.className = "DTAnimationContainer hidden";
document.body.appendChild(DTAnimationContainer);

function PreloadAllDTAnimations() {
    for (var key in dtAnimationData) {
        PreloadDTAnimtaion(key);
    }
}

function PreloadDTAnimtaion(name) {
    /**@type {HTMLVideoElement} */
    var video = document.createElement("VIDEO");
    var source = document.createElement("SOURCE");
    video.controls = false;
    video.preload = "auto";
    video.onloadstart = function(e) {
        cachedDTAnimations[name] = this;
    }
    source.onerror = function(e) { // For some reason, the source is the one dispatching the error
        console.warn("No DT aniamtion found for " + name);
    }
    
    source.src = DT_VIDEO_PREFIX + name + DT_VIDEO_SUFFIX;
    video.appendChild(source);
}

function PlayDTAnimation(/**@type {string} */ name, maxTime = -1, cb = function() {}) {
    var idName = name.replaceAll(" ", "_"); // This makes sure any version of the name being sent will be correct
    var video = cachedDTAnimations[idName];
    if (!video) {
        console.warn(`Tried to play animation "${name}", but it's not registered!`);
        cb("ERROR");
        return;
    }
    var data = dtAnimationData[idName];
    [...DTAnimationContainer.children].forEach((child) => {DTAnimationContainer.removeChild(child);});
    DTAnimationContainer.appendChild(video);
    video.currentTime = 0;
    video.onended = () => {
        video.pause();
        DTAnimationContainer.classList.add("hidden");
        cb("FINISH");
    }
    video.play();
    if (maxTime > 0) {
        setTimeout(() => {
            if (!video.paused) {
                video.pause();
                DTAnimationContainer.classList.add("hidden");
                cb("TIMEOUT");
            }
        }, maxTime + 5); // This is to make sure the timeout is not triggered by accident, we give a little leeway
    }
    DTAnimationContainer.style.backgroundColor = data._backgroundColor;
    DTAnimationContainer.className = "DTAnimationContainer " + data._layer; // Removes "hidden", sets correct layer
}

PreloadAllDTAnimations();