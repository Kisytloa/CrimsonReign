// Configuration Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAtERjNNb5VaLjB0TZyfEvQ337fs-a4AfA",
    authDomain: "bloodshadow-ffb01.firebaseapp.com",
    projectId: "bloodshadow-ffb01",
    storageBucket: "bloodshadow-ffb01.appspot.com",
    messagingSenderId: "1037132816744",
    appId: "1:1037132816744:web:9f9519d953b7f7a9bff6dd",
    measurementId: "G-W495PCSSP0"
};
const archtypeClasses = {
    "Guerrier": ["Berserker", "Paladin", "Destructeur", "Gunlancer"],
    "Guerrière": ["Slayer", "Paladine"],
    "Mage": ["Sorcière", "Arcaniste", "Barde", "Invocatrice"],
    "Martialiste Femme": ["Elementiste", "Spirite", "Lanicière","Pugiliste"],
    "Martialiste Homme": ["Striker", "Breaker"],
    "Assassin": ["Sanguelame", "Démoniste", "Faucheuse", "Dévoreuse d'âme"],
    "Gunner": ["Gunner", "Sagittaire", "Artilleur", "Machiniste"],
    "Gunneuse": ["Gunneuse"],
    "Spécialiste": ["Artiste", "Helètempète", "Ame sauvage",]
};

// Initialisation Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore(app);
const auth = firebase.auth(app);

