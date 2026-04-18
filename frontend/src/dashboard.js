//dashboard.js

import { useEffect, useState } from "react";
import { Pie } from "react-chartjs-2";// react wrapper for chartjs 
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";// this is the import for making the chart manually.ells Chart.js which parts to enable so the pie chart can render correctly
import "./dashboard.css";
import { useRef } from "react";
import { PieController } from "chart.js";

const emptyApp = {
    companyName: "",
    jobTitle: "",
    status: "Interview",
    dueDate: "",
    salary: "",
    location: "",
    Url: "",
};
ChartJS.register(ArcElement, Tooltip, Legend, PieController);//chart js features arc element =pie donut chart,Tooltip= pop up info when hovered,Legend =color
function Dashboard() {
    const [applications, setApplications] = useState([]);//Empty array for job applications
    const [showForm, setShowForm] = useState(false)//usestate false default hidden so it doesn't pop up in the dashboard

    const [formMode, setFormMode] = useState("add"); // "add" or "edit"
    const [currentAppId, setCurrentAppId] = useState(null);
    const [newApp, setNewApp] = useState(emptyApp);

    function editClick(app) {
        setFormMode("edit");
        setCurrentAppId(app._id);
        setNewApp(app);
        setShowForm(true);
    }
    function closeForm() {
        setShowForm(false);
        setFormMode("add");
        setCurrentAppId(null);
        setNewApp(emptyApp);
    }
    const canvasRef = useRef(null);  //useRef acts as a "permanent bookmark" that allows React to directly grab and control the HTML canvas element so external libraries like Chart.js can draw graphics on it.
    // Filtering Upcoming Interviews by due date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const twoWeeksLater = new Date();
    twoWeeksLater.setDate(today.getDate() + 14);


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
    //filter for urgent app
    const threeDaysLater = new Date();
    threeDaysLater.setDate(today.getDate() + 3);

    const urgent = applications.filter(app => {
        if (app.status !== "Interview" || !app.dueDate) return false;
        const due = app.dueDate;
        const todayStr = today.toISOString().split('T')[0];
        const threeDaysStr = threeDaysLater.toISOString().split('T')[0];
        return due >= todayStr && due <= threeDaysStr;
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



    //UPLOAD MATERIALS
    //const for tracking which application is being viewed/selected for materials section
    const [selectedAppForMaterials, setselectedAppForMaterials] = useState(null);////////////
    const [selectedFile, setselectedFile] = useState(null);//state variable
    const [materialType, setMaterialType] = useState("voice");//updates data
    // if no file is chosen stop running the application
    const voiceInputRef = useRef(null);
    const fileInputRef = useRef(null);
    function uploadMaterial() {
        if (!selectedFile || !selectedAppForMaterials) {
            return;
        }
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("application_id", selectedAppForMaterials._id);
        formData.append("material_type", materialType);
        fetch("http://127.0.0.1:5000/upload_material", {//flask route
            method: "POST",
            body: formData

        })
            .then(res => res.json())
            .then(data => {
                alert("Upload successful!");
                setselectedFile(null); // This resets the button state
                setMaterialType("voice");
            })
            .catch(err => console.error(err));
    }



    /// ADD APPLICATION 
    function addApplication(app) {

        fetch("http://127.0.0.1:5000/add_application", {//flask route
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(app),

        })
            .then(res => res.json())
            .then(data => {
                // Update local state with the object returned from backend (includes _id from MongoDB)
                setApplications([...applications, data]);//adds new app.
                setShowForm(false);
                setNewApp(emptyApp);
                setFormMode("add");
                setCurrentAppId(null);
            })
            .catch(err => console.error("Error adding application:", err));
    }
    //DELETE APPLICATION
    function deleteApplication(id) {
        fetch(`http://127.0.0.1:5000/delete_application/${id}`, { //id must be in the browser url
            method: "DELETE",
        })

            .then(res => res.json())
            .then(data => { //update UI
                setApplications(prevApplications => prevApplications.filter(app => app._id !== id));// this refreshes
                alert("Application deleted.");
            })
            .catch(err => console.error("error deleting:", err));
    }
    //UPDATE APPLICATION

    function updateApplication(id, updatedApplications) { ////////////////////////////////////////////
        fetch(`http://127.0.0.1:5000/update_application/${id}`, {
            method: "PUT",
            headers: { "content-type": "application/json" },//send json,
            body: JSON.stringify(updatedApplications)//send data
        })
            .then(res => {
                if (!res.ok) throw new Error("Server update failed");
                return res.json();
            })
            .then(data => {
                setApplications(prevApplications =>
                    prevApplications.map(app =>
                        app._id === id ? { ...app, ...updatedApplications } : app
                    )
                );
                alert("Application updated successfully!");
                closeForm();
            })
            .catch(err => console.error("Update error:", err)); // Fixed the label
    }


    /////CHART JS ADJUST LATER ON
    ///pie chart use effect using Vanilla Js Not ceact chartjs 2
    /*  useEffect(() => {
          const ctx = canvasRef.current?.getContext('2d');
          if (ctx && pieData.datasets[0].data.some(d => d > 0)) {
              new ChartJS(ctx, {
                  type: 'pie',
                  data: pieData,
                  options: { responsive: false, plugins: { legend: { position: "bottom" } } }
              });
          }
      }, [applications]); */

    useEffect(() => { //use effect populates applicatios from mongodb.Each application has status,title etc.
        fetch("http://127.0.0.1:5000/dashboard")
            .then(res => res.json())
            .then(data => setApplications(data));
    }, []);

    return (
        <div>
            {showForm && (
                <div className="popup-form">
                    {/*close button for the new application button*/}
                    <button className="close-button" onClick={closeForm}>
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

                    <button
                        onClick={() => {
                            if (formMode === "edit") {
                                updateApplication(currentAppId, newApp);
                            } else {
                                addApplication(newApp);
                            }
                        }}
                    >
                        {formMode === "edit" ? "UPDATE" : "SAVE"}
                    </button>
                </div>

            )}
            {/*MATERIALS */}
            {selectedAppForMaterials && (
                <div className="popup-form-materials">
                    <button className="close-button" onClick={() => setselectedAppForMaterials(null)}>x</button>

                    <div className="materials-container">
                        {/* Add Recording Section */}
                        <div className="materials-section">
                            <h4>Add Recording</h4>
                            <input
                                type="file"
                                ref={voiceInputRef}
                                style={{ display: "none" }}//hides default button
                                accept="audio/*,.mp3"
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        setselectedFile(file);
                                        setMaterialType("voice");
                                    }
                                }}
                            />
                            {!selectedFile || materialType !== "voice" ? (
                                <button onClick={() => voiceInputRef.current.click()} className="upload-button">
                                    Select File
                                </button>
                            ) : (
                                <button onClick={uploadMaterial} className="upload-button" style={{ background: '#ff9800' }}>
                                    Uploaded {selectedFile.name}
                                </button>
                            )}{/*custom button */}
                        </div>
                        {/* Add Files Section */}
                        <div className="materials-section">
                            <h4>Add Files</h4>
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: "none" }}//hides default button
                                accept=".py,.java,.txt,.png,.pdf,.jpg"
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        setselectedFile(file);
                                        setMaterialType("");
                                    }
                                }}
                            />
                            {!selectedFile || materialType !== "file" ? (
                                <button onClick={() => fileInputRef.current.click()} className="upload-button">
                                    Select File
                                </button>
                            ) : (
                                <button onClick={uploadMaterial} className="upload-button" style={{ background: '#ff9800' }}>
                                    Uploaded {selectedFile.name}
                                </button>
                            )}{/*custom button */}
                            {/*Note input file creates a default button.To fix that and use custom buttons, hide the default button and create a trigger when the custom button is clicked */}
                        </div>
                    </div>
                </div>
            )}

            <div>
                {/*DAHSBOARD */}
                <div>
                    {/**Title */}
                    <h1 className="dashboard-title">JobTrack</h1>

                    {/* Main dashboard container */}
                    <div className="dashboard-container">
                        {/* ADD GRAPHICS LATER ON HERE */}
                        <div className="dashboard-header">
                            <h4></h4>
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

                            {upcoming.map(app => (
                                <div key={app._id} className="application-card-row">
                                    <span className="company">{app.companyName}</span>
                                    <span className="job">{app.jobTitle}</span>
                                    <span className="status">{app.status}</span>
                                    <span className="due-date">{app.dueDate}</span>
                                    <span className="salary">{app.salary}</span>
                                    <span className="location">{app.location}</span>
                                    <span className="url">{app.Url ? <a href={app.Url}>Link</a> : "No Link"}

                                    </span>
                                    <span className="materials"><button className="add-material-button" onClick={() => setselectedAppForMaterials(app)}>
                                        +
                                    </button></span>
                                    <span className="actions">
                                        <button className="delete-application-button" onClick={() => deleteApplication(app._id)}>Delete</button>
                                        <button className="update-application-button" onClick={() => editClick(app)}>Update</button>
                                    </span>
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
                                <span className="url">LINK</span>
                            </div>
                            {urgent.map(app => (/*Small headers for application*/
                                <div key={app._id} className="application-card-row">
                                    <span className="company">{app.companyName}</span>
                                    <span className="job">{app.jobTitle}</span>
                                    <span className="status">{app.status}</span>
                                    <span className="due-date">{app.dueDate}</span>
                                    <span className="salary">{app.salary}</span>
                                    <span className="location">{app.location}</span>
                                    <span className="url">{app.Url ? <a href={app.Url}>Link</a> : "No Link"}

                                    </span>
                                    <span className="materials"><button className="add-material-button" onClick={() => setselectedAppForMaterials(app)}>
                                        +
                                    </button></span>
                                    <span className="actions">
                                        <button className="delete-application-button" onClick={() => deleteApplication(app._id)}>Delete</button>
                                        <button className="update-application-button" onClick={() => editClick(app)}>Update</button>

                                    </span>
                                </div>
                            ))}
                            {urgent.length === 0 && <p>No upcoming interviews</p>}
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
                                    <span className="actions">
                                        <button className="delete-application-button" onClick={() => deleteApplication(app._id)}>Delete</button>
                                        <button className="update-application-button" onClick={() => editClick(app)}>Update</button>
                                    </span>
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

//Notes:
//The return statement is the component's final output that tells the browser exactly what HTML and data to display on the screen.
//useState is the component's internal memory for data that changes, while useEffect is a self-acting trigger that runs code (like fetching data) automatically when the page loads or updates.
//A React wrapper is a "helper" that takes a tool not originally built for React and turns it into a React Component so you can use it like any other tag (e.g., <Pie /> or <Bar />).
// 1. DATA FLOW: useEffect fetches MongoDB docs -> setApplications updates state -> React re-renders the UI.
// 4. TABLE ALIGNMENT: 'application-titles' (Header) and 'application-card-row' (Data) must BOTH have exactly 8 <span> elements.
// 5. FLEXBOX RULES: 'flex: 1' in CSS divides the 100% width by the number of spans; if counts don't match, columns won't align.
// 6. PLACEHOLDERS: Always use a value (like "-") in empty spans to prevent CSS layout collapse and maintain the 8-column grid.
//In React, .map() is a JavaScript function used inside the return statement to transform a list of data (an array) into a list of visual elements (HTML).
//## How it works
//Since you don't know if a user has 5 job applications or 50, you can't hardcode the HTML for each one. Instead, you use .map() to say: "For every single item in my applications array, create one table row."