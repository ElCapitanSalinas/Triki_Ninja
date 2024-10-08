const express = require('express')
const app = express()
const path = require('path');

// Socket
const http = require('http')
const server = http.createServer(app)
const { Server } = require('socket.io');
const { match } = require('assert');
const io = new Server(server)

const port = 3000

app.use(express.static('public'))

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
})

app.get('/registerPlayer', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const players = {
    // [socket.id] = {name: plyName}
}

const sessions = {
/* [sessionName] = {
        players = {
            id1,
            id2
        },
        playerNames = {
            'Juan',
            'CPU'
        }
        scoreboard = {
            2,
            0
        },
        board = {
            ['', '', ''],
            ['', '', ''],
            ['', '', ''],
        },
        turn = 1, 2
        match = 1,
        type = 'single', // single, multi, localmulti
    } */
}

io.on('connection', (socket) => {
    console.log('a user connected');
    console.log(socket.id)

    socket.on('singleGame', (names) => {
        const matchID = generateRandomId();

        sessions[matchID] = { 
            matchID: matchID,
            players: [socket.id, 'cpu'], // Socket ID for each player
            playerNames: names, // Player Names
            scoreboard: [0, 0], // General scoreboard
            board: [
                ['', '', ''],
                ['', '', ''],
                ['', '', '']
            ],
            turn: 0,  // Current Turn
            moves: 0,
            match: 1, // Which match is this one
            type: 'single' // Options: 'single', 'multi', 'localmulti'
        };        
    

        io.to(socket.id).emit('matchPrep', sessions[matchID], matchID);
        
        setTimeout(() => {
            io.to(socket.id).emit('startMatch', sessions[matchID]);
            
            for (const id in sessions[matchID].players) {
                console.log(`current turn ${sessions[matchID].players[sessions[matchID].turn]} `)
                console.log(sessions[matchID].players[id])
                io.to(sessions[matchID].players[id]).emit('assignTurn', sessions[matchID].players[sessions[matchID].turn], sessions[matchID].turn);
            }
        }, Math.floor(Math.random() * (6500 - 2500) + 2500));
        console.log(names, matchID)
    })

    socket.on('multiGame', (names) => {
        const matchID = generateRandomId();

        sessions[matchID] = { 
            matchID: matchID,
            players: [socket.id], // Socket ID for each player
            playerNames: names, // Player Names
            scoreboard: [0, 0], // General scoreboard
            board: [
                ['', '', ''],
                ['', '', ''],
                ['', '', '']
            ],
            turn: 0,  // Current Turn
            moves: 0,
            match: 1, // Which match is this one
            type: 'multi' // Options: 'single', 'multi', 'localmulti'
        };        
    

        io.to(socket.id).emit('matchPrepMulti', sessions[matchID], sessions[matchID].type);
    })

    socket.on('multiJoin', (name, room) => {
        if (sessions[room]) {
            sessions[room].playerNames.push(name)
            sessions[room].players.push(socket.id) 

            var matchID = room
            for (const id in sessions[room].players) {
                io.to(sessions[room].players[id]).emit('matchMulti', sessions[room], sessions[room].type);
                io.to(sessions[room].players[id]).emit('startMatch', sessions[room]);
            }
            setTimeout(() => {
                io.to(socket.id).emit('startMatch', sessions[matchID]);
    
                for (const id in sessions[matchID].players) {
                    console.log(`current turn ${sessions[matchID].players[sessions[matchID].turn]}`)
                    console.log(sessions[matchID].players[id])
                    io.to(sessions[matchID].players[id]).emit('assignTurn', sessions[matchID].players[0], 0);
                }
            }, Math.floor(Math.random() * (6500 - 2500) + 2500));
        

        } else {
            io.to(socket.id).emit('incorrectData');
        }        
    })

    socket.on('markBox', (x, y, matchID) => {

        sessions[matchID].moves = sessions[matchID].moves + 1
        console.log(x,y, matchID)
        if (sessions[matchID].turn == 0){
            sessions[matchID].board[x][y] = 'o'
        } else {
            sessions[matchID].board[x][y] = 'x'
        }
       

        let victory = checkWinner(sessions[matchID].board, sessions[matchID].moves)

        console.log(victory)
        for (const id in sessions[matchID].players) {
            io.to(sessions[matchID].players[id]).emit('checkBox', x, y, sessions[matchID].board[x][y]);
        }
       

        if (victory == undefined) {
            if (sessions[matchID].turn == 0) {
                sessions[matchID].turn = 1
            } else {
                sessions[matchID].turn = 0
            }
    
            
    
            for (const id in sessions[matchID].players) {            
                setTimeout(() => {
                    io.to(sessions[matchID].players[id]).emit('assignTurn', sessions[matchID].players[sessions[matchID].turn], sessions[matchID].turn);
                }, 1400);
            }
    
            if (sessions[matchID].players[1] == 'cpu'){
                setTimeout(() => {
                    playCPU(matchID)
                }, 2000);
                
            }

        } else if (victory == 'draw'){
            for (const id in sessions[matchID].players) {
                io.to(sessions[matchID].players[id]).emit('restartMatch', sessions[matchID]);

                sessions[matchID].board = [
                    ['', '', ''],
                    ['', '', ''],
                    ['', '', '']
                ]
                sessions[matchID].moves = 0
                io.to(sessions[matchID].players[id]).emit('matchPrep', sessions[matchID], matchID);
                setTimeout(() => {
                    io.to(sessions[matchID].players[id]).emit('startMatch', sessions[matchID]);
                    
                    for (const id in sessions[matchID].players) {
                        console.log(`current turn ${sessions[matchID].players[sessions[matchID].turn]} `)
                        console.log(sessions[matchID].players[id])
                        io.to(sessions[matchID].players[id]).emit('assignTurn', sessions[matchID].players[sessions[matchID].turn], sessions[matchID].turn);
                    }
                }, Math.floor(Math.random() * (6500 - 2500) + 2500));
            }
        } else {
            sessions[matchID].scoreboard[sessions[matchID].turn] = sessions[matchID].scoreboard[sessions[matchID].turn] + 1
            for (const id in sessions[matchID].players) {
                io.to(sessions[matchID].players[id]).emit('matchWon', sessions[matchID].playerNames[sessions[matchID].turn], sessions[matchID].scoreboard);
                if (sessions[matchID].scoreboard[id] >= 3){
                       // WIN DEF
                       var winner = 'b'
                       if (sessions[matchID].scoreboard[0] > sessions[matchID].scoreboard[1]){
                           winner = 'a'
                       } else {
                           winner = 'b'
                       }
                    for (const plys in sessions[matchID].players) {
                        io.to(sessions[matchID].players[plys]).emit('partyWon', sessions[matchID].scoreboard[id], winner);
                    }
                } else {
                    setTimeout(() => {
                        io.to(sessions[matchID].players[id]).emit('restartMatch', sessions[matchID]);

                        sessions[matchID].board = [
                            ['', '', ''],
                            ['', '', ''],
                            ['', '', '']
                        ]
                        
                        sessions[matchID].moves = 0
                        io.to(sessions[matchID].players[id]).emit('matchPrep', sessions[matchID], matchID);
                        setTimeout(() => {
                            io.to(sessions[matchID].players[id]).emit('startMatch', sessions[matchID]);
                            
                            for (const id in sessions[matchID].players) {
                                console.log(`current turn ${sessions[matchID].players[sessions[matchID].turn]} `)
                                console.log(sessions[matchID].players[id])
                                io.to(sessions[matchID].players[id]).emit('assignTurn', sessions[matchID].players[sessions[matchID].turn], sessions[matchID].turn);
                            }
                        }, Math.floor(Math.random() * (6500 - 2500) + 2500));
                    }, 3500);
                }
            }
        }
        
    })


    function playCPU(matchID){
        sessions[matchID].moves = sessions[matchID].moves + 1
        let x, y;
        do {
            x = Math.floor(Math.random() * 3); // Random row (0 to 2)
            y = Math.floor(Math.random() * 3); // Random column (0 to 2)
        } while (sessions[matchID].board[x][y] !== ''); // Repeat if the cell is not empty
        sessions[matchID].board[x][y] = 'x'

        for (const id in sessions[matchID].players) {
            setTimeout(() => {
                io.to(sessions[matchID].players[id]).emit('checkBox', x, y, sessions[matchID].board[x][y]);
            }, 1400);
        }
    
        const victory = checkWinner(sessions[matchID].board, sessions[matchID].moves)
        
        console.log(victory)
        if (victory == undefined) {
        
            if (sessions[matchID].turn == 0) {
                sessions[matchID].turn = 1
            } else if (sessions[matchID].turn == 1) {
                sessions[matchID].turn = 0
            }

            for (const id in sessions[matchID].players) {
                setTimeout(() => {
                    console.log('Assigned '+sessions[matchID].turn)
                    io.to(sessions[matchID].players[id]).emit('assignTurn', sessions[matchID].players[sessions[matchID].turn], sessions[matchID].turn);
                }, 1400);
            }
        } else if (victory == 'draw'){
            
            for (const id in sessions[matchID].players) {
                io.to(sessions[matchID].players[id]).emit('restartMatch', sessions[matchID]);

                sessions[matchID].board = [
                    ['', '', ''],
                    ['', '', ''],
                    ['', '', '']
                ]
                sessions[matchID].turn = 0
                sessions[matchID].moves = 0
                io.to(sessions[matchID].players[id]).emit('matchPrep', sessions[matchID], matchID);
                setTimeout(() => {
                    io.to(sessions[matchID].players[id]).emit('startMatch', sessions[matchID]);
                    
                    for (const id in sessions[matchID].players) {
                        console.log(`current turn ${sessions[matchID].players[sessions[matchID].turn]} `)
                        console.log(sessions[matchID].players[id])
                        io.to(sessions[matchID].players[id]).emit('assignTurn', sessions[matchID].players[sessions[matchID].turn], sessions[matchID].turn);
                    }
                }, Math.floor(Math.random() * (6500 - 2500) + 2500));
            }
        } else {
            sessions[matchID].scoreboard[sessions[matchID].turn] = sessions[matchID].scoreboard[sessions[matchID].turn] + 1
            for (const id in sessions[matchID].players) {
                io.to(sessions[matchID].players[id]).emit('matchWon', sessions[matchID].playerNames[sessions[matchID].turn], sessions[matchID].scoreboard);
                if (sessions[matchID].scoreboard[id] >= 3){
                    // WIN DEF
                    var winner = 'b'
                    if (sessions[matchID].scoreboard[0] > sessions[matchID].scoreboard[1]){
                        winner = 'a'
                    } else {
                        winner = 'b'
                    }
                    io.to(sessions[matchID].players[id]).emit('partyWon', sessions[matchID].scoreboard[id], winner);
                } else {
                    setTimeout(() => {
                        io.to(sessions[matchID].players[id]).emit('restartMatch', sessions[matchID]);

                        sessions[matchID].board = [
                            ['', '', ''],
                            ['', '', ''],
                            ['', '', '']
                        ]
                        sessions[matchID].turn = 0
                        sessions[matchID].moves = 0
                        io.to(sessions[matchID].players[id]).emit('matchPrep', sessions[matchID], matchID);
                        setTimeout(() => {
                            io.to(sessions[matchID].players[id]).emit('startMatch', sessions[matchID]);
                            
                            for (const id in sessions[matchID].players) {
                                console.log(`current turn ${sessions[matchID].players[sessions[matchID].turn]} `)
                                console.log(sessions[matchID].players[id])
                                io.to(sessions[matchID].players[id]).emit('assignTurn', sessions[matchID].players[sessions[matchID].turn], sessions[matchID].turn);
                            }
                        }, Math.floor(Math.random() * (6500 - 2500) + 2500));
                    }, 3500);
                }
            }
        }
    }
});

server.listen(port, function () {
    console.log(`App running on port ${port}`)
});



function generateRandomId() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters[randomIndex];
    }
    return result;
}

function checkWinner(board, turn){
    // Checking rows
    console.log(turn)
    if (turn == 9){
        return 'draw'
    }

    for (let i = 0; i < 3; i++) {
        const a = board[i][0];
        const b = board[i][1];
        const c = board[i][2];

        if (a != '' && a === b && b === c) {
            return 'win';
        }
    }

    // Checking columns
    for (let i = 0; i < 3; i++) {
        const a = board[0][i];
        const b = board[1][i];
        const c = board[2][i];

        if (a != '' && a === b && b === c) {
            return 'win';
        }
    }

    // Left Top to Bottom right diagonal
    const a = board[0][0];
    const b = board[1][1];
    const c = board[2][2];

    if (a != '' && a === b && b === c) {
        return 'win';
    }

    // Right Top to Left bottom diagonal
    const d = board[0][2];
    const e = board[1][1];
    const f = board[2][0];

    if (d != '' && d === e && e === f) {
        return 'win';
        
    }

    // Check for draw
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            const square = board[i][j];
            if (square === '') return undefined;
        }
    }

    return 'draw';
};


function placeRandomValue(board, value) {
    // Generate random row and column until an empty cell is found
  
}
