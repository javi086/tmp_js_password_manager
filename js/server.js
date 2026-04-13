/******************************************************/
// 1. IMPORTS & INITIALIZATION 
/******************************************************/
const bcrypt = require('bcrypt'); // This is required for the login section
require('dotenv').config(); // This allows us to use environment variables from a .env file
const express = require('express');
const cors = require('cors'); // I require it to avoid my error: "Access
const path = require('path');
const { Pool } = require('pg');
const app = express();
const Parser = require('rss-parser'); // This will be used to parse the RSS information into a JSON format that I can use in the frontend.
const parser = new Parser({
  headers: { 
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8'
  },
});


// Initialize Stripe
const stripe = require('stripe')('STRIPE_SECRET_KEY');
// Use environment variable for the secret
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

/******************************************************/
// 2. MIDDLEWARE & DB CONNECTION
/******************************************************/
app.use(cors());

// Initialize the Database Pool
// This is the recommended way to connect to PostgreSQL on Render. It uses the DATABASE_URL environment variable and sets SSL with rejectUnauthorized: false.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Verify connection to Render
pool.connect((err, client, release) => {
  if (err) return console.error('Error acquiring client', err.stack);
  console.log('Successfully connected to PostgreSQL on Render');
  release();
});

/******************************************************/
// 3. WEBHOOK ROUTE (Must come BEFORE express.json()). The webhook allows me to handle events from Stripe
/******************************************************/
app.post('/webhook', express.raw({ type: 'application/json' }), async (request, response) => {
  const sig = request.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
  } catch (err) {
    console.log(`❌ Webhook Error: ${err.message}`);
    return response.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log("💰 Payment received! Saving to DB...");

    // SavePayment is triggered when a payment is successfully executed.
    console.log("Session Data:", session.amount_total); // DEBUG LINE to see the full session object
    console.log("Plan Name:", session.metadata.plan_name); // DEBUG LINE to check if plan_name is being passed correctly

    await savePayment(
      session.customer_details.email,
      session.amount_total / 100,
      session.id,
      session.metadata.plan_name || "EasyPass Plan"
    );
  }
  response.json({ received: true });
});

/******************************************************/
// 4. ENDPOINTs & STATIC FILES
/******************************************************/

// 1. Parse JSON bodies for all routes below this point
app.use(express.json()); // This allows your /login and /register routes to read the form data

// 2. Serve all static files (CSS, JS, Images) from the root project folder
app.use(express.static(path.join(__dirname, '../')));  // This must be first because, it tells Express to look for the static files from the parent directory (where index.html is).

// 3. PAGE ROUTES (Serving HTML files)
app.get('/', (req, res) => { // This gets the index.html file once the parent directory is set as the static folder (previous step)
  res.sendFile(path.join(__dirname, '../index.html'));
});

// 4. API ROUTES (Using the apiRouter)
const apiRouter = express.Router(); // This router will help me to organize the API endpoints.


// ENDPOINTs

// - Fetch products from Stripe (for the frontend to display)
// This is the route for the dashboard.html.  
app.get('/pages/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../pages/dashboard.html'));
});

