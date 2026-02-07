## Tasks for this Project

### Frontend

- [+] **Structure the data and functions** on the frontends for convenient use
- [+] **Create history list elements** that proportionally display status duration.
- [+] **Display possible status text** under the last check timer.
- [+] **Define the layout structure.**
- [ ] **Add loading placeholders** for status and history to prevent layout shifting; add icons (favicon and Apple touch icons).
- [ ] **Update HTML metadata** and resolve all accessibility warnings.
- [ ] **Implement a `setInterval`** to fetch data every minute and add a countdown timer showing the time remaining until the next update.
- [ ] **Dynamic Styling:** Once the backend is ready, apply colors representing power status (on/off) and time of day (day/night) based on sunrise/sunset data.
- [ ] **Documentation & Links:** Create a GitHub README with setup instructions and add buttons on the page linking to your personal website and the repository.

### Backend

- [ ] **Limit history results** to a maximum of one week (or at least the most recent record).
- [+] **Secure the router:** Disable Wi-Fi and WPS to ensure the device only accepts connections via Ethernet.
- [+] **Add security** and compression middleware packages
- [ ] **Rewrite updateStatus function** so it will construct new history array only one time and feed it into updateHistory and update full status.
- [ ] **Add sunset and sunrise library** and integrate it in returned data
- [ ] **Integrate a Telegram bot** for notifications.
- [ ] **Implement log rotation:** Save storage files monthly; concatenate the last two months of history to ensure seamless data transitions at the start of a new month.
