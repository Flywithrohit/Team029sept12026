# Small Business Operations Platform (Frontend - Milestone 2)

## Overview

This is the frontend part of our Small Business Operations Platform project.

For this milestone, the focus was on building the UI and showing how the system will work from a user’s perspective. The application includes different dashboards and flows for roles like admin, employee, recruiter, and sales.

Everything runs in the browser, so no backend setup is required.

---

## What’s Included

* Login and registration pages
* Role-based dashboards (Admin, Manager, Employee, Recruitment, Sales)
* Profile section
* Employee features (attendance, salary, leaves)
* Recruitment module (requirements, candidates, logs)
* Sales module (leads, follow-ups, stats)

All pages are connected and navigation works across the app.

---

## How to Run

### Recommended way

Open terminal in the project folder and run:

```id="d08a4n"
python -m http.server 5500
```

Now open:

```id="bb2b9n"
http://localhost:5500/frontend/index.html
```

Important:
If you open only `http://localhost:5500`, you will see a file list.
Make sure to open the file inside the **frontend folder**.

---

### Alternative (may not work in some browsers)

You can try opening:

```id="ntdx2i"
frontend/index.html
```

But some browsers block JavaScript modules when opened directly.

---

## Demo Login Credentials

* admin / Admin@123
* manager / Manager@123
* employee / Employee@123
* recruiter / Recruiter@123
* sales / Sales@123

---

## Mock API (How data works)

There is no real backend connected in this milestone.

All API calls are handled inside:

```id="plsfyq"
frontend/js/mockApi.js
```

* Axios intercepts requests and returns mock responses
* No real network calls are made
* Data is stored in browser `localStorage`
* This helps simulate real application behavior

---

## Folder Structure

```id="u6t26c"
project-root/
├── frontend/
│   ├── index.html
│   ├── js/
│   │   ├── app.js
│   │   ├── router.js
│   │   ├── store.js
│   │   ├── mockApi.js
│   │   └── components/
│
├── README.md
```

---

## Notes

* This is a frontend-only submission for Milestone 2
* Backend is intentionally not included
* The focus is on UI design, navigation, and structure
* Backend integration will be done in later milestones

---

## Future Work

* Connect with backend APIs
* Add database integration
* Improve validations and error handling
* Enhance role-based access control