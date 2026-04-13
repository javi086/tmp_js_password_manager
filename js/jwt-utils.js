// jwt-utils.js
// This file manages JWT tokens and user session using localStorage

const JwtUtils = {

    // Save JWT token in browser storage
    saveToken(token) {
        localStorage.setItem("token", token);
    },

    // Get saved token
    getToken() {
        return localStorage.getItem("token");
    },

    // Remove token (logout)
    removeToken() {
        localStorage.removeItem("token");
    },

    // Save user role (admin or user)
    saveRole(role) {
        localStorage.setItem("role", role);
    },

    // Get user role
    getRole() {
        return localStorage.getItem("role");
    },

    // Remove role
    removeRole() {
        localStorage.removeItem("role");
    },

    // Clear entire session (used for logout)
    clearSession() {
        this.removeToken();
        this.removeRole();
    },

    // Check if user is logged in (token exists)
    isLoggedIn() {
        return !!this.getToken();
    },

    // Decode JWT token to get user info
    decodeToken(token) {
        try {
            const parts = token.split(".");

            // JWT should have 3 parts
            if (parts.length !== 3) {
                return null;
            }

            // Get payload (middle part)
            const payload = parts[1];

            // Fix base64 format
            const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");

            // Decode and convert to JSON
            const decoded = atob(base64);
            return JSON.parse(decoded);

        } catch (error) {
            console.error("Invalid JWT token:", error);
            return null;
        }
    },

    // Get user info from saved token
    getUserFromToken() {
        const token = this.getToken();

        if (!token) {
            return null;
        }

        return this.decodeToken(token);
    },

    // Add token to API request headers
    getAuthHeaders() {
        const token = this.getToken();

        // If token exists, include Authorization header
        if (token) {
            return {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            };
        }

        // If no token, just return content type
        return {
            "Content-Type": "application/json"
        };
    }
};