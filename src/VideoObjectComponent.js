import React, { useRef, useState, useEffect } from 'react';
import { FileDrop } from 'react-file-drop';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

function VideoObjectComponent() {
    const [videoSrc, setVideoSrc] = useState(null);
    const fileInputRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const modelRef = useRef(null);

    useEffect(() => {
        // Load the COCO-SSD model
        const loadModel = async () => {
            modelRef.current = await cocoSsd.load();
        };

        loadModel().catch(console.error);

        return () => {
            // Any cleanup would go here
        };
    }, []);

    const handleVideoUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setVideoSrc(url);
        }
    };

    const drawVideoOnCanvas = () => {
        const video = videoRef.current;
        const ctx = canvasRef.current.getContext('2d');

        const detectAndDraw = async () => {
            if (modelRef.current && video) {
                const predictions = await modelRef.current.detect(video);
                predictions.forEach(prediction => {
                    if (prediction.class === 'sports ball') {
                        const [x, y, width, height] = prediction.bbox;
                        ctx.strokeStyle = 'red';
                        ctx.lineWidth = 4;
                        ctx.strokeRect(x, y, width, height);
                    }
                });
            }
        };

        const renderFrame = async () => {
            if (!video.paused && !video.ended) {
                ctx.drawImage(video, 0, 0, canvasRef.current.width, canvasRef.current.height);

                await detectAndDraw();

                requestAnimationFrame(renderFrame);
            }
        };

        video.addEventListener('loadedmetadata', () => {
            canvasRef.current.width = video.videoWidth;
            canvasRef.current.height = video.videoHeight;
            video.currentTime = 0;
        });

        video.addEventListener('loadeddata', () => {
            video.pause();
            setIsPlaying(false);
            renderFrame(); // Draw the first frame
        });

        video.addEventListener('play', renderFrame);
    };

    useEffect(() => {
        if (videoSrc) {
            drawVideoOnCanvas();
        }
    }, [videoSrc]);

    const togglePlayPause = () => {
        const video = videoRef.current;
        if (!video) return;

        if (video.paused || video.ended) {
            video.play();
            setIsPlaying(true);
        } else {
            video.pause();
            setIsPlaying(false);
        }
    };

    const handleReset = () => {
        const video = videoRef.current;

        if (video) {
            video.pause();
            video.currentTime = 0;
            setIsPlaying(false);
        }
    };

    const handleRemove = () => {
        setVideoSrc(null);
        setIsPlaying(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div>
            <div className="drop-area">
                {!videoSrc && (
                    <FileDrop onDrop={handleVideoUpload} onTargetClick={() => fileInputRef.current.click()}>
                        Drop your video here or click to upload
                    </FileDrop>
                )}
                <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleVideoUpload}
                    style={{ display: 'none' }}
                />
                {videoSrc && (
                    <canvas ref={canvasRef} style={{ width: '100%', height: 'auto' }}></canvas>
                )}
            </div>
            <div>
                {videoSrc && (
                    <>
                        <button onClick={togglePlayPause}>
                            {isPlaying ? 'Pause' : 'Play'}
                        </button>
                        <button onClick={handleReset}>Reset</button>
                        <button onClick={handleRemove}>Remove</button>
                    </>
                )}
            </div>
            <div style={{ display: 'none' }}>
                <video ref={videoRef} src={videoSrc} preload="metadata"></video>
            </div>
        </div>
    );
}

export default VideoObjectComponent;
