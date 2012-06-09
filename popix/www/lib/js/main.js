var socket = io.connect('http://apps.moby.io:8989');
function TakePicture(){
    navigator.camera.getPicture(onSuccess, onFail, { quality: 20,
        destinationType: Camera.DestinationType.DATA_URL });

    function onSuccess(imageData) {
        socket.emit('ClientSendImage', imageData);
    }

    function onFail(message) {
        alert('Failed because: ' + message);
    }
}
socket.on('NewImage', function(msg){
    $('#myImage').attr('src', 'data:image/jpeg;base64,' + msg);
});
socket.on('UserCount', function(msg){
    $('#UserCount .ui-btn-text').text('Online: ' + msg);

});