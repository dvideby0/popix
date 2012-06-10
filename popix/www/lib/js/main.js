var socket = io.connect('http://apps.moby.io:8989');
var myPhotoSwipe;
function TakePicture(){
    navigator.camera.getPicture(onSuccess, onFail, {
        quality: 20,
        destinationType: Camera.DestinationType.DATA_URL,
        targetWidth: 640,
        targetHeight: 960
    });

    function onSuccess(imageData) {
        socket.emit('ClientSendImage', imageData);
    }

    function onFail(message) {
        alert('Failed because: ' + message);
    }
}
socket.on('NewImage', function(msg){
    (function(PhotoSwipe){
        if(myPhotoSwipe){
            PhotoSwipe.detatch(myPhotoSwipe);
        }
    }(window.Code.PhotoSwipe));
    $('#ImageList').append('<li><a href="data:image/jpeg;base64,' + msg + '" rel="external"><img src="data:image/jpeg;base64,' + msg + '"></a></li>');
    myPhotoSwipe = $(".gallery a").photoSwipe({captionAndToolbarOpacity: 1, captionAndToolbarShowEmptyCaptions: false, allowRotationOnUserZoom: false});
});
socket.on('UserCount', function(msg){
    $('#UserCount .ui-btn-text').text('Online: ' + msg);

});