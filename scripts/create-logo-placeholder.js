const fs = require("fs");
const path = require("path");
const dir = path.join(__dirname, "..", "src", "assets");
const pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
const buf = Buffer.from(pngBase64, "base64");
[path.join(dir, "reformator-logo.png"), path.join(dir, "logo-light.png"), path.join(dir, "logo-dark.png")].forEach((file) => {
  fs.writeFileSync(file, buf);
  console.log("Created", file);
});
