## Tasks for this Project

### Frontend

- [x] **Structure the data and functions** on the frontends for convenient use.
- [x] **Create history list elements** that proportionally display status duration.
- [x] **Display possible status text** under the last check timer.
- [x] **Define the layout structure.**
- [x] **Add loading placeholders** for status and history to prevent layout shifting; add icons (favicon and Apple touch icons).
- [x] **Update HTML metadata** and resolve all accessibility warnings.
- [x] **Build app into one inline file.**
- [x] **Implement a `setInterval`** to fetch data every minute and add a countdown timer showing the time remaining until the next update.
- [x] **Handle long time statuses** on frontend, after implementing history limit on backend.
- [x] **Dynamic Styling:** Once the backend part is ready, apply colors representing power status (on/off) and time of day (day/night) based on sunrise/sunset data.
- [x] **Create my own Date functions** and compare bunlde size when with date-fns.
- [x] **Handle maintanance mode** and errors, to not fetch every second and handle displayed text accordingly.
- [x] **Unify styles and add manifest images.**
- [ ] **Documentation & Links:** Create a GitHub README with setup instructions and add buttons on the page linking to my personal website and the repository.

### Backend

- [x] **Limit history results** to a maximum of one week (or at least the most recent record).
- [x] **Secure the router:** Disable Wi-Fi and WPS to ensure the device only accepts connections via Ethernet.
- [x] **Add security middleware** and compression.
- [x] **Rewrite updateStatus function** so it will construct new history array only one time and feed it into updateHistory and update full status.
- [x] **Add sunset and sunrise library** and integrate it in returned data.
- [x] **Add meintanance mode** functionality and routes.
- [x] **Integrate a Telegram bot** for notifications.
- [x] **Add storage files regular backup** and implement safe file read/write responces, to reduce undefined cases.
- [ ] **Implement log rotation:** Save storage files monthly; concatenate the last two months of history to ensure seamless data transitions at the start of a new month.
- [ ] **Add HTML template** for maintenance and items deletion call results.
- [ ] **Add history items deletion from url**, to be able to delete wrong statuses when have no access to server.
