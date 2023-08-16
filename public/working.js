var socket = io.connect('http://localhost:3999') //connecting to server
var username = document.getElementById('username'),
    reg_btn = document.getElementById('register'),
    room_error = document.getElementById("room_error"),
    create_public_btn = document.getElementById("create_room_public"),
    create_private_btn = document.getElementById("create_room_private"),
    roomname = document.getElementById("roomname"),
    pvt_roomname = document.getElementById("private_roomname"),
    room_key = document.getElementById("private_roomname_key"),
    join_btn = document.getElementById("room_join"),
    join_name = document.getElementById("rooms"),
    chat_div = document.getElementById("chat"),
    chat_box = document.getElementById("chat-box"),
    drawing_div = document.getElementById("drawing-board"),
    palette_div = document.getElementById("palette"),
    join_pvt_btn = document.getElementById("join_pvt_room");
    game_start_btn = document.getElementById("lobby"),
    word1_btn = document.getElementById("word1"),
    word2_btn = document.getElementById("word2"),
    word3_btn = document.getElementById("word3"),
    chosen_word = document.getElementById("chosen_word"),
    votekick_btn = document.getElementById("votekick_btn");
const myPics = document.getElementById('myPics');
const context = myPics.getContext('2d');
let room_data = {};

//Button to register username
reg_btn.addEventListener('click', function(){
  let str=username.value;
  str=str.trim();
  if(str==""){
    name_error.innerText="Name must be non empty";
  }
  else{
    socket.emit('new_player',{username: username.value});
  }
});

//Button to register a room
create_public_btn.addEventListener('click', function(){
  let str=roomname.value;
  str=str.trim();
  if(str==""){
    room_error.innerText="Room name must be non empty";
  }
  else{
    // room_name = roomname.value;
    socket.emit('new_room',{roomname: roomname.value, room_key: null});
  }
});

create_private_btn.addEventListener('click', function(){
  let str=pvt_roomname.value;
  let key_str = room_key.value;
  str=str.trim();
  if(str===""){
    room_error.innerText="Room name must be non empty";
  }
  else if(key_str.trim()===""){
    room_error.innerText="Invalid Key";
  }
  else{
    // room_name = roomname.value;
    socket.emit('new_room',{roomname: pvt_roomname.value , room_key: room_key.value});
  }
});

//Button to join a room 
join_btn.addEventListener('click',function() {
  let str=join_name.value;
  str=str.trim();
  if(str==""){
    room_error.innerText="Room name must be non empty";
  }
  else{
    socket.emit('join_room',{room: join_name.value});
  }
})
join_pvt_btn.addEventListener('click',function(){
  let pvt_room_name = document.getElementById("pvt_room");
  let pvt_room_key = document.getElementById("pvt_room_key");
  let name = pvt_room_name.value;
  let key = pvt_room_key.value;
  if(name.trim()===""){
    room_error.innerText = "Room name must not be empty";
  }else if(key.trim()===""){
    room_error.innerText = "Invalid key";
  }else{
    socket.emit('join_room',{room: pvt_room_name.value,key: pvt_room_key.value});
  }
});


//Code to send message through chatbox
chat_box.children[1].addEventListener('click',function() {
  let str=chat_box.children[0].value;
  str=str.trim();
  if(str==""){
    room_error.innerText="Message must be non empty";
  }
  else{
    socket.emit('chat-msg',{msg: chat_box.children[0].value});
    chat_box.children[0].value="";
  }
})

//starting the game
game_start_btn.addEventListener('click',function(){
    socket.emit('start_game');
})

//handling the random word button
word1_btn.addEventListener('click',function(){
  room_data.words=word1_btn.innerText;
  socket.emit('chosen',room_data)
})
word2_btn.addEventListener('click',function(){
  room_data.words=word2_btn.innerText;
  socket.emit('chosen',room_data)
})
word3_btn.addEventListener('click',function(){
  room_data.words=word3_btn.innerText;
  socket.emit('chosen',room_data)
})

votekick_btn.addEventListener('click',function(){
  socket.emit('kick');
})

