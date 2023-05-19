// * Change active tabs
function changeActiveTab(tabID) {
  const tab_list = ["tab-target", "tab-source-target"];
  console.log("Change tab:", tabID);
  if (tabID == tab_list[0]) {
    document.getElementById(tab_list[0]).classList.add("tab-active");
    document.getElementById(tab_list[1]).classList.remove("tab-active");
    document.getElementById("source-folder-container").classList.add("hidden");
    document.getElementById("checkbox-delete-copy-container").classList.remove("hidden");
    document.getElementById("checkbox-delete-newer-container").classList.remove("hidden");
  } else if (tabID == tab_list[1]) {
    document.getElementById(tab_list[1]).classList.add("tab-active");
    document.getElementById(tab_list[0]).classList.remove("tab-active");
    document.getElementById("source-folder-container").classList.remove("hidden");
    document.getElementById("checkbox-delete-copy-container").classList.add("hidden");
    document.getElementById("checkbox-delete-newer-container").classList.add("hidden");
  }

  clearSelectedFolder();
  clearResults();
  clearLogs();
  closePopup();
}

// * Select folder
// Target
function selectFolder(type) {
  eel.select_folder(type);
}
eel.expose(showSelectedFolder);
function showSelectedFolder(type, folderPath) {
  if (type === "target") {
    document.getElementById("target-folder").innerHTML = folderPath;
  } else if (type === "source") {
    document.getElementById("source-folder").innerHTML = folderPath;
  } else if (type === "move") {
    document.getElementById("move-folder").innerHTML = folderPath;
  }
}
function clearSelectedFolder(folderPath) {
  document.getElementById("target-folder").innerHTML = "";
  document.getElementById("source-folder").innerHTML = "";
}
// * Select Type
function changeActionDelete(type) {
  console.log("ChangeActionDelete", type);
  if (type == "delete") {
    document.getElementById("select-move-folder-button").classList.add("disabled");
  } else if (type === "move") {
    document.getElementById("select-move-folder-button").classList.remove("disabled");
  }
}
// * Run
function run() {
  running();
  const targetFolder = document.getElementById("target-folder").innerHTML;
  const sourceFolder = document.getElementById("source-folder").innerHTML;
  eel.run(sourceFolder, targetFolder);
}
function running() {
  document.getElementById("run-button").style.display = "none";
  document.getElementById("stop-button").style.display = "block";
  document.getElementById("auto-delete-button").style.opacity = "0";
  document.getElementById("delete-selected-button").style.opacity = "0";
  disableDeleteContainer();
}
// * Done
eel.expose(done);
function done() {
  document.getElementById("run-button").style.display = "block";
  document.getElementById("stop-button").style.display = "none";
  document.getElementById("auto-delete-button").style.opacity = "1";
  document.getElementById("delete-selected-button").style.opacity = "1";
}
// * Stop
async function stop() {
  await eel.stop();
  done();
}
// * Show results
eel.expose(showResults);
function showResults(results) {
  console.log(results, results.length);
  disableDeleteContainer();
  if (results.length == 0) {
    return false;
  }
  enableDeleteContainer();

  var table = document.getElementById("results-table");
  var tableBody = document.getElementById("results-table-body");
  tableBody.innerHTML = "";
  // results.forEach((set) => {
  //   console.log("set", set);
  results.forEach((files, index) => {
    console.log("files", files);
    files.forEach((file) => {
      console.log("file", file);
      const row = document.createElement("tr");
      if (index % 2 == 0) {
        row.style.backgroundColor = "var(--gray)";
        row.style.borderLeft = "5px solid black";
      }
      for (var i = 0; i < 4; i++) {
        const cell = document.createElement("td");
        if (i === 0) {
          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.value = file.path;
          cell.appendChild(checkbox);
        } else if (i === 1) {
          cell.textContent = file.path;
          cell.style.width = "400px";
          cell.addEventListener("click", function () {
            eel.show_media_from_base64(file.path);
          });
        } else if (i === 2) {
          cell.textContent = file.size;
        } else if (i === 3) {
          cell.textContent = file.create;
        }
        row.appendChild(cell);
      }
      tableBody.appendChild(row);
    });
  });
  // });
  console.log("Created table");
}
eel.expose(showContent);
function showContent(media_html) {
  document.getElementById("popup").style.display = "block";
  document.getElementById("popup-container").innerHTML = media_html;
}
eel.expose(updateResults);
function updateResults(filesList) {
  enableDeleteContainer();
  var table = document.getElementById("results-table-body");
  var rows = table.rows;

  for (var i = 0; i < rows.length; i++) {
    var cells = rows[i].cells;
    var disabled = false;
    for (var j = 0; j < cells.length; j++) {
      var cellText = cells[j].innerText;
      if (filesList.includes(cellText)) {
        disabled = true;
        break;
      }
    }
    if (disabled) {
      rows[i].classList.add("disabled");
      for (var k = 0; k < cells.length; k++) {
        cells[k].classList.add("disabled-cell");
      }
    } else {
      rows[i].classList.remove("disabled");
      for (var k = 0; k < cells.length; k++) {
        cells[k].classList.remove("disabled-cell");
      }
    }
  }
}

function clearResults() {
  var table = document.getElementById("results-table");
  var tableBody = document.getElementById("results-table-body");
  tableBody.innerHTML = "";
}
// * Popup
function closePopup() {
  console.log("Close Popup");
  document.getElementById("popup").style.display = "none";
}

