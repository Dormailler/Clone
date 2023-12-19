const socket = io(); // back-end socket.io 와 연결

const myFace = document.querySelector("#myFace");
const muteBtn = document.querySelector("#mute");
const cameraBtn = document.querySelector("#camera");
const camerasSelect =  document.querySelector("#cameras");

const call = document.querySelector("#call");

call.hidden = true;

let mySteam;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;

async function getCameras(){
    try{
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(device => device.kind === "videoinput");
        const currentCamera = mySteam.getVideoTracks()[0];
        cameras.forEach(camera=>{
            const option = document.createElement("option");
            option.value = camera.deviceId;
            option.innerText = camera.label;
            if(currentCamera.label == camera.label){
                option.selected = true;
            }
            camerasSelect.appendChild(option);
        })
    }catch(e){
        console.log(e);
    }
}   
async function getMedia(deviceId){
    const initialConstraint = {
        audio:true,
        video:{facingMode: "user"},
    }
    const cameraConstraint = {
        audio:true,
        video:{deviceId:{exact: deviceId}}
    }
    try{
        mySteam = await navigator.mediaDevices.getUserMedia(
            deviceId? cameraConstraint : initialConstraint
        );
        myFace.srcObject = mySteam;
        if(!deviceId){
            await getCameras();
        }
    }catch(e){
        console.log(e);
    }
}

function handleMuteClick(){
    mySteam.getAudioTracks().forEach((track)=>{
        track.enabled = !track.enabled;
    })
    if(!muted){
        muteBtn.innerText = "음소거 해제";
        muted = true;
    } else{
        muteBtn.innerText = "음소거"
        muted = false;
    }
}
function handleCameraClick(){
    mySteam.getVideoTracks().forEach((track)=>{
        track.enabled = !track.enabled;
    })
    if(cameraOff){
        cameraBtn.innerText = "카메라 끄기";
        cameraOff = false;
    } else{
        cameraBtn.innerText = "카메라 켜기";
        cameraOff = true;
    }
}

async function handleCameraChange(){
    await getMedia(camerasSelect.value);
}

muteBtn.addEventListener("click",handleMuteClick);
cameraBtn.addEventListener("click",handleCameraClick);
camerasSelect.addEventListener("input",handleCameraChange);

// 방 입장

const welcome = document.querySelector("#welcome");
welcomeForm = welcome.querySelector("form");

async function startMedia(){
    welcome.hidden = true;
    call.hidden = false;
    await getMedia();
    makeConnection();
}

function handleWelcomeSubmit(event){
    event.preventDefault();
    const input = welcomeForm.querySelector("input");
    socket.emit("join_room",input.value, startMedia);
    roomName = input.value;
    input.value = "";
}

welcomeForm.addEventListener("submit",handleWelcomeSubmit);

// 소켓 peer A

socket.on("welcome",async ()=>{
    const offer = await myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription(offer);
    console.log("offer를 보냈습니다");
    socket.emit("offer",offer,roomName);
})

socket.on("offer",offer=>{
    console.log(offer);
})

// RTC

function makeConnection(){
    myPeerConnection = new RTCPeerConnection();
    mySteam.getTracks().forEach(track=>myPeerConnection.addTrack(track, mySteam));    
}