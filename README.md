# 🔐 EasyPass - Password Manager

##  Project description

### 🎯 Overview
This the "EasyPass" prject which is full-stack password management solution designed as a browser extension and web application. 
Easypass allows users to store, encrypt, and sync their credentials across devices. it combines a cloud-based vault with local encryption for maximum security


## ✨ Features

### 🌟 Products Information
Eassy password provides a solid web plataform where all products information is displayed in a friendly user view. Currently all products information is mastered by the Stripe site and it is automatically rendered in the EasyPass web side.

The information gotten from Stripe sites conforms the three key products:

1. Personal plan.
2. Premium plan. 
3. Family plan.

### Product selling
EasyPass uses a the stripe checkout templates to ensure the credit card information follows security policies already provided by Stripe company.


### 👨‍💼 Login (Kyle)

### 📝 Save and Auto fill (Suhani)

### 🎨 Admin dashboard (Shere)

### 🔒 User dashboard (Thompson)




---

## 🚀 Running locally

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** (comes with Node.js)
- **PostgreSQL** (local or cloud instance)
- **Google Chrome** (for browser extension)

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/2026-Winter-ITC-5202-0NA/final-project-js_novices_easypass.git
   cd final-project-js_novices_easypass
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

### Environment Configuration

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000

# Database Configuration
DATABASE_URL=postgresql://postgressql_easypassword_user:HTxnxSfbKtwdomgWRKcQuLle7ymE7dvT@dpg-d740cpnfte5s73b9b6k0-a.virginia-postgres.render.com/postgressql_easypassword

# Stripe Configuration
STRIPE_WEBHOOK_SECRET=whsec_pqHXFR1gC6mjT0UeUaxH4xjJeiPNlXF4
```

### Running the Application

Start the development server:

```bash
node js/server.js
```

The server will start on `http://localhost:3000`

---


## 🔴 API Documentation

APIs created in this project:

### News Feed
```http
GET /api/easypassword/news
```
Fetches the latest security news via RSS.

### Products
```http
GET /api/easypassword/products
```
Fetches the active product list and pricing directly from Stripe.

### Payments
```http
GET /api/easypassword/payments
```
Retrieves the full history of successful transactions from the payments table in PostgreSQL.
---

## 🌐 Deployment

The application is deployed and accessible at:

https://easypassword.onrender.com/

### Deployment Platform
- **Hosting**: Render
- **Database**: PostgreSQL 

---

## 🛠 Tech Stack

### Frontend
- **HTML5, CSS3, JavaScript (ES6+)**
- **Tailwind CSS** - Utility-first styling
- **Chrome Extension APIs** - Browser integration

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **JWT** - Authentication
- **CryptoJS** - Client-side encryption

### Deployment
- **Render** - Cloud hosting platform

---

## 👥 Team

Team members and responsabilities:

**Shere**: Admin Dashboard.

**Suhani**: Extension Autofill.

**Kyle**:  Login & Register.

**Thompson**: User Dashboard.

**Javier**: RSS News, Product Information, Purchase products, Payment History, Others.


---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/NewFeature`)
3. Commit your changes (`git commit -m 'Add something'`)
4. Push to the branch (`git push origin feature/NewFeature`)
5. Open a Pull Request

---



**Built with ❤️ by the JS Novices Team**


