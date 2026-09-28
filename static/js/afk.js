let afkTimer;

function resetAfkTimer() {
    clearTimeout(afkTimer);

    afkTimer = setTimeout(() => {
        window.location.href = "/afk/";
    }, 5 * 60 * 1000);
}

function userActivity() {
    if (window.location.pathname === "/afk/") {
        window.location.href = "/";
        return;
    }
    resetAfkTimer();
}

document.addEventListener("mousemove", userActivity);
document.addEventListener("keydown", userActivity);
document.addEventListener("click", userActivity);
document.addEventListener("scroll", userActivity);

resetAfkTimer();