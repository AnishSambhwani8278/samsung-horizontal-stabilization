const video = document.getElementById("vid");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const startButton = document.getElementById("startBtn");
const stopButton = document.getElementById("stopBtn");

const angles = document.getElementById("angles");

const recordBtn = document.getElementById("recordBtn");
const stopRecBtn = document.getElementById("stopRecBtn");

let stream;
let mediaRecorder;
let chunks = [];

let rotationAngle = 0;
let drawRequestId;

const startVideo = async () => {
    try {
        stream = await navigator.mediaDevices.getUserMedia(
            {
                video: {
                    facingMode: "user",
                    width: {
                        ideal: 1280
                    },
                    height: {
                        ideal: 720
                    }
                },
                audio: false
            });
        
        video.srcObject = stream;
        
        video.onloadedmetadata = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        };

        canvas.style.display = "block";
        startButton.style.display = "none";
        stopButton.style.display = "block";
        recordBtn.style.display = "block";
        
        drawCanvas();
    }
    catch (err) {
        console.log(err);
    }
}

const drawCanvas = () => {
    if (video.readyState >= video.HAVE_CURRENT_DATA && canvas.width > 0 && canvas.height > 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(rotationAngle);
        ctx.drawImage(video, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
        ctx.restore();
    }
    drawRequestId = requestAnimationFrame(drawCanvas);
}

const stopVideo = () => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    if (drawRequestId) {
        cancelAnimationFrame(drawRequestId);
    }
    video.srcObject = null;
    canvas.style.display = "none";
    startButton.style.display = "block";
    stopButton.style.display = "none";
    recordBtn.style.display = "none";
    stopRecBtn.style.display = "none";
}

window.addEventListener("deviceorientation", (event) => {
    if (event.alpha === null) return;
    const alpha = event.alpha.toFixed(0);
    angles.innerHTML = `Alpha: ${alpha}`;
    rotationAngle = alpha * (Math.PI / 180);
});

const startRecording = () => {
    const canvasStream = canvas.captureStream(30);
    try {
        mediaRecorder = new MediaRecorder(canvasStream, { mimeType: "video/mp4" });
    } catch (e) {
        mediaRecorder = new MediaRecorder(canvasStream, { mimeType: "video/webm" });
    }
    
    mediaRecorder.start();
    mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
            chunks.push(event.data);
        }
    }
}

const stopRecording = () => {
    mediaRecorder.stop();
    
    mediaRecorder.onstop = () => {
        const type = mediaRecorder.mimeType || "video/mp4";
        const blob = new Blob(chunks, { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const ext = type.includes("webm") ? "webm" : "mp4";
        a.download = `video.${ext}`;
        a.click();
        chunks = [];
    }
}

recordBtn.addEventListener("click", () => {
    recordBtn.style.display = "none";
    stopRecBtn.style.display = "block";
    startRecording();
});

stopRecBtn.addEventListener("click", () => {
    recordBtn.style.display = "block";
    stopRecBtn.style.display = "none";
    stopRecording();
});