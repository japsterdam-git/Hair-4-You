// Load credentials from JSON file
let CREDENTIALS = {};
let credentialsLoaded = false;

// Testing flag - set to false for production
const USE_LOCAL_CREDENTIALS_FOR_TESTING = false;

// Function to load credentials from JSON
async function loadCredentials() {
  try {
    const response = await fetch("credentials.json");
    if (!response.ok) {
      throw new Error("Credentials file not found");
    }
    CREDENTIALS = await response.json();
    credentialsLoaded = true;
    console.log("Service account credentials loaded successfully");
  } catch (error) {
    console.error("Error loading credentials:", error);
    // Fallback to demo mode
    CREDENTIALS = {
      type: "service_account",
      project_id: "demo-project",
      private_key:
        "-----BEGIN PRIVATE KEY-----\nDEMO_KEY\n-----END PRIVATE KEY-----\n",
      client_email: "demo@demo-project.iam.gserviceaccount.com",
      client_id: "demo-client-id",
    };
    credentialsLoaded = true;
  }
}

// Configuration - Service account via backend API
const CONFIG = {
  SPREADSHEET_ID: "1BaeDZl27e96oARvMj78NUi45JepW4lYQZL_rspD6UFw",
  RANGE: "Sheet1!C2",
  API_URL: "https://your-app-name.vercel.app/api/sheet-data", // Update with your Vercel URL
  GOAL_AMOUNT: 20000000, // 20 million IDR
  UPDATE_INTERVAL: 10000, // Update every 10 seconds
  RETRY_DELAY: 5000, // Retry after 5 seconds if error
  MILESTONES: [
    {
      name: "Mr. Osborne",
      amount: 2000000,
      image: "images/milestone1.jpg", // Add your image path here
    },
    {
      name: "Mr. Feltstrom",
      amount: 3000000,
      image: "images/milestone2.jpg", // Add your image path here
    },
    {
      name: "Mr. Taggart",
      amount: 5000000,
      image: "images/milestone3.jpg", // Add your image path here
    },
    {
      name: "Mr. O'Rourke",
      amount: 7000000,
      image: "images/milestone4.jpg", // Add your image path here
    },
    {
      name: "Mr. Kumar",
      amount: 9500000,
      image: "images/milestone5.jpg", // Add your image path here
    },
    {
      name: "Mr. Eaglestone",
      amount: 12000000,
      image: "images/milestone6.jpg", // Add your image path here
    },
    {
      name: "Mr. Popple",
      amount: 15000000,
      image: "images/milestone7.jpg", // Add your image path here
    },
    {
      name: "Ms. Kilpatrick",
      amount: 18000000,
      image: "images/milestone8.jpg", // Add your image path here
    },
    {
      name: "Mr. Darlison",
      amount: 19000000,
      image: "images/milestone9.jpg", // Add your image path here
    },
    {
      name: "Ibu Wina",
      amount: 20000000,
      image: "images/milestone10.jpg", // Add your image path here
    },
  ],
};

// Global variables
let currentAmount = 0;
let isLoading = false;
let updateInterval = null;
let simulationIndex = 0; // Add simulation counter

// Google Sheets API
// Simulate donation data for testing (bypasses Google Sheets API limitations)
async function fetchDonationDataDirect() {
  console.log("Using simulation mode for testing...");
  console.log("Current amount:", currentAmount);
  console.log("Simulation index:", simulationIndex);

  // Simple increment by 500k each time for testing
  let newAmount = currentAmount + 500000;

  // Cap at goal amount
  if (newAmount > CONFIG.GOAL_AMOUNT) {
    newAmount = 500000; // Reset to start
  }

  console.log("New simulated amount:", newAmount);
  return newAmount;
}

// Fetch donation data from backend API
async function fetchDonationData() {
  console.log("=== fetchDonationData called ===");
  console.log(
    "USE_LOCAL_CREDENTIALS_FOR_TESTING:",
    USE_LOCAL_CREDENTIALS_FOR_TESTING,
  );

  // Use direct API call for testing if flag is set
  if (USE_LOCAL_CREDENTIALS_FOR_TESTING) {
    console.log("Entering testing mode branch");
    updateConnectionStatus("connecting");
    try {
      console.log("About to call fetchDonationDataDirect...");
      const amount = await fetchDonationDataDirect();
      console.log("fetchDonationDataDirect returned:", amount);
      updateConnectionStatus("connected");
      return amount;
    } catch (error) {
      console.error("Simulation error:", error);
      updateConnectionStatus("connected"); // Still show as connected for simulation
      return currentAmount;
    }
  }

  // Normal backend API call
  console.log("Entering normal backend mode");
  try {
    updateConnectionStatus("connecting");

    const response = await fetch(CONFIG.API_URL);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      console.log("Fetched donation amount from backend:", data.amount);
      updateConnectionStatus("connected");
      return data.amount;
    } else {
      throw new Error(data.error || "Backend error");
    }
  } catch (error) {
    console.error("Error fetching data from backend:", error);
    updateConnectionStatus("error");
    return currentAmount; // Return last known amount on error
  }
}

