
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
    /*Fixme: this fallback to matchPrefix if nothing is configured is also
     * explicitly used in eventpage.js.
     * It would be better to encapsulate this behaviour in a class.
     * This way the behaviour is centralizing and redundancie is reduced.
     */
    matchAlgorithm = "matchPrefix";
  }
  var select = document.getElementById("matchAlgorithm");
  var found = false;
  for (var i = 0; i < select.children.length; i++) {
    var child = select.children[i];
    if (child.value == matchAlgorithm){
      found=true;
      child.selected = "true";
      break;
    }
  }
  if (found == false){
    //fixme: this error is silent to users! :-s
    console.error('the configured matching algorithm "%s" is not in the list',matchAlgorithm);
  }
}

document.addEventListener('DOMContentLoaded', restore_options);
document.querySelector('#save').addEventListener('click', save_options);
