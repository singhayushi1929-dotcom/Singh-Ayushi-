/*
  PLANT DISEASE DETECTION — MODEL SETUP
  1. Train an Image Project at https://teachablemachine.withgoogle.com/
  2. Choose Export Model > TensorFlow.js > Upload my model.
  3. Copy the shareable model URL and paste it below, including the final slash.
  Example: https://teachablemachine.withgoogle.com/models/AbCdEf123/
*/
const MODEL_URL = "https://teachablemachine.withgoogle.com/models/I5rFG73yO/";

let model = null;
let selectedImage = null;

const imageInput = document.getElementById("imageInput");
const uploadZone = document.getElementById("uploadZone");
const uploadContent = document.getElementById("uploadContent");
const imagePreview = document.getElementById("imagePreview");
const predictButton = document.getElementById("predictButton");
const resetButton = document.getElementById("resetButton");
const modelMessage = document.getElementById("modelMessage");
const resultPlaceholder = document.getElementById("resultPlaceholder");
const resultContent = document.getElementById("resultContent");
const predictionLabel = document.getElementById("predictionLabel");
const confidenceValue = document.getElementById("confidenceValue");
const confidenceBar = document.getElementById("confidenceBar");
const careText = document.getElementById("careText");
const allPredictions = document.getElementById("allPredictions");

function setMessage(message, type = "") {
  modelMessage.textContent = message;
  modelMessage.className = \`model-message \${type}\`.trim();
}

function getCareGuidance(label) {
  const name = label.toLowerCase();
  if (name.includes("healthy")) {
    return "The model classified this image as healthy. Continue suitable watering, provide the plant's normal light requirements, ensure good drainage, and inspect leaves regularly.";
  }
  if (name.includes("tomato") || name.includes("potato")) {
    return "Check the plant regularly and keep foliage as dry as practical. Remove fallen plant debris, provide suitable spacing and airflow, and confirm the issue with a local gardening or agricultural expert.";
  }
  if (name.includes("rust") || name.includes("mildew") || name.includes("blight") || name.includes("spot")) {
    return "Avoid wetting leaves when watering, improve airflow around the plant, and remove fallen or badly affected plant material using clean tools. Confirm the suspected disease before choosing any treatment.";
  }
  return "This class was identified by your model. Check the plant's watering, light and drainage needs, keep the area clean, and compare visible symptoms with a trusted local agricultural source before taking action.";
}

async function loadModel() {
  if (!window.tmImage) {
    setMessage("Could not load the Teachable Machine library. Check your internet connection and reload the page.", "error");
    return;
  }
  if (!MODEL_URL.startsWith("https://teachablemachine.withgoogle.com/models/") || MODEL_URL.includes("PASTE_YOUR")) {
    setMessage("Setup needed: paste your exported Teachable Machine model URL into MODEL_URL in script.js.");
    return;
  }
  try {
    setMessage("Loading your trained model…");
    model = await tmImage.load(MODEL_URL + "model.json", MODEL_URL + "metadata.json");
    setMessage(\`Model ready. \${model.getTotalClasses()} classes loaded.\`, "success");
    predictButton.disabled = !selectedImage;
  } catch (error) {
    console.error("Model loading error:", error);
    setMessage("The model could not be loaded. Check the model URL, export settings and internet connection.", "error");
  }
}

function showSelectedImage(file) {
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    setMessage("Please choose a valid image file.", "error");
    return;
  }
  if (selectedImage) URL.revokeObjectURL(imagePreview.src);
  selectedImage = file;
  imagePreview.src = URL.createObjectURL(file);
  imagePreview.classList.remove("hidden");
  uploadContent.classList.add("hidden");
  resultContent.classList.add("hidden");
  resultPlaceholder.classList.remove("hidden");
  predictButton.disabled = !model;
  setMessage(model ? "Image ready. Select Detect disease to run the model." : "Image selected. Waiting for the model to finish loading.");
}

imageInput.addEventListener("change", event => showSelectedImage(event.target.files[0]));

["dragenter", "dragover"].forEach(eventName => {
  uploadZone.addEventListener(eventName, event => {
    event.preventDefault();
    uploadZone.classList.add("dragover");
  });
});
["dragleave", "drop"].forEach(eventName => {
  uploadZone.addEventListener(eventName, event => {
    event.preventDefault();
    uploadZone.classList.remove("dragover");
  });
});
uploadZone.addEventListener("drop", event => showSelectedImage(event.dataTransfer.files[0]));

predictButton.addEventListener("click", async () => {
  if (!model || !selectedImage || !imagePreview.complete) return;
  predictButton.disabled = true;
  predictButton.textContent = "Analysing…";
  setMessage("Running image classification…");
  try {
    const predictions = await model.predict(imagePreview);
    predictions.sort((a, b) => b.probability - a.probability);
    const best = predictions[0];
    const percentage = (best.probability * 100).toFixed(1);
    predictionLabel.textContent = best.className;
    confidenceValue.textContent = \`\${percentage}%\`;
    confidenceBar.style.width = \`\${Math.max(0, Math.min(100, best.probability * 100))}%\`;
    careText.textContent = getCareGuidance(best.className);
    allPredictions.innerHTML = "<strong>All model class scores</strong>";
    predictions.forEach(item => {
      const line = document.createElement("div");
      line.className = "prediction-line";
      const label = document.createElement("span");
      const score = document.createElement("b");
      label.textContent = item.className;
      score.textContent = \`\${(item.probability * 100).toFixed(1)}%\`;
      line.append(label, score);
      allPredictions.appendChild(line);
    });
    resultPlaceholder.classList.add("hidden");
    resultContent.classList.remove("hidden");
    setMessage("Prediction completed using your connected Teachable Machine model.", "success");
  } catch (error) {
    console.error("Prediction error:", error);
    setMessage("Prediction failed. Try another clear image or reload the page.", "error");
  } finally {
    predictButton.disabled = !model || !selectedImage;
    predictButton.innerHTML = 'Detect disease <span>→</span>';
  }
});

resetButton.addEventListener("click", () => {
  if (selectedImage && imagePreview.src.startsWith("blob:")) URL.revokeObjectURL(imagePreview.src);
  selectedImage = null;
  imageInput.value = "";
  imagePreview.removeAttribute("src");
  imagePreview.classList.add("hidden");
  uploadContent.classList.remove("hidden");
  resultContent.classList.add("hidden");
  resultPlaceholder.classList.remove("hidden");
  confidenceBar.style.width = "0%";
  predictButton.disabled = true;
  setMessage(model ? "Model ready. Upload a leaf image to begin." : "Waiting for the model to load.");
});

const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");
menuToggle.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});
navLinks.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});
loadModel();