// Sleep function for delays
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Check if backend API is configured
function isGoogleSheetsConfigured() {
  if (USE_LOCAL_CREDENTIALS_FOR_TESTING) {
    return true; // Use local credentials for testing
  }
  return (
    CONFIG.API_URL !== "https://your-backend-url.onrender.com/api/sheet-data"
  );
}

// Initialize the application
document.addEventListener("DOMContentLoaded", async function () {
  await loadCredentials();
  initializeApp();
});

function initializeApp() {
  initializeMilestones();
  initializePhotoFrames();
  updateProgress(0);

  // Check if Google Sheets is configured and start appropriate mode
  if (isGoogleSheetsConfigured()) {
    console.log("Google Sheets configured - starting live updates");
    startLiveUpdates();
  } else {
    console.log("Google Sheets not configured - please update CONFIG.API_URL");
    updateConnectionStatus("error");
    // Show error message instead of simulation
    const currentAmountElement = document.getElementById("currentAmount");
    if (currentAmountElement) {
      currentAmountElement.textContent = "Configure API";
    }
  }
}

// Initialize milestones in progress bar
function initializeMilestones() {
  const markersContainer = document.getElementById("milestoneMarkers");
  markersContainer.innerHTML = "";

  CONFIG.MILESTONES.forEach((milestone, index) => {
    const marker = createMilestoneMarker(milestone, index);
    markersContainer.appendChild(marker);
  });
}

function createMilestoneMarker(milestone, index) {
  const div = document.createElement("div");
  div.className = "milestone-marker";
  div.id = `milestone-marker-${index}`;

  // Keep original positioning based on actual amount for progress bar markers
  const position = (milestone.amount / CONFIG.GOAL_AMOUNT) * 100;
  div.style.left = `${position}%`;

  return div;
}

// Initialize photo frames with names attached to milestones
function initializePhotoFrames() {
  const container = document.getElementById("milestoneDetailsContainer");
  container.innerHTML = "";

  CONFIG.MILESTONES.forEach((milestone, index) => {
    const detailElement = createMilestoneDetail(milestone, index);
    container.appendChild(detailElement);
  });
}

function createMilestoneDetail(milestone, index) {
  const detail = document.createElement("div");
  detail.className = "milestone-detail";
  detail.id = `milestone-detail-${index}`;

  // Calculate position to spread milestones evenly across full progress bar
  const totalMilestones = CONFIG.MILESTONES.length;
  const position = (index / (totalMilestones - 1)) * 100;
  detail.style.left = `${position}%`;

  // Add connector line
  const connector = document.createElement("div");
  connector.className = "milestone-connector";

  // Add name
  const nameElement = document.createElement("div");
  nameElement.className = "milestone-name";
  nameElement.textContent = milestone.name;

  // Add amount
  const amountElement = document.createElement("div");
  amountElement.className = "milestone-amount";
  amountElement.textContent = `Rp ${formatNumber(milestone.amount)}`;

  // Add photo frame
  const frameElement = createMilestonePhotoFrame(milestone, index);

  detail.appendChild(connector);
  detail.appendChild(nameElement);
  detail.appendChild(amountElement);
  detail.appendChild(frameElement);

  return detail;
}

function createMilestonePhotoFrame(milestone, index) {
  const frame = document.createElement("div");
  frame.className = "milestone-photo-frame";
  frame.id = `milestone-photo-frame-${index}`;

  // Check if milestone has an image
  if (milestone.image) {
    frame.innerHTML = `
      <img src="${milestone.image}" alt="${milestone.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 6px;">
    `;
  } else {
    // Fallback to placeholder if no image
    frame.innerHTML = `
      <div class="milestone-photo-placeholder">
        Photo
      </div>
    `;
  }

  return frame;
}

