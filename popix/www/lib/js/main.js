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
        socket.emit('ClientSendImage', {Author: device.uuid, Image: imageData});
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
    $('#ImageList').append('<li><a href="data:image/jpeg;base64,' + msg.Image + '" rel="external"><img src="data:image/jpeg;base64,' + msg.Image + '"></a></li>');
    myPhotoSwipe = $(".gallery a").photoSwipe({
        captionAndToolbarOpacity: 1,
        captionAndToolbarAutoHideDelay: 0,
        allowUserZoom: false,
        imageScaleMethod: 'zoom',
        getImageCaption: function(){
            var mybanner            = document.createElement("div");
            mybanner.style.padding    = '5px 10px 5px 10px';
            mybanner.style.backgroundColor = '#1ea600';
            mybanner.style.borderRadius = '3px';
            mybanner.style.border = '2px solid';
            mybanner.style.borderColor = '#000000'
            mybanner.innerHTML        = "Vote Up";
            mybanner.setAttribute('onClick',"alert(" + msg.Sender + ");");
            return mybanner;
        }
    });
});
socket.on('UserCount', function(msg){
    $('#UserCount .ui-btn-text').text('Online: ' + msg);

});
function SlideMenu(){
    $('#MainMenu').toggle();
}
function GetUserImages(){
    socket.emit('GetUserImages', device.uuid);
}
socket.on('UserImages', function(msg){
    $('#ImageList').empty();
    var Responses = JSON.parse(msg);
    (function(PhotoSwipe){
        if(myPhotoSwipe){
            PhotoSwipe.detatch(myPhotoSwipe);
        }
    }(window.Code.PhotoSwipe));
    for (var i = 0; i < Responses.length; i++){
        $('#ImageList').append('<li><a href="data:image/jpeg;base64,' + Responses[i].Image + '" rel="external"><img src="data:image/jpeg;base64,' + Responses[i].Image + '"></a></li>');
        if (i == Responses.length -1){
            myPhotoSwipe = $(".gallery a").photoSwipe({
                captionAndToolbarOpacity: 1,
                captionAndToolbarAutoHideDelay: 0,
                allowUserZoom: false,
                imageScaleMethod: 'zoom'
            });
        }
    }

});