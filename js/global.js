//Global Variables
var ref = new Firebase('https://dibbleapp.firebaseio.com/');
var currentUser = {};
var currentUserId;
var currentUserObj = {};
var currentAssignments = {};
var currentGroup;
var currentGroupName;
var assignmentsRef = ref.child('assignments');
var usersRef = ref.child('users');
var groupsRef = ref.child('groups');
$('#header').load("_header.html");
$('#header').on('click', '.logout', function(){
  ref.unauth();
  location.href = "index.html";
});

// USER AUTHENTICATION ------------------------------------------

$('.alreadyUser').on('click', function(){
  $('#userSignUp').hide();
  $('#firstname').hide();
  $('#lastname').hide()
  $('#userLogin').show();
  $(this).hide();
  $('.notUserYet').show();
});

$('.notUserYet').on('click', function(){
  $('#userSignUp').show();
  $('#firstname').show();
  $('#lastname').show()
  $('#userLogin').hide();
  $(this).hide();
  $('.alreadyUser').show();
});

//Sign Up With Email
$('#userSignUp').on('click', function(){
  var usersRef = ref.child('users');
  var firstname = $('#firstname').val();
  var lastname = $('#lastname').val();
  var email = $('#email').val();
  var password = $('#password').val();

  ref.createUser({
    email    : email,
    password : password
  }, function(error, userData) {
    if (error) {
      $('.loginError').show();
      $('.loginError').text(error);
    } else {
      console.log("Successfully created user account with uid:", userData.uid);
      ref.child("users").child(userData.uid).update({
        firstname: firstname,
        lastname: lastname,
        email: email,
      });
      ref.authWithPassword({
        "email"    : email,
        "password" : password
      }, function(error, authData) {
        console.log("Authenticated successfully with payload:", authData);
        location.href = "account.html";
      });
    }
  });

});

// Log In
$('#userLogin').on('click', function(){
  var email = $('#email').val();
  var password = $('#password').val();

  ref.authWithPassword({
    "email"    : email,
    "password" : password,
  }, function(error, authData) {
    if (error) {
      $('.loginError').show();
      $('.loginError').text(error);
    } else {
      console.log("Authenticated successfully with payload:", authData);
      location.href = "account.html";
    }
  });
});

// Log out
$('#header').on('click', '.logout', function(){
  ref.unauth();
});

// Create a callback which logs the current auth state
function authDataCallback(authData) {
  if (authData) {
    console.log("User " + authData.uid + " is logged in with " + authData.provider);
    currentUser = authData;
    currentUserId = authData.uid;
    // DISPLAY CURRENT USER'S DETAILS -------------------------------------
    var currentUserRef = usersRef.child(currentUserId);
    currentUserRef.on("value", function(snapshot) {
      currentUserObj = snapshot.val();
    });
  } else {
    console.log("User is logged out");
    currentUser = {};
    currentUserId = '';
    currentUserObj = {};
    currentGroup = '';
    currentGroupName = '';
  }
}
// Register the callback to be fired every time auth state changes
ref.onAuth(authDataCallback);

//Store User Data
var isNewUser = true;
ref.onAuth(function(authData) {
  if (authData && isNewUser) {
    // save the user's profile into the database so we can list users,
    // use them in Security and Firebase Rules, and show profiles
    ref.child("users").child(authData.uid).update({
      provider: authData.provider,
      name: getName(authData)
    });
  }
});


// find a suitable name based on the meta info given by each provider
function getName(authData) {
  switch(authData.provider) {
     case 'password':
       return authData.password.email.replace(/@.*/, '');
  }
};

// LOAD ACCOUNT INFO ------------------------------------------
var usersGroupsRef = usersRef.child(currentUser.uid).child('groups');
var groupsLoaded = false;

// initial load (one time only)
usersGroupsRef.once("value", function (snapshot) {
  snapshot.forEach(function(groupSnapshot){
    var groupKey = groupSnapshot.key();
    currentGroup = groupKey;
    console.log('group ' + groupKey + ' loaded initially');
    findGroupInfo(groupKey);
  });
  console.log('current group is ' + currentGroup + ' initially');
  findAssignmentInfo(currentGroup);
  displayGroupInfo(currentGroup);
  groupsLoaded = true;
});

