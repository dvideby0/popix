
//-----------------------------------------GLOBALS--------------------------------------------

var socket = io.connect('http://apps.moby.io:8989');
var DeviceID;
var RealName;
var mainPhotoSwipe;
var myPhotoSwipe;
var topPhotoSwipe;
var friendPhotoSwipe;
var searchPhotoSwipe;
var ImageData;

//--------------------------------------------------------------------------------------------


/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////Initialization & Annonymous Functions//////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////


//------------------------------------On Page Init------------------------------------------

$(document).on('pageinit','[data-role=page]', function(){
    $('[data-position=fixed]').fixedtoolbar({ tapToggle:false });
});

//------------------------------------Junk Function------------------------------------------
function DoNothing(){}

//----------------------------Called After "Device Ready"------------------------------------
function AssignVars(){
    $('#SearchInput').keyup(function(e) {
        if(e.keyCode == 13){
            GetSearchImages($('#SearchInput').val());
        }
    });
    new FastClick(document.body);
    $('img').lazyload();
    $('#MainFeedBtn').parent().addClass('active');
}

//--------------------------------Device Ready Listener---------------------------------------
document.addEventListener("deviceready", AssignVars, false);
$(function() {
    $('div[data-role="dialog"]').live('pagebeforeshow', function(e, ui) {
        ui.prevPage.addClass("ui-dialog-background ");
    });

    $('div[data-role="dialog"]').live('pagehide', function(e, ui) {
        $(".ui-dialog-background ").removeClass("ui-dialog-background ");
    });
});

//--------------------------------------------------------------------------------------------


/////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////Login Functions//////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////


//------------------------------------------Login Using Facebook--------------------------------


function LoginWithFB(){
    $.ajax({
        type: 'GET',
        url: 'https://graph.facebook.com/me?fields=id,name&access_token=' + window.localStorage.getItem(window.plugins.fbConnect.facebookkey),
        cache: false,
        dataType: 'json',
        complete: function (xhrObj) {
            var Response = $.parseJSON(xhrObj.responseText);
            if(!Response.id){
                navigator.notification.alert(
                    'A Login Error Has Occured',
                    window.plugins.childBrowser.close(),
                    'Error',
                    'Ok'
                );
            }
            else{
                DeviceID = Response.id;
                RealName = Response.name;
                $.mobile.changePage('#MainPage');
                GetFeedImages();
                window.plugins.childBrowser.close();
                socket.emit('GetNewestImages', '');
            }
        }
    });
}

//----------------------------------------Login Using Twitter------------------------------

function AlertTwitter(){
    alert(window.localStorage.getItem(window.plugins.twitterConnect.twitterKey));
}

//--------------------------------------Initialize Facebook--------------------------------------

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

//------------------------------------Initialize Twitter-------------------------------------------

var twitterkey = "twitter";
function InitializeTwitter(){
    var twitteroptions = {
        consumerKey: 'Mw0KyarFAgUyjeZlWSOVQA',
        consumerSecret: 'FsocJzVORc2pGMm4Sgks0yOHykvShzwQWASt9cGR0',
        callbackUrl: 'http://moby.io:8989' };
    var twitter = TwitterConnect.install();
    twitter.connect(twitteroptions);
    twitter.onConnect = onTwitterConnected;

}

function onTwitterConnected() {
    var access_token = JSON.parse(window.localStorage.getItem(window.plugins.twitterConnect.twitterKey));
    var twitteroptions = {
        consumerKey: 'Mw0KyarFAgUyjeZlWSOVQA',
        consumerSecret: 'FsocJzVORc2pGMm4Sgks0yOHykvShzwQWASt9cGR0',
        callbackUrl: 'http://moby.io:8989' };
    twitteroptions.accessTokenKey = access_token.accessTokenKey;
    twitteroptions.accessTokenSecret = access_token.accessTokenSecret;
    window.plugins.twitterConnect.getUser(twitteroptions);
    window.plugins.twitterConnect.onConnect = twitter_register;
}

function twitter_register(  ) {
    var user = JSON.parse( window.localStorage.getItem('twitter_info'));
    var access_token = JSON.parse(window.localStorage.getItem(window.plugins.twitterConnect.twitterKey));
    var oauth_token = access_token.accessTokenKey;
}

//----------------------------------------------------------------------------------------------


/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////Taking And Sending Pictures////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////


