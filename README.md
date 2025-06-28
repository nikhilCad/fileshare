# Dropbox Lite

## Getting Started

This project is the frontend for Dropbox Lite, a simple file upload and download dashboard.


## Prerequisites

- Node.js (v18+ recommended)
- npm (v9+ recommended)
- The backend server (Go) running (see below)

## 1. Clone the Repository

```
git clone https://github.com/nikhilCad/fileshare.git
cd dropbox-lite-frontend
```

## 2. Install Dependencies

```
npm i
```

## 3. Start the Frontend

```
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser, or check if nextjs has opened the server in any other port.


## 5. Backend Setup (Go)

- Go to the backend folder:
  ```
  cd ../dropbox-lite-backend
  ```
- Install Go dependencies:
  ```
  go mod tidy
  ```
- Start the backend:
  ```
  go run main.go
  ```
- The backend will run on [http://localhost:8080](http://localhost:8080)


## 6. Features

- Upload, list, download, and delete files
- Light/dark mode and custom gradient theme
- Cute kitten mascot and friendly UI


## 7. Notes

- Make sure the backend is running before using the frontend.
- Theme and gradient settings are stored in the backend DB.
- For any issues, check the browser console and backend logs.
