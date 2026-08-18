# redialing UI components for Students, Attendance, and Results

We will update the layouts of `StudentsView.jsx`, `AttendanceView.jsx`, and `ResultsView.jsx` inside [`c:\Users\ravi kumar\Desktop\school-web\components`](file:///c:/Users/ravi%20kumar/Desktop/school-web/components) to match the newly uploaded mockup screenshots.

## Proposed Changes

### 1. Students View (Student Directory with Quick View Sidebar)
We will update [`StudentsView.jsx`](file:///c:/Users/ravi%20kumar/Desktop/school-web/components/StudentsView.jsx) to match the Student Directory mockup:
- Render a table-style list of students on the left (columns: checkbox, Name/Phone, Admission ID, Class, Status).
- Add a **Quick View** sidebar panel on the right:
  - Header: Close button, initials avatar badge, Student Name, ID/Class, and status tag.
  - Metrics: **Attendance (Current Term)** progress bar (e.g., 92%, Present: 46 Days, Absent: 4 Days).
  - Fees: **Fee Status** boxes showing Tuition ($1,200 PAID) and Library Dues ($45 OVERDUE).
  - Guardian: **Primary Guardian** details box showing Father's name, phone, and email.
  - Buttons: "Message" and "Full Profile" (clicking "Full Profile" toggles this panel into the Edit Profile Form).

---

### 2. Attendance View (Mark Daily Attendance with Summary Sidebar)
We will update [`AttendanceView.jsx`](file:///c:/Users/ravi%20kumar/Desktop/school-web/components/AttendanceView.jsx)'s daily register tab to match the Mark Daily Attendance mockup:
- Render a split-screen register desk:
  - **Left table**: Roll, Student Name, and Attendance Status toggles (Present / Absent / Late buttons).
  - **Right panel**: **Summary** card showing counts (Class Total, Present, Absent, Late), a horizontal color breakdown bar, and a "Submit Attendance" primary button.

---

### 3. Results View (Result Management Stats & Table)
We will update [`ResultsView.jsx`](file:///c:/Users/ravi%20kumar/Desktop/school-web/components/ResultsView.jsx)'s saved results tab to match the Result Management mockup:
- Render stats cards at the top:
  - **Overall Pass Rate** (87.5%).
  - **Top Class** (Grade 10-A, Avg Score: 92%).
  - **Grade Distribution** (chart bars representing counts of A+, A, B, C grades).
- Render a **Recent Results** table listing Student Name, Student ID, Class, Percentage, Grade, and Print/Edit Actions, replacing the grid card elements.

## Verification Plan

### Automated Tests
- Run `npm run build` to confirm compiling and routes generation completes successfully.

### Manual Verification
- Review served views at `http://localhost:3000` to verify:
  1. The student directory lists rows and displays the Quick View sidebar on click, with full profile editing toggles.
  2. The daily attendance register renders Present/Absent/Late toggles alongside the summary panel.
  3. The saved exam results show top metrics and table rows.
