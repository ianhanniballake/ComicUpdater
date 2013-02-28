
// Saves options to localStorage.
function save_options() {
  var select = document.getElementById("matchAlgorithm");
  var matchAlgorithm = select.children[select.selectedIndex].value;
  localStorage.matchAlgorithm = matchAlgorithm;

  // Update status to let user know options were saved.
  var status = document.getElementById("status");
  status.innerHTML = "Options Saved.";
  setTimeout(function() {
    status.innerHTML = "";
  }, 750);
}

// Restores select box state to saved value from localStorage.
function restore_options() {
  var matchAlgorithm = localStorage.matchAlgorithm;
  if (!matchAlgorithm) {
    matchAlgorithm = "matchPredix";
  }
  var select = document.getElementById("matchAlgorithm");
  for (var i = 0; i < select.children.length; i++) {
    var child = select.children[i];
    if (child.value == matchAlgorithm){
      child.selected = "true";
      break;
    }
  }
}

document.addEventListener('DOMContentLoaded', restore_options);
document.querySelector('#save').addEventListener('click', save_options);