socket.on('you_kicked',function(data){
  let reg_wind = document.getElementById("register_window");
  let profile_wind = document.getElementById("user_prof");
  let create_room_wind = document.getElementById("create_room");
  let join_room_wind = document.getElementById("join_room");
  let name_disp = document.getElementById("name_display");
  let room_div = document.getElementById("room_list")
  let chat_div = document.getElementById("chat");
  let chat_box = document.getElementById("chat-box");
  let drawing_div = document.getElementById("drawing-board");
  let lobby_div = document.getElementById("lobby");
  let plr_list = document.getElementById("playerlist");
  let timer_div = document.getElementById("timer");
  let votekick_div = document.getElementById("votekick");
  document.getElementById("chosen_word").style.display = "none";
  document.getElementById("join_private_room").style.display = "block";
  document.getElementById("private_create_room").style.display = "block";
  document.getElementById("leader_board").style.display = "block";
  votekick_div.style.display = "none";
  chat_div.style.display = "none";
  chat_box.style.display = "none";
  name_disp.innerText=username.value;
  reg_wind.style.display = "none";
  profile_wind.style.display = "block";
  create_room_wind.style.display = "block";
  join_room_wind.style.display = "block";
  room_div.style.display = "block";
  drawing_div.style.display = "none";
  palette_div.style.display = "none";
  lobby_div.style.display = "none";
  plr_list.style.display = "none";
  timer_div.style.display = "none"
  document.getElementById("headers").style.display = "none";
  socket.emit("kick_me",{room: data.room});
  alert("You are KICKED!!!!!!!!!!!! xD \n Wo/Manners maketh Wo/Man");
})

//Taking a valid user to the lobby to create or join a room
socket.on('validation',function(data){
  if(data.success){
    let reg_wind = document.getElementById("register_window");
    let profile_wind = document.getElementById("user_prof");
    let create_room_wind = document.getElementById("create_room");
    let create_pvt_room_wind = document.getElementById("private_create_room");
    let join_room_wind = document.getElementById("join_room");
    let name_disp = document.getElementById("name_display");
    let room_list = document.getElementById("rooms");
    let room_div = document.getElementById("room_list");
    let pvt_room_div = document.getElementById("join_private_room");
    let leader_board = document.getElementById("leader_board");
    leader_board.style.display = "block";
    leader_board.style.width = "50%";
    name_disp.innerText=username.value;
    reg_wind.style.display = "none";
    profile_wind.style.display = "block";
    create_room_wind.style.display = "block";
    create_pvt_room_wind.style.display = "block";
    join_room_wind.style.display = "block";
    room_div.style.display = "block";
    pvt_room_div.style.display = "block";
    for(room in data.rooms){
      opt = document.createElement("option");
      opt.innerText = data.rooms[room];
      room_list.appendChild(opt);
    }
  }
  else{
    name_error.innerText="Name already taken";
  }
});

