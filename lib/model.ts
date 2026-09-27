import * as tmImage from "@teachablemachine/image";

let tfModel: tmImage.CustomMobileNet | null = null;
let maxPredictions = 0;

// You will place your Teachable Machine exported model files here later.
// For now, it expects the files at /model/ (model.json, metadata.json, weights.bin)
const URL = "/model/";

export async function loadModel() {
    if (tfModel) return;
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";
    tfModel = await tmImage.load(modelURL, metadataURL);
    maxPredictions = tfModel.getTotalClasses();
}

export async function classifyImage(imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement) {
    if (!tfModel) {
        await loadModel();
    }
    if (!tfModel) throw new Error("Model failed to load");

    const predictions = await tfModel.predict(imageElement);

    // Find highest prediction
    let topPrediction = predictions[0];
    for (let i = 1; i < predictions.length; i++) {
        if (predictions[i].probability > topPrediction.probability) {
            topPrediction = predictions[i];
        }
    }

    // Expecting classes named essentially "smoke" and "clear"
    // from exactly what you train inside Teachable Machine.
    const name = topPrediction.className.toLowerCase().includes("smoke") ? "smoke" : "clear";

    return {
        classification: name as "smoke" | "clear",
        confidence: topPrediction.probability
    };
}
