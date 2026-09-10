function showAlert(title, message) {
    const overlay = document.getElementById("customAlert");
    const titleElement = document.getElementById("customAlertTitle");
    const messageElement = document.getElementById("customAlertMessage");
    const button = document.getElementById("customAlertBtn");

    titleElement.textContent = title;
    messageElement.textContent = message;

    overlay.classList.add("show");

    button.onclick = () => {
        overlay.classList.remove("show");
    };
}