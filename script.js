// script.js

let userStack = [];
let currentIndex = -1;

function createTimeoutSignal(ms) {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), ms);
    return controller.signal;
}

async function fetchWithRetry(url, options = {}, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, { ...options, signal: createTimeoutSignal(5000) });
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error(`Client error: 404 Not Found`);
                } else if (response.status >= 500 && response.status <= 503) {
                    throw new Error(`Server error: ${response.status} ${response.statusText}`);
                } else {
                    throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
                }
            }
            return await response.json();
        } catch (error) {
            if (error.name === 'AbortError') {
                console.warn(`Attempt ${i + 1} failed due to timeout. Retrying...`);
            } else {
                console.warn(`Attempt ${i + 1} failed: ${error.message}. Retrying...`);
            }
            if (i === retries - 1) {
                throw error;
            }
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
}

async function fetchRandomUser(nameInput = "") {
    const url = 'https://randomuser.me/api/';
    try {
        const user = await fetchWithRetry(url);
        const fetchedUser = user.results[0];
        if (nameInput) {
            [fetchedUser.name.first, fetchedUser.name.last] = nameInput.split(' ');
        }
        userStack.push(fetchedUser);
        currentIndex++;
        displayUserInfo(fetchedUser);
    } catch (error) {
        console.error('Fetch error:', error);
        const userInfoDiv = document.getElementById('user-info');
        userInfoDiv.classList.add('error');
        userInfoDiv.textContent = `Error loading user information: ${error.message}. Please try again later.`;
    }
}

function displayUserInfo(user) {
    const userInfoDiv = document.getElementById('user-info');
    userInfoDiv.classList.remove('error');
    userInfoDiv.innerHTML = `
        <img src="${user.picture.large}" alt="User Picture" class="user-picture mb-4">
        <p><strong>Name:</strong> ${user.name.first} ${user.name.last}</p>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Location:</strong> ${user.location.city}, ${user.location.country}</p>
    `;
}

document.getElementById('search-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const nameInput = document.getElementById('search-input').value.trim();

    if (nameInput) {
        if (nameInput.split(' ').length === 2 && /^[a-zA-Z ]+$/.test(nameInput)) {
            fetchRandomUser(nameInput);
        } else {
            const userInfoDiv = document.getElementById('user-info');
            userInfoDiv.classList.add('error');
            userInfoDiv.textContent = 'Error. Please enter a valid full name (e.g., John Doe).';
        }
    } else {
        const userInfoDiv = document.getElementById('user-info');
        userInfoDiv.classList.add('error');
        userInfoDiv.textContent = 'Please enter some text.';
    }
});

document.getElementById('next-btn').addEventListener('click', () => {
    fetchRandomUser().catch(error => {
        const userInfoDiv = document.getElementById('user-info');
        userInfoDiv.classList.add('error');
        userInfoDiv.textContent = `Error fetching new user: ${error.message}. Please try again later.`;
    });
});

document.getElementById('prev-btn').addEventListener('click', () => {
    if (currentIndex > 0) {
        currentIndex--;
        displayUserInfo(userStack[currentIndex]);
    }
});

// Fetch initial user on page load
fetchRandomUser().catch(error => {
    const userInfoDiv = document.getElementById('user-info');
    userInfoDiv.classList.add('error');
    userInfoDiv.textContent = `Error fetching initial user: ${error.message}. Please try again later.`;
});
