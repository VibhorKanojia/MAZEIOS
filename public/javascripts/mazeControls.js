/* This script lets the user control various aspects of the maze being drawn. */

var clientID;
var socketID;
var socket;
var connectionEstablished=0;
var pauseKeyEvents = 0;
var controlFlip = 0;
var mazeCount = 0;

//var audio = new Audio('blop.mp3');





var difficulty = 1;
var canvas_width =  screen.width;
var canvas_height = screen.height*2/3;

var width = 15;
var height = 20;
var controlSize = 40;

var step = Math.floor(canvas_height/height);
canvas_width  = step*width+4;
canvas_height = step*height+4;
var destroy_wall = 0;                //destroy wall player 1
var maze;
var val_right_cur = 0;
var val_up_cur = 0;

var init_flag = 0; // used when a user starts the game during 'solve' mode. Maze should be loaded for that user only.



var canvas = document.createElement("canvas"),
        context = canvas.getContext('2d'),
        gradient = context.createLinearGradient(0, 0, canvas_width, canvas_height);




function drawMaze(data){
    destroy_wall = 0;                //destroy wall player 1
    val_right_cur = 0;                                                  //FUCKING COMPLICATED STUFF 'was' AHEAD. I fucking simplified it :P
    val_up_cur = 0;
    pauseKeyEvents = 0;
    controlFlip = 0;
    
    context.fillStyle = "#FFFFFF";
    context.fillRect(0, 0, canvas_width, canvas_height);
    
    maze.draw(canvas, step, data);
};


function flipControls() {
    socket.emit('Flip Controls', clientID);
    document.getElementById('flipControls').disabled = true;

};


function initSliders(){
    
}

function initTimer(){
    var timerElem = document.getElementById("timer");
    timerElem.style.position = "absolute";
    timerElem.style.top = canvas_height + 60 + 'px';
    timerElem.style.left = (screen.width/2) + 'px';
    timerElem.style.color= "#005B9C";
}


function initBlock(){
    var box = document.getElementById('block');
    box.style.display="block";
    box.style.position = "absolute";
    box.style.left = $("#mazeHolder").offset().left+"px";
    box.style.top =  $("#mazeHolder").offset().top+"px";
    box.style.width= step.toString()+"px";
    box.style.height = step.toString()+"px";
    box.style.background = "#005B9C";
}


$(window).on('beforeunload', function(){
    socket.close();
});

    
window.onload = function () {
    maze = new maze.Maze(width,height);
  
    canvas.setAttribute("width", canvas_width.toString());
    canvas.setAttribute("height", canvas_height.toString());


    initSliders();
    initBlock();
    initTimer();

    var mazeholder = document.getElementById("mazeHolder");
    
    if (mazeholder.insertAdjacentElement) {       
         mazeholder.insertAdjacentElement ("afterBegin", canvas);
    }
    
    else {
        switch ("afterBegin") {
            case "beforeBegin":
                mazeholder.parentNode.insertBefore (canvas, mazeholder);
                break;
            case "afterBegin":
                mazeholder.insertBefore (canvas, mazeholder.firstChild);
                 break;
            case "beforeEnd":
                mazeholder.appendChild (canvas);
                break;
            case "afterEnd":
                mazeholder.parentNode.insertBefore (canvas, mazeholder.nextSibling);
                break;
        }
    }

    socket = io();
    
    socket.on('SocketID message', function(data){
        socketID = data.sid;
        socket.emit('Get ClientID', socketID);
        socket.on ('Set ClientID', function(cID){
            clientID = cID;
        });
    });

    socket.on('Set Timer', function(timeCount){
        var timerElem = document.getElementById("timer");
        (timeCount>9)?timerElem.innerHTML = "0:"+timeCount.toString():timerElem.innerHTML = "0:0"+timeCount.toString();
    });


    socket.on('ENTER WAIT MODE', function(){
        canvas.style.display="none";
        document.getElementById("block").style.display="none";
    });

    socket.on('ENTER PLAY MODE', function(ref_maze){
        init_flag = 1;
        canvas.style.display="block";
        drawMaze(ref_maze);
        initSliders();
        initTimer();
        initBlock();
    });

    socket.on('ENTER SOLVE MODE', function(ref_maze){
        if (init_flag == 0){
            canvas.style.display="block";
            drawMaze(ref_maze);
            initSliders();
            initTimer();
            initBlock();
        }
        
        maze.drawSolution(canvas,val_right_cur,val_up_cur);
    });

    
    socket.on ('Flip Controls',function(){
        pauseKeyEvents = 1;
        setTimeout(
            function(){
                controlFlip = 1;
                pauseKeyEvents = 0;
            }, 500);

        setTimeout(
            function(){
                pauseKeyEvents = 1;
            }, 10500);

        setTimeout(
            function(){
                controlFlip = 0;
                pauseKeyEvents = 0;
            }, 11000);        

    });
    
    socket.on ('Break Wall', function(direction){
        maze.destroyWall(canvas, step, val_right_two,val_up_two, width, direction);    
    });
};













