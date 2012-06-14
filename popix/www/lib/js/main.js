var socket = io.connect('http://apps.moby.io:8989');
$(document).on('pageinit','[data-role=page]', function(){
    $('[data-position=fixed]').fixedtoolbar({ tapToggle:false });
});
var DeviceID
function AssignVars(){
    DeviceID = device.uuid;
}
document.addEventListener("deviceready", AssignVars, false);
var mainPhotoSwipe;
var myPhotoSwipe;
var topPhotoSwipe;
var ImageData;
function TakePicture(){
    $('ul').hide();
    $('#ImageList').show();
    navigator.camera.getPicture(onSuccess, onFail, {
        quality: 30,
        destinationType: Camera.DestinationType.DATA_URL,
        targetWidth: 640,
        targetHeight: 960
    });

    function onSuccess(imageData) {
        $('#HashTag').val('');
        $("#HTForm").slideDown("slow");
        ImageData = imageData;
    }

    function onFail(message) {
        alert('Failed because: ' + message);
    }
}
function DoNothing(){}
function GetTopImages(){
    $('#TopImageList').empty();
    $('ul').hide();
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
        $("#HTForm").slideUp("slow");
        socket.emit('ClientSendImage', {Author: device.uuid, Image: ImageData, HashTag: $('#HashTag').val(), Anonymous: parseInt($('#Anonymous').val())});
        $('#MyImageList').append('<li><a href="data:image/jpeg;base64,' + ImageData + '" rel="external"><img src="data:image/jpeg;base64,' + ImageData + '"></a></li>');
    }
}
socket.on('NewImage', function(msg){
    (function(PhotoSwipe){
        if(mainPhotoSwipe){
            PhotoSwipe.detatch(mainPhotoSwipe);
        }
    }(window.Code.PhotoSwipe));
    $('#ImageList').append('<li><a id="' + msg.ID + '" href="data:image/jpeg;base64,' + msg.Image + '" rel="external"><img src="data:image/jpeg;base64,' + msg.Image + '" alt="' + msg.HashTag + '"></a></li>');
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
socket.on('UserCount', function(msg){
    $('#UserCount .ui-btn-text').text('Online: ' + msg);

});
function GetUserImages(){
    $('#MyImageList').empty();
    $('ul').hide();
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
    $('#MyImageList').append('<li><a href="data:image/jpeg;base64,' + msg.Image + '" rel="external" alt="' + msg.HashTag + '"><img src="data:image/jpeg;base64,' + msg.Image + '" alt="' + msg.HashTag + '"></a></li>');
    myPhotoSwipe = $("#MyImageList a").photoSwipe({
        captionAndToolbarOpacity: 1,
        captionAndToolbarAutoHideDelay: 0,
        allowUserZoom: false,
        imageScaleMethod: 'zoom',
        getToolbar: function(){
            return '<div class="ps-toolbar-close"><div class="ps-toolbar-content"></div>' +
                '</div><div class="ps-toolbar-play"><div class="ps-toolbar-content"></div>' +
                '</div><div class="ps-toolbar-previous"><div class="ps-toolbar-content"></div>' +
                '</div><div class="ps-toolbar-next"><div class="ps-toolbar-content"></div>';
        }
    });
    myPhotoSwipe.addEventHandler(window.Code.PhotoSwipe.EventTypes.onToolbarTap, function(e){
    });
});
socket.on('TopImages', function(msg){
    msg = JSON.parse(msg);
    (function(PhotoSwipe){
        if(topPhotoSwipe){
            PhotoSwipe.detatch(topPhotoSwipe);
        }
    }(window.Code.PhotoSwipe));
    $('#TopImageList').append('<li><a id="' + msg.ID + '" href="data:image/jpeg;base64,' + msg.Image + '" rel="external"><img src="data:image/jpeg;base64,' + msg.Image + '" alt="Tag: ' + msg.HashTag + ' Votes: ' + msg.Votes + '"></a></li>');
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
    alert(msg);
});