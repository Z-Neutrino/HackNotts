var whiteboard = document.getElementById("whiteboard");
var ctx = whiteboard.getContext("2d");
var drawId = null;

var toolNames = [["Freeform line", "001-random-line.png"], ["Straight line", "002-substract.png"], ["Rectangle", "003-photo-frame.png"], ["Filled rectangle", "003-photo-frame-filled.png"], ["Ellipse", "005-ellipse-outline-shape-variant.png"], ["Outlined circle", "011-circle-outline-shape-variant.png"], ["Filled circle", "010-circle-fill-shape-variant.png"]];
//, ["Text", "006-text-height-adjustment.png"]];
var tool = 0;
var penColour = "";

$(document).ready(function() {



    var localDrawInfo = [];

    $('#copy-code').click(function(){
        var ret = copyToClipboard(findGetParameter("id"));
        $('#copy-code-error').text(ret);
        $('#copy-code-error').show();
        setTimeout(function(){
            $('#copy-code-error').fadeOut();
        }, 2000);
    });


    var mouseDown = 0;
    var drawStatus = "inactive";
    $("#whiteboard").mousedown(function(){
        if(mouseDown == 0){
            var sendData = {type:tool, colour:penColour, width:Number($("#brush-width").val())}
            socket.emit('initDraw', JSON.stringify(sendData));
            drawStatus = "pending";
            if(penColour == "") {
                penColour = userCol;
            }
        }
        ++mouseDown;
    });

    $("#whiteboard").mouseup(function(){
        --mouseDown;
        if(mouseDown == 0){
            ctx.strokeStyle = penColour;
            ctx.lineWidth = Number($("#brush-width").val());
            if(tool != 0){

                switch(tool){
                    case 1: // straight line
                        drawLine(localDrawInfo[drawId].points[0], localDrawInfo[drawId].points[1]);
                        var sendData1 = {pos: localDrawInfo[drawId].points[0], type:tool, id:drawId, colour: penColour, width:Number($("#brush-width").val())}
                        var sendData2 = {pos: localDrawInfo[drawId].points[1], type:tool, id:drawId, colour: penColour, width:Number($("#brush-width").val())}
                        socket.emit('drawPoint', JSON.stringify(sendData1));
                        socket.emit('drawPoint', JSON.stringify(sendData2));
                    break
                    case 2:
                    case 3:
                    case 4:
                        var a = localDrawInfo[drawId].points[0];
                        var b = localDrawInfo[drawId].points[1];
                        var min = {x:Math.min(a.x,b.x),y:Math.min(a.y,b.y)};
                        var max = {x:Math.max(a.x,b.x),y:Math.max(a.y,b.y)};
                        var sendData1 = {pos: min, type:tool, id:drawId, colour: penColour, width:Number($("#brush-width").val())};
                        var sendData2 = {pos: max, type:tool, id:drawId, colour: penColour, width:Number($("#brush-width").val())};
                        socket.emit('drawPoint', JSON.stringify(sendData1));
                        socket.emit('drawPoint', JSON.stringify(sendData2));

                        if(tool == 2){
                            drawRect(min,max);
                        } else if(tool==3) {
                            drawFillRect(min,max);
                        } else {
                            drawEllipse(min,max)
                        }
                    break

                    case 5:
                        drawCircle(localDrawInfo[drawId].points[0], localDrawInfo[drawId].points[1]);
                        var sendData1 = {pos: localDrawInfo[drawId].points[0], type:tool, id:drawId, colour: penColour, width:Number($("#brush-width").val())}
                        var sendData2 = {pos: localDrawInfo[drawId].points[1], type:tool, id:drawId, colour: penColour, width:Number($("#brush-width").val())}
                        socket.emit('drawPoint', JSON.stringify(sendData1));
                        socket.emit('drawPoint', JSON.stringify(sendData2));
                    break
                    case 6:
                        drawFillCircle(localDrawInfo[drawId].points[0], localDrawInfo[drawId].points[1]);
                        var sendData1 = {pos: localDrawInfo[drawId].points[0], type:tool, id:drawId, colour: penColour, width:Number($("#brush-width").val())}
                        var sendData2 = {pos: localDrawInfo[drawId].points[1], type:tool, id:drawId, colour: penColour, width:Number($("#brush-width").val())}
                        socket.emit('drawPoint', JSON.stringify(sendData1));
                        socket.emit('drawPoint', JSON.stringify(sendData2));
                    break
                }




            }
            drawStatus = "invalid"
            drawId = null;
        }
    })

    $("#whiteboard").mousemove(function(evt){
        var pos = getMousePos(document.getElementById("whiteboard"), evt)
        var sendData = {pos: pos, id: drawId, type:tool, colour: penColour, width:Number($("#brush-width").val())};
        if(mouseDown && drawStatus == "drawing"){
            if(tool == 0){
                socket.emit('drawPoint', JSON.stringify(sendData));
            }
            ctx.strokeStyle = penColour;
            ctx.lineWidth = Number($("#brush-width").val());
            draw(tool, drawId, pos);
        }
    });

    function draw(type, tmpDrawId, pos){
        drawPoints = localDrawInfo[tmpDrawId].points;
        penColour = userCol;
        if(type == 0){
            if(drawPoints.length != 0) {
                drawLine(drawPoints[drawPoints.length-1], pos);
            }
            drawPoints.push(pos);
        } else if(type != 0){
            if(drawPoints.length!=2){
                drawPoints.push(pos);

            } else {
                drawPoints[1] = pos;
            }
        }

        localDrawInfo[tmpDrawId].points = drawPoints;
    }

    socket.on('fullData', function(data){
        data = JSON.parse(data);
        ctx.clearRect(0, 0, whiteboard.width, whiteboard.height);
        for(var i=0; i<data.length;i++){
            var element = data[i];
            var points = element.points
            ctx.strokeStyle = element.colour;
            ctx.lineWidth = element.width;
            localDrawInfo[i] = {type:element.type, points:[], colour: element.colour}
            for(var p = 0; p<points.length;p++){
                draw(element.type, i, points[p]);
            }
            if(element.type!=0){
                switch(element.type){
                    case 1:
                        drawLine(localDrawInfo[i].points[0], localDrawInfo[i].points[1]);
                    break
                    case 2:
                        drawRect(localDrawInfo[i].points[0], localDrawInfo[i].points[1]);
                    break
                    case 3:
                        drawFillRect(localDrawInfo[i].points[0], localDrawInfo[i].points[1]);
                    break
                    case 4:
                        drawEllipse(localDrawInfo[i].points[0], localDrawInfo[i].points[1]);
                    break
                    case 5:
                        drawCircle(localDrawInfo[i].points[0], localDrawInfo[i].points[1]);
                    break
                    case 6:
                        drawFillCircle(localDrawInfo[i].points[0], localDrawInfo[i].points[1]);
                    break
                }
            }
        }
        console.log(localDrawInfo);
    });

    socket.on('initDrawId', function(data){
        data = JSON.parse(data);

        if(data.name == name){
            drawStatus = "drawing";
            drawId = data.id;
            tmpId = drawId;
            type = tool;
        } else {
            type = data.type;
            tmpId = data.id;
        }

        localDrawInfo[tmpId] = {type:type,points:[]}
    });

    socket.on("drawPoint", function(data) {
        console.log(data);
        var data = JSON.parse(data);
        ctx.strokeStyle = data.colour;
        ctx.lineWidth = data.width;
        draw(data.type, data.id, data.pos);
        if(data.type!=0 && localDrawInfo[data.id].points.length == 2){
            switch(data.type){
                case 1:
                    drawLine(localDrawInfo[data.id].points[0], localDrawInfo[data.id].points[1]);
                break
                case 2:
                    drawRect(localDrawInfo[data.id].points[0], localDrawInfo[data.id].points[1]);
                break
                case 3:
                    drawFillRect(localDrawInfo[data.id].points[0], localDrawInfo[data.id].points[1]);
                break
                case 4:
                    drawEllipse(localDrawInfo[data.id].points[0], localDrawInfo[data.id].points[1]);
                break
                case 5:
                    drawCircle(localDrawInfo[data.id].points[0], localDrawInfo[data.id].points[1]);
                break
                case 5:
                    drawFillCircle(localDrawInfo[data.id].points[0], localDrawInfo[data.id].points[1]);
                break
            }
        }
    });

	$("#refresh").click(function() {
        socket.emit("fullDataRequest");
	});

	$("#logout").click(function() {
        sessionStorage.clear();
        window.history.pushState({}, '', '?');
        location.reload();
	});

    $("#blank").click(function() {
        socket.emit("clear");
    });

    socket.on("clear", function() {
        localDrawInfo = [];
        ctx.clearRect(0, 0, whiteboard.width, whiteboard.height);
    });

});