//-------------==----------------------Take Picture-----------------------------------------

function TakePicture(){
    navigator.camera.getPicture(onSuccess, DoNothing, {
        quality: 30,
        destinationType: Camera.DestinationType.DATA_URL,
        encodingType: Camera.EncodingType.JPEG,
        targetWidth: 640,
        targetHeight: 960,
        saveToPhotoAlbum: true
    });

    function onSuccess(imageData) {
        $('#HashTag').val('');
        $('#Caption').val('');
        $.mobile.changePage( "#HTForm", { transition: "none"} );
        ImageData = imageData;
    }
}

//-------------------------------Post Picture To Server-------------------------------

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
            Author: DeviceID,
            Image: ImageData,
            HashTag: $('#HashTag').val(),
            Caption: $('#Caption').val(),
            Anonymous: parseInt($('#Anonymous').val())});
    }
}

//-----------------------Send Picture To Facebook----------------------------------

socket.on('ImageURL', function(msg){
    window.plugins.fbConnect.photoPost('"' + msg.Caption + '"... Picture posted using POPIX.', msg.URL);
});

//---------------------------------------------------------------------------------


/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////Get Various Image Streams//////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////


//------------------------------Get Main Stream-------------------------

function GetFeedImages(){
    $('#TopImageList, #MyImageList, #ImageList, #SearchImageList, #FriendsList, #FriendImageList').hide();
    $('body').scrollTop(0);
    $('#ImageList').show();
}

//------------------------------Get Top Stream-------------------------
function GetTopImages(){
    $('#TopImageList').empty();
    $('#TopImageList, #MyImageList, #ImageList, #SearchImageList, #FriendsList, #FriendImageList').hide();
    $('body').scrollTop(0);
    $('#TopImageList').show();
    socket.emit('GetTopImages','');
}

//------------------------------Get Search Stream-------------------------
function GetSearchImages(query){
    $('#SearchImageList').empty();
    $('#SearchImageList').show();
    socket.emit('SearchForImages', query.split(' '));
}

//------------------------------Get User Stream-------------------------
function GetUserImages(){
    $('#MyImageList').empty();
    $('#TopImageList, #MyImageList, #ImageList, #SearchImageList, #FriendsList, #FriendImageList').hide();
    $('body').scrollTop(0);
    $('#MyImageList').show();
    socket.emit('GetUserImages', DeviceID);
}

//--------------------------------Get Friend Images--------------------------

function GetFriendImages(id){
    $('#FriendImageList').empty();
    $('#TopImageList, #MyImageList, #ImageList, #SearchImageList, #FriendsList, #FriendImageList').hide();
    $('body').scrollTop(0);
    $('#FriendImageList').show();
    socket.emit('GetFriendImages', id);
}

//------------------------------Get Facebook Friends-------------------------


function GetFriendsList(){
    $('#FriendsList').empty();
    $('#TopImageList, #MyImageList, #ImageList, #SearchImageList, #FriendsList, #FriendImageList').hide();
    $('body').scrollTop(0);
    $('#FriendsList').show();
    $.ajax({
        type: 'GET',
        url: 'https://graph.facebook.com/me/friends?fields=installed,picture,name&access_token=' + window.localStorage.getItem(window.plugins.fbConnect.facebookkey),
        cache: false,
        dataType: 'json',
        complete: function (xhrObj) {
            var Response = $.parseJSON(xhrObj.responseText);
            for (var i = 0; i<Response.data.length; i++){
                if(Response.data[i].installed){
                    $('#FriendsList').append('<div class="item" onClick="GetFriendImages(\'' + Response.data[i].id + '\')"><img class="FriendImage" src="' + Response.data[i].picture + '"><br />' + Response.data[i].name + '</div>');
                }

            }
        }
    });
}

//----------------------------------------------------------------------------------


/////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////Receiving Image Streams/////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////


//-------------------------Receiving Image for Main Stream--------------------------

