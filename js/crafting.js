var url;
if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    url = "http://" + location.hostname + ":" + location.port + "/CraftConfig";
} else {
    url = "CraftConfig";
}
var audio = new Audio();
var currentPage = 0;
var collection = [];
var pages = [];
if (allCards.length > 0) {
    initCraft();
} else {
    document.addEventListener('allCardsReady', function() {
        initCraft();
    });
}
function initCraft() {
    $.ajax({
        url: "CraftConfig",
        type: "GET",
        contentType: "application/json",
        success: function(data) {
            collection = JSON.parse(data.collection);
            applyFilters();
            showPage(0);
        }
    });
}
$(document).ready(function() {
    $('#collection').on('mousewheel DOMMouseScroll', function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.originalEvent.detail === 'number' && e.originalEvent.detail !== 0) {
            if (e.originalEvent.detail > 0) {
                nextPage();
            } else if (e.originalEvent.detail < 0) {
                previousPage();
            }
        } else if (typeof e.originalEvent.wheelDelta === 'number') {
            if (e.originalEvent.wheelDelta < 0) {
                nextPage();
            } else if (e.originalEvent.wheelDelta > 0) {
                previousPage();
            }
        }
        removeCardHover();
    });
    $('#searchInput').keyup(function() {
        applyFilters();
        showPage(0);
    });
});
function action(id, isShiny) {
    var quant;
    if (isShiny) {
        quant = parseInt($('.card#' + id + '.shiny .nb').html());
    } else {
        quant = parseInt($('.card#' + id + ':not(.shiny) .nb').html());
    }
    var name = $.i18n('card-name-' + id, 1);
    var rarity = $('.card#' + id).data('rarity');
    var dust = parseInt($('#dust').html());
    var craftCost = 0;
    var disCost = 0;
    var max = 3;
    if (!isShiny) {
        switch (rarity) {
        case "COMMON":
            craftCost = 40;
            disCost = 5;
            break;
        case "RARE":
            craftCost = 100;
            disCost = 20;
            break;
        case "EPIC":
            craftCost = 400;
            disCost = 100;
            max = 2;
            break;
        case "LEGENDARY":
            craftCost = 1600;
            disCost = 400;
            max = 1;
            break;
        }
    } else {
        switch (rarity) {
        case "BASE":
            craftCost = 400;
            disCost = 40;
            break;
        case "COMMON":
            craftCost = 400;
            disCost = 40;
            break;
        case "RARE":
            craftCost = 800;
            disCost = 100;
            break;
        case "EPIC":
            craftCost = 1600;
            disCost = 400;
            max = 2;
            break;
        case "LEGENDARY":
            craftCost = 3200;
            disCost = 1600;
            max = 1;
            break;
        }
    }
    if (rarity !== "DETERMINATION") {
        if (rarity !== "TOKEN" && (rarity !== "BASE" || isShiny)) {
            if (quant > 0) {
                if (dust >= craftCost && quant < max) {
                    BootstrapDialog.show({
                        title: $.i18n('crafting-title', name),
                        message: $.i18n('crafting-choice', dust, name),
                        buttons: [{
                            label: $.i18n('crafting-craft-btn', craftCost),
                            cssClass: 'btn-success',
                            action: function(dialog) {
                                confirmEnchant(craftCost, id, isShiny);
                                dialog.close();
                            }
                        }, {
                            label: $.i18n('crafting-disenchant-btn', disCost),
                            cssClass: 'btn-danger',
                            action: function(dialog) {
                                confirmDisenchant(disCost, id, isShiny);
                                dialog.close();
                            }
                        }]
                    });
                } else {
                    BootstrapDialog.show({
                        title: $.i18n('crafting-title', name),
                        message: $.i18n('crafting-choice', dust, name),
                        buttons: [{
                            label: $.i18n('crafting-disenchant-btn', disCost),
                            cssClass: 'btn-danger',
                            action: function(dialog) {
                                confirmDisenchant(disCost, id, isShiny, rarity);
                                dialog.close();
                            }
                        }]
                    });
                }
            } else {
                if (dust >= craftCost) {
                    BootstrapDialog.show({
                        title: $.i18n('crafting-title', name),
                        message: $.i18n('crafting-choice', dust, name),
                        buttons: [{
                            label: $.i18n('crafting-craft-btn', craftCost),
                            cssClass: 'btn-success',
                            action: function(dialog) {
                                confirmEnchant(craftCost, id, isShiny, rarity);
                                dialog.close();
                            }
                        }]
                    });
                } else {
                    BootstrapDialog.show({
                        title: $.i18n('crafting-title', name),
                        message: $.i18n('crafting-not-enough-dust', dust, name, craftCost),
                        buttons: [{
                            label: $.i18n('dialog-ok'),
                            cssClass: 'btn-primary',
                            action: function(dialog) {
                                dialog.close();
                            }
                        }]
                    });
                }
            }
        } else {
            var dialogMessage = $.i18n('crafting-non-shiny-basic');
            if (rarity === "TOKEN") {
                dialogMessage = $.i18n('crafting-token');
            }
            BootstrapDialog.show({
                title: $.i18n('crafting-title', name),
                message: dialogMessage,
                buttons: [{
                    label: $.i18n('dialog-ok'),
                    cssClass: 'btn-primary',
                    action: function(dialog) {
                        dialog.close();
                    }
                }]
            });
        }
    } else {
        if (quant > 0) {
            BootstrapDialog.show({
                title: $.i18n('crafting-title', name),
                message: $.i18n('crafting-dt', dust, name),
                buttons: [{
                    label: $.i18n('crafting-disenchant-dt-btn', 2),
                    cssClass: 'btn-danger',
                    action: function(dialog) {
                        confirmDisenchant(disCost, id, isShiny, rarity);
                        dialog.close();
                    }
                }]
            });
        } else {
            BootstrapDialog.show({
                title: $.i18n('crafting-title', name),
                message: $.i18n('crafting-not-dust'),
                buttons: [{
                    label: $.i18n('dialog-ok'),
                    cssClass: 'btn-primary',
                    action: function(dialog) {
                        dialog.close();
                    }
                }]
            });
        }
    }
}
function craft(idCard, shiny) {
    $.ajax({
        url: url,
        type: "POST",
        dataType: "json",
        data: JSON.stringify({
            action: "craft",
            idCard: parseInt(idCard),
            isShiny: shiny
        }),
        contentType: "application/json",
        success: function(data) {
            if (data.status === "success") {
                var card = JSON.parse(data.card);
                updateQuantity(card, 1);
                applyFilters();
                showPage(currentPage);
                $('#dust').html(data.dust);
                $('#totalDisenchant').html(data.totalDisenchant);
                obtainedCard(card);
            }
            if (data.status === "errorMaintenance") {
                BootstrapDialog.show({
                    type: BootstrapDialog.TYPE_DANGER,
                    title: $.i18n('dialog-error'),
                    message: translateFromServerJson(data.message),
                    buttons: [{
                        label: $.i18n('dialog-ok'),
                        cssClass: 'btn-primary',
                        action: function(dialog) {
                            dialog.close();
                        }
                    }]
                });
            }
        }
    });
}
function disenchant(idCard, shiny) {
    $.ajax({
        url: url,
        type: "POST",
        dataType: "json",
        data: JSON.stringify({
            action: "disenchant",
            idCard: parseInt(idCard),
            isShiny: shiny
        }),
        contentType: "application/json",
        success: function(data) {
            if (data.status === "success") {
                $('#dust').html(data.dust);
                $('#totalDisenchant').html(data.totalDisenchant);
                var nbDTFramgents = data.DTFragments;
                $('#nbDTFragments').html(nbDTFramgents);
                if (nbDTFramgents >= 2) {
                    $('#btnCraftDT').prop('disabled', false);
                }
                if (nbDTFramgents > 0) {
                    $('#DTFragmentsDiv').show();
                }
                var card = JSON.parse(data.card);
                updateQuantity(card, -1);
                applyFilters();
                showPage(currentPage);
                var shinyText = "";
                if (shiny) {
                    shinyText = '<span class="rainbowText">S</span> ';
                }
                var name = shinyText + $.i18n('card-name-' + card.id, 1);
                BootstrapDialog.show({
                    type: BootstrapDialog.TYPE_SUCCESS,
                    title: $.i18n('crafting-title', name),
                    message: $.i18n('crafting-disenchant-success', name),
                    buttons: [{
                        label: $.i18n('dialog-ok'),
                        cssClass: 'btn-primary',
                        action: function(dialog) {
                            dialog.close();
                        }
                    }]
                });
            }
            if (data.status === "error") {
                BootstrapDialog.show({
                    type: BootstrapDialog.TYPE_DANGER,
                    title: $.i18n('crafting-title', name),
                    message: translateFromServerJson(data.message),
                    buttons: [{
                        label: $.i18n('dialog-ok'),
                        cssClass: 'btn-primary',
                        action: function(dialog) {
                            dialog.close();
                        }
                    }]
                });
            }
            if (data.status === "errorMaintenance") {
                BootstrapDialog.show({
                    type: BootstrapDialog.TYPE_DANGER,
                    title: $.i18n('dialog-error'),
                    message: translateFromServerJson(data.message),
                    buttons: [{
                        label: $.i18n('dialog-ok'),
                        cssClass: 'btn-primary',
                        action: function(dialog) {
                            dialog.close();
                        }
                    }]
                });
            }
        }
    });
}
function auto() {
    $.ajax({
        url: url,
        type: "POST",
        dataType: "json",
        data: JSON.stringify({
            action: "auto"
        }),
        contentType: "application/json",
        success: function(data) {
            if (data.status === "success") {
                $('#dust').html(data.dust);
                $('#totalDisenchant').html(0);
                var cardsId = JSON.parse(data.cardsId);
                var cardsShiny = JSON.parse(data.cardsShiny);
                var cardsQuantity = JSON.parse(data.cardsQuantity);
                for (var i = 0; i < cardsId.length; i++) {
                    updateQuantities(cardsId[i], cardsShiny[i], cardsQuantity[i])
                }
                applyFilters();
                showPage(currentPage);
                BootstrapDialog.show({
                    type: BootstrapDialog.TYPE_SUCCESS,
                    title: $.i18n('crafting-auto-title'),
                    message: $.i18n('crafting-auto-done'),
                    buttons: [{
                        label: $.i18n('dialog-ok'),
                        cssClass: 'btn-primary',
                        action: function(dialog) {
                            dialog.close();
                        }
                    }]
                });
            }
            if (data.status === "errorMaintenance") {
                BootstrapDialog.show({
                    type: BootstrapDialog.TYPE_DANGER,
                    title: $.i18n('dialog-error'),
                    message: translateFromServerJson(data.message),
                    buttons: [{
                        label: $.i18n('dialog-ok'),
                        cssClass: 'btn-primary',
                        action: function(dialog) {
                            dialog.close();
                        }
                    }]
                });
            }
        }
    });
}
function openAuto() {
    var total = $("#totalDisenchant").html();
    BootstrapDialog.show({
        title: $.i18n('crafting-auto-title'),
        message: $.i18n('crafting-auto-note'),
        buttons: [{
            label: $.i18n('crafting-auto-btn', total),
            cssClass: 'btn-danger',
            action: function(dialog) {
                auto();
                dialog.close();
            }
        }]
    });
}
function craftDT() {
    $.ajax({
        url: url,
        type: "POST",
        dataType: "json",
        data: JSON.stringify({
            action: "craftDT"
        }),
        contentType: "application/json",
        success: function(data) {
            if (data.status === "success") {
                var card = JSON.parse(data.card);
                updateQuantity(card, 1);
                applyFilters();
                showPage(currentPage);
                var nbDtFragments = parseInt($('#nbDTFragments').html()) - 4;
                $('#nbDTFragments').html(nbDtFragments);
                if (nbDtFragments < 2) {
                    $('#btnCraftDT').prop('disabled', true);
                } else if (nbDtFragments === 0) {
                    $('#DTFragmentsDiv').hide();
                }
                obtainedCard(card);
            }
            if (data.status === "errorMaintenance") {
                BootstrapDialog.show({
                    type: BootstrapDialog.TYPE_DANGER,
                    title: $.i18n('dialog-error'),
                    message: translateFromServerJson(data.message),
                    buttons: [{
                        label: $.i18n('dialog-ok'),
                        cssClass: 'btn-primary',
                        action: function(dialog) {
                            dialog.close();
                        }
                    }]
                });
            }
        }
    });
}

