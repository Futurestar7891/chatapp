import { useContext } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faImage,
  faVideo,
  faCamera,
  faAddressBook,
  faFile,
  faMicrophone,
} from "@fortawesome/free-solid-svg-icons";
import { StateContext } from "../../main";
import "../../Css/AttachmentPopup.css";

const AttachmentPopup = () => {
  const { setSelectedFiles, setShowAttachmentPopup, setShowPreviewPopup } =
    useContext(StateContext);

  const handleFileSelect = (type) => {
    if (type === "camera") {
      openCamera();
    } else {
      const input = document.createElement("input");
      input.type = "file";
      input.multiple = true;
      input.accept =
        type === "photo"
          ? "image/*"
          : type === "video"
          ? "video/*"
          : type === "audio"
          ? "audio/*"
          : type === "document"
          ? ".pdf,.doc,.docx"
          : type === "contact"
          ? ""
          : "*";

      input.onchange = async (e) => {
        const files = Array.from(e.target.files);
        const filePromises = files.map((file) => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64Data = reader.result.split(",")[1];
              resolve({
                name: file.name,
                type: file.type,
                data: base64Data,
              });
            };
            reader.readAsDataURL(file);
          });
        });

        const fileData = await Promise.all(filePromises);
        setSelectedFiles(fileData);
        setShowAttachmentPopup(false);
        setShowPreviewPopup(true);
      };

      input.click();
    }
  };

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement("video");
      video.srcObject = stream;
      video.autoplay = true;

      const cameraContainer = document.createElement("div");
      cameraContainer.style.position = "fixed";
      cameraContainer.style.top = "0";
      cameraContainer.style.left = "0";
      cameraContainer.style.width = "100%";
      cameraContainer.style.height = "100%";
      cameraContainer.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
      cameraContainer.style.display = "flex";
      cameraContainer.style.flexDirection = "column";
      cameraContainer.style.alignItems = "center";
      cameraContainer.style.justifyContent = "center";
      cameraContainer.style.zIndex = "1000";

      cameraContainer.appendChild(video);

      const captureButton = document.createElement("button");
      captureButton.innerText = "Capture Photo";
      captureButton.style.marginTop = "20px";
      captureButton.style.padding = "10px 20px";
      captureButton.style.backgroundColor = "#3498db";
      captureButton.style.color = "white";
      captureButton.style.border = "none";
      captureButton.style.borderRadius = "5px";
      captureButton.style.cursor = "pointer";

      captureButton.onclick = () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext("2d");
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const base64Data = canvas.toDataURL("image/png");
        const photoData = {
          name: "photo.png",
          type: "image/png",
          data: base64Data.split(",")[1],
        };

        setSelectedFiles([photoData]);
        stream.getTracks().forEach((track) => track.stop());
        document.body.removeChild(cameraContainer);
        setShowAttachmentPopup(false);
        setShowPreviewPopup(true);
      };

      cameraContainer.appendChild(captureButton);
      document.body.appendChild(cameraContainer);
    } catch (error) {
      console.error("Error accessing the camera:", error);
      alert(
        "Unable to access the camera. Please ensure you have granted permission."
      );
    }
  };

  return (
    <div className="AttachmentPopupmaindiv">
      <FontAwesomeIcon
        className="fileicons"
        icon={faImage}
        onClick={() => handleFileSelect("photo")}
      />
      <FontAwesomeIcon
        className="fileicons"
        icon={faVideo}
        onClick={() => handleFileSelect("video")}
      />
      <FontAwesomeIcon
        className="fileicons"
        icon={faMicrophone}
        onClick={() => handleFileSelect("audio")}
      />
      <FontAwesomeIcon
        className="fileicons"
        icon={faCamera}
        onClick={() => handleFileSelect("camera")}
      />
      <FontAwesomeIcon
        className="fileicons"
        icon={faAddressBook}
        onClick={() => handleFileSelect("contact")}
      />
      <FontAwesomeIcon
        className="fileicons"
        icon={faFile}
        onClick={() => handleFileSelect("document")}
      />
    </div>
  );
};

export default AttachmentPopup;
