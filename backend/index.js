const express = require('express');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');



const app = express();
const PORT = 4000;

app.use(cors());
app.use(bodyParser.json());
app.set("view engine", "ejs");
app.use("/chart.js", express.static(__dirname + "/../time-tracker-extension/chart.js"));

app.get("/", (req, res) => {
  res.send(`
    <h2>Welcome to Time Tracker Server</h2>
    <p><a href="/report">View Productivity Report</a></p>
  `);
});

app.get("/report", (req, res) => {
  fs.readFile("data.json", "utf8", (err, data) => {
    const timeData = JSON.parse(data || "{}");
    res.render("report", { timeData });
  });
});

// Endpoint to receive tracking data
app.post('/track', (req, res) => {
  const incoming = req.body;

  fs.readFile('data.json', 'utf8', (err, fileData) => {
    const currentData = fileData ? JSON.parse(fileData) : {};

    for (const domain in incoming) {
      currentData[domain] = (currentData[domain] || 0) + incoming[domain];
    }

    fs.writeFile('data.json', JSON.stringify(currentData, null, 2), (err) => {
      if (err) {
        console.error('Write error:', err);
        return res.status(500).send('Failed to write data.');
      }
      res.send('Data saved successfully!');
    });
  });
});

app.post('/reset', (req, res) => {
  fs.writeFile('data.json', '{}', (err) => {
    if (err) {
      console.error('Reset failed:', err);
      return res.status(500).send('Failed to reset data');
    }
    res.send('Data reset successfully');
  });
});


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


app.get('/download/json', (req, res) => {
  res.download('data.json', 'productivity-report.json');
});

app.get('/download/csv', (req, res) => {
  fs.readFile("data.json", "utf8", (err, jsonData) => {
    if (err) return res.status(500).send("Error reading data");

    const data = JSON.parse(jsonData || "{}");
    let csv = "Domain,Time (seconds)\n";

    for (let domain in data) {
      csv += `${domain},${Math.round(data[domain] / 1000)}\n`;
    }

    res.setHeader('Content-Disposition', 'attachment; filename="productivity-report.csv"');
    res.setHeader('Content-Type', 'text/csv');
    res.send(csv);
  });
});
