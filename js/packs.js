var url;
if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    url = "http://" + location.hostname + ":" + location.port + "/PacksConfig";
} else {
    url = "PacksConfig";
}
var packOpen = 0;
var audio = new Audio();
var canAdd = false;
var canOpen = false;
if (allCards.length > 0) {
    canOpen = true;
    canAdd = true;
} else {
    document.addEventListener('allCardsReady', function () {
        canOpen = true;
        canAdd = true;
    });
}
function addPack(action) {
    var notEnough = false;
    var ucp = parseInt($('#ucp').text());
    var golds = parseInt($('#golds').text());
    if (action === "addPack") {
        notEnough = golds < 100;
    } else if (action === "addPackUcp") {
        notEnough = ucp < 10;
    } else if (action === "addDRPack") {
        notEnough = golds < 100;
    } else if (action === "addDRPackUcp") {
        notEnough = ucp < 10;
    }
    if (notEnough) {
        location.href = "Shop";
        return;
    }
    if (canAdd) {
        canAdd = false;
        $.ajax({
            url: url,
            type: "POST",
            dataType: "json",
            data: JSON.stringify({
                action: action
            }),
            contentType: "application/json",
            complete: function () {
                canAdd = true;
            },
            success: function (data) {
                if (data.status === undefined) {
                    if (data.action === "getPackAdded") {
                        var nbPacks = parseInt($('#nbPacks').html());
                        var nbDRPacks = parseInt($('#nbDRPacks').html());
                        var nbTotalPacks = parseInt($('.nbPacksHeader').html());
                        var type = data.type;
                        if (type === "pack") {
                            nbPacks++;
                            $('#nbPacks').html(nbPacks);
                            $('#btnOpen').effect('bounce', 50);
                        } else if (type === "drPack") {
                            nbDRPacks++;
                            $('#nbDRPacks').html(nbDRPacks);
                            $('#btnOpenDR').effect('bounce', 50);
                        }
                        $('.nbPacksHeader').html(nbTotalPacks + 1);
                        if (nbPacks === 0 || !canOpen) {
                            $('#btnOpen').addClass('disabled');
                        } else {
                            $('#btnOpen').removeClass('disabled');
                        }
                        if (nbDRPacks === 0 || !canOpen) {
                            $('#btnOpenDR').addClass('disabled');
                        } else {
                            $('#btnOpenDR').removeClass('disabled');
                        }
                        $('#golds').html(data.golds);
                        $('#ucp').html(data.ucp);
                    }
                    if (data.action === "getError") {
                        BootstrapDialog.show({
                            title: $.i18n('dialog-error'),
                            type: BootstrapDialog.TYPE_DANGER,
                            message: translateFromServerJson(data.message),
                            buttons: [{
                                label: $.i18n('dialog-ok'),
                                cssClass: 'btn-primary',
                                action: function (dialog) {
                                    dialog.close();
                                }
                            }]
                        });
                    }
                } else {
                    BootstrapDialog.show({
                        type: BootstrapDialog.TYPE_DANGER,
                        title: $.i18n('dialog-error'),
                        message: translateFromServerJson(data.message),
                        buttons: [{
                            label: $.i18n('dialog-ok'),
                            cssClass: 'btn-primary',
                            action: function (dialog) {
                                dialog.close();
                            }
                        }]
                    });
                }
            }
        });
    }
}
function openPack(typeOpen) {
    var nbPacks = parseInt($('#nbPacks').html());
    var nbDRPacks = parseInt($('#nbDRPacks').html());
    var nbSuperPacks = parseInt($('#nbSuperPacks').html());
    var nbShinyPacks = parseInt($('#nbShinyPacks').html());
    var nbFinalPacks = parseInt($('#nbFinalPacks').html());
    var nbTotalPacks = parseInt($('.nbPacksHeader').html());
    var enoughPack = false;
    switch (typeOpen) {
        case 'openPack':
            enoughPack = nbPacks > 0;
            break;
        case 'openDRPack':
            enoughPack = nbDRPacks > 0;
            break;
        case 'openShinyPack':
            enoughPack = nbShinyPacks > 0;
            break;
        case 'openSuperPack':
            enoughPack = nbSuperPacks > 0;
            break;
        case 'openFinalPack':
            enoughPack = nbFinalPacks > 0;
            break;
    }
    if (canOpen && enoughPack) {
        canOpen = false;
        $.ajax({
            url: url,
            type: "POST",
            dataType: "json",
            data: JSON.stringify({
                action: typeOpen
            }),
            contentType: "application/json",
            success: function (data) {
                if (data.status === undefined) {
                    if (data.action === "getCards") {
                        var type = data.type;
                        if (type === "pack") {
                            $('#nbPacks').html(nbPacks - 1);
                        } else if (type === "drPack") {
                            $('#nbDRPacks').html(nbDRPacks - 1);
                        } else if (type === "superPack") {
                            $('#nbSuperPacks').html(nbSuperPacks - 1);
                        } else if (type === "shinyPack") {
                            $('#nbShinyPacks').html(nbShinyPacks - 1);
                        } else if (type === "finalPack") {
                            $('#nbFinalPacks').html(nbFinalPacks - 1);
                        }
                        $('.nbPacksHeader').html(nbTotalPacks - 1);
                        $('#btnOpen').addClass('disabled');
                        $('#btnOpenDR').addClass('disabled');
                        $('#btnOpenSuper').addClass('disabled');
                        $('#btnOpenFinal').addClass('disabled');
                        $('#btnOpenShiny').addClass('disabled');
                        $('.slot').empty();
                        var cards = JSON.parse(data.cards);
                        for (var i = 0; i < cards.length; i++) {
                            var gameCard = cards[i];
                            var shinyCardCss = '';
                            if (gameCard.shiny) {
                                shinyCardCss = 'shiny-card';
                            }
                            $('#cardPos' + i).append('<div class="cardBack NORMAL ' + gameCard.extension + ' ' + shinyCardCss + '" data-name="' + gameCard.name + '" data-rarity="' + gameCard.rarity + '" onclick="revealCard(this, ' + i + ')"></div>');
                            appendCard(gameCard, $('#cardPos' + i));
                            $('#cardsOpen .card:last').addClass('pos' + i).hide();
                            makeHoverable();
                        }
                    }
                    if (data.action === "getError") {
                        BootstrapDialog.show({
                            title: $.i18n('dialog-error'),
                            type: BootstrapDialog.TYPE_DANGER,
                            message: translateFromServerJson(data.message),
                            buttons: [{
                                label: $.i18n('dialog-ok'),
                                cssClass: 'btn-primary',
                                action: function (dialog) {
                                    dialog.close();
                                }
                            }]
                        });
                        canOpen = true;
                    }
                } else {
                    BootstrapDialog.show({
                        type: BootstrapDialog.TYPE_DANGER,
                        title: $.i18n('dialog-error'),
                        message: translateFromServerJson(data.message),
                        buttons: [{
                            label: $.i18n('dialog-ok'),
                            cssClass: 'btn-primary',
                            action: function (dialog) {
                                dialog.close();
                            }
                        }]
                    });
                }
            }
        });
    }
}

