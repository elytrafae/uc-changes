var chatNames = ["chat-discussion", "chat-strategy", "chat-beginner", "chat-tournament", "chat-roleplay", "chat-support", "chat-fr", "chat-ru", "chat-es", "chat-pt", "chat-it", "chat-de", "chat-cn", "chat-jp", "chat-tr", "chat-pl"];
var selfId;
var selfUsername;
var selfLevel;
var selfGroups;
var selfMainGroup;
var selfDivision;
var selfFriends;
var socketChat;
var chatsListOpen = false;
var lastChatId = 'chat-public-1';
var windows_focus_chat = true;
var usernames = [];
var autoCompleteUsername = null;
var usernamesIncrement = 0;
var publicChats = {};
var privateChats = {};
var openPublicChats = [];
var chatEmotes = [];
var emotesOpen = false;
var emoteDialog;
var chatRoomEmote;
var rainbowEnabled = localStorage.getItem("chatRainbowDisabled") === null;
var soundsEnabled = localStorage.getItem("chatSoundsDisabled") === null;
var chatAvatarsEnabled = localStorage.getItem("chatAvatarsDisabled") === null;
var url;
if (location.hostname === "localhost" || location.hostname === "127.0.0.1" || location.hostname.startsWith("192.168.")) {
    url = "ws://" + location.hostname + ":8080/chat";
} else {
    url = "wss://" + location.hostname + "/chat";
}
socketChat = new WebSocket(url);
socketChat.onmessage = onMessageChat;
socketChat.onclose = onCloseChat;
socketChat.onopen = onOpenChat;
function onOpenChat() {
    setInterval(function () {
        if (socketChat.readyState !== WebSocket.OPEN) return;
        socketChat.send(JSON.stringify({
            ping: "pong"
        }));
    }, 9000);
    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'hidden') {
            windows_focus_chat = false;
        } else {
            windows_focus_chat = true;
        }
    });
}
function onCloseChat() {
    $('.chat-messages').append('<li class="red">' + $.i18n("chat-disconnected") + '</li>');
    scrollAll();
}
function timeout(idUser, seconds) {
    socketChat.send(JSON.stringify({
        action: "timeout",
        id: idUser,
        seconds: seconds
    }));
}
function onMessageChat(event) {
    var data = JSON.parse(event.data);
    if (data.action === "getSelfInfos") {
        var user = JSON.parse(data.me);
        selfFriends = JSON.parse(data.friends);
        selfId = user.id;
        selfLevel = user.level;
        selfUsername = user.username;
        selfGroups = user.groups;
        selfMainGroup = user.mainGroup;
        selfDivision = user.division;
        chatEmotes = JSON.parse(data.emotes);
        if (translationReady) {
            updateFriends();
        } else {
            document.addEventListener('translationReady', updateFriends);
        }
        publicChats = {};
        var historyMessages = [];
        var discussionHistoryMessages = JSON.parse(data.discussionHistory);
        var otherHistoryMessages = JSON.parse(data.otherHistory);
        historyMessages = historyMessages.concat(discussionHistoryMessages);
        historyMessages = historyMessages.concat(otherHistoryMessages);
        for (var i = 0; i < historyMessages.length; i++) {
            var historyMessage = historyMessages[i];
            var idRoom = historyMessage.idRoom;
            var message = historyMessage;
            if (!(idRoom in publicChats)) {
                publicChats[idRoom] = [];
            }
            publicChats[idRoom].push(message);
        }
        if (localStorage.getItem("first") === null) {
            openRoom(1);
            localStorage.setItem("first", "true");
        } else {
            for (var i = 0; i < localStorage.length; i++) {
                var localStorageKey = localStorage.key(i);
                if (localStorageKey.indexOf('chat-friend-room-') !== -1) {
                    var privateChatId = localStorageKey.substring(localStorageKey.lastIndexOf('-') + 1);
                    privateChats[privateChatId] = JSON.parse(localStorage.getItem(localStorageKey));
                }
            }
        }
        if (localStorage.getItem('open-public-chats') !== null) {
            openPublicChats = JSON.parse(localStorage.getItem('open-public-chats'));
        }
        refreshChats();
    }
    if (data.action === "deleteMessages") {
        var idUser = JSON.parse(data.idUser);
        if (selfMainGroup.priority > 4) {
            $('.chat-public .chat-message[data-id-user=' + idUser + ']').html('<span class="gray">' + $.i18n("chat-message-deleted") + '</span>');
        } else {
            $('.chat-public .chat-message[data-id-user=' + idUser + ']').parent().addClass('deleted');
        }
    }
    if (data.action === "getMessage") {
        var chatMessage = JSON.parse(data.chatMessage);
        if (!(data.idRoom in publicChats)) {
            publicChats[data.idRoom] = [];
        }
        publicChats[data.idRoom].push(chatMessage);
        appendMessage(chatMessage, data.idRoom, false);
    }
    if (data.action === "getPrivateMessage") {
        var chatMessage = JSON.parse(data.chatMessage);
        var idRoom = data.idFriend;
        var username = null;
        if (chatMessage.user.id !== selfId) {
            username = chatMessage.user.username;
        }
        openPrivateRoom(idRoom, username);
        if (idRoom in privateChats) {
            privateChats[idRoom].push(chatMessage);
        }
        appendMessage(chatMessage, idRoom, true);
    }
    if (data.action === "getMessageError") {
        var message = data.message;
        $('#' + lastChatId + ' .chat-messages').append('<li class="red">' + translateFromServerJson(message) + '</li>');
        scrollAll();
    }
    if (data.action === "getMessageDenied") {
        BootstrapDialog.show({
            title: $.i18n('dialog-error'),
            type: BootstrapDialog.TYPE_DANGER,
            message: translateFromServerJson(data.message),
            buttons: [{
                label: 'Close',
                cssClass: 'btn-primary',
                action: function (dialog) {
                    dialog.close();
                }
            }]
        });
    }
    if (data.action === "getInfoMessage") {
        var message = data.message;
        $('#' + lastChatId + ' .chat-messages').append('<li class="gray">' + translateFromServerJson(message) + '</li>');
        scrollAll();
    }
    if (data.action === "getMessageAuto") {
        if (data.type !== 'legendary-drop' || data.idUser !== selfId) {
            var message = data.message;
            $('#chat-public-1 .chat-messages').append('<li class="yellow">' + translateFromServerJson(message) + '</li>');
            scrollAll();
        }
    }
    if (data.action === "getMessageBroadcast") {
        var message = data.message;
        $('.chat-public .chat-messages').append('<li><span style="color: yellow;">[INFO]</span> <span style="color: #ff00ff;">' + message + '</span></li>');
        scrollAll();
    }
}
function updateFriends() {
    var friends = selfFriends;
    friends.sort(function (a, b) {
        return compare(b.online, a.online);
    });
    $('#onlineFriends').empty();
    var nb = 0;
    for (var i = 0; i < friends.length; i++) {
        var online = "gray";
        var pm = '';
        if (friends[i].online) {
            nb++;
            online = "green";
            var noQuoteUsername = friends[i].username.replace("'", "");
            pm = '<span class="glyphicon glyphicon-envelope pointer yellow" onclick="openPrivateRoom(' + friends[i].id + ',\'' + noQuoteUsername + '\');"></span>';
        }
        var inGame = '<span class="glyphicon glyphicon-eye-open gray"></span>';
        if (friends[i].idGame >= 0) {
            inGame = '<a href="Spectate?gameId=' + friends[i].idGame + '&playerId=' + friends[i].id + '" title="Spectate game"><span class="glyphicon glyphicon-eye-open green"></span></a>';
        }
        var friendDivision = $.i18n('{{DIVISION:' + friends[i].division + '|short}}');
        $('#onlineFriends').append('<li>' + pm + ' ' + inGame + ' ' + friendDivision + '<span class="' + online + '">' + friends[i].username + '</span> <span class="blue">' + $.i18n("stat-lv") + ' ' + friends[i].level + '</span> <a href="Friends?delete=' + friends[i].id + '" class="crossDelete" hidden><span class="glyphicon glyphicon-remove red"></span></a></li>');
        $('#nbOnline').html(nb);
        $('.nbFriends').html(nb);
    }
}
function checkForChatTranslations(idRoom) {
    var chatName = '';
    if (translationReady) {
        chatName = $.i18n(chatNames[idRoom - 1]);
        $('#chat-public-' + idRoom).find('.chat-room-name').html(chatName)
    } else {
        document.addEventListener('translationReady', function (e) {
            chatName = $.i18n(chatNames[idRoom - 1]);
            $('#chat-public-' + idRoom).find('.chat-room-name').html(chatName);
        }, false);
    }
}
function appendMessage(chatMessage, idRoom, isPrivate) {
    var id = chatMessage.id;
    var user = chatMessage.user;
    var username = chatMessage.user.username;
    var message = chatMessage.message;
    var mainGroup = user.mainGroup.name;
    var icons = "";
    var room = isPrivate ? 'chat-private-' + idRoom : 'chat-public-' + idRoom;
    var $chat = $('#' + room);
    for (var j = user.groups.length - 1; j >= 0; j--) {
        var userGroup = user.groups[j];
        if (userGroup.icon !== undefined) {
            if (userGroup.priority <= 9) {
                if (userGroup.id === user.mainGroup.id) {
                    icons = icons + '<a href="Staff" target="_blank"><img src="aprilimages/' + userGroup.icon + '.png" title="' + userGroup.name + '" class="groupIcon"/></a>';
                }
            } else if (userGroup.name === "Contributor") {
                icons = icons + '<a href="Shop" target="_blank"><img src="aprilimages/' + userGroup.icon + '.png" title="' + userGroup.name + '" class="groupIcon"/></a>';
            } else if (userGroup.name === "Recruiter") {
                icons = icons + '<a href="Referrals" target="_blank"><img src="aprilimages/' + userGroup.icon + '.png" title="' + userGroup.name + '" class="groupIcon"/></a>';
            } else {
                icons = icons + '<img src="aprilimages/' + userGroup.icon + '.png" title="' + userGroup.name + '" class="groupIcon"/>';
            }
        }
    }
    var avatars = "";
    if (chatAvatarsEnabled) {
        var shinyAvatar = "";
        if (user.shinyAvatar) {
            shinyAvatar = '<img src="aprilimages/shinyAvatar.gif" class="rainbowAvatar" draggable="false">';
        }
        avatars = '<div class="avatarGroup"><img class="avatar ' + user.avatar.rarity + '" src="aprilimages/avatars/' + user.avatar.image + '.png" />' + shinyAvatar + '</div> ';
    }
    var rainbow = "";
    if (chatMessage.rainbow && rainbowEnabled) {
        rainbow = "rainbowText";
    }
    var deleted = '';
    if (chatMessage.deleted) {
        deleted = 'deleted';
    }
    if (!chatMessage.me) {
        $chat.find('.chat-messages').append('<li id="message-' + id + '" class="message-group ' + deleted + '">' + avatars + icons + '<span id="info-' + id + '" onclick="getInfo(this);" class="chat-user ' + mainGroup + '">' + username + '</span> <span class="chat-message ' + rainbow + '" data-id-user="' + user.id + '">' + notif(linkify(message)) + '</span></li>');
    } else {
        $chat.find('.chat-messages').append('<li id="message-' + id + '" class="message-group me ' + deleted + '"> <span id="info-' + id + '" onclick="getInfo(this);" class="chat-user ' + mainGroup + '">* ' + username + '</span> <span class="chat-message ' + mainGroup + '" data-id-user="' + user.id + '">' + notif(linkify(message)) + '</span></li>');
    }
    $chat.find('.chat-messages li:last .chat-user').data('infos', chatMessage);
    autoCompletionAddUsername(user.username);
    scroll($chat);
    if (isPrivate) {
        saveHistory();
    }
}
function saveHistory() {
    for (const [key, value] of Object.entries(privateChats)) {
        localStorage.setItem('chat-friend-room-' + key, JSON.stringify(value));
    }
}
function refreshChats() {
    for (var i = 0; i < openPublicChats.length; i++) {
        var idRoom = openPublicChats[i];
        var messages = [];
        if (idRoom in publicChats) {
            messages = publicChats[idRoom];
        }
        appendChat(idRoom, messages, false);
    }
    for (const [key, value] of Object.entries(privateChats)) {
        appendChat(key, value, true);
    }
    saveHistory();
}
function appendChat(idRoom, chatMessages, isPrivate) {
    var chatClass = isPrivate ? 'chat-private' : 'chat-public';
    var chatHistory = chatMessages;
    var room = chatClass + '-' + idRoom;
    if ($('#' + room).length) {
        if (isPrivate) {
            updatePrivateRoomUsername(idRoom);
        }
        return;
    }
    $('body').append('<div class="chat-box ' + chatClass + '" id="' + room + '"><div class="chat-header"><span class="chat-room-name"></span><div class="btn-group pull-right"><span class="chat-minus glyphicon glyphicon-minus"></span> <span class="chat-close glyphicon glyphicon-remove"></span></div></div><ul class="chat-messages"></ul><div class="chat-footer"><form class="chat-form"><input autocomplete="off" type="text" class="chat-text" maxlength="250" onkeydown="autoComplete(this, event);"/><input type="submit" hidden></form><span class="emoteIconChat glyphicon glyphicon-comment" onclick="showChatEmotes(\'' + room + '\')"></span></div></div>');
    if (!isPrivate) {
        checkForChatTranslations(idRoom);
    }
    var $newChat = $('#' + room);
    if (isPrivate) {
        updatePrivateRoomUsername(idRoom);
    }
    if (!mobile) {
        $newChat.resizable({
            maxHeight: 700,
            maxWidth: 900,
            minHeight: 150,
            minWidth: 250
        });
    }
    $newChat.draggable({
        cursor: 'move',
        handle: '.chat-header',
        containment: 'document'
    });
    if (localStorage.getItem(room) !== null) {
        var infos = JSON.parse(localStorage.getItem(room));
        $newChat.height(infos.height);
        $newChat.width(infos.width);
        if (infos.x < $(document).width()) {
            $newChat.css('left', infos.x);
        } else {
            $newChat.css('left', 50);
        }
        var body = document.body
            , html = document.documentElement;
        var height = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
        if (infos.y < height) {
            $newChat.css('top', infos.y);
        } else {
            $newChat.css('top', randInt(50, 400));
        }
    } else {
        $newChat.css('left', 50);
        $newChat.css('top', randInt(50, 400));
    }
    saveChat(room);
    for (var i = 0; i < chatHistory.length; i++) {
        var chatMessage = chatHistory[i];
        if (!chatMessage.deleted || selfMainGroup.priority <= 4) {
            appendMessage(chatMessage, idRoom, isPrivate);
        }
    }
    $newChat.find('.chat-form').submit(function (event) {
        event.preventDefault();
        var $localChat = $(this).closest('.chat-box');
        var localIdRoom = $localChat.attr('id');
        var text = $(this).find('.chat-text');
        if (text.val().length > 0) {
            if (!isPrivate) {
                sendMessage(text.val(), idRoom.toString());
            } else {
                sendPrivateMessage(text.val(), idRoom.toString());
            }
            text.val("");
            lastChatId = localIdRoom;
        }
        return false;
    });
    $newChat.find('.chat-minus').click(function () {
        var $localChat = $(this).closest('.chat-box');
        if ($localChat.height() > 0) {
            $localChat.find('.chat-messages').hide();
            $localChat.find('.chat-footer').hide();
            $localChat.attr('lastHeight', $localChat.height());
            $localChat.height(0);
        } else {
            $localChat.find('.chat-messages').show();
            $localChat.find('.chat-footer').show();
            if ($localChat.attr('lastHeight') !== undefined) {
                $localChat.height($localChat.attr('lastHeight'));
            }
        }
    });
    $newChat.find('.chat-close').click(function () {
        var $localChat = $(this).closest('.chat-box');
        var localIdRoom = $localChat.attr('id');
        if (!isPrivate) {
            const index = openPublicChats.indexOf(idRoom);
            if (index > -1) {
                openPublicChats.splice(index, 1);
            }
            localStorage.setItem('open-public-chats', JSON.stringify(openPublicChats));
        } else {
            delete privateChats[idRoom];
            localStorage.removeItem('chat-friend-username-' + idRoom);
            localStorage.removeItem('chat-friend-room-' + idRoom);
        }
        localStorage.removeItem(localIdRoom);
        $localChat.remove();
        saveHistory();
    });
    $newChat.hover(function () { }, function () {
        saveChat($(this).attr('id'));
    });
    $newChat.find('.chat-messages').scrollTop($newChat.find('.chat-messages').prop("scrollHeight") + 1000);
}
function openRoom(idRoom) {
    if (openPublicChats.indexOf(idRoom) === -1) {
        openPublicChats.push(idRoom);
        localStorage.setItem('open-public-chats', JSON.stringify(openPublicChats));
        refreshChats();
    }
}
function openPrivateRoom(idFriend, username) {
    if (!(idFriend in privateChats)) {
        privateChats[idFriend] = [];
        refreshChats();
    }
    if (username !== null) {
        localStorage.setItem('chat-friend-username-' + idFriend, username);
        updatePrivateRoomUsername(idFriend);
    }
}
function updatePrivateRoomUsername(idFriend) {
    if (localStorage.getItem('chat-friend-username-' + idFriend) !== null) {
        var username = localStorage.getItem('chat-friend-username-' + idFriend);
        $('#chat-private-' + idFriend).find('.chat-room-name').html(username);
    }
}
function sendMessage(message, idRoom) {
    socketChat.send(JSON.stringify({
        action: "message",
        message: message,
        idRoom: idRoom,
        idFriend: '0'
    }));
}
function sendPrivateMessage(message, idFriend) {
    socketChat.send(JSON.stringify({
        action: "message",
        message: message,
        idRoom: '0',
        idFriend: idFriend
    }));
}
function saveChat(idRoom) {
    var $chat = $('#' + idRoom);
    var height = $chat.height();
    if (height === 0) {
        height = $chat.attr("lastHeight");
    }
    localStorage.setItem(idRoom, JSON.stringify({
        x: $chat.position().left,
        y: $chat.position().top,
        height: height,
        width: $chat.width()
    }));
}
function linkify(inputText) {
    var replacedText, replacePattern1, replacePattern2;
    replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
    replacedText = inputText.replace(replacePattern1, '<a href="#" onclick="link(\'$1\');">$1</a>');
    replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
    regplacedText = replacedText.replace(replacePattern2, '<a href="#" onclick="link(\'http://$2\');" >$2</a>');
    return replacedText.replace(/\^/g, '');
}
function notif(str) {
    if (str.toLowerCase().includes("@" + selfUsername.toLowerCase())) {
        var checkStr = str.replace("@", "arobasecharacter");
        var regEx = new RegExp("\\b(arobasecharacter" + selfUsername + ")\\b", "ig");
        var replaceMask = "<span style=\"color:yellow !important;\">@" + selfUsername + "</span>";
        var result = checkStr.replace(regEx, replaceMask);
        if (result !== str && soundsEnabled) {
            audio = new Audio("sounds/highlight.wav");
            audio.play();
        }
        return result;
    }
    return str;
}
function link(link) {
    BootstrapDialog.show({
        title: 'Leaving Warning',
        type: BootstrapDialog.TYPE_WARNING,
        message: $.i18n('chat-link-outside', link),
        buttons: [{
            label: $.i18n('chat-sure'),
            cssClass: 'btn-primary',
            action: function (dialog) {
                window.open(link, '_blank');
                dialog.close();
            }
        }, {
            label: $.i18n('dialog-cancel'),
            cssClass: 'btn-primary',
            action: function () {
                dialog.close();
            }
        }]
    });
}
function getInfo(u) {
    var infos = $(u).data('infos');
    var user = infos.user;
    var mainGroup = user.mainGroup;
    var modsOptions = "";
    var pmOption = "";
    var icon = "";
    var gameOption = "";
    var mainGroupName = $.i18n('group-' + mainGroup.name.toLowerCase());
    if (mainGroup.icon !== undefined) {
        icon = '<img src="aprilimages/' + mainGroup.icon + '.png" title="' + mainGroupName + '" class="groupIcon"/> ';
    }
    var divisionName = $.i18n('{{DIVISION:' + user.division + '}}');
    var eloRanked = '';
    if (user.division === 'LEGEND') {
        eloRanked = ' (<span class="rainbowText">' + user.eloRanked + '</span>)';
    }
    if (user.id !== selfId && selfMainGroup.priority <= 4) {
        modsOptions = $.i18n('chat-time-out-user') + ": <button class=\"btn btn-sm btn-danger\" onclick=\"timeout('" + user.id + "', '1');\">1</button> <button class=\"btn btn-sm btn-danger\" onclick=\"timeout('" + user.id + "', '60');\">60</button> <button class=\"btn btn-sm btn-danger\" onclick=\"timeout('" + user.id + "', '600');\">600</button> <button class=\"btn btn-sm btn-danger\" onclick=\"timeout('" + user.id + "', '3600');\">3600</button>";
    }
    if (user.id !== selfId && (isFriend(user.idUser) || selfMainGroup.priority <= 4)) {
        var noQuoteUsername = user.username.replace("'", "");
        pmOption = '<span class="pointer" onclick="openPrivateRoom(' + user.id + ',\'' + noQuoteUsername + '\');"><span class="glyphicon glyphicon-envelope yellow"></span> ' + $.i18n("chat-send-private") + '</span><br/><br/>';
    }
    if (user.gameId !== -1) {
        gameOption = '<p><a href="Spectate?gameId=' + user.gameId + '&playerId=' + user.id + '" title="Spectate game"><span class="glyphicon glyphicon-eye-open green"></span> ' + $.i18n("chat-spectate-game") + '</a>.</p>';
    }
    var shinyAvatar = "";
    if (user.shinyAvatar) {
        shinyAvatar = '<img src="aprilimages/shinyAvatar.gif" class="rainbowAvatar" draggable="false">';
    }
    BootstrapDialog.show({
        title: user.username,
        message: '<div class="avatarGroup"><img class="avatar ' + user.avatar.rarity + '" src="aprilimages/avatars/' + user.avatar.image + '.png">' + shinyAvatar + '</div> <span style="font-size: 24px; padding-left: 10px;">' + user.username + '</span> <br/><br/><img style="height: 25px;" src="aprilimages/profiles/' + user.profileSkin.image + '.png"><br/><br/><ul><li>' + $.i18n("chat-group") + ' : <span class="' + mainGroup.name + '">' + icon + " " + mainGroupName + '</span></li><li>' + $.i18n("stat-lv") + ' : <span class="blue">' + user.level + '</span></li><li>' + $.i18n("chat-division") + ' : ' + divisionName + eloRanked + '</li></ul>' + gameOption + pmOption + modsOptions,
        buttons: [{
            label: $.i18n('dialog-ok'),
            cssClass: 'btn-primary',
            action: function (dialog) {
                dialog.close();
            }
        }]
    });
}
function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
function scroll($chat) {
    var $chatMessage = $chat.find('.chat-messages');
    if ($chatMessage.scrollTop() + 100 > ($chatMessage.prop("scrollHeight") - $chatMessage.height())) {
        $chatMessage.scrollTop($chatMessage.prop("scrollHeight"));
    }
}
function scrollAll() {
    $('.chat-box').each(function (index) {
        scroll($(this));
    });
}
function autoCompletionAddUsername(username) {
    if (usernames.indexOf(username) === -1) {
        usernames.push(username);
    }
}
$(document).keypress(function (e) {
    if (e.which === 13 && !$('input').is(':focus') && !chatsListOpen) {
        if (!emotesOpen) {
            openChatsList();
        } else {
            $('#' + chatRoomEmote + ' .chat-form').submit();
            emoteDialog.close();
        }
    }
});
function openChatsList() {
    chatsListOpen = true;
    BootstrapDialog.show({
        title: $.i18n("chat-list-title"),
        cssClass: 'chat-rooms',
        message: '<p><a href="rules.jsp" target="_blank">' + $.i18n("rules-title") + '</a></p><p>' + $.i18n("chat-english-only") + '</p><ul><li onclick="openRoom(1);"><span class="glyphicon glyphicon-log-in pointer green"></span> ' + $.i18n("chat-discussion") + '</li>\
                <li onclick="openRoom(2);"><span class="glyphicon glyphicon-log-in green"></span> ' + $.i18n("chat-strategy") + '</li>\
                <li onclick="openRoom(3);"><span class="glyphicon glyphicon-log-in green"></span> ' + $.i18n("chat-beginner") + '</li>\
                <li onclick="openRoom(4);"><span class="glyphicon glyphicon-log-in green"></span> ' + $.i18n("chat-tournament") + '</li>\
                <li onclick="openRoom(5);"><span class="glyphicon glyphicon-log-in green"></span> ' + $.i18n("chat-roleplay") + '</li>\
                <li onclick="openRoom(6);"><span class="glyphicon glyphicon-log-in green"></span> ' + $.i18n("chat-support") + '</li></ul>\
                <hr>\
                <ul><li onclick="openRoom(7);"><span class="glyphicon glyphicon-log-in green"></span> ' + $.i18n("chat-fr") + '</li>\
                <li onclick="openRoom(8);"><span class="glyphicon glyphicon-log-in green"></span>  ' + $.i18n("chat-ru") + '</li>\
                <li onclick="openRoom(9);"><span class="glyphicon glyphicon-log-in green"></span>  ' + $.i18n("chat-es") + '</li>\
                <li onclick="openRoom(10);"><span class="glyphicon glyphicon-log-in green"></span>  ' + $.i18n("chat-pt") + '</li>\
                <li onclick="openRoom(11);"><span class="glyphicon glyphicon-log-in green"></span>  ' + $.i18n("chat-it") + '</li>\
                <li onclick="openRoom(12);"><span class="glyphicon glyphicon-log-in green"></span>  ' + $.i18n("chat-de") + '</li>\
                <li onclick="openRoom(13);"><span class="glyphicon glyphicon-log-in green"></span>  ' + $.i18n("chat-cn") + '</li>\
                <li onclick="openRoom(14);"><span class="glyphicon glyphicon-log-in green"></span>  ' + $.i18n("chat-jp") + '</li>\
                <li onclick="openRoom(15);"><span class="glyphicon glyphicon-log-in green"></span>  ' + $.i18n("chat-tr") + '</li>\
                <li onclick="openRoom(16);"><span class="glyphicon glyphicon-log-in green"></span>  ' + $.i18n("chat-pl") + '</li>\
                </ul>',
        buttons: [{
            label: $.i18n('dialog-close'),
            cssClass: 'btn-primary',
            action: function (dialog) {
                dialog.close();
            }
        }],
        onhide: function () {
            chatsListOpen = false;
        },
        onhidden: function () {
            chatsListOpen = false;
        }
    });
}
function isFriend(idUser) {
    for (var i = 0; i < selfFriends.length; i++) {
        if (selfFriends[i].id === idUser) {
            return true;
        }
    }
    return false;
}
window.onbeforeunload = function () {
    socketChat.onclose = function () { }
        ;
    socketChat.close();
}
    ;
