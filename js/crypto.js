// Include CryptoJS in content or via CDN if needed
const SECRET_KEY = "easy-pass-secret";

// Encrypt text
function encrypt(text) {
  return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
}

// Decrypt text
function decrypt(cipher) {
  const bytes = CryptoJS.AES.decrypt(cipher, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}
