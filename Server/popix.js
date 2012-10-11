var http = require('http');
var Mongolian = require("mongolian");
var uuid = require('node-uuid');
var server = new Mongolian;
var knox = require('knox');
var fs = require('fs');
var im = require('imagemagick');
var url = require('url');
var client = knox.createClient({
    key: 'AKIAJSCSCE45OUFCBTIA',
    secret: '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',
    bucket: 'popix'
});
var app = http.createServer(function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end('<html><body style="background-color: #000000;"></body></html>');
});

//--------------------------------PUSH Setup--------------------------------------------

var apns = require('apn');
var options = {
    cert: 'restcert.pem',                 /* Certificate file path */
    certData: null,                   /* String or Buffer containing certificate data, if supplied uses this instead of cert file path */
    key:  'restkey.pem',                  /* Key file path */
    keyData: null,                    /* String or Buffer containing key data, as certData */
    passphrase: 'S3br!ng1',                 /* A passphrase for the Key file */
    ca: null,                         /* String or Buffer of CA data to use for the TLS connection */
    gateway: 'gateway.sandbox.push.apple.com',/* gateway address */
    port: 2195,                       /* gateway port */
    enhanced: true,                   /* enable enhanced format */
    errorCallback: undefined,         /* Callback when error occurs function(err,notification) */
    cacheLength: 100                  /* Number of notifications to cache for error purposes */
};
var apnsConnection = new apns.Connection(options);
var note = new apns.Notification();


//--------------------------------Socket.io--------------------------------------------

var io = require('socket.io').listen(app);
io.enable('browser client minification');
io.enable('browser client etag');
io.enable('browser client gzip');
io.set('log level', 1);


//------------------------------Mongo Setup--------------------------------------------

var db = server.db("popix");
var posts = db.collection("posts");
var votes = db.collection("votes");
var users = db.collection("users");




//-----------------------------Begin APP-----------------------------------------------