function drawLine(start,end){

    ctx.beginPath();
    ctx.moveTo(start.x,start.y);
    ctx.lineTo(end.x,end.y);
    ctx.stroke();
    // ctx.closePath();
}

function drawRect(start,end){
    var size = {x:end.x-start.x,y:end.y-start.y};
    ctx.beginPath();
    ctx.rect(start.x,start.y,size.x,size.y);
    ctx.stroke();
}

function drawFillRect(start,end){
    var size = {x:end.x-start.x,y:end.y-start.y}
    ctx.beginPath();
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fillRect(start.x,start.y,size.x,size.y);
    ctx.stroke();
}

function drawCircle(start,end){
    var rad = Math.sqrt( Math.pow((end.x-start.x),2) + Math.pow((end.y-start.y),2) );

    ctx.beginPath();

    ctx.arc(start.x,start.y,rad,0,2*Math.PI);
    ctx.stroke()
}

function drawFillCircle(start,end){
    var rad = Math.sqrt( Math.pow((end.x-start.x),2) + Math.pow((end.y-start.y),2) );

    ctx.beginPath();
    ctx.arc(start.x,start.y,rad,0,2*Math.PI);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
    ctx.stroke()
}

function drawEllipse(start,end){
    ctx.beginPath();
    var cent = {
        x:start.x+((end.x-start.x)/2),
        y:start.y+((end.y-start.y)/2)
    }
    ctx.ellipse(cent.x,cent.y, (end.x-start.x)/2, (end.y-start.y)/2, 0, 0, 2*Math.PI);
    ctx.stroke();
}

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: Math.floor((evt.clientX-rect.left)/(rect.right-rect.left)*canvas.width),
        y: Math.floor((evt.clientY-rect.top)/(rect.bottom-rect.top)*canvas.height)
    };
}

function copyToClipboard(text) {
    var $temp = $("<input>");
    $("body").append($temp);
    $temp.val(text).select();
    var msg;
    try {
        var successful = document.execCommand('copy');
        msg = successful ? 'Copied' : 'Unable to copy :(';

    } catch (err) {
        msg = 'Unable to copy :(';

    }
    $temp.remove();
	return msg;
}

function findGetParameter(parameterName) {
    var result = null,
        tmp = [];
    location.search
        .substr(1)
        .split("&")
        .forEach(function (item) {
          tmp = item.split("=");
          if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
        });
    return result;
}

function showWhiteboard() {
	$("#createOrJoin-form, #username-corner").fadeOut()
    setTimeout(function() {
		$("#whiteboard-row").fadeIn();
        fixRes($('#whiteboard'));
	}, 500);
}
