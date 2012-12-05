var canvas = io.connect(surl + "canvas");

$(function() {				
	var pallette = $("#pallette"), colors = [
		"black", "white", "gray", "lightgray", "red", "pink", 
		"orange", "yellow", "green", "lightgreen", "blue", "lightblue"
	];
    var strHTML = "<div style='float:left;'>";
	for(var i = 0; colors.length; i++) {
		strHTML += "<div class='color' style='background:" + colors.shift() + "'></div>";					
		if(colors.length % 6 == 0) {
			strHTML += "<div class='newline'></div>";
		}
	}
    
    pallette.append(strHTML + "</div><div id='color' style='float:left;background-color:black;'></div><div class='newline'></div>");
    
	var color = $("#color");
	pallette.find(".color").click(function(e) {
		color.css("background-color", $(e.target).css("background-color"));
	});
    
});

//CANVAS FUNCTIONS

function getCanvas(data, callback) {
    var down = 0, cvs = $("<canvas id='canvas_"
        + data.room
        + "' style='background:white;border:1px solid black;' width='" 
        + data.width 
        + "' height='" 
        + data.height 
        + "'></canvas>"
    ).mousedown(function(e) {
        down = 1;
        e.preventDefault();
        e.color = $("#color").css("background-color");
        var r = e.target.getBoundingClientRect();
        e.x = e.lastX = this.lastX = (e.pageX - r.left) * (this.width / this.clientWidth);
        e.y = e.lastY = this.lastY = (e.pageY - r.top) * (this.height / this.clientHeight);
        updateCanvas(ctx, e);
    }).mouseup(function(e) {
        down = 0;
    }).mousemove(function(e){
        if(down) {
            e.preventDefault();
            var r = e.target.getBoundingClientRect();
            e.color = $("#color").css("background-color");
            e.lastX = this.lastX;
            e.lastY = this.lastY;  
            this.lastX = e.x = (e.pageX - r.left) * (this.width / this.clientWidth);
            this.lastY = e.y = (e.pageY - r.top) * (this.height / this.clientHeight);       
            updateCanvas(ctx, e);
        }
    }).mouseout(function(){
        down = 0;
    }),
    ctx = cvs[0].getContext("2d");
    callback(cvs);
    canvas.emit("joinCanvas", ctx.room = data.room, function(){});
}

function draw(ctx, e) {   
    if(e.data) {
        ctx.putImageData(asImageData(ctx, e.data), 0, 0);
    } else {
        ctx.strokeStyle = e.color;
        ctx.beginPath();
        ctx.moveTo(e.x, e.y);
        ctx.lineTo(e.lastX, e.lastY);
        ctx.closePath();
        ctx.stroke();
    }
}

function updateCanvas(ctx, e) {
    canvas.emit("updateCanvas", {
        room : ctx.room,
        x : e.x,
        y : e.y,
        lastX : e.lastX,
        lastY : e.lastY,
        color : e.color
    });
}

function asByteArray(ctx) {
    return ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height).data;
}

function asImageData(ctx, b) {
    var id = ctx.createImageData(ctx.canvas.width, ctx.canvas.height);
    for(var i = 0; i < b.length; i++) {
        id.data[i] = b[i];
    }
    return id;
}

canvas.on("updateCanvas", function(data) {
    var $canvas = $("#canvas_" + data.room);
    if($canvas.length != 0) {
        draw($("#canvas_" + data.room)[0].getContext("2d"), data);
    }
});

canvas.on("requestCanvas", function(room) {
    var $canvas = $("#canvas_" + room);
    if($canvas.length != 0) {
        canvas.emit("updateCanvas", {
            data : asByteArray($canvas[0].getContext("2d")),
            room : room
        }); 
    }
});

/*
//EXAMPLE
$(function() {
    getCanvas({
        width : 32, 
        height : 32, 
        room : "test"    
    }, function(cvs) {
        cvs.css({
            width : 300,
            height : 300
        });
        $(document.body).append(cvs);    
    });
    getCanvas({
        width : 300, 
        height : 300, 
        room : "test2"    
    }, function(cvs) {
        $(document.body).append(cvs);    
    });
});
*/