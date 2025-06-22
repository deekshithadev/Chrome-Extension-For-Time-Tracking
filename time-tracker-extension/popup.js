document.addEventListener("DOMContentLoaded", () => {
  console.log("Popup loaded");

  chrome.storage.local.get(null, (data) => {
    console.log("Storage data:", data);

    const labels = [];
    const values = [];

    for (const [domain, ms] of Object.entries(data)) {
      labels.push(domain);
      values.push(Math.round(ms / 1000)); // ms to seconds
    }

    if (labels.length === 0) {
      document.body.innerHTML += "<p style='text-align:center;'>No data yet. Visit some sites and try again.</p>";
      return;
    }

    const ctx = document.getElementById("chart").getContext("2d");

    new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Time Spent (seconds)",
            data: values,
            backgroundColor: "rgba(75, 192, 192, 0.6)",
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 1
          }
        ]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  });

  // ✅ Reset button logic (place this inside DOMContentLoaded)
  const resetBtn = document.getElementById("reset");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (confirm("Are you sure you want to clear all tracking data?")) {
        chrome.storage.local.clear(() => {
          alert("Tracking data cleared.");
          location.reload();
        });
      }
    });
  }
  document.body.innerHTML += `<button id="sync">Sync with Server</button>`;

document.getElementById("sync").addEventListener("click", () => {
  chrome.storage.local.get(null, (data) => {
    fetch('http://localhost:4000/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
      .then((res) => res.text())
      .then((msg) => alert(msg))
      .catch((err) => alert("Failed to sync: " + err));
  });
});

document.getElementById("resetBtn").addEventListener("click", async () => {
  const response = await fetch("http://localhost:4000/reset", {
    method: "POST",
  });

  if (response.ok) {
    alert("Productivity data reset!");
    chrome.storage.local.clear(() => {
      location.reload();
    });
  } else {
    alert("Failed to reset data.");
  }
});

});
