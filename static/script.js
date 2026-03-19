let alertCount = 0;
let userLocation = null;

// Get GPS Location
navigator.geolocation.getCurrentPosition(
  (pos) => {
    const lat = pos.coords.latitude.toFixed(4);
    const lon = pos.coords.longitude.toFixed(4);
    userLocation = `${lat}, ${lon}`;

    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
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
}

// Motion Detection
window.addEventListener("devicemotion", (event) => {
  const acc = event.accelerationIncludingGravity;
  if (!acc) return;

  const total = Math.abs(acc.x) + Math.abs(acc.y) + Math.abs(acc.z);

  if (total > 25) {
    document.getElementById("motionStatus").textContent = "⚠️ Jerk Detected!";
    sendAlert("Motion - Sudden Jerk");
  } else {
    document.getElementById("motionStatus").textContent = "Normal ✓";
  }
});

// SOS Button
function triggerSOS() {
  sendAlert("Manual SOS");
}
