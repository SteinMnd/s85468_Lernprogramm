
document.addEventListener("DOMContentLoaded", function() {
    let currentCategory = '';  
    let remainingTasks = [];  
    let correctAnswers = 0;  
    let wrongAnswers = 0;  
    let totalTasks = 0;  

    // Funktion zum Abrufen von Aufgaben von einer angegebenen URL und optionalem Schlüssel
    async function fetchTasks(url, key = null) {
        try {
            const response = await fetch(url);  // Abrufen der Daten von der URL
            if (!response.ok) {
                throw new Error(`HTTP-Fehler! Status: ${response.status}`);
            }
            const data = await response.json();  // Konvertieren der Antwort in JSON
            return key ? data[key] : data;  // Rückgabe der Daten oder des Schlüssels
        } catch (error) {
            console.error('Fehler beim Abrufen der Aufgaben:', error);
            return [];  // Rückgabe eines leeren Arrays im Fehlerfall
        }
    }

    // Funktion zum Abrufen von Notenaufgaben, erfordert Basisauthentifizierung
    async function fetchNoteTasks(startId, numQuestions) {
        const tasks = [];  // Array zur Speicherung der Aufgaben
        const baseUrl = 'https://idefix.informatik.htw-dresden.de:8888/api/quizzes/';
        const username = 's85468@htw-dresden.de';
        const password = '9X#0SkuE!x';
        const headers = new Headers();
        headers.set('Authorization', 'Basic ' + btoa(username + ':' + password));  // Hinzufügen der Authentifizierungs-Header

        // Schleife zum Abrufen mehrerer Aufgaben
        for (let i = 0; i < numQuestions; i++) {
            const questionId = startId + i;  // Berechnen der aktuellen Aufgaben-ID
            try {
                const response = await fetch(`${baseUrl}${questionId}`, { headers });
                if (!response.ok) {
                    throw new Error(`HTTP-Fehler! Status: ${response.status}`);
                }
                const data = await response.json();
                tasks.push(data);  // Hinzufügen der Aufgabe zum Array
            } catch (error) {
                console.error(`Fehler beim Abrufen der Note-Aufgabe mit ID ${questionId}:`, error);
            }
        }

        return tasks;  // Rückgabe der abgerufenen Aufgaben
    }

    // Funktion zum Starten des Lernens einer ausgewählten Kategorie
    async function startLearning(category) {
        currentCategory = category;  // Setzen der aktuellen Kategorie
        let url, key;

        // Auswahl der richtigen URL und des Schlüssels basierend auf der Kategorie
        switch (category) {
            case 'math':
                url = 'teil-mathe.json';
                key = 'teil-mathe';
                break;
            case 'internet':
                url = 'teil-internettechnologien.json';
                key = 'teil-internettechnologien';
                break;
            case 'general':
                url = 'teil-allgemein.json';
                key = 'teil-allgemein';
                break;
            case 'notes':
                remainingTasks = await fetchNoteTasks(1649, 17);  // Abrufen von Notenaufgaben
                break;
            default:
                throw new Error('Unbekannte Kategorie');
        }

        if (category !== 'notes') {
            remainingTasks = await fetchTasks(url, key);  // Abrufen der Aufgaben von der URL
        }

        if (!Array.isArray(remainingTasks)) {
            console.error('Ungültiges Aufgabenformat für Kategorie', category);
            return;
        }

        if (remainingTasks.length === 0) {
            console.error('Keine Aufgaben verfügbar für diese Kategorie');
            return;
        }
        
        totalTasks = remainingTasks.length;  // Setzen der Gesamtanzahl der Aufgaben
        correctAnswers = 0;  // Zurücksetzen der Zähler
        wrongAnswers = 0;

        // Anpassen der Sichtbarkeit der Container
        document.getElementById('aufgaben-auswahl').style.display = 'none';
        document.getElementById('aufgaben-container').style.display = 'block';
        displayNextTask();  // Anzeige der nächsten Aufgabe
    }

    // Funktion zum Anzeigen der nächsten Aufgabe
    function displayNextTask() {
        if (remainingTasks.length === 0) {
            displayCompletionMessage();  // Anzeige der Abschlussmeldung, wenn keine Aufgaben mehr übrig sind
            return;
        }

        const nextTask = remainingTasks.shift();  // Holen der nächsten Aufgabe aus dem Array
        updateProgressBar();  // Aktualisieren der Fortschrittsleiste
        displayTask(nextTask);  // Anzeige der Aufgabe
    }

    // Funktion zum Anzeigen einer Aufgabe/Frage
    function displayTask(task) {
        const taskContainer = document.getElementById('aufgaben-container');
        const questionElement = document.getElementById('aufgaben-frage');
        const answersElement = document.getElementById('antworten');
    
        questionElement.innerHTML = '';  // Leeren des Frageelements
        answersElement.innerHTML = '';  // Leeren des Antwortenelements
    
        if (currentCategory === 'notes') {
            displayNoteWithVexflow(task.text, questionElement);  // Anzeige der Notenaufgabe mit Vexflow
        } else {
            questionElement.innerHTML = task.text;  // Anzeige der Frage
        }
    
        // Erstellen der Antwortoptionen und zufälliges Mischen
        const answers = task.options.map((option, index) => ({ option, isCorrect: index === 0 }));
        const shuffledAnswers = answers.sort(() => Math.random() - 0.5);
    
        shuffledAnswers.forEach(answerObj => {
            const answerButton = document.createElement('button');  // Erstellen eines Antwortbuttons
            answerButton.innerHTML = answerObj.option;
            answerButton.onclick = () => {
                checkAnswer(answerButton, answerObj.isCorrect);  // Überprüfung der Antwort beim Klicken
            };
            answersElement.appendChild(answerButton);  // Hinzufügen des Buttons zum Antwortenelement
        });
    
        if (currentCategory === 'math') {
            renderMathInElement(taskContainer, {  // Rendern der Mathematikaufgabe mit MathJax
                delimiters: [
                    { left: "$$", right: "$$", display: true },
                    { left: "$", right: "$", display: false }
                ]
            });
        }
    }

    // Funktion zur Umwandlung einer deutschen Notenbezeichnung in VexFlow-Notation
    function convertNoteToVexFlow(note) {
        const germanToVexFlow = {
            H: "B",  // Umwandlung von H nach B
        };
        const noteLetter = note.charAt(0);  // Extrahieren des Notenbuchstabens
        const octave = note.slice(1);  // Extrahieren der Oktave
        const vexflowLetter = germanToVexFlow[noteLetter] || noteLetter;  // Umwandlung der deutschen Notation
        return vexflowLetter + "/" + octave;  // Rückgabe der VexFlow-Notation
    }
    
    // Funktion zur Anzeige einer musikalischen Note mit VexFlow
    function displayNoteWithVexflow(note, element) {
        const { Renderer, Stave, StaveNote, Formatter } = Vex.Flow;
    
        element.innerHTML = '';  // Leeren des Elements
    
        const renderer = new Renderer(element, Renderer.Backends.SVG);
        renderer.resize(500, 200);  // Einstellen der Größe des Renderers
        const context = renderer.getContext();
        context.setFont('Arial', 10);  // Einstellen der Schriftart
    
        const stave = new Stave(10, 40, 400);
        stave.addClef('treble').addTimeSignature('4/4');
        stave.setContext(context).draw();  // Zeichnen des Notensystems
    
        try {
            if (!note || typeof note !== 'string' || note.length === 0) {
                throw new Error('Keine Noten angegeben');
            }
    
            const vexflowNote = convertNoteToVexFlow(note);  // Umwandeln der Note in VexFlow-Notation
            const noteRegex = /^[A-G][b#]?\/[0-9]$/;
            if (!noteRegex.test(vexflowNote)) {
                throw new Error(`Ungültiges Notenformat: ${vexflowNote}`);
            }
    
            const staveNote = new StaveNote({ keys: [vexflowNote], duration: 'q' });
            Formatter.FormatAndDraw(context, stave, [staveNote]);  // Zeichnen der Note auf das Notensystem
        } catch (error) {
            console.error('Fehler beim Anzeigen der Noten mit Vexflow:', error);
            const errorMessage = document.createElement('div');
            errorMessage.textContent = 'Fehler beim Anzeigen der Noten: ' + error.message;
            element.appendChild(errorMessage);  // Anzeige der Fehlermeldung
        }
    }
    
    // Funktion zur Überprüfung der Benutzerantwort
    function checkAnswer(button, isCorrect) {
        if (isCorrect) {
            button.style.backgroundColor = 'green';  // Ändern der Button-Farbe bei richtiger Antwort
            correctAnswers++;  // Erhöhen des Zählers für richtige Antworten
            setTimeout(displayNextTask, 1500);  // Warten und dann die nächste Aufgabe anzeigen
        } else {
            button.style.backgroundColor = 'red';  // Ändern der Button-Farbe bei falscher Antwort
            wrongAnswers++;  // Erhöhen des Zählers für falsche Antworten
            setTimeout(() => {
                button.style.backgroundColor = '';
                button.style.color = 'grey';
                button.disabled = true;  // Deaktivieren des Buttons
            }, 1500);
        }
    }

    // Funktion zur Aktualisierung der Fortschrittsleiste
    function updateProgressBar() {
        const progressBar = document.getElementById('fortschritt-bar');
        const progress = (totalTasks - remainingTasks.length) / totalTasks * 100;
        progressBar.style.width = `${progress}%`;  // Aktualisieren der Breite der Fortschrittsleiste
        progressBar.textContent = `${Math.round(progress)}%`;  // Aktualisieren des Texts in der Fortschrittsleiste
    }

    // Funktion zur Anzeige der Abschlussmeldung
    function displayCompletionMessage() {
        const popupContainer = document.getElementById('popup-container');
        popupContainer.innerHTML = `
            <div class="popup-content">
                <h2>Abschluss</h2>
                <p>Richtige Antworten: ${correctAnswers}</p>
                <p>Falsche Antworten: ${wrongAnswers}</p>
                <button id="close-popup-btn">Schließen</button>
            </div>
        `;
        popupContainer.style.display = 'flex';  // Anzeigen des Popup-Fensters

        document.getElementById('close-popup-btn').addEventListener('click', function() {
            document.getElementById('popup-container').style.display = 'none';
            startPage();  // Zurück zur Startseite
        });
    }

    // Event-Listener für den Home-Button
    document.getElementById('home-btn').addEventListener('click', startPage);

    // Funktion zur Anzeige der Startseite
    function startPage() {
        document.getElementById('aufgaben-auswahl').style.display = 'block';  // Anzeigen des Aufgaben-Auswahl-Containers
        document.getElementById('aufgaben-container').style.display = 'none';  // Verbergen des Aufgaben-Containers
        currentCategory = '';  // Zurücksetzen der aktuellen Kategorie
    }

    // Expose the startLearning function to the global scope
    window.startLearning = startLearning;  // Exponieren der Funktion startLearning im globalen Scope
});
