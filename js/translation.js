var availableLanguages = ["en", "fr", "es", "pt", "cn", "it", "pl", "de", "ru"];

var tipsGeneratorId = 0;

var translationReady = false;

var translationEvent = new Event('translationReady');

function loadTranslation(language) {

    var langs = ["en"];
    langs.push(language);

    var languagesObject = {};

    for (var i = 0; i < langs.length; i++) {
        var lang = langs[i];
        languagesObject[lang] = '/translation/' + lang + '.json?v=' + translateVersion
    }

    $.i18n().debug = false;
    $.i18n().locale = language;
    $.i18n().load(languagesObject).done(function () {
        langs.forEach((lang) => {
            processLanguage(lang);
        })

        $.extend($.i18n.parser.emitter, {
            ucp: function (nodes) {
                return '<span class="ucp">' + nodes[0] + '</span>';
            },
            tribe: function (nodes) {
                if (nodes.length > 0) {
                    var quantity = 1;
                    if (nodes.length === 2) {
                        quantity = nodes[1];
                    }

                    var tribeStringKey = 'tribe-' + nodes[0].toLowerCase().replace(/_/g, '-');
                    var text = '';
                    var overrideText = checkOverride(nodes);

                    if (overrideText === null) {
                        text = $.i18n(tribeStringKey, quantity);
                    } else {
                        text = overrideText;
                    }

                    return '<span class="underlined helpPointer" oncontextmenu="showTribeCards(\'' + nodes[0] + '\');">' + text + '</span>';
                }
            },
            soul: function (nodes) {
                if (nodes.length > 0) {
                    var soul = nodes[0];
                    var soulStringKey = 'soul-' + soul.replace(/_/g, '-').toLowerCase();

                    var text = '';
                    var overrideText = checkOverride(nodes);

                    if (overrideText === null) {
                        text = $.i18n(soulStringKey);
                    } else {
                        text = overrideText;
                    }

                    return '<span class="' + soul + ' pointer" onclick="soulInfo(\'' + soul + '\');">' + text + '</span>';
                }
            },
            kw: function (nodes) {
                if (nodes.length > 0) {
                    var keyword = nodes[0];
                    var keywordClean = keyword.replace(/_/g, '-').toLowerCase();
                    var keywordStringKey = 'kw-' + keywordClean;

                    var overrideText = checkOverride(nodes);
                    var text = overrideText || $.i18n(keywordStringKey);

                    return '<span class="kw-'+keywordClean+' helpPointer underlined" oncontextmenu="displayStringKeyMessage(\'' + keywordStringKey + '\');">' + text + '</span>';
                }
            },
            artifact: function (nodes) {
                if (nodes.length > 0) {
                    var artifactId = nodes[0];
                    var artifactNameKey = 'artifact-name-' + artifactId;

                    var overrideText = checkOverride(nodes);
                    var text = overrideText || $.i18n(artifactNameKey);

                    return '<span class="helpPointer underlined" oncontextmenu="artifactInfo(' + artifactId + ');">' + text + '</span>';
                }
            },
            hp: StatHelper("stat-hp", "hp-color"),
            atk: StatHelper("stat-atk", "atk-color"),
            gold: StatHelper("stat-gold", "yellow"),
            cost: StatHelper("stat-cost", "cost-color"),
            dmg: StatHelper("stat-dmg", "dmg-color"),
            kr: function (nodes) {
                var overrideText = checkOverride(nodes);
                var text = overrideText || $.i18n('stat-kr');
                return '<span class="PERSEVERANCE helpPointer" oncontextmenu="displayStatusStringKey(\'status-kr\', [])">' + text + '</span>';
            },
            card: function (nodes) {
                if (nodes.length > 0) {
                    var idCard = parseInt(nodes[0]);
                    var text = '';
                    var overrideText = checkOverride(nodes);
                    if (overrideText === null) {
                        var quantity = 1;
                        if (nodes.length > 1) {
                            var arg = nodes[1];
                            if (!isNaN(arg)) {
                                quantity = parseInt(arg);
                            }
                        }
                        text = $.i18n('card-name-' + idCard, quantity);
                    } else {
                        text = overrideText;
                    }


                    return '<span onmouseover="displayCardHelp(this, ' + idCard + ');" onmouseleave="removeCardHover();" class="PATIENCE">' + text + '</span>';
                }
            },
            mode: function (nodes) {
                if (nodes.length === 1) {
                    var mode = nodes[0];
                    var stringKey = 'game-type-' + mode.replace(/_/g, '-').toLowerCase();
                    return $.i18n(stringKey);
                }
            },
            rarity: function (nodes) {
                if (nodes.length >= 1) {
                    var rarity = nodes[0];
                    var stringKey = 'rarity-' + rarity.replace(/_/g, '-').toLowerCase();

                    var overrideText = checkOverride(nodes);
                    var text = overrideText || $.i18n(stringKey);

                    var rarityText = '<span class="'+rarity+'">' + text + '</span>';
                    if (nodes.length == 1) {
                        return rarityText;
                    }
                    var icon = `<span class="rarityImageContainer"><img style="height: 1.5em;" src="/images/rarity/${nodes[1]}_${nodes[0]}.png"><span class="rarityImageHover"><span style="padding: 0.2em 0.5em;">${rarityText}</span><span class="rarityImageHoverArrow"></span></span></span>`;
                    return icon;
                }
            },
            division: function (nodes) {
                if (nodes.length > 0) {
                    var short = nodes.length === 2;
                    var division = nodes[0];
                    var rank = "LEGEND";
                    var number = "";
                    if (division !== "LEGEND") {
                        rank = division.substr(0, division.indexOf('_'));
                        if (!short) {
                            number = division.split('_')[1];
                        }
                    }
                    var key = 'division-' + rank.replace(/_/g, '-').toLowerCase();
                    var divisionName = $.i18n(key);
                    if (short) {
                        divisionName = divisionName.substring(0, 1);
                    }
                    return '<span class="' + rank + '_NEON">' + divisionName + ' ' + number + '</span>';
                }
            },
            cosmetic: function (nodes) {
                if (nodes.length === 2) {
                    var cosmetic = nodes[0];
                    var name = nodes[1];
                    return $.i18n('reward-' + cosmetic) + ' - ' + name;
                }
            },
            style: function (nodes) {
                return `<span class="${nodes[0]}">${nodes[1]}</span>`;
            },
            switch_left: SwitchPartHelper("Left"),
            switch_right: SwitchPartHelper("Right")
        });

        $('body').i18n();

        $("[data-i18n-custom]").each(function () {
            translateElement($(this));
        });

        $("[data-i18n-value]").each(function () {
            translateElement($(this));
        });

        $("[data-i18n-title]").each(function () {
            translateElement($(this));
        });

        $("[data-i18n-placeholder]").each(function () {
            translateElement($(this));
        });


        $("[data-i18n-tips]").each(function () {

            var $this = $(this);

            var customClass = 'tips-' + tipsGeneratorId;

            $this.addClass(customClass);

            var tipsMessage = $.i18n($this.attr('data-i18n-tips'));

            tippy('.' + customClass, {
                content: tipsMessage
            });
        });

        translationReady = true;
        document.dispatchEvent(translationEvent);

    });
}

