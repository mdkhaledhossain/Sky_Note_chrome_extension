// welcome message display
document.addEventListener("DOMContentLoaded", function() {
  setTimeout(function() {
    document.getElementById("intro").style.display = "none";
    document.body.style.overflow = "auto"; // Restore overflow
  }, 1500); // 1.5 second delay
});

// Function to update popup with captured information
function updatePopup(info) {
  document.getElementById('titleInput').value = info.title;
  document.getElementById('urlInput').value = info.url;
}

// Function to send message to content script to capture page info
function requestPageInfo() {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'getCapturedPageInfo' }, function(response) {
      updatePopup(response);
    });
  });
}

// Send message to content script requesting captured information
requestPageInfo();

// Listen for changes in the title input field
document.getElementById('titleInput').addEventListener('input', function() {
  chrome.runtime.sendMessage({ action: 'updateTitle', title: this.value });
});

// Listen for changes in the URL input field
document.getElementById('urlInput').addEventListener('input', function() {
  chrome.runtime.sendMessage({ action: 'updateURL', url: this.value });
});

// Function to save note to local storage
function saveNote() {
  // Get values from input fields and textarea
  var title = document.getElementById('titleInput').value;
  var url = document.getElementById('urlInput').value;
  var body = document.querySelector('.notes__body').value;

  // Check if the title is blank
  if (title.trim() === '') {
    alert('Please give a Note Title.');
    return; // Exit the function if the title is blank
  }

  // Create a unique key for the note based on timestamp
  var timestamp = new Date().getTime();
  var noteKey = 'note_' + timestamp;

  // Create an object to store the note details
  var note = {
    title: title,
    url: url,
    body: body,
    date: new Date().toDateString()
  };

  // Save the note object to local storage
  localStorage.setItem(noteKey, JSON.stringify(note));

  alert('Note added successfully!');
}

// Listen for click events on the "Add Note" button
document.querySelector('.save-button').addEventListener('click', function() {
  saveNote();
});

