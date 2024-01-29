import React, { useRef, useState, useEffect } from 'react';
import { FileDrop } from 'react-file-drop';
import { Pose, POSE_CONNECTIONS } from '@mediapipe/pose';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { calculateAngle, POSE_LANDMARKS } from './poseUtils';

function VideoPoseComponent() {
    const [videoSrc, setVideoSrc] = useState(null);
    const fileInputRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const requestAnimationFrameId = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [poseLandmarks, setPoseLandmarks] = useState(null);

    // Declare these state variables at the top with useState
    const [selectedJoint, setSelectedJoint] = useState(null);

    const angleJoints = [
        "Left Knee",
        "Right Knee",
        "Left Hip",
        "Right Hip",
        "Left Shoulder",
        "Right Shoulder",
        "Left Elbow",
        "Right Elbow"
    ];

    // Angle state variables
    const showLeftKneeAngle = useRef(false);
    const showRightKneeAngle = useRef(false);
    const showLeftHipAngle = useRef(false);
    const showRightHipAngle = useRef(false);
    const showLeftShoulderAngle = useRef(false);
    const showRightShoulderAngle = useRef(false);
    const showLeftElbowAngle = useRef(false);
    const showRightElbowAngle = useRef(false);

    const [angleLeftKnee, setLeftKneeAngle] = useState(null);
    const [angleRightKnee, setRightKneeAngle] = useState(null);
    const [angleLeftHip, setLeftHipAngle] = useState(null);
    const [angleRightHip, setRightHipAngle] = useState(null);
    const [angleLeftElbow, setLeftElbowAngle] = useState(null);
    const [angleRightElbow, setRightElbowAngle] = useState(null);
    const [angleLeftShoulder, setLeftShoulderAngle] = useState(null);
    const [angleRightShoulder, setRightShoulderAngle] = useState(null);

    const calculateAndUpdateAngle = (keypoint1, keypoint2, keypoint3, setAngleState) => {
        if (keypoint1 && keypoint2 && keypoint3) {
            const angle = calculateAngle(keypoint1, keypoint2, keypoint3);
            console.log('Calculated angle: ', angle);
            setAngleState(angle);
        }
    };

    useEffect(() => {
        const pose = new Pose({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
        });

        pose.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        pose.onResults((results) => {
            setPoseLandmarks(results.poseLandmarks);

            const ctx = canvasRef.current.getContext('2d');
            ctx.save();
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

            if (results.poseLandmarks) {
                drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, { color: '#00FF00', lineWidth: 1 });

                // Draw landmarks with custom styles
                drawLandmarks(ctx, results.poseLandmarks, {
                    color: '#FF0000',
                    lineWidth: 2,
                    radius: (landmark, index) => {
                        // Reduce the size of face points (indices 0 to 467)
                        if (index >= 0 && index <= 467) {
                            return 1; // You can adjust this value as needed
                        }
                        return 2; // Default size for other points
                    },
                    drawLines: false, // Disable drawing lines
                });

                // ... (similar blocks for other angles)

            }

            ctx.restore();
        });

        videoRef.current.pose = pose;
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
        const pose = video.pose;
        const ctx = canvasRef.current.getContext('2d');

        const drawAndDetectFirstFrame = () => {
            if (pose) {
                pose.send({ image: video });
            } else {
                ctx.drawImage(video, 0, 0, canvasRef.current.width, canvasRef.current.height);
            }
        };

        const renderFrame = async () => {
            if (!video.paused && !video.ended) {
                ctx.drawImage(video, 0, 0, canvasRef.current.width, canvasRef.current.height);
                await pose.send({ image: video });
                requestAnimationFrame(renderFrame);
            }
        };

        video.addEventListener('loadedmetadata', () => {
            canvasRef.current.width = video.videoWidth;
            canvasRef.current.height = video.videoHeight;
            video.currentTime = 0;
        });

        video.addEventListener('loadeddata', () => {
            drawAndDetectFirstFrame();
            video.pause();
            setIsPlaying(false);
        });

        video.addEventListener('play', renderFrame);
    };

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
        const pose = video.pose;

        if (video) {
            video.pause();
            video.currentTime = 0;
            setIsPlaying(false);

            video.onseeked = async () => {
                // Trigger pose detection for the first frame
                if (pose) {
                    await pose.send({ image: video });
                }
                video.onseeked = null; // Clear the event handler
            };
        }
    };

    const handleRemove = () => {
        setVideoSrc(null);
        setIsPlaying(false);
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        // Reset the file input
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    useEffect(() => {
        if (videoSrc) {
            drawVideoOnCanvas();
        }

        return () => {
            if (requestAnimationFrameId.current) {
                cancelAnimationFrame(requestAnimationFrameId.current);
            }
        };
    }, [videoSrc]);

    const [refresh, setRefresh] = useState(false);

    const toggleShowAngle = (angleRef) => {
        angleRef.current = !angleRef.current;
        setRefresh(prev => !prev); // Toggle the refresh state to force re-render
    };

    const joints = [
        { name: "Left Knee", ref: showLeftKneeAngle, toggle: () => toggleShowAngle(showLeftKneeAngle) },
        { name: "Right Knee", ref: showRightKneeAngle, toggle: () => toggleShowAngle(showRightKneeAngle) },
        { name: "Left Hip", ref: showLeftHipAngle, toggle: () => toggleShowAngle(showLeftHipAngle) },
        { name: "Right Hip", ref: showRightHipAngle, toggle: () => toggleShowAngle(showRightHipAngle) },
        { name: "Left Shoulder", ref: showLeftShoulderAngle, toggle: () => toggleShowAngle(showLeftShoulderAngle) },
        { name: "Right Shoulder", ref: showRightShoulderAngle, toggle: () => toggleShowAngle(showRightShoulderAngle) },
        { name: "Left Elbow", ref: showLeftElbowAngle, toggle: () => toggleShowAngle(showLeftElbowAngle) },
        { name: "Right Elbow", ref: showRightElbowAngle, toggle: () => toggleShowAngle(showRightElbowAngle) }
    ];

    const jointAngleControls = joints.map((joint, index) => {
        // Determine the current state of the angle visibility for each joint
        const isAngleVisible = joint.ref.current;

        return (
            <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '5px' }}>
                <span>{joint.name}</span>
                <button onClick={joint.toggle}>
                    {isAngleVisible ? 'Angle ON' : 'Angle OFF'}
                </button>
            </div>
        );
    });

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
            <div className="joint-controls-container">
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {jointAngleControls}
                </div>
            </div>
            {/* Hide the video element; it's only used to provide a source for the canvas */}
            <div style={{ display: 'none' }}>
                <video ref={videoRef} src={videoSrc} preload="metadata"></video>
            </div>
        </div>
    );
}

export default VideoPoseComponent;
