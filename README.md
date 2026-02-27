# 🎰 Crypto Gamefi 🎮

**Scissors • Crash • Mines • Turtle • Plinko • Dice • Slot Game**
A modern crypto-powered gaming platform supporting multi-chain tokens and exciting on-chain games.

![Platform Preview](https://github.com/user-attachments/assets/a770c0e9-b45b-49f2-90a7-c215562f0b58)

---

## 🕹️ Games Included

| Game               | Description                       | Preview                                                                                      |
| ------------------ | --------------------------------- | -------------------------------------------------------------------------------------------- |
| ✂️ **Scissors**    | Classic multiplayer hand game     | ![Scissors](https://github.com/user-attachments/assets/f75023fb-3788-40a6-ac73-adfa97c70a42) |
| 🚀 **Crash**       | Bet before the graph crashes!     | ![Crash](https://github.com/user-attachments/assets/aad8c424-e791-4326-97c0-38606ae89bc0)    |
| 💣 **Mines**       | Find safe spots, avoid bombs!     | ![Mines](https://github.com/user-attachments/assets/5890bc2d-23ac-4c3c-b402-19759c577507)    |
| 🐢 **Turtle Race** | Race to win in a thrilling format | ![Turtle](https://github.com/user-attachments/assets/5cd8b3c1-0f53-48c6-b660-0aba7836dc2f)   |
| 🎲 **Dice**        | Traditional luck-based dice game  | ![Dice](https://github.com/user-attachments/assets/b331fe0d-871a-4f4e-aea4-bf4a4cf6e74c)     |
| 🎰 **Slot**        | Spin the reels, win rewards!      | ![Slot](https://github.com/user-attachments/assets/b46a5c71-22cd-4ce7-b549-5fb451c31b87)     |

---

## 💰 Supported Cryptocurrencies

* ⊘ Bitcoin (BTC)
* Ξ Ethereum (ETH)
* $ Abstract
* 🟡 Binance Smart Chain (BSC)
* 🔷 Solana (SOL)
* 💵 USDT (All major chains)

---

## 🏗️ Project Structure

### Frontend (Port: `8800`)

* Game UI and wallet interactions
* Real-time Socket.IO updates
* User account dashboard

### Admin Panel (Port: `9000`)

* Game & user management
* Live transaction monitoring
* Platform analytics

### Backend (Microservices)

| Service                    | Port |
| -------------------------- | ---- |
| Main Server                | 5000 |
| Admin Service              | 6100 |
| Scissors Game              | 5200 |
| Chatroom Service           | 4900 |
| Management Service         | 4000 |
| ... and more game services |      |

---

## 🚀 Getting Started

### ✅ Prerequisites

* Node.js `v16` (Backend)
* Node.js `v14` (Frontend & Admin)
* MongoDB instance
* Web crypto wallet (MetaMask, TrustWallet, etc.)

### 🧠 Backend Setup

```bash
cd backend
npm install

# Start services
npm start              # Main server
npm run scissors       # Scissors game
npm run crash          # Crash game
npm run chatroom       # Chat system
npm run manage         # Management service
```

### 🎨 Frontend Setup

```bash
cd frontend
npm install
npm start
```

### 🛠️ Admin Panel Setup

```bash
cd admin
npm install
npm start
```

---

## ⚙️ Configuration

Create `.env` files in each of the `backend`, `frontend`, and `admin` folders:

```env
# Example for Backend
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret
TATUM_API_KEY=your_tatum_api_key
WEB3_PROVIDER=https://mainnet.infura.io/v3/your_key
```

---

## 🛡️ Security Highlights

* 🔐 JWT-based auth
* 🧪 Two-Factor Authentication (2FA)
* 🔗 Secure wallet integration
* 🛑 DDoS Protection
* ⚡ Rate Limiting

---

## 🧱 Tech Stack

* **Backend**: Node.js + Express.js
* **Frontend**: React.js
* **Database**: MongoDB
* **Real-Time**: Socket.IO
* **Blockchain**: Web3.js, Ethers.js, TronWeb
* **Payments**: Tatum API

---

## 🌉 Blockchain & API Integration

* Multi-chain Web3 Providers
* Native node access
* Tatum for wallet & transaction processing

---

## 📦 Key Features

* 🔁 Real-time multiplayer gameplay
* 👛 Multi-currency wallet support
* 🗨️ Live chat
* 📊 Game and transaction history
* 🧾 Admin dashboard & analytics
* ⚡ Instant crypto payouts

---

## 🤝 Contributing

1. Fork the repo 🍴
2. Create your feature branch 🌱
3. Commit changes 💾
4. Push the branch 🚀
5. Open a Pull Request ✅

---

## 📄 License

This project is licensed under the **ISC License**.
Feel free to build and contribute — responsibly and legally!
