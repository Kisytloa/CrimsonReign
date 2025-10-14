document.addEventListener('DOMContentLoaded', function() {
    const annonceContent = document.getElementById('annonce-content');
    const deleteButton = document.getElementById('delete-button');
    const annonceForm = document.getElementById('annonce-form');

    // Charger l'annonce existante pour la modification
    const savedAnnonce = localStorage.getItem('nouvelle-annonce');
    if (savedAnnonce) {
        annonceContent.value = savedAnnonce;
    }

    // Gérer la soumission du formulaire (création/modification)
    annonceForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const content = annonceContent.value;
        localStorage.setItem('nouvelle-annonce', content);
        window.location.href = 'index.html';
    });

    // Gérer la suppression de l'annonce
    deleteButton.addEventListener('click', function() {
        localStorage.removeItem('nouvelle-annonce');
        annonceContent.value = '';
        window.location.href = 'index.html';
    });
});

