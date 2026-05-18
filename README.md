
# JobTrack 💼

JobTrack is a web-based job application tracking system explicitly designed to help students and early-career professionals organize, streamline, and take control of their job search process. By gathering all application workflows into a single centralized platform, JobTrack simplifies your search, keeps deadlines clear, and helps reduce missed opportunities.

## 🚀 Key Features

- **Centralized Job Application Logging:** Input and organize all your job targets (Job Title, Company Name, Due Date, Status, URL) in one structured view.
- **Real-Time Status Tracking:** Efficiently manage your pipeline as applications move through stages like *Planned, Applied, Online Assessment, Interview, Pending, Rejected,* or *Offer*.
- **Interview Prep Material Management:** Directly upload and reference voice notes, code snippets, documentation, or image files tailored to specific interviewed roles.
- **Analytics Dashboard:** Gain a clear visual overview of your search metrics and interview success rates at a quick glance.
- **Secure Authentication:** Built-in account protection restricting application data access safely to single users via an encrypted email/password gateway.

---
UI
// LOGIN PAGE 
<img width="1440" height="614" alt="Ekran Resmi 2026-05-03 ÖÖ 5 34 37" src="https://github.com/user-attachments/assets/0a586ba8-ffd5-4e8c-87f5-eae92be46d66" />
NOTE: This is a one user system.DB only stores the user's login credentials.

//DASHBOARD
<img width="1440" height="763" alt="Ekran Resmi 2026-05-03 ÖÖ 6 02 37" src="https://github.com/user-attachments/assets/e91f4394-18b0-4b93-8520-d233164c8008" />
<img width="1440" height="779" alt="Ekran Resmi 2026-05-03 ÖÖ 6 02 47" src="https://github.com/user-attachments/assets/c9c08e56-89fd-423b-a81f-7f680e297cfe" />

//ADD APPLICATION BUTTON
<img width="585" height="736" alt="Ekran Resmi 2026-05-18 ÖÖ 12 37 05" src="https://github.com/user-attachments/assets/1e16f630-6e50-4b9a-a2df-af3f0cebc297" />

//ADD MATERIAL BUTTON
<img width="902" height="726" alt="Ekran Resmi 2026-05-18 ÖÖ 12 39 43" src="https://github.com/user-attachments/assets/6aa17e38-77fb-4398-baa0-7a70db190865" />


## 🛠️ Tech Stack & Architecture

JobTrack leverages a robust, decoupled Client-Server architecture:

### Frontend
- **HTML5 & CSS3**
- **React.js** (Dynamic User Interfaces & component-driven state routing)
- **Chart.js** (Graphical donut/pie representations of pipeline metrics)

### Backend
- **Python / Flask API** (Lightweight, flexible REST framework)

### Development Tools
- **IDE:** Visual Studio Code  
- **Versioning & CI/CD:** GitHub  

---

## 🗺️ System Blueprint 

A standard user interacts with the system engine by triggering these verified core behaviors:
- **Authenticate User:** Sign up or log into secure accounts.
- **Create / View Job Application:** Register target fields into an elegant tabular overview.
- **Update Application Status:** Shift dynamic state blocks linearly relative to interview progression.
- **Manage Interview Materials:** Save core files matching technical challenge criteria.
- **Delete Job Application:** Remove dead entries safely from records.

---

## 🛠️ Installation & Setup (Local Development)

### Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- MongoDB (Running locally or a cloud-hosted MongoDB Atlas URI string)

### 1. Clone the Project
```bash
git clone [https://github.com/your-username/jobtrack.git](https://github.com/your-username/jobtrack.git)
cd jobtrack

```

### 2. Backend Environment Configuration

```bash
# Navigate to backend path
cd backend

# Establish virtual environment setup
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate

# Install requirements
pip install -r requirements.txt

# Start your Flask Server API
python app.py

```

### 3. Frontend Node Interface Configuration

```bash
# Navigate to frontend path
cd ../frontend

# Install dependencies
npm install

# Deploy development pipeline environment locally
npm start

```

*Your application should now map cleanly on your local client route at `http://localhost:3000`!*

---

## 📌 Development Status & Roadmap

* [x] Secure User Account Sign-In / Sign-Up Validation Framework (Completed)
* [x] Complete RESTful Application Model CRUD Framework Engine (Completed)
* [x] Media & Document Upload Portal matching Active Interview Materials (Completed)
* [x] Chart.js Dashboard visual dynamic metric compilation engine (Completed)
* [ ] Update UI Reposition buttons and Containers/Materials (Future Release Pipeline)
* [ ] Push Alerts Engine & Dynamic Reminders Interface System (Future Release Pipeline)
* [ ] Automated Duplicate Flag checking mechanism (Future Release Pipeline)

---


