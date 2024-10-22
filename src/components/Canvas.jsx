import { useEffect, useRef, useState } from "react";

const Canvas = () => {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const products=['Leather','Tyre','Casting','Package']
  // State to store the image blob
  const [imageBlob, setImageBlob] = useState(null);

  useEffect(() => {
    // Access the camera stream
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
      console.log("Captured the image from the camera");
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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
          setImageBlob(blob); // Save the blob in state
        });
      }
    }
  };

  return (
    <div className="container mx-auto p-6 flex flex-col items-center gap-10 mt-10">
      <h1 className="text-3xl font-semibold text-gray-800">Camera Feed</h1>

      {/* Video Feed */}
      <div className="relative w-full max-w-lg">
        <video
          ref={videoRef}
          onCanPlay={playCameraStream}
          id="video"
          autoPlay
          className="w-full h-auto border-2 border-gray-300 rounded-lg shadow-md"
        />
        <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
      </div>

      <div className="w-full max-w-md flex flex-col items-center">
        <h2 className="text-xl font-medium text-gray-700 mb-4">Categories</h2>
        <ul className="flex flex-wrap w-[400px] gap-5">
            {products.map((items)=>{
              return <li className="mx-auto flex justify-center items-center w-[130px] h-[30px] bg-gray-200 rounded-2xl shadow hover:bg-gray-300 cursor-pointer">
             {items}
             </li>
            })}
        </ul>
      </div>
    </div>
  );
};

export default Canvas;