socket.on('NewImage', function(msg){
    msg = JSON.parse(msg);
    (function(PhotoSwipe){
        if(mainPhotoSwipe){
            PhotoSwipe.detatch(mainPhotoSwipe);
        }
    }(window.Code.PhotoSwipe));
    $('#ImageList').append('<li><a id="' + msg.ID + '" href="' + msg.ImageFull + '" rel="external" alt="' + msg.HashTag + '"><img src="lib/images/placeholder.gif"  data-src="' + msg.ImageThumb + '" alt="' + msg.Caption + ' Votes: ' + msg.Votes + '"></a></li>');
    if(msg.Count == 1){
        $('#ImageList li a img').lazyload();
    }
    mainPhotoSwipe = $("#ImageList a").photoSwipe({
        captionAndToolbarOpacity: 1,
        captionAndToolbarAutoHideDelay: 0,
        allowUserZoom: false,
        imageScaleMethod: 'zoom',
        captionAndToolbarFlipPosition: true,
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
            socket.emit('VoteUp', {ImageID: ImgObj.refObj.id, UserID: DeviceID});
        }
    });
});

socket.on('UserImages', function(msg){
    msg = JSON.parse(msg);
    (function(PhotoSwipe){
        if(myPhotoSwipe){
            PhotoSwipe.detatch(myPhotoSwipe);
        }
    }(window.Code.PhotoSwipe));
    $('#MyImageList').append('<li><a id="' + msg.ID + '" href="' + msg.ImageFull + '" rel="external" alt="' + msg.HashTag + '"><img src="lib/images/placeholder.gif"  data-src="' + msg.ImageThumb + '" alt="' + msg.Caption + ' Votes: ' + msg.Votes + '"></a></li>');
    if(msg.Count == 1){
        $('#MyImageList li a img').lazyload();
    }
    myPhotoSwipe = $("#MyImageList a").photoSwipe({
        captionAndToolbarOpacity: 1,
        captionAndToolbarAutoHideDelay: 0,
        allowUserZoom: false,
        imageScaleMethod: 'zoom',
        captionAndToolbarFlipPosition: true,
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
    $('#TopImageList').append('<li><a id="' + msg.ID + '" href="' + msg.ImageFull + '" rel="external" alt="' + msg.HashTag + '"><img src="lib/images/placeholder.gif"  data-src="' + msg.ImageThumb + '" alt="' + msg.Caption + ' Votes: ' + msg.Votes + '"></a></li>');
    if(msg.Count == 1){
        $('#TopImageList li a img').lazyload();
    }
    topPhotoSwipe = $("#TopImageList a").photoSwipe({
        captionAndToolbarOpacity: 1,
        captionAndToolbarAutoHideDelay: 0,
        allowUserZoom: false,
        imageScaleMethod: 'zoom',
        captionAndToolbarFlipPosition: true,
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
socket.on('ImageSearchResults', function(msg){
    msg = JSON.parse(msg);
    (function(PhotoSwipe){
        if(searchPhotoSwipe){
            PhotoSwipe.detatch(searchPhotoSwipe);
        }
    }(window.Code.PhotoSwipe));
    $('#SearchImageList').append('<li><a id="' + msg.ID + '" href="' + msg.ImageFull + '" rel="external" alt="' + msg.HashTag + '"><img src="lib/images/placeholder.gif"  data-src="' + msg.ImageThumb + '" alt="' + msg.Caption + ' Votes: ' + msg.Votes + '"></a></li>');
    if(msg.Count == 1){
        $('#SearchImageList li a img').lazyload();
    }
    searchPhotoSwipe = $("#SearchImageList a").photoSwipe({
        captionAndToolbarOpacity: 1,
        captionAndToolbarAutoHideDelay: 0,
        allowUserZoom: false,
        imageScaleMethod: 'zoom',
        captionAndToolbarFlipPosition: true,
        getToolbar: function(){
            return '<div class="ps-toolbar-close"><div class="ps-toolbar-content"></div></div>' +
                '<div class="ps-toolbar-play"><div class="ps-toolbar-content"></div></div>' +
                '<div class="ps-toolbar-previous"><div class="ps-toolbar-content"></div></div>' +
                '<div class="ps-toolbar-next"><div class="ps-toolbar-content"></div></div>' +
                '<div id="SayHi"><img id="ThumbsUp" src="lib/images/thumbs.png" alt=""></div>';
        }
    });
    searchPhotoSwipe.addEventHandler(window.Code.PhotoSwipe.EventTypes.onToolbarTap, function(e){
        if($(e.tapTarget).attr('id') == 'ThumbsUp'){
            var ImgObj = searchPhotoSwipe.getCurrentImage();
            socket.emit('VoteUp', {ImageID: ImgObj.refObj.id, UserID: DeviceID});
        }
    });
});
socket.on('FriendImages', function(msg){
    msg = JSON.parse(msg);
    (function(PhotoSwipe){
        if(friendPhotoSwipe){
            PhotoSwipe.detatch(friendPhotoSwipe);
        }
    }(window.Code.PhotoSwipe));
    $('#FriendImageList').append('<li><a id="' + msg.ID + '" href="' + msg.ImageFull + '" rel="external" alt="' + msg.HashTag + '"><img src="lib/images/placeholder.gif"  data-src="' + msg.ImageThumb + '" alt="' + msg.Caption + ' Votes: ' + msg.Votes + '"></a></li>');
    if(msg.Count == 1){
        $('#FriendImageList li a img').lazyload();
    }
    friendPhotoSwipe = $("#FriendImageList a").photoSwipe({
        captionAndToolbarOpacity: 1,
        captionAndToolbarAutoHideDelay: 0,
        allowUserZoom: false,
        imageScaleMethod: 'zoom',
        captionAndToolbarFlipPosition: true,
        getToolbar: function(){
            return '<div class="ps-toolbar-close"><div class="ps-toolbar-content"></div></div>' +
                '<div class="ps-toolbar-play"><div class="ps-toolbar-content"></div></div>' +
                '<div class="ps-toolbar-previous"><div class="ps-toolbar-content"></div></div>' +
                '<div class="ps-toolbar-next"><div class="ps-toolbar-content"></div></div>' +
                '<div id="SayHi"><img id="ThumbsUp" src="lib/images/thumbs.png" alt=""></div>';
        }
    });
    friendPhotoSwipe.addEventHandler(window.Code.PhotoSwipe.EventTypes.onToolbarTap, function(e){
        if($(e.tapTarget).attr('id') == 'ThumbsUp'){
            var ImgObj = friendPhotoSwipe.getCurrentImage();
            socket.emit('VoteUp', {ImageID: ImgObj.refObj.id, UserID: DeviceID});
        }
    });
});
socket.on('Error', function(msg){
    navigator.notification.alert(msg, DoNothing, 'Error', 'OK')
});

//----------------------------------------------------------------------------------------------


/////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////Menu Functions/////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

function DisableScroll(){
    $('.ui-content').bind("touchmove",function(event){
        event.preventDefault();
    });
}
function EnableScroll(){
    $('.ui-content').unbind("touchmove");
}

$(function(){
    var menuStatus;

    $("a.showMenu").click(function(){
        if(menuStatus != true){
            DisableScroll();
            $('#HeaderSearch').hide();
            $('#HeaderItems').show();
            $('#menu').addClass('SliderMenu');
            $(".ui-page-active").animate({
                marginLeft: "165px"
            }, 0, function(){menuStatus = true});
            return false;
        } else {
            EnableScroll();
            $('#menu').removeClass('SliderMenu');
            $(".ui-page-active").animate({
                marginLeft: "0px"
            }, 0, function(){menuStatus = false});
            return false;
        }
    });
    $('#SearchBtn').click(function(){
        var p = $(this).parent();
        if($(p).hasClass('active')){
            $("#menu li").removeClass('active');
        } else {
            $("#menu li").removeClass('active');
            $(p).addClass('active');
        }
        EnableScroll();
        $('#TopImageList, #MyImageList, #ImageList, #SearchImageList, #FriendsList, #FriendImageList').hide();
        $('body').scrollTop(0);
        $('#menu').removeClass('SliderMenu');
        $(".ui-page-active").animate({
            marginLeft: "0px"
        }, 0, function(){
            menuStatus = false;
            $('#HeaderItems').hide();
            $('#HeaderSearch').show();
        });
    });
    $('#menu ul li a').not('#SearchBtn').click(function(){
        var p = $(this).parent();
        if($(p).hasClass('active')){
            $("#menu li").removeClass('active');
        } else {
            $("#menu li").removeClass('active');
            $(p).addClass('active');
        }
        EnableScroll();
        $('#TopImageList, #MyImageList, #ImageList, #SearchImageList, #FriendsList, #FriendImageList').hide();
        $('body').scrollTop(0);
        $('#menu').removeClass('SliderMenu');
        $(".ui-page-active").animate({
            marginLeft: "0px"
        }, 0, function(){
            menuStatus = false;
        });
    });
});