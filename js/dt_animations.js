
const DT_VIDEO_PREFIX = "/video/dtanims/";
const DT_VIDEO_SUFFIX = ".webm";

/**@type {Object.<string,HTMLVideoElement>} */
var dtAnimationData = {

    "Meta_Flowey": {}

};
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
    video.controls = false;
    video.onloadstart = function(e) {
        cachedDTAnimations[name] = this;
    }
    video.onerror = function(e) {
        console.warn("No DT aniamtion found for " + idName);
    }
    var source = document.createElement("SOURCE");
    source.src = DT_VIDEO_PREFIX + idName + DT_VIDEO_SUFFIX;
    video.appendChild(source);
}

function PlayDTAnimation(/**@type {string} */ name, maxTime = -1, cb = function() {}) {
    var idName = name.replaceAll(" ", "_"); // This makes sure any version of the name being sent will be correct
    var video = cachedDTAnimations[idName];
    if (!video) {
        cb("ERROR");
        return;
    }
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
    DTAnimationContainer.classList.remove("hidden");
}

PreloadAllDTAnimations();