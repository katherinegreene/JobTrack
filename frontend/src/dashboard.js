//dashboard.js

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";// this is the import for making the chart manually.ells Chart.js which parts to enable so the pie chart can render correctly
import "./dashboard.css";
import { useRef } from "react";
import { PieController } from "chart.js";
import { useMemo, useCallback } from "react";


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
    const navigate = useNavigate();
    const [applications, setApplications] = useState([]);//Empty array for job applications
    const [showForm, setShowForm] = useState(false)//usestate false default hidden so it doesn't pop up in the dashboard
    const [formMode, setFormMode] = useState("add"); // "add" or "edit"
    const [currentAppId, setCurrentAppId] = useState(null);
    const [newApp, setNewApp] = useState(emptyApp);
    const [deletingMaterialId, setDeletingMaterialId] = useState(null);



    //functions for edit application buttton
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



    // CONTAINERS IN DASHBOARD THAT COUNTS UPCOMING AND URGENT APPLICATİONS
    // exclude anything that is not Applied, and exclude anything without a due date
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();

    const appliedThisMonth = applications.filter(app => {
        if (app.status !== "Applied" || !app.dueDate)
            return false;
        const date = new Date(app.dueDate);
        return date.getMonth() === thisMonth && date.getFullYear() === thisYear;

    }).length;



    // FILTERING 
    // //Upcoming,Past,Urgent

    const today = new Date();
    today.setHours(0, 0, 0, 0);//resets the time "midnight(00.00.00)"
    const todayStr = today.toISOString().split('T')[0];// this is a way to split an ISO string("2026-04-28T11:23:45Z") it splits at T and takes the initial part.for easy comparision 
    const twoWeeksLater = new Date();


    //UPCOMING 
    const upcoming = applications.filter(app => {
        if ((app.status !== "Interview" && app.status !== "Offer") || !app.dueDate) return false;

        const due = app.dueDate;

        return due >= todayStr;// keep only jobs happening today or in the future.This logic works because I made IOS dates as sortable strings.Filtering works with comparing dates
    });

    //URGENT
    const threeDaysLater = new Date();
    threeDaysLater.setDate(today.getDate() + 3);

    const urgent = applications.filter(app => {
        if ((app.status !== "Interview" && app.status !== "Offer") || !app.dueDate) return false;
        const due = app.dueDate;
        const todayStr = today.toISOString().split('T')[0];
        const threeDaysStr = threeDaysLater.toISOString().split('T')[0];
        return due >= todayStr && due <= threeDaysStr;  // applications that is due in 3 days considered as urgent
    });

    // PAST = before due date
    const past = applications.filter(app => {
        if (!app.dueDate || app.dueDate === "") {
            console.warn('Missing date')
            return true;
        }
        const due = app.dueDate;
        const isPast = app.dueDate < today;
        return due < todayStr;
    });



    const appliedCount = applications.filter(app => app.status === "Applied").length;

    // COMPUTE THE PIE CHART BASED ON STATUS ///PIE CHART

    // note Use memo is a react hook that cahces the computed value so it doesnt get calculated each render
    //Note: pie chart uses vanila js lib mixed with react 

    const statusCounts = useMemo(() => {//Important Note:use memo is for efficiency.Tells react to only update the chart data if there is a change in applications.Ran into issue prev about rendering pie with each click
        const counts = {};

        applications.forEach(app => {

            counts[app.status] = (counts[app.status] || 0) + 1;//increment app count by one if app status exists
        });

        return counts;
    }, [applications]);

    const statusLabels = Object.keys(statusCounts);
    const statusData = Object.values(statusCounts);
    const pieData = useMemo(() => ({
        labels: Object.keys(statusCounts), //keys are the statuses applied,interview etc. Values are the nuber of the
        datasets: [{
            data: Object.values(statusCounts),
            backgroundColor: ["#4CAF50", "#f15b2d", "#2196F3", "#9E9E9E"],
            borderColor: "#ffffff",
            borderWidth: 2,
        }],
    }), [statusCounts]);
    const chartRef = useRef(null);
    useEffect(() => {

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");


        // If we already have a chart, remove it
        if (chartRef.current) {
            chartRef.current.destroy();
        }

        //Create the pie chart
        chartRef.current = new ChartJS(ctx, {
            type: "pie",
            data: pieData,
            options: {
                plugins: {
                    legend: { position: "bottom" },
                },
            },
        });


    }, [pieData]);

    //ADD APPLICATION 
    function addApplication(app) {

        fetch("http://127.0.0.1:5000/add_application", {//flask route
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(app),

        })
            .then(res => res.json())
            .then(data => {
                // Update local state with the object returned from backend (includes _id from MongoDB)
                setApplications([...applications, data]);//adds new app to local, UI shows it.
                setShowForm(false);
                setNewApp(emptyApp);
                setFormMode("add");
                setCurrentAppId(null);
            })
            .catch(err => console.error("Error adding application:", err));
    }



    //DELETE APPLICATION
    function deleteApplication(id) {
        fetch(`http://127.0.0.1:5000/delete_application/${id}`, { //note: id must be in the browser url
            method: "DELETE",
        })

            .then(res => res.json())//turns into json for react
            .then(data => { //update UI
                setApplications(prevApplications => prevApplications.filter(app => app._id !== id));// this checks if the application that wanted to be deleted matches the one in applications.Rebuilding a list without the deleted app
                alert("Application deleted.");
            })
            .catch(err => console.error("error deleting:", err));
    }
    //UPDATE APPLICATION

    function updateApplication(id, updatedApplications) {
        fetch(`http://127.0.0.1:5000/update_application/${id}`, {
            method: "PUT",
            headers: { "content-type": "application/json" },//send json,
            body: JSON.stringify(updatedApplications)//send data
        })
            .then(res => {
                if (!res.ok) throw new Error("Server update failed");// this is just a safety check for servers success code
                return res.json();
            })
            .then(data => {
                setApplications(prevApplications =>
                    prevApplications.map(app => {
                        if (app._id === id) {
                            return { ...app, ...updatedApplications };
                        }
                        return app;
                    })
                );
                alert("Application updated successfully!");
                closeForm();
            })
            .catch(err => console.error("Update error:", err)); // Fixed the label
    }



    useEffect(() => {// auto run opens dashboard 
        fetch("http://127.0.0.1:5000/dashboard")
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then(data => setApplications(data))
            .catch(err => {
                console.error("FETCH ERROR:", err);
                alert("Failed to fetch data. Check backend server and network.");
            });
    }, []);



    //UPLOAD MATERIALS

    const [materials, setMaterials] = useState({});// this  stores uploaded file by the id
    const [selectedAppForMaterials, setselectedAppForMaterials] = useState(null);//current selected job
    const [selectedFile, setselectedFile] = useState(null);//the chosen file,not uploaded
    const [materialType, setMaterialType] = useState("voice");

    const voiceInputRef = useRef(null);
    const fileInputRef = useRef(null);
    function uploadMaterial() {
        if (!selectedFile || !selectedAppForMaterials) {
            return;
        }
        const formData = new FormData();// this is for sending files to backend
        formData.append("file", selectedFile);// adds files
        formData.append("application_id", selectedAppForMaterials._id);
        formData.append("material_type", materialType);
        fetch("http://127.0.0.1:5000/upload_material", {// sends to backend
            method: "POST",
            body: formData

        })
            .then(res => res.json())//json response
            .then(data => {//success
                alert("Upload successful!");
                setselectedFile(null); // This resets the button state important
                setMaterialType("voice");
            })
            .catch(err => console.error(err));// log error 
    }
    // fetch materials
    const fetchMaterials = (app) => { //takes the job obj
        setselectedAppForMaterials(app);//current app
        fetch(`http://127.0.0.1:5000/materials/${app._id}`)
            .then(res => res.json())
            .then(files => setMaterials(prev => ({ ...prev, [app._id]: files }))) //important
            .catch(console.error);
    };
    // fetch returns an object , res.json() reads it parses it from json string
    //DELETE MATERIAL
    const deleteMaterial = (materialId) => {
        const userConfirmed = window.confirm("Delete this file?");
        if (!userConfirmed) return;
        fetch(`http://127.0.0.1:5000/delete_material/${materialId}`, {
            method: "DELETE",
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    fetchMaterials(selectedAppForMaterials); //refreshes list
                }
            })
            .catch(error => {
                console.error("delete error", error);
            });
    };

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
                                ref={voiceInputRef}// means give my js variable a direct handle to this HTML input so I can click it programmatically
                                style={{ display: "none" }}//hides default button
                                accept="audio/*,.mp3"
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {// if file exists store object in state
                                        setselectedFile(file);//stores in react state
                                        setMaterialType("voice");// tels upload materials its voice file
                                    }
                                }}
                            />
                            {!selectedFile || materialType !== "voice" ? (
                                <button onClick={() => voiceInputRef.current.click()} className="upload-button">
                                    Select File
                                </button>
                            ) : (
                                <button onClick={uploadMaterial} className="upload-button" >
                                    Upload {selectedFile.name}
                                </button>
                            )}{/*custom button */}
                        </div>
                        {/* Add Files Section */}
                        <div className="materials-section">
                            <h4>Add Files</h4>
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: "none" }}//hides default button that comes with input tag
                                accept=".py,.java,.txt,.png,.pdf,.jpg"
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        setselectedFile(file);
                                        setMaterialType("file");
                                    }
                                }}
                            />
                            {selectedFile && materialType == "file" ? (
                                <button onClick={uploadMaterial} className="upload-button">
                                    Upload {selectedFile.name}
                                </button>
                            ) : (
                                <button onClick={() => fileInputRef.current.click()} className="upload-button" >
                                    Select File
                                </button>
                            )}{/*custom button */}


                            {/*Note input file creates a default button.To fix that and use custom buttons, hide the default button and create a trigger when the custom button is clicked */}
                            {/*MATERIALS LIST POP UP */}
                            <div style={{ marginTop: '20px', padding: '10px' }}>
                                <h4>Uploaded Files</h4>
                                {materials[selectedAppForMaterials?._id]?.length > 0 ? (
                                    materials[selectedAppForMaterials._id].map(file => (
                                        <div key={file.material_id} style={{ padding: '5px', borderBottom: '1px solid #eee' }}>

                                            {/*if file exist show the link if not show nothing.Checks baed on current job id  */}
                                            <a href={`http://127.0.0.1:5000/download/${file.material_id}`} download>{file.filename}</a>
                                            <button
                                                onClick={() => deleteMaterial(file.material_id)}
                                                className="delete-button"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <p>No files uploaded yet</p>
                                )}
                            </div>
                            {/*user clicks the file link.Browser requests /download/filename from Flask and reads form disk*/}
                        </div>

                    </div>
                </div>
            )}

            <div>
                {/*DAHSBOARD */}
                <div>
                    {/**Title */}
                    <h1 className="dashboard-title">JobTrack 💼</h1>

                    {/* Main dashboard container */}
                    <div className="dashboard-container">
                        <div className="dashboard-header">
                        </div>
                        {/*STAT ROW COUNT FOR URGENT OR UPCOMING*/}
                        <div className="stats-row">
                            <div className="stat-card">
                                <h4>Upcoming</h4>
                                <p>{upcoming.length}</p>
                            </div>
                            <div className="stat-card">
                                <h4>Urgent</h4>
                                <p>{urgent.length}</p>
                            </div>
                            {/**CHART */}
                            <div style={{
                                width: "200px",
                                height: "250px",
                                display: "flex",

                                margin: "20px auto",
                                zIndex: 10
                            }}>
                                <div className="chart-container">
                                    <canvas
                                        ref={canvasRef}
                                        style={{
                                            width: "200px",
                                            height: "200px",
                                            display: "block",
                                        }}
                                    />
                                </div>
                            </div>
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
                                    <span className="materials"><button className="add-material-button" onClick={() => fetchMaterials(app)}>
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
                                <span className="url">LINK</span>
                                <span className="actions">MATERIALS</span>
                                <span className="materials">ACTIONS</span>

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
                                    <span className="materials"><button className="add-material-button" onClick={() => fetchMaterials(app)}>
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
                                <span className="url">LINK</span>
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
                                    <span className="url">{app.Url ? <a href={app.Url}>Link</a> : "No Link"}

                                    </span>
                                    <span className="materials">
                                        <button className="add-material-button" onClick={() => fetchMaterials(app)}>+</button>
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
//Since we don't know if a user has 5 job applications or 50, you can't hardcode the HTML for each one. Instead, you use .map() to say: "For every single item in my applications array, create one table row."
//then(res => { ... }) attaches a handler to a Promise: it runs the function when the asynchronous operation (like fetch) completes successfully, passing the resolved value as res. Inside, you check the response status (if (!res.ok)) and use return res.json() to parse the response body as JSON, chaining the next step in the Promise flow. Each .then represents a sequential step that executes only after the previous one finishes, while catch handles any errors in the chain.


//React Notes Syntax:
/**
 * 
.then() and .catch()
.then() runs after the request succeeds.
.catch() runs if something fails.
In fetch(), .then() is usually used to get the response and convert it with response.json(), then update state.
.catch() is used to handle errors like network failure or thrown errors.developer.mozilla+2
Where to use them
Use them anytime you call an API with fetch() or any Promise-based code. In  dashboard, they are used after backend requests like add, update, delete, and upload because you need to wait for the server reply before changing the UI.learnjavascript+2
Simple note version

fetch() returns a Promise.
.then() handles success.
.catch() handles errors.
response.json() turns the response into usable JavaScript data.
Check response.ok because fetch() does not reject just because the server returns a 404 or 500.developer.mozilla+1
useRef vs useEffect
useRef is for storing a value or getting a direct reference to a DOM element without causing re-renders.
useEffect runs code after render, like fetching data or setting up a chart.perssondennis+1
Very short difference
useRef = point to something or store something.
useEffect = run side effects after the component renders.leewarrick+2

useRef is used for the canvas and file inputs.
useEffect is used to fetch dashboard data and draw the pie chart.perssondennis+1

 */