// ongoing
function findGroups(){
  $('#groups').empty();
  usersGroupsRef.on("child_added", function (snapshot) {
    var groupKey = snapshot.key();
    findGroupInfo(groupKey);
    console.log('group ' + groupKey + 'loaded on child_added');
  });
};

function findAssignmentInfo(currentGroup){
  $('#assignments').empty();
  assignmentsRef.orderByChild("group").equalTo(currentGroup).on("child_added", function(snapshot) {
    console.log('fAI called??');
    var assignment = snapshot.val();
    var comments = assignment.comments;
    var files = assignment.files;
    // console.log(assignment, comments, files);
    displayAssignment(snapshot.key(), assignment.title, assignment.description, assignment.complete, comments, files);
  });
  if ($('#assignments').children('.assignment').length == 0){
    $('#noAssignments').show();
  } else {
    $('#noAssignments').hide();
  };
};

//use the Group Keys to find them in the Group Ref.
function findGroupInfo(groupKey) {
  groupsRef.child(groupKey).on("value", function(snapshot){
    var groupName = snapshot.val().name;
    displayGroup(snapshot.key(), groupName);
  });
};

//display groups in the Groups div (id, name, members)
function displayGroup(groupId, groupName){
  // var $editGroupButton = $('<button>').text('edit').addClass('editGroup');
  var $group = $('<div>').text(groupName).addClass('group').attr('id', groupId).attr('data-name', groupName);
  var $currentGroupIndicator = $('<img>').attr('src', 'assets/triangle-right-blue.png').addClass('currentGroupIndicator');
  if (groupId == currentGroup) {
    $group.addClass('currentGroup').append($currentGroupIndicator);
  };
  $('#groups').append($group);
  if ($('#groups').children('.group').length == 0){
    $('#noGroups').show();
  } else {
    $('#noGroups').hide();
  };
};

function displayAssignment (key, title, description, complete, comments, files) {
  console.log('DA called');
  var status;
  var statusOpposite;
  complete == true ? status = 'complete' : status = 'incomplete';
  complete == true ? statusOpposite = 'incomplete' : statusOpposite = 'complete';
  var $title = $('<h3>').text(title).addClass(status).addClass('assignmentTitle');
  var $description = $('<p>').text(description).addClass('assignmentDescription').addClass(status);
  var $info = $('<div>').addClass('assignmentInfo').append($title).append('<i class="fa fa-pencil-square-o editIcon"></i>').append($description);
  var $buttonComplete = $('<button>').text('MARK AS ' + statusOpposite).addClass('button' + statusOpposite);
  var $buttonDelete = $('<button>').text('DELETE ASSIGNMENT').addClass('buttondelete');

 //render files
  var $files = $('<div>').addClass('files').html('<h6>ATTACHMENTS</h6>');
  for (var key in files){
    var $filename = $('<p>').html('<a class="fileLink" target="_blank" href=' + files[key].filepath + '>' + files[key].filename + '<i class="fa fa-arrow-circle-o-down downloadIcon"></i></a><i class="fa fa-times-circle deleteIcon"></i>');
    var $file = $('<div>').addClass('file').attr('id', key).append($filename).attr('target', 'blank');
    $files.append($file);
  };
  var $fileFormInput = $('<input>').attr('type', 'file').attr('id', 'fileFormInput');
  var $fileForm = $('<div>').addClass('fileForm').append($fileFormInput);
  $files = $files.append($fileForm);

  //render comments
  var $comments = $('<div>').addClass('comments').html('<h6>COMMENTS & FEEDBACK</h6>');
  for (var key in comments){
    var $comment = $('<p>').addClass('comment').attr('id', key).html(comments[key].comment + '&nbsp&nbsp&nbsp<i class="fa fa-times-circle deleteIcon"></i><br><span class="commentauthor">added by ' + comments[key].commentAuthor + '</span>');
    $comments.append($comment);
  };
  var $commentFormInput = $('<input>').attr('type', 'text').attr('placeholder','Say something...').attr('id', 'commentFormInput');
  var $commentFormSubmit = $('<button>').text('ADD').attr('id', 'commentFormSubmit');
  var $commentForm = $('<div>').addClass('commentForm').append($commentFormInput).append($commentFormSubmit);
  $comments = $comments.append($commentForm);

  //put it all together now!
  var $assignment = $('<div>').addClass('assignment').attr('id', key).addClass(status).append($info).append($files).append($comments).append($buttonComplete).append($buttonDelete);
  $('#assignments').append($assignment);

  if ($('#assignments').children('.assignment').length == 0){
    $('#noAssignments').show();
  } else {
    $('#noAssignments').hide();
  };
};

