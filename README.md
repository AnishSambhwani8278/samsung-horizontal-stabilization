# Horizontal Camera Stabilization - Samsung S26 Ultra Stabilization Simulation

This project is a simple web-based application that simulates the **Horizon Leveling / Horizontal Stabilization** video feature found in Samsung S26 Ultra. 

## How it Works

The application achieves this stabilization effect using a combination of standard web APIs:
1. **Camera Access:** Uses `getUserMedia` to capture the raw video feed from the device's front or back camera.
2. **Sensor Data:** Listens to the `deviceorientation` event to pull real-time data from the device's hardware sensors (accelerometer and gyroscope). This tracks the exact rotation angle of the device.
3. **Canvas Counter-Rotation:** Instead of showing the raw video, the frames are painted onto an HTML5 `<canvas>`. For every single frame, the canvas is rotated in the *exact opposite direction* of the physical device's rotation.
4. **Recording:** Using the `MediaRecorder` API, the application captures the already-stabilized visual output directly from the rotated canvas, creating a video where the horizon appears perfectly locked in place.

## Requirements & Limitations

- **Hardware Sensors constraint:** This project **only works on devices with built-in orientation sensors mainly Accelerometer and Gyroscope** (mobile phones and tablets). It will not function on a standard desktop monitor without sensors.
- **Orientation constraint:** For the math and stabilization to work correctly, the device **must be kept horizontally** (landscape mode) while recording.
- **Secure Context:** Modern browsers require the site to be served over a secure origin (HTTPS or `localhost`) to access the camera and orientation sensors.

## Usage

1. Host the files (`index.html`, `script.js`, `styles.css`) on a standard web server or view them via `localhost`.
2. Open the app on a mobile device and place it horizontally.
3. Click **Start** and allow camera/sensor permissions when prompted by your browser.
4. You will see the stabilized video preview. Rotate your device to test the horizon lock!
5. Click **Start Recording** to save the stabilized output, and **Stop Recording** to automatically download the result.
