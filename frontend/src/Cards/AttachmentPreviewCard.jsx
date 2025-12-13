
import { FileText } from "lucide-react";
import Styles from "../Modules/AttachmentPreviewCard.module.css";

function AttachmentPreviewCard({
  selectedFiles,
  setSelectedFiles,
  activeIndex,
  setActiveIndex,
}) {
  const removeFile = (index) => {
    setSelectedFiles((prev) => {
      const updated = prev.filter((_, i) => i !== index);

      // fix active preview
      if (index === activeIndex) setActiveIndex(activeIndex);
      else if (index < activeIndex) setActiveIndex(activeIndex - 1);

      return updated;
    });
  };

  const file = selectedFiles[activeIndex];

  const renderMainPreview = () => {
    if (!file) return null;

    if (file.type.startsWith("image")) {
      return (
        <img
          src={URL.createObjectURL(file)}
          className={Styles.MainPreviewImage}
        />
      );
    }

    if (file.type.startsWith("video")) {
      return (
        <video
          controls
          className={Styles.MainPreviewVideo}
          src={URL.createObjectURL(file)}
        />
      );
    }

    return (
      <div className={Styles.MainDocumentBox}>
        <FileText size={40} />
        <p>{file.name}</p>
      </div>
    );
  };

  return (
    <div className={Styles.PreviewPanel}>
      {/* ⭐ LARGE PREVIEW */}
      <div className={Styles.MainPreviewWrapper}>{renderMainPreview()}</div>

      {/* ⭐ THUMBNAIL STRIP */}
      <div className={Styles.ThumbnailStrip}>
        {selectedFiles.map((file, idx) => (
          <div
            key={idx}
            className={`${Styles.ThumbnailItem} ${
              idx === activeIndex ? Styles.ActiveThumb : ""
            }`}
          >
            {file.type.startsWith("image") ? (
              <img
                src={URL.createObjectURL(file)}
                className={Styles.ThumbnailImage}
                onClick={() => setActiveIndex(idx)}
              />
            ) : (
              <div
                className={Styles.ThumbDoc}
                onClick={() => setActiveIndex(idx)}
              >
                <FileText size={20} />
              </div>
            )}

            <button
              className={Styles.ThumbRemove}
              onClick={() => removeFile(idx)}
            >
              ✖
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AttachmentPreviewCard;