document.addEventListener('DOMContentLoaded', function () {
    console.log("📅 Script chargé - Initialisation du calendrier");

    let calendarEl = document.getElementById('calendar');
    if (!calendarEl) {
        console.error("🚨 Erreur : Élément #calendar introuvable !");
        return;
    }

    // Configuration FullCalendar
    let calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'fr',
        editable: false,
        selectable: false,
        eventTimeFormat: { hour: '2-digit', minute: '2-digit', meridiem: false },
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        events: [], // Initialement vide, les événements seront chargés via Firestore
        eventClick: function(info) {
            // Mettre à jour le tableau avec les informations du raid sélectionné
            updateRaidDetails(info.event.id);
        }
    });

    calendar.render(); // Rendu du calendrier
    console.log("✅ Calendrier FullCalendar rendu avec succès");

    // Charger les raids en temps réel depuis Firestore
    function loadRaidsFromFirestore() {
        db.collection("raids").onSnapshot((snapshot) => {
            // Nettoyer les événements existants
            calendar.getEvents().forEach(event => event.remove());

            // Vider les options des sélecteurs
            let raidSelectRemove = document.getElementById('raid-select-remove');
            let raidSelectInscription = document.getElementById('raid-select-inscription');
            raidSelectRemove.innerHTML = '<option value="">-- Sélectionner un Raid --</option>';
            raidSelectInscription.innerHTML = '<option value="">-- Sélectionner un Raid --</option>';

            // Ajouter de nouveaux événements à partir de Firestore
            snapshot.forEach(doc => {
                let raid = doc.data();
                let raidDateTime = raid.datTime.toDate();  // Convertir la date et l'heure en objet Date
                let formattedDate = raidDateTime.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                let formattedTime = raidDateTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

                // Créer un événement pour FullCalendar
                let newEvent = { 
                    id: doc.id, 
                    title: raid.title, 
                    start: raid.datTime.toDate(),  // Assurez-vous de convertir en Date avant d'ajouter
                    extendedProps: {
                        formattedDate,
                        formattedTime
                    }
                };
                calendar.addEvent(newEvent);

                // Ajouter l'option avec le titre, la date et l'heure formatée
                let optionRemove = new Option(`${raid.title} - ${formattedDate} à ${formattedTime}`, doc.id);
                let optionInscription = new Option(`${raid.title} - ${formattedDate} à ${formattedTime}`, doc.id);
                raidSelectRemove.appendChild(optionRemove);
                raidSelectInscription.appendChild(optionInscription);
            });
        }, (error) => {
            console.error("❌ Erreur lors de la récupération des événements:", error);
            alert("❌ " + error.message);
        });
    }

    loadRaidsFromFirestore(); // Charger les raids dès que le script est chargé

    // Ajouter un raid
    document.getElementById('add-raid-btn').addEventListener('click', function () {
        let raidName = document.getElementById('raid-select').value;
        let raidDate = document.getElementById('raid-date').value;
        let raidTime = document.getElementById('raid-time').value;

        if (!raidName || !raidDate || !raidTime) {
            alert("❌ Veuillez sélectionner un raid, une date et une heure !");
            return;
        }

        let raidDateTime = new Date(`${raidDate}T${raidTime}:00`); // Création d'une date complète en format Date

        // Ajouter le raid à Firestore
        db.collection("raids").add({
            title: raidName,
            datTime: firebase.firestore.Timestamp.fromDate(raidDateTime),  // Envoi au format Firestore Timestamp
            inscriptions: [],
            maxPlayers: 10 // Ajouter un champ maxPlayers pour définir la limite d'inscriptions
        }).then((docRef) => {
        console.log("✅ Raid ajouté à Firestore !");

        // Ajouter immédiatement l'événement au calendrier
        let formattedDate = raidDateTime.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        let formattedTime = raidDateTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

        let newEvent = {
            id: docRef.id,
            title: raidName,
            start: raidDateTime,  // Ajout de l'événement directement avec la date et l'heure
            extendedProps: {
                formattedDate,
                formattedTime
            }
        };

        // Ajouter l'événement au calendrier uniquement après avoir confirmé l'ajout dans Firestore
        if (!calendar.getEventById(docRef.id)) {
            // Vérifier qu'un événement avec ce ID n'existe pas déjà
            calendar.addEvent(newEvent);
            console.log("✅ Événement ajouté au calendrier !");
        } else {
            console.log("⚠️ L'événement existe déjà dans le calendrier.");
        }

        }).catch(error => {
            console.error("❌ Erreur lors de l'ajout du raid :", error);
            alert("❌ " + error.message);
        });
    });

    // Retirer un raid
    document.getElementById('remove-raid-btn').addEventListener('click', function () {
        let raidToRemoveId = document.getElementById('raid-select-remove').value;

        if (!raidToRemoveId) {
            alert("❌ Sélectionnez un raid à supprimer !");
            return;
        }

        db.collection("raids").doc(raidToRemoveId).delete().then(() => {
            console.log("✅ Raid supprimé !");

            // Supprimer l'événement du calendrier
            let eventToRemove = calendar.getEventById(raidToRemoveId);
            if (eventToRemove) {
                eventToRemove.remove();  // Retirer l'événement du calendrier
            }

            // Retirer l'option du menu déroulant "Retirer un Raid"
            let raidSelectRemove = document.getElementById('raid-select-remove');
            let optionToRemove = raidSelectRemove.querySelector(`option[value="${raidToRemoveId}"]`);
            if (optionToRemove) {
                raidSelectRemove.removeChild(optionToRemove);
            }

            // Retirer l'option du menu déroulant "Inscription"
            let raidSelectInscription = document.getElementById('raid-select-inscription');
            let optionToRemoveInscription = raidSelectInscription.querySelector(`option[value="${raidToRemoveId}"]`);
            if (optionToRemoveInscription) {
                raidSelectInscription.removeChild(optionToRemoveInscription);
            }

        }).catch(error => {
            console.error("❌ Erreur lors de la suppression du raid :", error);
            alert("❌ " + error.message);
        });
    });

    // Inscription raid
    document.getElementById('inscription-btn').addEventListener('click', function () {
        let raidId = document.getElementById('raid-select-inscription').value;
        let playerPseudo = document.getElementById('player-name').value;
        let playerClasse = document.getElementById('player-class').value;

        if (!raidId || !playerPseudo || !playerClasse) {
            alert("❌ Veuillez remplir tous les champs !");
            return;
        }

        db.collection("raids").doc(raidId).get().then((doc) => {
            if (doc.exists) {
                let raidData = doc.data();
                let currentPlayers = raidData.inscriptions || [];

                if (currentPlayers.length >= raidData.maxPlayers) {
                    alert("❌ Le raid est complet !");
                    return;
                }

                if (currentPlayers.some(player => player.Pseudo === playerPseudo)) {
                    alert("❌ Vous êtes déjà inscrit à ce raid !");
                    return;
                }

                // Ajouter l'inscription
                currentPlayers.push({ Pseudo: playerPseudo, Classe: playerClasse });

                // Mettre à jour la collection "raids"
                db.collection("raids").doc(raidId).update({
                    inscriptions: currentPlayers
                }).then(() => {
                    alert("✅ Inscription réussie !");
                    console.log("✅ Joueur inscrit au raid !");
                }).catch(error => {
                    console.error("❌ Erreur lors de l'inscription :", error);
                    alert("❌ " + error.message);
                });
            } else {
                alert("❌ Raid introuvable !");
            }
        }).catch(error => {
            console.error("❌ Erreur lors de la récupération du raid :", error);
            alert("❌ " + error.message);
        });
    });

    // Afficher les détails du raid
    function updateRaidDetails(raidId) {
        db.collection("raids").doc(raidId).get().then(doc => {
            if (doc.exists) {
                let raidData = doc.data();
                let inscriptionsList = raidData.inscriptions || [];

                document.getElementById('raid-detail-title').innerText = raidData.title;

                // Vérifier si datTime existe et est valide
                if (raidData.datTime && raidData.datTime.seconds) {
                    document.getElementById('raid-detail-date').innerText = new Date(raidData.datTime.seconds * 1000).toLocaleDateString();
                    document.getElementById('raid-detail-time').innerText = new Date(raidData.datTime.seconds * 1000).toLocaleTimeString();
                } else {
                    console.error("Erreur : datTime non défini ou mal formaté !");
                }

                // Vider la liste des inscriptions avant de la remplir
                let inscriptionsListElement = document.getElementById('raid-detail-inscriptions-list');
                inscriptionsListElement.innerHTML = '';

                // Remplir la liste des inscriptions avec les joueurs
                inscriptionsList.forEach(player => {
                    let Pseudo = player.Pseudo
                    let Classe = player.Classe
                    let listItem = document.createElement('li');
                    listItem.innerText = `${Pseudo} (${Classe})`;
                    inscriptionsListElement.appendChild(listItem);
                });

                // Afficher la popup avec les détails du raid
                document.getElementById('raid-detail-popup').style.display = 'block';
            } else {
                console.error("Raid non trouvé !");
            }
        }).catch(error => {
            console.error("Erreur de récupération des données du raid :", error);
        });
    }

    // Fermer le pop-up
    document.getElementById('popup-close-btn').addEventListener('click', function () {
        document.getElementById('raid-detail-popup').style.display = 'none';
    });

    // Authentification des utilisateurs
    auth.onAuthStateChanged(user => {
        let userStatus = document.getElementById('user-status');
        if (user) {
            userStatus.textContent = `✅ Connecté : ${user.email}`;
        } else {
            userStatus.textContent = "🔴 Déconnecté";
        }
    });

    // Connexion utilisateur
    document.getElementById('login-btn').addEventListener('click', function () {
        let email = document.getElementById('email').value;
        let password = document.getElementById('password').value;

        auth.signInWithEmailAndPassword(email, password)
            .then(userCredential => {
                document.getElementById('user-status').textContent = `✅ Connecté : ${userCredential.user.email}`;
            })
            .catch(error => {
                console.error("❌ Erreur de connexion:", error.message);
                alert("❌ " + error.message);
            });
    });

    // Déconnexion utilisateur
    document.getElementById('logout-btn').addEventListener('click', function () {
        auth.signOut().then(() => {
            document.getElementById('user-status').textContent = "🔴 Déconnecté";
        }).catch(error => {
            console.error("❌ Erreur lors de la déconnexion:", error.message);
            alert("❌ " + error.message);
        });
    });

    // Changer la vue du calendrier
    document.getElementById('month-view-btn').addEventListener('click', function () {
        calendar.changeView('dayGridMonth');
    });

    document.getElementById('week-view-btn').addEventListener('click', function () {
        calendar.changeView('timeGridWeek');
    });

    // Ajouter le bouton "Clear All"
    document.getElementById('clear-all-btn').addEventListener('click', function () {
        if (confirm("Êtes-vous sûr de vouloir supprimer tous les raids ? Cette action est irréversible.")) {
            db.collection("raids").get().then((snapshot) => {
                snapshot.forEach((doc) => {
                    db.collection("raids").doc(doc.id).delete().then(() => {
                        console.log("Raid supprimé");
                    }).catch((error) => {
                        console.error("Erreur de suppression de raid:", error);
                    });
                });
            }).catch((error) => {
                console.error("Erreur de récupération des raids:", error);
            });
        }
    });
});



    // Mettre à jour les options de classes en fonction de l'archétype
    document.getElementById('player-archtype').addEventListener('change', function () {
        let archtype = this.value;
        let classSelect = document.getElementById('player-class');

        // Vider les classes existantes
        classSelect.innerHTML = '<option value="">-- Sélectionner une classe --</option>';

        if (archtype) {
        // Ajouter les classes correspondantes
            let classes = archtypeClasses[archtype];
            classes.forEach(function (classe) {
                let option = new Option(classe, classe);
                classSelect.appendChild(option);
            });
        }
    });