// get the form and message box
const form = document.getElementById("registerForm");
const msg = document.getElementById("register-msg");

// when the user clicks register
form.addEventListener("click", function (e) {
    e.preventDefault(); // stop page from refreshing

    // get what the user typed
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();

    msg.textContent = ""; // clear old message

    // check if anything is empty
    if (!name || !email || !password || !confirmPassword) {
        msg.style.color = "#ff4d4d";
        msg.textContent = "Please fill in all fields.";
        return;
    }

    // check if email looks correct
    if (!email.includes("@")) {
        msg.style.color = "#ff4d4d";
        msg.textContent = "Enter a valid email.";
        return;
    }

    // check if passwords match
    if (password !== confirmPassword) {
        msg.style.color = "#ff4d4d";
        msg.textContent = "Passwords do not match.";
        return;
    }

    // everything is good
   // POST request to your Express server
    fetch("/api/easypassword/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            name: name,
            email: email,
            password: password
        })
    })
    .then(async response => {
        const data = await response.json();
        
        if (response.ok) {
            msg.style.color = "#90ee90";
            msg.textContent = "Account created successfully!";
            
            // Redirect to login after a short delay
            setTimeout(() => {
                window.location.href = "login.html"; // Both are in /pages/
            }, 1500);
        } else {
            // Show the specific error from the server (like "Email already exists")
            msg.style.color = "#ff4d4d";
            msg.textContent = data.error || "Registration failed.";
        }
    })
    .catch(error => {
        console.error("Registration error:", error);
        msg.style.color = "#ff4d4d";
        msg.textContent = "Server error. Is the backend running?";
    });

});