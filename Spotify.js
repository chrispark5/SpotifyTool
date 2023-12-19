//spotipy for python Spotify API
const axios = window.axios;

var clientId = "5db8362bcba44d2aaf13fb20f45dec30";
var clientSecret = "7070638e695246fd9ac68c95e61cdcb6";
var accessToken;

var logInBtn = document.getElementById("logInBtn");
const redirectUri = 'http://localhost:8383/index.html';
// const redirectUri = 'https://chrispark5.github.io/SpotifyTool'
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
  
  
  const scope = 'user-read-private user-read-email playlist-modify-private playlist-read-private playlist-read-collaborative';
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
    await loadPlaylists();
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
  // displayName.innerHTML = "Welcome " + profile.display_name;
  localStorage.userId = profile.id;
//   if (profile.images[0]) {
//     const profileImage = new Image(200, 200);
//     profileImage.src = profile.images[0].url;
//     document.getElementById("imgUrl").src = profile.images[0].url;
// } 
}



let artistID = "0TnOYISbd1XYRBk9myaseg"; //test artist ID


async function displayArtistData() {
  const result = await fetch(`https://api.spotify.com/v1/artists/${artistID}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${localStorage.access_token}` },
  });

  if (result.ok) {
    const data = await result.json(); // Extract JSON data from the response
    console.log(data); // Log the retrieved data

    // Perform actions with the retrieved data, e.g., update UI
    // For example, assuming SongDetails is an HTML element where you want to display the data:
    SongDetails.innerHTML = `<p>${data.name}</p>`; // Displaying the artist's name
  } else {
    console.error('Failed to fetch data');
  }
}

let playlistID = "";

async function createPlaylist(){
  let playlistName = document.getElementById("playlistName").value
  let playlistBtn = document.getElementById("playlistBtn");
  console.log(localStorage.access_token)
  console.log(localStorage.userId)
  const result = await fetch(`https://api.spotify.com/v1/users/${localStorage.userId}/playlists`, {
    method: "POST", 
    headers: { Authorization: `Bearer ${localStorage.access_token}` ,  "Content-Type": "application/json"}, // Added content type for JSON
    body: JSON.stringify({
      "name": playlistName, // Use the variable playlistName for the playlist name
      "description": "New playlist description",
      "public": false
    })
});
if (result.ok) {
  // Playlist created successfully
  console.log("Playlist created successfully!");
  playlistBtn.innerHTML="Playlist Created!"
  console.log(result)
  const response = await result.json();
  console.log(response)
  playlistID = response.id;
  loadPlaylists();
} else {
  // Error handling
  playlistBtn.innerHTML="Error!"
  playlistBtn.style.border="red";
  console.error("Error creating playlist:", result.status, result.message);
}
}


//makes this separate for each search bar based on which input is active. Which one is focused on by user
var input = document.getElementById("searchItem");
input.addEventListener("keypress", function(event) {
  // If the user presses the "Enter" key on the keyboard
  if (event.key === "Enter") {
    // Cancel the default action, if needed
    event.preventDefault();
    // Trigger the button element with a click
    document.getElementById("searchBtn").click();
  }
});

let item1 = document.getElementById("item1");
let item2 = document.getElementById("item2");
let item3 = document.getElementById("item3");
let item4 = document.getElementById("item4");
let item5 = document.getElementById("item5");


var searchItem = document.getElementById("searchItem");
var songArr = [];
async function searchForItem() {
  //add function for adding + between spaces of seearchItem.value
  buttons.forEach(button => {
    button.innerHTML = "Add to Cart";
    button.disabled = false;
  });
  var search = searchItem.value + "&type=track,artist";
  const result = await fetch(`https://api.spotify.com/v1/search?q=${search}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${localStorage.access_token}` },
  });

  if (result.ok) {
    const data = await result.json(); 
    for (i=1; i<10;i++){
      var desc = "desc" + i;
      var item = "item" + i;
      var dsc = document.getElementById(desc);
      var itm = document.getElementById(item);
      dsc.innerHTML = data.tracks.items[i-1].name + " - " + data.tracks.items[i-1].artists[0].name;
      itm.src = data.tracks.items[i-1].album.images[0].url
      songArr.push(data.tracks.items[i-1].id);
    }
    toggleButtons();
    console.log(data);
    // console.log(data.tracks.items[0].name)
    // console.log(data.tracks)
    //get image and artist too
//album.images
  } else {
    console.error('Failed to fetch data');
  }
}

function toggleButtons() {
  const buttons = document.querySelectorAll('.grid button');
  buttons.forEach(button => {
    button.style.display = ('block');
  });
}

var checkoutString = "uris="; //maybe switch to json object to clean up large song lists
async function checkout(){
  const result = await fetch(`https://api.spotify.com/v1/playlists/${playlistID}/tracks?${checkoutString}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${localStorage.access_token}` },
  });

  if (result.ok) {
    const data = await result.json(); 
    console.log("Successfully added songs to playlist")
  } else {
    console.error('Failed to fetch data');
  }
}

var playlists;
async function loadPlaylists(){
  const result = await fetch(`https://api.spotify.com/v1/users/${localStorage.userId}/playlists?limit=50`, {
    method: "GET",
    headers: { Authorization: `Bearer ${localStorage.access_token}` },
  });
  playlists = await result.json();
  for (i = 0; i<playlists.items.length;i++){
      var playlist = document.createElement("option");
      playlist.innerHTML = playlists.items[i].name;
      $("select").append(playlist);
  }
}

$("select").on("change", function() {
  var selectedPlaylistName = $(this).find("option:selected").text();
  for (var i = 0; i < playlists.items.length; i++) {
    if (playlists.items[i].name === selectedPlaylistName) {
      playlistID = playlists.items[i].id;
      break; // Exit the loop once the ID is found
    }
  }
});

function page3(){
  document.getElementById("page2").classList.add("is-hidden");
    document.getElementById("page3").classList.remove("is-hidden");
}
function cart(){
  document.getElementById("page2").classList.add("is-hidden");
  document.getElementById("page1").classList.add("is-hidden");
  document.getElementById("page3").classList.add("is-hidden");
  document.getElementById("cart").classList.remove("is-hidden");

}

let checkoutList = []
const buttons = document.querySelectorAll('.grid .button');
async function addSongToCart(event) {
  event.target.disabled = true;
  event.target.innerHTML = "Added to cart"
  const paragraphId = event.target.previousElementSibling.id;
  let song = paragraphId.charAt(paragraphId.length-1);
  var songID = songArr[parseInt(song)-1];
  checkoutList.push(songID);
  var checkoutItem = document.createElement("p");
  const result = await fetch(`https://api.spotify.com/v1/tracks/${songID}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${localStorage.access_token}` },
  });
  var song_json = await result.json();
  console.log(song_json);
  checkoutItem.innerHTML = song_json.name;
  $("#cart").append(checkoutItem);

  checkoutString += "spotify:track:" + songID + ",";
}
// Add click event listener to each button
buttons.forEach(button => {
  button.addEventListener('click', addSongToCart);
});