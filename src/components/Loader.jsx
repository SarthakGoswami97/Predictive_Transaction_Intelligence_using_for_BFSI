import React from "react";
import { ClipLoader, BeatLoader, PulseLoader } from "react-spinners";
import "./Loader.css";

/**
 * Reusable Loader Component
 * Types: "clip" (default), "beat", "pulse"
 * Sizes: "small", "medium", "large"
 */
function Loader({ 
  type = "clip", 
  size = "medium", 
  color = "#1a73e8", 
  text = "Loading...",
  fullScreen = false,
  overlay = false 
}) {
  const sizeMap = {
    small: { clip: 20, beat: 8, pulse: 8 },
    medium: { clip: 35, beat: 12, pulse: 12 },
    large: { clip: 50, beat: 16, pulse: 16 },
  };

  const spinnerSize = sizeMap[size]?.[type] || sizeMap.medium[type];

  const renderSpinner = () => {
    switch (type) {
      case "beat":
        return <BeatLoader color={color} size={spinnerSize} />;
      case "pulse":
        return <PulseLoader color={color} size={spinnerSize} />;
      default:
        return <ClipLoader color={color} size={spinnerSize} />;
    }
  };

  if (fullScreen) {
    return (
      <div className="loader-fullscreen">
        <div className="loader-content">
          {renderSpinner()}
          {text && <p className="loader-text">{text}</p>}
        </div>
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="loader-overlay">
        <div className="loader-content">
          {renderSpinner()}
          {text && <p className="loader-text">{text}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="loader-inline">
      {renderSpinner()}
      {text && <span className="loader-text-inline">{text}</span>}
    </div>
  );
}

export default Loader;
