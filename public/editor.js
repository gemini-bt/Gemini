window.editingId = window.location.pathname.split('/').pop();

var bannerInput = document.getElementById('banner');
var authorNameInput = document.getElementById('author-name');
var authorEmailInput = document.getElementById('author-email');
var authorPictureInput = document.getElementById('author-picture');
var summaryInput = document.getElementById('summary');
var rulesInput = document.getElementById('rules')
var prizesInput = document.getElementById('prizes')
var nameInput = document.getElementById('title')

var bannerPreview = document.getElementById('preview-banner');
var previewAuthorImage = document.getElementById('preview-author-image');
var previewAuthorName = document.getElementById('preview-author-name');
var previewAuthorEmail = document.getElementById('preview-author-email');
var previewSummary = document.getElementById('preview-summary');
var previewRules = document.getElementById('preview-rules');
var previewPrizes = document.getElementById('preview-prizes');
var previewName = document.getElementById('preview-title')

// Function to update preview sections
  function updatePreview() {
    
    console.log('e')
    // Update banner preview
    if (bannerInput.files && bannerInput.files[0]) {
        var reader = new FileReader();
        reader.onload = function(e) {
            bannerPreview.style.backgroundImage = "url('" + e.target.result + "')";
            document.getElementById('preview-banner-blur').style.backgroundImage = "url('" + e.target.result + "')";
        }
        reader.readAsDataURL(bannerInput.files[0]);
    }

    // Update author preview
    previewAuthorName.innerText = authorNameInput.value;
    previewAuthorEmail.innerText = authorEmailInput.value;

    // Update author image preview
    if (authorPictureInput.files && authorPictureInput.files[0]) {
        var reader = new FileReader();
        reader.onload = function(e) {
            previewAuthorImage.src = e.target.result;
        }
        reader.readAsDataURL(authorPictureInput.files[0]);
    }

    // Update text preview
    previewSummary.innerText = summaryInput.value;
    previewRules.innerText = rulesInput.value;
    previewPrizes.innerText = prizesInput.value;
    previewName.innerText = nameInput.value;
}

function toDataURL(file) {
    return new Promise((resolve, reject) => {
        var reader = new FileReader();
        reader.onload = function(e) {
            resolve(e.target.result);
        }
        reader.readAsDataURL(file);
    });
}

// Listen for changes in input fields
document.querySelectorAll('.left-section *').forEach(function(element) {
    element.addEventListener('input', updatePreview);
});

document.getElementById("save").addEventListener("click", async function() {
    var formData = new FormData();
    formData.append('id', window.editingId);
    formData.append('title', nameInput.value);
    formData.append('banner', bannerInput.files.length ? await toDataURL(bannerInput.files[0]) : "");
    formData.append('authorName', authorNameInput.value);
    formData.append('authorEmail', authorEmailInput.value);
    formData.append('authorPicture', authorPictureInput.files.length ? await toDataURL(authorPictureInput.files[0]) : "");
    formData.append('summary', summaryInput.value);
    formData.append('rules', rulesInput.value);
    formData.append('prizes', prizesInput.value);

    await fetch('/api/save', {
        method: 'POST',
        body: formData
    });

    document.getElementById("save").innerText = "Saved!";
    setTimeout(function() {
        document.getElementById("save").innerText = "Save";
    }, 1000);
});

document.getElementById("preview").addEventListener("click", async function() {
    await fetch("/api/compile", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `id=${window.editingId}`
    });

    open('/competitions/' + window.editingId);
});

document.addEventListener('beforeunload', function() {
    return 'Are you sure you want to leave?';
});

document.addEventListener("DOMContentLoaded", async function() {
    const data = await fetch('/api/competition/' + window.editingId);
    const json = await data.json();

    document.getElementById('title').value = json.name || '';
    document.getElementById('preview-banner').style.backgroundImage = "url('" + json.banner + "')";
    document.getElementById('preview-banner-blur').style.backgroundImage = "url('" + json.banner + "')";
    document.getElementById('author-name').value = json.organizer || '';
    document.getElementById('author-email').value = json.contact || '';
    document.getElementById('preview-author-image').src = json.authorImg;
    document.getElementById('summary').value = json.description || '';
    document.getElementById('rules').value = json.rules || '';
    document.getElementById('prizes').value = json.prizes || '';

    updatePreview();
});