function translateElement(element) {

    if (element.attr('data-i18n-custom')) {

        var finalArgs = [];
        var stringKey = element.attr('data-i18n-custom');
        var args = element.attr('data-i18n-args').split(',');

        finalArgs.push(stringKey);

        for (var i = 0; i < args.length; i++) {
            var arg = args[i];
            if (!isNaN(arg)) {
                finalArgs.push(parseInt(arg));
            } else {
                finalArgs.push(arg)
            }
        }

        element.html($.i18n.apply($.i18n, finalArgs));
    } else if (element.attr('data-i18n-value')) {
        element.attr('value', htmlDecode($.i18n(element.attr('data-i18n-value'))));
    } else if (element.attr('data-i18n-placeholder')) {
        element.attr('placeholder', htmlDecode($.i18n(element.attr('data-i18n-placeholder'))));
    } else if (element.attr('data-i18n-title')) {
        element.attr('title', htmlDecode($.i18n(element.attr('data-i18n-title'))));
    } else {
        element.i18n();
    }
}

function translateFromServerJson(message) {
    var jMessage = JSON.parse(message);
    if (jMessage.hasOwnProperty('args')) {
        var args = JSON.parse(jMessage.args);
        return $.i18n.apply($.i18n, args);
    }
}

function getLanguage() {
    var userLanguage = window.navigator.language.substring(0, 2);
    var storedLanguage = localStorage.getItem('language');
    var finalLanguage;

    if (typeof Android !== 'undefined') {
        userLanguage = Android.getCountryCode();
    }

    if (storedLanguage !== null) {
        finalLanguage = storedLanguage;
    } else {
        finalLanguage = userLanguage;
    }

    localStorage.setItem('language', finalLanguage);

    return finalLanguage;
}

