import { useState, useRef, useEffect } from "react";
import { QRCode } from "react-qrcode-logo";
import { Download, Link as LinkIcon } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode"; // ✅ updated
import "./App.css";

function App() {
  const [url, setUrl] = useState("");
  const [qrType, setQrType] = useState("url");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [wifiFile, setWifiFile] = useState(null);
  const [wifiInfo, setWifiInfo] = useState(null);
  const [downloadFormat, setDownloadFormat] = useState("png");
  const qrRef = useRef(null);

  const parseWiFiQR = (text) => {
    if (!text.startsWith("WIFI:")) return null;
    const data = text.replace(/^WIFI:/, "").replace(/;$/, "");
    const fields = data.split(";");

    const info = {};
    fields.forEach((field) => {
      const [key, value] = field.split(":");
      if (key && value !== undefined) info[key.trim().toLowerCase()] = value.trim();
    });

    if (info.s) return { ssid: info.s, password: info.p || "" };
    return null;
  };

  // ✅ Updated Wi-Fi decode using html5-qrcode
  const decodeWifiQR = async () => {
    if (!wifiFile) return;
    try {
      const fileUrl = URL.createObjectURL(wifiFile);
      const result = await Html5Qrcode.scanFile(fileUrl, true); // returns decoded text
      const info = parseWiFiQR(result);
      if (info) setWifiInfo(info);
      else alert("Not a valid Wi-Fi QR code");
      URL.revokeObjectURL(fileUrl);
    } catch (err) {
      console.error(err);
      alert("Could not detect QR code in the image");
    }
  };

  const generateQR = () => {
    if (!url.trim() && qrType === "url") return;
    setIsGenerating(true);
    setTimeout(() => {
      setShowQR(true);
      setIsGenerating(false);
    }, 300);
  };

  useEffect(() => {
    if (downloadFormat === "svg" && showQR) {
      setShowQR(false);
      setTimeout(() => setShowQR(true), 10);
    }
  }, [downloadFormat]);

  const downloadQR = () => {
    let link = document.createElement("a");

    if (downloadFormat === "svg") {
      const svg = qrRef.current.querySelector("svg");
      if (!svg) return;
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svg);
      const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      link.href = URL.createObjectURL(blob);
      link.download = "qrcode.svg";
    } else {
      const canvas = qrRef.current.querySelector("canvas");
      if (!canvas) return;
      const mime = downloadFormat === "jpg" ? "image/jpeg" : "image/png";
      link.href = canvas.toDataURL(mime);
      link.download = `qrcode.${downloadFormat}`;
    }

    link.click();
  };

  return (
    <div className="page">
      <div className="container">
        <div className="card">
          <header className="header">
            <h1>QR Code Generator</h1>
            <p>Turn any link or scan Wi-Fi QR codes</p>
          </header>

          <div className="content">
            {/* URL INPUT */}
            <div className="input-group">
              {qrType === "url" && <LinkIcon className="input-icon" />}
              {qrType === "url" && (
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              )}
            </div>

            {/* QR TYPE SELECTOR */}
            <div style={{ marginBottom: "1rem", textAlign: "center" }}>
              <select
                value={qrType}
                onChange={(e) => {
                  setQrType(e.target.value);
                  setShowQR(false);
                  setWifiInfo(null);
                  setWifiFile(null);
                }}
                style={{
                  padding: "0.6rem",
                  borderRadius: "10px",
                  border: "1px solid #C5D89D",
                  fontSize: "1rem",
                  width: "100%",
                }}
              >
                <option value="url">URL</option>
                <option value="wifi">Wi-Fi Scanner</option>
              </select>
            </div>

            {/* URL BUTTON */}
            {qrType === "url" && (
              <button
                className="generate-btn"
                disabled={isGenerating || !url.trim()}
                onClick={generateQR}
              >
                {isGenerating ? "Generating..." : "Generate QR Code"}
              </button>
            )}

            {/* URL QR DISPLAY */}
            {qrType === "url" && showQR && (
              <div className="qr-section">
                <div className="qr-box" ref={qrRef}>
                  <QRCode
                    value={url}
                    size={260}
                    fgColor="#89986D"
                    bgColor="#F6F0D7"
                    qrStyle="dots"
                    eyeRadius={8}
                    quietZone={10}
                    renderAs={downloadFormat === "svg" ? "svg" : "canvas"}
                  />
                </div>

                <div style={{ marginTop: "1rem" }}>
                  <select
                    value={downloadFormat}
                    onChange={(e) => setDownloadFormat(e.target.value)}
                    style={{
                      padding: "0.4rem",
                      borderRadius: "8px",
                      border: "1px solid #C5D89D",
                      marginBottom: "0.6rem",
                      width: "100%",
                    }}
                  >
                    <option value="png">PNG</option>
                    <option value="jpg">JPG</option>
                    <option value="svg">SVG</option>
                  </select>

                  <button className="download-btn" onClick={downloadQR}>
                    <Download size={18} />
                    Download QR
                  </button>
                </div>
              </div>
            )}

            {/* WIFI SCANNER */}
            {qrType === "wifi" && (
              <div className="wifi-scanner">
                <p style={{ marginBottom: "0.5rem" }}>
                  Upload Wi-Fi QR code image
                </p>

                <label className="wifi-upload">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setWifiFile(e.target.files[0])}
                  />
                  <span>{wifiFile ? wifiFile.name : "Choose QR image"}</span>
                </label>

                <button
                  className="generate-btn"
                  onClick={decodeWifiQR}
                  disabled={!wifiFile}
                  style={{ marginTop: "0.8rem" }}
                >
                  Decode Wi-Fi QR
                </button>

                {wifiInfo && (
                  <div className="wifi-result">
                    <div className="wifi-row">
                      <span>SSID</span>
                      <strong>{wifiInfo.ssid}</strong>
                    </div>
                    <div className="wifi-row">
                      <span>Password</span>
                      <strong>{wifiInfo.password || "—"}</strong>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <footer className="footer">
          Made by Machew👁️ • Works offline • No data stored
        </footer>
      </div>
    </div>
  );
}

export default App;