//Taking a valid user to the room lobby
socket.on('room_valid',function(data){
  if(data.success){
    let reg_wind = document.getElementById("register_window");
    let profile_wind = document.getElementById("user_prof");
    let create_room_wind = document.getElementById("create_room");
    let create_pvt_room_wind = document.getElementById("private_create_room");
    let join_room_wind = document.getElementById("join_room");
    let name_disp = document.getElementById("name_display");
    let room_div = document.getElementById("room_list")
    let chat_div = document.getElementById("chat");
    let chat_box = document.getElementById("chat-box");
    let drawing_div = document.getElementById("drawing-board");
    let pvt_room_div = document.getElementById("join_private_room");
    let lobby_div = document.getElementById("lobby");
    let plr_list = document.getElementById("playerlist");
    let header = document.getElementById("headers");
    let leader_board = document.getElementById("leader_board");
    leader_board.style.display = "none";
    name_disp.innerText=username.value;
    reg_wind.style.display = "none";
    profile_wind.style.display = "none";
    join_room_wind.style.display = "none";
    create_room_wind.style.display = "none";
    pvt_room_div.style.display = "none";
    room_div.style.display = "none";
    create_pvt_room_wind.style.display="none";
    plr_list.style.display = "block";
    if(data.started){
      document.getElementById("votekick").style.display = "block";
      // context.putImageData(data.image_data,0,0);
    }
    if(!data.started){
      room_name = data.myroom;
      chat_div.style.display = "none";
      chat_box.style.display = "none";
      drawing_div.style.display = "none";
      palette_div.style.display = "none";
      lobby_div.style.display = "block";
    }
    else{
      // console.log(data.action=="");
      if(data.action=="choosing"){
        canvas_clear();
        document.getElementById("words").style.display = "none";
        document.getElementById("drawing-board").style.display = "none";
        document.getElementById("palette").style.display = "none";
        document.getElementById("action").innerText = "player is choosing a word";
        document.getElementById("chat").style.display = "block";
        document.getElementById("chat-box").style.display = "block";
        header.style.display = "block";
      }
      else if(data.action=="drawing"){
        document.getElementById("words").style.display = "none";
        document.getElementById("drawing-board").style.display = "block";
        document.getElementById("palette").style.display = "block";
        document.getElementById("action").innerText = "guess the word";
        document.getElementById("chat").style.display = "block";
        document.getElementById("chat-box").style.display = "block";
        header.style.display = "block"; 
      }
     }
  }
  else{
    room_error.innerText="Name already taken";
  }
});

//updating players in a room
socket.on('players_list_update',function(data){
  plr_list = document.getElementById("playerlist");
  
  plr_list.innerText = "";
  for(let i=1;i<=data.count;i++){
      plr_list.innerHTML += "<p>"+data.players[i-1]+" : "+data.scores[data.players[i-1]].reduce(function(a,b){return a+b;},0)+"</p>";
  }
});
//Adding newly created rooms to the drop-down box to all players 
socket.on('room_added',function(data) {
  let room_list = document.getElementById("rooms");
  opt = document.createElement("option");
  opt.innerText = data.room;
  room_list.appendChild(opt);
});

socket.on('erase_choices',function(data){
  socket.emit('chosen',data);
})

//handling game_state signal
socket.on('game_state',function(data){
  console.log(data);
  room_data=data;
  document.getElementById("round_no").innerText = "Round no. " + data.round;
  if(data.curr_PIR[data.artist_index]==username.value){
    if(data.action=="choosing"){
      canvas_clear();
      document.getElementById("word1").innerText = data.words[0];
      document.getElementById("word2").innerText = data.words[1];
      document.getElementById("word3").innerText = data.words[2];
      document.getElementById("words").style.display = "block";
      document.getElementById("drawing-board").style.display = "none";
      document.getElementById("palette").style.display = "none";
      document.getElementById("action").innerText = "choose a word";
      document.getElementById("chat").style.display = "block";
      document.getElementById("chat-box").style.display = "block";
      chosen_word.style.display = "none";
    }
    if(data.action=="drawing"){
      document.getElementById("words").style.display = "none";
      document.getElementById("drawing-board").style.display = "block";
      document.getElementById("palette").style.display = "block";
      document.getElementById("action").innerText = "draw the word";
      document.getElementById("chat").style.display = "block";
      document.getElementById("chat-box").style.display = "block";
      chosen_word.style.display = "block";
      chosen_word.innerText = data.words;
    }
  }
  else{
    if(data.action=="choosing"){
      canvas_clear();
      document.getElementById("words").style.display = "none";
      document.getElementById("drawing-board").style.display = "none";
      document.getElementById("palette").style.display = "none";
      document.getElementById("action").innerText = "player is choosing a word";
      document.getElementById("chat").style.display = "block";
      document.getElementById("chat-box").style.display = "block";
      chosen_word.style.display = "none";
    }
    if(data.action=="drawing"){
      document.getElementById("words").style.display = "none";
      document.getElementById("drawing-board").style.display = "block";
      document.getElementById("palette").style.display = "block";
      document.getElementById("action").innerText = "guess the word";
      document.getElementById("chat").style.display = "block";
      document.getElementById("chat-box").style.display = "block";
      chosen_word.style.display = "block";
      chosen_word.innerText = data.words;
    }
  }
});

