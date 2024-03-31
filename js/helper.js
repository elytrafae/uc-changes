var effects = {};
var tribeDialogOpen = false;
function initHelper() {
    $(document).on('contextmenu', function(e) {
        if ($(e.target).hasClass("helpPointer")) {
            return false;
        }
    });
}

class AbstractPowerInfo {

    /**@type {AbstractPowerInfo[]} */
    static ALL_POWER_INFOS = [];

    constructor() {
        AbstractPowerInfo.ALL_POWER_INFOS.push(this);
    }

    doesApply(card) {
        return false;
    }

    getPowerImage(card) {
        return "ERROR!";
    }

    getTranslationKey(card) {
        return "ERROR!";
    }

    getTranslateArguments(card) {
        return [];
    }

    hasNumber() {
        return false;
    }

    getNumber(card) {
        return 0;
    }

    render(card) {
        var translateArguments = this.getTranslateArguments(card).map(str => base64EncodeUnicode(str));
        return `
            <div class="infoPowersContainer">
                <img power="${this.getPowerImage(card)}" class="infoPowers helpPointer" src="images/powers/${this.getPowerImage(card)}.png" oncontextmenu="displayStatusStringKey(${formatArgs(this.getTranslationKey(card), translateArguments)});">
                ${this.hasNumber() ? `<span class="infoPowersDetails helpPointer" oncontextmenu="displayStatusStringKey(${formatArgs(this.getTranslationKey(card), translateArguments)});">${this.getNumber(card)}</span>` : ""}
            </div>
        `;
    }

}

class BasicPowerInfo extends AbstractPowerInfo {

    constructor(/**@type {string} */ name) {
        super();
        this.name = name;
    }

    doesApply(card) {
        return Boolean(card[this.name]);
    }

    getPowerImage(card) {
        return this.name;
    }

    getTranslationKey(card) {
        return `status-${this.name.toLowerCase()}`;
    }

}

class StatPowerInfo extends AbstractPowerInfo {
    constructor(/**@type {string}*/ name, /**@type {string}*/ baseName) {
        super();
        this.name = name;
        this.baseName = baseName;
    }
    doesApply(card) {
        return card[this.name] !== card[this.baseName];
    }
    getPowerImage(card) {
        var isBuffed = card[this.property] > card[this.origProperty];
        return (isBuffed ? "plus_" : "minus_") + this.name;
    }
    getTranslationKey(card) {
        var isBuffed = card[this.property] > card[this.origProperty];
        return `status-${this.name.toLowerCase()}-${(isBuffed ? "buff" : "debuff")}`;
    }
    getTranslateArguments(card) {
        return [card[this.baseName]];
    }
}

class NumberedPowerInfo extends BasicPowerInfo {
    getTranslateArguments(card) {
        return [card[this.name]];
    }
    hasNumber() {return true;}
    getNumber(card) {
        return card[this.name];
    }
}

class DTPowerInfo extends BasicPowerInfo {
    doesApply(card) {
        return card.rarity === "DETERMINATION";
    }
}

class CatchPowerInfo extends BasicPowerInfo {
    getTranslateArguments(card) {
        var caughtCardTranslated = $.i18n('{{CARD:' + card.caughtMonster.fixedId + '|1}}');
        return [caughtCardTranslated, card.caughtMonster.owner.username];
    }
}

class CreatorPowerInfo extends AbstractPowerInfo {

    doesApply(card) {
        return card.creatorInfo !== undefined && card.creatorInfo.typeCreator >= 0;
    }

    getPowerImage(card) {
        return "created";
    }

    getTranslationKey(card) {
        return "status-created";
    }

    getTranslateArguments(card) {
        var creatorCardTranslated = '';
        if (card.creatorInfo.typeCreator === 0) {
            creatorCardTranslated = $.i18n('{{CARD:' + card.creatorInfo.id + '|1}}');
        } else if (card.creatorInfo.typeCreator === 1) {
            creatorCardTranslated = $.i18n('{{ARTIFACT:' + card.creatorInfo.id + '}}');
        } else if (card.creatorInfo.typeCreator === 2) {
            creatorCardTranslated = $.i18n('{{SOUL:' + card.creatorInfo.name + '}}');
        }
        return [creatorCardTranslated];
    }

}

const CARD_POWER_INFOS = {
    COST: new StatPowerInfo("cost", "originalCost"),
    DETERMINATION: new DTPowerInfo("determination"),
    LOOP: new NumberedPowerInfo("loop"),
    // Monsters only
    TAUNT: new BasicPowerInfo("taunt"),
    CHARGE: new BasicPowerInfo("charge"),
    HASTE: new BasicPowerInfo("haste"),
    ATTACK: new StatPowerInfo("attack", "originalAttack"),
    MAXHP: new StatPowerInfo("maxHp", "originalHp"),
    PARALYZED: new BasicPowerInfo("paralyzed"),
    CANDY: new BasicPowerInfo("candy"),
    KR: new BasicPowerInfo("kr"),
    ARMOR: new BasicPowerInfo("armor"),
    DODGE: new NumberedPowerInfo("dodge"),
    BURN: new NumberedPowerInfo("burn"), // Why am I even keeping this? It's broken!
    DISARMED: new BasicPowerInfo("cantAttack"),
    ANOTHER_CHANCE: new BasicPowerInfo("anotherChance"), // This is broken anyway, so I don't care that I broke the translation key
    INVULNERABLE: new BasicPowerInfo("invulnerable"),
    TRANSPARENCY: new BasicPowerInfo("transparency"),
    SILENCED: new BasicPowerInfo("silence"),
    CAUGHT_MONSTER: new CatchPowerInfo("caughtMonster"),
    SHOCK_ENABLED: new BasicPowerInfo("shockEnabled"),
    SUPPORT_ENABLED: new BasicPowerInfo("supportEnabled"),
    // Last Ones
    CREATOR: new CreatorPowerInfo()
};

function setInfoPowers($card, card) {
    if (!card) {
        return;
    }
    var $cardStatusContainer = $card.find('.cardStatus');
    var statusHTML = "";
    AbstractPowerInfo.ALL_POWER_INFOS.forEach(powerInfo => {
        if (powerInfo.doesApply(card)) {
            statusHTML += powerInfo.render(card);
        }
    });
    $cardStatusContainer.html(statusHTML);

    // Tribes
    var tribes = [...card.tribes];
    if (tribes.indexOf("ALL") > -1) {
        tribes = ["ALL"];
    }
    var $cardTribeContainer = $card.find('.cardTribes');
    var tribesHTML = "";
    for (var i = 0; i < tribes.length; i++) {
        tribesHTML += `<img class="tribe helpPointer" src="images/tribes/${tribes[i]}.png" oncontextmenu="showTribeCards('${tribes[i]}');"/>`;
    }
    $cardTribeContainer.html(tribesHTML);
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
