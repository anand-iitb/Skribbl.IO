var express = require('express');
var socket = require('socket.io');
var fs = require('fs');
const nodemon = require('nodemon');
// const { count } = require('console');
//App setup
var app = express();
var server = app.listen(3999, function(){
    // console.log('listening to port');
});

function rand_word(word_list, n){
    for(let i=0; i<n; i++){
        var r = Math.floor(Math.random() * (word_list.length-i)) + i;
        var temp = word_list[i];
        word_list[i] = word_list[r];
        word_list[r] = temp;
    }
    return word_list.slice(0,n); 
}


var words;

fs.readFile('wordlist.txt','utf8', function(err,data){
    if(err) throw err;
    words = data.split('\n');
    console.log(rand_word(words,3));
})
//static files
app.use(express.static('public'));

// Socket setup


const io = require('socket.io')(server, {
    cors: {
      origin: '*',
    }
  });
  
//data declaration
players={};             //socket.id -> username map
sockets_map={};
p_rooms={};             //socket.id -> room joined map
public_rooms = [];      //list of all public rooms
private_rooms = [];      //list of all private rooms
count = {};             //room -> count of players in that room map
room_keys = {};         //key of room if private , null otherwise
players_in_a_room = {}; //room to player mapping
creator_room = {};      //room to creator mapping
started = {};           //game started in a room or not
game_state = {};        //state of a started game
scores = {};            //socket.id -> scores mapping [round1 , r2, r3]
guess_count = {};       //room -> correct guesses of words(resets to zero after evry turn)
guessed = {};           //username -> 
kick_map = {};          //room _>jhk
canvas_state = {};

var active = {};
var init_time = {};
var now = new Date();



