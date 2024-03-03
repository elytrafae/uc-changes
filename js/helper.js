var effects = {};
var tribeDialogOpen = false;
function initHelper() {
    $(document).on('contextmenu', function(e) {
        if ($(e.target).hasClass("helpPointer")) {
            return false;
        }
    });
}

class PowerInfoGroup {

    static ALL_GROUPS = [];
    static ANY = new PowerInfoGroup((card) => true);
    static MONSTER_ONLY = new PowerInfoGroup((card) => card.typeCard === 0);
    static SPELL_ONLY = new PowerInfoGroup((card) => card.typeCard === 1);

    constructor(/**@type {Function}*/ cond = (card) => true) {
        /**@type {Function}*/
        this.condition = cond;
        PowerInfoGroup.ALL_GROUPS.push(this);
    }

}

class PowerInfoArgs {

    static EMPTY = new PowerInfoArgs();

    constructor(args = [], number = null) {
        this.args = args;
        this.number = number;
    }

}

class PowerInfo {

    /**@type {Map<PowerInfoGroup,PowerInfo[]>} */
    static ALL_POWER_INFOS = new Map();

    static setUpAllPowerInfos() {
        PowerInfoGroup.ALL_GROUPS.forEach((group) => {
            this.ALL_POWER_INFOS.set(group, []);
        })
    }

    constructor(/**@type {Function}*/ cond = (card) => true, /**@type {string} */ powerId, /**@type {string} */ transKey = powerId, /**@type {PowerInfoGroup} */ group = PowerInfoGroup.ANY) {
        this.condition = cond;
        this.powerId = powerId;
        this.transKey = transKey;
        PowerInfo.ALL_POWER_INFOS.get(group).push(this);
    }

    getPowerId(card) {
        return this.powerId;
    }

    getTransKey(card) {
        return this.transKey;
    }

    getArguments(card) {
        return PowerInfoArgs.EMPTY;
    }

}

class StatPowerInfo extends PowerInfo {
    constructor(/**@type {string}*/ property, /**@type {string}*/ origProperty, /**@type {string} */ powerIdPart, /**@type {string} */ transKeyPart = powerId, /**@type {boolean} */ isInverted = false, /**@type {PowerInfoGroup} */ group) {
        super((card) => card[this.property] !== card[this.origProperty], powerIdPart, transKeyPart, group);
        this.property = property;
        this.origProperty = origProperty;
    }
    getPowerId(card) {
        var isBuffed = card[this.property] > card[this.origProperty];
        return (isBuffed && !isInverted ? "bonus" : "malus") + this.powerId;
    }
    getTransKey(card) {
        var isBuffed = card[this.property] > card[this.origProperty];
        return `status-${this.transKey}-${(isBuffed ? "buff" : "debuff")}`;
    }
    getArguments(card) {
        var prop = card[this.property];
        return new PowerInfoArgs([prop], null);
    }
}

class NumberedPowerInfo extends PowerInfo {
    constructor(/**@type {string}*/ property, /**@type {string} */ powerId, /**@type {string} */ transKey = powerId, /**@type {PowerInfoGroup} */ group) {
        super((card) => card[this.property], powerId, transKey, group);
        this.property = property;
    }
    getArguments(card) {
        var prop = card[this.property];
        return new PowerInfoArgs([prop], prop);
    }
}
PowerInfo.setUpAllPowerInfos();

const CARD_POWER_INFOS = {
    COST: new StatPowerInfo("cost", "otiginalCost", "Cost", "cost", true, PowerInfoGroup.ANY),
    DETERMINATION: new PowerInfo((card) => card.rarity === "DETERMINATION", "determination", "status-determination", PowerInfoGroup.ANY),
    LOOP: new NumberedPowerInfo("loop", "loop", "status-loop", PowerInfoGroup.ANY),
    // Monsters only
    TAUNT: new PowerInfo((card) => card.taunt, "taunt", "status-taunt", PowerInfoGroup.MONSTER_ONLY),
    CHARGE: new PowerInfo((card) => card.charge, "charge", "status-charge", PowerInfoGroup.MONSTER_ONLY),
    HASTE: new PowerInfo((card) => card.haste, "haste", "status-haste", PowerInfoGroup.MONSTER_ONLY),
    ATK: new StatPowerInfo("attack", "originalAttack", "Atk", "atk", false, PowerInfoGroup.MONSTER_ONLY),
    HP: new StatPowerInfo("maxHp", "originalHp", "Hp", "hp", false, PowerInfoGroup.MONSTER_ONLY),
};

