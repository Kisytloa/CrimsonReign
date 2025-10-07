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
    "Martialiste Femme": ["Elementiste", "Spirite", "Lancière","Pugiliste"],
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
        let calendar = null;
        if (calendarEl) {
            // Configuration FullCalendar
            calendar = new FullCalendar.Calendar(calendarEl, {
                initialView: 'dayGridMonth',
                firstDay:3,
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
                },
                eventDidMount: function(info) {
                    // Ajoute le badge HM/NM en HTML dans l'événement
                    let titleText = info.event.title.replace(/^\s*\d{1,2}\s*(a|p|am|pm)\s*:*/i, "");
                    let badge = '';
                    if (/HM/i.test(titleText)) {
                        badge = '<span style="display:inline-block;font-size:0.95em;font-weight:bold;padding:2px 8px;border-radius:8px;margin-left:6px;color:#fff;background:#d32f2f;">HM</span>';
                    } else if (/NM/i.test(titleText)) {
                        badge = '<span style="display:inline-block;font-size:0.95em;font-weight:bold;padding:2px 8px;border-radius:8px;margin-left:6px;color:#fff;background:#0074d9;">NM</span>';
                    }
                    const titleEl = info.el.querySelector('.fc-event-title');
                    if (titleEl) {
                        titleEl.innerHTML = titleText + (badge ? ' ' + badge : '');
                    }
                }
            });
            calendar.render(); // Rendu du calendrier
            console.log("✅ Calendrier FullCalendar rendu avec succès");
        }
        // Charger les raids en temps réel depuis Firestore
    function loadRaidsFromFirestore() {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0)).getTime();  // 00:00:00
        const endOfDay = new Date(today.setHours(23, 59, 59, 999)).getTime();  // 23:59:59
        const raidListToday = document.getElementById('raid-list-today');
        
        // Supprimer la phrase "Aucun raid prévu aujourd'hui." si elle existe
        const noRaidsMessage = raidListToday.querySelector('li');
        if (noRaidsMessage && noRaidsMessage.textContent === 'Aucun raid prévu aujourd\'hui.') {
            raidListToday.removeChild(noRaidsMessage);
        }
    
        raidListToday.innerHTML = '';  // Vider la liste avant d'ajouter les raids du jour
    
        // Requête Firestore pour récupérer les raids triés par 'datTime' (date d'ajout)
        db.collection("raids")
            .orderBy("datTime")  // Tri par date d'ajout (datTime)
            .onSnapshot((snapshot) => {
                // Nettoyer les événements existants dans le calendrier
                calendar.getEvents().forEach(event => event.remove());

                // Vider les options des sélecteurs
                let raidSelectRemove = document.getElementById('raid-select-remove');
                let raidSelectInscription = document.getElementById('raid-select-inscription');
                raidSelectRemove.innerHTML = '<option value="">-- Sélectionner un Raid --</option>';
                raidSelectInscription.innerHTML = '<option value="">-- Sélectionner un Raid --</option>';

                let raidsTodayAdded = false;  // Flag pour savoir si des raids sont ajoutés pour aujourd'hui

                // Ajouter de nouveaux événements à partir de Firestore
                snapshot.forEach(doc => {
                    let raid = doc.data();
                    let raidDateTime = raid.datTime.toDate();  // Convertir la date et l'heure en objet Date
                    let raidTimestamp = raidDateTime.getTime();
                    let formattedDate = raidDateTime.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                    let formattedTime = raidDateTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

                    // LOG pour debug : afficher chaque raid et sa date
                    console.log(`[DEBUG] Raid Firestore:`, raid.title, raidDateTime, raidTimestamp);

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

                    // Vérifier si le raid a lieu aujourd'hui
                    if (raidTimestamp >= startOfDay && raidTimestamp <= endOfDay) {
                        let optionToday = new Option(`${raid.title} - ${formattedDate} à ${formattedTime}`, doc.id);

                        // Ajouter un élément à la liste des raids d'aujourd'hui
                        const listItem = document.createElement('li');
                        let badge = '';
                        if (raid.title.toUpperCase().includes('HM')) {
                            badge = '<span style="display:inline-block;font-size:0.95em;font-weight:bold;padding:2px 8px;border-radius:8px;margin-left:6px;color:#fff;background:#d32f2f;">HM</span>';
                        } else if (raid.title.toUpperCase().includes('NM')) {
                            badge = '<span style="display:inline-block;font-size:0.95em;font-weight:bold;padding:2px 8px;border-radius:8px;margin-left:6px;color:#fff;background:#0074d9;">NM</span>';
                        }
                        listItem.innerHTML = `${raid.title} ${badge} - ${formattedDate} à ${formattedTime}`;
                        listItem.setAttribute('data-raid-id', doc.id);
                        raidListToday.appendChild(listItem);

                        listItem.addEventListener('click', function() {
                            openRaidPopup(doc.id);
                        });

                        raidsTodayAdded = true;
                    }
                });
    
                // Si aucun raid n'a été ajouté pour aujourd'hui, afficher "Aucun raid prévu aujourd'hui."
                if (!raidsTodayAdded) {
                    const noRaidsMessage = document.createElement('li');
                    noRaidsMessage.textContent = 'Aucun raid prévu aujourd\'hui.';
                    raidListToday.appendChild(noRaidsMessage);
                }
            }, (error) => {
                console.error("❌ Erreur lors de la récupération des événements:", error);
                alert("❌ " + error.message);
            });
    }
    
    
    // Fonction pour ouvrir la popup avec les détails du raid
    // Fonction pour ouvrir la popup avec les détails du raid
    function openRaidPopup(raidId) {
        const popup = document.getElementById('raid-detail-popup');
        const popupTitle = document.getElementById('raid-detail-title');
        const popupDate = document.getElementById('raid-detail-date');
        const popupTime = document.getElementById('raid-detail-time');
        const popupInscriptionsList = document.getElementById('raid-detail-inscriptions-list');

        // Récupérer les informations du raid depuis Firestore
        db.collection("raids").doc(raidId).get().then((doc) => {
            if (doc.exists) {
                const raid = doc.data();
                const raidDateTime = raid.datTime.toDate();
                const formattedDate = raidDateTime.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                const formattedTime = raidDateTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

                // Remplir la popup avec les informations du raid
                popupTitle.textContent = raid.title;
                popupDate.textContent = formattedDate;
                popupTime.textContent = formattedTime;

                // Afficher les inscriptions des joueurs
                const playersList = raid.inscriptions || []; // Assurez-vous que raid.inscriptions est bien un tableau
                popupInscriptionsList.innerHTML = ''; // Vider la liste des inscriptions avant de la remplir

                if (Array.isArray(playersList) && playersList.length > 0) {
                    // Si playersList est un tableau et contient des éléments
                    playersList.forEach(player => {
                        const playerItem = document.createElement('li');
                        playerItem.textContent = `Pseudo: ${player.Pseudo} - Classe: ${player.Classe}`;
                        popupInscriptionsList.appendChild(playerItem);
                    });
                } else {
                    // Si la liste est vide ou non définie, afficher un message approprié
                    const noPlayersItem = document.createElement('li');
                    noPlayersItem.textContent = 'Aucun joueur inscrit';
                    popupInscriptionsList.appendChild(noPlayersItem);
                }

                // Ouvrir la popup
                popup.style.display = 'block';
            } else {
                console.log("Raid non trouvé");
            }
        }).catch((error) => {
            console.error("Erreur lors de la récupération des informations du raid:", error);
        });
    }


    
    // Fermer la popup avec la croix
    document.getElementById('popup-close-btn').addEventListener('click', function() {
        document.getElementById('raid-detail-popup').style.display = 'none';
    });
    
    // Fermer la popup en cliquant n'importe où en dehors de la pop-up
    var popupCloseBtn = document.getElementById('popup-close-btn');
    var raidDetailPopup = document.getElementById('raid-detail-popup');
    if (popupCloseBtn && raidDetailPopup) {
        popupCloseBtn.addEventListener('click', function() {
            raidDetailPopup.style.display = 'none';
        });
        raidDetailPopup.addEventListener('click', function(event) {
            if (event.target === this) {  // Vérifie si le clic est effectué sur l'arrière-plan
                this.style.display = 'none';
            }
        });
    }

    loadRaidsFromFirestore(); // Charger les raids dès que le script est chargé

    // Ajouter un raid
    var addRaidBtn = document.getElementById('add-raid-btn');
    if (addRaidBtn) {
        addRaidBtn.addEventListener('click', function () {
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
            if (calendar && !calendar.getEventById(docRef.id)) {
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
    }

    // Supprimer un raid
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

            // Remplir la liste des inscriptions avec les joueurs + bouton de désinscription
            inscriptionsList.forEach(player => {
                let listItem = document.createElement('li');
                listItem.innerText = `${player.Pseudo} (${player.Classe}) `;

                let unsubscribeBtn = document.createElement('button');
                unsubscribeBtn.innerText = "❌";
                unsubscribeBtn.style.marginLeft = "10px";
                unsubscribeBtn.style.cursor = "pointer";
                unsubscribeBtn.onclick = () => unsubscribeFromRaid(raidId, player.Pseudo);

                listItem.appendChild(unsubscribeBtn);
                inscriptionsListElement.appendChild(listItem);
            });

            // Afficher la popup avec les détails du raid
            let popup = document.getElementById('raid-detail-popup');
            popup.style.display = 'block';

            // Fermer la pop-up en cliquant en dehors du contenu
            popup.addEventListener('click', function (event) {
                if (event.target === this) { 
                    closePopup();
                }
            });

        } else {
            console.error("Raid non trouvé !");
        }
    }).catch(error => {
        console.error("Erreur de récupération des données du raid :", error);
    });
}

