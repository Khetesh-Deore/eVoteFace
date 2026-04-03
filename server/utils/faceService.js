const axios = require("axios");
const FormData = require("form-data");

const PYTHON_URL = process.env.PYTHON_FACE_API_URL || "http://localhost:8000";

const encodeFace = async (imageBuffer, filename) => {
  try {
    const form = new FormData();
    form.append("image", imageBuffer, { filename: filename || "face.jpg" });
    const response = await axios.post(`${PYTHON_URL}/encode`, form, {
      headers: form.getHeaders(),
      timeout: 30000,
    });
    return response.data;
  } catch (err) {
    if (err.code === "ECONNREFUSED") throw { code: "ECONNREFUSED" };
    if (err.response?.data) return err.response.data; // Python returned error JSON
    throw err;
  }
};

const verifyFace = async (liveImageBase64, storedEncoding) => {
  try {
    const response = await axios.post(
      `${PYTHON_URL}/verify`,
      { liveImage: liveImageBase64, storedEncoding },
      { timeout: 30000 }
    );
    return response.data;
  } catch (err) {
    if (err.code === "ECONNREFUSED") throw { code: "ECONNREFUSED" };
    if (err.response?.data) return err.response.data;
    throw err;
  }
};

const checkHealth = async () => {
  const response = await axios.get(`${PYTHON_URL}/health`, { timeout: 5000 });
  return response.data;
};

module.exports = { encodeFace, verifyFace, checkHealth };
