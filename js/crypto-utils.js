// crypto-utils.js
// This file handles encryption and decryption using the browser's Web Crypto API

const CryptoUtils = {

    // Generate a secure encryption key from a password
    async generateKey(password) {
        const encoder = new TextEncoder();

        // Convert password into a base key
        const baseKey = await crypto.subtle.importKey(
            "raw",
            encoder.encode(password),
            { name: "PBKDF2" },
            false,
            ["deriveKey"]
        );

        // Derive a strong key using PBKDF2 (secure hashing)
        return await crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: encoder.encode("easypass-demo-salt"), // adds randomness
                iterations: 100000, // makes brute force harder
                hash: "SHA-256"
            },
            baseKey,
            {
                name: "AES-GCM", // encryption algorithm
                length: 256
            },
            false,
            ["encrypt", "decrypt"]
        );
    },

    // Encrypt text using a password
    async encryptText(text, password) {
        const encoder = new TextEncoder();

        // Generate encryption key from password
        const key = await this.generateKey(password);

        // Create a random IV (initialization vector) for security
        const iv = crypto.getRandomValues(new Uint8Array(12));

        // Encrypt the text
        const encryptedBuffer = await crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: iv
            },
            key,
            encoder.encode(text)
        );

        // Return encrypted data + IV (needed for decryption)
        return {
            iv: Array.from(iv),
            data: Array.from(new Uint8Array(encryptedBuffer))
        };
    },

    // Decrypt text using the same password
    async decryptText(encryptedObject, password) {
        const decoder = new TextDecoder();

        // Generate the same key again from password
        const key = await this.generateKey(password);

        // Decrypt the data using IV + encrypted data
        const decryptedBuffer = await crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: new Uint8Array(encryptedObject.iv)
            },
            key,
            new Uint8Array(encryptedObject.data)
        );

        // Convert decrypted data back to readable text
        return decoder.decode(decryptedBuffer);
    }
};