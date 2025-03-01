import React, { useState, useRef, useEffect } from "react";

const RecordeAudio = ({ onRecordingComplete, setShowAudioRecorder }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    startRecording();

    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream
          .getTracks()
          .forEach((track) => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        setAudioBlob(audioBlob);
        setIsRecording(false);
        onRecordingComplete(audioBlob);
        audioChunksRef.current = [];
        mediaRecorderRef.current.stream
          .getTracks()
          .forEach((track) => track.stop());
        clearInterval(timerRef.current);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setShowAudioRecorder(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  const handleRemove = () => {
    setAudioBlob(null);
    setShowAudioRecorder(false);
    onRecordingComplete(null);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="audio-recorder-container">
      {isRecording ? (
        <div className="recording-ui">
          <div className="recording-indicator">
            <span className="pulse-dot"></span>
            <span>Recording...</span>
          </div>
          <div className="recording-timer">{formatTime(recordingTime)}</div>
          <button className="record-button" onClick={stopRecording}>
            ⏹ Stop
          </button>
        </div>
      ) : audioBlob ? (
        <div className="audio-preview">
          <p className="remove-btn" onClick={handleRemove}>
            X
          </p>
          <audio controls src={URL.createObjectURL(audioBlob)} />
        </div>
      ) : null}
    </div>
  );
};

export default RecordeAudio;
