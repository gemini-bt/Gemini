const resizer = document.querySelector('.resize-bar-mid');
const leftSide = document.querySelector('.left-section');
const rightSide = document.querySelector('.right-section');

let startX = 0;

resizer.addEventListener('mousedown', function (e) {
    e.preventDefault();
    startX = e.clientX;
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', function () {
        window.removeEventListener('mousemove', resize);
    });
});

function resize(e) {
    const newWidth = e.clientX - resizer.offsetWidth / 2;

    if (newWidth <= 415 || newWidth >= window.innerWidth - 350) {
        return;
    }

    leftSide.style.flexBasis = newWidth + 'px';
    rightSide.style.flexBasis = `calc(100% - ${newWidth}px)`;

    // move resizer

    resizer.style.left = newWidth + 'px';
}