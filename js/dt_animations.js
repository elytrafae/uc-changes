var phaserLoaded = new UCSingleton("game:phaserLoaded");

$.getScript("js/minigames/phaser.min.js", function (data, textStatus, jqxhr) {
    phaserLoaded.emit(data, textStatus, jqxhr);
});



function BarrierAnimation() {

}