io.on('connection', function(socket){
    socket.on('new_player',function(data){
        if(Object.values(players).includes(data.username)){
            io.to(socket.id).emit('validation',{success: false});
        }
        else{
            players[socket.id]=data.username;
            sockets_map[data.username] = socket.id;
            io.to(socket.id).emit('validation',{success: true, rooms: public_rooms});      
            guessed[socket.id] = false;                            
            io.emit("leader_board",{board: leader_board(scores)});
        }
    });
    socket.on('new_room',function(data){
        if(public_rooms.includes(data.roomname) || private_rooms.includes(data.roomname)){
            io.to(socket.id).emit('room_valid',{success: false});
        }
        else{
            if(data.room_key===null)
            {
                public_rooms.push(data.roomname);
            }else{
                private_rooms.push(data.roomname);
            }
            players_in_a_room[data.roomname]=[];
            players_in_a_room[data.roomname].push(players[socket.id]);
            socket.join(data.roomname);
            kick_map[data.roomname] = null;
            count[data.roomname] = 1;
            room_keys[data.roomname] = data.room_key;
            creator_room[data.roomname]=players[socket.id];
            p_rooms[socket.id]=data.roomname;
            scores[players[socket.id]] = [0,0,0];
            started[p_rooms[socket.id]]=false;
            guess_count[data.roomname] = 0;
            io.to(socket.id).emit('room_valid',{success: true, myroom: data.roomname});
            io.emit('room_added',{room : data.roomname});
            io.to(data.roomname).emit('chat-msg',{user: players[socket.id],msg : "You joined the room"});
            io.to(data.roomname).emit('players_list_update',{players : players_in_a_room[data.roomname],count : count[data.roomname],scores: scores});
            io.emit("leader_board",{board: leader_board(scores)});
        }
    });
    socket.on("join_room",function(data) {
        if(!public_rooms.includes(data.room) && !private_rooms.includes(data.room)){
            io.to(socket.id).emit('room_valid',{success: false,msg: "no such room"});
        }
        else if(public_rooms.includes(data.room)){
            socket.join(data.room);
            count[data.room] += 1;
            p_rooms[socket.id]=data.room;
            scores[players[socket.id]] = [0,0,0];
            players_in_a_room[data.room].push(players[socket.id]);
            if(started[data.room]){00
                io.to(socket.id).emit('room_valid',{success: true, user: socket.id,msg : "Joined the room",started: started[data.room],action: game_state[p_rooms[socket.id]].action,image_data : canvas_state[p_rooms[socket.id]]});
                console.log(game_state[p_rooms[socket.id]]);
            }
            else{
                io.to(socket.id).emit('room_valid',{success: true, user: socket.id,msg : "Joined the room",started: false,action: null});
            }
            io.to(data.room).emit('chat-msg',{user: players[socket.id],msg : "Joined the room"});
            io.to(data.room).emit('players_list_update',{players : players_in_a_room[data.room],count : count[data.room],scores: scores});
            io.emit("leader_board",{board: leader_board(scores)}); 
        }
        else if(room_keys[data.room]!==data.key){
            io.to(socket.id).emit('room_valid',{success: false,msg: "incorrect key"});
        }
        else{
            socket.join(data.room);
            count[data.room] += 1;
            p_rooms[socket.id]=data.room;
            scores[players[socket.id]] = [0,0,0];
            players_in_a_room[data.room].push(players[socket.id]);
            if(started[data.room]){
                io.to(socket.id).emit('room_valid',{success: true, user: socket.id,msg : "Joined the room",started: started[data.room],action: game_state[p_rooms[socket.id]].action});
            }
            else{
                io.to(socket.id).emit('room_valid',{success: true, user: socket.id,msg : "Joined the room",started: false,action: null});
            }
            io.to(data.room).emit('chat-msg',{user: players[socket.id],msg : "Joined the room"});
            io.to(data.room).emit('players_list_update',{players : players_in_a_room[data.room],count : count[data.room],scores: scores});
            io.emit("leader_board",{board: leader_board(scores)}); 
        }
    });

    socket.on("chat-msg",function(data) {
        if(game_state[p_rooms[socket.id]].curr_PIR[game_state[p_rooms[socket.id]].artist_index]!==players[socket.id] && !guessed[socket.id] && game_state[p_rooms[socket.id]].action=="drawing"){
            if(game_state[p_rooms[socket.id]].words.toLowerCase()==(data.msg.toLowerCase())){
                io.to(p_rooms[socket.id]).emit("chat-msg",{user: players[socket.id],msg : players[socket.id] + " guessed correctly"});
                if(!guessed[socket.id]){
                    scores[players[socket.id]][game_state[p_rooms[socket.id]].round-1]+=10;
                    scores[players[socket.id]][game_state[p_rooms[socket.id]].round-1]-=guess_count[p_rooms[socket.id]];
                    guess_count[p_rooms[socket.id]]+=1;
                    guessed[socket.id] = true;
                    io.to(p_rooms[socket.id]).emit('players_list_update',{players : players_in_a_room[p_rooms[socket.id]],count : count[p_rooms[socket.id]],scores: scores});
                    io.emit("leader_board",{board: leader_board(scores)});
                }
            }
            else io.to(p_rooms[socket.id]).emit("chat-msg",{user: players[socket.id],msg : data.msg});
            // console.log(game_state[p_rooms[socket.id]].words);
        }
    });

    socket.on("draw",function(data){
        if(game_state[p_rooms[socket.id]].curr_PIR[game_state[p_rooms[socket.id]].artist_index]==players[socket.id]){
            io.to(p_rooms[socket.id]).emit("draw",data);
            canvas_state[p_rooms[socket.id]] = data.image_data;
        }
    });

    socket.on("clear",function(){
        if(game_state[p_rooms[socket.id]].curr_PIR[game_state[p_rooms[socket.id]].artist_index]==players[socket.id]) io.to(p_rooms[socket.id]).emit("clear")
    });
    
    socket.on('start_game',function(){
        if(players[socket.id]==creator_room[p_rooms[socket.id]]){
            io.to(p_rooms[socket.id]).emit("start");
            console.log("reached");
            started[p_rooms[socket.id]]=true;
            let curr_PIR = players_in_a_room[p_rooms[socket.id]];   //PIR:People In Room
            game_state[p_rooms[socket.id]] = {round: 1,action: "choosing",curr_PIR: curr_PIR,words: rand_word(words,3),artist_index: 0};
            io.to(p_rooms[socket.id]).emit("game_state",{round: 1,action: "choosing",curr_PIR: curr_PIR,words: game_state[p_rooms[socket.id]].words,artist_index: 0});
            setTimeout(function(data){
                if(typeof game_state[p_rooms[socket.id]].words !== typeof "kk"){
                    // console.log(Math.floor(3*Math.random()));
                    game_state[p_rooms[socket.id]].words = game_state[p_rooms[socket.id]].words[Math.floor(3*Math.random())];
                    io.to(socket.id).emit("erase_choices",{round: data.round,action: "drawing",curr_PIR: data.curr_PIR,words: data.words,artist_index: data.artist_index});
                    io.to(p_rooms[socket.id]).emit("game_state",{round: game_state[p_rooms[socket.id]].round,action: "drawing",curr_PIR: curr_PIR,words: game_state[p_rooms[socket.id]].words,artist_index: 0});
                    io.to(p_rooms[socket.id]).emit("clock_start",{cur_time: new Date().getTime()});
                 
                }
            },10000,game_state[p_rooms[socket.id]]);
        }
    });

    socket.on('chosen',function(data){
        console.log(data);
        console.log(p_rooms[socket.id]);
        console.log(players[socket.id]);
        for(let i=0;i<players_in_a_room[p_rooms[socket.id]].length;i++){
            guessed[sockets_map[players_in_a_room[p_rooms[socket.id]][i]]] = false;
        }
        game_state[p_rooms[socket.id]] = data;
        game_state[p_rooms[socket.id]].action = "drawing";
        io.to(p_rooms[socket.id]).emit("game_state",{round: data.round,action: "drawing",curr_PIR: data.curr_PIR,words: word_format(data.words),artist_index: data.artist_index});
        io.to(sockets_map[game_state[p_rooms[socket.id]].curr_PIR[game_state[p_rooms[socket.id]].artist_index]]).emit("game_state",{round: data.round,action: "drawing",curr_PIR: data.curr_PIR,words: data.words,artist_index: data.artist_index});
        io.to(p_rooms[socket.id]).emit("clock_start",{cur_time: new Date().getTime()});
        
        setTimeout(function(){
            
            scores[game_state[p_rooms[socket.id]].curr_PIR[game_state[p_rooms[socket.id]].artist_index]][data.round-1] += Math.floor(guess_count[p_rooms[socket.id]]*15/count[p_rooms[socket.id]]);
            guess_count[p_rooms[socket.id]] = 0;
            io.to(data.room).emit('players_list_update',{players : players_in_a_room[data.room],count : count[data.room],scores: scores});
           if(data.curr_PIR.length>(data.artist_index+1)){
            game_state[p_rooms[socket.id]]={round: data.round,action: "choosing",curr_PIR: data.curr_PIR,words: rand_word(words,3),artist_index: data.artist_index+1};
            io.to(p_rooms[socket.id]).emit("game_state",{round: data.round,action: "choosing",curr_PIR: data.curr_PIR,words: game_state[p_rooms[socket.id]].words,artist_index: data.artist_index+1});
            setTimeout(function(data){
                if(typeof game_state[p_rooms[socket.id]].words !== typeof "kk"){
                    game_state[p_rooms[socket.id]].words = game_state[p_rooms[socket.id]].words[Math.floor(3*Math.random())];
                    io.to(socket.id).emit("erase_choices",{round: data.round,action: "drawing",curr_PIR: data.curr_PIR,words: data.words,artist_index: data.artist_index});
                    io.to(p_rooms[socket.id]).emit("game_state",{round: game_state[p_rooms[socket.id]].round,action: "drawing",curr_PIR: data.curr_PIR,words: game_state[p_rooms[socket.id]].words,artist_index: data.artist_index});
                    io.to(p_rooms[socket.id]).emit("clock_start",{cur_time: new Date().getTime()});
                 
                }
            },10000,game_state[p_rooms[socket.id]]);
        }
           else if(data.round<3){
            game_state[p_rooms[socket.id]]={round: data.round+1,action: "choosing",curr_PIR: players_in_a_room[p_rooms[socket.id]],words: rand_word(words,3),artist_index: 0};
            io.to(p_rooms[socket.id]).emit("game_state",{round: data.round+1,action: "choosing",curr_PIR: players_in_a_room[p_rooms[socket.id]],words: game_state[p_rooms[socket.id]].words,artist_index: 0});
            setTimeout(function(data){
                if(typeof game_state[p_rooms[socket.id]].words !== typeof "kk"){
                    game_state[p_rooms[socket.id]].words = game_state[p_rooms[socket.id]].words[Math.floor(3*Math.random())];
                    io.to(socket.id).emit("erase_choices",{round: data.round,action: "drawing",curr_PIR: data.curr_PIR,words: data.words,artist_index: data.artist_index});
                    io.to(p_rooms[socket.id]).emit("game_state",{round: game_state[p_rooms[socket.id]].round,action: "drawing",curr_PIR: data.curr_PIR,words: game_state[p_rooms[socket.id]].words,artist_index: data.artist_index});
                    io.to(p_rooms[socket.id]).emit("clock_start",{cur_time: new Date().getTime()});
                 
                }
            },10000,game_state[p_rooms[socket.id]]);
        }
           else{
            delete game_state[p_rooms[socket.id]];
            io.to(p_rooms[socket.id]).emit("game_ended",{scores: scores});
            started[p_rooms[socket.id]] = false;
           }
           //b kick_map[]
           if(kick_map[p_rooms[socket.id]]!==null){
            // console.log("ttt");
            let kicked = kick_map[p_rooms[socket.id]];
            kick_map[p_rooms[socket.id]] = null;
            // let user = players_in_a_room[p_rooms[socket.id]][game_state[p_rooms[socket.id]].artist_index];
            players_in_a_room[p_rooms[socket.id]].splice(game_state[p_rooms[socket.id].artist_index],1);
            console.log(players_in_a_room[p_rooms[socket.id]]);
            io.to(p_rooms[socket.id]).emit('players_list_update',{players : players_in_a_room[p_rooms[socket.id]],count : count[p_rooms[socket.id]],scores: scores});
            count[p_rooms[socket.id]]--;
            // delete p_rooms[sockets_map[kicked]];
            if(kicked==creator_room[p_rooms[socket.id]]){
                // delete players[socket.id];
                creator_room[p_rooms[socket.id]]=players_in_a_room[p_rooms[socket.id]][0];
            }
            console.log(kicked);
        }
        },30000);
    });

    socket.on('clock_started',function(data){
        watch(data.cur_time,30);
    })

    socket.on('kick',function(){
        if(players_in_a_room[p_rooms[socket.id]][game_state[p_rooms[socket.id]].artist_index]!=players[socket.id]){
            kick_map[p_rooms[socket.id]] = players_in_a_room[p_rooms[socket.id]][game_state[p_rooms[socket.id]].artist_index];
            // console.log("ttt");
            let user = players_in_a_room[p_rooms[socket.id]][game_state[p_rooms[socket.id]].artist_index];
            // players_in_a_room[p_rooms[socket.id]].splice([game_state[p_rooms[socket.id]].artist_index],1);
            // console.log(players_in_a_room[p_rooms[socket.id]]);
            // io.to(p_rooms[socket.id]).emit('players_list_update',{players : players_in_a_room[p_rooms[socket.id]],count : count[p_rooms[socket.id]],scores: scores});
            // count[p_rooms[socket.id]]--;
            // // delete p_rooms[sockets_map[user]];
            // if(user==creator_room[p_rooms[socket.id]]){
            //     // delete players[socket.id];
            //     creator_room[p_rooms[socket.id]]=players_in_a_room[p_rooms[socket.id]][0];
            // }
            // console.log(user);
            io.to(sockets_map[user]).emit('you_kicked',{room: p_rooms[socket.id]});
            // game_state[p_rooms[socket.id]].curr_PIR.splice(game_state[p_rooms[socket.id]].artist_index,1)
        }
    })
    
    socket.on('kick_me',function(data){
        io.to(data.room).emit('chat-msg',{user: players[socket.id],msg : "Kicked"});
        socket.leave(data.room);
    })
    
    socket.on('disconnect',()=>{
        
        // delete game_state[p_rooms[socket.id]].curr_PIR[game_state[p_rooms[socket.id]].artist_index];
        if(p_rooms[socket.id]!=null){
            const ind =  players_in_a_room[p_rooms[socket.id]].indexOf(players[socket.id]);
            count[p_rooms[socket.id]] -= 1;
            if(ind>-1){
                players_in_a_room[p_rooms[socket.id]].splice(ind,1);
                io.to(p_rooms[socket.id]).emit('players_list_update',{players : players_in_a_room[p_rooms[socket.id]],count : count[p_rooms[socket.id]],scores: scores});
            }
            socket.to(p_rooms[socket.id]).emit('chat-msg',{user: players[socket.id],msg : "Disconnected"});
        }
        
        if(public_rooms.includes(p_rooms[socket.id])){
            if(count[p_rooms[socket.id]]==0) delete public_rooms[public_rooms.indexOf(p_rooms[socket.id])];
        }else if(private_rooms.includes(p_rooms[socket.id])){
            if(count[p_rooms[socket.id]]==0) delete private_rooms[private_rooms.indexOf(p_rooms[socket.id])];
        }
        refine_rooms();
        delete sockets_map[players[socket.id]];
        delete scores[players[socket.id]];
        if(players[socket.id]==creator_room[p_rooms[socket.id]]&&(count[p_rooms[socket.id]]>0)){
            delete players[socket.id];
            creator_room[p_rooms[socket.id]]=players_in_a_room[p_rooms[socket.id]][0];
        }
        else{
            delete players[socket.id]; 
        }
        io.emit("leader_board",{board: leader_board(scores)});  
    });
    function watch(countDownDate,timer){
      
        // Get today's date and time
        var now = new Date().getTime();
        
        // Find the distance between now and the count down date
        var distance = now - countDownDate;
        
        // Time calculations for days, hours, minutes and seconds
        
        var seconds = 30 - Math.floor((distance % (1000 * 60)) / 1000);
        if(seconds>0) setTimeout(watch,1000,countDownDate,timer-1);
        // console.log(typeof seconds);
        // Display the result in the element with id="demo"
        // document.getElementById("timer").innerText =  seconds + "s ";
        io.to(p_rooms[socket.id]).emit('clock_tick',{sec: seconds});
        // console.log(seconds);
      
        // If the count down is finished, write some text
        // if (distance < 0) {
        //   clearInterval(T);
        //   document.getElementById("timer").innerHTML = "EXPIRED";
        // }
      }
});
function refine_rooms() {
    for(i in public_rooms){
        if(public_rooms[i]==null){
            public_rooms[i]=public_rooms[i+1];
            public_rooms[i+1]=null;
        }
    }
    for(i in private_rooms){
        if(private_rooms[i]==null){
            private_rooms[i]=private_rooms[i+1];
            private_rooms[i+1]=null;
        }
    }
}

function word_format(word){
    char_arr = word.split("");
    for(let i=0;i<char_arr.length;i++){
        if((char_arr[i]>='a' && char_arr[i]<='z') || (char_arr[i]>='A' && char_arr[i]<='Z')){
            char_arr[i] = "_ ";
        }
    }
    return char_arr.join("");
}

function leader_board(dict){
    var items = Object.keys(dict).map(function(key) {
        return [key, dict[key].reduce(function(a,b){ return a+b;},0)];
      });
      
      // Sort the array based on the second element
      items.sort(function(first, second) {
        return second[1] - first[1];
      });
      
      // Create a new array with only the first 5 items
      if(items.length>5) return items.slice(0, 5);
      return items;
}