// Fonction de désinscription d'un raid
function unsubscribeFromRaid(raidId, playerName) {
    db.collection("raids").doc(raidId).get().then(doc => {
        if (doc.exists) {
            let raidData = doc.data();
            let newInscriptions = (raidData.inscriptions || []).filter(player => player.Pseudo !== playerName);

            // Mettre à jour les inscriptions dans Firestore
            db.collection("raids").doc(raidId).update({
                inscriptions: newInscriptions
            }).then(() => {
                console.log(`Joueur ${playerName} désinscrit du raid ${raidId}`);
                updateRaidDetails(raidId); // Rafraîchir les détails du raid
            }).catch(error => {
                console.error("Erreur lors de la mise à jour :", error);
            });

        } else {
            console.error("Raid non trouvé !");
        }
    }).catch(error => {
        console.error("Erreur lors de la récupération du raid :", error);
    });
}

// Fonction pour fermer la pop-up
function closePopup() {
    document.getElementById('raid-detail-popup').style.display = 'none';
}

// Fermer la pop-up en cliquant sur le bouton de fermeture
document.getElementById('popup-close-btn').addEventListener('click', closePopup);


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
    function ajouterPersonnages(membreId) {
        const personnages = [
            {
                nom_personnage: "Soulmania",
                classe: "Wardancer",
                ilvl: 1692.5,
                raids: ["Brelshaza", "Aegir HM", "Behemoth"],
                synergie: "Oui",
                type: "Crit Rate +10%"
            },
            {
                nom_personnage: "Soulanature",
                classe: "Wildsoul",
                ilvl: 1680,
                raids: ["Brelshaza", "Aegir HM", "Behemoth"],
                synergie: "Oui",
                type: "Break Armor -12%"
            },
            {
                nom_personnage: "Soulsofayaya",
                classe: "Artist",
                ilvl: 1660,
                raids: ["Aegir", "Behemoth", "Echidna"],
                synergie: "Oui",
                type: "Brand Damage +10%"
            },
            {
                nom_personnage: "Soulrotboy",
                classe: "Scouter",
                ilvl: 1660.17,
                raids: ["Aegir", "Behemoth", "Echidna"],
                synergie: "Oui",
                type: "Atk Power up +6%"
            },
            {
                nom_personnage: "Soulavoisacred",
                classe: "Breaker",
                ilvl: 1660.33,
                raids: ["Aegir", "Behemoth", "Echidna"],
                synergie: "Oui",
                type: "Damage +6%"
            },
            {
                nom_personnage: "Soulmaniacal",
                classe: "Slayer",
                ilvl: 1663,
                raids: ["Aegir", "Behemoth", "Echidna"],
                synergie: "Oui",
                type: "Damage +6%"
            }
        ];
    
        // Ajouter les personnages dans la sous-collection "personnages"
        personnages.forEach((personnage) => {
            db.collection("membres").doc(membreId).collection("personnages").add(personnage)
                .then(() => {
                    console.log(`Personnage ${personnage.nom_personnage} ajouté avec succès.`);
                })
                .catch((error) => {
                    console.error("Erreur lors de l'ajout du personnage : ", error);
                });
        });
    }
