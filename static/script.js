let alertCount = 0;
let userLocation = null;

// Get GPS Location
navigator.geolocation.getCurrentPosition(
  (pos) => {
    const lat = pos.coords.latitude.toFixed(4);
    const lon = pos.coords.longitude.toFixed(4);
    userLocation = `${lat}, ${lon}`;

    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`,
    )
      .then((res) => res.json())
      .then((data) => {
        const city =
          data.address.city ||
          data.address.town ||
          data.address.village ||
          "Unknown";
        const state = data.address.state || "";
        const locationName = `${city}, ${state}`;
        document.getElementById("locationStatus").textContent = locationName;
        userLocation = locationName;
      })
      .catch(() => {
        document.getElementById("locationStatus").textContent = userLocation;
      });
  },
  () => {
    document.getElementById("locationStatus").textContent = "Unavailable";
  },
);

// Send Alert to Flask Server
function sendAlert(type) {
  alertCount++;
  document.getElementById("alertCount").textContent = alertCount;

  const now = new Date().toLocaleString();

  const alertBox = document.getElementById("alertBox");
  alertBox.classList.add("show");
  document.getElementById("alertType").textContent = `Type: ${type}`;
  document.getElementById("alertTime").textContent = `Time: ${now}`;
  document.getElementById("alertLocation").textContent =
    `Location: ${userLocation || "Fetching..."}`;
  document.getElementById("alertStatus").textContent =
    `Status: Saving evidence...`;

  fetch("/trigger", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: type,
      location: userLocation || "unknown",
      timestamp: now,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      document.getElementById("alertStatus").textContent =
        `Status: Evidence Saved ✅`;
    })
    .catch(() => {
      document.getElementById("alertStatus").textContent =
        `Status: Save Failed ❌`;
    });
  startRecording();
}

// Continuous Jerk Detection
let jerkCount = 0;
let jerkTimer = null;

window.addEventListener("devicemotion", (event) => {
  const acc = event.accelerationIncludingGravity;
  if (!acc) return;

  const total = Math.abs(acc.x) + Math.abs(acc.y) + Math.abs(acc.z);

  if (total > 25) {
    jerkCount++;
    document.getElementById("motionStatus").textContent =
      `⚠️ Jerk ${jerkCount}/3`;

    clearTimeout(jerkTimer);
    jerkTimer = setTimeout(() => {
      jerkCount = 0;
      document.getElementById("motionStatus").textContent = "Normal ✓";
    }, 2000);

    if (jerkCount >= 3) {
      jerkCount = 0;
      clearTimeout(jerkTimer);
      document.getElementById("motionStatus").textContent =
        "🚨 Attack Detected!";
      sendAlert("Motion - Continuous Jerk Attack");
    }
  }
});

// SOS Button
function triggerSOS() {
  sendAlert("Manual SOS");
}

// Media Recording
let mediaRecorder = null;
let recordedChunks = [];

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    recordedChunks = [];
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      uploadEvidence(blob);
    };

    mediaRecorder.start();
    console.log("Recording started!");

    setTimeout(() => {
      stopRecording();
    }, 30000);
  } catch (err) {
    console.error("Camera/Mic access denied:", err);
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
    console.log("Recording stopped!");
  }
}

async function uploadEvidence(blob) {
  const formData = new FormData();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  formData.append("file", blob, `evidence_${timestamp}.webm`);
  formData.append("location", userLocation || "unknown");

  fetch("/upload_evidence", {
    method: "POST",
    body: formData,
  })
    .then((res) => res.json())
    .then((data) => {
      console.log("Evidence uploaded:", data);
      document.getElementById("alertStatus").textContent =
        "Status: Evidence Uploaded ✅";
    })
    .catch((err) => {
      console.error("Upload failed:", err);
      document.getElementById("alertStatus").textContent =
        "Status: Upload Failed ❌";
    });
}
