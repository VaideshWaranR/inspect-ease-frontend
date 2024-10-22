import { useEffect, useRef, useState } from "react";

const Temp = () => {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const products = ['Leather', 'Tyre', 'Casting', 'Package'];
  const [defect, setDefect] = useState(false);
  const [pieces, setPieces] = useState(7);
  const [setImageBlob] = useState(null);
  const [badParts, setBadParts] = useState([]);

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
      setPieces(pieces + 1);
      console.log("Captured the image from the camera");
    }, 5000);

    return () => clearInterval(interval);
  }, [pieces]);

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
          setImageBlob(blob);
          setTimeout(() => sendImageToServer(blob), 10000); // Delay sending the image by 10 seconds
        });
      }
    }
  };

  const sendImageToServer = async (imageBlob) => {
    try {
      const formData = new FormData();
      formData.append("image", imageBlob);

      const response = await fetch("http://localhost:8000/classify", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setBadParts((prev) => [...prev, URL.createObjectURL(imageBlob)]);
      }
    } catch (error) {
      console.error("Error sending image to the server:", error);
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
                  Status: Normal
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
            className={`mt-6 bg-white border-8 ${!defect ? 'border-green-500' : 'border-red-500'} rounded-lg shadow-xl p-4 w-[50%] h-[450px] relative`}
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
              <button className="bg-green-600 text-white py-2 px-4 rounded-lg shadow-sm transition-transform hover:scale-105">
                Good
              </button>
              <button
                className="bg-red-500 text-white py-2 px-4 rounded-lg shadow-sm transition-transform hover:scale-105"
                onClick={() => setDefect(true)}
              >
                Defect
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-xl p-5 w-[50%] h-[450px] mt-[20px] flex flex-col justify-between">
            <div>
              <p className="text-xl flex items-center gap-2 font-mono text-gray-800">
                <div className="h-4 w-4 rounded-full bg-green-400"></div> Everything working correctly
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
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-4">Last Bad Parts</h2>
              <div className="flex gap-4">
                {badParts.map((part, index) => (
                  <div key={index} className="w-16 h-16">
                    <img
                      src={part}
                      alt={`bad part ${index + 1}`}
                      className="w-full h-full object-cover border border-black rounded-md"
                    />
                  </div>
                ))}
              </div>
              <button className="mt-4 bg-gray-100 border-2 border-black py-2 px-4 rounded-full">
                Review All
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Temp;
