const video = document.getElementById("vid");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const startButton = document.getElementById("startBtn");
const stopButton = document.getElementById("stopBtn");
const syncButton = document.getElementById("syncBtn");

const angles = document.getElementById("angles");

const recordBtn = document.getElementById("recordBtn");
const stopRecBtn = document.getElementById("stopRecBtn");

const videoContainer = document.getElementById("video-container");

const heading = document.getElementById("heading");
const howToUse = document.getElementById("howToUse");

const cameraSelect = document.getElementById("cameraSelect");

let targetRotation = 0;
let smoothRotation = 0;

let previousAlpha = null;
let continuousAngle = 0;

let stream;
let mediaRecorder;
let chunks = [];

let rotationAngle = 0;
let drawRequestId;

let currentAlpha = 0;
let alphaOffset = 0;

let selectedCameraId = "";
let cameras = [];
let isFrontCamera = true;

const loadCameras = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();

    cameras = devices.filter(
        device => device.kind === "videoinput"
    );

    cameraSelect.innerHTML = "";

    cameras.forEach((camera, index) => {
        const option = document.createElement("option");
        option.value = camera.deviceId;
        option.textContent = camera.label || `Camera ${index + 1}`;
        cameraSelect.appendChild(option);
    });

    if (cameras.length > 0) {
        selectedCameraId = cameras[0].deviceId;
        detectCameraType(selectedCameraId);
    }
};

const detectCameraType = (deviceId) => {
    const cam = cameras.find(c => c.deviceId === deviceId);

    if (!cam) {
        isFrontCamera = true;
        return;
    }

    const label = cam.label.toLowerCase();

    isFrontCamera =
        label.includes("front") ||
        label.includes("user") ||
        label.includes("face") ||
        label.includes("webcam");
};

const startVideo = async () => {
    try {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        stream = await navigator.mediaDevices.getUserMedia(
            {
                video: {
                    deviceId: selectedCameraId
                        ? { exact: selectedCameraId }
                        : undefined,
                    width: { ideal: 1440 },
                    height: { ideal: 1080 }
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
        syncButton.style.display = "block";
        heading.style.display = "none";
        howToUse.style.display = "none"

        if (drawRequestId) cancelAnimationFrame(drawRequestId);
        drawCanvas();
    }
    catch (err) {
        console.log(err);
    }
}

const drawCanvas = () => {
    if (video.readyState >= video.HAVE_CURRENT_DATA && canvas.width > 0 && canvas.height > 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const w = canvas.width;
        const h = canvas.height;
        const scale = 1.65;
        let diff = targetRotation - smoothRotation;

        if (diff > Math.PI) diff -= Math.PI * 2;
        if (diff < -Math.PI) diff += Math.PI * 2;

        smoothRotation += diff * 0.5;
        ctx.save();
        ctx.translate(w / 2, h / 2);
        if (isFrontCamera) {
            ctx.rotate(smoothRotation);
        } else {
            ctx.rotate(-smoothRotation);
        }
        ctx.scale(scale, scale);
        ctx.drawImage(video, -w / 2, -h / 2, w, h);
        ctx.restore();
    }

    drawRequestId = requestAnimationFrame(drawCanvas);
};

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
    syncButton.style.display = "none";
    heading.style.display = "block";
    howToUse.style.display = "block"
}

const alphaFunction = (event) => {
    if (event.alpha === null) return;
    currentAlpha = event.alpha;
    let adjustedAlpha = (currentAlpha - alphaOffset + 360) % 360;

    if (previousAlpha === null) {
        previousAlpha = adjustedAlpha;
    }

    let delta = adjustedAlpha - previousAlpha;

    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;

    continuousAngle += delta;
    previousAlpha = adjustedAlpha;

    targetRotation = continuousAngle * Math.PI / 180;
    angles.innerHTML = `Alpha: ${adjustedAlpha.toFixed(0)}`;
};

startButton.addEventListener("click", async () => {
    try {
        if (
            typeof DeviceOrientationEvent !== "undefined" &&
            typeof DeviceOrientationEvent.requestPermission === "function"
        ) {
            const permission = await DeviceOrientationEvent.requestPermission();

            if (permission !== "granted") {
                alert("Motion permission denied");
                return;
            }
        }

        await loadCameras();
        await startVideo();

        window.removeEventListener("deviceorientation", alphaFunction);
        window.addEventListener("deviceorientation", alphaFunction);

        cameraSelect.style.display = "block";
    } catch (err) {
        console.log(err);
        alert("Permission failed");
    }
});

stopButton.addEventListener("click", async () => {
    await stopVideo();
    window.removeEventListener("deviceorientation", alphaFunction);
    angles.innerHTML = "";
    cameraSelect.style.display = "none";
})

syncButton.addEventListener("click", () => {
    alphaOffset = currentAlpha;
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

cameraSelect.addEventListener("change", async () => {
    selectedCameraId = cameraSelect.value;
    detectCameraType(selectedCameraId);
    await startVideo();
});