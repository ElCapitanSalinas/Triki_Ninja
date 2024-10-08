let actWindow 

let gameMode
let gameRoom
let ownedPly

const socket = io()


let messages = [
    'Creating match',
    'Loading assets',
    'Establishing opponent'
]

let defaultBox = '<div id="box-0-0" data-x="0" data-y="0" data-marked="false" class="triki-box w-1/3 h-1/3 border-r-4 border-b-4 border-trikibox cursor-pointer"></div>'+
'<div id="box-1-0" data-x="1" data-y="0" data-marked="false" class="triki-box w-1/3 h-1/3 border-b-4 border-trikibox cursor-pointer"></div>'+
'<div id="box-2-0" data-x="2" data-y="0" data-marked="false" class="triki-box w-1/3 h-1/3 border-l-4 border-b-4 border-trikibox cursor-pointer"></div>'+
'<div id="box-0-1" data-x="0" data-y="1" data-marked="false" class="triki-box w-1/3 h-1/3 border-r-4 border-trikibox cursor-pointer"></div>'+
'<div id="box-1-1" data-x="1" data-y="1" data-marked="false" class="triki-box w-1/3 h-1/3 border-trikibox cursor-pointer"></div>'+
'<div id="box-2-1" data-x="2" data-y="1" data-marked="false" class="triki-box w-1/3 h-1/3 border-l-4 border-trikibox cursor-pointer"></div>'+
'<div id="box-0-2" data-x="0" data-y="2" data-marked="false" class="triki-box w-1/3 h-1/3 border-r-4 border-t-4 border-trikibox cursor-pointer"></div>'+
'<div id="box-1-2" data-x="1" data-y="2" data-marked="false" class="triki-box w-1/3 h-1/3 border-t-4 border-trikibox cursor-pointer"></div>'+
'<div id="box-2-2" data-x="2" data-y="2" data-marked="false" class="triki-box w-1/3 h-1/3 border-l-4 border-t-4 border-trikibox cursor-pointer"></div>';

let charges = 1
let interval
function iterateDots(){
    var el = document.getElementById("dots");
    var dotsStr = el.innerHTML;
    var dotsLen = dotsStr.length;

    charges = charges + 1

    var maxDots = 3;
    el.innerHTML = (dotsLen < maxDots ? dotsStr + '.' : '');

    if (charges == 18) {
        $('#messages').html(messages[Math.floor(Math.random() * messages.length)]);
        charges = 1
    }
}

function startLoading(){
    var intervalMs = 300;

    interval = setInterval("iterateDots()", intervalMs);
}    

const audioElement = new Audio("music.mp3");

