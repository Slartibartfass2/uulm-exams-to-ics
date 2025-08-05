let table = document.getElementById("tablelistSelect");
let rows = table.getElementsByTagName("tr");

function rowToExam(row) {
    let cells = row.getElementsByTagName("td");
    return {
        name: cells[0].innerText.trim(),
        first: {
            date: cells[5].innerText.trim(),
            time: cells[6].innerText.trim(),
            duration: cells[7].innerText.trim(),
            room: cells[8].innerText.trim(),
            aids: cells[9].innerText.trim(),
        },
        second: {
            date: cells[11].innerText.trim(),
            time: cells[12].innerText.trim(),
            duration: cells[13].innerText.trim(),
            room: cells[14].innerText.trim(),
            aids: cells[15].innerText.trim(),
        },
    };
}

let exams = [];
for (let i = 2; i < rows.length; i++) {
    try {
        exams.push(rowToExam(rows[i]));
    } catch (error) {
        console.error(`error in row ${i}: ${error}`);
    }
}

const dateStringToIsoDateString = date => date.split(".").reverse().join("-");
const dateToIcsDate = date => date.toISOString().replace(/[-:]/g, "").replace(/\.\d\d\d/, "");
const escapeIcsString = str => str.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/,/g, "\\,");

/**
 * @param {string} startDate
 * @param {string} startTime
 * @param {string} durationString
 * @returns {{start: Date, end: Date}}
 */
function getStartAndEndDates(startDate, startTime, durationString) {
    let startDatetime = new Date(dateStringToIsoDateString(startDate) + "T" + startTime);
    let duration = parseInt(durationString);
    if (Number.isNaN(duration) || duration == 0) {
        duration = 120;
    }
    let endDatetime = new Date(startDatetime.getTime() + duration * 60 * 1000);
    return {
        start: startDatetime,
        end: endDatetime,
    }
}

/**
 * @param {string} title
 * @param {Date} start 
 * @param {Date} end 
 * @param {string} location 
 * @param {string} notes 
 */
function createIcsEvent(title, start, end, location, notes) {
    let ics = "BEGIN:VEVENT\r\n";
    ics += "UID:" + Math.random().toString(36).substring(2) + "\r\n";
    ics += "DTSTAMP:" + dateToIcsDate(new Date()) + "\r\n";
    ics += "SUMMARY:" + escapeIcsString(title) + "\r\n";
    ics += "DTSTART:" + dateToIcsDate(start) + "\r\n";
    ics += "DTEND:" + dateToIcsDate(end) + "\r\n";
    ics += "LOCATION:" + escapeIcsString(location) + "\r\n";
    ics += "DESCRIPTION:" + escapeIcsString(notes) + "\r\n";
    ics += "END:VEVENT\r\n";
    return ics;
}

function examToIcs(exam) {
    let firstDates = getStartAndEndDates(exam.first.date, exam.first.time, exam.first.duration);
    let secondDates = getStartAndEndDates(exam.second.date, exam.second.time, exam.second.duration);
    let ics = createIcsEvent(
        exam.name,
        firstDates.start,
        firstDates.end,
        exam.first.room,
        exam.first.aids
    );
    ics += createIcsEvent(
        exam.name,
        secondDates.start,
        secondDates.end,
        exam.second.room,
        exam.second.aids
    );
    return ics;
}

// Convert to ics format
let ics = "BEGIN:VCALENDAR\r\n";
ics += "VERSION:2.0\r\n";
ics += "PRODID:https://vm03.informatik.uni-ulm.de/index.php\r\n";
for (let exam of exams) {
    ics += examToIcs(exam);
}
ics += "END:VCALENDAR\r\n";

// https://stackoverflow.com/a/33542499/9085480
function save(filename, data) {
    const blob = new Blob([data], {type: 'text/csv'});
    if (window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveBlob(blob, filename);
    } else {
        const elem = window.document.createElement('a');
        elem.href = window.URL.createObjectURL(blob);
        elem.download = filename;        
        document.body.appendChild(elem);
        elem.click();        
        document.body.removeChild(elem);
    }
}

// 1. Create the button element
const button = document.createElement('button');

// 2. Set its attributes
button.className = 'btn btn-outline-primary w-100 my-1';
button.type = 'button';
button.name = 'exportIcsBtn';
button.setAttribute('onclick', "save('exams.ics', ics)");

// 3. Set its inner text (or use innerHTML if needed)
button.textContent = 'ICS';

const pdfButton = document.getElementsByName("exportTableBtn")[0];
document.getElementById("exampleModalLabel").parentElement.parentElement.children[1].insertBefore(button, pdfButton);