function watch(countDownDate,timer){
  
  // Get today's date and time
  var now = new Date().getTime();
  
  // Find the distance between now and the count down date
  var distance = now - countDownDate;
  
  // Time calculations for days, hours, minutes and seconds
  
  var seconds = 30 - Math.floor((distance % (1000 * 60)) / 1000);
  if(seconds>0) setTimeout(watch,1000,countDownDate,timer-1);
  // console.log(seconds);
  // Display the result in the element with id="demo"
  document.getElementById("timer").innerText =  seconds + "s ";
  // console.log(seconds);

  // If the count down is finished, write some text
  // if (distance < 0) {
  //   clearInterval(T);
  //   document.getElementById("timer").innerHTML = "EXPIRED";
  // }
}

//Creating timer

socket.on('clock_tick',function(data){
  // console.log(data);
  document.getElementById("timer").style.display = 'block';
  document.getElementById("timer").innerText =  data.sec.toString() + " s";
})

socket.on('clock_start',function(data){
  document.getElementById("timer").innerText =  "30 s";
  socket.emit("clock_started",{cur_time: data.cur_time});
})


//Displaying the chat content to all users in the room
socket.on('chat-msg',function(data){
  let msg_div = document.getElementById("chat");
  let msg_elem = document.createElement("p");
  msg_elem.innerText = `${data.user}: ${data.msg}`;
  msg_div.appendChild(msg_elem);
  var xH = msg_div.scrollHeight; 
  msg_div.scrollTo(0, xH);
});

//handling game start
socket.on('start',function(){
  let reg_wind = document.getElementById("register_window");
  let profile_wind = document.getElementById("user_prof");
  let create_room_wind = document.getElementById("create_room");
  let join_room_wind = document.getElementById("join_room");
  let name_disp = document.getElementById("name_display");
  let room_div = document.getElementById("room_list")
  let chat_div = document.getElementById("chat");
  let chat_box = document.getElementById("chat-box");
  let drawing_div = document.getElementById("drawing-board");
  let lobby_div = document.getElementById("lobby");
  let plr_list = document.getElementById("playerlist");
  let timer_div = document.getElementById("timer");
  let votekick_div = document.getElementById("votekick");
  votekick_div.style.display = "block";
  chat_div.style.display = "block";
  chat_box.style.display = "block";
  name_disp.innerText=username.value;
  reg_wind.style.display = "none";
  profile_wind.style.display = "none";
  create_room_wind.style.display = "none";
  join_room_wind.style.display = "none";
  room_div.style.display = "none";
  drawing_div.style.display = "block";
  palette_div.style.display = "block";
  lobby_div.style.display = "none";
  plr_list.style.display = "block";
  timer_div.style.display = "block";
  
  document.getElementById("headers").style.display = "block";
});

//canvas functions
let isDrawing = false;
let x = 0;
let y = 0;

//taking mouse input
myPics.addEventListener('mousedown', e => {
  x = e.offsetX;
  y = e.offsetY;
  isDrawing = true;
});
myPics.addEventListener('mousemove', e => {
  if (isDrawing === true) {
    socket.emit('draw',{x1: x,y1: y,x2: e.offsetX,y2: e.offsetY,draw_color: curr_color,draw_width: curr_width, image_data: context.getImageData(0,0,700,500)});

    x = e.offsetX;
    y = e.offsetY;
  }
});
window.addEventListener('mouseup', e => {
  if (isDrawing === true) {
    socket.emit('draw',{x1: x,y1: y,x2: e.offsetX,y2: e.offsetY,draw_color: curr_color,draw_width: curr_width, image_data: context.getImageData(0,0,700,500)});
    x = 0;
    y = 0;
    isDrawing = false;
  }
});

