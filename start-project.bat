@echo off
echo Starting ColaCommerce AI...

start cmd /k "cd /d C:\Users\HP\Desktop\cola-commerce-ai\backend && npx nodemon server.js"

start cmd /k "cd /d C:\Users\HP\Desktop\cola-commerce-ai\frontend && npm run dev"

timeout /t 5

start http://localhost:3000

echo Project started.