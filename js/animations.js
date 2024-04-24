function shakeScreen() {

    if (shakeEnabled) {

        var $mainContent = $('.mainContent');
        $mainContent.effect("shake", { direction: "up", times: 1, distance: 5 }, 25);
        $mainContent.effect("shake", { direction: "right", times: 1, distance: 5 }, 25);
        $mainContent.effect("shake", { direction: "up", times: 1, distance: 5 }, 25);
        $mainContent.effect("shake", { direction: "right", times: 1, distance: 5 }, 25);

        playSound('bigDamage');
    }
}

function saveAnimation() {
    if (vfxEnabled) {
        var fileSavedText = $.i18n('animation-save');
        var saveText = '<div id="save-text-animation" class="vfx" style="position: absolute; z-index: 100; top: 255px; left: 345px;"><h1>' + fileSavedText + '</h1></div>';
        $('#board').append(saveText);

        setTimeout(function () {
            $('#save-text-animation').fadeOut(500);
        }, 1000);

        setTimeout(function () {
            $('#save-text-animation').remove();
        }, 1500);
    }
}

function loadAnimation() {
    if (vfxEnabled) {
        var fileLoadText = $.i18n('animation-load');
        var loadText = '<div id="load-text-animation" class="vfx" style="position: absolute; z-index: 100; top: 255px; left: 330px;"><h1>' + fileLoadText + '</h1></div>';
        $('#board').append(loadText);

        playSound('load');

        setTimeout(function () {
            $('#load-text-animation').fadeOut(500);
        }, 1000);

        setTimeout(function () {
            $('#load-text-animation').remove();
        }, 1500);
    }
}

function blackOut() {
    $('body').css('background', '#000 no-repeat');
    $('#game-page').hide();
    playSound('blackout');

    setTimeout(function () {
        $('body').css('background', '#000 url(\'aprilimages/backgrounds/' + numBackground + '.png\') no-repeat');
        $('#game-page').show();
    }, 700);
}

function CardAnimationCreator(animationName, maxTime, additionalTop = 0) {
    return (idCard) => {
        if (!vfxEnabled) {
            return;
        }
        var $card = $('#' + idCard);
        if (!$card.length) {
            return;
        }
        var position = $card.offset();
        var left = position.left + 8;
        var top = position.top + 8 + additionalTop;
        PlayVFXAnimation(animationName, top, left, 230, maxTime);
    }
}

function PlayVFXAnimation(name, top, left, height, maxTime, parent = document.body) {
    /**@type {HTMLVideoElement} */
    var animation = document.createElement("VIDEO");
    //animation.src = `/aprilimages/vfx/${name}.png`; 
    animation.src = `https://github.com/elytrafae/uc-changes/raw/main/test_video/vfx/${name}.webm`;
    animation.autoplay = true;
    animation.loop = true;
    animation.style = `position: absolute; left: ${left}px; top: ${top}px; z-index: 20; height: ${height}px;`;

    parent.appendChild(aniamtion);
    setTimeout(function () {
        animation.remove();
    }, maxTime);
}

silenceAnimation = CardAnimationCreator("Silence", 1680, 8);

function spellAnimation() {
    if (vfxEnabled) {
        PlayVFXAnimation("Spell", 315, 90, 390, 1150, document.getElementById("board"));
    }
}

attackBuffAnimation = CardAnimationCreator("AttackBuff", 870);
hpBuffAnimation = CardAnimationCreator("HpBuff", 870);
attackDebuffAnimation = CardAnimationCreator("AttackDebuff", 810);
hpDebuffAnimation = CardAnimationCreator("HpDebuff", 810);
freezeAnimation = CardAnimationCreator("Ice", 1200);
poisonAnimation = CardAnimationCreator("Poison", 800);

_healAnimationCard = CardAnimationCreator("Heal", 600);
function healAnimation(target, idTarget) {
    if (vfxEnabled) {
        if (target === 'PLAYER') {
            var $hpBar = $('#user' + idTarget + ' .hpBar');
            if ($hpBar.length) {
                PlayVFXAnimation("Heal_Player", top, left, 112, 820);
            }
        } else if (target === 'MONSTER') {
            _healAnimationCard(idTarget);
        }
    }
}

function hpStatAnimation(target, idTarget, value) {
    if (statsEnabled) {

        var finalText = value;
        var colorClass = 'damaged';

        if (value >= 0) {
            finalText = '+' + finalText;
            colorClass = 'hp-color';
        }

        if (target === 'MONSTER') {

            var $card = $('#' + idTarget);

            if ($card.length) {

                var position = $card.offset();

                var left = position.left + 68;
                var top = position.top + 208;

                var $animation = $('<div class="stat-change ' + colorClass + '" style="left:' + left + 'px; top:' + top + 'px;">' + finalText + '</div>');

                $('body').append($animation);

                setTimeout(function () {
                    $animation.remove();
                }, 700);
            }
        } else if (target === 'PLAYER') {

            var $hpBar = $('#user' + idTarget + ' .hpBar');

            if ($hpBar.length) {

                var position = $hpBar.offset();

                var left = position.left + 16;
                var top = position.top;

                var $animation = $('<div class="stat-change ' + colorClass + '" style="left:' + left + 'px; top:' + top + 'px;">' + finalText + '</div>');

                $('body').append($animation);

                setTimeout(function () {
                    $animation.remove();
                }, 700);

            }
        }
    }
}

function costStatAnimation(target, idTarget, value) {
    if (statsEnabled) {
        var $card = $('#' + idTarget);

        if ($card.length) {

            var position = $card.offset();

            var left = position.left + 68;
            var top = position.top + 8;

            var finalText = value;
            var colorClass = 'cost-buff';

            if (value >= 0) {
                finalText = '+' + finalText;
                colorClass = 'cost-debuff';
            }

            var $animation = $('<div class="stat-change ' + colorClass + '" style="left:' + left + 'px; top:' + top + 'px;">' + finalText + '</div>');

            $('body').append($animation);

            setTimeout(function () {
                $animation.remove();
            }, 700);
        }
    }
}

function attackStatAnimation(target, idTarget, value) {
    if (statsEnabled) {
        var $card = $('#' + idTarget);

        if ($card.length) {

            var position = $card.offset();

            var left = position.left - 58;
            var top = position.top + 208;

            var finalText = value;
            var colorClass = 'attack-debuff';

            if (value >= 0) {
                finalText = '+' + finalText;
                colorClass = 'attack-buff';
            }

            var $animation = $('<div class="stat-change ' + colorClass + '" style="left:' + left + 'px; top:' + top + 'px;">' + finalText + '</div>');

            $('body').append($animation);

            setTimeout(function () {
                $animation.remove();
            }, 700);
        }
    }
}

function barrierBreak() {

    var $barrierAnimation = $('<img class="vfx" src="/aprilimages/vfx/BarrierBreak.png?v=' + animationCounter + '" style="position: absolute; left: 0; top: 0; z-index: 30; width: 100%; height: 100%;" />');

    $('body').append($barrierAnimation);

    setTimeout(function () {

        playSound('barrierBreak');

        setTimeout(function () {

            playSound('barrierBreak2');

            setTimeout(function () {
                $barrierAnimation.remove();
            }, 500);

        }, 2750);

    }, 500);
}