//drawing in local canvas
function drawLine(context, x1, y1, x2, y2,C,W) {
  context.beginPath();
  context.strokeStyle = C;
  context.fillStyle= C;
  context.lineWidth = 1;
  let d = Math.floor(Math.sqrt(Math.pow(x1-x2,2)+Math.pow(y1-y2,2)));
  for(let i=0;i<=d;i++){
    context.arc((x1*i+x2*(d-i))/d,(y1*i+y2*(d-i))/d,W,0,2*Math.PI);
  }
  context.fill();
  context.stroke();
  context.closePath();
}

//clearing the canvas
function canvas_clear(){
context.beginPath();
context.rect(0, 0, 700, 500);
context.fillStyle = "white";
context.fill();
}

//handling draw signal
socket.on('draw',function(data){
   drawLine(context,data.x1,data.y1,data.x2,data.y2,data.draw_color,data.draw_width);
})

//handling clear signal
socket.on('clear',function(){
  canvas_clear();
})

//handling color and size
let curr_color = 'black';
var red=document.getElementById('red');
    blue=document.getElementById('blue');
    brown=document.getElementById('brown');
    green=document.getElementById('green');
    yellow=document.getElementById('yellow');
    orange=document.getElementById('orange');
    violet=document.getElementById('violet');
    grey=document.getElementById('grey');
    black=document.getElementById('black');
    white=document.getElementById('white');
    slider = document.getElementById('myRange');
    clear_btn=document.getElementById('clear_btn');
let curr_width = 5;
clear_btn.addEventListener('click',function(){
  socket.emit('clear');
});
slider.oninput = function() {
 curr_width = this.value;
}
red.addEventListener('click',function(){
  curr_color='red';
});
blue.addEventListener('click',function(){
  curr_color='blue';
});
green.addEventListener('click',function(){
  curr_color='green';
});
yellow.addEventListener('click',function(){
  curr_color='yellow';
});
orange.addEventListener('click',function(){
  curr_color='orange';
});
brown.addEventListener('click',function(){
  curr_color='brown';
});
grey.addEventListener('click',function(){
  curr_color='grey';
});
violet.addEventListener('click',function(){
  curr_color='violet';
});
black.addEventListener('click',function(){
  curr_color='black';
});
white.addEventListener('click',function(){
  curr_color='white';
});

socket.on("leader_board",function(data){
  let leader_board = document.getElementById("leader_board");
  
  leader_board.style.backgroundColor = "white";
  leader_board.style.padding = "2px";
  leader_board.innerHTML = "<h2> LEADERBOARD </h2>";
  leader_board.innerHTML += "<p> Username => Scores </p>";
  for(let i=0;i<data.board.length;i++){
    leader_board.innerHTML += "<p>" + data.board[i][0] + " => " + data.board[i][1] + "</p>";
  }
})

//handling the end-game signal
socket.on('game_ended',function(data){
  let reg_wind = document.getElementById("register_window");
  let profile_wind = document.getElementById("user_prof");
  let create_room_wind = document.getElementById("create_room");
  let join_room_wind = document.getElementById("join_room");
  let name_disp = document.getElementById("name_display");
  let room_div = document.getElementById("room_list")
  let chat_div = document.getElementById("chat");
  let chat_box = document.getElementById("chat-box");
  let drawing_div = document.getElementById("drawing-board");
  let lobby_div = document.getElementById("lobby");
  let plr_list = document.getElementById("playerlist");
  let timer_div = document.getElementById("timer");
  let votekick_div = document.getElementById("votekick");
  votekick_div.style.display = "none";
  chat_div.style.display = "none";
  chat_box.style.display = "none";
  name_disp.innerText=username.value;
  reg_wind.style.display = "none";
  profile_wind.style.display = "none";
  create_room_wind.style.display = "none";
  join_room_wind.style.display = "none";
  room_div.style.display = "none";
  drawing_div.style.display = "none";
  palette_div.style.display = "none";
  lobby_div.style.display = "block";
  plr_list.style.display = "block";
  timer_div.style.display = "none"
  document.getElementById("headers").style.display = "block";
  chosen_word.style.display = "none";
  console.log(data.scores);
})