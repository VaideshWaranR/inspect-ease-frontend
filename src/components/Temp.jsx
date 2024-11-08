import { useEffect, useRef, useState } from "react";

const Temp = () => {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const products = ["Leather", "Tyre", "Casting", "Package"];
  const [defect, setDefect] = useState(false);
  const [pieces, setPieces] = useState(7);
  const [defectiveImageBase64, setDefectiveImageBase64] = useState(null);
  const [defectiveImageBlob, setDefectiveImageBlob] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false); // New state for analysis

  const handlePause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  useEffect(() => {
    async function getCameraStream() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
      }
    }
    getCameraStream();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      captureImageFromCamera();
      setPieces((prevPieces) => prevPieces + 1);
      console.log("Captured the image from the camera");
    }, 15000);

    return () => clearInterval(interval);
  }, [defectiveImageBlob]);

  const playCameraStream = () => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  const captureImageFromCamera = () => {
    if (canvasRef.current && videoRef.current) {
      const context = canvasRef.current.getContext("2d");
      const { videoWidth, videoHeight } = videoRef.current;

      if (videoWidth && videoHeight) {
        canvasRef.current.width = videoWidth;
        canvasRef.current.height = videoHeight;

        context.drawImage(videoRef.current, 0, 0, videoWidth, videoHeight);
        canvasRef.current.toBlob((blob) => {
          setDefectiveImageBlob(blob);
          if (blob) {
            sendImageToServer(blob); // Send the image right after capturing it
          }
        }, "image/jpeg");
      }
    }
  };

  const sendImageToServer = async (imageBlob) => {
    setIsAnalyzing(true); // Start analysis state
    const maxRetries = 3;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const formData = new FormData();
        formData.append("file", imageBlob);
        setDefectiveImageBlob(imageBlob);
        const response = await fetch("http://127.0.0.1:8000/predict", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Error in response");
        }

        const data = await response.json();
        if (data.label) {
          console.log(data);
          console.log("Prediction:", data.label);

          if (data.label === "GOOD") {
            setDefect(false); // or any logic related to non-defective
          } else {
            setDefect(true);
            setDefectiveImageBase64(data.bbox_image);
          }
        }
        break; // Break out of the loop if successful
      } catch (error) {
        console.error(
          `Error sending image to the server (attempt ${attempt + 1}):`,
          error
        );
        if (attempt === maxRetries - 1) {
          alert("Failed to send image after multiple attempts.");
        }
      }
    }
    setIsAnalyzing(false); // End analysis state
  };

  useEffect(() => {
    if (defectiveImageBase64) {
      const base64ToBlob = (base64, mimeType) => {
        const byteCharacters = atob(base64);
        const byteArrays = [];

        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
          const slice = byteCharacters.slice(offset, offset + 512);
          const byteNumbers = new Array(slice.length);

          for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
          }

          const byteArray = new Uint8Array(byteNumbers);
          byteArrays.push(byteArray);
        }

        return new Blob(byteArrays, { type: mimeType });
      };

      const displayImageFromBase64 = (base64Image) => {
        const b = base64ToBlob(base64Image, "image/jpeg");
        return URL.createObjectURL(b);
      };

      const url = displayImageFromBase64(defectiveImageBase64);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [defectiveImageBase64]);

  // Function to handle image upload
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result);
        const blob = new Blob([new Uint8Array(reader.result), { type: file.type }]);
        sendImageToServer(blob); // Send the uploaded image to the server
      };
      reader.readAsArrayBuffer(file); // Read the file as an ArrayBuffer
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 p-6">
      <div className="bg-gray-100 w-[20%] p-4 h-[350px] mt-[110px] rounded-xl shadow-lg">
        <ul className="flex flex-col justify-around w-full h-[100%] gap-6">
          {products.map((p, ind) => (
            <li
              key={ind}
              className="text-black hover:bg-blue-600 hover:text-white border border-gray-200 bg-white shadow-md py-3 px-4 rounded-lg flex items-center justify-between transition-colors duration-300"
            >
              <div className="text-sm">
                <p className="font-semibold">{p}</p>
                <p className="text-xs bg-green-500 rounded-md px-1 text-white">
                  Selected
                </p>
              </div>
              <i className="ml-4 text-2xl ri-arrow-right-s-line"></i>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold mb-4 text-gray-800">
              Automated Defect Detection
            </h1>
            <div className="flex gap-4">
              <button
                className="bg-red-600 hover:bg-red-500 text-white py-2 px-6 rounded-md transition-all"
                onClick={handlePause}
              >
                Stop Session
              </button>
              <button
                className="bg-gray-300 text-gray-800 py-2 px-6 rounded-md hover:bg-gray-400 transition-all"
                onClick={() => videoRef.current.play()}
              >
                Reset
              </button>
            </div>
          </div>
          <button className="hover:border-2 hover:border-black py-2 px-6 rounded-md bg-gray-200 transition-all">
            Edit Configuration
          </button>
        </div>
        <div className="flex gap-6">
          <div
            className={`mt-6 bg-white border-8 ${
              !defect ? "border-green-500" : "border-red-500"
            } rounded-lg shadow-xl p-4 w-[50%] h-[450px] relative`}
          >
            <video
              ref={videoRef}
              onCanPlay={playCameraStream}
              id="video"
              autoPlay
              className="w-full h-full object-cover rounded-lg"
            />
            <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
            <div className="flex absolute bottom-[-30px] left-[50%] transform -translate-x-[50%] gap-4">
              {!defect && (
                <button className="bg-green-600 text-white py-2 px-4 rounded-lg shadow-sm transition-transform hover:scale-105">
                  Good
                </button>
              )}
              {defect && (
                <button
                  className="bg-red-500 text-white py-2 px-4 rounded-lg shadow-sm transition-transform hover:scale-105"
                  onClick={() => setDefect(true)}
                >
                  Defect
                </button>
              )}
              {isAnalyzing && (
                <div className="flex items-center justify-center">
                  <div className="animate-spin h-6 w-6 border-4 border-t-transparent border-blue-500 rounded-full"></div>
                  <span className="ml-2 text-gray-600">Analyzing...</span>
                </div>
              )}
            </div>
          </div>
          <div className="w-[50%]">
             {!defectiveImageBase64 && (<div className="mt-[22px]">
              <p className="text-xl flex items-center gap-2 font-mono text-gray-800">
                <div className="h-4 w-4 rounded-full bg-green-400"></div>{" "}
                Everything working correctly
              </p>
              <div className="mt-6">
                <div className="flex items-end">
                  <p className="text-6xl font-bold">50</p>
                  <p className="ml-2 text-3xl text-gray-400">/ pieces-min</p>
                </div>
                <hr className="w-[50%] mt-1"></hr>
                <p className="text-gray-800 ml-3">{pieces} Scanned</p>
              </div>
              <div className="mt-6">
                <p className="text-5xl font-bold">1%</p>
                <hr className="w-[50%] mt-1"></hr>
                <p className="text-gray-800 ml-2">Bad pieces (28)</p>
              </div>
            </div>)}
            {defectiveImageBase64 && (
              <div className="relative mt-10">
                <img
                  src={imageUrl}
                  alt="Defective item"
                  className="object-cover w-full h-full rounded-lg border border-gray-300 shadow-lg"
                />
                <div className="absolute bottom-2 right-2 bg-red-600 text-white text-xs py-1 px-2 rounded">
                  Defective
                </div>
              </div>
            )}
            {!defectiveImageBase64 && (
              <div className="mt-[25px]">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="mb-4 border border-gray-300 p-2 rounded"
                />
                <button
                  onClick={captureImageFromCamera}
                  className="bg-blue-600 text-white py-2 px-4 rounded"
                >
                  Capture Image
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Temp;

