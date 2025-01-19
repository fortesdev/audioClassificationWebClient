// Copyright 2023 The MediaPipe Authors.

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//      http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import audio from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-audio@0.10.0";
const { AudioClassifier, AudioClassifierResult, FilesetResolver } = audio;
const demosSection = document.getElementById("demos");
let isPlaying = false;
let audioClassifier;
let audioCtx;
const createAudioClassifier = async () => {
    const audio = await FilesetResolver.forAudioTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-audio@0.10.0/wasm");
    audioClassifier = await AudioClassifier.createFromOptions(audio, {
        baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/audio_classifier/yamnet/float32/1/yamnet.tflite"
        }
    });
    demosSection.classList.remove("invisible");
};
createAudioClassifier();

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function removeAllChildNodes(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}
/*
  Demo 2 - Streaming classification from microphone
*/
const streamingBt = document.getElementById("microBt");
streamingBt.addEventListener("click", async function () {
    await runStreamingAudioClassification();
});
async function runStreamingAudioClassification() {
    const output = document.getElementById("microResult");
    const constraints = { audio: true };
    let stream;
    try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
    }
    catch (err) {
        console.log("The following error occured: " + err);
        alert("getUserMedia not supported on your browser");
    }
    if (!audioCtx) {
        audioCtx = new AudioContext({ sampleRate: 16000 });
    }
    else if (audioCtx.state === "running") {
        await audioCtx.suspend();
        streamingBt.firstElementChild.innerHTML = "START CLASSIFYING";
        return;
    }
    // resumes AudioContext if has been suspended
    await audioCtx.resume();
    streamingBt.firstElementChild.innerHTML = "STOP CLASSIFYING";
    const source = audioCtx.createMediaStreamSource(stream);
    const scriptNode = audioCtx.createScriptProcessor(16384, 1, 1);
    scriptNode.onaudioprocess = function (audioProcessingEvent) {
        const inputBuffer = audioProcessingEvent.inputBuffer;
        let inputData = inputBuffer.getChannelData(0);
        // Classify the audio
        const result = audioClassifier.classify(inputData);
        const categories = result[0].classifications[0].categories;
        // Display results
        output.innerText =
            categories[0].categoryName +
                "(" +
                categories[0].score.toFixed(3) +
                ")\n" +
                categories[1].categoryName +
                "(" +
                categories[1].score.toFixed(3) +
                ")\n" +
                categories[2].categoryName +
                "(" +
                categories[2].score.toFixed(3) +
                ")";
    };
    source.connect(scriptNode);
    scriptNode.connect(audioCtx.destination);
}