// Function to display notes from local storage 
function displayNotes() {
  var notesContainer = document.querySelector('.notes__list');

  // Clear existing notes
  notesContainer.innerHTML = '';

  // Iterate over all keys in local storage
  for (var i = 0; i < localStorage.length; i++) {
    var key = localStorage.key(i);

    // Check if key starts with 'note_' to identify notes
    if (key.startsWith('note_')) {
      // Parse note object from local storage
      var note = JSON.parse(localStorage.getItem(key));

      // Create HTML elements to display note
      var noteItem = document.createElement('div');
      noteItem.classList.add('notes__list-item', 'notes__list-item--selected');

      var titleDiv = document.createElement('div');
      titleDiv.classList.add('notes__small-title');
      titleDiv.textContent = note.title.substring(0, 14) + (note.title.length > 14 ? '...' : '');

      var bodyDiv = document.createElement('div');
      bodyDiv.classList.add('notes__small-body');
      bodyDiv.textContent = note.body.substring(0, 10) + (note.body.length > 16 ? '...' : '');

      var updatedDiv = document.createElement('div');
      updatedDiv.classList.add('notes__small-updated');
      updatedDiv.textContent = note.date;

      // Append elements to note item
      noteItem.appendChild(titleDiv);
      noteItem.appendChild(bodyDiv);
      noteItem.appendChild(updatedDiv);

      // Append note item to notes container
      notesContainer.appendChild(noteItem);

      // Add a line break after each note item
      notesContainer.appendChild(document.createElement('br'));
    }
  }

  // Add click event listener to each note item for full view
  var noteItems = document.querySelectorAll('.notes__list-item');
  noteItems.forEach(function(noteItem) {
    noteItem.addEventListener('click', function() {
      // Hide the notes preview section
      document.querySelector('.notes__preview').style.display = 'none';

      // Show the full view section
      var fullViewSection = document.querySelector('.notes__full-view');
      fullViewSection.style.display = 'block';

      // Get note details from the local storage based on the clicked note item's index
      // Get the note details from local storage based on the clicked note item's index
      var index = Array.from(noteItems).indexOf(this);
      var key = localStorage.key(index);

      if (key && key.startsWith('note_')) {
          var note = JSON.parse(localStorage.getItem(key));
          
          // Display full title and body in the full view section
          var fullViewTitle = fullViewSection.querySelector('.notes__full-view-title');
          var fullViewBody = fullViewSection.querySelector('.notes__full-view-body');
          var fullViewDate = fullViewSection.querySelector('.notes__full-view-date');
          var urlButton = fullViewSection.querySelector('.url-button');

          fullViewTitle.textContent = note.title;
          fullViewBody.textContent = note.body; // Display body exactly as saved
          fullViewDate.textContent = note.date;
          urlButton.setAttribute('data-url', note.url);
      }

    });
  });
  
  // Add click event listener to URL button
  document.querySelector('.url-button').addEventListener('click', function() {
    var url = this.getAttribute('data-url');
    if (url) {
      chrome.tabs.create({ url: url });
    }
  });

    // Function to handle deletion of a note
  function deleteNote() {
    var title = document.querySelector('.notes__full-view-title').textContent;
    // Loop through local storage to find the note with matching title
    for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (key.startsWith('note_')) {
            var note = JSON.parse(localStorage.getItem(key));
            if (note.title === title) {
                // Remove the note from local storage
                localStorage.removeItem(key);
                // Optionally, you can display a confirmation message to the user
                alert('Note deleted successfully!');
                // Hide the full view section
                document.querySelector('.notes__full-view').style.display = 'none';
                // Show the notes preview section
                document.querySelector('.notes__preview').style.display = 'block';
                // Update the notes list
                displayNotes();
                break;
            }
        }
    }
  }

  // Add click event listener to the delete button
  document.querySelector('.delete-button').addEventListener('click', function() {
    deleteNote();
  });


  // Function to handle download PDF button click
  function downloadPDF() {
  
  var {jsPDF} = window.jspdf;
  // Check if jsPDF is defined
  if (typeof jsPDF !== 'undefined') {
    // Get the full note details
    var title = document.querySelector('.notes__full-view-title').textContent;
    var body = document.querySelector('.notes__full-view-body').textContent;
    var url = document.querySelector('.url-button').getAttribute('data-url');
    var date = document.querySelector('.notes__full-view-date').textContent;

    // Create a new jsPDF instance
    var doc = new jsPDF();

    // Define function to add content to the PDF with proper pagination
  function addContent(title, body, url, date) {


    // Set boundary margins
    var margin = {
      top: 20,
      bottom: 20,
      left: 10,
      right: 10
    };

    // Calculate remaining space on the page
    var availableHeight = doc.internal.pageSize.height - margin.top - margin.bottom;
    var availableWidth = doc.internal.pageSize.width - margin.left - margin.right;

    // Set font and font size for the title
    doc.setFont('Times New Roman', 'bold');
    doc.setFontSize(16);

    // Calculate title text dimensions and height with text wrapping
    var titleTextLines = doc.splitTextToSize(title, availableWidth);
    var titleHeight = doc.getTextDimensions(titleTextLines).h;

    // Set font and font size for the body text
    doc.setFont('Times New Roman', 'normal');
    doc.setFontSize(12);

    // Calculate body text dimensions and height with text wrapping
    var bodyTextLines = doc.splitTextToSize(body, availableWidth);
    var bodyHeight = doc.getTextDimensions(bodyTextLines).h;

    // Calculate URL and date text height
    var infoText = 'URL: ' + url + '\nDate: ' + date;
    var infoTextLines = doc.splitTextToSize(infoText, availableWidth);
    var infoHeight = doc.getTextDimensions(infoTextLines).h;

    // Calculate total content height
    var totalHeight = titleHeight + bodyHeight + infoHeight + 30;


    // Draw bounding box
    doc.rect(margin.left, margin.top, availableWidth, totalHeight, 'S');


    // Set font and font size for the title !!!!! over write!!!!!
    doc.setFont('Times New Roman', 'bold');
    doc.setFontSize(15);
    // Add title
    var titleY = margin.top + 10;
    doc.text(titleTextLines, margin.left + 5, titleY);

    // Set font and font size for the body text !!!!! over write!!!!!
    doc.setFont('Times New Roman', 'normal');
    doc.setFontSize(11);
    // Add body text
    var bodyTextY = titleY + titleHeight + 5;
    doc.text(bodyTextLines, margin.left + 5, bodyTextY);

    // Set font and font size for the URL Date
    doc.setFont('Times New Roman', 'bold');
    doc.setFontSize(8);
    // Calculate URL and date position
    var infoY = bodyTextY + bodyHeight + 10;
    // Add URL and date
    doc.text(infoTextLines, margin.left + 5, infoY);
  }

  // Call the function to add content to the PDF
  addContent(title, body, url, date);

  var pdfFileName = prompt("Set the PDF file name: ");
  // Save the PDF
  doc.save(pdfFileName);

    } else {
      console.error('jsPDF library is not defined.');
    }
  }

  // Function to save PDF to Google Drive
  function savePDFToDrive(pdfBlob, fileName, userEmail) {
  // code will implement here later (Khaled)

  }

  // Listen for click event on the download PDF button
  document.querySelector('.download-pdf-button').addEventListener('click', function() {
    downloadPDF();
  });

  // Add click event listener to home/back/new_note button
  var add_new = document.querySelector('.add_new-button');
  add_new.addEventListener('click', function() {
    // Hide the full view section
    var fullViewSection = document.querySelector('.notes__full-view');
    fullViewSection.style.display = 'none';

    // Show the notes preview section
    document.querySelector('.notes__preview').style.display = 'block';
  });
}

// Call the function to display notes when the popup is opened
displayNotes();

// Function to filter and display notes based on search query
function filterNotes(query) {
  var notes = document.querySelectorAll('.notes__list-item');

  notes.forEach(function(note) {
    var title = note.querySelector('.notes__small-title').textContent.toLowerCase();

    if (title.startsWith(query)) {
      note.style.display = 'block';
    } else {
      note.style.display = 'none';
    }
  });
}

// Listen for input events in the search input field
document.getElementById('search_Input').addEventListener('input', function() {
  var query = this.value.trim().toLowerCase();
  filterNotes(query);
});