import { useContext } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileAudio,
  faFilePdf,
  faFileWord,
  faFileAlt,
} from "@fortawesome/free-solid-svg-icons";
import { StateContext } from "../main";

const PreviewPopup = () => {
  const {
    selectedFiles,
    setSelectedFiles,
    setShowPreviewPopup,
    showPreviewPopup,
  } = useContext(StateContext);

  const removefile = (index) => {
    setSelectedFiles(selectedFiles.filter((file, i) => i !== index));
    if (selectedFiles.length === 1) {
      setShowPreviewPopup(!showPreviewPopup);
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith("audio/")) return faFileAudio;
    if (fileType === "application/pdf") return faFilePdf;
    if (
      fileType === "application/msword" ||
      fileType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )
      return faFileWord;
    return faFileAlt;
  };

  const handleOpen = (base64Data) => {
    const newWindow = window.open();
    newWindow.document.write(`
      <html>
        <body style="margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh;">
          <iframe src="${base64Data}" style="width: 100%; height: 100%; border: none;"></iframe>
        </body>
      </html>
    `);
  };

  return (
    <div className="PreviewPopupmaindiv">
      {selectedFiles &&
        selectedFiles.length > 0 &&
        selectedFiles.map((file, index) => {
          const base64Data = `data:${file.type};base64,${file.data}`;

          return (
            <div className="previewindividual" key={index}>
              <p className="remove-btn" onClick={() => removefile(index)}>
                X
              </p>
              {file.type.startsWith("image/") ? (
                <img src={base64Data} alt={`Selected ${index}`} />
              ) : file.type.startsWith("video/") ? (
                <video controls src={base64Data} />
              ) : file.type.startsWith("audio/") ? (
                <audio controls src={base64Data} />
              ) : file.type === "application/pdf" ||
                file.type === "application/msword" ||
                file.type ===
                  "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ? (
                <div className="document-preview">
                  <div className="document-thumbnail">
                    <FontAwesomeIcon
                      icon={getFileIcon(file.type)}
                      size="3x"
                      className="document-icon"
                    />
                    <p className="document-name">{file.name}</p>
                  </div>
                  <div className="document-actions">
                    <button
                      className="action-btn save-btn"
                      onClick={() => {
                        const link = document.createElement("a");
                        link.href = base64Data;
                        link.download = file.name;
                        link.click();
                      }}
                    >
                      Save
                    </button>
                    <button
                      className="action-btn open-btn"
                      onClick={() => handleOpen(base64Data)}
                    >
                      Open
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <FontAwesomeIcon icon={getFileIcon(file.type)} size="2x" />
                  <p>{file.name}</p>
                  <p>Preview not available</p>
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
};

export default PreviewPopup;