$(document).ready(function () {
    $('#playBtn').click(function (e) { 
        e.preventDefault();

        audioElement.play();
        audioElement.volume = 0.3;
        
        $('#mainApp').fadeOut(500, function(){
            actWindow = this
            $('#secondScreen').fadeIn(500, function(){
                actWindow = this
            });
        });
    });

    $('#singlePlayerBtn').click(function (e) { 
        e.preventDefault();
        $('#secondScreen').fadeOut(500, function(){
            actWindow = 'nameScreenSingle'
            gameMode = 'single'
            $('#nameScreen').fadeIn(500, function(){
                actWindow = this
            });
        });
    });



    $('#nameSubmit').click(function (e) { 
        e.preventDefault();

        if (gameMode == 'single'){
            var name = $('#name').val()
        
            let names = [name, 'CPU']
    
            socket.emit('singleGame', names)
        } else if (gameMode == 'multi') {
            var name = $('#name').val()
        
            let names = [name]
    
            socket.emit('multiGame', names)
        } else if (gameMode == 'multiJoin') {
            var name = $('#name').val()
            var room = $('#roomId').val();
        
            socket.emit('multiJoin', name, room)
        }
        
    });

    $('#Create').click(function (e) { 
        e.preventDefault();
        $('#roomScreen').fadeOut(500, function(){
            actWindow = 'roomScreen'
            gameMode = 'multi'
            $('#nameScreen').fadeIn(500, function(){
                actWindow = this
            });
        });
    });


    $('#Join').click(function (e) { 
        e.preventDefault();
        $('#roomScreen').fadeOut(500, function(){
            actWindow = 'roomScreen'
            gameMode = 'multiJoin'
            if ($('#roomId').val() !== ''){
                $('#nameScreen').fadeIn(500, function(){
                    actWindow = this
                });
            } else {
                alert('Use a valid ID')
                $('#roomScreen').fadeIn(500, function () { 
                    actWindow = this
                });
            }
            
        });
    });

    
    $('#LocalMultiBtn').click(function (e) { 
        e.preventDefault();
        $('#secondScreen').fadeOut(500, function(){
            gameMode = 'localmulti'
            $('#nameScreen').fadeIn(500, function(){
                actWindow = this
            });
        });
    });

    
    $('#MultiBtn').click(function (e) { 
        e.preventDefault();
        $('#secondScreen').fadeOut(500, function(){
            gameMode = 'multi'
            $('#roomScreen').fadeIn(500, function(){
                actWindow = this
            });
        });
    });

    $('.home-btn').click(function (e) { 
        e.preventDefault();
        if ($(actWindow).data('window') !== 'mainMenu'){
            $(actWindow).fadeOut(500, function(){
                $('#secondScreen').fadeIn(500,function () { 
                    actWindow = this
                 });
            });   
        } else {
            $(actWindow).fadeOut(500, function(){
                $('#mainApp').fadeIn(500, function () { 
                    actWindow = this
                 });
            });  
        }
    });


    socket.on('matchPrep', (sessionData, matchId) => {
        $('#name').val('')
        $('#player1Name').text(sessionData.playerNames[0]);
        $('#player2Name').text(sessionData.playerNames[1]);
        $('#nameScreen').fadeOut(500, function () { 
            $('#gamePanel').fadeIn(500, ()=>{
                actWindow = this
                // startLoading()
            });
         });

        gameRoom = matchId
    });

    socket.on('matchMulti', (sessionData, matchId) => {
        $('#name').val('')
        $('#player1Name').text(sessionData.playerNames[0]);
        $('#player2Name').text(sessionData.playerNames[1]);
        $('#nameScreen').fadeOut(500, function () { 
            $('#gamePanel').fadeIn(500, ()=>{
                actWindow = this
                // startLoading()
            });
         });

        gameRoom = matchId
    });

    socket.on('incorrectData', (sessionData, matchId) => {
        $('#mainApp').fadeIn(500, function () { 
            actWindow = this
            alert('Wrong room!')
        });
    });

    

    socket.on('matchPrepMulti', (sessionData, type) => {
        $('#name').val('')
        $('#player1Name').text(sessionData.playerNames[0]);
        $('#player2Name').text(sessionData.playerNames[1]);
        $('#nameScreen').fadeOut(500, function () { 
            $('#gamePanel').fadeIn(500, ()=>{
                $('#textMatch').html('The code of your match is: <span style="color:red;">'+sessionData.matchID+'</span>, <br> share it with your friend to start.');
            });
         });

        gameRoom = matchId
    });

    socket.on('startMatch', (sessionData) => {
        clearInterval(interval)
        $('#textMatch').html('Match starts in 3');
        setTimeout(() => {
            $('#textMatch').html('Match starts in 2');
            setTimeout(() => {
                $('#textMatch').html('Match starts in 1');
                setTimeout(() => {
                    $('#matchStarter').fadeOut();
                }, 1500);
            }, 1000);
        }, 1000);

        gameRoom = sessionData.matchID
    });

    socket.on('restartMatch', (sessionData) => {
        clearInterval(interval)
        
        $('#tic-board').html(defaultBox);

        $('.triki-box').click(function (e) { 
            e.preventDefault();
            if (canClick && !$(this).data('marked')) {
                canClick = false
                let x = $(this).data('x');
                let y = $(this).data('y');
                $('#mainText').text('Wait!');
                socket.emit('markBox', x, y, gameRoom)
            }
        });
    
    });

    let turn
    socket.on('assignTurn', (playerTurnId, turn) => {
        if (socket.id == playerTurnId){
            canClick = true
            $('#mainText').text('Your turn!');
        } else {
            if (turn == 0){
                $('#mainText').text(`${$('#player1Name').text()}'s turn!`);
            } else {
                $('#mainText').text(`${$('#player2Name').text()}'s turn!`);
            } 
        }
    });

    socket.on('partyWon', (Score, winner) => {
        if (winner == 'a'){
            $('#wins').text(Score[0]);
            $('#defeats').text(Score[1]);

            $('#winnerName').text($('#player1Name').text());

            $('#winnerName').addClass('player1Name');
            $('#winnerImg').attr('src', './img/ply1.png'); 
        } else {

            $('#winnerName').text($('#player2Name').text());
            $('#wins').text(Score[1]);
            $('#defeats').text(Score[0]);

            $('#winnerName').addClass('player2Name');
            $('#winnerImg').attr('src', './img/ply2.png');
        }

        $('#gamePanel').fadeOut(500, function(){
            $('#winnerScreen').fadeIn(500, function () {
                actWindow = this
            });
        });
    });


    $('.triki-box').click(function (e) { 
        e.preventDefault();
        if (canClick && !$(this).data('marked')) {
            canClick = false
            let x = $(this).data('x');
            let y = $(this).data('y');
            $('#mainText').text('Wait');
            socket.emit('markBox', x, y, gameRoom)
        }
    });

    socket.on('checkBox', (x, y, figure) => {
        markBox(x, y, figure)
    });

    socket.on('matchWon', (player, score, method, direction) => {
        if (method == 'col'){
            if (direction == 2){
                $('#column-line').addClass('left-48');
            } else if (direction == 3){
                $('#column-line').addClass('translate-x-44');
            }
        }
        $('#textMatch').html(player+` Won the match! <br> The board is ${score[0]} - ${score[1]}`);
        $('#wins-1').html(score[0]);
        $('#wins-2').html(score[1]);
        $('#matchStarter').fadeIn(500);
        setTimeout(() => {
            $('#matchStarter').fadeOut();
        }, 3000);
    });

    function markBox(x, y, figure) { 
        const box = `#box-${x}-${y}`
        if (figure == 'o'){
            $(box).html('<svg id="figure-'+x+'-'+y+'" class="tic-figure hidden ml-auto mr-auto mt-7" width="75" height="72" viewBox="0 0 75 72" fill="none" xmlns="http://www.w3.org/2000/svg">'+
                '<path d="M70 36C70 52.9304 55.6436 67 37.5 67C19.3564 67 5 52.9304 5 36C5 19.0696 19.3564 5 37.5 5C55.6436 5 70 19.0696 70 36Z" fill="#FFF1E5" stroke="#FF0000" stroke-width="10"/>'+
                '</svg>');   
        } else {
            $(box).html('<svg id="figure-'+x+'-'+y+'" class="tic-figure hidden ml-auto mr-auto mt-7" width="63" height="63" viewBox="0 0 63 63" fill="none" xmlns="http://www.w3.org/2000/svg">'+
            '<path d="M7.57974 61.312L7.93329 61.6655L8.28685 61.312L31.5 38.0989L54.7131 61.312L55.0666 61.6655L55.4202 61.312L61.3118 55.4203L61.6654 55.0667L61.3118 54.7132L38.0987 31.5001L61.3118 8.28697L61.6654 7.93341L61.3118 7.57986L55.4202 1.68819L55.0666 1.33464L54.7131 1.68819L31.5 24.9013L8.28685 1.68819L7.93329 1.33464L7.57974 1.68819L1.68807 7.57986L1.33452 7.93341L1.68807 8.28697L24.9012 31.5001L1.68807 54.7132L1.33452 55.0667L1.68807 55.4203L7.57974 61.312Z" fill="#00BBFF" stroke="#00BBFF"/>'+
            '</svg>');
        }

        $('#figure-'+x+'-'+y+'').fadeIn();
        $(box).data('marked', true);
    }

    $('#menuBtn').click(function (e) { 
        e.preventDefault();
        location.reload()
    });

    let play
    window.addEventListener("keydown", function (){
        switch (event.keyCode) {
            case 32: //SpaceBar                    
                if (play) {
                    audioElement.pause();
                    play = false;
                } else {
                    audioElement.play();
                    play = true;
                }
                break;
        }
    }, false);
});