function showChatEmotes(room) {
    var popupContent = '<div id="emote-container" class="container" style="width: 500px;">';
    for (var i = 0; i < chatEmotes.length; i++) {
        var emote = chatEmotes[i];
        var artifactHtml = '<div style="margin-bottom: 15px;" class="col-sm-2"><img class="pointer" style="height: 48px;" src="aprilimages/emotes/' + emote.image + '.png" onclick="addEmoteChat(' + emote.id + ', \'' + room + '\');" /></div>';
        popupContent += artifactHtml;
    }
    popupContent += '</div>';
    emotesOpen = true;
    chatRoomEmote = room;
    emoteDialog = BootstrapDialog.show({
        title: $.i18n('chat-emotes'),
        message: popupContent,
        buttons: [{
            label: $.i18n('chat-send'),
            cssClass: 'btn-primary',
            action: function (dialog) {
                $('#' + room + ' .chat-form').submit();
                dialog.close();
            }
        }, {
            label: $.i18n('chat-edit'),
            cssClass: 'btn-primary',
            action: function (dialog) {
                dialog.close();
            }
        }],
        onhidden: function () {
            emotesOpen = false;
            $('#' + room + ' .chat-text').focus();
        }
    });
}
function addEmoteChat(idEmote, room) {
    var emote = getEmote(idEmote);
    if (emote !== null) {
        var chatInput = $('#' + room + ' .chat-text');
        var chatText = chatInput.val();
        var newText = chatText + emote.code;
        chatInput.val(newText);
    }
}
function getEmote(idEmote) {
    for (var i = 0; i < chatEmotes.length; i++) {
        var emote = chatEmotes[i];
        if (emote.id === idEmote) {
            return emote;
        }
    }
    return null;
}
function autoComplete(chatInput, event) {
    if (event.ctrlKey) {
        var chatText = $(chatInput).val();
        var result = chatText.substring(chatText.lastIndexOf("@"));
        if (result.length > 1) {
            var typedUsername = result.substring(1, result.length);
            if (autoCompleteUsername === null) {
                autoCompleteUsername = typedUsername;
            }
            var matchingUsers = [];
            for (var i = 0; i < usernames.length; i++) {
                var username = usernames[i];
                if (username.toLowerCase().startsWith(autoCompleteUsername.toLowerCase()) && !username.includes("@")) {
                    matchingUsers.push(username);
                }
            }
            matchingUsers.sort();
            if (matchingUsers.length > 0) {
                if (usernamesIncrement < matchingUsers.length) {
                    var found = matchingUsers[usernamesIncrement];
                    if (found.toLowerCase() === typedUsername) {
                        usernamesIncrement++;
                        if (usernamesIncrement < matchingUsers.length) {
                            found = matchingUsers[usernamesIncrement];
                            var finalText = chatText.replace(typedUsername, found);
                            $(chatInput).val(finalText);
                        } else {
                            var finalText = chatText.replace(typedUsername, autoCompleteUsername);
                            $(chatInput).val(finalText);
                            autoCompleteUsername = null;
                            usernamesIncrement = 0;
                        }
                    } else {
                        var finalText = chatText.replace(typedUsername, found);
                        $(chatInput).val(finalText);
                        usernamesIncrement++;
                    }
                } else {
                    var finalText = chatText.replace(typedUsername, autoCompleteUsername);
                    $(chatInput).val(finalText);
                    autoCompleteUsername = null;
                    usernamesIncrement = 0;
                }
            }
        }
    } else {
        autoCompleteUsername = null;
        usernamesIncrement = 0;
    }
}
