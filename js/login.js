const loginButton = document.getElementById("login_button");
const closeLoginButton = document.getElementById("close_login_button");
let popupBackground = document.getElementById("account_popups");

loginButton.addEventListener("click", () =>{
    popupBackground.style.display = "flex"
});

closeLoginButton.addEventListener("click", () =>{
    popupBackground.style.display = "none"
});