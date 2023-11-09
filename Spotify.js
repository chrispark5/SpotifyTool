//spotipy for python Spotify API
const axios = window.axios;

var clientId = "5db8362bcba44d2aaf13fb20f45dec30";
var clientSecret = "7070638e695246fd9ac68c95e61cdcb6";
var accessToken;

var logInBtn = document.getElementById("logInBtn");
const redirectUri = 'http://localhost:8383/index.html';
var SongDetails = document.getElementById("SongDetails");
window.addEventListener("load", getCodeAfterAuthentication);
logInBtn.addEventListener("click", authenticateSpotify);
let code;
async function authenticateSpotify() {
  console.log("Authenticating");
  // Your existing code to initiate the Spotify authentication process goes here.
  // This includes generating codeVerifier, codeChallenge, and setting up the URL for Spotify authorization.
  const generateRandomString = (length) => {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return values.reduce((acc, x) => acc + possible[x % possible.length], "");
  }
  
  const codeVerifier  = generateRandomString(64);
  

  const sha256 = async (plain) => {
    const encoder = new TextEncoder()
    const data = encoder.encode(plain)
    return window.crypto.subtle.digest('SHA-256', data)
  }
  const base64encode = (input) => {
    return btoa(String.fromCharCode(...new Uint8Array(input)))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }
  const hashed = await sha256(codeVerifier)
  const codeChallenge = base64encode(hashed);
  
  
  const scope = 'user-read-private user-read-email';
  const authUrl = new URL("https://accounts.spotify.com/authorize")
  
  // generated in the previous step
  window.localStorage.setItem('code_verifier', codeVerifier);
  
  const params =  {
    response_type: 'code',
    client_id: clientId,
    scope,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    redirect_uri: redirectUri,
  }
  authUrl.search = new URLSearchParams(params).toString();
  window.location.href = authUrl.toString();  
  // Once the user completes the Spotify authentication, they will be redirected back to your app with the 'code' in the URL.
}


async function getCodeAfterAuthentication() {
  const urlParams = new URLSearchParams(window.location.search);
  code = urlParams.get('code');
  console.log(code);
  if (code) {
    // If 'code' is available in the URL, use it to get the access token.
    document.getElementById("page1").classList.add("is-hidden");
    document.getElementById("page2").classList.remove("is-hidden");
    await getToken(code);
  } else {
    console.log("User needs to complete Spotify authentication.");
  }
}

const getToken = async code => {
  // stored in the previous step
  let codeVerifier2 = localStorage.getItem('code_verifier');

  const payload = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier2,
    }),
  }

  try {
    const body = await fetch("https://accounts.spotify.com/api/token", payload);
    if (!body.ok) {
      throw new Error(`HTTP status ${body.status}`);
    }

    const response = await body.json();
    console.log('Access Token:', response.access_token);
    localStorage.setItem('access_token', response.access_token);
    fetchProfile();

  } catch (error) {
    console.error('Error in getToken:', error);
  }
}


var displayName = document.getElementById("displayName");
const apiEndpoint = 'https://api.spotify.com/v1/me'; // This is an example endpoint to get the user's profile.


async function fetchProfile() {
  const result = await fetch("https://api.spotify.com/v1/me", {
      method: "GET", headers: { Authorization: `Bearer ${localStorage.access_token}` }
  });
  const profile = await result.json();
  console.log(profile);
  displayName.innerHTML = "Welcome " + profile.display_name;
  localStorage.userId = profile.id;
  if (profile.images[0]) {
    const profileImage = new Image(200, 200);
    profileImage.src = profile.images[0].url;
    document.getElementById("imgUrl").src = profile.images[0].url;
} 
}






function displaySongData(){
  SongDetails.innerHTML = ""
}




// function getUserData(){
//   fetch(apiEndpoint, {
//     method: 'GET',
//     headers: {
//       'Authorization': `Bearer ${localStorage.access_token}`,
//     },
//   })
//     .then(response => {
//       if (!response.ok) {
//         throw new Error('HTTP status ' + response.status);
//       }
//       return response.json();
//     })
//     .then(data => {
//       // Handle the response data here
//       console.log('User Profile Data:', data);
//       displayName.innerHTML = "Welcome " + data.display_name;
//       localStorage.userId = data.id;
      
//     })
//     .catch(error => {
//       console.log(localStorage.access_token)
//       console.error('Error:', error);
  
//     });
//   }