function setInfoPowers($card, card) {
    $card.find('.cardStatus').empty();
    var powers = [];
    if (card.typeCard === 0) {
        if (card.attack > card.originalAttack) {
            powers.push("bonusAtk");
            powersStringKeys.push('status-atk-buff');
            powersStringArgs.push([card.originalAttack]);
            powersStringNumbers.push(null);
        }
        if (card.attack < card.originalAttack) {
            powers.push("malusAtk");
            powersStringKeys.push('status-atk-debuff');
            powersStringArgs.push([card.originalAttack]);
            powersStringNumbers.push(null);
        }
        if (card.maxHp > card.originalHp) {
            powers.push("bonusHp");
            powersStringKeys.push('status-hp-buff');
            powersStringArgs.push([card.originalHp]);
            powersStringNumbers.push(null);
        }
        if (card.paralyzed) {
            powers.push("paralyzed");
            powersStringKeys.push('status-paralyzed');
            powersStringArgs.push([]);
            powersStringNumbers.push(null);
        }
        if (card.candy) {
            powers.push("candy");
            powersStringKeys.push('status-candy');
            powersStringArgs.push([]);
            powersStringNumbers.push(null);
        }
        if (card.kr) {
            powers.push("poison");
            powersStringKeys.push('status-kr');
            powersStringArgs.push([]);
            powersStringNumbers.push(null);
        }
        if (card.armor > 0) {
            powers.push("armor");
            powersStringKeys.push('status-armor');
            powersStringArgs.push([]);
            powersStringNumbers.push(null);
        }
        if (card.dodge > 0) {
            powers.push("dodge");
            powersStringKeys.push('status-dodge');
            powersStringArgs.push([card.dodge]);
            powersStringNumbers.push(card.dodge);
        }
        if (card.burn > 0) {
            powers.push("burn");
            powersStringKeys.push('status-burn');
            powersStringArgs.push([card.burn]);
            powersStringNumbers.push(card.burn);
        }
        if (card.cantAttack) {
            powers.push("cantAttack");
            powersStringKeys.push('status-disarmed');
            powersStringArgs.push([]);
            powersStringNumbers.push(null);
        }
        if (card.anotherChance) {
            powers.push("anotherChance");
            powersStringKeys.push('status-another-chance');
            powersStringArgs.push([]);
            powersStringNumbers.push(null);
        }
        if (card.invulnerable) {
            powers.push("invulnerable");
            powersStringKeys.push('status-invulnerable');
            powersStringArgs.push([]);
            powersStringNumbers.push(null);
        }
        if (card.transparency) {
            powers.push("transparency");
            powersStringKeys.push('status-transparency');
            powersStringArgs.push([]);
            powersStringNumbers.push(null);
        }
        if (card.silence) {
            powers.push("silenced");
            powersStringKeys.push('status-silenced');
            powersStringArgs.push([]);
            powersStringNumbers.push(null);
        }
        if (card.caughtMonster !== undefined) {
            powers.push("box");
            powersStringKeys.push('status-caught');
            var caughtCardTranslated = $.i18n('{{CARD:' + card.caughtMonster.fixedId + '|1}}');
            powersStringArgs.push([caughtCardTranslated, card.caughtMonster.owner.username]);
            powersStringNumbers.push(null);
        }
        if (card.shockEnabled) {
            powers.push("shock");
            powersStringKeys.push('status-shock');
            powersStringArgs.push([]);
            powersStringNumbers.push(null);
        }
        if (card.supportEnabled) {
            powers.push("support");
            powersStringKeys.push('status-support');
            powersStringArgs.push([]);
            powersStringNumbers.push(null);
        }
    }
    if (card.creatorInfo !== undefined && card.creatorInfo.typeCreator >= 0) {
        powers.push("created");
        powersStringKeys.push('status-created');
        var creatorCardTranslated = '';
        if (card.creatorInfo.typeCreator === 0) {
            creatorCardTranslated = $.i18n('{{CARD:' + card.creatorInfo.id + '|1}}');
        } else if (card.creatorInfo.typeCreator === 1) {
            creatorCardTranslated = $.i18n('{{ARTIFACT:' + card.creatorInfo.id + '}}');
        } else if (card.creatorInfo.typeCreator === 2) {
            creatorCardTranslated = $.i18n('{{SOUL:' + card.creatorInfo.name + '}}');
        }
        powersStringArgs.push([creatorCardTranslated]);
        powersStringNumbers.push(null);
    }
    for (var i = 0; i < powersStringArgs.length; i++) {
        var args = powersStringArgs[i];
        for (var j = 0; j < args.length; j++) {
            args[j] = base64EncodeUnicode(args[j]);
        }
    }
    for (var i = 0; i < powersStringKeys.length; i++) {
        var $cardContainerImage = $card.find('.cardStatus');
        $cardContainerImage.append('<img style="right: ' + (i * 20) + 'px;" power="' + powers[i] + '" class="infoPowers helpPointer" src="images/powers/' + powers[i] + '.png" oncontextmenu="displayStatusStringKey(' + formatArgs(powersStringKeys[i], powersStringArgs[i]) + ');">');
        if (powersStringNumbers[i] !== null) {
            $cardContainerImage.append('<span style="right: ' + (i * 20) + 'px;" class="infoPowersDetails helpPointer" oncontextmenu="displayStatusStringKey(' + formatArgs(powersStringKeys[i], powersStringArgs[i]) + ');">' + powersStringNumbers[i] + '</span>');
        }
    }
    var tribes = card.tribes;
    if (tribes.indexOf('ALL') > -1) {
        var $cardContainerImage = $card.find('.cardTribes');
        $cardContainerImage.append('<img style="right: 4px;" class="tribe helpPointer" src="images/tribes/ALL.png" oncontextmenu="showTribeCards(\'ALL\');"/>');
    } else {
        for (var i = 0; i < tribes.length; i++) {
            var cardContainerImage = $card.find('.cardTribes');
            cardContainerImage.append('<img style="right: ' + (i * 20) + 'px;" class="tribe helpPointer" src="images/tribes/' + tribes[i] + '.png" oncontextmenu="showTribeCards(\'' + tribes[i] + '\');"/>');
        }
    }
}
function formatArgs(key, stringArgs) {
    var finalString = "'" + key + "'";
    for (var i = 0; i < stringArgs.length; i++) {
        var arg = stringArgs[i];
        finalString += ", '";
        finalString += arg;
        finalString += "'";
    }
    return finalString;
}
function displayStatusStringKey() {
    var translateArguments = [];
    translateArguments.push(arguments[0]);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            translateArguments.push(atob(arguments[i]));
        }
    }
    var text = $.i18n.apply($.i18n, translateArguments);
    BootstrapDialog.show({
        title: $.i18n('dialog-information'),
        message: '<p>' + text + '</p>',
        buttons: [{
            label: $.i18n('dialog-ok'),
            cssClass: 'btn-primary',
            action: function(dialog) {
                dialog.close();
            }
        }]
    });
}
function displayStringKeyMessage(stringKey) {
    var keywordDescStringKey = stringKey + '-desc';
    var message = $.i18n(keywordDescStringKey);
    BootstrapDialog.show({
        title: $.i18n(stringKey),
        message: '<p>' + message + '</p>',
        buttons: [{
            label: $.i18n('dialog-ok'),
            cssClass: 'btn-primary',
            action: function(dialog) {
                dialog.close();
            }
        }]
    });
}
function soulInfo(soul) {
    var soulStringKey = 'soul-' + soul.replace('_', '-').toLowerCase();
    var soulDescStringKey = soulStringKey + '-desc';
    var name = $.i18n(soulStringKey);
    var message = '<img src="images/souls/' + soul + '.png"/> <span class="' + soul + '">' + name + ' </span><br/><br/>' + $.i18n(soulDescStringKey);
    BootstrapDialog.show({
        title: name,
        message: '<p>' + message + '</p>',
        buttons: [{
            label: $.i18n('dialog-ok'),
            cssClass: 'btn-primary',
            action: function(dialog) {
                dialog.close();
            }
        }]
    });
}
function base64EncodeUnicode(str) {
    var utf8Bytes = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
        return String.fromCharCode('0x' + p1);
    });
    return btoa(utf8Bytes);
}
function artifactInfo(idArtifact) {
    var artifactName = $.i18n('artifact-name-' + idArtifact);
    var artifactDesc = $.i18n('artifact-' + idArtifact);
    BootstrapDialog.show({
        title: artifactName,
        message: '<p>' + artifactDesc + '</p>',
        buttons: [{
            label: $.i18n('dialog-ok'),
            cssClass: 'btn-primary',
            action: function(dialog) {
                dialog.close();
            }
        }]
    });
}
function artifactsInfo(box) {
    if ($(box).find('.artifact-img').length > 0) {
        var text = "";
        $(box).find('.artifact-img').each(function() {
            var artifactId = $(this).attr("artifactId");
            var name = $.i18n('artifact-name-' + artifactId);
            var image = $(this).attr("image");
            var legendary = $(this).attr("legendary");
            if (legendary === "true") {
                name = '<span class="yellow">' + name + '</span>';
            }
            text = text + '<p><img style="height:32px;" src="images/artifacts/' + image + '.png"> ' + name + ' : ' + $.i18n('artifact-' + artifactId) + '</p>';
        });
        BootstrapDialog.show({
            title: $.i18n('dialog-information'),
            message: text,
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
function displayCardHelp(slot, idCard, shiny) {
    var position = $(slot).offset();
    showCardHover(idCard, shiny, position.left - 176, position.top - 190);
}
function showTribeCards(tribe) {
    if (!tribeDialogOpen) {
        if (allCards.length > 0) {
            var tribeCards = [];
            for (var i = 0; i < allCards.length; i++) {
                var card = allCards[i];
                if (card.tribes.indexOf(tribe) > -1) {
                    tribeCards.push(card);
                }
            }
            if (tribeCards.length > 0) {
                tribeDialogOpen = true;
                var tribeName = $.i18n('tribe-' + tribe.replace(/_/, '-').toLowerCase());
                var text = '<div id="tribeCards" class="container cardsPreview no-hover">';
                for (var i = 0; i < tribeCards.length; i++) {
                    var $tribeCard = appendCard(tribeCards[i], null);
                    $tribeCard.addClass('col-md-2');
                    $tribeCard.removeClass('pointer');
                    $tribeCard.find('.tribe').removeClass('helpPointer');
                    $tribeCard.find('.descTribe').removeClass('helpPointer');
                    text += $tribeCard.prop('outerHTML');
                }
                text += '</div>';
                BootstrapDialog.show({
                    title: tribeName,
                    size: BootstrapDialog.SIZE_WIDE,
                    message: text,
                    buttons: [{
                        label: $.i18n('dialog-ok'),
                        cssClass: 'btn-primary',
                        action: function(dialog) {
                            dialog.close();
                        }
                    }],
                    onhide: function(dialogRef) {
                        tribeDialogOpen = false;
                    }
                });
            }
        }
    }
}
function getResizedFontSize(container, maxHeight) {
    var fontSize = 12;
    var max = 10;
    var i = 0;
    var $clonedContainer = container.parent().clone();
    $clonedContainer.appendTo('body');
    $clonedContainer.css('font-size', fontSize + 'px');
    var $clonedContainerDiv = $clonedContainer.find('div');
    while ($clonedContainerDiv.outerHeight() >= maxHeight && i < max) {
        fontSize = fontSize - 0.5;
        $clonedContainer.css('font-size', fontSize + 'px');
        i++;
    }
    $clonedContainer.remove();
    return fontSize;
}
function cloneList(list) {
    var clonedList = [];
    for (var i = 0; i < list.length; i++) {
        var element = list[i];
        clonedList.push(JSON.parse(JSON.stringify(element)));
    }
    return clonedList;
}
function compare(a, b) {
    if (a > b)
        return +1;
    if (a < b)
        return -1;
    return 0;
}
initHelper();