function revealCard(obj, id) {
    var name = $(obj).data("name");
    if (DTAnimationExists(name)) {
        PlayDTAnimation(name, -1, (reason) => {
            trueRevealCard(obj, id);
        });
    } else {
        trueRevealCard(obj, id);
    }
}

function trueRevealCard(obj, id) {
    var rarity = $(obj).data("rarity");
    var name = $(obj).data("name");
    $(obj).hide();
    $('.pos' + id).show();
    if (rarity === "LEGENDARY" || rarity === "DETERMINATION") {
        var soundPath = '/aprilmusics/cards/' + name.split(' ').join('_') + '.ogg';
        audio.pause();
        audio = new Audio(soundPath);
        audio.volume = 0.2;
        audio.play();
    } else if (rarity === "EPIC") {
        audio = new Audio('/sounds/packsEpic.wav');
        audio.volume = 0.2;
        audio.play();
    } else if (rarity === "RARE") {
        audio = new Audio('/sounds/packsRare.wav');
        audio.volume = 0.2;
        audio.play();
    }
    packOpen++;
    if (packOpen === 4) {
        var nbPacks = parseInt($('#nbPacks').html());
        var nbDRPacks = parseInt($('#nbDRPacks').html());
        var nbSuperPacks = parseInt($('#nbSuperPacks').html());
        var nbShinyPacks = parseInt($('#nbShinyPacks').html());
        var nbFinalPacks = parseInt($('#nbFinalPacks').html());
        if (nbPacks > 0) {
            $('#btnOpen').removeClass('disabled');
        }
        if (nbDRPacks > 0) {
            $('#btnOpenDR').removeClass('disabled');
        }
        if (nbPacks + nbDRPacks === 0) {
            $('#shop').show();
        }
        if (nbSuperPacks > 0) {
            $('#btnOpenSuper').removeClass('disabled');
        }
        if (nbShinyPacks > 0) {
            $('#btnOpenShiny').removeClass('disabled');
        }
        if (nbFinalPacks > 0) {
            $('#btnOpenFinal').removeClass('disabled');
        }
        canOpen = true;
        packOpen = 0;
    }
}
function makeHoverable() {
    $('.cardBack').hover(function (event) {
        var rarity = $(this).data("rarity");
        $(this).removeClass('NORMAL').addClass(rarity);
    }, function (event) {
        var rarity = $(this).data("rarity");
        $(this).removeClass(rarity).addClass('NORMAL');
    });
}
function showDropRates() {
    var html = '<p><img src="aprilimages/icons/pack.png" class="height-32"><img src="aprilimages/icons/drPack.png" class="height-32"><img src="aprilimages/icons/shinyPack.png" class="height-32"> <img src="aprilimages/rarity/BASE_COMMON.png"> 87.49% - <img src="aprilimages/rarity/BASE_RARE.png"> 10% - <img src="aprilimages/rarity/BASE_EPIC.png"> 2% - <img src="aprilimages/rarity/BASE_LEGENDARY.png"> 0.5% - <img src="aprilimages/rarity/BASE_DETERMINATION.png"> 0.01%</p><p><img src="aprilimages/icons/superPack.png" class="height-32"> <img src="aprilimages/rarity/BASE_COMMON.png"> x1 - <img src="aprilimages/rarity/BASE_RARE.png"> x1 - <img src="aprilimages/rarity/BASE_EPIC.png"> x1 - <img src="aprilimages/rarity/BASE_LEGENDARY.png"> x1</p><p><img src="aprilimages/icons/finalPack.png" class="height-32"> <img src="aprilimages/rarity/BASE_RARE.png"> x1 - <img src="aprilimages/rarity/BASE_EPIC.png"> x1 - <img src="aprilimages/rarity/BASE_LEGENDARY.png"> x1 - <img src="aprilimages/rarity/BASE_DETERMINATION.png"> x1</p>';
    BootstrapDialog.show({
        title: $.i18n('dialog-information'),
        message: html,
        buttons: [{
            label: $.i18n('dialog-ok'),
            cssClass: 'btn-primary',
            action: function (dialog) {
                dialog.close();
            }
        }]
    });
}
