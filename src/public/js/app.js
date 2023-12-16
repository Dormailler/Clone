const socket = io(); // back-end socket.io 와 연결

const welcome = document.querySelector("#welcome");
const room = document.querySelector("#room");
const form = document.querySelector("form");

room.hidden = true;

function backendDone(msg){
    console.log(`백엔드 응답: `,msg);
}

let roomName;

function addMessage(message){
    const ul = room.querySelector("ul");
    const li = document.createElement("li");
    li.innerText = message;
    ul.appendChild(li);
}

function showRoom(){
    welcome.hidden = true;
    room.hidden = false;
    const h3 = room.querySelector("h3");
    h3.innerText = `${roomName}`;
}

function handleRoomSubmit(event){
    event.preventDefault();
    const input = form.querySelector("input");
    socket.emit("enter_room",input.value,showRoom); // function은 마지막만 가능
    roomName = input.value;
    input.value = "";
}

form.addEventListener("submit",handleRoomSubmit);

socket.on("welcome", ()=>{
    addMessage("누군가 입장했습니다!")
});