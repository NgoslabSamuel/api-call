document.addEventListener('DOMContentLoaded', () => {
  const resultsDiv = document.getElementById('results');
  const errorMessageDiv = document.getElementById('error-message');
  const prevButton = document.getElementById('prevButton');
  const nextButton = document.getElementById('nextButton');
  const paginationDiv = document.getElementById('pagination');

  let currentPage = 1;
  const pageSize = 5;
  const currentYear = 2024; 
  let selectedYear = currentYear;

  document.getElementById('search-form').addEventListener('submit', async function (event) {
    event.preventDefault();
    const teamName = document.getElementById('team-name').value;

    try {
      const data = await fetchLocalJSON(); 
      currentPage = 1; 
      displayResults(data, teamName, currentPage, pageSize, selectedYear); 
      paginationDiv.style.display = 'block'; 
      errorMessageDiv.textContent = ''; 
    } catch (error) {
      errorMessageDiv.textContent = error.message;
    }
  });

  prevButton.addEventListener('click', async () => {
    const data = await fetchLocalJSON();
    const teamName = document.getElementById('team-name').value;

    if (currentPage > 1) {
      currentPage--;
    } else if (selectedYear > currentYear - Object.keys(data).length + 1) {
      selectedYear--;
      currentPage = Math.ceil(data[selectedYear].response.length / pageSize);
    }
    
    displayResults(data, teamName, currentPage, pageSize, selectedYear);
  });

  nextButton.addEventListener('click', async () => {
    const teamName = document.getElementById('team-name').value;
    const data = await fetchLocalJSON();

    const totalPages = Math.ceil(data[selectedYear].response.length / pageSize);
    if (currentPage < totalPages) {
      currentPage++;
    } else if (selectedYear < currentYear) {
      selectedYear++;
      currentPage = 1;
    }
    
    displayResults(data, teamName, currentPage, pageSize, selectedYear);
  });

  async function fetchLocalJSON() {
    const url = 'api.json'; 
    try {
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Resource not found (404)');
        } else if (response.status === 503) {
          throw new Error('Service unavailable (503)');
        } else {
          throw new Error('Network response was not ok');
        }
      }
      const data = await response.json();
      return data; 
    } catch (error) {
      throw error;
    }
  }

  function displayResults(data, teamName, page, pageSize, year) {
    resultsDiv.innerHTML = '';

    const filteredTeams = data[year].response.filter(team => team.team.toLowerCase().includes(teamName.toLowerCase()));

    const paginatedTeams = filteredTeams.slice((page - 1) * pageSize, page * pageSize);

    if (paginatedTeams.length > 0) {
      paginatedTeams.forEach(team => {
        const teamDiv = document.createElement('div');
        teamDiv.classList.add('team');
        teamDiv.textContent = `Team: ${team.team}, Wins: ${team.win}, Losses: ${team.loss}`;
        resultsDiv.appendChild(teamDiv);
      });

      prevButton.disabled = (page === 1 && year === currentYear - Object.keys(data).length + 1);
      nextButton.disabled = (page * pageSize >= filteredTeams.length && year === currentYear);
    } else {
      resultsDiv.textContent = 'No teams found.';
      prevButton.disabled = true;
      nextButton.disabled = true;
    }
  }
});
