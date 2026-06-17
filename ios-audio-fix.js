// ios-audio-fix.js

// 1. Create a globally accessible Audio Context
window.globalAudioCtx = null;

function initAudioContext() {
    if (!window.globalAudioCtx) {
        window.globalAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (window.globalAudioCtx.state === 'suspended') {
        window.globalAudioCtx.resume();
    }
}

// Automatically unlock audio on the first user interaction (click or tap)
document.addEventListener('click', initAudioContext, { once: true });
document.addEventListener('touchstart', initAudioContext, { once: true });


// 2. A reusable, modern recording function
window.easyRecord = async function(durationInMs = 5000) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Recording not supported on this browser/connection (Ensure you are using HTTPS).");
        return null;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        const chunks = [];

        return new Promise((resolve) => {
            mediaRecorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
            
            mediaRecorder.onstop = () => {
                // iOS prefers audio/mp4 for voice recordings in browser
                const blob = new Blob(chunks, { type: 'audio/mp4' });
                const audioUrl = URL.createObjectURL(blob);
                
                // Stop all tracks to turn off the iPhone recording light
                stream.getTracks().forEach(track => track.stop());
                
                resolve({ blob, audioUrl });
            };

            // Start recording and automatically stop after duration
            mediaRecorder.start();
            setTimeout(() => mediaRecorder.stop(), durationInMs);
        });
    } catch (err) {
        console.error("Microphone error:", err);
        throw err;
    }
};