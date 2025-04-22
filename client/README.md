# Xist

**Xist** is a next‑generation, real‑time messaging and communication application built with Next.js, React, Socket.IO, Simple‑Peer and backed by Express, Prisma, and Supabase. It provides secure user authentication, real‑time text messaging, file and media sharing, and peer‑to‑peer audio/video calling—delivered in a responsive, modern UI powered by ShadCN, TailwindCSS, and Ant Design Icons.

---

## 🚀 Features

- 🔐 **Authentication**  
  Secure sign‑in/up flows using NextAuth.js with support for multiple OAuth providers and email/password.  

- 💬 **Real‑time Chat**  
  Bi‑directional, low‑latency messaging with Socket.IO:  
  - One‑to‑one and group conversations  
  - Typing indicators & read receipts  
  - Online/offline presence  

- 📁 **File & Media Sharing**  
  Send images, videos, documents and other files:  
  - Client‑side previews  
  - Drag‑and‑drop or file picker  
  - Secure, expiring upload URLs via Supabase Storage  

- 📹 **Peer‑to‑Peer Audio & Video Calls**  
  Simple‑Peer + WebRTC for direct media streams:  
  - Audio calls with mute/unmute, volume indicators  
  - Video calls with start/stop camera, picture‑in‑picture  
  - Call timer, call accept/decline UI  
  - (Planned) screen sharing & group calls  

- 🔧 **Call & Connection Management**  
  - Automatic reconnection handling  
  - Call history stored in database  
  - Busy/Do Not Disturb status  

- 📱 **Responsive UI**  
  - TailwindCSS + ShadCN component library  
  - Ant Design Icons for consistency  
  - Dark mode & light mode toggle  

- ☁️ **Scalable Backend**  
  - Express‑based WebSocket server deployed on Render  
  - Prisma ORM over PostgreSQL (Supabase)  
  - Stateless API routes in Next.js  

---

## 🛠️ Tech Stack

| Layer              | Technology                |
| ------------------ | ------------------------- |
| **Framework**      | Next.js 13                |
| **UI**             | React, TailwindCSS, ShadCN, Ant Design Icons |
| **Real‑Time Sync** | Socket.IO                 |
| **P2P Media**      | Simple‑Peer (WebRTC)      |
| **Auth**           | NextAuth.js               |
| **Backend**        | Express.js                |
| **Database**       | PostgreSQL (Supabase)     |
| **ORM**            | Prisma                    |
| **Storage**        | Supabase Storage          |
| **Deployment**     | Vercel (frontend), Render (backend) |

---
