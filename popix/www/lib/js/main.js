var socket = io.connect('http://apps.moby.io:8989');
$(document).on('pageinit','[data-role=page]', function(){
    $('[data-position=fixed]').fixedtoolbar({ tapToggle:false });
});
var mainPhotoSwipe;
var myPhotoSwipe;
var ImageData;
function TakePicture(){
    navigator.camera.getPicture(onSuccess, onFail, {
        quality: 20,
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
    $('#ImageList').append('<li><a href="data:image/jpeg;base64,' + msg.Image + '" rel="external" alt="' + msg.HashTag + '"><img src="data:image/jpeg;base64,' + msg.Image + '" alt="' + msg.HashTag + '"></a></li>');
    mainPhotoSwipe = $("#ImageList a").photoSwipe({
        captionAndToolbarOpacity: 1,
        captionAndToolbarAutoHideDelay: 0,
        allowUserZoom: false,
        imageScaleMethod: 'zoom'
    });
});
socket.on('UserCount', function(msg){
    $('#UserCount .ui-btn-text').text('Online: ' + msg);

});
function GetUserImages(){
    $('#MyImageList').empty();
    $('#ImageList').toggle();
    $('#MyImageList').toggle();
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
        imageScaleMethod: 'zoom'
    });
});