// * Delete
function disableDeleteContainer() {
  const element = document.getElementById("delete-option-container");
  if (!element.classList.contains("disabled")) {
    element.classList.add("disabled");
  }
}
function enableDeleteContainer() {
  const element = document.getElementById("delete-option-container");
  if (element.classList.contains("disabled")) {
    element.classList.remove("disabled");
  }
}
// * Auto delete
function deleteAuto() {
  var type = document.querySelector('input[name="radio-delete-type"]:checked').value;
  if (type == "move") {
    var moveFolder = document.getElementById("move-folder").innerHTML;
    if (moveFolder == "") {
      alert("Please choose Move folder or select Delete option");
      console.log(type, moveFolder, files);
      return false;
    }
  }
  const data = {
    type: type,
    folder: moveFolder,
    "delete-copy": document.getElementById("checkbox-delete-copy").checked,
    "delete-newer": document.getElementById("checkbox-delete-newer").checked,
  };
  eel.delete_auto(data);
}
// * Delete selected
function deleteSelected() {
  const files = [];
  const checkboxes = document.querySelectorAll('table input[type="checkbox"]');

  checkboxes.forEach((checkbox) => {
    if (checkbox.checked) {
      files.push(checkbox.value);
    }
  });

  var type = document.querySelector('input[name="radio-delete-type"]:checked').value;
  if (type == "move") {
    var moveFolder = document.getElementById("move-folder").innerHTML;
    if (moveFolder == "") {
      alert("Please choose Move folder or select Delete option");
      console.log(type, moveFolder, files);
      return false;
    } else {
      if (files.length == 0) {
        alert("Please select files to delete");
        console.log(type, moveFolder, files);
        return false;
      }
    }
  }
  console.log(type, moveFolder, files);
  eel.delete_selected({ type: type, folder: moveFolder, files: files });
  running();
}
// * Logs
eel.expose(showLogs);
function showLogs(message) {
  var logElement = document.getElementById("logs-container");
  let currentTime = new Date();
  logElement.innerHTML += getTime() + " " + message + "<br>";
  logElement.scrollTop = logElement.scrollHeight;
}
function clearLogs(message) {
  var logElement = document.getElementById("logs-container");
  logElement.innerHTML = "";
}

// * Progress
eel.expose(updateProgress);
function updateProgress(value) {
  document.getElementById("progress-bar").value = value;
  document.getElementById("progress-text").innerHTML = value.toString() + "%";
  if (parseInt(value) > 50) {
    document.getElementById("progress-text").style.color = "white";
  } else {
    document.getElementById("progress-text").style.color = "black";
  }
}

// * Helpers
function getTime() {
  let currentTime = new Date();

  let month = currentTime.getMonth() + 1;
  let day = currentTime.getDate();
  let year = currentTime.getFullYear();
  let hours = currentTime.getHours();
  let minutes = currentTime.getMinutes();
  let seconds = currentTime.getSeconds();

  // Add leading zeros to single-digit numbers
  month = (month < 10 ? "0" : "") + month;
  day = (day < 10 ? "0" : "") + day;
  hours = (hours < 10 ? "0" : "") + hours;
  minutes = (minutes < 10 ? "0" : "") + minutes;
  seconds = (seconds < 10 ? "0" : "") + seconds;

  let formattedTime = month + "/" + day + "/" + year + " " + hours + ":" + minutes + ":" + seconds;
  return formattedTime;
}

/*
const testFolderSelectText = "SmithSmithSmithSmithSmithSmithSmithSmithSmithSmithSmithSmithSmithSmithSmithSmithSmithSmith";
const duplicate_set_list = [
  [
    [
      {
        path: "file_path1",
        size: "90kb",
        create: "5/5/2023",
      },
      {
        path: "file_path2",
        size: "90kb",
        create: "5/5/2023",
      },
    ],
    [
      {
        path: "file_path3",
        size: "90kb",
        create: "5/5/2023",
      },
      {
        path: "file_path4",
        size: "90kb",
        create: "5/5/2023",
      },
      {
        path: "file_path5",
        size: "90kb",
        create: "5/5/2023",
      },
    ],
    [
      {
        path: "file_path6",
        size: "90kb",
        create: "5/5/2023",
      },
      {
        path: "file_path7",
        size: "90kb",
        create: "5/5/2023",
      },
    ],
    [
      {
        path: "file_path1",
        size: "90kb",
        create: "5/5/2023",
      },
      {
        path: "file_path2",
        size: "90kb",
        create: "5/5/2023",
      },
    ],
    [
      {
        path: "file_path3",
        size: "90kb",
        create: "5/5/2023",
      },
      {
        path: "file_path4",
        size: "90kb",
        create: "5/5/2023",
      },
      {
        path: "file_path5",
        size: "90kb",
        create: "5/5/2023",
      },
    ],
    [
      {
        path: "file_path6",
        size: "90kb",
        create: "5/5/2023",
      },
      {
        path: "file_path7",
        size: "90kb",
        create: "5/5/2023",
      },
    ],
  ],
];
const testLog = "SmithSmithSmithSmithSmithSmithSmithSmithSmithSmithSmithSmithSmithSmithSmithSmithSmithSmith";
function test() {
  showSelectedFolder(testFolderSelectText);
  showResults(duplicate_set_list);
  showLog(testLog);
}
*/
