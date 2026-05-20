# 🐾 PetNest Platform Server

Backend server for the PetNest pet adoption platform built with Node.js, Express.js, and MongoDB.

---

## 🌐 Live Server URL

🔗 https://pet-nest-platform-server.vercel.app

---

## 📌 Purpose

This server handles:

- Pet data management
- MongoDB database operations
- Search, filter & sorting APIs
- Authentication & authorization
- Adoption request handling
- Secure REST API endpoints

---

## ✨ Features

- 🐶 CRUD operations for pets
- 🔍 Search pets using MongoDB `$regex`
- 🐾 Filter pets by species using `$in`
- 🔐 JWT Authentication Middleware
- 🌍 MongoDB Atlas integration
- ⚡ Fast REST API with Express.js
- 🚀 Vercel deployment support
- 🧾 Environment variable security
- 📦 Organized API routes

---

## 🛠️ Technologies Used

- Node.js
- Express.js
- MongoDB
- JWT
- CORS
- dotenv
- Vercel

---

## 📦 NPM Packages Used

```bash
npm install express mongodb cors dotenv jsonwebtoken
npm install nodemon
```

---

## 🚀 Installation

### Clone Repository

```bash
git clone https://github.com/shakil218/petNest-platform-server.git
```

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

---

## 📂 Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

---

## 📁 Project Structure

```bash
petNest-platform-server/
│
├── node_modules/
├── .env
├── .gitignore
├── index.js
├── package.json
├── package-lock.json
├── vercel.json
└── README.md
```

---

## 🚀 Deployment

This server is deployed using Vercel.

### Deploy Command

```bash
vercel --prod
```

---

## 👨‍💻 Author

Developed by Shakil 🚀
