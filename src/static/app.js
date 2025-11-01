document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const activityTemplate = document.getElementById("activity-template");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message / previous content
      activitiesList.innerHTML = "";

      // Reset select options (keep first placeholder)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const spotsLeft = details.max_participants - details.participants.length;

        if (activityTemplate) {
          const node = activityTemplate.content.cloneNode(true);
          node.querySelector(".activity-title").textContent = name;
          node.querySelector(".activity-description").textContent = details.description;
          node.querySelector(".activity-schedule").innerHTML = `<strong>Schedule:</strong> ${details.schedule}`;
          node.querySelector(".capacity-count").textContent = `${details.participants.length}/${details.max_participants} (${spotsLeft} spots left)`;

          const participantsList = node.querySelector(".participants-list");
          participantsList.innerHTML = ""; // ensure empty

          if (details.participants && details.participants.length > 0) {
            details.participants.forEach((email) => {
              const li = document.createElement("li");
              li.className = "participant-item";
              li.textContent = email;
              participantsList.appendChild(li);
            });
          } else {
            const li = document.createElement("li");
            li.className = "participant-item";
            li.textContent = "No participants yet";
            participantsList.appendChild(li);
          }

          activitiesList.appendChild(node);
        } else {
          // Fallback if template not present
          const activityCard = document.createElement("div");
          activityCard.className = "activity-card";
          activityCard.innerHTML = `
            <h4>${name}</h4>
            <p>${details.description}</p>
            <p><strong>Schedule:</strong> ${details.schedule}</p>
            <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          `;

          // participants list fallback
          const ul = document.createElement("ul");
          ul.className = "participants-list";
          if (details.participants && details.participants.length > 0) {
            details.participants.forEach((email) => {
              const li = document.createElement("li");
              li.className = "participant-item";
              li.textContent = email;
              ul.appendChild(li);
            });
          } else {
            const li = document.createElement("li");
            li.className = "participant-item";
            li.textContent = "No participants yet";
            ul.appendChild(li);
          }

          activityCard.appendChild(ul);
          activitiesList.appendChild(activityCard);
        }

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "message success";
        signupForm.reset();

        // Refresh the activities list (updates participants)
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "message error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