function obtainedCard(card) {
    if (DTAnimationExists(card.name)) {
        PlayDTAnimation(card.name, -1, (reason) => {
            trueObtainedCard(card);
        });
    } else {
        trueObtainedCard(card);
    }
}

function trueObtainedCard(card) {
    var shinyText = "";
    if (card.shiny) {
        shinyText = '<span class="rainbowText">S</span> ';
    }
    var name = shinyText + $.i18n('card-name-' + card.id, 1);
    var title = $.i18n('crafting-title', name);
    var message = $.i18n('crafting-craft-success', name);
    /*
    if (card.shiny) {
        title = '<span class="rainbowText">' + title + '</span>';
        message = '<span class="rainbowText">' + message + '</span>';
    }
    */
    BootstrapDialog.show({
        type: BootstrapDialog.TYPE_SUCCESS,
        title: title,
        message: message,
        buttons: [{
            label: $.i18n('dialog-ok'),
            cssClass: 'btn-primary',
            action: function(dialog) {
                dialog.close();
            }
        }]
    });
    if (card.rarity === 'LEGENDARY' || card.rarity === 'DETERMINATION') {
        var soundPath = '/aprilmusics/cards/' + card.name.split(' ').join('_') + '.ogg';
        var music = new Audio(soundPath);
        music.volume = 0.2;
        music.play();
    }
}

