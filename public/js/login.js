const loginButton = document.getElementById("login_button");
const closeButton = document.getElementsByClassName("close_button");
let popupLoginBackground = document.getElementById("login_popup");
const signinButton = document.getElementById("signin_button");

let popupSigninBackground = document.getElementById("signin_popup");

loginButton.addEventListener("click", (e) =>{
    e.preventDefault();
    popupLoginBackground.style.display = "flex"
});

signinButton.addEventListener("click", (e) =>{
    e.preventDefault();
    popupSigninBackground.style.display = "flex"
});

for (let i = 0; i < closeButton.length; i++) {
    closeButton.addEventListener("click", (e) =>{
        e.preventDefault();
        popupLoginBackground.style.display = "none"
        popupSigninBackground.style.display = "none"
    });
}