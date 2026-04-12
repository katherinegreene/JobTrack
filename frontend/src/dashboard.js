//dashboard.js
import { useEffect, useState } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import "./dashboard.css";
import { useRef } from "react";
import { PieController } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend, PieController);//chart js features arc element =pie donut chart,Tooltip= pop up info when hovered,Legend =color
function Dashboard() {
    const [applications, setApplications] = useState([]);//current array 
    const [showForm, setShowForm] = useState(false)
    const [newApp, setNewApp] = useState({
        companyName: "",
        jobTitle: "",
        status: "Interview",
        dueDate: "",
        salary: "",
        location: "",
        Url: "",
    });
    const canvasRef = useRef(null);  //  Canvas ref
    // Filtering Upcoming Interviews by due date
    const today = new Date();
    today.setHours(0, 0, 0, 0); //????

    const twoWeeksLater = new Date();
    twoWeeksLater.setDate(today.getDate() + 14);

    // upcoming = Interview apps within next 14 days
    const upcoming = applications.filter(app => {
        if (app.status !== "Interview" || !app.dueDate) return false;

        const due = app.dueDate; // still a string "YYYY-MM-DD"
        const todayStr = today.toISOString().split('T')[0];
        const twoWeeksStr = twoWeeksLater.toISOString().split('T')[0];

        return due >= todayStr && due <= twoWeeksStr;
    });

    // past = anything outside upcoming (either status not Interview or past Interview)
    const past = applications.filter(app => {
        if (!app.dueDate) return true; // no date, consider past
        const due = new Date(app.dueDate);
        return app.status !== "Interview" || due < today || due > twoWeeksLater;
    });
    const appliedCount = applications.filter(app => app.status === "Applied").length;
    const pieData = {
        labels: ["Applied", "Upcoming Interviews"],
        datasets: [{
            data: [appliedCount, upcoming.length],
            backgroundColor: ["#4CAF50", "#FF9800"],
            borderColor: "#ffffff",
            borderWidth: 2,
        }]
    };
    //const for tracking which application is being viewed/selected for materials section
    const [selectedAppForMaterials, setselectedAppForMaterials] = useState(null);////////////



    /// ADD APPLICATION connected to mongo db
    function addApplication(app) {
        fetch("http://127.0.0.1:5000/add_application", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(app),

        })
            .then(res => res.json())
            .then(data => {
                // Update local state with the object returned from backend (includes _id from MongoDB)
                setApplications([...applications, data]);
                setShowForm(false);
                // Reset form
                setNewApp({
                    companyName: "",
                    jobTitle: "",
                    status: "Interview",
                    dueDate: "",
                    salary: "",
                    location: "",
                    Url: "",
                });
            })
            .catch(err => console.error("Error adding application:", err));
    }
    ///pie chart use effect 
    useEffect(() => {
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx && pieData.datasets[0].data.some(d => d > 0)) {
            new ChartJS(ctx, {
                type: 'pie',
                data: pieData,
                options: { responsive: false, plugins: { legend: { position: "bottom" } } }
            });
        }
    }, [applications]);

    //use effect populates applicatios from mongodb.Each application has status,title etc.
    useEffect(() => {
        fetch("http://127.0.0.1:5000/dashboard")
            .then(res => res.json())
            .then(data => setApplications(data));
    }, []);




    return (
        <div>
            {showForm && (
                <div className="popup-form">
                    {/*close button for the new application button*/}
                    <button className="close-button" onClick={() => setShowForm(false)}>
                        x
                    </button>
                    <h3>New Application</h3>
                    <label>
                        Company:
                        <input
                            type="text"
                            value={newApp.companyName}
                            onChange={e => setNewApp({ ...newApp, companyName: e.target.value })}
                        />
                    </label>
                    <label>
                        Job Title:
                        <input
                            type="text"
                            value={newApp.jobTitle}
                            onChange={e => setNewApp({ ...newApp, jobTitle: e.target.value })}
                        />
                    </label>
                    <label>
                        Status:
                        <div className="status-options">
                            <label>
                                <input
                                    type="radio"
                                    name="status"
                                    value="Applied"
                                    checked={newApp.status === "Applied"}
                                    onChange={e => setNewApp({ ...newApp, status: e.target.value })}
                                />
                                Applied
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="status"
                                    value="Interview"
                                    checked={newApp.status === "Interview"}
                                    onChange={e => setNewApp({ ...newApp, status: e.target.value })}
                                />
                                Interview
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="status"
                                    value="Offer"
                                    checked={newApp.status === "Offer"}
                                    onChange={e => setNewApp({ ...newApp, status: e.target.value })}
                                />
                                Offer
                            </label>
                        </div>
                    </label>
                    <label>
                        Due Date:
                        <input
                            type="date"
                            value={newApp.dueDate}
                            onChange={e => setNewApp({ ...newApp, dueDate: e.target.value })}
                        />
                    </label>
                    <label>
                        Salary:
                        <input
                            type="text"
                            value={newApp.salary}
                            onChange={e => setNewApp({ ...newApp, salary: e.target.value })}
                            placeholder="e.g., 5000 USD or 4500 EUR"
                        />
                    </label>
                    <label>
                        Location:
                        <input
                            type="text"
                            value={newApp.location}
                            onChange={e => setNewApp({ ...newApp, location: e.target.value })}
                        />
                    </label>
                    <label>
                        Url:
                        <input
                            type="text"
                            value={newApp.Url}
                            onChange={e => setNewApp({ ...newApp, Url: e.target.value })}
                        />
                    </label>

                    <button onClick={() => addApplication(newApp)}>SAVE</button>
                </div>

            )}
            {selectedAppForMaterials && (
                <div className="popup-form-materials">
                    <button className="close-button" onClick={() => setselectedAppForMaterials(null)}>x</button>
                    <h3>Materials:{selectedAppForMaterials.companyName}</h3>
                    <div className="materials-container">
                        {/* Left Section */}
                        <div className="materials-section">
                            <h4>Add Recording</h4>
                            <div className="placeholderbox">🎙️ Voice Notes</div>
                        </div>
                        {/* Right Section */}
                        <div className="materials-section">
                            <h4>Add Files</h4>
                            <div className="placeholderbox">📁 PDF/Docs</div>
                        </div>
                    </div>
                </div>
            )}
            <div>

                <div>

                    <h1 className="dashboard-title">JobTrack</h1>

                    {/* Main dashboard container */}
                    <div className="dashboard-container">
                        {/* ADD GRAPHICS LATER ON  */}
                        <div className="dashboard-header">
                            <h4>Dashboard Graphics</h4>
                        </div>
                        <div className="chart-container">

                        </div>

                        <div className="dashboard-header">
                            <button className="add-application-button" /* ADD APPLICATION BUTTON */ onClick={() => setShowForm(true)}>
                                Add Application
                            </button>
                        </div>
                        <div className="section application-card" /*Upcoming Interviews*/>

                            <h2>Upcoming Interviews</h2>
                            <div className="application-titles">
                                <span className="company">COMPANY</span>
                                <span className="job">JOB TITLE</span>
                                <span className="status">STATUS</span>
                                <span className="due-date">DUE DATE</span>
                                <span className="salary">SALARY</span>
                                <span className="location">LOCATION</span>
                                <span className="url">LINK</span>
                                <span className="actions">MATERIALS</span>
                                <span className="materials">ACTIONS</span>

                            </div>

                            {upcoming.map(app => (/*Small headers for application*/
                                <div key={app._id} className="application-card-row">
                                    <span className="company">{app.companyName}</span>
                                    <span className="job">{app.jobTitle}</span>
                                    <span className="status">{app.status}</span>
                                    <span className="due-date">{app.dueDate}</span>
                                    <span className="salary">{app.salary}</span>
                                    <span className="location">{app.location}</span>
                                    <span className="url">{app.Url ? <a href={app.Url}>Link</a> : "No Link"/*Is there a URL? then show this link: otherwise show No link */}

                                    </span>
                                    <span className="materials"><button className="add-material-button" onClick={() => setselectedAppForMaterials(app)}>
                                        +
                                    </button></span>
                                    <span className="actions">Edit</span>
                                </div>
                            ))}
                            {upcoming.length === 0 && <p>No upcoming interviews</p>}
                        </div>
                        {/* Urgent Applications */}
                        <div className="section application-card">
                            <h2 >Urgent Applications</h2>
                            <div className="application-titles">
                                <span className="company">COMPANY</span>
                                <span className="job">JOB TITLE</span>
                                <span className="status">STATUS</span>
                                <span className="due-date">DUE DATE</span>
                                <span className="salary">SALARY</span>
                                <span className="location">LOCATION</span>
                                <span className="materials">MATERIALS</span>
                                <span className="actions">ACTIONS</span>
                            </div>
                            {upcoming.map(app => (/*Small headers for application*/
                                <div key={app._id} className="application-card-row">
                                    <span className="company">{app.companyName}</span>
                                    <span className="job">{app.jobTitle}</span>
                                    <span className="status">{app.status}</span>
                                    <span className="due-date">{app.dueDate}</span>
                                    <span className="salary">{app.salary}</span>
                                    <span className="location">{app.location}</span>
                                    <span className="url">{app.Url ? <a href={app.Url}>Link</a> : "No Link"/*Is there a URL? then show this link: otherwise show No link */}

                                    </span>
                                    <span className="materials"><button className="add-material-button" onClick={() => setselectedAppForMaterials(app)}>
                                        +
                                    </button></span>
                                    <span className="actions">Edit</span>
                                </div>
                            ))}
                            {upcoming.length === 0 && <p>No upcoming interviews</p>}
                        </div>

                        {/* Past Applications */}
                        <div className="section application-card">
                            <h2>Past Applications</h2>
                            <div className="application-titles">
                                <span className="company">COMPANY</span>
                                <span className="job">JOB TITLE</span>
                                <span className="status">STATUS</span>
                                <span className="due-date">DUE DATE</span>
                                <span className="salary">SALARY</span>
                                <span className="location">LOCATION</span>
                                <span className="materials">MATERIALS</span>
                                <span className="actions">ACTIONS</span>
                            </div>
                            {past.length === 0 && <p>No past applications</p>}
                            {past.map(app => (
                                <div key={app._id} className="application-card-row">
                                    <span className="company">{app.companyName}</span>
                                    <span className="job">{app.jobTitle}</span>
                                    <span className="status">{app.status}</span>
                                    <span className="due-date">{app.dueDate}</span>
                                    <span className="salary">{app.salary}</span>
                                    <span className="location">{app.location}</span>
                                    <span className="materials">
                                        <button className="add-material-button" onClick={() => setselectedAppForMaterials(app)}>+</button>
                                    </span>
                                    <span className="actions">Edit</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

}

export default Dashboard;


//useState Purpose: It lets your component store and manage state
// 1. DATA FLOW: useEffect fetches MongoDB docs -> setApplications updates state -> React re-renders the UI.
// 4. TABLE ALIGNMENT: 'application-titles' (Header) and 'application-card-row' (Data) must BOTH have exactly 8 <span> elements.
// 5. FLEXBOX RULES: 'flex: 1' in CSS divides the 100% width by the number of spans; if counts don't match, columns won't align.
// 6. PLACEHOLDERS: Always use a value (like "-") in empty spans to prevent CSS layout collapse and maintain the 8-column grid.