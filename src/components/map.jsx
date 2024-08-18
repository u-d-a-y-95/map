import { useState, useRef } from "react";
import { mapData2 } from "../data";

const MapBoard = () => {
  const svgRef = useRef(null);
  const mapContentRef = useRef(null);

  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(null);
  const [startY, setStartY] = useState(null);

  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0); // Track X translation
  const [translateY, setTranslateY] = useState(0); // Track Y translation
  const [hoveredPath, setHoveredPath] = useState(null);
  const [selectedPath, setSelectedPath] = useState(null);
  const [mouseDownTime, setMouseDownTime] = useState(0);

  const CLICK_THRESHOLD = 150; // Time threshold in milliseconds to differentiate between a click and a drag

  const handleMouseDown = (event) => {
    setStartX(event.clientX - translateX);
    setStartY(event.clientY - translateY);
    setMouseDownTime(Date.now());
    svgRef.current.style.cursor = "grabbing";
  };

  const handleMouseMove = (event) => {
    if (startX !== null && startY !== null) {
      if (Date.now() - mouseDownTime > CLICK_THRESHOLD) {
        if (!isDragging) {
          setIsDragging(true);
        }
        const newTranslateX = event.clientX - startX;
        const newTranslateY = event.clientY - startY;
        setTranslateX(newTranslateX);
        setTranslateY(newTranslateY);
        updateTransform(newTranslateX, newTranslateY, scale);
      }
    }
  };

  const handleMouseUp = (event, path) => {
    if (Date.now() - mouseDownTime <= CLICK_THRESHOLD && !isDragging && path) {
      handlePathClick(event, selectedPath);
    }
    setIsDragging(false);
    setStartX(null);
    setStartY(null);
    svgRef.current.style.cursor = "grab";
  };

  const handlePathClick = (event, pathId) => {
    if (
      Date.now() - mouseDownTime <= CLICK_THRESHOLD &&
      !isDragging &&
      pathId
    ) {
      zoomToPath(event, pathId);
    }
  };

  const zoomToPath = (event, pathId) => {
    const pathElement = event.target;
    const bbox = pathElement.getBBox();

    const svgWidth = svgRef.current.clientWidth;
    const svgHeight = svgRef.current.clientHeight;

    const maxScale = 10; // Lower maximum zoom level
    const padding = 20; // Padding around the path
    const pathWidth = bbox.width;
    const pathHeight = bbox.height;

    const scaleX = (svgWidth - padding * 2) / pathWidth;
    const scaleY = (svgHeight - padding * 2) / pathHeight;

    const newScale = Math.min(scaleX, scaleY, maxScale);

    const newTranslateX = svgWidth / 2 - (bbox.x + bbox.width / 2) * newScale;
    const newTranslateY = svgHeight / 2 - (bbox.y + bbox.height / 2) * newScale;

    smoothTransform(newTranslateX, newTranslateY, newScale);
    setSelectedPath(pathId); // Set the selected path ID
  };

  const smoothTransform = (x, y, scale) => {
    if (mapContentRef.current) {
      mapContentRef.current.style.transition = "transform 0.3s ease";
      mapContentRef.current.setAttribute(
        "transform",
        `translate(${x}, ${y}) scale(${scale})`
      );
      setTranslateX(x); // Update the translation state
      setTranslateY(y); // Update the translation state
      setScale(scale); // Update the scale state
    }
  };

  const updateTransform = (x, y, scale) => {
    if (mapContentRef.current) {
      mapContentRef.current.style.transition = "none"; // Disable transition during drag
      mapContentRef.current.setAttribute(
        "transform",
        `translate(${x}, ${y}) scale(${scale})`
      );
    }
  };

  const handleReset = () => {
    const initialX = 0;
    const initialY = 0;
    const initialScale = 1;

    setTranslateX(initialX);
    setTranslateY(initialY);
    setScale(initialScale);
    smoothTransform(initialX, initialY, initialScale);
    setSelectedPath(null); // Clear selected path on reset
  };

  const handleMouseEnter = (pathId) => {
    setHoveredPath(pathId);
  };

  const handleMouseLeave = () => {
    setHoveredPath(null);
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <svg
        ref={svgRef}
        width="800"
        height="500"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={(e) => handleMouseUp(e, null)}
        onMouseLeave={handleMouseUp}
        style={{
          background: "#303030",
          border: "1px solid #ccc",
          cursor: isDragging ? "grabbing" : "grab",
        }}
      >
        <g ref={mapContentRef}>
          {mapData2.map((group, index) => (
            <g key={index} className="grp">
              {group.paths.map((path, pathIndex) => (
                <path
                  key={pathIndex}
                  d={path.d}
                  fill={
                    selectedPath === path.id
                      ? "red"
                      : hoveredPath === path.id
                      ? "#FFD700"
                      : group.color
                  }
                  onClick={(event) => {
                    handlePathClick(event, path.id);
                  }}
                  onMouseEnter={() => handleMouseEnter(path.id)}
                  onMouseLeave={handleMouseLeave}
                />
              ))}
            </g>
          ))}
        </g>
      </svg>
      <button
        onClick={handleReset}
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          padding: "5px 10px",
          background: "#007bff",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        Reset Zoom
      </button>
    </div>
  );
};

export default MapBoard;
