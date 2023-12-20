const socket = io(); // back-end socket.io 와 연결

const myFace = document.querySelector("#myFace");
const muteBtn = document.querySelector("#mute");
const cameraBtn = document.querySelector("#camera");
const camerasSelect =  document.querySelector("#cameras");

const call = document.querySelector("#call");

call.hidden = true;

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;
let myDataChannel;

async function getCameras(){
    try{
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(device => device.kind === "videoinput");
        const currentCamera = myStream.getVideoTracks()[0];
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
        myStream = await navigator.mediaDevices.getUserMedia(
            deviceId? cameraConstraint : initialConstraint
        );
        myFace.srcObject = myStream;
        if(!deviceId){
            await getCameras();
        }
    }catch(e){
        console.log(e);
    }
}

function handleMuteClick(){
    myStream.getAudioTracks().forEach((track)=>{
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
    myStream.getVideoTracks().forEach((track)=>{
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
    if(myPeerConnection){
        const videoTrack = myStream.getVideoTracks()[0];
        const videoSender = myPeerConnection.getSenders().find(sender=>sender.track.kind === "video");
        videoSender.replaceTrack(videoTrack);
    }
}

muteBtn.addEventListener("click",handleMuteClick);
cameraBtn.addEventListener("click",handleCameraClick);
camerasSelect.addEventListener("input",handleCameraChange);

// 방 입장

const welcome = document.querySelector("#welcome");
welcomeForm = welcome.querySelector("form");

async function initCall(){
    welcome.hidden = true;
    call.hidden = false;
    await getMedia();
    makeConnection();
}

async function handleWelcomeSubmit(event){
    event.preventDefault();
    const input = welcomeForm.querySelector("input");
    await initCall();
    socket.emit("join_room",input.value);
    roomName = input.value;
    input.value = "";
}

welcomeForm.addEventListener("submit",handleWelcomeSubmit);

// 소켓 peer A

socket.on("welcome",async ()=>{
    myDataChannel = myPeerConnection.createDataChannel("chat");
    myDataChannel.addEventListener("message",(message)=>{console.log(message.data)});
    console.log("데이터 채널을 생성했습니다.");
    const offer = await myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription(offer);
    console.log("요청을 보냈습니다");
    socket.emit("offer",offer,roomName);
})

socket.on("offer",async (offer)=>{
    myPeerConnection.addEventListener("datachannel",(e)=>{
        myDataChannel = e.channel;
        myDataChannel.addEventListener("message",(message)=>{console.log(message.data)});
    });
    console.log("요청을 받았습니다");
    myPeerConnection.setRemoteDescription(offer);
    const answer = await myPeerConnection.createAnswer();
    myPeerConnection.setLocalDescription(answer);
    socket.emit("answer",answer, roomName);
    console.log("응답을 보냈습니다");
})

socket.on("answer", answer=>{
    console.log("응답을 받았습니다");
    myPeerConnection.setRemoteDescription(answer);
})

socket.on("ice", ice =>{
    console.log("참가자를 받았습니다.")
    myPeerConnection.addIceCandidate(ice);  
})
// RTC

function makeConnection(){
    myPeerConnection = new RTCPeerConnection({
        iceServers: [
            {
                urls: [
                    "stun:stun.l.google.com:19302"
                ]
            }
        ]
    });
    myPeerConnection.addEventListener("icecandidate",handleIce);
    myPeerConnection.addEventListener("addstream",handleAddStream);
    myStream.getTracks().forEach((track)=>myPeerConnection.addTrack(track, myStream));  
}

function handleIce(data){
    console.log("참가자를 보냈습니다.")
    socket.emit("ice",data.candidate, roomName);
}

function handleAddStream(data){
    const peerFace= document.getElementById("peersFace");
    peerFace.srcObject = data.stream;   
}