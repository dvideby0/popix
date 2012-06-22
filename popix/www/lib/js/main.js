var socket = io.connect('http://apps.moby.io:8989');
$(document).on('pageinit','[data-role=page]', function(){
    $('[data-position=fixed]').fixedtoolbar({ tapToggle:false });
});
var DeviceID;
function AssignVars(){
    DeviceID = device.uuid;
}
function AlertKey(){
    $.ajax({
        type: 'GET',
        url: 'https://graph.facebook.com/me?fields=id,name&access_token=AAACEdEose0cBAP8smK3DYpTAJ9HCgZA1RBSxmS0RFzcFZAgnxLNpUa71XdEsB6x6PmwQOMaGhEeqvdQ0hBZCqI0XQUTMZALyV5uGhyaLZBgPf8G2GBsxX',
        cache: false,
        dataType: 'json',
        complete: function (xhrObj) {
            var Response = $.parseJSON(xhrObj.responseText);
            alert('Hello: ' + Response.name + '\nUser ID: ' + Response.id);
        }
    });
}
document.addEventListener("deviceready", AssignVars, false);
var mainPhotoSwipe;
var myPhotoSwipe;
var topPhotoSwipe;
var ImageData;
function DoNothing(){}
function TakePicture(){
    navigator.camera.getPicture(onSuccess, DoNothing, {
        quality: 30,
        destinationType: Camera.DestinationType.DATA_URL,
        encodingType: Camera.EncodingType.JPEG,
        targetWidth: 640,
        targetHeight: 960
    });

    function onSuccess(imageData) {
        $('#HashTag').val('');
        $('#Caption').val('');
        $.mobile.changePage( "#HTForm", { transition: "none"} );
        ImageData = imageData;
    }
}
function GetFeedImages(){
    $('ul').hide();
    $('body').scrollTop(0);
    $('#ImageList').show();
}
function GetTopImages(){
    $('#TopImageList').empty();
    $('ul').hide();
    $('body').scrollTop(0);
    $('#TopImageList').show();
    socket.emit('GetTopImages','');
}
function SendPicture(){
    if(!$('#HashTag').val()){
        navigator.notification.alert(
            'Tag Required',
             DoNothing,
            'Error',
            'Ok'
        );
    }
    else{
        $('#HTForm').dialog('close');
        socket.emit('ClientSendImage', {
            Author: device.uuid,
            Image: ImageData,
            HashTag: $('#HashTag').val(),
            Caption: $('#Caption').val(),
            Anonymous: parseInt($('#Anonymous').val())});
    }
}
socket.on('NewImage', function(msg){
    (function(PhotoSwipe){
        if(mainPhotoSwipe){
            PhotoSwipe.detatch(mainPhotoSwipe);
        }
    }(window.Code.PhotoSwipe));
    $('#ImageList').append('<li><a id="' + msg.ID + '" href="' + msg.ImageFull + '" rel="external"><img src="' + msg.ImageThumb + '" alt="' + msg.Caption + '"></a></li>');
    mainPhotoSwipe = $("#ImageList a").photoSwipe({
        captionAndToolbarOpacity: 1,
        captionAndToolbarAutoHideDelay: 0,
        allowUserZoom: false,
        imageScaleMethod: 'zoom',
        getToolbar: function(){
            return '<div class="ps-toolbar-close"><div class="ps-toolbar-content"></div></div>' +
                '<div class="ps-toolbar-play"><div class="ps-toolbar-content"></div></div>' +
                '<div class="ps-toolbar-previous"><div class="ps-toolbar-content"></div></div>' +
                '<div class="ps-toolbar-next"><div class="ps-toolbar-content"></div></div>' +
                '<div id="SayHi"><img id="ThumbsUp" src="lib/images/thumbs.png" alt=""></div>';
        }
    });
    mainPhotoSwipe.addEventHandler(window.Code.PhotoSwipe.EventTypes.onToolbarTap, function(e){
        if($(e.tapTarget).attr('id') == 'ThumbsUp'){
            var ImgObj = mainPhotoSwipe.getCurrentImage();
            socket.emit('VoteUp', {ImageID: ImgObj.refObj.id, UserID: device.uuid});
        }
    });
});
function GetUserImages(){
    $('#MyImageList').empty();
    $('ul').hide();
    $('body').scrollTop(0);
    $('#MyImageList').show();
    socket.emit('GetUserImages', device.uuid);
}
socket.on('UserImages', function(msg){
    msg = JSON.parse(msg);
    (function(PhotoSwipe){
        if(myPhotoSwipe){
            PhotoSwipe.detatch(myPhotoSwipe);
        }
    }(window.Code.PhotoSwipe));
    $('#MyImageList').append('<li><a id="' + msg.ID + '" href="' + msg.ImageFull + '" rel="external" alt="' + msg.HashTag + '"><img src="' + msg.ImageThumb + '" alt="' + msg.Caption + ' Votes: ' + msg.Votes + '"></a></li>');
    myPhotoSwipe = $("#MyImageList a").photoSwipe({
        captionAndToolbarOpacity: 1,
        captionAndToolbarAutoHideDelay: 0,
        allowUserZoom: false,
        imageScaleMethod: 'zoom',
        getToolbar: function(){
            return '<div class="ps-toolbar-close"><div class="ps-toolbar-content"></div></div>' +
                '<div class="ps-toolbar-play"><div class="ps-toolbar-content"></div></div>' +
                '<div class="ps-toolbar-previous"><div class="ps-toolbar-content"></div></div>' +
                '<div class="ps-toolbar-next"><div class="ps-toolbar-content"></div></div>' +
                '<div id="SayHi"><img id="ThumbsUp" src="lib/images/thumbs.png" alt=""></div>';
        }
    });
    myPhotoSwipe.addEventHandler(window.Code.PhotoSwipe.EventTypes.onToolbarTap, function(e){
        if($(e.tapTarget).attr('id') == 'ThumbsUp'){
            var ImgObj = myPhotoSwipe.getCurrentImage();
            socket.emit('VoteUp', {ImageID: ImgObj.refObj.id, UserID: DeviceID});
        }
    });
});
socket.on('TopImages', function(msg){
    msg = JSON.parse(msg);
    (function(PhotoSwipe){
        if(topPhotoSwipe){
            PhotoSwipe.detatch(topPhotoSwipe);
        }
    }(window.Code.PhotoSwipe));
    $('#TopImageList').append('<li><a id="' + msg.ID + '" href="' + msg.ImageFull + '" rel="external"><img src="' + msg.ImageThumb + '" alt="' + msg.Caption + ' Votes: ' + msg.Votes + '"></a></li>');
    topPhotoSwipe = $("#TopImageList a").photoSwipe({
        captionAndToolbarOpacity: 1,
        captionAndToolbarAutoHideDelay: 0,
        allowUserZoom: false,
        imageScaleMethod: 'zoom',
        getToolbar: function(){
            return '<div class="ps-toolbar-close"><div class="ps-toolbar-content"></div></div>' +
                '<div class="ps-toolbar-play"><div class="ps-toolbar-content"></div></div>' +
                '<div class="ps-toolbar-previous"><div class="ps-toolbar-content"></div></div>' +
                '<div class="ps-toolbar-next"><div class="ps-toolbar-content"></div></div>' +
                '<div id="SayHi"><img id="ThumbsUp" src="lib/images/thumbs.png" alt=""></div>';
        }
    });
    topPhotoSwipe.addEventHandler(window.Code.PhotoSwipe.EventTypes.onToolbarTap, function(e){
        if($(e.tapTarget).attr('id') == 'ThumbsUp'){
            var ImgObj = topPhotoSwipe.getCurrentImage();
            socket.emit('VoteUp', {ImageID: ImgObj.refObj.id, UserID: DeviceID});
        }
    });
});
socket.on('Error', function(msg){
    navigator.notification.alert(msg, DoNothing, 'Error', 'OK')
});
var facebookkey = "facebook";

function InitializeFB(){
    var facebookoptions = {        // create an application in facebook  and populate the values below
        consumerKey: '379478488778007',
        consumerSecret: '5d11396e67edc8eb60e64d74cf1220a7',
        callbackUrl: 'http://www.facebook.com/connect/login_success.html' };
    var fb = FBConnect.install();
    fb.connect(facebookoptions);
    fb.onConnect = onFacebookConnected;
}

function onFacebookConnected() {
    var access_token = window.localStorage.getItem(window.plugins.fbConnect.facebookkey);
    var req = window.plugins.fbConnect.getUser();
    req.onload = facebook_register;
}

function facebook_register(data) {
    var user = JSON.parse(data.target.responseText);
    var oauth_token = window.localStorage.getItem(window.plugins.fbConnect.facebookkey);
}