function checkOverride(nodes) {

    for (var i = 0; i < nodes.length; i++) {

        var node = nodes[i].toString();

        if (node.startsWith("override=")) {

            var splitValues = node.split('=');

            if (splitValues.length > 1) {
                return splitValues[1];
            }
        }
    }

    return null;
}

function htmlDecode(input) {
    var e = document.createElement('div');
    e.innerHTML = input;
    return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
}

// elytrafae additions //

var card_numbers_regex = /[+-]?(\d+)\/[+-]?(\d+)(?:\/[+-]?(\d+))?/gm;
var card_number_color_classes = ['cost-color', 'atk-color', 'hp-color'];

function isKeyEffectDesc(key) {
    if (key.startsWith("card-")) {
        return !key.startsWith("card-name-");
    }
    if (key.startsWith("artifact-")) {
        return !key.startsWith("artifact-name-");
    }
    if (key.startsWith("kw-") || key.startsWith("soul-")) {
        return key.endsWith("-desc");
    }
    return key.startsWith("status-");
}

function processLanguage(lan = "en") {
    var messages = $.i18n.messageStore.messages[lan];
    for (var key in messages) {
        if (isKeyEffectDesc(key)) {
            $.i18n.messageStore.set(lan, {[key]: processString(messages[key])});
        }
    }
}

function processString(text) {
    text = text.replaceAll(card_numbers_regex, StatColorRegexProcessor);
    return text;
}

function StatColorRegexProcessor(full, stat1, stat2, stat3) {
    //console.log(full, stat1, stat2, stat3);
    var parts = full.split("/");

    for (var i=0; i < parts.length; i++) {
        var color_class = card_number_color_classes[i + (card_number_color_classes.length - parts.length)];
        //console.log("Color class: ", color_class);
        var prefix = '';
        if (parts[i][0] == "+" || parts[i][0] == "-") {
            prefix = parts[i][0];
            parts[i] = parts[i].substr(1);
        }
        parts[i] = prefix + '<span class="' + color_class + '">' + parts[i] + '</span>';
        //console.log("parts[i]", i, parts[i]);
    }
    //console.log(parts);
    return parts.join("/");
}

function SwitchPartHelper(className) {
    return (nodes) => {
        var opacity = Number(nodes[0]);
        if (isNaN(opacity)) {
            opacity = 1;
        }
        var classPart = `class="SwitchHighlight_${className}" `;
        var text = nodes[1];
        return `<span ${classPart}style="${opacity <= 0 ? "display:none;" : ""}">${text}</span>`;
    }
}

function StatHelper(translation_key, textClass) {
    return (nodes) => {
        var finalText = '', number = 1;
        if (nodes.length > 0) {
            number = nodes[0];
            finalText = number + ' ';
        }
    
        var text = '';
        var overrideText = checkOverride(nodes);
    
        if (overrideText === null) {
            text = `<span class="${textClass}">${$.i18n(translation_key, number)}</span>`;
        } else {
            text = `<span class="${textClass}">${overrideText}</span>`;
        }
    
        finalText += text;
        return finalText;
    }
}

///////////////////////////

loadTranslation(getLanguage());