function confirmEnchant(craftCost, id, isShiny) {
    var shinyText = "";
    if (isShiny) {
        shinyText = '<span class="rainbowText">S</span> ';
    }
    var name = shinyText + $.i18n('card-name-' + id, 1);
    BootstrapDialog.show({
        title: $.i18n('crafting-confirm-title'),
        message: $.i18n('crafting-confirm-craft', name, craftCost),
        buttons: [{
            label: $.i18n('dialog-continue'),
            cssClass: 'btn-success',
            action: function(dialog) {
                craft(id, isShiny);
                dialog.close();
            }
        }, {
            label: $.i18n('dialog-cancel'),
            cssClass: 'btn-danger',
            action: function(dialog) {
                dialog.close();
            }
        }]
    });
}
function confirmDisenchant(disCost, id, isShiny, rarity) {
    var shinyText = "";
    if (isShiny) {
        shinyText = '<span class="rainbowText">S</span> ';
    }
    var name = shinyText + $.i18n('card-name-' + id, 1);
    var message;
    if (rarity !== "DETERMINATION") {
        message = $.i18n('crafting-confirm-disenchant', name, disCost);
    } else {
        message = $.i18n('crafting-confirm-disenchant-dt', name, 2);
    }
    BootstrapDialog.show({
        title: $.i18n('crafting-confirm-title'),
        message: message,
        buttons: [{
            label: $.i18n('dialog-continue'),
            cssClass: 'btn-success',
            action: function(dialog) {
                disenchant(id, isShiny);
                dialog.close();
            }
        }, {
            label: $.i18n('dialog-cancel'),
            cssClass: 'btn-danger',
            action: function(dialog) {
                dialog.close();
            }
        }]
    });
}
function applyFilters() {
    pages = [];
    var filteredCollection = cloneList(collection);
    for (var i = filteredCollection.length - 1; i >= 0; i--) {
        var card = filteredCollection[i];
        if (isRemoved(card)) {
            filteredCollection.splice(i, 1);
        }
    }
    for (var i = 0; i < filteredCollection.length; i++) {
        pages.push(filteredCollection[i]);
    }
    $('#maxPage').html(getMaxPage() + 1);
}
function nextPage() {
    if (currentPage < getMaxPage()) {
        currentPage++;
        if (!existPage(currentPage + 1)) {
            $('#btnNext').prop('disabled', true);
            $('#btnLast').prop('disabled', true);
        }
        $('#btnFirst').prop('disabled', false);
        $('#btnPrevious').prop('disabled', false);
        showPage(currentPage);
        $('#currentPage').html(currentPage + 1);
    }
}
function previousPage() {
    if (currentPage > 0) {
        currentPage--;
        if (currentPage === 0) {
            $('#btnFirst').prop('disabled', true);
            $('#btnPrevious').prop('disabled', true);
        }
        $('#btnLast').prop('disabled', false);
        $('#btnNext').prop('disabled', false);
        showPage(currentPage);
        $('#currentPage').html(currentPage + 1);
    }
}
function showPage(page) {
    currentPage = page;
    $('#collection').empty();
    var currPage = page * 10;
    for (var i = currPage; i < currPage + 10; i++) {
        if (pages.length > i) {
            var card = pages[i];
            appendCardCraft(card);
            $('#collection #' + card.id).addClass('col-sm-1');
        }
    }
    $('#currentPage').html(currentPage + 1);
    $('#btnNext').prop('disabled', page >= getMaxPage());
    $('#btnLast').prop('disabled', page === getMaxPage());
    $('#btnFirst').prop('disabled', page === 0);
    $('#btnPrevious').prop('disabled', page === 0);
}
function existPage(page) {
    return page >= 0 && page <= getMaxPage();
}
function getMaxPage() {
    return Math.floor((pages.length - 1) / 10);
}
function updateQuantity(card, quantity) {
    for (var i = 0; i < collection.length; i++) {
        var collectionCard = collection[i];
        if (collectionCard.id === card.id && collectionCard.shiny === card.shiny) {
            collectionCard.quantity += quantity;
        }
    }
}
function updateQuantities(cardId, shiny, quantity) {
    for (var i = 0; i < collection.length; i++) {
        var card = collection[i];
        if (card.id === cardId && card.shiny === shiny) {
            card.quantity = quantity;
        }
    }
}
function isRemoved(card) {
    var removed = false;
    removed = card.shiny !== $('#shinyInput').prop('checked');
    if (!removed) {
        var rarities = [];
        $(".rarityInput").each(function(index) {
            if ($(this).prop('checked')) {
                rarities.push($(this).attr('rarity'));
            }
        });
        if (rarities.length > 0) {
            removed = !rarities.includes(card.rarity);
        }
    }
    if (!removed) {
        var baseGen = $('#baseGenInput').prop('checked');
        if (!baseGen) {
            removed = card.rarity === "BASE" || card.rarity === "TOKEN";
        }
    }
    if (!removed) {
        var monster = $('#monsterInput').prop('checked');
        var spell = $('#spellInput').prop('checked');
        if (monster && !spell) {
            removed = card.typeCard !== 0;
        } else if (!monster && spell) {
            removed = card.typeCard !== 1;
        }
    }
    if (!removed) {
        var undertale = $('#undertaleInput').prop('checked');
        var deltarune = $('#deltaruneInput').prop('checked');
        if (undertale && !deltarune) {
            removed = card.extension !== "BASE";
        } else if (!undertale && deltarune) {
            removed = card.extension !== "DELTARUNE";
        }
    }
    if (!removed) {
        var searchValue = $('#searchInput').val().toLowerCase();
        if (searchValue.length > 0) {
            var findableString = "";
            findableString += $.i18n('card-name-' + card.id, 1);
            findableString += $.i18n('card-' + card.id);
            for (var i = 0; i < card.tribes.length; i++) {
                var tribe = card.tribes[i];
                findableString += $.i18n('tribe-' + tribe.toLowerCase().replace(/_/g, '-'));
            }
            if (card.hasOwnProperty('soul')) {
                findableString += $.i18n('soul-' + card.soul.name.toLowerCase().replace(/_/g, '-'));
            }
            var finalString = findableString.toLowerCase().replace(/(<.*?>)/g, '');
            removed = !finalString.includes(searchValue);
        }
    }
    return removed;
}