function displayGroupInfo(currentGroup) {
  //clear Group Info Box
  $('.groupMembers').children('p').remove();
  //for each Group Member Key
  groupsRef.child(currentGroup).child('members').on('child_added', function(snapshot){
    console.log(snapshot.key() + ' is a member of ' + currentGroup);
    var member = snapshot.key();
    usersRef.child(member).on('value', function(userSnapshot){
      $('.groupMembers').append('<p><strong>' + userSnapshot.val().firstname + ' ' + userSnapshot.val().lastname + '</strong> | <a href="mailto:' + userSnapshot.val().email + '">email</a> | <a>skype</a><br>send/request payment (coming soon)<br>&nbsp</p>');
    });
  });
};

// ON USER EVENTS, UPDATE ACCOUNT INFO -------------------------------

$('#groups').on("click", ".group", function(){
  $('.currentGroupIndicator').remove();
  $('.group').removeClass('currentGroup');
  var $currentGroupIndicator = $('<img>').attr('src', 'assets/triangle-right-blue.png').addClass('currentGroupIndicator');
  $(this).append($currentGroupIndicator);
  $(this).addClass('currentGroup');
  currentGroup = $(this).attr('id');
  currentGroupName = $(this).attr('data-name');
  console.log(currentGroup + ' is now the current group at ' + currentGroupName);
  $('.groupTitle').html(currentGroupName);
  $('.menu').hide();
  displayGroupInfo(currentGroup);
  findAssignmentInfo(currentGroup);
});

$('.addGroup').on('click', function(){
  $('#groupForm').toggle();
});

$('#groupFormSubmit').on('click', function(){
  var user = currentUser.uid;
  var newGroupName = $('#groupTitleInput').val();
  var newGroupPartner = $('#groupPartnerInput').val();
  var newGroupPartnerId;
  // create Group
  var newGroupRef = groupsRef.push({
    name: newGroupName,
  });
  var newGroupId = newGroupRef.key();
  usersRef.orderByChild("email").equalTo(newGroupPartner).on('value', function(snapshot) {
    snapshot.forEach(function(userSnapshot) {
      newGroupPartnerId = userSnapshot.key();
      groupsRef.child(newGroupId).child('members').child(newGroupPartnerId).set(true);
      usersRef.child(newGroupPartnerId).child('groups').child(newGroupId).set(true);
    });
  });
  // add currentUser + Invitee to Group Members
  groupsRef.child(newGroupId).child('members').child(user).set(true);
  //add Group to Member's Info
  usersRef.child(user).child('groups').child(newGroupId).set(true);
  $('#groupTitleInput').val('');
  $('#groupPartnerInput').val('');
  $('#groupForm').hide();
  findGroups();
});


// DISPLAY CURRENT GROUP'S ASSIGNMENTS -------------------------------------





//expand assignment
$('#assignments').on('click', '.assignmentInfo', function(){
  if ($(this).hasClass('forceShow') == true) {
  } else {
    $(this).parent().children('.comments').toggle();
    $(this).parent().children('.files').toggle();
    $(this).parent().children('button').toggle();
  };
});

// mark assignment as complete
$('#assignments').on('click', '.buttoncomplete', function(){
  var assignmentKey = $(this).parent('.assignment').attr('id');
  assignmentsRef.child(assignmentKey).update({
    complete : true
  });
  loadAssignments();
});