io.sockets.on('connection', function(socket) {
    socket.on('ClientSendImage', function(msg){
        var UUID = uuid.v1();
        var dataBuffer = new Buffer(msg.Image, 'base64');
        im.resize({
            srcData: dataBuffer,
            width:  640,
            height: 857
        }, function(err, stdout, stderr){
            var imgBuffer = new Buffer(stdout, 'binary');
            if (err) throw err;
            var req = client.put('/imgposts/full/' + UUID + '.jpg', {
                'Content-Length': stdout.length,
                'Content-Type': 'image/jpeg'
            });
            req.end(imgBuffer);
        });
        im.resize({
            srcData: dataBuffer,
            width:  160,
            height: "200!"
        }, function(err, stdout, stderr){
            var imgBuffer = new Buffer(stdout, 'binary');
            if (err) throw err;
            var req = client.put('/imgposts/thumb/' + UUID + '.jpg', {
                'Content-Length': stdout.length,
                'Content-Type': 'image/jpeg'
            });
            req.on('response', function(res){
                if (200 == res.statusCode) {
                    posts.insert({
                        ID: UUID,
                        User: msg.Author,
                        Created: new Date,
                        ImageFull: 'https://s3.amazonaws.com/popix/imgposts/full/' + UUID + '.jpg',
                        ImageThumb: 'https://s3.amazonaws.com/popix/imgposts/thumb/' + UUID + '.jpg',
                        Votes: 0,
                        Caption: msg.Caption,
                        HashTag: msg.HashTag,
                        Anonymous: msg.Anonymous
                    });
                    io.sockets.emit('NewImage', JSON.stringify({
                        ImageThumb: 'https://s3.amazonaws.com/popix/imgposts/thumb/' + UUID + '.jpg',
                        ImageFull: 'https://s3.amazonaws.com/popix/imgposts/full/' + UUID + '.jpg',
                        Caption: msg.Caption,
                        ID: UUID,
                        Votes: 0,
                        Count: 1
                    }));
                    if(msg.Anonymous == 0){
                        socket.emit('ImageURL', {URL:'https://s3.amazonaws.com/popix/imgposts/full/' + UUID + '.jpg', Caption: msg.Caption});
                    }
                }

            });
            req.end(imgBuffer);
        });

    });
    socket.on('disconnect', function () {
    });
    socket.on('RegisterForNotification', function(msg){
        users.insert({
            ID: msg.UserID,
            PushToken: msg.Token
        });
    });
    socket.on('GetUserImages', function (msg) {
        posts.find({User: msg}, {ImageFull:1, ImageThumb:1, Caption:1, Votes:1, ID:1}).toArray(function (err, array) {
            var ACount = array.length;
            for(var i = 0; i < array.length; i++){
                socket.emit('UserImages',JSON.stringify({
                    ImageFull: array[i].ImageFull,
                    ImageThumb: array[i].ImageThumb,
                    ID: array[i].ID,
                    Caption: array[i].Caption,
                    Votes: array[i].Votes,
                    Count: ACount - i
                }));
            }
        });
    });
    socket.on('VoteUp', function (msg) {
        votes.findOne({ID: msg.UserID}, function(err, post){
            if(post){
                votes.findOne({$and: [{ID: msg.UserID},{ImageID: msg.ImageID}]}, function(err, post){
                    if(post){
                        socket.emit('Error', 'You have already voted for this image!');
                    }
                    else{
                        posts.findOne({ID: msg.ImageID}, function(err, post){
                            post.Votes = post.Votes + 1;
                            posts.save(post);
                        });
                        votes.update({ID: msg.UserID}, {"$addToSet": { ImageID : msg.ImageID } });
                        users.findOne({ID: msg.UserID}, function(err, post){
                            note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
                            note.badge = 0;
                            note.sound = "ping.aiff";
                            note.alert = 'Someone likes your post';
                            note.payload = {'messageFrom': 'New Message'};
                            note.device = new apns.Device(post.PushToken);
                            apnsConnection.sendNotification(note);
                        });
                    }
                });
            }
            else{
                votes.insert({ID: msg.UserID, ImageID: [msg.ImageID]});
                posts.findOne({ID: msg.ImageID}, function(err, post){
                    post.Votes = post.Votes + 1;
                    posts.save(post);
                });
                users.findOne({ID: msg.UserID}, function(err, post){
                    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
                    note.badge = 0;
                    note.sound = "ping.aiff";
                    note.alert = 'Someone likes your post';
                    note.payload = {'messageFrom': 'New Message'};
                    note.device = new apns.Device(post.PushToken);
                    apnsConnection.sendNotification(note);
                });
            }
        });
    });
    socket.on('GetTopImages', function(){
        posts.find().sort({Votes: -1}).limit(24).toArray(function (err, array) {
            var ACount = array.length;
            for(var i = 0; i < array.length; i++){
                socket.emit('TopImages',JSON.stringify({
                    ImageFull: array[i].ImageFull,
                    ImageThumb: array[i].ImageThumb,
                    ID: array[i].ID,
                    Caption: array[i].Caption,
                    Votes: array[i].Votes,
                    Count: ACount - i
                }));
            }
        })
    });
    socket.on('SearchForImages', function(msg){
        var query = new RegExp('(' + msg.join(')|(') + ')', 'i');
        posts.find({'HashTag': query}).limit(24).toArray(function (err, array) {
            var ACount = array.length;
            for(var i = 0; i < array.length; i++){
                socket.emit('ImageSearchResults',JSON.stringify({
                    ImageFull: array[i].ImageFull,
                    ImageThumb: array[i].ImageThumb,
                    ID: array[i].ID,
                    Caption: array[i].Caption,
                    Votes: array[i].Votes,
                    Count: ACount - i
                }));
            }
        });
    });
    socket.on('GetNewestImages', function(){
        posts.find().sort({"Created":-1}).limit(24).toArray(function (err, array) {
            var ACount = array.length;
            for(var i = 0; i < array.length; i++){
                socket.emit('NewImage',JSON.stringify({
                    ImageFull: array[i].ImageFull,
                    ImageThumb: array[i].ImageThumb,
                    ID: array[i].ID,
                    Caption: array[i].Caption,
                    Votes: array[i].Votes,
                    Count: ACount - i
                }));
            }
        });
    });
    socket.on('GetFriendImages', function(msg){
        posts.find({$and: [{'User':msg}, {'Anonymous': 0}]}).limit(24).toArray(function (err, array) {
            var ACount = array.length;
            for(var i = 0; i < array.length; i++){
                socket.emit('FriendImages',JSON.stringify({
                    ImageFull: array[i].ImageFull,
                    ImageThumb: array[i].ImageThumb,
                    ID: array[i].ID,
                    Caption: array[i].Caption,
                    Votes: array[i].Votes,
                    Count: ACount - i
                }));
            }
        });
    });
});
app.listen(8989);