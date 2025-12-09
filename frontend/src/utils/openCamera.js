export default async function openCamera() {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    try {
      // Ask permission and open camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });

      // Create hidden video element
      const video = document.createElement("video");
      video.srcObject = stream;
      video.play();

      // Wait for camera to start
      await new Promise((res) => (video.onloadedmetadata = res));

      // Create a temporary fullscreen overlay
      const overlay = document.createElement("div");
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: black;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 9999;
      `;

      // Show video feed
      video.style.maxWidth = "100%";
      video.style.maxHeight = "80vh";
      overlay.appendChild(video);

      // Capture button
      const captureBtn = document.createElement("button");
      captureBtn.innerText = "Capture";
      captureBtn.style.cssText = `
        padding: 12px 22px;
        font-size: 18px;
        border-radius: 10px;
        background: #2563eb;
        color: white;
        border: none;
        margin-top: 20px;
      `;
      overlay.appendChild(captureBtn);

      document.body.appendChild(overlay);

      // When Capture is clicked
      captureBtn.onclick = () => {
        // Create a canvas to draw current frame
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0);

        // Turn canvas image into Blob/File
        canvas.toBlob((blob) => {
          const file = new File([blob], `camera-${Date.now()}.jpg`, {
            type: "image/jpeg",
          });

          // Clean up resources
          stream.getTracks().forEach((t) => t.stop());
          document.body.removeChild(overlay);

          resolve(file); // return captured image
        }, "image/jpeg");
      };
    } catch (err) {
      reject(err);
    }
  });
}