$('#assignments').on('click', '.buttonincomplete', function(){
  var assignmentKey = $(this).parent('.assignment').attr('id');
  assignmentsRef.child(assignmentKey).update({
    complete : false
  });
  loadAssignments();
});

// delete assignment
$('#assignments').on('click', '.buttondelete', function(){
  var assignmentKey = $(this).parent('.assignment').attr('id');
  assignmentsRef.child(assignmentKey).remove();
  loadAssignments();
});

// add assignment
$('.addAssignment').on('click', function(){
  $('#assignmentForm').toggle();
});

$('#home').on('click', '#assignmentFormSubmit', function(){
  var assignmentTitle;
  var assignmentDescription = $(this).siblings('#assignmentDescriptionInput').val();
  if ($(this).siblings('#assignmentTitleInput').val() == '') {
    assignmentTitle = 'Untitled';
  } else {
    assignmentTitle = $(this).siblings('#assignmentTitleInput').val();
  };
  if ($(this).hasClass('editing') == true) {
    var assignmentKey = $(this).parent().parent('.assignment').attr('id');
    assignmentsRef.child(assignmentKey).update({
      title: assignmentTitle,
      description: assignmentDescription,
    });
  } else if ($(this).hasClass('new') == true) {
    assignmentsRef.push({
      title: assignmentTitle,
      description: assignmentDescription,
      group: currentGroup,
      complete: false
    });
  };
  $('#assignmentTitleInput').val('');
  $('#assignmentDescriptionInput').val('');
  $('#assignmentForm').hide();
  loadAssignments();
});

// edit assignment
$('#assignments').on('click', '.editIcon', function(){
  console.log('clicked');
  $(this).parent().addClass('forceShow');
  $(this).parent().parent('.assignment').show();
  var currentAssignmentTitle = $(this).siblings('.assignmentTitle').text();
  var currentAssignmentDescription = $(this).siblings('.assignmentDescription').text();
  $(this).siblings('.assignmentTitle').replaceWith('<input type="text" id="assignmentTitleInput" value="' + currentAssignmentTitle + '">');
  $(this).siblings('.assignmentDescription').replaceWith('<textarea type="text" id="assignmentDescriptionInput">' + currentAssignmentDescription + '</textarea>');
  $(this).parent('.assignmentInfo').append('<button id="assignmentFormSubmit" class="editing">UPDATE</button>');
});

// add comment
$('#assignments').on('click', '#commentFormSubmit', function(){
  var assignmentKey = $(this).parent().parent().parent('.assignment').attr('id');
  var commentsRef = assignmentsRef.child(assignmentKey).child('comments');
  commentsRef.push({
    comment: $(this).siblings('#commentFormInput').val(),
    commentAuthor: currentUserObj.firstname,
    commentAuthorId: currentUserId
  });
  $('#commentFormInput').val('');
  loadAssignments();
});

// delete comment
$('#assignments').on('click', '.comments .deleteIcon', function(){
  var assignmentKey = $(this).parent().parent().parent('.assignment').attr('id');
  var commentKey = $(this).parent('.comment').attr('id');
  assignmentsRef.child(assignmentKey).child('comments').child(commentKey).remove();
  loadAssignments();
});

// add file
$('#assignments').on('change', '#fileFormInput', function(){
  var assignmentKey = $(this).parent().parent().parent('.assignment').attr('id');
  var filesRef = assignmentsRef.child(assignmentKey).child('files');
  var file = $(this)[0].files[0];
  var filename = $(this).val();
  filename = filename.replace('C:\\fakepath\\', '');
  var reader = new FileReader();

  reader.onloadend = function() {
    filesRef.push({
      filename: filename,
      filepath: reader.result,
    });
    loadAssignments();
  };

  reader.readAsDataURL(file);
});

// delete file
$('#assignments').on('click', '.files .deleteIcon', function(){
  var assignmentKey = $(this).parent().parent().parent().parent('.assignment').attr('id');
  var fileKey = $(this).parent().parent('.file').attr('id');
  assignmentsRef.child(assignmentKey).child('files').child(fileKey).remove();
  loadAssignments();
});






////////
