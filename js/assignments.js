
$(document).ready(function() {
  var myAssignments = new Firebase('https://dibbleapp.firebaseio.com/assignments/');

  $('#assignments').on('change', 'div.assignment', function(e) {
    var assignmentId = $(this).attr('id');
    var assignmentRef = myAssignments.child(assignmentId);
    var assignmentFile = $('#fileUpload')[0].files[0];

    var reader = new FileReader();
    // fr.onload = receivedText;
    //fr.readAsText(file);
    console.log(reader.readAsDataURL(assignmentFile));

    assignmentRef.update({
      "file": assignmentFile
    });

    // myAssignments.push({
    //   title: entryTitle,
    //   file: entryFile,
    //   notes: entryNotes
    // });

  });

  myAssignments.on("child_added", function (snapshot) {
    var firebaseValue = snapshot.val();
    displayAssignment(firebaseValue.title, firebaseValue.teacher, firebaseValue.description, snapshot.key());
  });

  function displayAssignment(title, teacher, description, id) {
    var dateObj = new Date();
    var month = dateObj.getUTCMonth() + 1; //months from 1-12
    var day = dateObj.getUTCDate();
    var year = dateObj.getUTCFullYear();
    newdate = year + "/" + month + "/" + day;
    var $title = $('<h3>').text(title).addClass('title');
    var $teacher = $('<h4>').text('assigned by ' + teacher).addClass('teacher');
    var $date = $('<p>').text(newdate).addClass('date');
    var $description = $('<p>').text(description).addClass('notes');
    var $file = $('<input>').attr('type', 'file').attr('id', 'fileUpload').attr('enctype', "multipart/form-data").addClass('file');
    var $assignment = $('<div>').addClass('assignment').attr('id', id).append($title).append($teacher).append($date).append($description).append($file).append('<br><br>');

    $('#assignments').append($assignment);
    $('#assignments')[0].scrollTop = $('#assignments')[0].scrollHeight;
  };



});
