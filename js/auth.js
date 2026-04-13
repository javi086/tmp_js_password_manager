const loginForm = document.getElementById("loginForm");
const email = document.getElementById("email");
const password = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");
const loginError = document.getElementById("login-error");

/* Change to backend login endpoint */
//onst LOGIN_API_URL = "http://localhost:8080/api/v1/auth/login";
const LOGIN_API_URL = "/api/easypassword/login";

/* Show or hide password */
if (togglePassword && password) {
    togglePassword.addEventListener("change", function () {
        if (password.type === "password") {
            password.type = "text";
        } else {
            password.type = "password";
        }
    });
}

/* Save token and role using JWT utility */
function saveSession(token, role) {
    JwtUtils.saveToken(token);
    JwtUtils.saveRole(role);
}

/* Clear session */
function clearSession() {
    JwtUtils.clearSession();
}

/* Check if user is logged in */
function isLoggedIn() {
    return JwtUtils.isLoggedIn();
}

/* Get saved user role */
function getUserRole() {
    return JwtUtils.getRole();
}

/* Protect pages that require login */
function requireAuth() {
    const token = JwtUtils.getToken();

    if (!token) {
        window.location.href = "login.html";
    }
}

/* Protect pages that require a specific role */
function requireRole(requiredRole) {
    const token = JwtUtils.getToken();
    const role = JwtUtils.getRole();

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    if (role !== requiredRole) {
        alert("Access denied. You are not authorized to view this page.");
        window.location.href = "login.html";
    }
}

/* Logout function */
function logout() {
    clearSession();
    window.location.href = "login.html";
}

/* Helper: show error message */
function showError(message) {
    if (!loginError) return;
    loginError.style.color = "#ff4d4d";
    loginError.textContent = message;
}

/* Helper: show success message */
function showSuccess(message) {
    if (!loginError) return;
    loginError.style.color = "#90ee90";
    loginError.textContent = message;
}

/* Helper: loading state */
function showLoading(message) {
    if (!loginError) return;
    loginError.style.color = "#ffffff";
    loginError.textContent = message;
}

/* Demo login fallback if backend is unavailable */
function tryDemoLogin(emailValue, passwordValue) {
    if (emailValue === "admin@test.com" && passwordValue === "1234") {
        saveSession("demo_admin_token", "admin");
        showSuccess("Demo admin login successful.");

        setTimeout(function () {
            window.location.href = "../pages/adminpage.html";
        }, 1000);

        return true;
    }

    if (emailValue === "user@test.com" && passwordValue === "1234") {
        saveSession("demo_user_token", "user");
        showSuccess("Demo user login successful.");

        setTimeout(function () {
            window.location.href = "../pages/dashboard.html";
        }, 1000);

        return true;
    }

    return false;
}

/* Handle login */
if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const emailValue = email.value.trim();
        const passwordValue = password.value.trim();

        if (loginError) {
            loginError.textContent = "";
        }

        /* client-side validation */
        if (emailValue === "" || passwordValue === "") {
            showError("Please enter your email and password.");
            return;
        }

        /* email check */
        if (!emailValue.includes("@")) {
            showError("Please enter a valid email address.");
            return;
        }

        try {
            showLoading("Logging in...");

            const response = await fetch(LOGIN_API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: emailValue,
                    password: passwordValue
                })
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 400) {
                    showError("Bad request. Please check your input.");
                } else if (response.status === 401) {
                    if (tryDemoLogin(emailValue, passwordValue)) return;
                    showError("Invalid email or password.");
                } else if (response.status === 403) {
                    showError("Access forbidden.");
                } else if (response.status === 500) {
                    showError("Server error. Please try again later.");
                } else {
                    showError(data.message || "Login failed.");
                }
                return;
            }


             const token = data.token;
            const role = data.role || "user";

            if (!token) {
                showError("Login succeeded but no token was returned.");
                return;
            }

            // Save the data returned by your server
            saveSession(token, role);
            showSuccess("Login successful.");

            setTimeout(function () {
                // Redirect - since you are in /pages/login.html, 
                // you stay in the same folder for these files
                window.location.href = (role === "admin") ? "../pages/adminpage.html" : "../pages/dashboard.html";
            }, 1000);

        } catch (error) {
            console.error("Login error:", error);

            /* Demo mode fallback */
            if (tryDemoLogin(emailValue, passwordValue)) {
                return;
            }

            showError("Network error. Please check the API connection.");
        }
    });
}

/* Example token check on page load */
document.addEventListener("DOMContentLoaded", function () {
    console.log("Logged in:", isLoggedIn());
    console.log("User role:", getUserRole());
    console.log("Decoded token:", JwtUtils.getUserFromToken());
});