# FarePlay

![FarePlay Logo](fareplay_logo.png)

This repository is the Express backend for FarePlay, the cutting-edge ride-hailing aggregator that simplifies the process of finding the best ride-hailing options for your destination. With FarePlay, users can easily compare prices and select the most suitable ride-hailing application based on their preferences and budget.

## Requirements
- Node.js (tested on v18.3.0)
- MySql (tested on v8.0.33)

## Installation

To setup FarePlay backend, follow these steps:

1. Clone the FarePlay repository to your local machine:
   ```bash
   git clone https://github.com/shadowezz/fareplay.git
   ```

2. Install the necessary dependencies:
   ```bash
   cd fareplay
   npm install
   ```

3. Follow the `.env.example` template to create a `.env` file with the corresponding config parameters

4. Create the `Session` table in your database by executing the `scripts/database/sessions.sql` script

4. Start the express server:
   ```bash
   npm run dev
   ```

5. FairPlay backend is now running at `http://localhost:5001` in your web browser.