// Endpoint to fetch products from Stripe (for the frontend to display)
apiRouter.get('/products', async (req, res) => {
  try {
    const products = await stripe.products.list({
      limit: 3,
      active: true,
      expand: ['data.default_price']
    });
    res.json(products.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ENDPOINT - Fetch payments from the database (for the admin dashboard to display)
apiRouter.get('/payments', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM payments ORDER BY created_at DESC');
    console.log('Payments fetched from DB:', result.rows);
    res.json(result.rows); // Send the array of payments back to the frontend
  } catch (err) {
    console.error('Error fetching payments:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ENDPOINT - RSS Feed 
apiRouter.get('/news', async (req, res) => {
  try {
    const newsFeed = await parser.parseURL('https://www.wired.com/feed/category/security/latest/rss');
    // Safety check: Ensure we have items
    if (!newsFeed.items) {
      return res.json([]);
    }

    const topStories = newsFeed.items.slice(0, 5).map(item => ({ // I only want the top 5 items 
      title: item.title,
      link: item.link,
      date: item.pubDate
    }));
    res.json(topStories);
 } catch (error) {
    console.error('RSS Error:', error.message);
    // Send 200 (Success) but with an empty list so the frontend handles it gracefully
    res.status(200).json([]); 
  }

});

// ENDPOINT - Register a new user (for the login system)  - KYLE
apiRouter.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
            'INSERT INTO users (name, email, password) VALUES ($1, $2, $3)',
            [name, email, hashedPassword]
        );
        res.json({ message: "User created successfully" });
    } catch (err) {
        res.status(500).json({ error: "Email already exists or database error" });
    }
});

//ENDPOINT - Login a user (for the login system) - KYLE
apiRouter.post('/login', async (req, res) => {
    const { email, password } = req.body;
    //console.log("Login attempt for:", email); // DEBUG LINE
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            console.log("User not found in DB");
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const match = await bcrypt.compare(password, user.password);
        //console.log("Password match:", match); // DEBUG LINE

        if (match) {
            res.json({ token: "fake-jwt-token", role: user.role || "user" });
        } else {
            res.status(401).json({ message: "Invalid credentials" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// ENDPOINT - Backup vault data to PostgreSQL - Thompson
apiRouter.post('/backup', async (req, res) => {
    const { vaultData } = req.body;

    try {
        // We use a loop to insert every item sent from the dashboard
        for (const item of vaultData) {
            await pool.query(
                'INSERT INTO vault_backups (site_name, username, password) VALUES ($1, $2, $3)',
                [item.site, item.username, item.password]
            );
        }
        res.json({ message: "Vault successfully backed up to database!" });
    } catch (err) {
        console.error("Backup Error:", err);
        res.status(500).json({ error: "Failed to save backup." });
    }
});

// ENDPOINT - Admin manually adds a new user - SHERE
apiRouter.post('/users', async (req, res) => {
    const { name, role } = req.body;
    
    // 1. Generate a default email and password since the Admin form doesn't provide them
    const defaultEmail = `${name.toLowerCase().replace(/\s/g, '')}@easypass.com`;
    const defaultPassword = "ChangeMe123!"; // Users should change this on first login

    try {
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        
        const result = await pool.query(
            `INSERT INTO users (name, email, password, role, status) 
             VALUES ($1, $2, $3, $4, 'Active') 
             RETURNING id AS "_id", name, role, status`,
            [name, defaultEmail, hashedPassword, role || 'user']
        );

        // Return the new user so admin.js can immediately add it to the table
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Admin Add Error:", err);
        res.status(500).json({ error: "Could not add user. Email might already exist." });
    }
});

// GET - Load all users for the Admin Table. - SHERE
apiRouter.get('/users', async (req, res) => {
    try {
        // We select the ID as "_id" to match what admin.js expects
        const result = await pool.query('SELECT id AS "_id", name, role, status FROM users ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error("Error loading users:", err);
        res.status(500).json({ error: "Database error" });
    }
});

// GET - Load global security settings - SHERE
apiRouter.get('/settings', async (req, res) => {
    try {
        const result = await pool.query("SELECT failed_logins AS \"failedLogins\", session_timeout AS \"sessionTimeout\", password_policy AS \"passwordPolicy\" FROM admin_settings WHERE name = 'security'");
        res.json(result.rows[0] || { failedLogins: 0 });
    } catch (err) {
        res.status(500).json({ error: "Failed to load settings" });
    }
});

// PUT - Update settings - SHERE
apiRouter.put('/settings', async (req, res) => {
    const fields = Object.keys(req.body); // e.g., ["sessionTimeout"]
    const values = Object.values(req.body);
    
    // Map frontend camelCase to database snake_case
    const dbField = fields[0] === 'sessionTimeout' ? 'session_timeout' : 
                    fields[0] === 'passwordPolicy' ? 'password_policy' : fields[0];

    try {
        const query = `UPDATE admin_settings SET ${dbField} = $1 WHERE name = 'security' RETURNING *`;
        await pool.query(query, [values[0]]);
        res.json({ message: "Settings updated" });
    } catch (err) {
        res.status(500).json({ error: "Failed to update settings" });
    }
});

// 1. UPDATE USER - Supports Suspend, MFA, and Password Resets
apiRouter.put('/users/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body; // e.g., { status: "Locked" }
    
    // We dynamically build the query based on what the frontend sends
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    
    if (fields.length === 0) return res.status(400).json({ message: "No fields provided" });

    try {
        const query = `UPDATE users SET ${fields[0]} = $1 WHERE id = $2 RETURNING *`;
        const result = await pool.query(query, [values[0], id]);

        if (result.rowCount === 0) return res.status(404).json({ message: "User not found" });

        // Rename id to _id in the response to keep admin.js happy
        const updatedUser = { ...result.rows[0], _id: result.rows[0].id };
        res.json({ message: "User updated", user: updatedUser });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Update failed" });
    }
});

// 2. DELETE USER - Permanently removes a user
apiRouter.delete('/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);
        if (result.rowCount === 0) return res.status(404).json({ message: "User not found" });
        res.json({ message: "User deleted" });
    } catch (err) {
        res.status(500).json({ error: "Delete failed" });
    }
});


// ENDPOINT - Extension looks for credentials by URL. -- SUHANI
apiRouter.get('/vault/search', async (req, res) => {
    const { url } = req.query;
    try {
        const result = await pool.query(
            'SELECT username, password FROM vault_backups WHERE site_name LIKE $1',
            [`%${url}%`]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Database search failed" });
    }
});

app.use('/api/easypassword', apiRouter); // Prefix all API routes with /api/easypassword

/******************************************************/
// 5. DATABASE FUNCTIONS
/******************************************************/
async function savePayment(email, amount, transactionId, planName) {
  const query = `
      INSERT INTO payments (email, amount, transaction_id, plan_name, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *;
    `;
  const values = [email, amount, transactionId, planName];
  try {
    const res = await pool.query(query, values);
    console.log('Payment saved to DB:', res.rows[0]);
  } catch (err) {
    console.error('Error saving payment:', err);
  }
}
/******************************************************/
//  START SERVER (This section must be at the END of the file, after all routes and functions)
/******************************************************/
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));