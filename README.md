# Civil Complaint Management System

## 📖 Overview
The Civil Complaint Management System is a full-stack web application built to digitize and streamline the reporting of public grievances. Traditional complaint filing is often opaque and manual. This platform provides a transparent, trackable, and efficient bridge between citizens and administrative authorities.

## 🎯 Problem Statement
Citizens often face delays and a lack of transparency when reporting local civil issues (e.g., infrastructure damage, sanitation, water supply). Administrators lack a centralized dashboard to prioritize, assign, and track the resolution of these issues. This project solves that by providing a role-based, centralized digital grievance desk.

## 🏗️ System Architecture & Tech Stack
This project is built using a decoupled architecture, separating the client-side interface from the server-side logic to ensure scalability and clean code practices.

* **Frontend (Client):** React.js. Handles state management, routing, and provides a responsive, component-based UI.
* **Backend (API):** Django & Django REST Framework (DRF). Serves as the robust core logic layer, handling secure user authentication, data validation, and API endpoint routing.
* **Database:** SQLite. Relational database management for structured data integrity.
* **Communication:** Asynchronous REST API calls using JSON payload transfer between the React client and Django server.

## ✨ Key Features
* **Role-Based Access Control (RBAC):** Distinct dashboards and permissions for Citizens (submit and track) vs. Administrators (review, update status, resolve).
* **RESTful API Integration:** Seamless and secure data flow across the stack.
* **Real-Time Status Tracking:** Citizens receive immediate visual feedback on the lifecycle of their submitted complaints (Pending -> In Progress -> Resolved).
* **Secure Authentication:** Protected routes and secure password handling.

## 🗄️ Database Design
The relational database is structured to maintain data normalization and integrity:
* **User:** Handles authentication and role-based access control (`is_citizen`, `is_admin`).
* **Complaint:** The core entity containing fields for `title`, `description`, `category` (e.g., Roads, Water), `submission_date`, `status`, and a foreign key linking to the User who submitted it.
* **Department/Category:** Lookup tables to route specific complaints to the correct administrative view.

## 🚀 Future Scope
* Implementation of an automated email notification system for status updates.
* Integration of a mapping API (like Google Maps) for geolocation-based complaint tagging.
* Data analytics dashboard for administrators to view complaint trends over time.

---

## 🛠️ Local Setup and Installation

### Prerequisites
* Python 3.x
* Node.js and npm
* Git

### 1. Backend Setup (Django)
```bash
# Clone the repository
git clone [https://github.com/nishthxaaa/Civil-Complaint-Management-System.git](https://github.com/nishthxaaa/Civil-Complaint-Management-System.git)
cd Civil-Complaint-Management-System

# Create and activate a virtual environment
python -m venv venv
# On Windows: venv\Scripts\activate
# On Mac/Linux: source venv/bin/activate 

# Install dependencies and setup database
pip install -r requirements.txt
python manage.py migrate

# Start the Django server
python manage.py runserver
```
### 2. Frontend Setup (React)
Open a new terminal window/tab:
```bash
# Navigate to the React app directory
cd my-react-app

# Install dependencies
npm install

# Start the development server
npm start
```
