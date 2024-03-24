const signupData = new FormData();
const forms = [
    [
        `<label for="username">Username:</label>
        <input type="text" id="username" name="username" class="input-field" required>
        <label for="email">Email:</label>
        <input type="email" id="email" name="email" value="a@mong.us" class="input-field" required>
        <label for="password">Password:</label>
        <input type="password" id="password" name="password" class="input-field" required>
        <label for="phone">Phone Number:</label>
        <input type="tel" id="phone" name="phone" value="551" class="input-field" required>
        <br>
        <br>
        <input type="submit"></button>`,
        () => {
            document.getElementById('error-message').innerText = '';
        },
        async (event) => {
            const form = document.querySelector('form');
            const formData = new FormData(form);
        
            const request = await fetch('/api/signup', {
                method: 'POST',
                body: formData
            });

            signupData.append('id', location.pathname.split('/')[2]);
        
            if (request.ok) {
                setSignupForm(1);
            } else {
                const errorMessage = await request.json();
        
                document.getElementById('error-message').innerText = `Error: ${errorMessage.message}`;
            }
        }
    ],
    [
        `<h1>Teams</h1>
        <p>Teams are groups of players that compete together in tournaments. You can create a team or join an existing one. If you would like, you may <button id="work-alone" style="background:blue:border-radius:5px;font-weight:bold;">Click Here</button> to work alone.</p>
        <label for="team-name">Team Name:</label>
        <input type="text" id="team-name" name="team-name" class="input-field" required>`,
        () => {
            document.getElementById('error-message').innerText = '';
            document.getElementById('work-alone').addEventListener('click', () => {
                const form = document.querySelector('form');
                const formData = new FormData(form);

                if (formData.get('team-name') !== '') {
                    return;
                }

                signupData.append('teamname', 'solo_GEMINI');
                setSignupForm(2);
            });
        },
        async (event) => {
            const form = document.querySelector('form');
            const formData = new FormData(form);
        
            if (formData.get('team-name') !== '') {
                signupData.append('teamname', formData.get('team-name'));
                setSignupForm(2);
            } else {
                document.getElementById('error-message').innerText = `Error: Required field missing`;
            }
        }
    ],
    [
        `<h1>Submitting...</h1>`,
        () => {
            document.getElementById('error-message').innerText = '';
            fetch('/api/competitions/signup', {
                method: 'POST',
                body: signupData
            }).then((response) => {
                if (response.ok) {
                    setSignupForm(3);
                } else {
                    response.json().then((data) => {
                        document.getElementById('error-message').innerText = `Error: ${data.message}`;
                    });
                }
            });
        },
        (event) => {

        }
    ],
    [
        `<h1>Success!</h1>
        <p>You have successfully signed up for the tournament. You will receive an email with further instructions at a later date.</p>`,
        () => {
            document.getElementById('error-message').innerText = '';
        },
        (event) => {

        }
    ]
]

function parseCookies() {
    const cookieString = document.cookie;
    const cookies = {};

    cookieString.split('; ').forEach(cookie => {
        const [key, value] = cookie.split('=');
        cookies[key.trim()] = value;
    });

    return cookies;
}

if (parseCookies().session) {
    signupData.append('id', location.pathname.split('/')[2]);
    forms[0][0] = `<button onclick="setSignupForm(1)" style="background: lightblue; border-radius: 10px; padding: 10px;">Join This Competition!</button>`;
}

let submitFunction = async () => {
    console.log('No submit function set');
};

async function submitForm(event) {
    event.preventDefault();

    await submitFunction(event);
}

function setSignupForm(index) {
    document.getElementById('signupForm').innerHTML = forms[index][0];
    forms[index][1]();
    submitFunction = forms[index][2];
}

document.querySelector('#signupForm').addEventListener('submit', submitForm);

setSignupForm(0);