// Update progress based on current amount
function updateProgress(amount) {
  currentAmount = amount;

  // Update current amount display
  document.getElementById("currentAmount").textContent =
    `Rp ${formatNumber(amount)}`;

  // Calculate percentage (allow over 100%)
  const percentage = (amount / CONFIG.GOAL_AMOUNT) * 100;

  // Update progress bar
  const progressFill = document.getElementById("progressFill");
  progressFill.style.width = `${Math.min(percentage, 150)}%`; // Cap at 150% for visual stability

  // Update percentage display
  document.getElementById("progressPercentage").textContent =
    `${percentage.toFixed(1)}%`;

  // Update milestones in progress bar
  updateMilestoneMarkers(amount);

  // Update photo frames
  updatePhotoFrames(amount);

  // Update next milestone display
  updateNextMilestone(amount);
}

// Update milestone markers based on current amount
function updateMilestoneMarkers(amount) {
  CONFIG.MILESTONES.forEach((milestone, index) => {
    const markerElement = document.getElementById(`milestone-marker-${index}`);
    if (amount >= milestone.amount) {
      markerElement.classList.add("achieved");
    } else {
      markerElement.classList.remove("achieved");
    }
  });
}

// Update next milestone display
function updateNextMilestone(amount) {
  const nextMilestone = CONFIG.MILESTONES.find((m) => m.amount > amount);
  const nextMilestoneElement = document.getElementById("nextMilestoneAmount");
  const amountLeftElement = document.getElementById("amountLeftValue");

  if (nextMilestone) {
    nextMilestoneElement.textContent = `Rp ${formatNumber(nextMilestone.amount)}`;
    const amountLeft = nextMilestone.amount - amount;
    amountLeftElement.textContent = `Rp ${formatNumber(amountLeft)}`;
  } else {
    nextMilestoneElement.textContent = "Goal Reached!";
    amountLeftElement.textContent = "Rp 0";
  }
}

// Format number with commas
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Google Sheets API integration
async function fetchDonationData() {
  if (isLoading) return;

  isLoading = true;

  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SPREADSHEET_ID}/values/${CONFIG.RANGE}?key=${CONFIG.API_KEY}`,
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.values && data.values.length > 0) {
      // Assuming the first cell contains the current donation amount
      const amount = parseFloat(data.values[0][0]) || 0;
      updateProgress(amount);
      updateConnectionStatus("connected");
    } else {
      console.warn("No data found in spreadsheet");
      updateConnectionStatus("error");
    }
  } catch (error) {
    console.error("Error fetching data from Google Sheets:", error);
    updateConnectionStatus("error");
  } finally {
    isLoading = false;
  }
}

// Update connection status
function updateConnectionStatus(status) {
  const statusElement = document.getElementById("connectionStatus");
  const statusDot = statusElement.querySelector(".status-dot");
  const statusText = statusElement.querySelector(".status-text");

  switch (status) {
    case "connected":
      statusDot.classList.add("connected");
      statusText.textContent = "Connected to Google Sheets";
      break;
    case "connecting":
      statusDot.classList.remove("connected");
      statusText.textContent = "Connecting to Google Sheets...";
      break;
    case "error":
      statusDot.classList.remove("connected");
      statusText.textContent = "Connection Error - Check Configuration";
      break;
    default:
      statusDot.classList.remove("connected");
      statusText.textContent = "Unknown Status";
  }
}

// Start live updates
function startLiveUpdates() {
  console.log("Starting live updates with interval:", CONFIG.UPDATE_INTERVAL);

  // Initial update
  fetchDonationData();

  // Set up regular updates
  setInterval(() => {
    fetchDonationData();
  }, CONFIG.UPDATE_INTERVAL);
}

// Manual refresh function
function manualRefresh() {
  fetchDonationData();
}

// Update photo frames based on current amount
function updatePhotoFrames(amount) {
  CONFIG.MILESTONES.forEach((milestone, index) => {
    const detailElement = document.getElementById(`milestone-detail-${index}`);
    const frameElement = document.getElementById(
      `milestone-photo-frame-${index}`,
    );

    if (amount >= milestone.amount) {
      detailElement.classList.add("achieved");
      frameElement.classList.add("achieved");
    } else {
      detailElement.classList.remove("achieved");
      frameElement.classList.remove("achieved");
    }
  });
}

// Remove simulation function - no longer needed

// Export functions for manual control
window.DonationTracker = {
  updateProgress,
  manualRefresh,
  fetchDonationData,
};
